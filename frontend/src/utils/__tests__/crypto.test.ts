import { describe, it, expect, beforeEach, vi } from 'vitest';
import { encrypt, decrypt, clearKeyCache, CryptoError, DecryptionError } from '../crypto';

describe('crypto utilities', () => {
  const testPassword = 'testPassword123';
  const testSalt = 'dGhpc2lzYXNhbHR0ZXN0';

  beforeEach(() => {
    clearKeyCache();
    vi.clearAllMocks();
  });

  describe('encrypt', () => {
    it('should encrypt text and return base64 string', async () => {
      const plaintext = 'Hello, World!';
      const result = await encrypt(plaintext, testPassword, testSalt);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      expect(result).toMatch(/^[A-Za-z0-9+/]+=*$/);
    });

    it('should produce different ciphertext for same plaintext (random IV)', async () => {
      const plaintext = 'Hello, World!';
      
      const result1 = await encrypt(plaintext, testPassword, testSalt);
      const result2 = await encrypt(plaintext, testPassword, testSalt);

      expect(result1).not.toBe(result2);
    });

    it('should throw error for empty string', async () => {
      await expect(encrypt('', testPassword, testSalt)).rejects.toThrow(CryptoError);
    });

    it('should throw error when password is empty', async () => {
      await expect(encrypt('text', '', testSalt)).rejects.toThrow(CryptoError);
    });

    it('should throw error when salt is empty', async () => {
      await expect(encrypt('text', testPassword, '')).rejects.toThrow(CryptoError);
    });

    it('should throw error when password is whitespace only', async () => {
      await expect(encrypt('text', '   ', testSalt)).rejects.toThrow(CryptoError);
    });

    it('should handle long text', async () => {
      const longText = 'A'.repeat(10000);
      const result = await encrypt(longText, testPassword, testSalt);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle special characters', async () => {
      const specialText = '!@#$%^&*()_+-=[]{}|;:,.<>?🎉emoji';
      const result = await encrypt(specialText, testPassword, testSalt);
      expect(result).toBeDefined();
    });

    it('should handle unicode characters', async () => {
      const unicodeText = '你好世界🌍🌎🌏';
      const result = await encrypt(unicodeText, testPassword, testSalt);
      expect(result).toBeDefined();
    });

    it('should handle JSON data', async () => {
      const jsonData = JSON.stringify({ name: 'test', value: 123, nested: { a: 1 } });
      const result = await encrypt(jsonData, testPassword, testSalt);
      expect(result).toBeDefined();
    });
  });

  describe('decrypt', () => {
    it('should decrypt encrypted text correctly', async () => {
      const plaintext = 'Hello, World!';
      const encrypted = await encrypt(plaintext, testPassword, testSalt);
      
      const decrypted = await decrypt(encrypted, testPassword, testSalt);
      expect(decrypted).toBe(plaintext);
    });

    it('should decrypt long text', async () => {
      const longText = 'A'.repeat(10000);
      const encrypted = await encrypt(longText, testPassword, testSalt);
      
      const decrypted = await decrypt(encrypted, testPassword, testSalt);
      expect(decrypted).toBe(longText);
    });

    it('should decrypt special characters', async () => {
      const specialText = '!@#$%^&*()_+-=[]{}|;:,.<>?🎉emoji';
      const encrypted = await encrypt(specialText, testPassword, testSalt);
      
      const decrypted = await decrypt(encrypted, testPassword, testSalt);
      expect(decrypted).toBe(specialText);
    });

    it('should decrypt unicode characters', async () => {
      const unicodeText = '你好世界🌍🌎🌏';
      const encrypted = await encrypt(unicodeText, testPassword, testSalt);
      
      const decrypted = await decrypt(encrypted, testPassword, testSalt);
      expect(decrypted).toBe(unicodeText);
    });

    it('should decrypt JSON data', async () => {
      const jsonData = JSON.stringify({ name: 'test', value: 123, nested: { a: 1 } });
      const encrypted = await encrypt(jsonData, testPassword, testSalt);
      
      const decrypted = await decrypt(encrypted, testPassword, testSalt);
      expect(JSON.parse(decrypted)).toEqual(JSON.parse(jsonData));
    });

    it('should handle wrong password gracefully (returns encrypted data)', async () => {
      const plaintext = 'Hello, World!';
      const encrypted = await encrypt(plaintext, testPassword, testSalt);
      
      const result = await decrypt(encrypted, 'wrongPassword', testSalt);
      expect(result).toBe(encrypted);
    });

    it('should handle invalid base64 data gracefully', async () => {
      // Invalid data returns as plain text
      const result = await decrypt('invalidbase64!!!', testPassword, testSalt);
      expect(result).toBe('invalidbase64!!!');
    });

    it('should handle truncated encrypted data', async () => {
      const encrypted = await encrypt('Hello', testPassword, testSalt);
      const truncated = encrypted.slice(0, 10);
      // Returns as plain text since it's too short
      const result = await decrypt(truncated, testPassword, testSalt);
      expect(result).toBe(truncated);
    });

    it('should handle empty password gracefully', async () => {
      const encrypted = await encrypt('text', testPassword, testSalt);
      const result = await decrypt(encrypted, '', testSalt);
      expect(result).toBe(encrypted);
    });

    it('should handle empty salt gracefully', async () => {
      const encrypted = await encrypt('text', testPassword, testSalt);
      const result = await decrypt(encrypted, testPassword, '');
      expect(result).toBe(encrypted);
    });

    it('should handle tampered ciphertext gracefully', async () => {
      const encrypted = await encrypt('Hello', testPassword, testSalt);
      const tampered = encrypted.slice(0, -1) + (encrypted.slice(-1) === 'A' ? 'B' : 'A');
      
      const result = await decrypt(tampered, testPassword, testSalt);
      expect(result).toBe(tampered);
    });
  });

  describe('round-trip consistency', () => {
    it('should maintain data integrity through multiple encrypt/decrypt cycles', async () => {
      const original = 'Test data for multiple cycles';
      
      let current = original;
      for (let i = 0; i < 5; i++) {
        const encrypted = await encrypt(current, testPassword, testSalt);
        current = await decrypt(encrypted, testPassword, testSalt);
      }
      
      expect(current).toBe(original);
    });

    it('should work with different salt values', async () => {
      const plaintext = 'Test with different salts';
      const salt1 = 'c2FsdDEyMw==';
      const salt2 = 'c2FsdDQ1Ng==';
      
      const encrypted1 = await encrypt(plaintext, testPassword, salt1);
      const encrypted2 = await encrypt(plaintext, testPassword, salt2);
      
      expect(encrypted1).not.toBe(encrypted2);
      expect(await decrypt(encrypted1, testPassword, salt1)).toBe(plaintext);
      expect(await decrypt(encrypted2, testPassword, salt2)).toBe(plaintext);
    });
  });

  describe('clearKeyCache', () => {
    it('should clear cached keys', async () => {
      await encrypt('test', testPassword, testSalt);
      clearKeyCache();
      const result = await encrypt('test2', testPassword, testSalt);
      expect(result).toBeDefined();
    });
  });

  describe('key derivation caching', () => {
    it('should use cached key for repeated operations', async () => {
      const plaintext = 'Test caching';
      
      const result1 = await encrypt(plaintext, testPassword, testSalt);
      const result2 = await encrypt(plaintext, testPassword, testSalt);
      
      expect(result1).not.toBe(result2);
      expect(await decrypt(result1, testPassword, testSalt)).toBe(plaintext);
      expect(await decrypt(result2, testPassword, testSalt)).toBe(plaintext);
    });
  });
});

