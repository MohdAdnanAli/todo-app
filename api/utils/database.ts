import mongoose from 'mongoose';
import { logger } from './logger';

// Use consistent MongoDB URI - prefer MONGODB_URI, fallback to MONGO_URI
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!MONGODB_URI) {
  logger.error('MONGODB_URI environment variable is not set');
  // Don't throw in development - allow app to start for testing
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL === '1') {
    throw new Error('MONGODB_URI environment variable is required');
  }
}

// MongoDB connection options optimized for serverless and production
const mongooseOptions = {
  serverSelectionTimeoutMS: 15000, // 15 seconds to select server
  socketTimeoutMS: 45000, // 45 seconds for socket timeout
  maxPoolSize: 10, // Connection pool size
  minPoolSize: 2, // Minimum connections
  maxIdleTimeMS: 30000, // 30 seconds max idle time
  family: 4, // Use IPv4
  retryWrites: true, // Retry failed writes
  retryReads: true, // Retry failed reads
  // Serverless specific options
  ...(process.env.VERCEL === '1' && {
    maxPoolSize: 1,
    minPoolSize: 1,
  }),
};

// Connection state tracking
let isConnected = false;
let isConnecting = false;
let connectionPromise: Promise<boolean> | null = null;

/**
 * Connect to MongoDB with retry logic
 */
export const connectWithRetry = async (retries = 3, delay = 3000): Promise<boolean> => {
  if (!MONGODB_URI) {
    logger.error('Cannot connect: MONGODB_URI is not defined');
    return false;
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      logger.info(`MongoDB connection attempt ${attempt}/${retries}...`);
      await mongoose.connect(MONGODB_URI, mongooseOptions);
      logger.info('MongoDB connected successfully');
      isConnected = true;
      return true;
    } catch (err: any) {
      logger.error(`MongoDB connection attempt ${attempt}/${retries} failed:`, err?.message || 'Unknown error');
      
      if (attempt < retries) {
        logger.info(`Retrying in ${delay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        // Exponential backoff
        delay *= 2;
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
  if (isConnected || mongoose.connection.readyState === 1) {
    return true;
  }
  
  // Already connecting, wait for it
  if (isConnecting && connectionPromise) {
    return connectionPromise;
  }
  
  // Start new connection
  isConnecting = true;
  connectionPromise = connectWithRetry(3, 3000);
  
  try {
    const result = await connectionPromise;
    isConnected = result;
    return result;
  } finally {
    isConnecting = false;
    connectionPromise = null;
  }
};

/**
 * Check if database is connected
 */
export const isDBConnected = (): boolean => {
  return isConnected || mongoose.connection.readyState === 1;
};

/**
 * Get database connection state
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
 * Graceful shutdown handler
 */
export const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`${signal} received, shutting down gracefully...`);
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  } catch (err) {
    logger.error('Error during shutdown:', err);
  }
};

// Initialize connection on module load (non-blocking for non-serverless)
// For serverless, the lazy connectDB() will be called before each request
if (process.env.VERCEL !== '1' && MONGODB_URI) {
  connectWithRetry().then(connected => {
    isConnected = connected;
  });
}

// Setup connection event handlers
mongoose.connection.on('connected', () => {
  logger.info('MongoDB connection established');
  isConnected = true;
  isConnecting = false;
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB connection lost');
  isConnected = false;
});

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB connection error:', err);
  isConnected = false;
});

mongoose.connection.on('reconnectFailed', () => {
  logger.error('MongoDB reconnection failed after all retries');
});

// Export mongoose for direct access if needed
export { mongoose };
