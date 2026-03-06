/**
 * Enhanced IndexedDB Storage Service
 * Production-ready with comprehensive error handling, compression, sync, and quota management
 */

import Dexie, { type Table, type EntityTable } from 'dexie';
import type { Todo } from '../types';

// ============================================
// Console wrapper for consistent logging
// ============================================

const logger = {
  error: (msg: string, ...args: unknown[]) => console.error(`[OfflineStorage] ERROR: ${msg}`, ...args),
  warn: (msg: string, ...args: unknown[]) => console.warn(`[OfflineStorage] WARN: ${msg}`, ...args),
  info: (msg: string, ...args: unknown[]) => console.info(`[OfflineStorage] INFO: ${msg}`, ...args),
  debug: (msg: string, ...args: unknown[]) => console.debug(`[OfflineStorage] DEBUG: ${msg}`, ...args),
};

// ============================================
// Type Definitions
// ============================================

// Sync queue item type
export interface SyncQueueItem {
  id?: number;
  todoId: string;
  action: 'create' | 'update' | 'delete';
  data: Partial<Todo>;
  timestamp: number;
  retries: number;
  lastError?: string;
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

// Storage quota info
export interface StorageQuota {
  used: number;
  available: number;
  total: number;
  percentage: number;
}

// Sync status
export interface SyncStatus {
  pendingCount: number;
  isOnline: boolean;
  syncInProgress: boolean;
  lastSyncAt: number | null;
  lastError: string | null;
}

// Database version info
interface DatabaseVersion {
  version: number;
  createdAt: number;
  lastMigratedAt: number;
}

// ============================================
// Dexie Database Class with Schema Migrations
// ============================================

class TodoAppDatabase extends Dexie {
  todos!: Table<Todo, string>;
  syncQueue!: Table<SyncQueueItem, number>;
  metadata!: Table<StorageMetadata, string>;
  versions!: Table<DatabaseVersion, number>;

