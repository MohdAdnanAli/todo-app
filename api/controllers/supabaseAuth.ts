import type { Request, Response } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { supabase, signInWithGoogle, exchangeCodeForSession, getCurrentUser, getSupabaseRedirectUrl } from '../supabase';
import { User } from '../models/User';
import { logger } from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

const COOKIE_NAME = 'auth_token';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ============================================================================
// MIDDLEWARE: Check if user exists in MongoDB when logging in via Supabase
// ============================================================================

/**
 * Check for email conflicts between Supabase and MongoDB
 * This ensures no duplicate users across both systems
 */
export const checkEmailConflict = async (email: string): Promise<{
  exists: boolean;
  system: 'supabase' | 'mongo' | 'both' | null;
  message: string;
}> => {
  // Check MongoDB first
  const mongoUser = await User.findOne({ email: email.toLowerCase() });
  
  if (mongoUser) {
    return {
      exists: true,
      system: 'mongo',
      message: 'This email is already registered in our system. Please use the login method associated with this email.',
    };
  }
  
  return {
    exists: false,
    system: null,
    message: '',
  };
};

// ============================================================================
// ROUTE: Initiate Google OAuth via Supabase
// ============================================================================

export const getSupabaseGoogleAuthUrl = async (req: Request, res: Response) => {
  try {
    // Check for custom frontend URL
    const frontendUrl = req.query.frontendUrl as string | undefined;
    const redirectUrl = frontendUrl || FRONTEND_URL;
    
    // Generate state for CSRF protection
    const state = crypto.randomBytes(32).toString('hex');
    
    // Store state and redirect URL in cookies
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
    res.cookie('supabase_oauth_state', state, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 10 * 60 * 1000, // 10 minutes
    });
    
    res.cookie('supabase_oauth_frontend', redirectUrl, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 10 * 60 * 1000,
    });

    // Get Supabase Google OAuth URL
    const { data, error } = await signInWithGoogle();
    
    if (error) {
      logger.error('[Supabase Auth] Google sign in error:', error);
      return res.status(400).json({
        error: 'Failed to initiate Google sign-in',
        details: error.message 
      });
    }

    // Append state to the OAuth URL for CSRF protection
    let authUrl = data?.url;
    if (authUrl && state) {
      const url = new URL(authUrl);
      url.searchParams.set('state', state);
      authUrl = url.toString();
    }

    logger.info('[Supabase Auth] Google OAuth URL generated successfully');
    
    return res.json({ 
      authUrl,
      state,
      provider: 'supabase',
    });
  } catch (err: unknown) {
    logger.error('[Supabase Auth] Get auth URL error:', err);
    return res.status(500).json({ error: 'Failed to initiate Google sign-in' });
  }
};

// ============================================================================
// ROUTE: Handle Supabase OAuth Callback
// ============================================================================

