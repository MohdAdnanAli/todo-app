import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { getCachedUser, setCachedUser, type CachedUserData } from '../utils/sessionCache';

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
  userData?: CachedUserData;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.cookies?.auth_token;

  // Only log on actual auth failures to reduce noise
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as unknown as { id: string };
    const userId = decoded.id;

    // Try to get user data from cache first for performance
    const cachedUser = await getCachedUser(userId);
    
    if (cachedUser) {
      req.user = { id: userId };
      req.userData = cachedUser;
      return next();
    }

    // Cache miss - need to get user from DB
    // This will be handled by the User model import below
    const { User } = await import('../models/User');
    
    const user = await User.findById(userId).select('_id email displayName role authProvider isGoogleUser googleId encryptionSalt bio avatar hasCompletedOnboarding createdAt updatedAt').lean();
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Cache the user data for future requests
    const userData: CachedUserData = {
      id: user._id.toString(),
      email: user.email,
      displayName: user.displayName || null,
      bio: user.bio || null,
      avatar: user.avatar || null,
      role: user.role || 'user',
      authProvider: user.authProvider,
      isGoogleUser: user.isGoogleUser || false,
      googleId: user.googleId || null,
      encryptionSalt: user.encryptionSalt || '',
      hasCompletedOnboarding: user.hasCompletedOnboarding || false,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
    
    await setCachedUser(userId, userData);

    req.user = { id: userId };
    req.userData = userData;
    next();
  } catch (err: unknown) {
    const error = err as Error;
    logger.info('[protect] Token verification failed:', error.name);
    return res.status(401).json({ error: 'Invalid token' });
  }
};
