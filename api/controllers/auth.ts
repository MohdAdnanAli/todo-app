import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/User';
import { RefreshToken } from '../models/RefreshToken';
import { registerSchema, loginSchema, passwordResetSchema, resetPasswordSchema, updateProfileSchema, verifyEmailSchema } from '../schemas/auth';
import { sanitizeInput, generateVerificationToken, generateResetToken, validatePasswordStrength } from '../utils/security';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email';
import { emailDripService } from '../services/emailDrip';
import { logger } from '../utils/logger';
import { getCachedUser, setCachedUser, invalidateUserCache, type CachedUserData } from '../utils/sessionCache';
import type { CookieOptions } from 'express';

// Fields to exclude from queries for performance
const EXCLUDE_FIELDS = '-password -emailVerificationToken -passwordResetToken -__v';

// JWT_SECRET is now checked lazily inside functions that need it
const getJwtSecret = () => {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return JWT_SECRET;
};

// Cookie names
const ACCESS_TOKEN_COOKIE = 'auth_token';
const REFRESH_TOKEN_COOKIE = 'refresh_token';
const ENCRYPTION_SALT_COOKIE = 'enc_salt';

// Token durations
const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes - short-lived for security
const REFRESH_TOKEN_EXPIRY_DAYS = 30;

// Rate limiting
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000; // 15 minutes
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Helper: Check if account is locked
const isAccountLocked = (user: any): boolean => {
  return user.accountLockedUntil && new Date(user.accountLockedUntil) > new Date();
};

// Helper: Increment failed attempts
const incrementFailedAttempts = async (userId: any, currentAttempts: number): Promise<void> => {
  const newAttempts = currentAttempts + 1;
  const shouldLock = newAttempts >= MAX_LOGIN_ATTEMPTS;
  
  await User.findByIdAndUpdate(userId, {
    $set: {
      failedLoginAttempts: newAttempts,
      ...(shouldLock && { accountLockedUntil: new Date(Date.now() + LOCK_TIME) }),
    },
  });
};

// Helper: Get cookie options based on environment
const getCookieOptions = (maxAge?: number): CookieOptions => {
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: (isProduction ? 'none' : 'lax') as CookieOptions['sameSite'],
    maxAge: maxAge,
  };
};

// Helper: Get clear cookie options
const getClearCookieOptions = (): CookieOptions => {
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: (isProduction ? 'none' : 'lax') as CookieOptions['sameSite'],
  };
};

// Helper: Generate access token
const generateAccessToken = (userId: string): string => {
  return jwt.sign({ id: userId }, getJwtSecret(), { expiresIn: ACCESS_TOKEN_EXPIRY });
};

