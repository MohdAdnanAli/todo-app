import type { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

export interface ApiError {
  error: string;
  code?: string;
  status?: number;
  details?: Record<string, any>;
}

export const ERROR_CODES = {
  AUTH_INVALID: 'AUTH_INVALID',
  AUTH_NOT_FOUND: 'AUTH_NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  FORBIDDEN: 'FORBIDDEN',
  SERVER_ERROR: 'SERVER_ERROR',
  SYNC_FAILED: 'SYNC_FAILED',
  DECRYPTION_FAILED: 'DECRYPTION_FAILED',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

export const sendApiError = (res: Response, error: ApiError): void => {
  const status = error.status || 500;
  logger.error(`[${error.code || 'UNKNOWN'}] ${error.error}`, error.details);
  res.status(status).json({ 
    error: error.error,
    code: error.code,
    ...(error.details && { details: error.details })
  });
};

export const sendValidationError = (res: Response, issues: any[]): void => {
  const errorMsg = issues[0]?.message || 'Validation failed';
  sendApiError(res, {
    error: errorMsg,
    code: ERROR_CODES.VALIDATION_ERROR,
    status: 400,
    details: { issues }
  });
};

export const handleControllerError = (res: Response, err: unknown, defaultMsg: string = 'Operation failed'): void => {
  if (err instanceof Error) {
    sendApiError(res, {
      error: err.message,
      code: ERROR_CODES.SERVER_ERROR,
      details: { stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined }
    });
  } else {
    sendApiError(res, { error: defaultMsg, code: ERROR_CODES.SERVER_ERROR });
  }
};

// Global error handler wrapper
export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
  
  if (isProduction) {
    logger.error('Unhandled error:', err?.message || 'Unknown error');
  } else {
    logger.error('Unhandled error:', err?.message || err);
  }
  
  res.status(500).json({ error: 'Internal Server Error', code: ERROR_CODES.SERVER_ERROR });
};

