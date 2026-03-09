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

// Invalidate todo cache for a user
const invalidateTodoCache = (userId: string) => {
  queryCache.invalidatePrefix(`todos:${userId}`);
};

const createTodoSchema = z.object({
  text: z.string().min(1, 'Task text is required').max(500),
  category: z.enum(CATEGORIES).optional().default('other'),
  priority: z.enum(PRIORITIES).optional().default('medium'),
  tags: z.array(z.string().max(50)).optional().default([]),
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

    const { text, category, priority, tags } = result.data;

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

    // Optimized: Simple delete without transaction - single document operation
    const todo = await Todo.findOneAndDelete({ _id: id, user: userId }).lean();

    if (!todo) {
      return res.status(404).json({ error: 'Todo not found or not owned by user' });
    }

    // Normalize orders after deletion - use bulkWrite for efficiency
    const remainingTodos = await Todo.find({ user: userId })
      .sort({ order: 1 })
      .select('_id order')
      .lean();

    if (remainingTodos.length > 0) {
      // Rebuild all orders sequentially using bulkWrite (more efficient than individual updates)
      const bulkOps = remainingTodos.map((t, index) => ({
        updateOne: {
          filter: { _id: t._id },
          update: { $set: { order: index } },
        },
      }));
      
      await Todo.bulkWrite(bulkOps);
    }

    // Invalidate cache for this user
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

    // Optimized: Return success with count instead of full list
    return res.json({ 
      success: true, 
      count: todos.length,
      fullSync: false,
    });
  } catch (err) {
    logger.error('ReorderTodos error:', err);
    return res.status(500).json({ error: 'Failed to reorder todos' });
  }
};

