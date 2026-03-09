import { Schema, model, Types, Document } from 'mongoose';
import crypto from 'crypto';

// ============================================
// Interface for RefreshToken Document
// ============================================

export interface IRefreshToken extends Document {
  user: Types.ObjectId;
  tokenHash: string;
  tokenFamily: string;
  device: {
    type: string;
    userAgent: string | null;
    ipAddress: string | null;
    name: string;
  };
  expiresAt: Date;
  lastUsedAt: Date | null;
  revoked: boolean;
  revokedAt: Date | null;
  revocationReason: string | null;
  rotatedAt: Date | null;
  useCount: number;
  familyRevoked: boolean;
  createdAt: Date;
  updatedAt: Date;
  isExpired(): boolean;
  isValid(): boolean;
}

// ============================================
// Schema
// ============================================

const refreshTokenSchema = new Schema<IRefreshToken>({
  user: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    index: true 
  },
  
  // Hashed refresh token - never store plain tokens
  tokenHash: { 
    type: String, 
    required: true, 
    unique: true 
  },
  
  // Token family for rotation detection (prevents token reuse attacks)
  tokenFamily: { 
    type: String, 
    default: () => crypto.randomBytes(16).toString('hex'),
    index: true 
  },
  
  // Device/client information
  device: {
    type: { type: String, default: 'web' },
    userAgent: { type: String, default: null },
    ipAddress: { type: String, default: null },
    name: { type: String, default: 'Unknown Device' },
  },
  
  // Expiration - default 30 days
  expiresAt: { 
    type: Date, 
    required: true,
    index: true 
  },
  
  // Last used timestamp
  lastUsedAt: { 
    type: Date, 
    default: null 
  },
  
  // Revocation status
  revoked: { 
    type: Boolean, 
    default: false 
  },
  
  // Revoked at timestamp
  revokedAt: { 
    type: Date, 
    default: null 
  },
  
  // Reason for revocation
  revocationReason: { 
    type: String, 
    default: null 
  },
  
  // Rotation tracking
  rotatedAt: { 
    type: Date, 
    default: null 
  },
  
  // Number of times this token has been used
  useCount: { 
    type: Number, 
    default: 0 
  },
  
  // Family revoked - if true, all tokens in this family are invalid
  familyRevoked: { 
    type: Boolean, 
    default: false,
    index: true 
  },

}, { timestamps: true });

// Compound indexes for common queries
refreshTokenSchema.index({ user: 1, revoked: 1 });
refreshTokenSchema.index({ expiresAt: 1, revoked: 1 });
refreshTokenSchema.index({ tokenFamily: 1, revoked: 1 });
refreshTokenSchema.index({ user: 1, createdAt: -1 });

// ============================================
// Static Methods
// ============================================

/**
 * Generate a new refresh token
 */
refreshTokenSchema.statics.generateToken = function(): string {
  return crypto.randomBytes(64).toString('hex');
};

/**
 * Hash a token for storage
 */
