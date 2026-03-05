// Load environment variables FIRST, before any other imports
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';

import { register, login, verifyEmail, requestPasswordReset, resetPassword, updateProfile, getProfile, deleteUser } from './controllers/auth';
import { getDashboardStats, getAllUsers, getUserDetails, updateUser, deleteUser as adminDeleteUser, getAllTodos, deleteTodo as adminDeleteTodo, deleteMultipleTodos, getSystemHealth } from './controllers/admin';
import { getGoogleAuthUrlHandler, googleCallback, googleError, linkGoogleAccount, unlinkGoogleAccount, getGoogleAuthStatus } from './controllers/googleAuth';
import { checkEmailAvailability } from './controllers/emailCheck';
import { protect } from './middleware/auth';
import { adminProtect } from './middleware/admin';
import { getTodos, createTodo, updateTodo, deleteTodo, reorderTodos } from './controllers/todo';
import { apiLimiter, loginLimiter, registerLimiter, passwordResetLimiter } from './middleware/rateLimiter';
import { User } from './models/User';
import mongoose from 'mongoose';
import { logger } from './utils/logger';
import { connectDB, gracefulShutdown, getDBState } from './utils/database';

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
// Database - Using new improved database utility
// ────────────────────────────────────────────────

// Lazy connection middleware - MUST be before routes
// This ensures database is connected before each request in serverless environments
app.use(async (req, res, next) => {
  try {
    const connected = await connectDB();
    if (!connected) {
      logger.error('Database connection failed in middleware');
      return res.status(503).json({ error: 'Database temporarily unavailable. Please try again.' });
    }
    next();
  } catch (err) {
    logger.error('Database connection error:', err);
    return res.status(500).json({ error: 'Database connection failed' });
  }
});

// Register shutdown handlers for graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ────────────────────────────────────────────────
// Routes
// ────────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({ status: 'ok', db: getDBState() });
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

// Email availability check
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
        googleId: user.googleId,
        googleProfile: user.googleProfile,
      },
      isAdmin,
      encryptionSalt: user.encryptionSalt,
      googleId: user.googleId // Also return at top level for convenience
    });
  } catch (err) {
    logger.error('/api/me error:', err);
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

// Error handler - MUST be after all routes and middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  // In production, don't expose stack traces
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
  if (isProduction) {
    logger.error('Unhandled error:', err?.message || 'Unknown error');
  } else {
    logger.error('Unhandled error:', err?.message || err);
  }
  return res.status(500).json({ error: 'Internal Server Error' });
});

// ────────────────────────────────────────────────
// Vercel Serverless Export
// ────────────────────────────────────────────────

const PORT = process.env.PORT || 5000;
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    logger.info(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
