import { Schema, model, Types } from 'mongoose';

const userSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  password: { type: String, default: null },
  displayName: { type: String, trim: true, default: null, index: true },
  
  // User role - 'user' or 'admin'
  role: { type: String, enum: ['user', 'admin'], default: 'user', index: true },
  
  // Auth provider - 'local' for email/password, 'google' for Google OAuth
  authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
  
  // Google OAuth specific fields
  isGoogleUser: { type: Boolean, default: false, index: true },
  googleId: { type: String, unique: true, sparse: true },
  googleProfile: {
    picture: { type: String, default: null },
    givenName: { type: String, default: null },
    familyName: { type: String, default: null },
  },
  
  // Email verification
  emailVerified: { type: Boolean, default: false, index: true },
  emailVerificationToken: { type: String, default: null },
  emailVerificationExpires: { type: Date, default: null },
  
  // Password reset
  passwordResetToken: { type: String, default: null },
  passwordResetExpires: { type: Date, default: null },
  
  // Account security
  failedLoginAttempts: { type: Number, default: 0 },
  accountLockedUntil: { type: Date, default: null, index: true },
  lastLoginAt: { type: Date, default: null, index: true },
  
  // Profile
  bio: { type: String, trim: true, default: null, maxlength: 500 },
  avatar: { type: String, default: null },
  
  // Client-side encryption
  encryptionSalt: { type: String, default: null },
  
  // Email drip schedule - embedded document
  emailDripSchedule: {
    day1WelcomeSent: { type: Boolean, default: false },
    day1WelcomeSentAt: { type: Date, default: null },
    day3TipsSent: { type: Boolean, default: false },
    day3TipsSentAt: { type: Date, default: null },
    day7CheckInSent: { type: Boolean, default: false },
    day7CheckInSentAt: { type: Date, default: null },
    createdAt: { type: Date, default: null },
  },
  
}, { timestamps: true });

// Compound indexes for common queries
userSchema.index({ email: 1, emailVerified: 1 });
userSchema.index({ lastLoginAt: -1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ isGoogleUser: 1, googleId: 1 });
userSchema.index({ 'emailDripSchedule.day1WelcomeSent': 1, 'emailDripSchedule.createdAt': 1 });
userSchema.index({ 'emailDripSchedule.day3TipsSent': 1, 'emailDripSchedule.createdAt': 1 });
userSchema.index({ 'emailDripSchedule.day7CheckInSent': 1, 'emailDripSchedule.createdAt': 1 });

export const User = model('User', userSchema);
