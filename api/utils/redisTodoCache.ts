import Redis from 'ioredis';
import { logger } from './logger';
import type { HydratedDocument } from 'mongoose';
import type { Todo } from '../models/Todo';

// ============================================
// Redis Todo Cache - Distributed snapshots for O(1) list reads
// ============================================

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const TODO_CACHE_TTL = 30; // 30 seconds

class RedisTodoCache {
  private client: Redis;
  private ready: boolean = false;

  constructor() {
    this.client = new Redis(REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      enableReadyCheck: true,
      enableAutoPipelining: true,
    });

    this.client.on('ready', () => {
      logger.info('[RedisTodoCache] Connected and ready');
      this.ready = true;
    });

    this.client.on('error', (err) => {
      logger.error('[RedisTodoCache] Error:', err);
      this.ready = false;
    });

    this.client.on('close', () => {
      logger.warn('[RedisTodoCache] Connection closed');
      this.ready = false;
    });
  }

  async getTodosSnapshot(userId: string): Promise<any[] | null> {
    if (!this.ready) return null;

    try {
      const key = `todos:snapshot:${userId}`;
      const cached = await this.client.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (err) {
      logger.error('[RedisTodoCache] Get error:', err);
      return null;
    }
  }

  async setTodosSnapshot(userId: string, todos: any[]): Promise<void> {
    if (!this.ready) return;

    try {
      const key = `todos:snapshot:${userId}`;
      await this.client.setex(key, TODO_CACHE_TTL, JSON.stringify(todos));
      logger.debug(`[RedisTodoCache] Set snapshot for ${userId}, size: ${todos.length}`);
    } catch (err) {
      logger.error('[RedisTodoCache] Set error:', err);
    }
  }

  async invalidateUserTodos(userId: string): Promise<void> {
    if (!this.ready) return;

    try {
      const keys = await this.client.keys(`todos:snapshot:${userId}:*`);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
      // Also invalidate specific snapshot
      await this.client.del(`todos:snapshot:${userId}`);
      logger.info(`[RedisTodoCache] Invalidated todos for ${userId}`);
    } catch (err) {
      logger.error('[RedisTodoCache] Invalidate error:', err);
    }
  }

  async disconnect(): Promise<void> {
    if (this.ready) {
      await this.client.quit();
    }
  }

  isReady(): boolean {
    return this.ready;
  }
}

export const redisTodoCache = new RedisTodoCache();

export default redisTodoCache;

