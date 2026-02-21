import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

import { register, login, verifyEmail, requestPasswordReset, resetPassword, updateProfile, getProfile, deleteUser } from './controllers/auth';
import { protect } from './middleware/auth';
import { getTodos, createTodo, updateTodo, deleteTodo } from './controllers/todo';
import { apiLimiter, loginLimiter, registerLimiter, passwordResetLimiter } from './middleware/rateLimiter';
import { User } from './models/User';

dotenv.config();

const app = express();

// ────────────────────────────────────────────────
// Middleware – ORDER IS CRITICAL
// ────────────────────────────────────────────────

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://metb-todo.vercel.app',
    'https://*.vercel.app'
  ],
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

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:secret@localhost:27017/todo-app?authSource=admin';

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

// Protected routes
app.get('/api/todos', protect, getTodos);
app.post('/api/todos', protect, createTodo);
app.put('/api/todos/:id', protect, updateTodo);
app.delete('/api/todos/:id', protect, deleteTodo);

app.get('/api/me', protect, async (req: any, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -emailVerificationToken -passwordResetToken');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ 
      user: { 
        id: user._id, 
        email: user.email, 
        displayName: user.displayName,
        bio: user.bio,
        avatar: user.avatar 
      },
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
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',

    sameSite: 'lax',
  });


  res.status(200).json({ message: 'Logged out successfully' });
});

// Admin routes - get all profiles with todo counts
app.get('/api/admin/profiles', protect, async (req: any, res) => {
  try {
    // Get all users with their profile info (excluding sensitive data)
    const users = await User.find({}).select('-password -emailVerificationToken -passwordResetToken -encryptionSalt');
    
    // Get todo counts for each user
    const { Todo } = await import('./models/Todo');
    
    const profilesWithCounts = await Promise.all(
      users.map(async (user) => {
        const todoCount = await Todo.countDocuments({ user: user._id });
        return {
          id: user._id,
          email: user.email,
          displayName: user.displayName,
          bio: user.bio,
          avatar: user.avatar,
          todoCount,
          createdAt: user.createdAt,
        };
      })
    );
    
    res.json({
      totalUsers: profilesWithCounts.length,
      profiles: profilesWithCounts,
    });
  } catch (err) {
    console.error('/api/admin/profiles error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin route - get simple todo count summary
app.get('/api/admin/stats', protect, async (req: any, res) => {
  try {
    const { Todo } = await import('./models/Todo');
    
    const totalUsers = await User.countDocuments({});
    const totalTodos = await Todo.countDocuments({});
    const completedTodos = await Todo.countDocuments({ completed: true });
    const pendingTodos = totalTodos - completedTodos;
    
    res.json({
      totalUsers,
      totalTodos,
      completedTodos,
      pendingTodos,
    });
  } catch (err) {
    console.error('/api/admin/stats error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

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