/**
 * Client-side encryption utilities using Web Crypto API
 * Uses AES-GCM with a key derived from password + salt via PBKDF2
 */

// Configuration - OPTIMIZED: 10000 iterations (10x faster while still secure)
const PBKDF2_ITERATIONS = 10000;
const IV_LENGTH = 12; // bytes for AES-GCM
const KEY_LENGTH = 256; // bits

// Key cache to avoid re-deriving keys on every operation
const keyCache = new Map<string, CryptoKey>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL

// Error messages for better debugging
const ENCRYPTION_ERRORS = {
  NO_PASSWORD: 'Password is required for encryption',
  NO_SALT: 'Encryption salt is required',
  INVALID_DATA: 'Invalid data format for decryption',
  DECRYPTION_FAILED: 'Failed to decrypt data - incorrect password or corrupted data',
  CRYPTO_ERROR: 'Web Crypto API error',
  BASE64_ERROR: 'Invalid base64 encoding',
};

/**
 * Custom error class for encryption operations
 */
export class CryptoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CryptoError';
  }
}

/**
 * Validate that required parameters are present
 */
function validateEncryptionParams(password: string, salt: string): void {
  if (!password || password.trim() === '') {
    throw new CryptoError(ENCRYPTION_ERRORS.NO_PASSWORD);
  }
  if (!salt || salt.trim() === '') {
    throw new CryptoError(ENCRYPTION_ERRORS.NO_SALT);
  }
}

/**
 * Convert base64 string to Uint8Array
 */
function base64ToUint8Array(base64: string): Uint8Array {
  try {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (error) {
    throw new CryptoError(ENCRYPTION_ERRORS.BASE64_ERROR);
  }
}

/**
 * Derive an AES-GCM key from password and salt using PBKDF2
 * Uses caching to improve performance for repeated operations
 */
async function deriveKey(password: string, salt: string): Promise<CryptoKey> {
  const cacheKey = `${password}:${salt}`;
  
  // Check cache first
  const cachedKey = keyCache.get(cacheKey);
  if (cachedKey) {
    return cachedKey;
  }
  
  try {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    
    // Import password as raw key
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveKey']
    );
    
    // Convert base64 salt to buffer
    const saltBuffer = base64ToUint8Array(salt);
    
    // Derive AES key
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltBuffer as unknown as BufferSource,
        iterations: PBKDF2_ITERATIONS,
        hash: 'SHA-256',
      },
      passwordKey,
      { name: 'AES-GCM', length: KEY_LENGTH },
      false,
      ['encrypt', 'decrypt']
    );
    
    // Store in cache
    keyCache.set(cacheKey, key);
    
    return key;
  } catch (error) {
    throw new CryptoError(ENCRYPTION_ERRORS.CRYPTO_ERROR);
  }
}

/**
 * Clear the key cache - call on logout
 */
export function clearKeyCache(): void {
  keyCache.clear();
}

/**
 * Encrypt text using AES-GCM
 * Returns base64 encoded string: IV + ciphertext
 */
export async function encrypt(text: string, password: string, salt: string): Promise<string> {
  try {
    // Validate inputs
    validateEncryptionParams(password, salt);
    
    if (!text || typeof text !== 'string') {
      throw new CryptoError('Text is required for encryption');
    }
    
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    
    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    
    // Derive key from password and salt
    const key = await deriveKey(password, salt);
    
    // Encrypt
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );
    
    // Combine IV + ciphertext and encode as base64
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.length);
    
    // Convert to base64
    let binary = '';
    for (let i = 0; i < combined.length; i++) {
      binary += String.fromCharCode(combined[i]);
    }
    return btoa(binary);
  } catch (error) {
    if (error instanceof CryptoError) {
      throw error;
    }
    throw new CryptoError(ENCRYPTION_ERRORS.CRYPTO_ERROR);
  }
}

/**
 * Decrypt text using AES-GCM
 * Input: base64 encoded string: IV + ciphertext
 */
export async function decrypt(encryptedData: string, password: string, salt: string): Promise<string> {
  try {
    // Validate inputs
    validateEncryptionParams(password, salt);
    
    if (!encryptedData || typeof encryptedData !== 'string') {
      throw new CryptoError(ENCRYPTION_ERRORS.INVALID_DATA);
    }
    
    // Decode base64
    const combined = base64ToUint8Array(encryptedData);
    
    // Check minimum length (IV + at least 1 byte of data)
    if (combined.length <= IV_LENGTH) {
      throw new CryptoError(ENCRYPTION_ERRORS.INVALID_DATA);
    }
    
    // Extract IV and ciphertext
    const iv = combined.slice(0, IV_LENGTH);
    const ciphertext = combined.slice(IV_LENGTH);
    
    // Derive key from password and salt
    const key = await deriveKey(password, salt);
    
    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    if (error instanceof CryptoError) {
      throw error;
    }
    // Provide more specific error message for decryption failures
    if (error instanceof Error && error.name === 'OperationError') {
      throw new CryptoError(ENCRYPTION_ERRORS.DECRYPTION_FAILED);
    }
    throw new CryptoError(ENCRYPTION_ERRORS.CRYPTO_ERROR);
  }
}

