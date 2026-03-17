import rateLimit from 'express-rate-limit';

// Custom keyGenerator that handles proxy headers properly (IP only - used by other limiters)
const createKeyGenerator = () => {
  return (req: any) => {
    // If trust proxy is enabled, use req.ip which Express will derive from x-forwarded-for
    if (req.app.get('trust proxy')) {
      return req.ip || req.socket.remoteAddress || 'unknown';
    }
    // Fallback: use a combination of headers
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
           req.socket.remoteAddress || 
           'unknown';
  };
};


// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: createKeyGenerator(),
  validate: false,
});

// Login attempt limiter
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: 'Too many login attempts from this device. Please wait 15 minutes or try a different browser.',
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = createKeyGenerator()(req);
    const ua = (req.headers['user-agent'] || '').slice(0, 100); // Truncate UA
    return `${ip}:${ua}`;
  },
  validate: false,
});

// Registration limiter
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Too many registration attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: createKeyGenerator(),
  validate: false,
});

// Password reset limiter
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: 'Too many password reset attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: createKeyGenerator(),
  validate: false,
});
