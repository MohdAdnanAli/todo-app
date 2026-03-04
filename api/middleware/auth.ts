import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

// JWT_SECRET is now checked lazily inside functions that need it
// This allows dotenv to load first from index.ts
const getJwtSecret = () => {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return JWT_SECRET;
};

interface AuthRequest extends Request {
  user?: { id: string };
}

export const protect = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.cookies?.auth_token;

  // Only log on actual auth failures to reduce noise
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
const decoded = jwt.verify(token, getJwtSecret()) as unknown as { id: string };
    req.user = { id: decoded.id };
    next();
  } catch (err: unknown) {
    const error = err as Error;
    logger.info('[protect] Token verification failed:', error.name);
    return res.status(401).json({ error: 'Invalid token' });
  }
};
