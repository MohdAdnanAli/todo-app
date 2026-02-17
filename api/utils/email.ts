import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  } : undefined,
});

export const sendVerificationEmail = async (email: string, token: string): Promise<boolean> => {
  try {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@todoapp.com',
      to: email,
      subject: 'Verify your email address',
      html: `
        <h2>Email Verification</h2>
        <p>Click the link below to verify your email:</p>
        <a href="${verificationUrl}">Verify Email</a>
        <p>Or paste this link: ${verificationUrl}</p>
        <p>This link expires in 24 hours.</p>
      `,
    });
    return true;
  } catch (err) {
    console.error('Failed to send verification email:', err);
    return false;
  }
};

export const sendPasswordResetEmail = async (email: string, token: string): Promise<boolean> => {
  try {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@todoapp.com',
      to: email,
      subject: 'Reset your password',
      html: `
        <h2>Password Reset</h2>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>Or paste this link: ${resetUrl}</p>
        <p>This link expires in 1 hour.</p>
      `,
    });
    return true;
  } catch (err) {
    console.error('Failed to send password reset email:', err);
    return false;
  }
};
