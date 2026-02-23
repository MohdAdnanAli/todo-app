import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

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
    const decoded = jwt.verify(token, JWT_SECRET) as unknown as { id: string };
    req.user = { id: decoded.id };
    next();
  } catch (err: unknown) {
    const error = err as Error;
    console.log('[protect] Token verification failed:', error.name);
    return res.status(401).json({ error: 'Invalid token' });
  }
};
