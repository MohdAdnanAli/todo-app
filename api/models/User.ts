import { Schema, model } from 'mongoose';

const userSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  displayName: { type: String, trim: true, default: null },
  encryptionSalt: { type: String, default: null }, // Salt for deriving encryption key from password (generated on first login for legacy users)
}, { timestamps: true });

export const User = model('User', userSchema);