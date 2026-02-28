/**
 * Production-safe Logger Utility
 * Only logs in development mode. In production, logs are suppressed for security.
 */

const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

export const logger = {
  info: (message: string, ...args: unknown[]) => {
    if (!isProduction) {
      console.log(`[INFO] ${message}`, ...args);
    }
  },

  warn: (message: string, ...args: unknown[]) => {
    if (!isProduction) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },

  error: (message: string, ...args: unknown[]) => {
    // In production, we still log errors but without exposing sensitive data
    // You could integrate with a proper logging service (Sentry, Winston, etc.)
    if (isProduction) {
      // In production, you might want to send to a logging service
      // For now, we suppress to avoid console clutter
      console.error(`[ERROR] ${message} - Check server logs for details`);
    } else {
      console.error(`[ERROR] ${message}`, ...args);
    }
  },

  debug: (message: string, ...args: unknown[]) => {
    if (!isProduction) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  },
};

// Convenience exports for easier migration
export const log = logger.info;
export const logError = logger.error;
export const logWarn = logger.warn;
export const logDebug = logger.debug;