export const handleSupabaseCallback = async (req: Request, res: Response) => {
  try {
    const frontendUrl = req.cookies?.supabase_oauth_frontend || FRONTEND_URL;
    const stateCookie = req.cookies?.supabase_oauth_state;
    
    // Clear cookies
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
    res.clearCookie('supabase_oauth_state', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
    });
    res.clearCookie('supabase_oauth_frontend', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
    });

    // Check for error in query params (from Supabase)
    const error = req.query.error as string | undefined;
    const errorDescription = req.query.error_description as string | undefined;
    
    if (error) {
      logger.error('[Supabase Auth] OAuth error:', error, errorDescription);
      return res.redirect(`${frontendUrl}?google_error=${encodeURIComponent(errorDescription || error)}`);
    }

    // Get the code from query params
    const code = req.query.code as string | undefined;
    const state = req.query.state as string | undefined;
    
    if (!code) {
      return res.redirect(`${frontendUrl}?google_error=${encodeURIComponent('No authorization code received')}`);
    }

    // Verify state for CSRF protection
    if (state !== stateCookie) {
      return res.redirect(`${frontendUrl}?google_error=${encodeURIComponent('Invalid state parameter - possible CSRF attack')}`);
    }

    // Exchange code for session
    const { data: sessionData, error: sessionError } = await exchangeCodeForSession(code);
    
    if (sessionError) {
      logger.error('[Supabase Auth] Session exchange error:', sessionError);
      return res.redirect(`${frontendUrl}?google_error=${encodeURIComponent('Failed to complete Google sign-in')}`);
    }

    const supabaseUser = sessionData?.user;
    
    if (!supabaseUser || !supabaseUser.email) {
      return res.redirect(`${frontendUrl}?google_error=${encodeURIComponent('Could not get email from Google')}`);
    }

    logger.info('[Supabase Auth] User signed in via Supabase:', supabaseUser.email);

    // Check for email conflict in MongoDB
    const conflict = await checkEmailConflict(supabaseUser.email);
    
    if (conflict.exists) {
      // User exists in MongoDB - redirect with specific error message
      return res.redirect(`${frontendUrl}?google_error=${encodeURIComponent(
        'This email is already registered with email/password. Please login with your email and password, or use a different Google account.'
      )}`);
    }

    // User is new to MongoDB - create a local record for Todo app functionality
    // This links the Supabase user to our MongoDB for todo storage
    let mongoUser = await User.findOne({ supabaseId: supabaseUser.id });
    
    if (!mongoUser) {
      // Create new MongoDB user linked to Supabase
      const encryptionSalt = crypto.randomBytes(16).toString('hex');
      
      mongoUser = await User.create({
        email: supabaseUser.email.toLowerCase(),
        password: null, // No password - managed by Supabase
        displayName: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || 'Google User',
        authProvider: 'supabase',
        isGoogleUser: true,
        supabaseId: supabaseUser.id,
        googleProfile: {
          picture: supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.picture,
          givenName: supabaseUser.user_metadata?.given_name,
          familyName: supabaseUser.user_metadata?.family_name,
        },
        emailVerified: supabaseUser.email_confirmed_at !== null,
        encryptionSalt,
        avatar: supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.picture,
      });
      
      logger.info('[Supabase Auth] Created MongoDB user for Supabase user:', supabaseUser.email);
    }

    // Update last login
    mongoUser.lastLoginAt = new Date();
    await mongoUser.save();

    // Generate our own JWT for the todo app
    const token = jwt.sign({ id: mongoUser._id }, JWT_SECRET, { expiresIn: '7d' });

    // Set our auth cookie
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Redirect to frontend with success
    logger.info('[Supabase Auth] Successfully authenticated:', supabaseUser.email);
    
    return res.redirect(`${frontendUrl}?google_auth=success&token=${token}`);
  } catch (err: unknown) {
    logger.error('[Supabase Auth] Callback error:', err);
    const frontendUrl = req.cookies?.supabase_oauth_frontend || FRONTEND_URL;
    return res.redirect(`${frontendUrl}?google_error=${encodeURIComponent('Google authentication failed')}`);
  }
};

// ============================================================================
// ROUTE: Get Supabase Auth Status
// ============================================================================

export const getSupabaseAuthStatus = async (req: Request & { user?: { id: string } }, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Get user from MongoDB
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      authProvider: user.authProvider,
      isGoogleUser: user.isGoogleUser,
      hasSupabaseAccount: !!user.supabaseId,
      emailVerified: user.emailVerified,
    });
  } catch (err: unknown) {
    logger.error('[Supabase Auth] Get status error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ============================================================================
// ROUTE: Sign out from Supabase
// ============================================================================

export const signOutSupabase = async (req: Request, res: Response) => {
  try {
    // Sign out from Supabase
    await supabase.auth.signOut();
    
    // Clear our auth cookie
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
    });

    return res.json({ message: 'Signed out successfully' });
  } catch (err: unknown) {
    logger.error('[Supabase Auth] Sign out error:', err);
    return res.status(500).json({ error: 'Failed to sign out' });
  }
};

// ============================================================================
// HELPER: Check if email is available
// ============================================================================

export const checkEmailAvailability = async (req: Request, res: Response) => {
  try {
    const { email } = req.query;
    
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check MongoDB
    const mongoUser = await User.findOne({ email: email.toLowerCase() });
    
    if (mongoUser) {
      return res.json({
        available: false,
        system: mongoUser.authProvider,
        message: `This email is already registered via ${mongoUser.authProvider}. Please use ${mongoUser.authProvider} to sign in.`,
      });
    }

    return res.json({
      available: true,
      system: null,
      message: 'Email is available',
    });
  } catch (err: unknown) {
    logger.error('[Supabase Auth] Check email error:', err);
    return res.status(500).json({ error: 'Failed to check email availability' });
  }
};
