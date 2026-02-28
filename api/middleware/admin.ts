import type { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { logger } from '../utils/logger';

/**
 * Admin middleware - checks if the current user is an admin
 * Admin credentials are configured via environment variables:
 * - ADMIN_EMAIL: The email address of the admin user
 * - ADMIN_SECRET: A secret key for additional verification (optional)
 * 
 * The middleware verifies that:
 * 1. A valid JWT token is present
 * 2. The user's email matches ADMIN_EMAIL from .env
 * 3. Optional: ADMIN_SECRET matches if provided
 */

interface AdminRequest extends Request {
  user?: { id: string; email: string };
}

// Get admin credentials from environment
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_SECRET = process.env.ADMIN_SECRET;

export const adminProtect = async (req: AdminRequest, res: Response, next: NextFunction) => {
  try {
    // Check if admin email is configured
    if (!ADMIN_EMAIL) {
      logger.error('[Admin] ADMIN_EMAIL not configured in environment');
      return res.status(503).json({ error: 'Admin system not configured' });
    }

    // Check if user is authenticated (require JWT)
    const token = req.cookies?.auth_token;
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Verify JWT and get user info
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET;
    
    if (!JWT_SECRET) {
      logger.error('[Admin] JWT_SECRET not configured');
      return res.status(503).json({ error: 'Server configuration error' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { id: string; email?: string };
    } catch (err) {
      logger.info('[Admin] Token verification failed');
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Fetch user from database to get email
    const user = await User.findById(decoded.id).select('email');
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Check if user email matches admin email
    if (user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      logger.info(`[Admin] Access denied for user: ${user.email}`);
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    // Optional: Check admin secret if configured
    if (ADMIN_SECRET) {
      const providedSecret = req.headers['x-admin-secret'] as string;
      if (providedSecret !== ADMIN_SECRET) {
        logger.info('[Admin] Invalid admin secret');
        return res.status(403).json({ error: 'Invalid admin credentials' });
      }
    }

    // Attach user info to request
    req.user = { id: user._id.toString(), email: user.email };
    
    logger.info(`[Admin] Access granted for: ${user.email}`);
    next();
  } catch (err) {
    logger.error('[Admin] Middleware error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Check if admin is configured
 */
export const isAdminConfigured = (): boolean => {
  return !!ADMIN_EMAIL;
};

/**
 * Get admin email (masked for logging)
 */
export const getAdminEmail = (): string => {
  if (!ADMIN_EMAIL) return 'Not configured';
  const parts = ADMIN_EMAIL.split('@');
  if (parts.length !== 2) return 'Invalid';
  return `${parts[0].substring(0, 2)}***@${parts[1]}`;
};