refreshTokenSchema.statics.hashToken = function(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Create a new refresh token for a user
 */
refreshTokenSchema.statics.createForUser = async function(
  userId: string | Types.ObjectId,
  options?: {
    device?: { type?: string; userAgent?: string; ipAddress?: string; name?: string };
    expiresInDays?: number;
  }
): Promise<{ token: string; refreshToken: IRefreshToken }> {
  const token = (this as any).generateToken();
  const tokenHash = (this as any).hashToken(token);
  
  const expiresInDays = options?.expiresInDays || 30;
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
  
  const refreshToken = await (this as any).create({
    user: userId,
    tokenHash,
    device: options?.device || { type: 'web' },
    expiresAt,
  });
  
  return { token, refreshToken };
};

/**
 * Validate and consume a refresh token (with rotation) - ATOMIC operation
 */
refreshTokenSchema.statics.validateAndConsume = async function(
  token: string,
  options?: {
    rotate?: boolean;
    device?: { type?: string; userAgent?: string; ipAddress?: string; name?: string };
  }
): Promise<{
  valid: boolean;
  userId?: string;
  newToken?: string;
  reason?: string;
}> {
  const tokenHash = (this as any).hashToken(token);
  
  // Use findOneAndUpdate for atomic operation
  const refreshToken = await (this as any).findOneAndUpdate(
    { 
      tokenHash,
      revoked: false,
      familyRevoked: false,
      expiresAt: { $gt: new Date() }
    },
    {
      $set: { lastUsedAt: new Date() },
      $inc: { useCount: 1 }
    },
    { new: true }
  );
  
  if (!refreshToken) {
    return { valid: false, reason: 'Invalid or expired token' };
  }
  
  if (refreshToken.familyRevoked) {
    return { valid: false, reason: 'Token family revoked' };
  }
  
  if (options?.rotate !== false) {
    const newToken = (this as any).generateToken();
    const newTokenHash = (this as any).hashToken(newToken);
    
    // Mark old token as rotated
    refreshToken.rotatedAt = new Date();
    refreshToken.tokenFamily = crypto.randomBytes(16).toString('hex');
    await refreshToken.save();
    
    const expiresInDays = 30;
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
    
    await (this as any).create({
      user: refreshToken.user,
      tokenHash: newTokenHash,
      tokenFamily: refreshToken.tokenFamily,
      device: options?.device || refreshToken.device,
      expiresAt,
    });
    
    return { 
      valid: true, 
      userId: refreshToken.user.toString(),
      newToken 
    };
  }
  
  return { valid: true, userId: refreshToken.user.toString() };
};

/**
 * Revoke a specific token
 */
refreshTokenSchema.statics.revokeToken = async function(
  token: string,
  reason?: string
): Promise<boolean> {
  const tokenHash = (this as any).hashToken(token);
  
  const result = await (this as any).findOneAndUpdate(
    { tokenHash },
    { 
      $set: { 
        revoked: true, 
        revokedAt: new Date(),
        revocationReason: reason || 'User revoked'
      }
    }
  );
  
  return !!result;
};

/**
 * Revoke all tokens for a user
 */
refreshTokenSchema.statics.revokeAllForUser = async function(
  userId: string | Types.ObjectId,
  reason?: string
): Promise<number> {
  const result = await (this as any).updateMany(
    { user: userId, revoked: false },
    { 
      $set: { 
        revoked: true, 
        revokedAt: new Date(),
        revocationReason: reason || 'User revoked all sessions'
      }
    }
  );
  
  return result.modifiedCount;
};

/**
 * Revoke all tokens in a family
 */
refreshTokenSchema.statics.revokeTokenFamily = async function(
  token: string
): Promise<number> {
  const tokenHash = (this as any).hashToken(token);
  
  const tokenDoc = await (this as any).findOne({ tokenHash });
  if (!tokenDoc) return 0;
  
  const result = await (this as any).updateMany(
    { tokenFamily: tokenDoc.tokenFamily },
    { 
      $set: { 
        familyRevoked: true,
        revoked: true,
        revokedAt: new Date(),
        revocationReason: 'Token reuse detected - possible theft'
      }
    }
  );
  
  return result.modifiedCount;
};

/**
 * Revoke all tokens except current one
 */
refreshTokenSchema.statics.revokeOthersForUser = async function(
  userId: string | Types.ObjectId,
  currentTokenHash: string
): Promise<number> {
  const result = await (this as any).updateMany(
    { 
      user: userId, 
      revoked: false,
      tokenHash: { $ne: currentTokenHash }
    },
    { 
      $set: { 
        revoked: true, 
        revokedAt: new Date(),
        revocationReason: 'User logged out from another device'
      }
    }
  );
  
  return result.modifiedCount;
};

/**
 * Get all active tokens for a user
 */
refreshTokenSchema.statics.getActiveTokens = async function(
  userId: string | Types.ObjectId,
  options?: { limit?: number; skip?: number }
): Promise<Array<{
  id: string;
  device: { type: string; name: string; userAgent: string | null };
  createdAt: Date;
  lastUsedAt: Date | null;
  expiresAt: Date;
  useCount: number;
}>> {
  const limit = options?.limit || 20;
  const skip = options?.skip || 0;
  
  const tokens = await (this as any).find(
    { 
      user: userId, 
      revoked: false,
      familyRevoked: false,
      expiresAt: { $gt: new Date() }
    },
    {
      tokenHash: 0,
      tokenFamily: 0,
    }
  )
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit)
  .lean();
  
  return tokens.map((t: any) => ({
    id: t._id.toString(),
    device: t.device,
    createdAt: t.createdAt,
    lastUsedAt: t.lastUsedAt,
    expiresAt: t.expiresAt,
    useCount: t.useCount,
  }));
};

/**
 * Cleanup expired tokens
 */
refreshTokenSchema.statics.cleanupExpired = async function(): Promise<number> {
  const result = await (this as any).deleteMany({
    expiresAt: { $lt: new Date() }
  });
  
  return result.deletedCount;
};

// ============================================
// Instance Methods
// ============================================

refreshTokenSchema.methods.isExpired = function(): boolean {
  return this.expiresAt < new Date();
};

refreshTokenSchema.methods.isValid = function(): boolean {
  return !this.revoked && !this.familyRevoked && !this.isExpired();
};

export const RefreshToken = model<IRefreshToken>('RefreshToken', refreshTokenSchema);
export default RefreshToken;

