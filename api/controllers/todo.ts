import type { Request, Response } from 'express';
import { Todo } from '../models/Todo';
import { isValidObjectId } from 'mongoose';
import { z } from 'zod';
import { logger } from '../utils/logger';
import { queryCache } from '../utils/database';
import redisTodoCache from '../utils/redisTodoCache';



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

const invalidateTodoCache = async (userId: string) => {
  try {
    queryCache.invalidatePrefix(`todos:${userId}`);
    await redisTodoCache.invalidateUserTodos(userId);
  } catch (err) {
    logger.warn('[TodoCache] Invalidate failed:', err);
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

    const { text: todoText, category, priority, tags, dueDate } = result.data;

    const existingTodo = await Todo.findOne({ user: userId, text: todoText }).lean();
    if (existingTodo) {
      invalidateTodoCache(userId);
      return res.status(409).json({
        error: 'Todo already exists',
        existing: serializeTodo(existingTodo)
      });
    }

    // DSA OPTIMIZATION: O(1) Linked List Insert at Head
    const session = await Todo.startSession();
    await session.withTransaction(async () => {
      // Find current head (first todo, nextTodoId=null)
      const currentHead = await Todo.findOne({ 
        user: userId, 
        nextTodoId: null 
      }).select('_id').lean();

      const todo = new Todo({
        text: todoText,
        user: userId,
        category,
        priority,
        tags,
        dueDate: dueDate || null,
        // Linked list: New head has no next, points to old head as prev
        nextTodoId: currentHead?._id || null,
        prevTodoId: null,  // New head
        order: 0,  // Legacy field (can deprecate later)
      });
      await todo.save();

      // Update old head's prevTodoId to new todo (if exists)
      if (currentHead?._id) {
        await Todo.updateOne(
          { _id: currentHead._id },
          { $set: { prevTodoId: todo._id } }
        );
      }
    });
    session.endSession();

    invalidateTodoCache(userId);

    const savedTodo = await Todo.findById(todo._id).select(EXCLUDE_FIELDS).lean();
    return res.status(201).json({
      todo: serializeTodo(savedTodo),
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

    // Redis cache first (fast path)
    let todos = await redisTodoCache.getTodosSnapshot(userId);
    if (!todos) {
      // Fallback to DB + existing queryCache
      todos = await Todo.find({ user: userId })
        .select(EXCLUDE_FIELDS)
        .sort({ order: 1, createdAt: -1 })
        .lean();
      // Cache the snapshot
      await redisTodoCache.setTodosSnapshot(userId, todos);
    }

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

    // DSA OPTIMIZATION: O(1) Linked List Removal
    const todoToDelete = await Todo.findOne({ _id: id, user: userId })
      .select('nextTodoId prevTodoId order')
      .lean();
    
    if (!todoToDelete) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    const session = await Todo.startSession();
    await session.withTransaction(async () => {
      // Step 1: Link prev → next (if prev exists)
      if (todoToDelete.prevTodoId) {
        await Todo.updateOne(
          { _id: todoToDelete.prevTodoId, user: userId },
          { $set: { nextTodoId: todoToDelete.nextTodoId } }
        );
      }

      // Step 2: Link next → prev (if next exists)
      if (todoToDelete.nextTodoId) {
        await Todo.updateOne(
          { _id: todoToDelete.nextTodoId, user: userId },
          { $set: { prevTodoId: todoToDelete.prevTodoId } }
        );
      }

      // Step 3: Delete target (max 3 operations total → O(1))
      await Todo.deleteOne({ _id: id });
    });
    session.endSession();

    invalidateTodoCache(userId);
    logger.info('Linked list delete completed:', { userId, todoId: id });
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

    const { todos } = req.body as { todos: Array<{ id: string }> };
    if (!Array.isArray(todos) || todos.length === 0) {
      return res.status(400).json({ error: 'Invalid todos array' });
    }

    // DSA OPTIMIZATION: O(K) Linked List Splice
    // Step 1: Load all todos with links → build full list graph
    const allTodos = await Todo.find({ user: userId })
      .select('_id nextTodoId prevTodoId')
      .lean();

    const todoMap = new Map(allTodos.map(t => [t._id.toString(), t]));
    const headId = Array.from(todoMap.values()).find(t => !t.prevTodoId)?._id;

    // Step 2: Build current linked list order
    const currentOrder: string[] = [];
    let current = headId;
    while (current) {
      currentOrder.push(current);
      current = todoMap.get(current)?.nextTodoId?.toString();
    }

    // Step 3: Compute new order from client request (dedupe/validate)
    const newOrderSet = new Set(todos.map(t => t.id).filter(isValidObjectId));
    const newOrder = Array.from(newOrderSet);

    // Validate all IDs exist
    for (const id of newOrder) {
      if (!todoMap.has(id)) {
        return res.status(400).json({ error: `Todo ${id} not found` });
      }
    }

// Step 4: Transaction - rebuild list + SYNC LEGACY ORDER FIELD (CRITICAL FIX)
    logger.info('REORDER DEBUG', { userId, count: newOrder.length, newOrder: newOrder.map(id=>id.slice(-4)) });
    
    const session = await Todo.startSession();
    await session.withTransaction(async () => {
      // Detach all todos (set prev/next null)
      await Todo.updateMany(
        { _id: { $in: Array.from(todoMap.keys()) } },
        { $set: { prevTodoId: null, nextTodoId: null } }
      );

// Rebuild chain + LEGACY ORDER AT ONCE (batch for consistency)
      for (let i = 0; i < newOrder.length; i++) {
        const todoId = newOrder[i];
        const prevId = i > 0 ? newOrder[i-1] : null;
        const nextId = i < newOrder.length - 1 ? newOrder[i+1] : null;

        await Todo.updateOne(
          { _id: todoId },
          { 
            $set: { 
              prevTodoId: prevId,
              nextTodoId: nextId,
              order: i  // CRITICAL FIX
            } 
          }
        );
      }
      logger.info('REORDER DEBUG - order field batch UPDATE', { userId, first5: newOrder.slice(0,5).map(id=>id.slice(-4)) });

    });
    session.endSession();


    invalidateTodoCache(userId);
    logger.info('Linked list reorder + order sync completed:', { userId, count: newOrder.length });

    // RETURN: Fresh query post-transaction (order confirmed)
    const reorderedTodos = await Todo.find({ user: userId })
      .select(EXCLUDE_FIELDS)
      .sort({ order: 1 })
      .lean();
    
    // DEBUG verify order field
    const orders = reorderedTodos.map(t => t.order);
    logger.info('REORDER CONFIRM', { 
      userId, 
      count: reorderedTodos.length,
      orders: orders.slice(0,5),
      expected: Array.from({length: reorderedTodos.length}, (_,i)=>i).slice(0,5)
    });

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
