import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { Todo } from '../types';

interface TodoDB extends DBSchema {
  todos: {
    key: string;
    value: Todo;
    indexes: { 'by-order': number };
  };
  syncQueue: {
    key: string;
    value: {
      id: string;
      action: 'create' | 'update' | 'delete';
      data: Partial<Todo>;
      timestamp: number;
    };
  };
  metadata: {
    key: string;
    value: {
      lastSync: number;
      syncInProgress: boolean;
    };
  };
}

let dbInstance: IDBPDatabase<TodoDB> | null = null;

const DB_NAME = 'TodoAppDB';
const DB_VERSION = 1;

const getDB = async (): Promise<IDBPDatabase<TodoDB>> => {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<TodoDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Todos store
      if (!db.objectStoreNames.contains('todos')) {
        const todoStore = db.createObjectStore('todos', { keyPath: '_id' });
        todoStore.createIndex('by-order', 'order');
      }

      // Sync queue store
      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
      }

      // Metadata store
      if (!db.objectStoreNames.contains('metadata')) {
        db.createObjectStore('metadata');
      }
    },
  });

  return dbInstance;
};

export const offlineStorage = {
  // Get all todos from IndexedDB
  async getAllTodos(): Promise<Todo[]> {
    try {
      const db = await getDB();
      const todos = await db.getAll('todos');
      return todos.sort((a, b) => (a.order || 0) - (b.order || 0));
    } catch (error) {
      console.error('Error getting todos from IndexedDB:', error);
      return this.getTodosFromLocalStorage();
    }
  },

  // Get single todo
  async getTodo(id: string): Promise<Todo | undefined> {
    try {
      const db = await getDB();
      return await db.get('todos', id);
    } catch (error) {
      console.error('Error getting todo from IndexedDB:', error);
      const todos = this.getTodosFromLocalStorage();
      return todos.find(t => t._id === id);
    }
  },

  // Save todo to IndexedDB
  async saveTodo(todo: Todo): Promise<void> {
    try {
      const db = await getDB();
      await db.put('todos', todo);
      // Also update localStorage as fallback
      this.saveTodoToLocalStorage(todo);
    } catch (error) {
      console.error('Error saving todo to IndexedDB:', error);
      this.saveTodoToLocalStorage(todo);
    }
  },

  // Save multiple todos
  async saveTodos(todos: Todo[]): Promise<void> {
    try {
      const db = await getDB();
      const tx = db.transaction('todos', 'readwrite');
      for (const todo of todos) {
        await tx.store.put(todo);
      }
      await tx.done;
      this.saveTodosToLocalStorage(todos);
    } catch (error) {
      console.error('Error saving todos to IndexedDB:', error);
      this.saveTodosToLocalStorage(todos);
    }
  },

  // Delete todo from IndexedDB
  async deleteTodo(id: string): Promise<void> {
    try {
      const db = await getDB();
      await db.delete('todos', id);
      this.deleteTodoFromLocalStorage(id);
    } catch (error) {
      console.error('Error deleting todo from IndexedDB:', error);
      this.deleteTodoFromLocalStorage(id);
    }
  },

  // Clear all todos
  async clearAllTodos(): Promise<void> {
    try {
      const db = await getDB();
      await db.clear('todos');
      localStorage.removeItem('todos');
    } catch (error) {
      console.error('Error clearing todos from IndexedDB:', error);
      localStorage.removeItem('todos');
    }
  },

  // Add to sync queue
  async addToSyncQueue(
    action: 'create' | 'update' | 'delete',
    data: Partial<Todo>
  ): Promise<void> {
    try {
      const db = await getDB();
      await db.add('syncQueue', {
        id: `${action}-${Date.now()}-${Math.random()}`,
        action,
        data,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Error adding to sync queue:', error);
    }
  },

  // Get sync queue
  async getSyncQueue(): Promise<any[]> {
    try {
      const db = await getDB();
      return await db.getAll('syncQueue');
    } catch (error) {
      console.error('Error getting sync queue:', error);
      return [];
    }
  },

  // Clear sync queue
  async clearSyncQueue(): Promise<void> {
    try {
      const db = await getDB();
      await db.clear('syncQueue');
    } catch (error) {
      console.error('Error clearing sync queue:', error);
    }
  },

  // Remove item from sync queue
  async removeFromSyncQueue(id: string): Promise<void> {
    try {
      const db = await getDB();
      await db.delete('syncQueue', id);
    } catch (error) {
      console.error('Error removing from sync queue:', error);
    }
  },

  // Update metadata
  async updateMetadata(key: string, value: any): Promise<void> {
    try {
      const db = await getDB();
      await db.put('metadata', { ...value }, key);
    } catch (error) {
      console.error('Error updating metadata:', error);
    }
  },

  // Get metadata
  async getMetadata(key: string): Promise<any> {
    try {
      const db = await getDB();
      return await db.get('metadata', key);
    } catch (error) {
      console.error('Error getting metadata:', error);
      return null;
    }
  },

  // Store user password (for decryption on reload)
  async savePassword(password: string): Promise<void> {
    try {
      await this.updateMetadata('user-password', { password, savedAt: Date.now() });
    } catch (error) {
      console.error('Error saving password:', error);
    }
  },

  // Retrieve stored password
  async getPassword(): Promise<string | null> {
    try {
      const data = await this.getMetadata('user-password');
      return data?.password || null;
    } catch (error) {
      console.error('Error retrieving password:', error);
      return null;
    }
  },

  // Clear stored password
  async clearPassword(): Promise<void> {
    try {
      const db = await getDB();
      await db.delete('metadata', 'user-password');
    } catch (error) {
      console.error('Error clearing password:', error);
    }
  },

  // ===== FALLBACK: LocalStorage methods =====

  getTodosFromLocalStorage(): Todo[] {
    try {
      const stored = localStorage.getItem('todos');
      return stored ? JSON.parse(stored) : [];
    } catch {
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
      console.error('Error saving to localStorage:', error);
    }
  },

  saveTodosToLocalStorage(todos: Todo[]): void {
    try {
      localStorage.setItem('todos', JSON.stringify(todos));
    } catch (error) {
      console.error('Error saving todos to localStorage:', error);
    }
  },

  deleteTodoFromLocalStorage(id: string): void {
    try {
      const todos = this.getTodosFromLocalStorage();
      const filtered = todos.filter(t => t._id !== id);
      localStorage.setItem('todos', JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting from localStorage:', error);
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
      return false;
    }
  },
};
