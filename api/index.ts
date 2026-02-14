import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import { register, login } from './controllers/auth';
import { protect } from './middleware/auth';
import { getTodos, createTodo, updateTodo, deleteTodo } from './controllers/todo';

dotenv.config();

const app = express();

// ────────────────────────────────────────────────
// Middleware – ORDER IS CRITICAL
// ────────────────────────────────────────────────

app.use(cors({
  origin: process.env.FRONTEND_URL || true,  // Allow all in dev, specific URL in prod
  credentials: true,
}));

app.use(cookieParser());                 // ← MUST be here, before routes
app.use(express.json());

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); // Google DNS
// or ['1.1.1.1', '1.0.0.1'] for Cloudflare

// ────────────────────────────────────────────────
// Database
// ────────────────────────────────────────────────

// MongoDB connection - use environment variable for Vercel
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:secret@localhost:27017/todo-app?authSource=admin';

// Connect to database with retry logic for cold starts
const connectWithRetry = async (retries = 5, delay = 5000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await mongoose.connect(process.env.MONGO_URI || MONGODB_URI, {
        serverSelectionTimeoutMS: 5000, // fast fail if DB down
        socketTimeoutMS: 45000,
        family: 4, // prefer IPv4 (fixes some DNS issues)
      });
      console.log('MongoDB connected');
      return;
    } catch (err) {
      console.error(`MongoDB connection attempt ${attempt}/${retries} failed:`, err.message);
      if (attempt < retries) {
        console.log(`Retrying in ${delay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  console.error('MongoDB connection failed after all retries');
};

// Initial connection with retry
connectWithRetry();

// Lazy connection middleware for Vercel serverless
let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;
  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    return;
  }
  await connectWithRetry(3, 3000); // Fewer retries for request-level connections
  isConnected = true;
};

// ────────────────────────────────────────────────
// Routes
// ────────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({ status: 'ok', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

app.post('/api/auth/register', register);
app.post('/api/auth/login', login);

app.get('/api/todos', protect, getTodos);
app.post('/api/todos', protect, createTodo);
app.put('/api/todos/:id', protect, updateTodo);
app.delete('/api/todos/:id', protect, deleteTodo);

app.get('/api/me', protect, (req: any, res) => {
  res.json({ userId: req.user?.id });
});

// Logout route – clears the httpOnly cookie
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
  });

  res.status(200).json({ message: 'Logged out successfully' });
});

// Error handler last
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Connect to database lazily on first request (for Vercel serverless)
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

// For local development
const PORT = process.env.PORT || 5000;
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Export for Vercel serverless
export default app;