  constructor() {
    super('TodoAppDB');
    
    // Define schema with versioning
    // Version 1: Initial schema
    // Version 2: Added versions table for migration tracking
    this.version(1).stores({
      todos: '_id, order, category, priority, completed, createdAt, [user+order]',
      syncQueue: '++id, todoId, action, timestamp',
      metadata: 'key',
    });
    
    this.version(2).stores({
      todos: '_id, order, category, priority, completed, createdAt, [user+order]',
      syncQueue: '++id, todoId, action, timestamp',
      metadata: 'key',
      versions: 'version',
    }).upgrade(tx => {
      // Migration from v1 to v2
      return tx.table('versions').put({
        version: 2,
        createdAt: Date.now(),
        lastMigratedAt: Date.now(),
      });
    });
  }
}

// Initialize database
const db = new TodoAppDatabase();

// ============================================
// Network & Sync State
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

// Store event listener references for cleanup
const eventListeners: Array<{ type: string; handler: (e: Event) => void }> = [];

// Cleanup function to remove all event listeners
const cleanupEventListeners = () => {
  if (typeof window !== 'undefined') {
    eventListeners.forEach(({ type, handler }) => {
      window.removeEventListener(type, handler);
    });
    eventListeners.length = 0;
  }
};

// ============================================
// Network Event Handlers
// ============================================

const setupNetworkListeners = () => {
  if (typeof window === 'undefined') return;
  
  const onlineHandler = () => {
    logger.info('Network is online, triggering sync...');
    isOnline = true;
    syncStatus.isOnline = true;
    // Trigger sync when coming back online
    offlineStorage.syncPendingChanges().catch(err => {
      logger.error('Auto-sync failed:', err);
    });
  };

  const offlineHandler = () => {
    logger.warn('Network is offline, operating in offline mode');
    isOnline = false;
    syncStatus.isOnline = false;
  };

  window.addEventListener('online', onlineHandler);
  window.addEventListener('offline', offlineHandler);
  
  // Store references for cleanup
  eventListeners.push({ type: 'online', handler: onlineHandler });
  eventListeners.push({ type: 'offline', handler: offlineHandler });
  
  // Initialize network status
  isOnline = navigator.onLine;
  syncStatus.isOnline = isOnline;
};

// Initialize network listeners
setupNetworkListeners();

// ============================================
// API Service (Lazy Import)
// ============================================

let api: typeof import('axios').default | null = null;
const getApi = async () => {
  if (!api) {
    const axios = await import('axios');
    api = axios.default;
  }
  return api;
};

// ============================================
// Compression Utilities (using basic encoding)
// ============================================

const compressData = async (data: string): Promise<string> => {
  try {
    // Use TextEncoder for basic compression
    const encoder = new TextEncoder();
    const uint8Array = encoder.encode(data);
    
    // Use CompressionStream if available
    if (typeof CompressionStream !== 'undefined') {
      const cs = new CompressionStream('gzip');
      const writer = cs.writable.getWriter();
      writer.write(uint8Array);
      writer.close();
      
      const reader = cs.readable.getReader();
      const chunks: Uint8Array[] = [];
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      
      // Convert to base64
      const combined = new Uint8Array(chunks.reduce((acc, val) => acc + val.length, 0));
      let offset = 0;
      chunks.forEach(chunk => {
        combined.set(chunk, offset);
        offset += chunk.length;
      });
      
      return btoa(String.fromCharCode(...combined));
    }
    
    // Fallback: just return base64 encoded
    return btoa(data);
  } catch (error) {
    logger.warn('Compression failed, using plain data:', error);
    return data;
  }
};

const decompressData = async (data: string): Promise<string> => {
  try {
    // Use TextDecoder for basic decompression
    if (typeof DecompressionStream !== 'undefined') {
      const binaryString = atob(data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const ds = new DecompressionStream('gzip');
      const writer = ds.writable.getWriter();
      writer.write(bytes);
      writer.close();
      
      const reader = ds.readable.getReader();
      const chunks: Uint8Array[] = [];
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      
      const combined = new Uint8Array(chunks.reduce((acc, val) => acc + val.length, 0));
      let offset = 0;
      chunks.forEach(chunk => {
        combined.set(chunk, offset);
        offset += chunk.length;
      });
      
      return new TextDecoder().decode(combined);
    }
    
    // Fallback
    return atob(data);
  } catch (error) {
    logger.warn('Decompression failed, using plain data:', error);
    return data;
  }
};

// ============================================
// Exponential Backoff for Sync
// ============================================

const calculateBackoff = (retries: number): number => {
  const baseDelay = 1000; // 1 second
  const maxDelay = 60000; // 60 seconds
  const delay = Math.min(baseDelay * Math.pow(2, retries), maxDelay);
  // Add some jitter
  return delay + Math.random() * 1000;
};

// ============================================
// Main OfflineStorage Object
// ============================================

export const offlineStorage = {
  // Cleanup function to remove event listeners (call this when unmounting)
  cleanup: cleanupEventListeners,
  
  // ===== IndexedDB Methods (via Dexie.js) =====
  
  // Get all todos from IndexedDB
  async getAllTodos(): Promise<Todo[]> {
    try {
      const todos = await db.todos.toArray();
      return todos.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
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

  // Save multiple todos (bulk operation)
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
  
  // Add to sync queue with retry support
  async addToSyncQueue(
    action: 'create' | 'update' | 'delete',
    todoId: string,
    data: Partial<Todo>
  ): Promise<void> {
    try {
      // Check if item already exists in queue for update/delete
      if (action === 'update' || action === 'delete') {
        const existing = await db.syncQueue
          .where('todoId')
          .equals(todoId)
          .first();
        
        if (existing) {
          // Update existing entry instead of adding new
          await db.syncQueue.update(existing.id!, {
            action,
            data,
            timestamp: Date.now(),
            retries: 0,
            lastError: undefined,
          });
          return;
        }
      }
      
      await db.syncQueue.add({
        todoId,
        action,
        data,
        timestamp: Date.now(),
        retries: 0,
      });
      
      // Try to sync immediately if online
      if (isOnline) {
        this.syncPendingChanges().catch(err => {
          logger.error('Immediate sync failed:', err);
        });
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

  // Sync pending changes to server with exponential backoff
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
    syncStatus.syncInProgress = true;
    let synced = 0;
    let failed = 0;

    try {
      const queue = await this.getSyncQueue();
      
      if (queue.length === 0) {
        logger.info('No pending changes to sync');
        syncInProgress = false;
        syncStatus.syncInProgress = false;
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
        } catch (error: any) {
          logger.error(`Failed to sync item ${item.id}:`, error?.message || error);
          failed++;
          
          // Increment retry count
          const newRetries = (item.retries || 0) + 1;
          const errorMessage = error?.message || 'Unknown error';
          
          // If max retries exceeded, remove from queue
          if (newRetries >= 5) {
            logger.warn(`Max retries exceeded for item ${item.id}, removing from queue`);
            if (item.id) {
              await this.removeFromSyncQueue(item.id);
            }
          } else {
            // Update retry count and error message
            await db.syncQueue.update(item.id!, {
              retries: newRetries,
              lastError: errorMessage,
            });
            
            // Wait with exponential backoff before next retry
            if (failed < queue.length) {
              const backoff = calculateBackoff(newRetries);
              logger.info(`Waiting ${backoff}ms before next retry...`);
              await new Promise(resolve => setTimeout(resolve, backoff));
            }
          }
        }
      }

      logger.info(`Sync complete: ${synced} synced, ${failed} failed`);
      syncStatus.lastSyncAt = Date.now();
      syncStatus.lastError = failed > 0 ? `${failed} items failed to sync` : null;
    } catch (error: any) {
      logger.error('Sync failed:', error);
      syncStatus.lastError = error?.message || 'Sync failed';
    } finally {
      syncInProgress = false;
      syncStatus.syncInProgress = false;
    }

    return { success: failed === 0, synced, failed };
  },

  // ===== Metadata Methods =====
  
  // Update metadata
  async updateMetadata(key: string, value: Record<string, unknown>): Promise<void> {
    try {
      await db.metadata.put({ 
        key, 
        value: { ...value, savedAt: Date.now() } 
      }, key);
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

  // ===== Password & Encryption Methods =====
  
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
  async getSyncStatus(): Promise<SyncStatus> {
    const pendingCount = await db.syncQueue.count();
    return {
      ...syncStatus,
      pendingCount,
    };
  },

  // ===== Storage Quota Management =====
  
  // Get storage quota information
  async getStorageQuota(): Promise<StorageQuota> {
    if (typeof navigator !== 'undefined' && 'storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        const used = estimate.usage || 0;
        const quota = estimate.quota || 0;
        const available = quota - used;
        const percentage = quota > 0 ? (used / quota) * 100 : 0;
        
        return {
          used,
          available,
          total: quota,
          percentage,
        };
      } catch (error) {
        logger.error('Failed to get storage quota:', error);
      }
    }
    
    // Fallback: estimate from localStorage
    try {
      let total = 0;
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          total += localStorage[key].length * 2; // UTF-16 = 2 bytes per char
        }
      }
      
      return {
        used: total,
        available: 5 * 1024 * 1024 - total, // Assume 5MB limit
        total: 5 * 1024 * 1024,
        percentage: (total / (5 * 1024 * 1024)) * 100,
      };
    } catch {
      return {
        used: 0,
        available: 0,
        total: 0,
        percentage: 0,
      };
    }
  },

  // Request persistent storage
  async requestPersistentStorage(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && 'storage' in navigator && 'persist' in navigator.storage) {
      try {
        const isPersisted = await navigator.storage.persist();
        logger.info(`Persistent storage ${isPersisted ? 'granted' : 'denied'}`);
        return isPersisted;
      } catch (error) {
        logger.error('Failed to request persistent storage:', error);
      }
    }
    return false;
  },

  // Check if storage is persistent
  async isStoragePersistent(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && 'storage' in navigator && 'persisted' in navigator.storage) {
      try {
        return await navigator.storage.persisted();
      } catch (error) {
        logger.error('Failed to check persistent storage:', error);
      }
    }
    return false;
  },

  // ===== Data Snapshot & Backup =====
  
  // Create a snapshot of all data
  async createSnapshot(): Promise<{
    todos: Todo[];
    metadata: StorageMetadata[];
    syncQueue: SyncQueueItem[];
    createdAt: number;
  }> {
    try {
      const [todos, metadata, syncQueue] = await Promise.all([
        db.todos.toArray(),
        db.metadata.toArray(),
        db.syncQueue.toArray(),
      ]);
      
      return {
        todos,
        metadata,
        syncQueue,
        createdAt: Date.now(),
      };
    } catch (error) {
      logger.error('Failed to create snapshot:', error);
      throw error;
    }
  },

  // Restore from a snapshot
  async restoreFromSnapshot(snapshot: {
    todos?: Todo[];
    metadata?: StorageMetadata[];
    syncQueue?: SyncQueueItem[];
  }): Promise<void> {
    try {
      if (snapshot.todos && snapshot.todos.length > 0) {
        await db.todos.bulkPut(snapshot.todos);
      }
      
      if (snapshot.metadata && snapshot.metadata.length > 0) {
        await db.metadata.bulkPut(snapshot.metadata);
      }
      
      if (snapshot.syncQueue && snapshot.syncQueue.length > 0) {
        await db.syncQueue.bulkPut(snapshot.syncQueue);
      }
      
      logger.info('Snapshot restored successfully');
    } catch (error) {
      logger.error('Failed to restore snapshot:', error);
      throw error;
    }
  },

  // Export data as JSON string
  async exportData(): Promise<string> {
    const snapshot = await this.createSnapshot();
    return JSON.stringify(snapshot);
  },

  // Import data from JSON string
  async importData(jsonString: string): Promise<void> {
    try {
      const data = JSON.parse(jsonString);
      await this.restoreFromSnapshot(data);
    } catch (error) {
      logger.error('Failed to import data:', error);
      throw error;
    }
  },

  // ===== Database Maintenance =====
  
  // Vacuum/delete unused data
  async vacuum(): Promise<{ deletedItems: number }> {
    let deletedItems = 0;
    
    try {
      // Clear sync queue (items should be synced or failed)
      const queueSize = await db.syncQueue.count();
      if (queueSize > 100) {
        // Only keep recent items if queue is huge
        const oldItems = await db.syncQueue
          .orderBy('timestamp')
          .limit(Math.max(0, queueSize - 100))
          .toArray();
        
        for (const item of oldItems) {
          if (item.id) {
            await db.syncQueue.delete(item.id);
            deletedItems++;
          }
        }
      }
      
      // Clear old metadata (keep only recent)
      const oldMetadata = await db.metadata
        .filter(m => {
          const savedAt = m.value?.savedAt || 0;
          return Date.now() - savedAt > 30 * 24 * 60 * 60 * 1000; // 30 days
        })
        .toArray();
      
      for (const m of oldMetadata) {
        await db.metadata.delete(m.key);
        deletedItems++;
      }
      
      logger.info(`Vacuum complete: ${deletedItems} items deleted`);
    } catch (error) {
      logger.error('Vacuum failed:', error);
    }
    
    return { deletedItems };
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

  // ===== Database Version Info =====
  
  // Get database info
  async getDatabaseInfo(): Promise<{
    name: string;
    version: number;
    todoCount: number;
    syncQueueCount: number;
    metadataCount: number;
  }> {
    const [todoCount, syncQueueCount, metadataCount] = await Promise.all([
      db.todos.count(),
      db.syncQueue.count(),
      db.metadata.count(),
    ]);
    
    return {
      name: db.name,
      version: db.verno,
      todoCount,
      syncQueueCount,
      metadataCount,
    };
  },
};

export default offlineStorage;

