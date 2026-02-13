import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

interface AuthRequest extends Request {
  user?: { id: string };
}

export const protect = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.cookies?.auth_token;

  console.log('[protect] Token received:', token ? token.substring(0, 20) + '...' : 'MISSING');

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    console.log('[protect] Decoded successfully – user ID:', decoded.id);
    req.user = { id: decoded.id };
    next();
  } catch (err: any) {
    console.log('[protect] Verification failed:', err.name, '-', err.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
};