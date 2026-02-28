/**
 * Production-safe Console Utility
 * In production, shows a warning to discourage console usage.
 * This helps prevent leaking sensitive information through console.
 */

const isProduction = import.meta.env.PROD || 
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost');

const PRODUCTION_WARNING = '%c⚠️ WARNING: Using console in production may leak sensitive information! Consider removing console logs for better security and performance.';

// Giant red warning style
const warningStyle = 'font-size: 16px; font-weight: bold; color: #ff0000; background: #ffeeee; padding: 10px; border: 2px solid #ff0000; border-radius: 5px;';

// Only show the warning once
let warningShown = false;

const showProductionWarning = () => {
  if (isProduction && !warningShown) {
    console.warn(PRODUCTION_WARNING, warningStyle);
    warningShown = true;
  }
};

// Create a proxy console that shows warning in production
export const safeConsole = {
  log: (...args: unknown[]) => {
    showProductionWarning();
    console.log(...args);
  },
  
  warn: (...args: unknown[]) => {
    showProductionWarning();
    console.warn(...args);
  },
  
  error: (...args: unknown[]) => {
    // Errors are more important - show with warning but allow in dev for debugging
    if (!isProduction) {
      console.error(...args);
    } else {
      showProductionWarning();
      // In production, still show but with warning style
      console.warn('%c[ERROR]', 'color: red; font-weight: bold;', ...args);
    }
  },
  
  info: (...args: unknown[]) => {
    showProductionWarning();
    console.info(...args);
  },
  
  debug: (...args: unknown[]) => {
    showProductionWarning();
    console.debug(...args);
  },
  
  // Expose original console for cases where we really need it
  _original: console,
};

// Export individual functions for easier migration
export const log = safeConsole.log;
export const warn = safeConsole.warn;
export const error = safeConsole.error;
export const info = safeConsole.info;
export const debug = safeConsole.debug;

// Default export for convenience
export default safeConsole;

