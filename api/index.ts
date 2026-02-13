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

// ────────────────────────────────────────────────
// Database
// ────────────────────────────────────────────────

// MongoDB connection - use environment variable for Vercel
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:secret@localhost:27017/todo-app?authSource=admin';

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;
  
  try {
    await mongoose.connect(MONGODB_URI);
    isConnected = true;
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection failed:', err);
  }
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
