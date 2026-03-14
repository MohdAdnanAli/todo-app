import type { Request, Response } from 'express';
import { Todo } from '../models/Todo';
import { isValidObjectId } from 'mongoose';
import { z } from 'zod';
import { logger } from '../utils/logger';
import { queryCache } from '../utils/database';

const CATEGORIES = ['work', 'personal', 'shopping', 'health', 'other'] as const;
const PRIORITIES = ['low', 'medium', 'high'] as const;

// Fields to exclude from responses for performance
const EXCLUDE_FIELDS = '-__v';

// Helper function to serialize todo objects from MongoDB
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

// Helper to serialize array of todos
const serializeTodos = (todos: any[]) => todos.map(serializeTodo);

// Invalidate todo cache for a user - FIRE AND FORGET for performance
// This runs asynchronously without blocking the response
const invalidateTodoCache = (userId: string) => {
  // Fire and forget - cache invalidation is not critical
  try {
    queryCache.invalidatePrefix(`todos:${userId}`);
  } catch {
    // Silently ignore cache errors
  }
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

const updateTodoSchema = z.object({
  text: z.string().min(1).max(500).optional(),
  completed: z.boolean().optional(),
  category: z.enum(CATEGORIES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  tags: z.array(z.string().max(50)).optional(),
  dueDate: z.string().optional().nullable(),
  participants: z.array(z.object({
    id: z.string(),
    name: z.string(),
    avatar: z.string().optional(),
  })).optional(),
  order: z.number().optional(),
});

const reorderTodosSchema = z.object({
  todos: z.array(z.object({
    id: z.string(),
    order: z.number().optional(),
  })).min(1).max(1000, 'Cannot reorder more than 1000 todos at once'),
});

// Pagination schema
const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
});

// NEW: Delta endpoint for incremental sync - todos updated since timestamp
const deltaTodosSchema = z.object({
  since: z.string().datetime().optional(),
});

export const getTodosDelta = async (req: Request & { user?: { id: string } }, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const validation = deltaTodosSchema.safeParse(req.query);
    const sinceTimestamp = validation.success && validation.data.since ? new Date(validation.data.since) : undefined;

    // Delta query: updatedAt > since OR createdAt > since
    const query: any = { user: userId };
    if (sinceTimestamp) {
      query.$or = [
        { updatedAt: { $gt: sinceTimestamp } },
        { createdAt: { $gt: sinceTimestamp } }
      ];
    }

    const deltaTodos = await Todo.find(query)
      .select(EXCLUDE_FIELDS)
      .sort({ updatedAt: -1 }) // Newest changes first
      .lean();

    const serialized = serializeTodos(deltaTodos);

    res.json(serialized);
  } catch (err) {
    logger.error('GetTodosDelta error:', err);
    return res.status(500).json({ error: 'Failed to fetch delta todos' });
  }
};

