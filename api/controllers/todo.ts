import type { Request, Response } from 'express';
import { Todo } from '../models/Todo';
import { isValidObjectId } from 'mongoose';
import { z } from 'zod';
import { logger } from '../utils/logger';

const CATEGORIES = ['work', 'personal', 'shopping', 'health', 'other'] as const;
const PRIORITIES = ['low', 'medium', 'high'] as const;

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
  participants: z.array(z.object({    id: z.string(),
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

export const getTodos = async (req: Request & { user?: { id: string } }, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Always sort by order ascending (lowest number = top)
    // For same order, use createdAt as secondary sort (newer first)
    const todos = await Todo.find({ user: userId })
      .sort({ order: 1, createdAt: -1 })
      .lean();

    // Serialize todos to ensure proper JSON serialization
    return res.json(serializeTodos(todos));
  } catch (err) {
    logger.error('GetTodos error:', err);
    return res.status(500).json({ error: 'Failed to fetch todos' });
  }
};

export const createTodo = async (req: Request & { user?: { id: string } }, res: Response) => {
  const session = await Todo.startSession();
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

    // Use MongoDB transaction to prevent race conditions
    // This ensures atomic order calculation
    let newOrder: number;
    
    session.startTransaction();
    
    try {
      // Use aggregation to atomically get min order and calculate new order
      // This prevents race conditions between concurrent creates
      const minOrderDoc = await Todo.findOne({ user: userId })
        .sort({ order: 1 })
        .select('order')
        .session(session);
      
      // New todos go to the TOP (lowest order = displayed first)
      // If no todos exist, order is 0; otherwise use minOrder - 1
      // Ensure order doesn't go negative
      newOrder = minOrderDoc ? Math.max(0, (minOrderDoc.order ?? 1) - 1) : 0;

      // Create new todo with calculated order
      const todo = await Todo.create([{
        text,
        user: userId,
        category,
        priority,
        tags,
        order: newOrder,
      }], { session });

      await session.commitTransaction();
    } catch (txError) {
      await session.abortTransaction();
      throw txError;
    }

    // Return all todos sorted by order for immediate sync
    const allTodos = await Todo.find({ user: userId })
      .sort({ order: 1, createdAt: -1 })
      .lean();

    // Serialize todos to ensure proper JSON serialization
    return res.status(201).json(serializeTodos(allTodos));
  } catch (err) {
    logger.error('CreateTodo error:', err);
    return res.status(500).json({ error: 'Failed to create todo' });
  } finally {
    session.endSession();
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

    const todo = await Todo.findOneAndUpdate(
      { _id: id, user: userId },
      { $set: result.data },
      { new: true, runValidators: true }
    );

    if (!todo) {
      return res.status(404).json({ error: 'Todo not found or not owned by user' });
    }

    // Serialize todo to ensure proper JSON serialization
    return res.json(serializeTodo(todo));
  } catch (err) {
    logger.error('UpdateTodo error:', err);
    return res.status(500).json({ error: 'Failed to update todo' });
  }
};

export const deleteTodo = async (req: Request & { user?: { id: string } }, res: Response) => {
  const session = await Todo.startSession();
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

    session.startTransaction();
    
    let todo;
    try {
      todo = await Todo.findOneAndDelete({ _id: id, user: userId }).session(session);

      if (!todo) {
        await session.abortTransaction();
        return res.status(404).json({ error: 'Todo not found or not owned by user' });
      }

      // Normalize orders after deletion to remove gaps
      // This ensures sequential order: 0, 1, 2, 3, ...
      const remainingTodos = await Todo.find({ user: userId })
        .sort({ order: 1 })
        .select('_id order')
        .session(session);

      if (remainingTodos.length > 0) {
        // Rebuild all orders sequentially
        const bulkOps = remainingTodos.map((t, index) => ({
          updateOne: {
            filter: { _id: t._id },
            update: { $set: { order: index } },
          },
        }));
        
        // Add error handling for bulkWrite
        try {
          await Todo.bulkWrite(bulkOps, { session });
        } catch (bulkError) {
          logger.error('Bulk write failed during delete:', bulkError);
          await session.abortTransaction();
          return res.status(500).json({ error: 'Failed to reorder todos after deletion' });
        }
      }

      await session.commitTransaction();
    } catch (txError) {
      await session.abortTransaction();
      throw txError;
    }

    // Return all todos sorted by order for immediate sync
    const allTodos = await Todo.find({ user: userId })
      .sort({ order: 1, createdAt: -1 })
      .lean();

    // Serialize todos to ensure proper JSON serialization
    return res.json(serializeTodos(allTodos));
  } catch (err) {
    logger.error('DeleteTodo error:', err);
    return res.status(500).json({ error: 'Failed to delete todo' });
  } finally {
    session.endSession();
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
      // Add error handling for bulkWrite
      try {
        await Todo.bulkWrite(bulkOps);
      } catch (bulkError) {
        logger.error('Bulk write failed during reorder:', bulkError);
        return res.status(500).json({ error: 'Failed to reorder todos' });
      }
    }

    // Return all todos sorted by order for immediate sync across devices
    const allTodos = await Todo.find({ user: userId })
      .sort({ order: 1, createdAt: -1 })
      .lean();

    // Serialize todos to ensure proper JSON serialization
    return res.json(serializeTodos(allTodos));
  } catch (err) {
    logger.error('ReorderTodos error:', err);
    return res.status(500).json({ error: 'Failed to reorder todos' });
  }
};

