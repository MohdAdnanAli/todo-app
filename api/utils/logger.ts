/**
 * Production Logger Utility
 * Logs in both development and production for debugging
 */

const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

// Helper to sanitize sensitive data from logs
const sanitizeForLog = (data: unknown): unknown => {
  if (data === null || data === undefined) return data;
  
  if (typeof data === 'string') {
    // Mask potential sensitive values
    return data
      .replace(/(password|token|secret|key)=[^&]*/gi, '$1=***REDACTED***')
      .replace(/"(password|token|secret|key)":\s*"[^"]*"/gi, '"$1": "***REDACTED***"');
  }
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeForLog(item));
  }
  
  if (typeof data === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      const sensitiveKeys = ['password', 'token', 'secret', 'key', 'emailVerificationToken', 'passwordResetToken', 'googleId'];
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
        sanitized[key] = '***REDACTED***';
      } else {
        sanitized[key] = sanitizeForLog(value);
      }
    }
    return sanitized;
  }
  
  return data;
};

export const logger = {
  info: (message: string, ...args: unknown[]) => {
    const sanitizedArgs = isProduction ? args.map(arg => sanitizeForLog(arg)) : args;
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, ...sanitizedArgs);
  },

  warn: (message: string, ...args: unknown[]) => {
    const sanitizedArgs = isProduction ? args.map(arg => sanitizeForLog(arg)) : args;
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, ...sanitizedArgs);
  },

  error: (message: string, ...args: unknown[]) => {
    // Always log errors in both development and production
    // Sanitize sensitive data while preserving error stack traces
    const sanitizedArgs = isProduction ? args.map(arg => {
      if (arg instanceof Error) {
        return { message: arg.message, stack: arg.stack };
      }
      return sanitizeForLog(arg);
    }) : args;
    
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, ...sanitizedArgs);
  },

  debug: (message: string, ...args: unknown[]) => {
    if (!isProduction) {
      const sanitizedArgs = args.map(arg => sanitizeForLog(arg));
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, ...sanitizedArgs);
    }
  },
};

// Convenience exports for easier migration
export const log = logger.info;
export const logError = logger.error;
export const logWarn = logger.warn;
export const logDebug = logger.debug;