export const getTodos = async (req: Request & { user?: { id: string } }, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Parse pagination params
    const pagination = paginationSchema.safeParse(req.query);
    const page = pagination.success ? pagination.data.page : 1;
    const limit = pagination.success ? pagination.data.limit : 50;
    const skip = (page - 1) * limit;
    
    // Check for cache first (only for first page without filters)
    const cacheKey = `todos:${userId}:p${page}:l${limit}`;
    const cached = queryCache.get<any[]>(cacheKey);
    if (cached !== null && page === 1) {
      // Generate ETag for cached content
      const etag = `W/"${Buffer.from(JSON.stringify(cached)).toString('base64')}"`;
      
      // Check If-None-Match header
      if (req.headers['if-none-match'] === etag) {
        return res.status(304).end();
      }
      
      res.setHeader('ETag', etag);
      res.setHeader('Cache-Control', 'private, max-age=3'); // Cache for 3 seconds
      return res.json(cached);
    }
    
    // Always sort by order ascending (lowest number = top)
    // For same order, use createdAt as secondary sort (newer first)
    // Use lean() for faster queries + select() to exclude __v
    const todos = await Todo.find({ user: userId })
      .select(EXCLUDE_FIELDS)
      .sort({ order: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const serialized = serializeTodos(todos);
    
    // Generate ETag
    const etag = `W/"${Buffer.from(JSON.stringify(serialized)).toString('base64')}"`;
    
    // Check If-None-Match header
    if (req.headers['if-none-match'] === etag) {
      return res.status(304).end();
    }
    
    // Set caching headers
    res.setHeader('ETag', etag);
    res.setHeader('Cache-Control', page === 1 ? 'private, max-age=3' : 'no-cache');
    
    // Cache first page results for 3 seconds
    if (page === 1) {
      queryCache.set(cacheKey, serialized, 3000);
    }

    // Serialize todos to ensure proper JSON serialization
    return res.json(serialized);
  } catch (err) {
    logger.error('GetTodos error:', err);
    return res.status(500).json({ error: 'Failed to fetch todos' });
  }
};

export const createTodo = async (req: Request & { user?: { id: string } }, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const result = createTodoSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.issues[0]?.message || 'Validation error' });
    }

    const { text, category, priority, tags, dueDate } = result.data;

    // Optimized: Use findOne with sort to get min order - no transaction needed for single insert
    const minOrderDoc = await Todo.findOne({ user: userId })
      .sort({ order: 1 })
      .select('order')
      .lean();
    
    // New todos go to the TOP (lowest order = displayed first)
    // If no todos exist, order is 0; otherwise use minOrder - 1
    // Ensure order doesn't go negative
    const newOrder = minOrderDoc ? Math.max(0, (minOrderDoc.order ?? 1) - 1) : 0;

    // Create new todo - single document insert doesn't need transaction
    const [todo] = await Todo.create([{
      text,
      user: userId,
      category,
      priority,
      tags,
      dueDate: dueDate || null,
      order: newOrder,
    }]);

    // Invalidate cache for this user
    invalidateTodoCache(userId);

    // Optimized: Return only the new todo instead of all todos
    return res.status(201).json({
      todo: serializeTodo(todo),
      // Also return a flag to indicate full sync needed (for when client receives delta)
      fullSync: false,
    });
  } catch (err) {
    logger.error('CreateTodo error:', err);
    return res.status(500).json({ error: 'Failed to create todo' });
  }
};

export const updateTodo = async (req: Request & { user?: { id: string } }, res: Response) => {
  try {
    const { id } = req.params;

    // Validate ID format to prevent invalid ObjectId errors
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid todo ID' });
    }

    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const result = updateTodoSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.issues[0]?.message || 'Validation error' });
    }

    // Use lean() + select() for faster update query
    const todo = await Todo.findOneAndUpdate(
      { _id: id, user: userId },
      { $set: result.data },
      { new: true, runValidators: true }
    ).select(EXCLUDE_FIELDS).lean();

    if (!todo) {
      return res.status(404).json({ error: 'Todo not found or not owned by user' });
    }

    // Invalidate cache for this user
    invalidateTodoCache(userId);

    // Optimized: Return only the updated todo
    return res.json(serializeTodo(todo));
  } catch (err) {
    logger.error('UpdateTodo error:', err);
    return res.status(500).json({ error: 'Failed to update todo' });
  }
};

export const deleteTodo = async (req: Request & { user?: { id: string } }, res: Response) => {
  try {
    const { id } = req.params;

    // Validate ID format to prevent invalid ObjectId errors
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid todo ID' });
    }

    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Get the order of the todo being deleted BEFORE deleting
    const todoToDelete = await Todo.findOne({ _id: id, user: userId })
      .select('order')
      .lean();

    if (!todoToDelete) {
      return res.status(404).json({ error: 'Todo not found or not owned by user' });
    }

    const deletedOrder = todoToDelete.order;

    // Optimized: Simple delete without transaction - single document operation
    const result = await Todo.deleteOne({ _id: id, user: userId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Todo not found or not owned by user' });
    }

    // OPTIMIZED: Only update orders for items that were AFTER the deleted item
    // This is much faster than rebuilding ALL orders
    await Todo.updateMany(
      { user: userId, order: { $gt: deletedOrder } },
      { $inc: { order: -1 } }
    );

    // Invalidate cache for this user (fire and forget)
    invalidateTodoCache(userId);

    // Optimized: Return only the deleted todo ID instead of full list
    return res.json({ 
      deletedId: id,
      fullSync: false,
    });
  } catch (err) {
    logger.error('DeleteTodo error:', err);
    return res.status(500).json({ error: 'Failed to delete todo' });
  }
};

