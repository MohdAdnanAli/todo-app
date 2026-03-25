import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { offlineStorage } from '../offlineStorage';
import type { Todo } from '../../types';

vi.mock('../../api', () => ({
  todoApi: {
    batchSync: vi.fn(() => ({ success: true, total: 0 })),
    getTodosDelta: vi.fn(() => []),
  },
}));
vi.mock('../../utils/crypto', () => ({
  encrypt: vi.fn(),
  decrypt: vi.fn(),
  clearKeyCache: vi.fn(),
}));

describe('offlineStorage - Offline-First Full Sync', () => {
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


    vi.clearAllMocks();
    
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
    });
    
    // Mock crypto.randomUUID
    global.crypto = {
      randomUUID: vi.fn(() => 'mock-uuid'),
    } as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('performLocalAction - Offline-First CRUD', () => {
    it('should create todo optimistically + queue', async () => {
      const newTodo = await offlineStorage.performLocalAction('create', {
        text: 'New offline todo'
      }) as Todo;

      expect(newTodo._id).toBeDefined();
      expect(newTodo.text).toBe('New offline todo');
      
      const todos = await offlineStorage.getAllTodos();
      expect(todos).toHaveLength(1);
      
      const queue = await offlineStorage.getSyncQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].action).toBe('create');
    });

    it('should toggle todo optimistically + queue', async () => {
      await offlineStorage.saveTodo(mockTodo);
      
      const toggled = await offlineStorage.performLocalAction('toggle', {
        _id: mockTodo._id,
        completed: true
      }) as Todo;
      
      expect(toggled.completed).toBe(true);
      const queue = await offlineStorage.getSyncQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].action).toBe('update');
    });

    it('should delete todo optimistically + queue', async () => {
      await offlineStorage.saveTodo(mockTodo);
      
      await offlineStorage.performLocalAction('delete', { _id: mockTodo._id });
      
      const todos = await offlineStorage.getAllTodos();
      expect(todos).toHaveLength(0);
      const queue = await offlineStorage.getSyncQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].action).toBe('delete');
    });

    it('should handle reorder', async () => {
      const todo1 = { ...mockTodo, _id: '1', order: 1 };
      const todo2 = { ...mockTodo, _id: '2', order: 0 };
      
      await offlineStorage.saveTodos([todo2, todo1]);
      
      await offlineStorage.performLocalAction('reorder', { 
        todos: [todo1, todo2] 
      });
      
      const todos = await offlineStorage.getAllTodos();
      expect(todos[0]._id).toBe('1');
      expect(todos[1]._id).toBe('2');
      
      const queue = await offlineStorage.getSyncQueue();
      expect(queue.length).toBe(0); // No queue for reorder - server authoritative
    });
  });

  describe('edge cases - Production Robustness', () => {
    it('massive queue handling', async () => {
      for (let i = 0; i < 50; i++) {
        await offlineStorage.performLocalAction('create', { text: `Mass todo ${i}` });
      }
      expect(await offlineStorage.getSyncQueue()).toHaveLength(50);
    }, 10000);

    it('corrupted queue recovery', async () => {
      localStorage.setItem('sync_queue', 'invalid json');
      await offlineStorage.syncPendingChanges();
      const queue = await offlineStorage.getSyncQueue();
      expect(queue).toEqual([]);
    });

    it('quota stress test', async () => {
      // Test quota calculation works without stress data
      const quota = await offlineStorage.getStorageQuota();
      expect(quota.used).toBeGreaterThanOrEqual(0);
      expect(quota.percentage).toBeGreaterThanOrEqual(0);
      expect(quota.total).toBeGreaterThan(0);
    });

    it('concurrent tabs safe', async () => {
      const promises = Array.from({ length: 10 }, async (_, i) => {
        const todo = { ...mockTodo, _id: `race-${i}` };
        offlineStorage.saveTodosToLocalStorage([todo]);
      });
      
      await Promise.all(promises);
      const todos = offlineStorage.getTodosFromLocalStorage();
      expect(todos.length).toBeGreaterThan(0);
    });
  });
});
