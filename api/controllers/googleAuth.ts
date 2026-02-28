import type { Request, Response } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { googleCallbackSchema } from '../schemas/auth';
import { logger } from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

const COOKIE_NAME = 'auth_token';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// CRITICAL: The redirect URI must ALWAYS point to the BACKEND callback, not frontend
// Priority: RENDER_URL > VERCEL_URL > API_URL > localhost
let GOOGLE_REDIRECT_URI = 'http://localhost:5000/api/auth/google/callback';

// Check for production deployment and set appropriate redirect URI
const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

if (process.env.RENDER_URL) {
  // Render deployment - explicit URL set in environment
  GOOGLE_REDIRECT_URI = `${process.env.RENDER_URL.replace(/\/$/, '')}/api/auth/google/callback`;
} else if (process.env.VERCEL_URL) {
  // Vercel deployment - VERCEL_URL is automatically set by Vercel
  GOOGLE_REDIRECT_URI = `https://${process.env.VERCEL_URL}/api/auth/google/callback`;
} else if (process.env.API_URL && process.env.API_URL.startsWith('http')) {
  // Custom API URL specified
  const apiUrl = process.env.API_URL.replace(/\/$/, '');
  GOOGLE_REDIRECT_URI = `${apiUrl}/api/auth/google/callback`;
}

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  logger.warn('[Google OAuth] Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET environment variables');
  logger.warn('[Google OAuth] Google login will not be available');
}

interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
}

interface IdTokenPayload {
  email_verified: boolean;
}

const getGoogleAuthUrl = (state?: string): string => {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error('Google OAuth not configured');
  }

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'email profile openid',
    access_type: 'offline',
    prompt: 'consent',
    ...(state && { state }),
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

const exchangeCodeForTokens = async (code: string): Promise<GoogleTokenResponse> => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error('Google OAuth not configured');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    logger.error('[Google OAuth] Token exchange error:', error);
    throw new Error('Failed to exchange authorization code');
  }

  return response.json() as Promise<GoogleTokenResponse>;
};

const getGoogleUserInfo = async (accessToken: string, idToken: string): Promise<GoogleUserInfo & { email_verified: boolean }> => {
  const idTokenParts = idToken.split('.');
  if (idTokenParts.length < 2) {
    throw new Error('Invalid ID token format');
  }
  
  const tokenPayload = idTokenParts[1];
  if (!tokenPayload) {
    throw new Error('Invalid ID token format');
  }
  
  const payload = JSON.parse(Buffer.from(tokenPayload, 'base64').toString()) as IdTokenPayload;
  
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get Google user info');
  }

  const userInfo = await response.json() as GoogleUserInfo;
  
  return {
    ...userInfo,
    email_verified: payload.email_verified,
  };
};