// Batch reorder todos - efficient way to save order after drag and drop
export const reorderTodos = async (req: Request & { user?: { id: string } }, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const result = reorderTodosSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.issues[0]?.message || 'Validation error' });
    }

    const { todos } = result.data;

    // Use the order values provided by frontend (based on array position after drag/drop)
    // If order is not provided, fall back to using array index
    const bulkOps = todos.map(({ id, order }, index) => ({
      updateOne: {
        filter: { _id: id, user: userId },
        update: { $set: { order: order ?? index } },
      },
    }));

    if (bulkOps.length > 0) {
      try {
        await Todo.bulkWrite(bulkOps);
      } catch (bulkError) {
        logger.error('Bulk write failed during reorder:', bulkError);
        return res.status(500).json({ error: 'Failed to reorder todos' });
      }
    }

    // Invalidate cache for this user
    invalidateTodoCache(userId);

    // Fetch all todos with the new order and return to client
    const reorderedTodos = await Todo.find({ user: userId })
      .select(EXCLUDE_FIELDS)
      .sort({ order: 1, createdAt: -1 })
      .lean();

    const serialized = serializeTodos(reorderedTodos);

    // Optimized: Return all todos with new order
    return res.json(serialized);
  } catch (err) {
    logger.error('ReorderTodos error:', err);
    return res.status(500).json({ error: 'Failed to reorder todos' });
  }
};

// NEW: Batch sync endpoint for offline queue
const batchSyncSchema = z.object({
  creates: z.array(createTodoSchema).max(50, 'Max 50 creates per batch'),
  updates: z.array(z.object({
    id: z.string(),
    data: updateTodoSchema,
  })).max(50, 'Max 50 updates per batch'),
  deletes: z.array(z.string()).max(50, 'Max 50 deletes per batch'),
});

export const batchSync = async (req: Request & { user?: { id: string } }, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const result = batchSyncSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.issues[0]?.message || 'Validation error' });
    }

    const { creates, updates, deletes } = result.data;

    const bulkOps = [];

    // Deletes first (order matters)
    for (const id of deletes) {
      if (!isValidObjectId(id)) continue;
      bulkOps.push({
        deleteOne: {
          filter: { _id: id, user: userId },
        },
      });
    }

    // Updates
    for (const { id, data } of updates) {
      if (!isValidObjectId(id)) continue;
      bulkOps.push({
        updateOne: {
          filter: { _id: id, user: userId },
          update: { $set: data },
        },
      });
    }

    // Creates (upsert false, error if duplicate)
    for (const data of creates) {
      bulkOps.push({
        insertOne: {
          document: {
            ...data,
            user: userId,
            // Auto order: find min - gap, but batch so append to end for simplicity
            order: 999999, // Frontend will reorder after sync
          },
        },
      });
    }

    if (bulkOps.length === 0) {
      return res.json({ success: true, processed: { creates: 0, updates: 0, deletes: 0 } });
    }

    const resultBulk = await Todo.bulkWrite(bulkOps, { ordered: false });

    invalidateTodoCache(userId);

    const processed = {
      creates: resultBulk.nInserted || 0,
      updates: (resultBulk.nMatched || 0) + (resultBulk.nModified || 0),
      deletes: resultBulk.nRemoved || 0,
    };

    res.json({ 
      success: true, 
      processed,
      total: bulkOps.length 
    });
  } catch (err) {
    logger.error('BatchSync error:', err);
    return res.status(500).json({ error: 'Batch sync failed' });
  }
};


