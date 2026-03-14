import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import request from 'supertest';
import app from '../index';
import { User } from '../models/User';
import { Todo } from '../models/Todo';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

// Test configuration
const TEST_DB_URI = process.env.TEST_DB_URI || 'mongodb://localhost:27017/todo-app-test';
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

describe('Todo API', () => {
  let agent: request.SuperTest<request.Response>;
  let authToken: string;
  let testUserId: string;

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

    // Create a test user and get auth token
    const registerResponse = await agent.post('/api/auth/register').send({
      email: 'todo@test.com',
      password: 'TestPassword123!',
      displayName: 'Todo Test'
    });

    testUserId = registerResponse.body.user.id;
    
    // Generate JWT token for authenticated requests
    authToken = jwt.sign({ id: testUserId }, JWT_SECRET, { expiresIn: '7d' });
  });

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Cookie': `auth_token=${authToken}`
  });

  describe('GET /api/todos', () => {
    it('should return empty array when no todos exist', async () => {
      const response = await agent.get('/api/todos').set(getAuthHeaders());

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return todos for authenticated user', async () => {
      await agent.post('/api/todos').set(getAuthHeaders()).send({
        text: 'Test todo',
        category: 'work',
        priority: 'high'
      });

      const response = await agent.get('/api/todos').set(getAuthHeaders());

      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].text).toBe('Test todo');
    });

    it('should reject unauthenticated requests', async () => {
      const response = await agent.get('/api/todos');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/todos', () => {
    it('should create a new todo', async () => {
      const response = await agent
        .post('/api/todos')
        .set(getAuthHeaders())
        .send({
          text: 'New todo item',
          category: 'personal',
          priority: 'medium'
        });

      expect(response.status).toBe(201);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.some((t: any) => t.text === 'New todo item')).toBe(true);
    });

    it('should create todo with default category and priority', async () => {
      const response = await agent
        .post('/api/todos')
        .set(getAuthHeaders())
        .send({
          text: 'Simple todo'
        });

      expect(response.status).toBe(201);
    });

    it('should reject todo without text', async () => {
      const response = await agent
        .post('/api/todos')
        .set(getAuthHeaders())
        .send({
          category: 'work'
        });

      expect(response.status).toBe(400);
    });

    it('should reject invalid category', async () => {
      const response = await agent
        .post('/api/todos')
        .set(getAuthHeaders())
        .send({
          text: 'Test',
          category: 'invalid-category'
        });

      expect(response.status).toBe(400);
    });

    it('should reject invalid priority', async () => {
      const response = await agent
        .post('/api/todos')
        .set(getAuthHeaders())
        .send({
          text: 'Test',
          priority: 'invalid-priority'
        });

      expect(response.status).toBe(400);
    });

    it('should reject todo exceeding max text length', async () => {
      const longText = 'A'.repeat(501);
      const response = await agent
        .post('/api/todos')
        .set(getAuthHeaders())
        .send({
          text: longText
        });

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/todos/:id', () => {
    let todoId: string;

    beforeEach(async () => {
      const createResponse = await agent
        .post('/api/todos')
        .set(getAuthHeaders())
        .send({
          text: 'Todo to update',
          category: 'work',
          priority: 'low'
        });

      const todos = createResponse.body;
      todoId = todos.find((t: any) => t.text === 'Todo to update')._id;
    });

    it('should update todo text', async () => {
      const response = await agent
        .put(`/api/todos/${todoId}`)
        .set(getAuthHeaders())
        .send({
          text: 'Updated todo text'
        });

      expect(response.status).toBe(200);
      expect(response.body.text).toBe('Updated todo text');
    });

    it('should update todo completion status', async () => {
      const response = await agent
        .put(`/api/todos/${todoId}`)
        .set(getAuthHeaders())
        .send({
          completed: true
        });

      expect(response.status).toBe(200);
      expect(response.body.completed).toBe(true);
    });

    it('should update todo category', async () => {
      const response = await agent
        .put(`/api/todos/${todoId}`)
        .set(getAuthHeaders())
        .send({
          category: 'health'
        });

      expect(response.status).toBe(200);
      expect(response.body.category).toBe('health');
    });

    it('should update todo priority', async () => {
      const response = await agent
        .put(`/api/todos/${todoId}`)
        .set(getAuthHeaders())
        .send({
          priority: 'high'
        });

      expect(response.status).toBe(200);
      expect(response.body.priority).toBe('high');
    });

    it('should reject update for invalid todo ID', async () => {
      const response = await agent
        .put('/api/todos/invalidid123')
        .set(getAuthHeaders())
        .send({
          text: 'Updated'
        });

      expect(response.status).toBe(400);
    });

    it('should reject unauthenticated update', async () => {
      const response = await agent
        .put(`/api/todos/${todoId}`)
        .send({
          text: 'Hacked!'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/todos/:id', () => {
    let todoId: string;

    beforeEach(async () => {
      const createResponse = await agent
        .post('/api/todos')
        .set(getAuthHeaders())
        .send({
          text: 'Todo to delete',
          category: 'work'
        });

      const todos = createResponse.body;
      todoId = todos.find((t: any) => t.text === 'Todo to delete')._id;
    });

    it('should delete a todo', async () => {
      const response = await agent
        .delete(`/api/todos/${todoId}`)
        .set(getAuthHeaders());

      expect(response.status).toBe(200);
      
      const getResponse = await agent.get('/api/todos').set(getAuthHeaders());
      const todos = getResponse.body;
      expect(todos.find((t: any) => t._id === todoId)).toBeUndefined();
    });

    it('should reject delete for invalid todo ID', async () => {
      const response = await agent
        .delete('/api/todos/invalidid123')
        .set(getAuthHeaders());

      expect(response.status).toBe(400);
    });

    it('should reorder remaining todos after deletion', async () => {
      await agent.post('/api/todos').set(getAuthHeaders()).send({ text: 'Todo 1' });
      await agent.post('/api/todos').set(getAuthHeaders()).send({ text: 'Todo 2' });
      await agent.post('/api/todos').set(getAuthHeaders()).send({ text: 'Todo 3' });

      let getResponse = await agent.get('/api/todos').set(getAuthHeaders());
      let todos = getResponse.body;
      
      const todoToDelete = todos.find((t: any) => t.text === 'Todo 2');
      await agent.delete(`/api/todos/${todoToDelete._id}`).set(getAuthHeaders());

      getResponse = await agent.get('/api/todos').set(getAuthHeaders());
      todos = getResponse.body;
      
      const orders = todos.map((t: any) => t.order);
      expect(orders).toEqual([0, 1]);
    });
  });

  describe('POST /api/todos/reorder', () => {
    let todos: any[];

    beforeEach(async () => {
      await agent.post('/api/todos').set(getAuthHeaders()).send({ text: 'First' });
      await agent.post('/api/todos').set(getAuthHeaders()).send({ text: 'Second' });
      await agent.post('/api/todos').set(getAuthHeaders()).send({ text: 'Third' });

      const response = await agent.get('/api/todos').set(getAuthHeaders());
      todos = response.body;
    });

    it('should reorder todos', async () => {
      const reorderData = [
        { id: todos[2]._id, order: 0 },
        { id: todos[0]._id, order: 1 },
        { id: todos[1]._id, order: 2 },
      ];

      const response = await agent
        .post('/api/todos/reorder')
        .set(getAuthHeaders())
        .send({ todos: reorderData });

      expect(response.status).toBe(200);
      const updatedTodos = response.body;
      
      const firstTodo = updatedTodos.find((t: any) => t._id === todos[2]._id);
      expect(firstTodo.order).toBe(0);
    });

    it('should reject invalid todo id in reorder', async () => {
      const response = await agent
        .post('/api/todos/reorder')
        .set(getAuthHeaders())
        .send({
          todos: [{ id: 'invalid-id', order: 0 }]
        });

      expect(response.status).toBe(400);
    });
  });
});

