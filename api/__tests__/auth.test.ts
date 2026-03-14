import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import request from 'supertest';
import app from '../index';
import { User } from '../models/User';
import { Todo } from '../models/Todo';
import mongoose from 'mongoose';

// Test configuration
const TEST_DB_URI = process.env.TEST_DB_URI || 'mongodb://localhost:27017/todo-app-test';

describe('Auth API', () => {
  let agent: request.SuperTest<request.Response>;

beforeAll(async () => {
  await setupTestDB();
  agent = request(app);
});

import { teardownTestDB } from './test-setup';

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    try {
      await User.deleteMany({});
      await Todo.deleteMany({});
    } catch (error) {
      // Database may not be available
    }
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const response = await agent
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!',
          displayName: 'Test User'
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toContain('success');
      expect(response.body.encryptionSalt).toBeDefined();
    });

    it('should reject duplicate email', async () => {
      await agent.post('/api/auth/register').send({
        email: 'duplicate@test.com',
        password: 'TestPassword123!',
        displayName: 'First User'
      });

      const response = await agent.post('/api/auth/register').send({
        email: 'duplicate@test.com',
        password: 'DifferentPassword123!',
        displayName: 'Second User'
      });

      expect(response.status).toBe(409);
      expect(response.body.error).toContain('already');
    });

    it('should reject invalid email format', async () => {
      const response = await agent.post('/api/auth/register').send({
        email: 'not-an-email',
        password: 'TestPassword123!',
        displayName: 'Test User'
      });

      expect(response.status).toBe(400);
    });

    it('should reject weak password', async () => {
      const response = await agent.post('/api/auth/register').send({
        email: 'test2@example.com',
        password: 'weak',
        displayName: 'Test User'
      });

      expect(response.status).toBe(400);
    });

    it('should reject missing required fields', async () => {
      const response = await agent.post('/api/auth/register').send({
        email: 'test3@example.com'
      });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await agent.post('/api/auth/register').send({
        email: 'login@test.com',
        password: 'TestPassword123!',
        displayName: 'Login Test'
      });
    });

    it('should login with valid credentials', async () => {
      const response = await agent.post('/api/auth/login').send({
        email: 'login@test.com',
        password: 'TestPassword123!'
      });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('Logged in');
      expect(response.body.encryptionSalt).toBeDefined();
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should reject invalid password', async () => {
      const response = await agent.post('/api/auth/login').send({
        email: 'login@test.com',
        password: 'WrongPassword123!'
      });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Invalid');
    });

    it('should reject non-existent user', async () => {
      const response = await agent.post('/api/auth/login').send({
        email: 'nonexistent@test.com',
        password: 'TestPassword123!'
      });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should clear auth cookie on logout', async () => {
      const response = await agent.post('/api/auth/logout');

      expect(response.status).toBe(200);
      expect(response.headers['set-cookie']).toBeDefined();
    });
  });

  describe('POST /api/auth/request-password-reset', () => {
    beforeEach(async () => {
      await agent.post('/api/auth/register').send({
        email: 'reset@test.com',
        password: 'TestPassword123!',
        displayName: 'Reset Test'
      });
    });

    it('should accept valid email for password reset', async () => {
      const response = await agent.post('/api/auth/request-password-reset').send({
        email: 'reset@test.com'
      });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('If an account');
    });

    it('should not reveal if email exists', async () => {
      const response = await agent.post('/api/auth/request-password-reset').send({
        email: 'nonexistent@test.com'
      });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('If an account');
    });
  });

  describe('Security', () => {
    it('should prevent SQL injection in email', async () => {
      const response = await agent.post('/api/auth/register').send({
        email: "test' OR '1'='1",
        password: 'TestPassword123!',
        displayName: 'Test'
      });

      expect([400, 409]).toContain(response.status);
    });

    it('should prevent XSS in displayName', async () => {
      const response = await agent.post('/api/auth/register').send({
        email: 'xss@test.com',
        password: 'TestPassword123!',
        displayName: '<script>alert("xss")</script>'
      });

      expect(response.status).toBe(201);
      if (response.body.user?.displayName) {
        expect(response.body.user.displayName).not.toContain('<script>');
      }
    });
  });
});