export const getGoogleAuthUrlHandler = async (req: Request, res: Response) => {
  try {
    const frontendUrl = req.query.frontendUrl as string | undefined;
    
    let validatedFrontendUrl = FRONTEND_URL;
    if (frontendUrl) {
      try {
        const url = new URL(frontendUrl);
        validatedFrontendUrl = url.origin;
      } catch {
        logger.warn('[Google OAuth] Invalid frontendUrl provided, using default');
      }
    }
    
    logger.info('[Google OAuth] Using frontend URL for redirect:', validatedFrontendUrl);
    logger.info('[Google OAuth] Redirect URI:', GOOGLE_REDIRECT_URI);
    
    const state = crypto.randomBytes(32).toString('hex');
    
    res.cookie('google_oauth_state', state, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 10 * 60 * 1000,
    });
    
    res.cookie('google_oauth_frontend_url', validatedFrontendUrl, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 10 * 60 * 1000,
    });

    // Check if this is a popup request and store it in a cookie
    const isPopup = req.query.popup === 'true';
    if (isPopup) {
      res.cookie('google_oauth_is_popup', 'true', {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: 10 * 60 * 1000,
      });
    }

    const authUrl = getGoogleAuthUrl(state);

    return res.json({ 
      authUrl, 
      state, 
      redirectUri: GOOGLE_REDIRECT_URI,
      frontendUrl: validatedFrontendUrl 
    });
  } catch (err: unknown) {
    logger.error('[Google OAuth] Get auth URL error:', err);
    if (err instanceof Error && err.message === 'Google OAuth not configured') {
      return res.status(503).json({ error: 'Google OAuth is not configured' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const googleCallback = async (req: Request, res: Response) => {
  try {
    const frontendUrl = req.cookies?.google_oauth_frontend_url || FRONTEND_URL;
    
    const result = googleCallbackSchema.safeParse(req.query);
    if (!result.success) {
      return res.redirect(`${frontendUrl}?google_error=${encodeURIComponent('Invalid request')}`);
    }

    const { code, state } = result.data;

    const stateCookie = req.cookies?.google_oauth_state;
    if (!stateCookie || stateCookie !== state) {
      return res.redirect(`${frontendUrl}?google_error=${encodeURIComponent('Invalid state parameter')}`);
    }

    res.clearCookie('google_oauth_state', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
    });
    res.clearCookie('google_oauth_frontend_url', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
    });

    const tokens = await exchangeCodeForTokens(code);
    
    const googleUser = await getGoogleUserInfo(tokens.access_token, tokens.id_token);

    if (!googleUser.email) {
      return res.redirect(`${frontendUrl}?google_error=${encodeURIComponent('Could not get email from Google')}`);
    }

    let user = await User.findOne({ googleId: googleUser.id });
    let token = '';
    
    if (!user) {
      const existingUser = await User.findOne({ email: googleUser.email.toLowerCase() });
      
      if (existingUser) {
        if (existingUser.authProvider === 'local' && existingUser.password) {
          return res.redirect(`${frontendUrl}?google_error=${encodeURIComponent('This email is already registered with email/password. Please login with your email and password to link your Google account, or use a different Google account.')}`);
        }
        
        existingUser.googleId = googleUser.id;
        existingUser.authProvider = 'google';
        existingUser.isGoogleUser = true;
        existingUser.googleProfile = {
          picture: googleUser.picture,
          givenName: googleUser.given_name,
          familyName: googleUser.family_name,
        };
        existingUser.emailVerified = googleUser.email_verified;
        existingUser.lastLoginAt = new Date();
        
        if (!existingUser.encryptionSalt) {
          existingUser.encryptionSalt = crypto.randomBytes(16).toString('hex');
        }
        
        // Generate a password for Google user for encryption/decryption purposes
        if (!existingUser.password) {
          const bcrypt = await import('bcryptjs');
          const generatedPassword = `google_${googleUser.id}_${Date.now()}`;
          existingUser.password = await bcrypt.hash(generatedPassword, 12);
        }
        
        await existingUser.save();
        user = existingUser;
      } else {
        const newEncryptionSalt = crypto.randomBytes(16).toString('hex');
        
        // Generate a password for new Google user for encryption/decryption purposes
        const bcrypt = await import('bcryptjs');
        const generatedPassword = `google_${googleUser.id}_${Date.now()}`;
        
        user = await User.create({
          email: googleUser.email.toLowerCase(),
          password: await bcrypt.hash(generatedPassword, 12),
          displayName: googleUser.name || googleUser.given_name || 'Google User',
          authProvider: 'google',
          isGoogleUser: true,
          googleId: googleUser.id,
          googleProfile: {
            picture: googleUser.picture,
            givenName: googleUser.given_name,
            familyName: googleUser.family_name,
          },
          emailVerified: googleUser.email_verified,
          encryptionSalt: newEncryptionSalt,
          avatar: googleUser.picture,
        });
      }
    }

    if (user) {
      user.lastLoginAt = new Date();
      await user.save();

      // Generate our own JWT for the todo app
      token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });

      res.cookie(COOKIE_NAME, token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }

    // Check if this is a popup request - read from cookie instead of query param
    const isPopup = req.cookies?.google_oauth_is_popup === 'true';
    
    // Clear the popup cookie
    res.clearCookie('google_oauth_is_popup', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
    });
    
    // For popup, return HTML that sends message to parent window and closes
    if (isPopup) {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Google Sign-In</title>
          <style>
            body { font-family: system-ui, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f0f0f0; }
            .message { text-align: center; padding: 20px; }
            .success { color: #22c55e; font-size: 18px; }
          </style>
        </head>
        <body>
          <div class="message">
            <p class="success">✓ Successfully signed in!</p>
            <p>You can close this window now.</p>
          </div>
          <script>
            // Try to notify parent window
            try {
              window.opener.postMessage({
                type: 'google-auth-success'
              }, '*');
            } catch(e) { console.log('Cannot post message:', e); }
            
            // Close this window after a short delay
            setTimeout(() => {
              try { window.close(); } catch(e) {}
            }, 1000);
          </script>
        </body>
        </html>
      `;
      return res.status(200).send(html);
    }
    
    // Regular redirect for non-popup flow - just redirect with success, auth is via cookie
    return res.redirect(`${frontendUrl}?google_auth=success`);
  } catch (err: unknown) {
    logger.error('[Google OAuth] Callback error:', err);
    
    // For popup, return error HTML - read from cookie
    const isPopupError = req.cookies?.google_oauth_is_popup === 'true';
    if (isPopupError) {
      res.clearCookie('google_oauth_is_popup', {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
      });
      const errorHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Google Sign-In</title>
          <style>
            body { font-family: system-ui, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f0f0f0; }
            .message { text-align: center; padding: 20px; }
            .error { color: #ef4444; font-size: 18px; }
          </style>
        </head>
        <body>
          <div class="message">
            <p class="error">✗ Authentication failed</p>
            <p>You can close this window now.</p>
          </div>
          <script>
            try {
              window.opener.postMessage({
                type: 'google-auth-error',
                message: 'Google authentication failed'
              }, '*');
            } catch(e) { console.log('Cannot post message:', e); }
            setTimeout(() => {
              try { window.close(); } catch(e) {}
            }, 1000);
          </script>
        </body>
        </html>
      `;
      return res.status(200).send(errorHtml);
    }
    
    const frontendUrl = req.cookies?.google_oauth_frontend_url || FRONTEND_URL;
    return res.redirect(`${frontendUrl}?google_error=${encodeURIComponent('Google authentication failed')}`);
  }
};

export const googleError = async (req: Request, res: Response) => {
  const error = req.query.error as string | undefined;
  const errorDescription = req.query.error_description as string | undefined;
  const errorMessage = errorDescription || error || 'Google authentication failed';
  return res.redirect(`${FRONTEND_URL}?google_error=${encodeURIComponent(errorMessage)}`);
};

export const linkGoogleAccount = async (req: Request & { user?: { id: string } }, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { googleToken } = req.body;

    if (!googleToken) {
      return res.status(400).json({ error: 'Google token is required' });
    }

    const googleUserInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${googleToken}`,
      },
    });

    if (!googleUserInfoResponse.ok) {
      return res.status(400).json({ error: 'Invalid Google token' });
    }

    const googleUser = await googleUserInfoResponse.json() as GoogleUserInfo;

    const existingGoogleUser = await User.findOne({ googleId: googleUser.id });
    if (existingGoogleUser && existingGoogleUser._id.toString() !== userId) {
      return res.status(409).json({ error: 'This Google account is already linked to another user' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.googleId) {
      return res.status(409).json({ error: 'Google account already linked' });
    }

    const existingEmailUser = await User.findOne({ 
      email: googleUser.email.toLowerCase(),
      _id: { $ne: userId }
    });
    
    if (existingEmailUser) {
      return res.status(409).json({ error: 'This Google email is already registered with another account' });
    }

    user.googleId = googleUser.id;
    user.authProvider = 'google';
    user.isGoogleUser = true;
    user.googleProfile = {
      picture: googleUser.picture,
      givenName: googleUser.given_name,
      familyName: googleUser.family_name,
    };
    user.emailVerified = true;
    if (!user.avatar) {
      user.avatar = googleUser.picture;
    }
    
    await user.save();

    return res.json({ 
      message: 'Google account linked successfully',
      user: { 
        id: user._id, 
        email: user.email, 
        displayName: user.displayName,
        isGoogleUser: user.isGoogleUser,
      }
    });
  } catch (err: unknown) {
    logger.error('[Google OAuth] Link account error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const unlinkGoogleAccount = async (req: Request & { user?: { id: string } }, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required to unlink Google account' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.googleId) {
      return res.status(400).json({ error: 'Google account not linked' });
    }

    const bcrypt = await import('bcryptjs');
    const match = await bcrypt.compare(password, user.password || '');
    if (!match) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    if (!user.password) {
      return res.status(400).json({ error: 'Please set a password before unlinking Google account' });
    }

    user.googleId = null;
    user.authProvider = 'local';
    user.isGoogleUser = false;
    user.googleProfile = null;
    
    await user.save();

    return res.json({ message: 'Google account unlinked successfully' });
  } catch (err: unknown) {
    logger.error('[Google OAuth] Unlink account error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getGoogleAuthStatus = async (req: Request & { user?: { id: string } }, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      isGoogleUser: user.isGoogleUser,
      hasGoogleLinked: !!user.googleId,
      authProvider: user.authProvider,
    });
  } catch (err: unknown) {
    logger.error('[Google OAuth] Get status error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
