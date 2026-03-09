/**
 * Enhanced MongoDB Database Utility
 * Production-ready with connection validation, recovery, and health monitoring
 */

import mongoose, { type Mongoose } from 'mongoose';
import { logger } from './logger';

// ============================================
// Configuration & Validation
// ============================================

// Use consistent MongoDB URI - prefer MONGODB_URI, fallback to MONGO_URI
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

// Validate connection string format
const validateConnectionString = (uri: string | undefined): boolean => {
  if (!uri) return false;
  
  // Check for valid MongoDB URI formats
  const validPrefixes = ['mongodb://', 'mongodb+srv://'];
  const isValidPrefix = validPrefixes.some(prefix => uri.startsWith(prefix));
  
  if (!isValidPrefix) {
    logger.error('Invalid MongoDB connection string prefix');
    return false;
  }
  
  // For mongodb+srv://, check for valid cluster format
  if (uri.startsWith('mongodb+srv://')) {
    const parts = uri.split('?');
    const base = parts[0] || '';
    return base.includes('.net') || base.includes('.mongodb.net') || base.includes('localhost');
  }
  
  // For standard connection, check host:port format or local socket
  const withoutProtocol = uri.replace('mongodb://', '');
  const hasHost = withoutProtocol.includes(':') || withoutProtocol.includes('/') || withoutProtocol.includes('localhost');
  
  return hasHost;
};

// Sanitize connection string for logging (hide credentials)
const sanitizeConnectionString = (uri: string): string => {
  try {
    const url = new URL(uri);
    if (url.password) {
      url.password = '****';
    }
    return url.toString().replace(/\/\//, '//****:****@');
  } catch {
    return 'mongodb://****:****@hidden';
  }
};

if (!MONGODB_URI) {
  logger.error('MONGODB_URI environment variable is not set');
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL === '1') {
    throw new Error('MONGODB_URI environment variable is required');
  }
} else if (!validateConnectionString(MONGODB_URI)) {
  logger.error('Invalid MongoDB connection string format');
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL === '1') {
    throw new Error('Invalid MongoDB connection string');
  }
}

// ============================================
// Connection Options - Optimized for all environments
// ============================================

const isProduction = process.env.NODE_ENV === 'production';
const isServerless = process.env.VERCEL === '1';
const isDevelopment = !isProduction && !isServerless;

// Base connection options - OPTIMIZED for lower latency
const baseOptions: mongoose.ConnectOptions = {
  serverSelectionTimeoutMS: 5000, // Reduced from 15000 - faster failure
  socketTimeoutMS: 30000, // Reduced from 45000
  maxPoolSize: 50, // Increased from 10 for better concurrency
  minPoolSize: 5, // Increased from 2 for warm connections
  maxIdleTimeMS: 60000, // Increased from 30000 - keep connections alive longer
  family: 4,
  retryWrites: true,
  retryReads: true,
  // Buffer commands on connection errors (helps with transient errors)
  bufferCommands: true,
  // Validate schema on connect
  autoCreate: false,
  autoIndex: false,
};

// Serverless-specific options (Vercel, AWS Lambda, etc.)
const serverlessOptions: mongoose.ConnectOptions = {
  maxPoolSize: 1,
  minPoolSize: 1,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 20000,
  // Serverless friendly options
  ...(isServerless && {
    maxPoolSize: 1,
    minPoolSize: 1,
  }),
};

// Production-specific options
const productionOptions: mongoose.ConnectOptions = {
  // Enable compression for better performance
  // compression: { compressors: ['snappy', 'zstd'] }, // MongoDB 4.2+
  // Enable retryable reads/writes by default
  retryWrites: true,
  retryReads: true,
};

// Development-specific options
const developmentOptions: mongoose.ConnectOptions = {
  // More lenient for development
  serverSelectionTimeoutMS: 30000,
};

// Combine options based on environment
const mongooseOptions: mongoose.ConnectOptions = {
  ...baseOptions,
  ...(isServerless && serverlessOptions),
  ...(isProduction && productionOptions),
  ...(isDevelopment && developmentOptions),
};

// ============================================
// Connection State Management
// ============================================

interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  connectionPromise: Promise<boolean> | null;
  reconnectAttempts: number;
  lastConnected: Date | null;
  lastError: string | null;
  connectionId: number;
}

const state: ConnectionState = {
  isConnected: false,
  isConnecting: false,
  connectionPromise: null,
  reconnectAttempts: 0,
  lastConnected: null,
  lastError: null,
  connectionId: 0,
};

const MAX_RECONNECT_ATTEMPTS = 5;
const INITIAL_RETRY_DELAY = 1000;
const MAX_RETRY_DELAY = 30000;

// ============================================
// Connection Functions
// ============================================

/**
 * Connect to MongoDB with retry logic
 */
export const connectWithRetry = async (retries = MAX_RECONNECT_ATTEMPTS, delay = INITIAL_RETRY_DELAY): Promise<boolean> => {
  if (!MONGODB_URI) {
    logger.error('Cannot connect: MONGODB_URI is not defined');
    return false;
  }

  const sanitizedUri = sanitizeConnectionString(MONGODB_URI);
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      logger.info(`MongoDB connection attempt ${attempt}/${retries} to ${sanitizedUri}...`);
      
      // Increment connection ID for tracking
      state.connectionId++;
      const currentConnectionId = state.connectionId;
      
      await mongoose.connect(MONGODB_URI, mongooseOptions);
      
      logger.info(`MongoDB connected successfully (connection #${currentConnectionId})`);
      state.isConnected = true;
      state.reconnectAttempts = 0;
      state.lastConnected = new Date();
      state.lastError = null;
      
      return true;
    } catch (err: any) {
      const errorMessage = err?.message || 'Unknown error';
      state.lastError = errorMessage;
      state.reconnectAttempts = attempt;
      
      logger.error(`MongoDB connection attempt ${attempt}/${retries} failed: ${errorMessage}`);
      
      // Exponential backoff
      const actualDelay = Math.min(delay * Math.pow(2, attempt - 1), MAX_RETRY_DELAY);
      
      if (attempt < retries) {
        logger.info(`Retrying in ${actualDelay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, actualDelay));
      }
    }
  }
  
  logger.error('MongoDB connection failed after all retries');
  return false;
};

/**
 * Lazy connect function - call this before any DB operation
 * Handles serverless environments where connections may be idle
 */
export const connectDB = async (): Promise<boolean> => {
  // Already connected
  if (state.isConnected || mongoose.connection.readyState === 1) {
    return true;
  }
  
  // Already connecting, wait for it
  if (state.isConnecting && state.connectionPromise) {
    return state.connectionPromise;
  }
  
  // Start new connection
  state.isConnecting = true;
  state.connectionPromise = connectWithRetry(MAX_RECONNECT_ATTEMPTS, INITIAL_RETRY_DELAY);
  
  try {
    const result = await state.connectionPromise;
    state.isConnected = result;
    return result;
  } finally {
    state.isConnecting = false;
    state.connectionPromise = null;
  }
};

/**
 * Force reconnection - useful for handling connection drops
 */
export const forceReconnect = async (): Promise<boolean> => {
  logger.info('Force reconnecting to MongoDB...');
  
  // Disconnect first
  if (mongoose.connection.readyState !== 0) {
    try {
      await mongoose.disconnect();
    } catch (err) {
      logger.warn('Error during disconnect:', err);
    }
  }
  
  state.isConnected = false;
  state.isConnecting = false;
  
  // Reset retry counter for forced reconnect
  state.reconnectAttempts = 0;
  
  return connectWithRetry();
};

// ============================================
// Status & Health Check Functions
// ============================================

/**
 * Check if database is connected - FAST PATH with caching
 */
let _lastConnectionCheck = 0;
let _cachedConnectionStatus = false;
const CONNECTION_CHECK_CACHE_MS = 1000; // Cache for 1 second

export const isDBConnected = (): boolean => {
  const now = Date.now();
  
  // Return cached result if checked within cache window
  if (now - _lastConnectionCheck < CONNECTION_CHECK_CACHE_MS) {
    return _cachedConnectionStatus;
  }
  
  _lastConnectionCheck = now;
  _cachedConnectionStatus = state.isConnected || mongoose.connection.readyState === 1;
  return _cachedConnectionStatus;
};

/**
 * Get database connection state as string
 */
export const getDBState = (): string => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return states[mongoose.connection.readyState as keyof typeof states] || 'unknown';
};

/**
 * Get detailed connection status
 */
export const getConnectionStatus = (): {
  isConnected: boolean;
  isConnecting: boolean;
  state: string;
  reconnectAttempts: number;
  lastConnected: string | null;
  lastError: string | null;
  connectionId: number;
  mongoConnectionState: number;
} => {
  return {
    isConnected: state.isConnected,
    isConnecting: state.isConnecting,
    state: getDBState(),
    reconnectAttempts: state.reconnectAttempts,
    lastConnected: state.lastConnected?.toISOString() || null,
    lastError: state.lastError,
    connectionId: state.connectionId,
    mongoConnectionState: mongoose.connection.readyState,
  };
};

/**
 * Health check with detailed diagnostics
 */
export const healthCheck = async (): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  details: {
    isConnected: boolean;
    connectionState: string;
    databaseName: string;
    collections: number;
    avgDocumentSize: number;
    dataSize: number;
    storageSize: number;
    indexCount: number;
  };
  errors?: string[];
}> => {
  const startTime = Date.now();
  const errors: string[] = [];
  
  const isConnected = isDBConnected();
  
  if (!isConnected) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      details: {
        isConnected: false,
        connectionState: getDBState(),
        databaseName: 'unknown',
        collections: 0,
        avgDocumentSize: 0,
        dataSize: 0,
        storageSize: 0,
        indexCount: 0,
      },
      errors: ['Database not connected'],
    };
  }
  
  try {
    // Get database info - ensure connection.db exists
    const db = mongoose.connection.db;
    if (!db) {
      errors.push('Database connection not established');
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        details: {
          isConnected: false,
          connectionState: getDBState(),
          databaseName: 'unknown',
          collections: 0,
          avgDocumentSize: 0,
          dataSize: 0,
          storageSize: 0,
          indexCount: 0,
        },
        errors,
      };
    }
    
    const adminDb = db.admin();
    const serverStatus = await adminDb.serverStatus();
    const dbStats = await db.stats();
    
    const responseTime = Date.now() - startTime;
    const status = responseTime < 1000 ? 'healthy' : responseTime < 3000 ? 'degraded' : 'unhealthy';
    
    const errorList: string[] = errors.length > 0 ? errors : [];
    
    return {
      status,
      responseTime,
      details: {
        isConnected: true,
        connectionState: getDBState(),
        databaseName: db.databaseName,
        collections: dbStats.collections || 0,
        avgDocumentSize: dbStats.avgObjSize || 0,
        dataSize: dbStats.dataSize || 0,
        storageSize: dbStats.storageSize || 0,
        indexCount: serverStatus.indexCounters?. accesses || 0,
      },
      errors: errorList,
    };
  } catch (err: any) {
    const errorMessage = err?.message || 'Health check failed';
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      details: {
        isConnected: false,
        connectionState: getDBState(),
        databaseName: 'unknown',
        collections: 0,
        avgDocumentSize: 0,
        dataSize: 0,
        storageSize: 0,
        indexCount: 0,
      },
      errors: [errorMessage],
    };
  }
};

/**
 * Ping the database
 */
export const pingDB = async (): Promise<boolean> => {
  try {
    if (!mongoose.connection.db) {
      return false;
    }
    await mongoose.connection.db.command({ ping: 1 });
    return true;
  } catch {
    return false;
  }
};

// ============================================
// Query Cache with TTL - Performance Optimization
// ============================================

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class QueryCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL: number = 30000; // 30 seconds default TTL - increased from 5s
  private maxCacheSize: number = 1000; // Increased from 100 for better caching
  private cleanupInterval: NodeJS.Timeout | null = null;
  // Hit/miss tracking
  private hits: number = 0;
  private misses: number = 0;

  constructor() {
    // Cleanup expired entries every 10 seconds
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => this.cleanup(), 10000);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < now) {
        this.cache.delete(key);
      }
    }
    // If cache is too large, remove oldest entries
    if (this.cache.size > this.maxCacheSize) {
      const entriesToRemove = this.cache.size - this.maxCacheSize;
      const keys = Array.from(this.cache.keys()).slice(0, entriesToRemove);
      keys.forEach(key => this.cache.delete(key));
    }
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }
    
    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }
    
    this.hits++;
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttl?: number): void {
    // Don't cache null/undefined
    if (data === null || data === undefined) return;
    
    // Remove oldest if at capacity
    if (this.cache.size >= this.maxCacheSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + (ttl || this.defaultTTL),
    });
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }
    // Invalidate keys matching pattern
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  invalidatePrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  getStats(): { size: number; hits: number; misses: number; hitRate: number } {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? this.hits / total : 0,
    };
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
  }
}

export const queryCache = new QueryCache();

// Cache helper for MongoDB queries
export const cachedQuery = async <T>(
  cacheKey: string,
  queryFn: () => Promise<T>,
  ttl?: number
): Promise<T> => {
  // Check cache first
  const cached = queryCache.get<T>(cacheKey);
  if (cached !== null) {
    return cached;
  }
  
  // Execute query
  const result = await queryFn();
  
  // Cache result
  queryCache.set(cacheKey, result, ttl);
  
  return result;
};

// ============================================
// Graceful Shutdown
// ============================================

/**
 * Graceful shutdown handler
 */
export const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`${signal} received, shutting down gracefully...`);
  
  try {
    if (mongoose.connection.readyState !== 0) {
      // Wait for pending operations to complete (with timeout)
      await Promise.race([
        mongoose.connection.close(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Close timeout')), 5000)
        ),
      ]);
      logger.info('MongoDB connection closed gracefully');
    } else {
      logger.info('MongoDB already disconnected');
    }
  } catch (err) {
    logger.error('Error during shutdown:', err);
    // Force close if graceful close fails
    try {
      await mongoose.disconnect();
    } catch (forceErr) {
      logger.error('Force disconnect failed:', forceErr);
    }
  }
  
  state.isConnected = false;
};

// ============================================
// Event Handlers Setup
// ============================================

const setupEventHandlers = () => {
  mongoose.connection.on('connected', () => {
    logger.info('MongoDB connection established');
    state.isConnected = true;
    state.isConnecting = false;
    state.lastConnected = new Date();
    state.lastError = null;
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB connection lost');
    state.isConnected = false;
    
    // Auto-reconnect in non-serverless environments
    if (!isServerless) {
      logger.info('Attempting to reconnect...');
      setTimeout(() => {
        if (!state.isConnected) {
          forceReconnect();
        }
      }, 1000);
    }
  });

  mongoose.connection.on('error', (err) => {
    logger.error('MongoDB connection error:', err?.message || err);
    state.isConnected = false;
    state.lastError = err?.message || 'Unknown error';
  });

  mongoose.connection.on('reconnectFailed', () => {
    logger.error('MongoDB reconnection failed after all retries');
    state.reconnectAttempts = MAX_RECONNECT_ATTEMPTS;
  });

  mongoose.connection.on('reconnect', (attempt) => {
    logger.info(`MongoDB reconnected after ${attempt} attempts`);
    state.isConnected = true;
    state.reconnectAttempts = 0;
    state.lastConnected = new Date();
  });

  mongoose.connection.on('close', () => {
    logger.info('MongoDB connection closed');
    state.isConnected = false;
  });
};

// ============================================
// Initialize Connection
// ============================================

setupEventHandlers();

// Initialize connection on module load for non-serverless environments
if (!isServerless && MONGODB_URI && validateConnectionString(MONGODB_URI)) {
  logger.info('Initializing MongoDB connection...');
  connectWithRetry().then(connected => {
    state.isConnected = connected;
    logger.info(`Initial connection ${connected ? 'succeeded' : 'failed'}`);
  }).catch(err => {
    logger.error('Initial connection error:', err);
  });
}

// For serverless, the lazy connectDB() will be called before each request
// via the middleware in index.ts

// ============================================
// Export
// ============================================

export { mongoose };
export default {
  connectDB,
  isDBConnected,
  getDBState,
  getConnectionStatus,
  healthCheck,
  pingDB,
  forceReconnect,
  gracefulShutdown,
};