// Helper: Build cached user data
const buildCachedUserData = (user: any): CachedUserData => ({
  id: user._id.toString(),
  email: user.email,
  displayName: user.displayName,
  bio: user.bio,
  avatar: user.avatar,
  role: user.role || 'user',
  authProvider: user.authProvider,
  isGoogleUser: user.isGoogleUser,
  googleId: user.googleId,
  encryptionSalt: user.encryptionSalt,
  hasCompletedOnboarding: user.hasCompletedOnboarding,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

// Helper to access RefreshToken static methods
const getRefreshTokenModel = () => RefreshToken as any;

// ============================================
// Registration
// ============================================

export const register = async (req: Request, res: Response) => {
  try {
    const result = registerSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error?.issues?.[0]?.message ?? 'Invalid input' });
    }

    const { email, password, displayName } = result.data;

    const existing = await User.findOne({ email }).select('_id').lean();
    if (existing) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);
    const verificationToken = generateVerificationToken();
    
    // Generate encryption salt for client-side encryption
    const encryptionSalt = crypto.randomBytes(16).toString('hex');

    const user = await User.create({
      email,
      password: hashed,
      displayName: sanitizeInput(displayName || email.split('@')[0] || 'User'),
      authProvider: 'local',
      emailVerificationToken: verificationToken,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      encryptionSalt,
    });

    // PARALLEL OPERATIONS: Fire and forget
    Promise.allSettled([
      emailDripService.scheduleEmailDrip(user._id.toString(), email, user.displayName || 'User'),
      sendVerificationEmail(email, verificationToken),
      (async () => {
        try {
          const { Todo } = await import('../models/Todo');
          const exampleTodos = [
            { text: '📧 Check welcome email for tips', completed: false, category: 'personal', priority: 'high', tags: ['getting-started'], dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), order: 0, user: user._id },
            { text: '🚀 Set up your first project', completed: false, category: 'work', priority: 'high', tags: ['getting-started'], dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), order: 1, user: user._id },
            { text: '🎯 Review your goals for this week', completed: false, category: 'personal', priority: 'medium', tags: ['getting-started', 'planning'], dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), order: 2, user: user._id },
          ];
          await Todo.insertMany(exampleTodos);
        } catch (todoErr) {
          logger.warn('[Onboarding] Could not create example todos:', todoErr instanceof Error ? todoErr.message : 'Unknown error');
        }
      })(),
    ]).catch(() => {});

    return res.status(201).json({
      message: 'Account created successfully!',
      user: { id: user._id, email: user.email, displayName: user.displayName },
      encryptionSalt: user.encryptionSalt,
    });
  } catch (err) {
    logger.error('Register error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ============================================
// Email Verification
// ============================================

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const result = verifyEmailSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error?.issues?.[0]?.message ?? 'Invalid input' });
    }

    const { token } = result.data;

    const user = await User.findOneAndUpdate(
      { emailVerificationToken: token, emailVerificationExpires: { $gt: new Date() } },
      { $set: { emailVerified: true, emailVerificationToken: null, emailVerificationExpires: null } },
      { new: true }
    ).select(EXCLUDE_FIELDS).lean();

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    return res.json({ message: 'Email verified successfully! You can now login.' });
  } catch (err) {
    logger.error('VerifyEmail error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ============================================
// Login (Optimized with Refresh Tokens)
// ============================================

export const login = async (req: Request, res: Response) => {
  try {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error?.issues?.[0]?.message ?? 'Invalid input' });
    }

    const { email, password } = result.data;

    // Use lean() + select only needed fields
    const user = await User.findOne({ email })
      .select('password failedLoginAttempts accountLockedUntil encryptionSalt email isGoogleUser')
      .lean();
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if Google-only user
    if (user.isGoogleUser && !user.password) {
      return res.status(401).json({ error: 'This account uses Google Sign-In. Please login with Google.' });
    }

    // Check if locked
    if (isAccountLocked(user)) {
      return res.status(429).json({ error: 'Account temporarily locked due to too many failed attempts. Try again later.' });
    }

    if (!user.password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      await incrementFailedAttempts(user._id, user.failedLoginAttempts);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate encryption salt if needed
    const encryptionSalt = user.encryptionSalt || crypto.randomBytes(16).toString('hex');
    
    // Atomic update
    await User.findByIdAndUpdate(user._id, {
      $set: {
        failedLoginAttempts: 0,
        accountLockedUntil: null,
        lastLoginAt: new Date(),
        encryptionSalt: encryptionSalt,
      }
    });

    // Get device info from request
    const deviceInfo = {
      type: 'web',
      userAgent: req.headers['user-agent'] || null,
      ipAddress: req.ip || req.socket.remoteAddress || null,
      name: 'Current Device',
    };

    // Create refresh token with rotation
    const RefreshTokenModel = getRefreshTokenModel();
    const { token: refreshToken } = await RefreshTokenModel.createForUser(user._id.toString(), {
      device: deviceInfo,
      expiresInDays: REFRESH_TOKEN_EXPIRY_DAYS,
    });

    // Generate short-lived access token
    const accessToken = generateAccessToken(user._id.toString());

    // Set cookies
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
    
    // Access token cookie (short-lived)
    res.cookie(ACCESS_TOKEN_COOKIE, accessToken, getCookieOptions(15 * 60 * 1000));
    
    // Refresh token cookie (long-lived)
    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, getCookieOptions(REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000));
    
    // Encryption salt cookie (httpOnly, for client-side encryption)
    res.cookie(ENCRYPTION_SALT_COOKIE, encryptionSalt, {
      httpOnly: true,
      secure: isProduction,
      sameSite: (isProduction ? 'none' : 'lax') as CookieOptions['sameSite'],
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Cache user data for subsequent requests
    const fullUser = await User.findById(user._id).select(EXCLUDE_FIELDS).lean();
    if (fullUser) {
      await setCachedUser(user._id.toString(), buildCachedUserData(fullUser));
    }

    return res.json({
      message: 'Logged in',
      user: { id: user._id, email: user.email, displayName: fullUser?.displayName },
      encryptionSalt,
    });
  } catch (err) {
    logger.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ============================================
// Token Refresh (New Endpoint)
// ============================================

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const refreshTokenValue = req.cookies?.refresh_token;
    
    if (!refreshTokenValue) {
      return res.status(401).json({ error: 'No refresh token' });
    }

    const RefreshTokenModel = getRefreshTokenModel();
    
    // Validate and rotate refresh token
    const result = await RefreshTokenModel.validateAndConsume(refreshTokenValue, {
      rotate: true,
      device: {
        type: 'web',
        userAgent: req.headers['user-agent'] || undefined,
        ipAddress: req.ip || req.socket.remoteAddress || undefined,
      },
    });

    if (!result.valid || !result.userId) {
      return res.status(401).json({ error: result.reason || 'Invalid refresh token' });
    }

    // Generate new access token
    const accessToken = generateAccessToken(result.userId);

    // Set new access token cookie
    res.cookie(ACCESS_TOKEN_COOKIE, accessToken, getCookieOptions(15 * 60 * 1000));

    return res.json({
      accessToken,
      expiresIn: 900,
    });
  } catch (err) {
    logger.error('Refresh token error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ============================================
// Logout
// ============================================

export const logout = async (req: Request, res: Response) => {
  try {
    const refreshTokenValue = req.cookies?.refresh_token;
    const RefreshTokenModel = getRefreshTokenModel();
    
    // Revoke refresh token if exists
    if (refreshTokenValue) {
      await RefreshTokenModel.revokeToken(refreshTokenValue, 'User logged out');
    }

    // Clear user cache
    const userId = (req as any).user?.id;
    if (userId) {
      invalidateUserCache(userId);
    }

    // Clear all auth cookies
    res.clearCookie(ACCESS_TOKEN_COOKIE, getClearCookieOptions());
    res.clearCookie(REFRESH_TOKEN_COOKIE, getClearCookieOptions());
    res.clearCookie(ENCRYPTION_SALT_COOKIE, getClearCookieOptions());

    return res.json({ message: 'Logged out successfully' });
  } catch (err) {
    logger.error('Logout error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ============================================
// Session Management
// ============================================

export const getSessions = async (req: Request & { user?: { id: string } }, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const RefreshTokenModel = getRefreshTokenModel();
    const sessions = await RefreshTokenModel.getActiveTokens(userId);
    
    return res.json({ sessions });
  } catch (err) {
    logger.error('GetSessions error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const revokeSession = async (req: Request & { user?: { id: string } }, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID required' });
    }

    await RefreshToken.findOneAndUpdate(
      { _id: sessionId, user: userId },
      { $set: { revoked: true, revokedAt: new Date(), revocationReason: 'User revoked session' } }
    );

    return res.json({ message: 'Session revoked' });
  } catch (err) {
    logger.error('RevokeSession error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const revokeAllSessions = async (req: Request & { user?: { id: string } }, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const RefreshTokenModel = getRefreshTokenModel();
    
    // Revoke all refresh tokens
    await RefreshTokenModel.revokeAllForUser(userId, 'User revoked all sessions');
    
    // Clear session cache
    invalidateUserCache(userId);

    // Clear cookies
    res.clearCookie(ACCESS_TOKEN_COOKIE, getClearCookieOptions());
    res.clearCookie(REFRESH_TOKEN_COOKIE, getClearCookieOptions());
    res.clearCookie(ENCRYPTION_SALT_COOKIE, getClearCookieOptions());

    return res.json({ message: 'All sessions revoked' });
  } catch (err) {
    logger.error('RevokeAllSessions error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ============================================
// Password Reset
// ============================================

export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const result = passwordResetSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error?.issues?.[0]?.message ?? 'Invalid input' });
    }

    const { email } = result.data;

    const user = await User.findOne({ email }).select('_id').lean();
    if (!user) {
      return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }

    const resetToken = generateResetToken();

    await User.findByIdAndUpdate(user._id, {
      $set: {
        passwordResetToken: resetToken,
        passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    sendPasswordResetEmail(email, resetToken).catch(() => {
      logger.warn('[Email] Password reset email could not be sent');
    });

    return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
  } catch (err) {
    logger.error('RequestPasswordReset error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const result = resetPasswordSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error?.issues?.[0]?.message ?? 'Invalid input' });
    }

    const { token, password } = result.data;

    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.errors[0] || 'Password does not meet requirements' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const user = await User.findOneAndUpdate(
      { passwordResetToken: token, passwordResetExpires: { $gt: new Date() } },
      {
        $set: {
          password: hashed,
          passwordResetToken: null,
          passwordResetExpires: null,
          failedLoginAttempts: 0,
          accountLockedUntil: null,
        },
      },
      { new: true }
    ).select(EXCLUDE_FIELDS).lean();

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token.' });
    }

    const RefreshTokenModel = getRefreshTokenModel();
    
    // Revoke all sessions on password reset (security)
    await RefreshTokenModel.revokeAllForUser(user._id, 'Password reset');
    invalidateUserCache(user._id.toString());

    return res.json({ message: 'Password reset successful! You can now login.' });
  } catch (err) {
    logger.error('ResetPassword error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ============================================
// Profile Management
// ============================================

export const updateProfile = async (req: Request & { user?: { id: string } }, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const result = updateProfileSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error?.issues?.[0]?.message ?? 'Invalid input' });
    }

    const { displayName, bio, avatar } = result.data;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        ...(displayName && { displayName: sanitizeInput(displayName) }),
        ...(bio && { bio: sanitizeInput(bio) }),
        ...(avatar && { avatar }),
      },
      { new: true }
    ).select('email displayName bio').lean();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Invalidate cache to force refresh on next request
    invalidateUserCache(userId);

    return res.json({
      message: 'Profile updated',
      user: { id: userId, email: user.email, displayName: user.displayName, bio: user.bio },
    });
  } catch (err) {
    logger.error('UpdateProfile error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getProfile = async (req: Request & { user?: { id: string } }, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Try cache first
    const cachedUser = await getCachedUser(userId);
    
    if (cachedUser) {
      return res.json(cachedUser);
    }

    // Cache miss - fetch from DB
    const user = await User.findById(userId).select(EXCLUDE_FIELDS).lean();
      
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Store in cache
    const userData = buildCachedUserData(user);
    await setCachedUser(userId, userData);

    return res.json(userData);
  } catch (err) {
    logger.error('GetProfile error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteUser = async (req: Request & { user?: { id: string } }, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { Todo } = await import('../models/Todo');
    await Todo.deleteMany({ user: userId });

    const RefreshTokenModel = getRefreshTokenModel();
    
    // Revoke all sessions
    await RefreshTokenModel.revokeAllForUser(userId, 'Account deleted');
    
    // Clear cache
    invalidateUserCache(userId);
    
    // Delete refresh tokens
    await RefreshToken.deleteMany({ user: userId });

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Clear cookies
    res.clearCookie(ACCESS_TOKEN_COOKIE, getClearCookieOptions());
    res.clearCookie(REFRESH_TOKEN_COOKIE, getClearCookieOptions());
    res.clearCookie(ENCRYPTION_SALT_COOKIE, getClearCookieOptions());

    return res.json({ message: 'Account and all data deleted successfully' });
  } catch (err) {
    logger.error('DeleteUser error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ============================================
// Onboarding
// ============================================

export const getOnboardingStatus = async (req: Request & { user?: { id: string } }, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await User.findById(userId).select('hasCompletedOnboarding onboardingCompletedAt quickStartProgress').lean();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      hasCompletedOnboarding: user.hasCompletedOnboarding || false,
      onboardingCompletedAt: user.onboardingCompletedAt,
      quickStartProgress: user.quickStartProgress || { firstTask: false, categorize: false, setPriority: false },
    });
  } catch (err) {
    logger.error('GetOnboardingStatus error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const completeOnboarding = async (req: Request & { user?: { id: string } }, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { hasCompletedOnboarding: true, onboardingCompletedAt: new Date() } },
      { new: true }
    ).select('hasCompletedOnboarding onboardingCompletedAt').lean();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      message: 'Onboarding completed',
      hasCompletedOnboarding: true,
      onboardingCompletedAt: user.onboardingCompletedAt,
    });
  } catch (err) {
    logger.error('CompleteOnboarding error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateQuickStartProgress = async (req: Request & { user?: { id: string } }, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { firstTask, categorize, setPriority } = req.body;
    const updateObj: any = {};
    if (typeof firstTask === 'boolean') updateObj['quickStartProgress.firstTask'] = firstTask;
    if (typeof categorize === 'boolean') updateObj['quickStartProgress.categorize'] = categorize;
    if (typeof setPriority === 'boolean') updateObj['quickStartProgress.setPriority'] = setPriority;

    const user = await User.findByIdAndUpdate(userId, { $set: updateObj }, { new: true })
      .select('quickStartProgress').lean();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ message: 'Quick start progress updated', quickStartProgress: user.quickStartProgress });
  } catch (err) {
    logger.error('UpdateQuickStartProgress error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const resetOnboarding = async (req: Request & { user?: { id: string } }, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          hasCompletedOnboarding: false,
          onboardingCompletedAt: null,
          quickStartProgress: { firstTask: false, categorize: false, setPriority: false },
        },
      },
      { new: true }
    ).select('hasCompletedOnboarding quickStartProgress').lean();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      message: 'Onboarding status reset',
      hasCompletedOnboarding: false,
      quickStartProgress: user.quickStartProgress,
    });
  } catch (err) {
    logger.error('ResetOnboarding error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

