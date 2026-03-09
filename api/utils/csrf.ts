/**
 * CSRF Protection Utility
 * Implements double-submit cookie pattern for stateless CSRF protection
 */

import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

// ============================================
// Configuration
// ============================================

const CSRF_TOKEN_NAME = 'csrf_token';
const CSRF_COOKIE_NAME = '__csrf';

// Token length
const TOKEN_LENGTH = 32;

// Cookie options
const getCookieOptions = (): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  maxAge: number;
} => {
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
  
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  };
};

// ============================================
// Token Generation
// ============================================

/**
 * Generate a new CSRF token
 */
export const generateCsrfToken = (): string => {
  return crypto.randomBytes(TOKEN_LENGTH).toString('hex');
};

/**
 * Generate a signed CSRF token
 */
export const generateSignedCsrfToken = (secret: string): string => {
  const token = generateCsrfToken();
  const signature = crypto
    .createHmac('sha256', secret)
    .update(token)
    .digest('hex');
  
  return `${token}.${signature}`;
};

/**
 * Verify a signed CSRF token
 */
export const verifySignedCsrfToken = (token: string, secret: string): boolean => {
  try {
    const [tokenPart, signaturePart] = token.split('.');
    
    if (!tokenPart || !signaturePart) {
      return false;
    }
    
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(tokenPart)
      .digest('hex');
    
    // Use timing-safe comparison
    return crypto.timingSafeEqual(
      Buffer.from(signaturePart),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
};

// ============================================
// Cookie Helpers
// ============================================

/**
 * Set CSRF cookie in response
 */
export const setCsrfCookie = (res: Response, token: string): void => {
  const options = getCookieOptions();
  res.cookie(CSRF_COOKIE_NAME, token, options);
};

/**
 * Clear CSRF cookie
 */
export const clearCsrfCookie = (res: Response): void => {
  const options = getCookieOptions();
  res.clearCookie(CSRF_COOKIE_NAME, options);
};

/**
 * Get CSRF token from cookie
 */
export const getCsrfTokenFromCookie = (req: Request): string | undefined => {
  return req.cookies?.[CSRF_COOKIE_NAME];
};

// ============================================
// CSRF Middleware Factory
// ============================================

interface CsrfRequest extends Request {
  csrfToken?: string;
  csrfValid?: boolean;
}

/**
 * Middleware to generate and expose CSRF token
 * Use on GET routes that render forms
 */
export const csrfGenerate = (req: CsrfRequest, res: Response, next: NextFunction): void => {
  // Generate new token for each GET request
  const token = generateCsrfToken();
  
  // Set cookie
  setCsrfCookie(res, token);
  
  // Expose token in locals for rendering
  res.locals.csrfToken = token;
  req.csrfToken = token;
  
  next();
};

/**
 * Middleware to validate CSRF token
 * Use on POST/PUT/DELETE routes
 */
export const csrfValidate = (req: CsrfRequest, res: Response, next: NextFunction): void => {
  // Get token from header (submitted by client) and cookie
  const headerToken = req.headers['x-csrf-token'] as string;
  const cookieToken = getCsrfTokenFromCookie(req);
  
  // Both must be present
  if (!headerToken || !cookieToken) {
    res.status(403).json({ error: 'CSRF token missing' });
    return;
  }
  
  // Tokens must match (double-submit)
  if (headerToken !== cookieToken) {
    res.status(403).json({ error: 'CSRF token mismatch' });
    return;
  }
  
  // Mark as valid
  req.csrfValid = true;
  next();
};

/**
 * Combined middleware: generate token for safe methods, validate for unsafe
 */
export const csrfProtect = (req: CsrfRequest, res: Response, next: NextFunction): void => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    // Generate token for safe methods
    csrfGenerate(req, res, next);
  } else {
    // Validate token for unsafe methods
    csrfValidate(req, res, next);
  }
};

// ============================================
// Express.js Res.locals Extension
// ============================================

declare global {
  namespace Express {
    interface Locals {
      csrfToken?: string;
    }
  }
}

export default {
  generateCsrfToken,
  generateSignedCsrfToken,
  verifySignedCsrfToken,
  setCsrfCookie,
  clearCsrfCookie,
  getCsrfTokenFromCookie,
  csrfGenerate,
  csrfValidate,
  csrfProtect,
};

