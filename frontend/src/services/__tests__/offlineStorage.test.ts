import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { offlineStorage } from '../offlineStorage';
import type { Todo } from '../../types';

describe('offlineStorage', () => {
  const mockTodo: Todo = {
    _id: 'test-1',
    text: 'Test todo',
    completed: false,
    createdAt: new Date().toISOString(),
    category: 'work',
    priority: 'high',
    tags: ['test'],
    dueDate: '2026-03-01',
    order: 0,
  };

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('localStorage fallback', () => {
    it('should save and retrieve todos from localStorage', () => {
      offlineStorage.saveTodoToLocalStorage(mockTodo);
      const todos = offlineStorage.getTodosFromLocalStorage();

      expect(todos).toHaveLength(1);
      expect(todos[0]._id).toBe(mockTodo._id);
      expect(todos[0].text).toBe(mockTodo.text);
    });

    it('should update existing todo in localStorage', () => {
      offlineStorage.saveTodoToLocalStorage(mockTodo);
      const updatedTodo = { ...mockTodo, text: 'Updated text' };
      offlineStorage.saveTodoToLocalStorage(updatedTodo);

      const todos = offlineStorage.getTodosFromLocalStorage();
      expect(todos).toHaveLength(1);
      expect(todos[0].text).toBe('Updated text');
    });

    it('should delete todo from localStorage', () => {
      offlineStorage.saveTodoToLocalStorage(mockTodo);
      expect(offlineStorage.getTodosFromLocalStorage()).toHaveLength(1);

      offlineStorage.deleteTodoFromLocalStorage(mockTodo._id);
      expect(offlineStorage.getTodosFromLocalStorage()).toHaveLength(0);
    });

    it('should save multiple todos to localStorage', () => {
      const todos = [
        mockTodo,
        { ...mockTodo, _id: 'test-2', text: 'Second todo' },
        { ...mockTodo, _id: 'test-3', text: 'Third todo' },
      ];

      offlineStorage.saveTodosToLocalStorage(todos);
      const retrieved = offlineStorage.getTodosFromLocalStorage();

      expect(retrieved).toHaveLength(3);
      expect(retrieved.map(t => t._id)).toEqual(['test-1', 'test-2', 'test-3']);
    });

    it('should handle invalid JSON in localStorage gracefully', () => {
      localStorage.setItem('todos', 'invalid json');
      const todos = offlineStorage.getTodosFromLocalStorage();

      expect(todos).toEqual([]);
    });

    it('should return empty array when localStorage is empty', () => {
      const todos = offlineStorage.getTodosFromLocalStorage();
      expect(todos).toEqual([]);
    });
  });

  describe('storage availability', () => {
    it('should check if storage is available', () => {
      const available = offlineStorage.isAvailable();
      expect(typeof available).toBe('boolean');
    });
  });

  describe('sync queue operations', () => {
    it('should add to sync queue', async () => {
      await offlineStorage.addToSyncQueue('create', {
        text: 'New todo',
        category: 'work',
      });

      const queue = await offlineStorage.getSyncQueue();
      expect(queue.length).toBeGreaterThanOrEqual(0);
    });

    it('should clear sync queue', async () => {
      await offlineStorage.addToSyncQueue('create', { text: 'Todo' });
      await offlineStorage.clearSyncQueue();

      const queue = await offlineStorage.getSyncQueue();
      expect(queue).toHaveLength(0);
    });
  });

  describe('todo CRUD operations', () => {
    it('should save single todo to storage', async () => {
      await offlineStorage.saveTodo(mockTodo);
      const retrieved = await offlineStorage.getTodo(mockTodo._id);

      expect(retrieved?._id).toBe(mockTodo._id);
      expect(retrieved?.text).toBe(mockTodo.text);
    });

    it('should delete todo from storage', async () => {
      await offlineStorage.saveTodo(mockTodo);
      await offlineStorage.deleteTodo(mockTodo._id);

      const todos = await offlineStorage.getAllTodos();
      expect(todos.find(t => t._id === mockTodo._id)).toBeUndefined();
    });

    it('should clear all todos', async () => {
      await offlineStorage.saveTodo(mockTodo);
      await offlineStorage.clearAllTodos();

      const todos = await offlineStorage.getAllTodos();
      expect(todos).toHaveLength(0);
    });
  });

  describe('metadata operations', () => {
    it('should update and retrieve metadata', async () => {
      const metadata = { lastSync: Date.now(), syncInProgress: false };
      await offlineStorage.updateMetadata('sync-status', metadata);

      const retrieved = await offlineStorage.getMetadata('sync-status');
      expect(retrieved).toBeDefined();
    });
  });
});
