import type { Request, Response } from 'express';
import { Todo } from '../models/Todo';
import { isValidObjectId } from 'mongoose';
import { z } from 'zod';
import { logger } from '../utils/logger';
import { queryCache } from '../utils/database';

const CATEGORIES = ['work', 'personal', 'shopping', 'health', 'other'] as const;
const PRIORITIES = ['low', 'medium', 'high'] as const;

const EXCLUDE_FIELDS = '-__v';

const serializeTodo = (todo: any) => ({
  _id: todo._id?.toString(),
  text: todo.text,
  completed: todo.completed,
  category: todo.category,
  priority: todo.priority,
  tags: todo.tags || [],
  dueDate: todo.dueDate ? new Date(todo.dueDate).toISOString() : null,
  order: todo.order ?? 0,
  participants: todo.participants || [],
  createdAt: todo.createdAt ? new Date(todo.createdAt).toISOString() : new Date().toISOString(),
  updatedAt: todo.updatedAt ? new Date(todo.updatedAt).toISOString() : undefined,
});

const serializeTodos = (todos: any[]) => todos.map(serializeTodo);

const invalidateTodoCache = (userId: string) => {
  try {
    queryCache.invalidatePrefix(`todos:${userId}`);
  } catch {}
};

const createTodoSchema = z.object({
  text: z.string().min(1, 'Task text is required').max(500),
  category: z.enum(CATEGORIES).optional().default('other'),
  priority: z.enum(PRIORITIES).optional().default('medium'),
  tags: z.array(z.string().max(50)).optional().default([]),
  dueDate: z.string().optional().nullable(),
  participants: z.array(z.object({
    id: z.string(),
    name: z.string(),
    avatar: z.string().optional(),
  })).optional().default([]),
});

const batchSyncSchema = z.object({
  creates: z.array(createTodoSchema).optional().default([]),
  updates: z.array(z.object({
    id: z.string(),
    data: z.object({}).passthrough(),
  })).optional().default([]),
  deletes: z.array(z.string()).optional().default([]),
}).passthrough();

export const createTodo = async (req: Request & { user?: { id: string } }, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const result = createTodoSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: result.error.issues[0]?.message || 'Validation error' });

    const { text, category, priority, tags, dueDate } = result.data;

    const existingTodo = await Todo.findOne({ user: userId, text }).lean();
    if (existingTodo) {
      invalidateTodoCache(userId);
      return res.status(409).json({
        error: 'Todo already exists',
        existing: serializeTodo(existingTodo)
      });
    }

    const minOrderDoc = await Todo.findOne({ user: userId }).sort({ order: 1 }).select('order').lean();
    const newOrder = minOrderDoc ? Math.max(0, (minOrderDoc.order ?? 1) - 1) : 0;

    const todo = new Todo({
      text,
      user: userId,
      category,
      priority,
      tags,
      dueDate: dueDate || null,
      order: newOrder,
    });
    await todo.save();

    invalidateTodoCache(userId);

    return res.status(201).json({
      todo: serializeTodo(todo),
      fullSync: false,
    });
  } catch (err: any) {
    if (err.code === 11000) {
      logger.warn('Duplicate todo blocked by index:', { userId, text });
      return res.status(409).json({ error: 'Todo already exists' });
    }
    logger.error('CreateTodo error:', err);
    return res.status(500).json({ error: 'Failed to create todo' });
  }
};

export const batchSync = async (req: Request & { user?: { id: string } }, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const result = batchSyncSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: result.error.issues[0]?.message || 'Validation error' });

    const { creates = [], updates = [], deletes = [] } = result.data;

    const bulkOps = [];

    for (const id of deletes) {
      if (!isValidObjectId(id)) continue;
      bulkOps.push({ deleteOne: { filter: { _id: id, user: userId } } });
    }

    for (const { id, data } of updates) {
      if (!isValidObjectId(id)) continue;
      bulkOps.push({ updateOne: { filter: { _id: id, user: userId }, update: { $set: data } } });
    }

    for (const data of creates) {
      bulkOps.push({
        updateOne: {
          filter: { user: userId, text: data.text },
          update: {
            $setOnInsert: {
              category: data.category,
              priority: data.priority,
              tags: data.tags,
              dueDate: data.dueDate || null,
              order: 999999,
            }
          },
          upsert: true
        }
      });
    }

    if (bulkOps.length === 0) return res.json({ success: true, processed: { creates: 0, updates: 0, deletes: 0 } });

    const resultBulk = await Todo.bulkWrite(bulkOps, { ordered: false });

    invalidateTodoCache(userId);

    res.json({ 
      success: true, 
      processed: {
        creates: resultBulk.nMatched || 0,
        updates: resultBulk.nModified || 0,
        deletes: resultBulk.nRemoved || 0,
      },
      total: bulkOps.length 
    });
  } catch (err) {
    logger.error('BatchSync error:', err);
    return res.status(500).json({ error: 'Batch sync failed' });
  }
};

// Keep other exports for compatibility
export * from './todo'; // getTodos, updateTodo, etc.
