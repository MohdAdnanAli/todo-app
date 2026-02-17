import xss from 'xss';

// Sanitize user input to prevent XSS
export const sanitizeInput = (input: string): string => {
  return xss(input, {
    whiteList: {},
    stripIgnoredTag: true,
  });
};

// Validate password strength
export const validatePasswordStrength = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < 8) errors.push('Password must be at least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('Password must contain an uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('Password must contain a lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('Password must contain a number');
  if (!/[!@#$%^&*]/.test(password)) errors.push('Password must contain a special character (!@#$%^&*)');

  return {
    valid: errors.length === 0,
    errors,
  };
};

// Generate email verification token
export const generateVerificationToken = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Generate password reset token
export const generateResetToken = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};
