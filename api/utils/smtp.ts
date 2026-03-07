import nodemailer from 'nodemailer';
import { logger } from './logger';

// SMTP Configuration Interface
export interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from?: string;
}

/**
 * Check if SMTP credentials are configured
 */
export const isSMTPConfigured = (): boolean => {
  const config = getSMTPConfig();

  // Supports both port 587 (STARTTLS) and port 465 (implicit TLS)
 
export const createTransporter = (): nodemailer.Transporter | null => {
  const config = getSMTPConfig();

  // Validate credentials
  if (!config.host || !config.user || !config.pass) {
    logger.warn('[SMTP] Credentials not configured. Email sending disabled.');
    return null;
  }

  // Determine if we should use TLS based on port
  // Port 587 uses STARTTLS, Port 465 uses implicit TLS
  const useTLS = config.port === 587 || config.port === 25;
  const useSecure = config.port === 465 || config.secure;

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: useSecure,
    requireTLS: useTLS,
    tls: {
      // Allow self-signed certificates for development (Mailtrap)
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    },
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000, // 10 seconds
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  logger.info(`[SMTP] Transport configured: ${config.host}:${config.port} (secure: ${useSecure || useTLS})`);
  return transporter;
};

/**
 * Get a reusable transporter instance
 * Uses singleton pattern to avoid creating multiple connections
 */
let cachedTransporter: nodemailer.Transporter | null = null;

export const getTransporter = (): nodemailer.Transporter | null => {
  if (!cachedTransporter) {
    cachedTransporter = createTransporter();
  }
  return cachedTransporter;
};

/**
 * Test SMTP connection
 */
export const testSMTPConnection = async (): Promise<{ success: boolean; message: string }> => {
  const transporter = createTransporter();
  
  if (!transporter) {
    return { success: false, message: 'SMTP not configured' };
  }

  try {
    await transporter.verify();
    return { success: true, message: 'SMTP connection successful!' };
  } catch (error: any) {
    logger.error('[SMTP] Connection test failed:', error);
    return { success: false, message: `Connection failed: ${error.message}` };
  }
};

/**
 * Send email with error handling
 */
export const sendEmail = async (options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<boolean> => {
  const transporter = getTransporter();
  const config = getSMTPConfig();

  if (!transporter) {
    logger.warn('[SMTP] Cannot send email - transporter not available');
    return false;
  }

  try {
    await transporter.sendMail({
      from: config.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    logger.info(`[SMTP] Email sent to ${options.to}`);
    return true;
  } catch (error: any) {
    logger.error('[SMTP] Failed to send email:', error);
    return false;
  }
};

/**
 * Reset cached transporter (useful for testing or reconfiguring)
 */
export const resetTransporter = (): void => {
  cachedTransporter = null;
};

