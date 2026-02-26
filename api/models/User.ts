import { Schema, model } from 'mongoose';

const userSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, default: null },
  displayName: { type: String, trim: true, default: null },
  
  // User role - 'user' or 'admin'
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  
  // Auth provider - 'local' for email/password, 'google' for Google OAuth, 'supabase' for Supabase OAuth
  authProvider: { type: String, enum: ['local', 'google', 'supabase'], default: 'local' },
  
  // Google OAuth specific fields
  isGoogleUser: { type: Boolean, default: false },
  googleId: { type: String, default: null, unique: true, sparse: true },
  googleProfile: {
    picture: { type: String, default: null },
    givenName: { type: String, default: null },
    familyName: { type: String, default: null },
  },
  
  // Supabase OAuth specific fields
  supabaseId: { type: String, default: null, unique: true, sparse: true },
  
  // Email verification
  emailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String, default: null },
  emailVerificationExpires: { type: Date, default: null },
  
  // Password reset
  passwordResetToken: { type: String, default: null },
  passwordResetExpires: { type: Date, default: null },
  
  // Account security
  failedLoginAttempts: { type: Number, default: 0 },
  accountLockedUntil: { type: Date, default: null },
  lastLoginAt: { type: Date, default: null },
  
  // Profile
  bio: { type: String, trim: true, default: null, maxlength: 500 },
  avatar: { type: String, default: null },
  
  // Client-side encryption
  encryptionSalt: { type: String, default: null },
  
}, { timestamps: true });

// Note: email, googleId, and supabaseId indexes are already created via unique: true in schema fields

export const User = model('User', userSchema);
