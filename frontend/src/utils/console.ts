/**
 * Timestamped console logging utility - DEBUGGING PHASE ONLY
 * Usage: import { timestamp, log, warn, error } from './console';
 *        timestamp('[REORDER] Starting');
 */

const padZero = (num: number, size: number): string => {
  let s = num + '';
  while (s.length < size) s = '0' + s;
  return s;
};

const getTimestamp = (): string => {
  const now = new Date();
  const h = padZero(now.getHours(), 2);
  const m = padZero(now.getMinutes(), 2);
  const s = padZero(now.getSeconds(), 2);
  const ms = padZero(now.getMilliseconds(), 3);
  return `[${h}:${m}:${s}.${ms}]`;
};

export const timestamp = (prefix: string, msg: string): void => {
  console.log(`${getTimestamp()} ${prefix}: ${msg}`);
};

export const log = (prefix: string, msg: string): void => timestamp(prefix, msg);
export const warn = (prefix: string, msg: string): void => console.warn(`${getTimestamp()} ${prefix}: ${msg}`);
export const error = (prefix: string, msg: string): void => console.error(`${getTimestamp()} ${prefix}: ${msg}`);

// Existing console wrappers (for backward compat)
export const table = (prefix: string, data: any): void => {
  console.group(`${getTimestamp()} ${prefix}`);
  console.table(data);
  console.groupEnd();
};

export default { timestamp, log, warn, error, table };

