import rateLimit from 'express-rate-limit';

// Global configuration for express-rate-limit
const globalRateLimitConfig = {
  validate: { xForwardedForHeader: false },
};

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  ...globalRateLimitConfig,
});

// Login attempt limiter - strict
export const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // max 5 login attempts per minute
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true, // don't count successful logins
  standardHeaders: true,
  legacyHeaders: false,
  ...globalRateLimitConfig,
});

// Registration limiter
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // max 5 registrations per hour per IP
  message: 'Too many registration attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  ...globalRateLimitConfig,
});

// Password reset limiter
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // max 3 password reset requests per hour
  message: 'Too many password reset attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  ...globalRateLimitConfig,
});
