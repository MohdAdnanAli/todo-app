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

    // Recent-first: new todos get lowest order (top after sort order:1)
    const minOrderDoc = await Todo.findOne({ user: userId }).sort({ order: 1 }).select('order').lean();
    const newOrder = minOrderDoc ? (minOrderDoc.order ?? 0) - 1 : 0;

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
      logger.warn('Duplicate todo blocked by index:', { userId: (req as any).user?.id, text });
      return res.status(409).json({ error: 'Todo already exists' });
    }
    logger.error('CreateTodo error:', err);
    return res.status(500).json({ error: 'Failed to create todo' });
  }
};

export const getTodos = async (req: Request & { user?: { id: string } }, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const todos = await Todo.find({ user: userId })
      .select(EXCLUDE_FIELDS)
      .sort({ order: 1, createdAt: -1 })
      .lean();

    return res.json(serializeTodos(todos));
  } catch (err) {
    logger.error('GetTodos error:', err);
    return res.status(500).json({ error: 'Failed to fetch todos' });
  }
};

export const updateTodo = async (req: Request & { user?: { id: string } }, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    if (!userId || !isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    const todo = await Todo.findOneAndUpdate(
      { _id: id, user: userId },
      { $set: req.body },
      { new: true, runValidators: true }
    ).select(EXCLUDE_FIELDS).lean();

    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    invalidateTodoCache(userId);
    return res.json(serializeTodo(todo));
  } catch (err) {
    logger.error('UpdateTodo error:', err);
    return res.status(500).json({ error: 'Failed to update todo' });
  }
};

export const deleteTodo = async (req: Request & { user?: { id: string } }, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    if (!userId || !isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    const todoToDelete = await Todo.findOne({ _id: id, user: userId }).select('order').lean();
    if (!todoToDelete) return res.status(404).json({ error: 'Todo not found' });

    await Todo.deleteOne({ _id: id, user: userId });
    await Todo.updateMany(
      { user: userId, order: { $gt: todoToDelete.order } },
      { $inc: { order: -1 } }
    );

    invalidateTodoCache(userId);
    return res.json({ deletedId: id });
  } catch (err) {
    logger.error('DeleteTodo error:', err);
    return res.status(500).json({ error: 'Failed to delete todo' });
  }
};

export const reorderTodos = async (req: Request & { user?: { id: string } }, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const { todos } = req.body as { todos: Array<{ id: string; order: number }> };
    if (!Array.isArray(todos) || todos.length === 0) {
      return res.status(400).json({ error: 'Invalid todos array' });
    }

    const bulkOps = todos
      .filter(({ id }) => isValidObjectId(id))
      .map(({ id, order }, index) => ({
        updateOne: {
          filter: { _id: id, user: userId },
          update: { $set: { order: order ?? index } },
        },
      }));

    if (bulkOps.length === 0) {
      return res.status(400).json({ error: 'No valid todos' });
    }

    await Todo.bulkWrite(bulkOps);

    invalidateTodoCache(userId);

    const reorderedTodos = await Todo.find({ user: userId })
      .select(EXCLUDE_FIELDS)
      .sort({ order: 1 })  // order first (manual changes), then recent-first
      .lean();

    return res.json(serializeTodos(reorderedTodos));
  } catch (err) {
    logger.error('ReorderTodos error:', err);
    return res.status(500).json({ error: 'Failed to reorder' });
  }
};

export const batchSync = async (req: Request & { user?: { id: string } }, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const { creates = [], updates = [], deletes = [] } = req.body || {};

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
        creates: (resultBulk as any).nMatched || 0,
        updates: (resultBulk as any).nModified || 0,
        deletes: (resultBulk as any).nRemoved || 0,
      },
      total: bulkOps.length 
    });
  } catch (err) {
    logger.error('BatchSync error:', err);
    return res.status(500).json({ error: 'Batch sync failed' });
  }
};

export const getTodosDelta = async (req: Request & { user?: { id: string } }, res: Response) => {
  try {    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    
    const { since } = req.query as { since?: string };
    const query: any = { user: userId };
    
    if (since) {
      const sinceDate = new Date(since);
      query.$or = [{ updatedAt: { $gt: sinceDate } }, { createdAt: { $gt: sinceDate } }];
    }
    
    const deltaTodos = await Todo.find(query).select(EXCLUDE_FIELDS).sort({ updatedAt: -1 }).lean();
    res.json(serializeTodos(deltaTodos));
  } catch (err) {
    logger.error('GetTodosDelta error:', err);
    res.status(500).json({ error: 'Failed to fetch delta' });
  }
};

// Keep other exports for compatibility
export * from './todo';
