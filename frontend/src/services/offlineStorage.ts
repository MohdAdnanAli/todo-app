/**
 * Simplified Storage Service using localStorage
 * Reliable storage that works across all browsers without IndexedDB issues
 */

import type { Todo, BatchSyncInput } from '../types';
import { todoApi } from './api.js';

// ============================================
// Console wrapper
// ============================================

const logger = {
  error: (msg: string, ...args: unknown[]) => console.error(`[OfflineStorage] ERROR: ${msg}`, ...args),
  warn: (msg: string, ...args: unknown[]) => console.warn(`[OfflineStorage] WARN: ${msg}`, ...args),
  info: (msg: string, ...args: unknown[]) => console.info(`[OfflineStorage] INFO: ${msg}`, ...args),
};

// ============================================
// Type Definitions
// ============================================

export interface SyncQueueItem {
  id?: number;
  todoId: string;
  action: 'create' | 'update' | 'delete';
  data: Partial<Todo>;
  timestamp: number;
  retries: number;
  lastError?: string;
}

export interface StorageMetadata {
  key: string;
  value: Record<string, unknown>;
}

export interface StorageQuota {
  used: number;
  available: number;
  total: number;
  percentage: number;
}

export interface SyncStatusInterface {
  pendingCount: number;
  isOnline: boolean;
  syncInProgress: boolean;
  lastSyncAt: number | null;
  lastError: string | null;
}

export type SyncStatus = SyncStatusInterface;

// ============================================
// Storage Keys
// ============================================

const STORAGE_KEYS = {
  TODOS: 'todos',
  SYNC_QUEUE: 'sync_queue',
  METADATA_PREFIX: 'metadata_',
};

// ============================================
// Network State
// ============================================

let isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
let syncInProgress = false;
let syncStatus: SyncStatus = {
  pendingCount: 0,
  isOnline,
  syncInProgress: false,
  lastSyncAt: null,
  lastError: null,
};

export interface SyncListener {
  (status: SyncStatus): void;
}

const syncListeners: SyncListener[] = [];

// Notify all listeners when sync status changes
const notifySyncListeners = async () => {
  const currentStatus = await offlineStorage.getSyncStatus();
  syncListeners.forEach(listener => listener(currentStatus));
};

export const addSyncListener = (listener: SyncListener) => {
  syncListeners.push(listener);
  return () => {
    const index = syncListeners.indexOf(listener);
    if (index > -1) syncListeners.splice(index, 1);
  };
};

const eventListeners: Array<{ type: string; handler: (e: Event) => void }> = [];

const cleanupEventListeners = () => {
  if (typeof window !== 'undefined') {
    eventListeners.forEach(({ type, handler }) => {
      window.removeEventListener(type, handler);
    });
    eventListeners.length = 0;
  }
};

const setupNetworkListeners = () => {
  if (typeof window === 'undefined') return;
  
  const onlineHandler = async () => {
    logger.info('Network is online');
    isOnline = true;
    syncStatus.isOnline = true;
    notifySyncListeners();
    // Full sync (queue + remote merge)
    await offlineStorage.syncAll().catch(err => logger.error('Online sync failed:', err));
  };

  const offlineHandler = () => {
    logger.warn('Network is offline');
    isOnline = false;
    syncStatus.isOnline = false;
    notifySyncListeners();
  };

  // Additional sync triggers
  const visibilityHandler = () => {
    if (!document.hidden && isOnline) {
      offlineStorage.syncAll().catch(() => {});
    }
  };

  const focusHandler = () => {
    if (isOnline) {
      offlineStorage.syncAll().catch(() => {});
    }
  };

  window.addEventListener('online', onlineHandler);
  window.addEventListener('offline', offlineHandler);
  window.addEventListener('visibilitychange', visibilityHandler);
  window.addEventListener('focus', focusHandler);
  
  eventListeners.push({ type: 'online', handler: onlineHandler });
  eventListeners.push({ type: 'offline', handler: offlineHandler });
  eventListeners.push({ type: 'visibilitychange', handler: visibilityHandler });
  eventListeners.push({ type: 'focus', handler: focusHandler });
  
  isOnline = navigator.onLine;
  syncStatus.isOnline = isOnline;
};

