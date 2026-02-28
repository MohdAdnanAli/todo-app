import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

import { register, login, verifyEmail, requestPasswordReset, resetPassword, updateProfile, getProfile, deleteUser } from './controllers/auth';
import { getDashboardStats, getAllUsers, getUserDetails, updateUser, deleteUser as adminDeleteUser, getAllTodos, deleteTodo as adminDeleteTodo, deleteMultipleTodos, getSystemHealth } from './controllers/admin';
import { getSupabaseGoogleAuthUrl, handleSupabaseCallback, getSupabaseAuthStatus, signOutSupabase, checkEmailAvailability } from './controllers/supabaseAuth';
import { getGoogleAuthUrlHandler, googleCallback, googleError, linkGoogleAccount, unlinkGoogleAccount, getGoogleAuthStatus } from './controllers/googleAuth';
import { protect } from './middleware/auth';
import { adminProtect } from './middleware/admin';
import { getTodos, createTodo, updateTodo, deleteTodo, reorderTodos } from './controllers/todo';
import { apiLimiter, loginLimiter, registerLimiter, passwordResetLimiter } from './middleware/rateLimiter';
import { User } from './models/User';

dotenv.config();

// Set trust proxy BEFORE creating express app
const app = express();
app.enable('trust proxy'); // Enable trust proxy at app level

// Get production URLs from environment
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const RENDER_URL = process.env.RENDER_URL;
const API_URL = process.env.API_URL;

// Build CORS origins array
const corsOrigins = [
  'http://localhost:5173',
  'https://metb-todo.vercel.app',
  'https://*.vercel.app',
  'https://todo-app-srbx.onrender.com',
  /\.onrender\.com$/,
];

// Add dynamic production URLs
if (FRONTEND_URL && FRONTEND_URL.startsWith('http')) {
  corsOrigins.push(FRONTEND_URL);
}
if (RENDER_URL && RENDER_URL.startsWith('http')) {
  corsOrigins.push(RENDER_URL);
}
if (API_URL && API_URL.startsWith('http')) {
  corsOrigins.push(API_URL);
}


// ────────────────────────────────────────────────
// Middleware – ORDER IS CRITICAL
// ────────────────────────────────────────────────

app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(cookieParser());
app.use(express.json());
app.use(apiLimiter); // Apply general rate limiter

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

// ────────────────────────────────────────────────
// Database
// ────────────────────────────────────────────────

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is required');
}

const connectWithRetry = async (retries = 5, delay = 5000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await mongoose.connect(process.env.MONGO_URI || MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4,
      });
      console.log('MongoDB connected');
      return;
    } catch (err: any) {
      console.error(`MongoDB connection attempt ${attempt}/${retries} failed:`, err?.message || err);
      if (attempt < retries) {
        console.log(`Retrying in ${delay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  console.error('MongoDB connection failed after all retries');
};

connectWithRetry();

let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;
  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    return;
  }
  await connectWithRetry(3, 3000);
  isConnected = true;
};

// ────────────────────────────────────────────────
// Routes
// ────────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({ status: 'ok', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// Serve frontend for email auth routes
app.get('/verify-email', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

app.get('/reset-password', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Auth routes with rate limiting
app.post('/api/auth/register', registerLimiter, register);
app.post('/api/auth/login', loginLimiter, login);
app.post('/api/auth/verify-email', verifyEmail);
app.post('/api/auth/request-password-reset', passwordResetLimiter, requestPasswordReset);
app.post('/api/auth/reset-password', resetPassword);

// Supabase Google OAuth (PARALLEL system)
app.get('/api/auth/supabase/google/url', getSupabaseGoogleAuthUrl);
app.get('/auth/callback', handleSupabaseCallback);
app.get('/api/auth/supabase/status', protect, getSupabaseAuthStatus);
app.post('/api/auth/supabase/signout', signOutSupabase);
app.get('/api/auth/check-email', checkEmailAvailability);

// Google OAuth routes
app.get('/api/auth/google/url', getGoogleAuthUrlHandler);
app.get('/api/auth/google/callback', googleCallback);
app.get('/api/auth/google/error', googleError);

// Protected Google OAuth routes
app.post('/api/auth/google/link', protect, linkGoogleAccount);
app.post('/api/auth/google/unlink', protect, unlinkGoogleAccount);
app.get('/api/auth/google/status', protect, getGoogleAuthStatus);

// Set auth token from URL (for Google OAuth callback with token in URL)
app.post('/api/auth/set-token', (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }
  
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
  res.cookie('auth_token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  
  res.json({ message: 'Token set successfully' });
});

// Protected routes
app.get('/api/todos', protect, getTodos);
app.post('/api/todos', protect, createTodo);
app.put('/api/todos/:id', protect, updateTodo);
app.delete('/api/todos/:id', protect, deleteTodo);
app.post('/api/todos/reorder', protect, reorderTodos);

app.get('/api/me', protect, async (req: any, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -emailVerificationToken -passwordResetToken');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if user is admin (by comparing with ADMIN_EMAIL from .env)
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
    const isAdmin = ADMIN_EMAIL ? user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() : false;
    
    res.json({ 
      user: { 
        id: user._id, 
        email: user.email, 
        displayName: user.displayName,
        bio: user.bio,
        avatar: user.avatar,
        role: user.role,
        authProvider: user.authProvider,
        isGoogleUser: user.isGoogleUser,
        googleProfile: user.googleProfile,
      },
      isAdmin,
      encryptionSalt: user.encryptionSalt 
    });
  } catch (err) {
    console.error('/api/me error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/profile', protect, getProfile);
app.put('/api/profile', protect, updateProfile);
app.delete('/api/profile', protect, deleteUser);

app.post('/api/auth/logout', (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
  });


  res.status(200).json({ message: 'Logged out successfully' });
});

// Admin routes - Full admin dashboard with adminProtect middleware
// ───────────────────────────────────────────────

// Dashboard stats
app.get('/api/admin/dashboard', adminProtect, getDashboardStats);

// User management
app.get('/api/admin/users', adminProtect, getAllUsers);
app.get('/api/admin/users/:userId', adminProtect, getUserDetails);
app.put('/api/admin/users/:userId', adminProtect, updateUser);
app.delete('/api/admin/users/:userId', adminProtect, adminDeleteUser);

// Todo management
app.get('/api/admin/todos', adminProtect, getAllTodos);
app.delete('/api/admin/todos/:todoId', adminProtect, adminDeleteTodo);
app.post('/api/admin/todos/delete-many', adminProtect, deleteMultipleTodos);

// System health
app.get('/api/admin/health', adminProtect, getSystemHealth);

// Legacy admin routes (deprecated - use new adminProtect routes above)

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Lazy connection middleware
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Database connection error:', err);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// ────────────────────────────────────────────────
// Vercel Serverless Export
// ────────────────────────────────────────────────

const PORT = process.env.PORT || 5000;
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;