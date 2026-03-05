import Dexie, { type Table } from 'dexie';
import type { Todo } from '../types';

// Console wrapper for consistent logging
const logger = {
  error: (msg: string, ...args: unknown[]) => console.error(`[OfflineStorage] ERROR: ${msg}`, ...args),
  warn: (msg: string, ...args: unknown[]) => console.warn(`[OfflineStorage] WARN: ${msg}`, ...args),
  info: (msg: string, ...args: unknown[]) => console.info(`[OfflineStorage] INFO: ${msg}`, ...args),
  debug: (msg: string, ...args: unknown[]) => console.debug(`[OfflineStorage] DEBUG: ${msg}`, ...args),
};

// Sync queue item type
export interface SyncQueueItem {
  id?: number;
  todoId: string;
  action: 'create' | 'update' | 'delete';
  data: Partial<Todo>;
  timestamp: number;
}

// Metadata type
export interface StorageMetadata {
  key: string;
  value: {
    [key: string]: unknown;
    savedAt?: number;
    updatedAt?: number;
    completedAt?: number;
    completed?: boolean;
    step?: string;
    tasks?: Array<{
      id: string;
      text: string;
      completed: boolean;
      hint: string;
    }>;
  };
}

// Dexie Database class
class TodoAppDatabase extends Dexie {
  todos!: Table<Todo, string>;
  syncQueue!: Table<SyncQueueItem, number>;
  metadata!: Table<StorageMetadata, string>;

  constructor() {
    super('TodoAppDB');
    
    this.version(1).stores({
      todos: '_id, order, category, priority, completed, createdAt',
      syncQueue: '++id, todoId, action, timestamp',
      metadata: 'key',
    });
  }
}

// Initialize database
const db = new TodoAppDatabase();

// Track online status
let isOnline = navigator.onLine;
let syncInProgress = false;

// Listen for online/offline events
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    logger.info('Network is online, triggering sync...');
    isOnline = true;
    // Trigger sync when coming back online
    offlineStorage.syncPendingChanges();
  });

  window.addEventListener('offline', () => {
    logger.warn('Network is offline, operating in offline mode');
    isOnline = false;
  });
}

// API service for syncing (will be imported lazily to avoid circular deps)
let api: typeof import('axios').default | null = null;
const getApi = async () => {
  if (!api) {
    const axios = await import('axios');
    api = axios.default;
  }
  return api;
};