setupNetworkListeners();

// ============================================
// API Service
// ============================================



// ============================================
// LocalStorage Helpers
// ============================================

function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return defaultValue;
    const parsed = JSON.parse(stored);
    return parsed ?? defaultValue;
  } catch {
    return defaultValue;
  }
}

function setToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    logger.error('Failed to save to localStorage:', error);
  }
}

// ============================================
// Main Storage Object
// ============================================

export const offlineStorage = {
  cleanup: cleanupEventListeners,
  
// ===== Core Todo Methods =====
  
  async getAllTodos(): Promise<Todo[]> {
    const todos = getFromStorage<Todo[]>(STORAGE_KEYS.TODOS, []);
    return todos.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  },

  // Generate UUID for new todos (local-first)
  generateId(): string {
    if (crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback for older browsers
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  },

  // OPTIMISTIC LOCAL ACTIONS - Full offline-first CRUD
  async performLocalAction(action: 'create' | 'update' | 'delete' | 'toggle' | 'reorder', data: any): Promise<Todo | void> {
    const todos = await this.getAllTodos();
    
    switch (action) {
      case 'create': {
        const newTodo: Todo = {
          _id: this.generateId(),
          text: data.text,
          completed: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          order: 0,
          ...data, // category, priority, etc.
        };
        todos.unshift(newTodo);
        await this.saveTodos(todos);
        await this.addToSyncQueue('create', newTodo._id, newTodo);
        notifySyncListeners();
        return newTodo;
      }
      
      case 'update':
      case 'toggle': {
        const todoIndex = todos.findIndex(t => t._id === data._id);
        if (todoIndex === -1) throw new Error('Todo not found');
        
        const updatedTodo = { ...todos[todoIndex], ...data, updatedAt: new Date().toISOString() };
        todos[todoIndex] = updatedTodo;
        await this.saveTodos(todos);
        await this.addToSyncQueue('update', data._id, updatedTodo);
        notifySyncListeners();
        return updatedTodo;
      }
      
      case 'delete': {
        const filtered = todos.filter(t => t._id !== data._id);
        await this.saveTodos(filtered);
        await this.addToSyncQueue('delete', data._id, {});
        notifySyncListeners();
        return;
      }
      
      case 'reorder': {
        const reordered = data.todos.map((todo: Todo, index: number) => ({ ...todo, order: index }));
        await this.saveTodos(reordered);
        // NO queue for reorder - server authoritative
        notifySyncListeners();
        return;
      }
    }
  },

  // FULL BIDIRECTIONAL SYNC: queue → remote + remote → local merge
  async syncAll(): Promise<{ success: boolean; synced: number; merged: number; conflicts: number }> {
    if (syncInProgress || !isOnline) {
      return { success: false, synced: 0, merged: 0, conflicts: 0 };
    }

    syncInProgress = true;
    syncStatus.syncInProgress = true;
    
    let synced = 0, merged = 0, conflicts = 0;

    try {
      // 1. Push local queue (batched)
      const queueResult = await this.syncPendingChanges();
      synced = queueResult.synced;

      // 2. Incremental delta merge (non-blocking "second half")
      const currentStatus = await this.getSyncStatus();
      const localTodos = await this.getAllTodos();

      let remoteTodos: Todo[];
      if (currentStatus.lastSyncAt) {
        // Delta sync: only changes since last sync
        remoteTodos = await todoApi.getTodosDelta(new Date(currentStatus.lastSyncAt).toISOString());
        logger.info(`Delta sync: ${remoteTodos.length} changes since ${currentStatus.lastSyncAt}`);
      } else {
        // Full sync fallback
        remoteTodos = await todoApi.getTodos();
        logger.info('Full sync (no lastSyncAt)');
      }

      // Incremental merge only new/changed remote todos
      const processedRemoteIds = new Set<string>();
      const newMergedTodos = [...localTodos];

      for (const remoteTodo of remoteTodos) {
        processedRemoteIds.add(remoteTodo._id);
        const localIndex = newMergedTodos.findIndex(t => t._id === remoteTodo._id);

        if (localIndex === -1) {
          // New remote todo
          newMergedTodos.push(remoteTodo);
          merged++;
        } else {
          // Conflict: remote newer wins (updatedAt)
          const localTodo = newMergedTodos[localIndex];
          const remoteNewer = new Date(remoteTodo.updatedAt || remoteTodo.createdAt) > new Date(localTodo.updatedAt || localTodo.createdAt);
          if (remoteNewer) {
            newMergedTodos[localIndex] = remoteTodo;
            conflicts++;
          }
        }
      }

      // Sort and save (non-blocking chunked if >500)
      newMergedTodos.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      await this.saveTodos(newMergedTodos);
      
      syncStatus.lastSyncAt = Date.now();
      syncStatus.lastError = null;
      notifySyncListeners();
      
      logger.info(`Sync complete: ${synced} synced, ${merged} merged, ${conflicts} conflicts`);
      return { success: true, synced, merged, conflicts };
    } catch (error: unknown) {
      logger.error('SyncAll failed:', error);
      syncStatus.lastError = (error as Error)?.message || 'Sync failed';
      notifySyncListeners();
      return { success: false, synced, merged, conflicts };
    } finally {
      syncInProgress = false;
      syncStatus.syncInProgress = false;
      notifySyncListeners();
    }
  },

  async getTodo(id: string): Promise<Todo | undefined> {
    const todos = await this.getAllTodos();
    return todos.find(t => t._id === id);
  },

  async saveTodo(todo: Todo): Promise<void> {
    const todos = await this.getAllTodos();
    const index = todos.findIndex(t => t._id === todo._id);
    if (index >= 0) {
      todos[index] = todo;
    } else {
      todos.push(todo);
    }
    setToStorage(STORAGE_KEYS.TODOS, todos);
  },

async saveTodos(todos: Todo[]): Promise<void> {
  const sortedTodos = todos.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  setToStorage(STORAGE_KEYS.TODOS, sortedTodos);
},

  async deleteTodo(id: string): Promise<void> {
    const todos = await this.getAllTodos();
    setToStorage(STORAGE_KEYS.TODOS, todos.filter(t => t._id !== id));
  },

  async clearAllTodos(): Promise<void> {
    localStorage.removeItem(STORAGE_KEYS.TODOS);
  },

  // ===== Sync Queue Methods =====
  
  async addToSyncQueue(
    action: 'create' | 'update' | 'delete',
    todoId: string,
    data: Partial<Todo>
  ): Promise<void> {
    const queue = getFromStorage<SyncQueueItem[]>(STORAGE_KEYS.SYNC_QUEUE, []);
    
    if (action === 'update' || action === 'delete') {
      const existingIndex = queue.findIndex(item => item.todoId === todoId);
      if (existingIndex >= 0) {
        queue[existingIndex] = { ...queue[existingIndex], action, data, timestamp: Date.now() };
        setToStorage(STORAGE_KEYS.SYNC_QUEUE, queue);
        return;
      }
    }
    
    queue.push({ todoId, action, data, timestamp: Date.now(), retries: 0 });
    setToStorage(STORAGE_KEYS.SYNC_QUEUE, queue);
    
    if (isOnline) {
      this.syncPendingChanges().catch(() => {});
    }
  },

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    return getFromStorage<SyncQueueItem[]>(STORAGE_KEYS.SYNC_QUEUE, []);
  },

  async clearSyncQueue(): Promise<void> {
    localStorage.removeItem(STORAGE_KEYS.SYNC_QUEUE);
  },

  async removeFromSyncQueue(id: number): Promise<void> {
    const queue = await this.getSyncQueue();
    setToStorage(STORAGE_KEYS.SYNC_QUEUE, queue.filter((_, i) => i !== id));
  },

  async syncPendingChanges(): Promise<{ success: boolean; synced: number; failed: number }> {
    if (syncInProgress || !isOnline) {
      return { success: false, synced: 0, failed: 0 };
    }

    syncInProgress = true;
    syncStatus.syncInProgress = true;
    let synced = 0;
    let failed = 0;

    try {
      const queue = await this.getSyncQueue();
      if (queue.length === 0) {
        syncInProgress = false;
        syncStatus.syncInProgress = false;
        notifySyncListeners();
        return { success: true, synced: 0, failed: 0 };
      }

      // BATCH: Group by action
      const batch = {
        creates: [],
        updates: [],
        deletes: [],
      } as BatchSyncInput;

      for (const item of queue) {
        if (item.action === 'create') {
          batch.creates!.push(item.data as Partial<Todo>);
        } else if (item.action === 'update') {
          batch.updates!.push({ id: item.todoId, data: item.data as Partial<Todo> });
        } else if (item.action === 'delete') {
          batch.deletes!.push(item.todoId);
        }
      }

      const result = await todoApi.batchSync(batch);

      if (result?.success) {
        synced = result.total || 0;
        // Clear entire queue on batch success (retry logic in future)
        await this.clearSyncQueue();
        logger.info(`Batch sync success: ${synced} items`);
      } else {
        failed = queue.length;
        logger.error('Batch sync failed:', result);
      }

      syncStatus.lastSyncAt = Date.now();
      syncStatus.lastError = failed > 0 ? 'Batch sync failed' : null;
      
      if (failed > 0) {
        logger.error(`Batch sync summary: ${synced} succeeded, ${failed} failed`);
      }
    } catch (error: unknown) {
      logger.error('Batch syncPendingChanges failed:', error);
      failed = 1;
      syncStatus.lastError = (error as Error)?.message || 'Batch sync failed';
    } finally {
      syncInProgress = false;
      syncStatus.syncInProgress = false;
      notifySyncListeners();
    }

    return { success: failed === 0, synced, failed };
  },

  // ===== Metadata Methods =====
  
  async updateMetadata(key: string, value: Record<string, unknown>): Promise<void> {
    const metadataKey = `${STORAGE_KEYS.METADATA_PREFIX}${key}`;
    setToStorage(metadataKey, { ...value, savedAt: Date.now() });
  },

  async getMetadata(key: string): Promise<Record<string, unknown> | undefined> {
    const metadataKey = `${STORAGE_KEYS.METADATA_PREFIX}${key}`;
    return getFromStorage<Record<string, unknown> | undefined>(metadataKey, undefined);
  },

  async savePassword(password: string): Promise<void> {
    await this.updateMetadata('user-password', { password });
  },

  async getPassword(): Promise<string | null> {
    const data = await this.getMetadata('user-password');
    return (data?.password as string) || null;
  },

  async clearPassword(): Promise<void> {
    localStorage.removeItem(`${STORAGE_KEYS.METADATA_PREFIX}user-password`);
  },

  async saveEncryptionSalt(salt: string): Promise<void> {
    await this.updateMetadata('encryption-salt', { salt });
  },

  async getEncryptionSalt(): Promise<string | null> {
    const data = await this.getMetadata('encryption-salt');
    return (data?.salt as string) || null;
  },

  async clearEncryptionSalt(): Promise<void> {
    localStorage.removeItem(`${STORAGE_KEYS.METADATA_PREFIX}encryption-salt`);
  },

  // ===== Network Status =====
  
  isOnline(): boolean {
    return isOnline;
  },

  async getSyncStatus(): Promise<SyncStatus> {
    const queue = await this.getSyncQueue();
    return { ...syncStatus, pendingCount: queue.length };
  },

  // ===== Storage Quota =====
  
  async getStorageQuota(): Promise<StorageQuota> {
    try {
      let total = 0;
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          total += localStorage[key].length * 2;
        }
      }
      const max = 5 * 1024 * 1024;
      return { used: total, available: max - total, total: max, percentage: (total / max) * 100 };
    } catch {
      return { used: 0, available: 0, total: 0, percentage: 0 };
    }
  },

  async requestPersistentStorage(): Promise<boolean> {
    if ('storage' in navigator && 'persist' in navigator.storage) {
      try {
        return await navigator.storage.persist();
      } catch {
        return false;
      }
    }
    return false;
  },

  async isStoragePersistent(): Promise<boolean> {
    if ('storage' in navigator && 'persisted' in navigator.storage) {
      try {
        return await navigator.storage.persisted();
      } catch {
        return false;
      }
    }
    return false;
  },

  // ===== Export/Import =====
  
  async createSnapshot(): Promise<{ todos: Todo[]; syncQueue: SyncQueueItem[]; createdAt: number }> {
    return {
      todos: await this.getAllTodos(),
      syncQueue: await this.getSyncQueue(),
      createdAt: Date.now(),
    };
  },

  async restoreFromSnapshot(snapshot: { todos?: Todo[]; syncQueue?: SyncQueueItem[] }): Promise<void> {
    if (snapshot.todos) await this.saveTodos(snapshot.todos);
    if (snapshot.syncQueue) setToStorage(STORAGE_KEYS.SYNC_QUEUE, snapshot.syncQueue);
  },

  async exportData(): Promise<string> {
    return JSON.stringify(await this.createSnapshot());
  },

  async importData(jsonString: string): Promise<void> {
    const data = JSON.parse(jsonString);
    await this.restoreFromSnapshot(data);
  },

  // ===== Legacy Compatibility =====
  
  async vacuum(): Promise<{ deletedItems: number }> {
    return { deletedItems: 0 };
  },

  // Legacy synchronous methods - these sync wrapper methods return the result directly
  getTodosFromLocalStorage: (): Todo[] => {
    // Synchronously get from localStorage (bypasses async getAllTodos)
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TODOS);
      if (!stored) return [];
      const todos = JSON.parse(stored) as Todo[];
      return todos.sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity));
    } catch {
      return [];
    }
  },
  saveTodoToLocalStorage: (todo: Todo): void => {
    // Synchronously save to localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TODOS);
      let todos: Todo[] = stored ? JSON.parse(stored) : [];
      const index = todos.findIndex(t => t._id === todo._id);
      if (index >= 0) {
        todos[index] = todo;
      } else {
        todos.push(todo);
      }
      localStorage.setItem(STORAGE_KEYS.TODOS, JSON.stringify(todos));
    } catch (error) {
      logger.error('Failed to save todo to localStorage:', error);
    }
  },
  saveTodosToLocalStorage: (todos: Todo[]): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.TODOS, JSON.stringify(todos));
    } catch (error) {
      logger.error('Failed to save todos to localStorage:', error);
    }
  },
  deleteTodoFromLocalStorage: (id: string): void => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TODOS);
      if (!stored) return;
      const todos = JSON.parse(stored) as Todo[];
      const filtered = todos.filter(t => t._id !== id);
      localStorage.setItem(STORAGE_KEYS.TODOS, JSON.stringify(filtered));
    } catch (error) {
      logger.error('Failed to delete todo from localStorage:', error);
    }
  },

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

  async getDatabaseInfo(): Promise<{
    name: string;
    version: number;
    todoCount: number;
    syncQueueCount: number;
    metadataCount: number;
  }> {
    const [todos, syncQueue] = await Promise.all([
      this.getAllTodos(),
      this.getSyncQueue(),
    ]);
    
    return {
      name: 'localStorage',
      version: 1,
      todoCount: todos.length,
      syncQueueCount: syncQueue.length,
      metadataCount: 0,
    };
  },
};

export default offlineStorage;

