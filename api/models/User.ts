import { Schema, model } from 'mongoose';

const userSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  displayName: { type: String, trim: true, default: null },
  
  // User role - 'user' or 'admin'
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  
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

export const User = model('User', userSchema);