export const offlineStorage = {
  // ===== IndexedDB Methods (via Dexie.js) =====
  
  // Get all todos from IndexedDB
  async getAllTodos(): Promise<Todo[]> {
    try {
      const todos = await db.todos.toArray();
      return todos.sort((a, b) => (a.order || 0) - (b.order || 0));
    } catch (error) {
      logger.error('Failed to get todos from IndexedDB, falling back to localStorage', error);
      return this.getTodosFromLocalStorage();
    }
  },

  // Get single todo
  async getTodo(id: string): Promise<Todo | undefined> {
    try {
      return await db.todos.get(id);
    } catch (error) {
      logger.error('Failed to get todo from IndexedDB', error);
      const todos = this.getTodosFromLocalStorage();
      return todos.find(t => t._id === id);
    }
  },

  // Save todo to IndexedDB
  async saveTodo(todo: Todo): Promise<void> {
    try {
      await db.todos.put(todo);
      // Also update localStorage as fallback
      this.saveTodoToLocalStorage(todo);
    } catch (error) {
      logger.error('Failed to save todo to IndexedDB, using localStorage fallback', error);
      this.saveTodoToLocalStorage(todo);
    }
  },

  // Save multiple todos
  async saveTodos(todos: Todo[]): Promise<void> {
    try {
      await db.todos.bulkPut(todos);
      this.saveTodosToLocalStorage(todos);
    } catch (error) {
      logger.error('Failed to save todos to IndexedDB, using localStorage fallback', error);
      this.saveTodosToLocalStorage(todos);
    }
  },

  // Delete todo from IndexedDB
  async deleteTodo(id: string): Promise<void> {
    try {
      await db.todos.delete(id);
      this.deleteTodoFromLocalStorage(id);
    } catch (error) {
      logger.error('Failed to delete todo from IndexedDB, using localStorage fallback', error);
      this.deleteTodoFromLocalStorage(id);
    }
  },

  // Clear all todos
  async clearAllTodos(): Promise<void> {
    try {
      await db.todos.clear();
      localStorage.removeItem('todos');
    } catch (error) {
      logger.error('Failed to clear todos from IndexedDB', error);
      localStorage.removeItem('todos');
    }
  },

  // ===== Sync Queue Methods =====
  
  // Add to sync queue
  async addToSyncQueue(
    action: 'create' | 'update' | 'delete',
    todoId: string,
    data: Partial<Todo>
  ): Promise<void> {
    try {
      await db.syncQueue.add({
        todoId,
        action,
        data,
        timestamp: Date.now(),
      });
      
      // Try to sync immediately if online
      if (isOnline) {
        this.syncPendingChanges();
      }
    } catch (error) {
      logger.error('Failed to add to sync queue', error);
    }
  },

  // Get sync queue
  async getSyncQueue(): Promise<SyncQueueItem[]> {
    try {
      return await db.syncQueue.orderBy('timestamp').toArray();
    } catch (error) {
      logger.error('Failed to get sync queue', error);
      return [];
    }
  },

  // Clear sync queue
  async clearSyncQueue(): Promise<void> {
    try {
      await db.syncQueue.clear();
    } catch (error) {
      logger.error('Failed to clear sync queue', error);
    }
  },

  // Remove item from sync queue
  async removeFromSyncQueue(id: number): Promise<void> {
    try {
      await db.syncQueue.delete(id);
    } catch (error) {
      logger.error('Failed to remove from sync queue', error);
    }
  },

  // Sync pending changes to server
  async syncPendingChanges(): Promise<{ success: boolean; synced: number; failed: number }> {
    if (syncInProgress) {
      logger.info('Sync already in progress, skipping...');
      return { success: false, synced: 0, failed: 0 };
    }
    
    if (!isOnline) {
      logger.info('Offline, skipping sync');
      return { success: false, synced: 0, failed: 0 };
    }

    syncInProgress = true;
    let synced = 0;
    let failed = 0;

    try {
      const queue = await this.getSyncQueue();
      
      if (queue.length === 0) {
        logger.info('No pending changes to sync');
        syncInProgress = false;
        return { success: true, synced: 0, failed: 0 };
      }

      logger.info(`Syncing ${queue.length} pending changes...`);
      const axios = await getApi();
      const API_URL = (await import('../types')).API_URL;

      for (const item of queue) {
        try {
          switch (item.action) {
            case 'create':
              await axios.post(`${API_URL}/api/todos`, item.data, { withCredentials: true });
              break;
            case 'update':
              await axios.put(`${API_URL}/api/todos/${item.todoId}`, item.data, { withCredentials: true });
              break;
            case 'delete':
              await axios.delete(`${API_URL}/api/todos/${item.todoId}`, { withCredentials: true });
              break;
          }
          
          // Remove from queue on success
          if (item.id) {
            await this.removeFromSyncQueue(item.id);
          }
          synced++;
        } catch (error) {
          logger.error(`Failed to sync item ${item.id}:`, error);
          failed++;
        }
      }

      logger.info(`Sync complete: ${synced} synced, ${failed} failed`);
    } catch (error) {
      logger.error('Sync failed:', error);
    } finally {
      syncInProgress = false;
    }

    return { success: failed === 0, synced, failed };
  },

  // ===== Metadata Methods =====
  
  // Update metadata
  async updateMetadata(key: string, value: Record<string, unknown>): Promise<void> {
    try {
      await db.metadata.put({ key, value: { ...value, savedAt: Date.now() } }, key);
    } catch (error) {
      logger.error('Failed to update metadata', error);
    }
  },

  // Get metadata
  async getMetadata(key: string): Promise<Record<string, unknown> | undefined> {
    try {
      const result = await db.metadata.get(key);
      return result?.value;
    } catch (error) {
      logger.error('Failed to get metadata', error);
      return undefined;
    }
  },

  // Store user password (for decryption on reload)
  async savePassword(password: string): Promise<void> {
    try {
      await this.updateMetadata('user-password', { password, savedAt: Date.now() });
    } catch (error) {
      logger.error('Failed to save password', error);
    }
  },

  // Retrieve stored password
  async getPassword(): Promise<string | null> {
    try {
      const data = await this.getMetadata('user-password');
      return (data?.password as string) || null;
    } catch (error) {
      logger.error('Failed to retrieve password', error);
      return null;
    }
  },

  // Clear stored password
  async clearPassword(): Promise<void> {
    try {
      await db.metadata.delete('user-password');
    } catch (error) {
      logger.error('Failed to clear password', error);
    }
  },

  // Store encryption salt (for Google OAuth users)
  async saveEncryptionSalt(salt: string): Promise<void> {
    try {
      await this.updateMetadata('encryption-salt', { salt, savedAt: Date.now() });
    } catch (error) {
      logger.error('Failed to save encryption salt', error);
    }
  },

  // Retrieve stored encryption salt
  async getEncryptionSalt(): Promise<string | null> {
    try {
      const data = await this.getMetadata('encryption-salt');
      return (data?.salt as string) || null;
    } catch (error) {
      logger.error('Failed to retrieve encryption salt', error);
      return null;
    }
  },

  // Clear stored encryption salt
  async clearEncryptionSalt(): Promise<void> {
    try {
      await db.metadata.delete('encryption-salt');
    } catch (error) {
      logger.error('Failed to clear encryption salt', error);
    }
  },

  // ===== Network Status =====
  
  // Check if online
  isOnline(): boolean {
    return isOnline;
  },

  // Get sync status
  async getSyncStatus(): Promise<{ pendingCount: number; isOnline: boolean; syncInProgress: boolean }> {
    const pendingCount = await db.syncQueue.count();
    return {
      pendingCount,
      isOnline,
      syncInProgress,
    };
  },

  // ===== Fallback: LocalStorage Methods =====
  
  getTodosFromLocalStorage(): Todo[] {
    try {
      const stored = localStorage.getItem('todos');
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      logger.warn('Failed to parse todos from localStorage');
      return [];
    }
  },

  saveTodoToLocalStorage(todo: Todo): void {
    try {
      const todos = this.getTodosFromLocalStorage();
      const index = todos.findIndex(t => t._id === todo._id);
      if (index >= 0) {
        todos[index] = todo;
      } else {
        todos.push(todo);
      }
      localStorage.setItem('todos', JSON.stringify(todos));
    } catch (error) {
      logger.error('Failed to save todo to localStorage', error);
    }
  },

  saveTodosToLocalStorage(todos: Todo[]): void {
    try {
      localStorage.setItem('todos', JSON.stringify(todos));
    } catch (error) {
      logger.error('Failed to save todos to localStorage', error);
    }
  },

  deleteTodoFromLocalStorage(id: string): void {
    try {
      const todos = this.getTodosFromLocalStorage();
      const filtered = todos.filter(t => t._id !== id);
      localStorage.setItem('todos', JSON.stringify(filtered));
    } catch (error) {
      logger.error('Failed to delete todo from localStorage', error);
    }
  },

  // Check if storage is available
  isAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      logger.warn('LocalStorage is not available');
      return false;
    }
  },
};

export default offlineStorage;

