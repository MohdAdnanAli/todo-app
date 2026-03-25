declare const safeConsole: {
  log: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
  info: (...args: any[]) => void;
  debug: (...args: any[]) => void;
};

export = safeConsole;
export const log: typeof safeConsole.log;
export const warn: typeof safeConsole.warn;
export const error: typeof safeConsole.error;
export const info: typeof safeConsole.info;
export const debug: typeof safeConsole.debug;

