
import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/User';
import { registerSchema, loginSchema, passwordResetSchema, resetPasswordSchema, updateProfileSchema, verifyEmailSchema } from '../schemas/auth';
import { sanitizeInput, generateVerificationToken, generateResetToken, validatePasswordStrength } from '../utils/security';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-in-production-very-long-random-string';
const COOKIE_NAME = 'auth_token';
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000; // 15 minutes
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Helper: Check if account is locked
const isAccountLocked = (user: any): boolean => {
  return user.accountLockedUntil && new Date(user.accountLockedUntil) > new Date();
};

// Helper: Lock account
const lockAccount = async (user: any): Promise<void> => {
  user.accountLockedUntil = new Date(Date.now() + LOCK_TIME);
  await user.save();
};

// Helper: Reset login attempts
const resetLoginAttempts = async (user: any): Promise<void> => {
  user.failedLoginAttempts = 0;
  user.accountLockedUntil = null;
  await user.save();
};

// Helper: Increment failed attempts
const incrementFailedAttempts = async (user: any): Promise<void> => {
  user.failedLoginAttempts += 1;
  if (user.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
    await lockAccount(user);
  } else {
    await user.save();
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const result = registerSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error?.issues?.[0]?.message ?? 'Invalid input' });
    }

    const { email, password, displayName } = result.data;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    const salt = await bcrypt.genSalt(12);
    const hashed = await bcrypt.hash(password, salt);
    const verificationToken = generateVerificationToken();
    
    // Generate encryption salt for client-side encryption
    const encryptionSalt = crypto.randomBytes(16).toString('hex');

    const user = await User.create({
      email,
      password: hashed,
      displayName: sanitizeInput(displayName || email.split('@')[0] || 'User'),
      emailVerificationToken: verificationToken,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      encryptionSalt,
    });

    // Send verification email (non-blocking, log error but continue)
    sendVerificationEmail(email, verificationToken).catch(err => {
      console.log('[Email] Verification email could not be sent (SMTP not configured)');
    });

    return res.status(201).json({
      message: 'Account created successfully!',
      user: { id: user._id, email: user.email, displayName: user.displayName },
      encryptionSalt: user.encryptionSalt,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const result = verifyEmailSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error?.issues?.[0]?.message ?? 'Invalid input' });
    }

    const { token } = result.data;

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    return res.json({ message: 'Email verified successfully! You can now login.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error?.issues?.[0]?.message ?? 'Invalid input' });
    }

    const { email, password } = result.data;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if account is locked
    if (isAccountLocked(user)) {
      return res.status(429).json({ error: 'Account temporarily locked due to too many failed attempts. Try again later.' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      await incrementFailedAttempts(user);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Reset failed attempts on successful login
    await resetLoginAttempts(user);
    user.lastLoginAt = new Date();
    
    // Generate encryptionSalt for existing users who don't have one
    if (!user.encryptionSalt) {
      user.encryptionSalt = crypto.randomBytes(16).toString('hex');
    }
    
    await user.save();

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      message: 'Logged in',
      user: { id: user._id, email: user.email, displayName: user.displayName },
      encryptionSalt: user.encryptionSalt,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const result = passwordResetSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error?.issues?.[0]?.message ?? 'Invalid input' });
    }

    const { email } = result.data;

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists - return success anyway
      return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }

    const resetToken = generateResetToken();
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    // Send reset email (non-blocking)
    sendPasswordResetEmail(email, resetToken).catch(err => {
      console.log('[Email] Password reset email could not be sent (SMTP not configured)');
    });

    return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
  } catch (err) {
    console.error(err);
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

    // Validate password strength before proceeding
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.errors[0] || 'Password does not meet requirements' });
    }

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token. Please request a new password reset.' });
    }

    const salt = await bcrypt.genSalt(12);
    const hashed = await bcrypt.hash(password, salt);

    user.password = hashed;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    user.failedLoginAttempts = 0;
    user.accountLockedUntil = null;
    await user.save();

    return res.json({ message: 'Password reset successful! You can now login with your new password.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

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
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      message: 'Profile updated',
      user: { id: user._id, email: user.email, displayName: user.displayName, bio: user.bio },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getProfile = async (req: Request & { user?: { id: string } }, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await User.findById(userId).select('-password -emailVerificationToken -passwordResetToken');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteUser = async (req: Request & { user?: { id: string } }, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Import Todo model to delete all user todos
    const { Todo } = await import('../models/Todo');

    // Delete all todos for this user
    await Todo.deleteMany({ user: userId });

    // Delete the user account
    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Clear the auth cookie
    res.clearCookie('auth_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });

    return res.json({ message: 'Account and all data deleted successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

