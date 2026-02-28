import type { Request, Response } from 'express';
import { Todo } from '../models/Todo';
import { z } from 'zod';
import { logger } from '../utils/logger';

const CATEGORIES = ['work', 'personal', 'shopping', 'health', 'other'] as const;
const PRIORITIES = ['low', 'medium', 'high'] as const;

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
    order: z.number(),
  })),
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

    return res.json(todos);
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

    // Atomic approach: find max order and add new todo at max+1
    // This prevents race conditions when multiple devices create todos simultaneously
    const maxOrderTodo = await Todo.findOne({ user: userId })
      .sort({ order: -1 })
      .select('order')
      .lean();
    
    const newOrder = maxOrderTodo ? (maxOrderTodo.order || 0) + 1 : 0;

    // Create new todo with order at the top (highest order = displayed at top)
    const todo = await Todo.create({
      text,
      user: userId,
      category,
      priority,
      tags,
      order: newOrder,
    });

    // Return all todos sorted by order for immediate sync
    const allTodos = await Todo.find({ user: userId })
      .sort({ order: 1, createdAt: -1 })
      .lean();

    return res.status(201).json(allTodos);
  } catch (err) {
    logger.error('CreateTodo error:', err);
    return res.status(500).json({ error: 'Failed to create todo' });
  }
};

export const updateTodo = async (req: Request & { user?: { id: string } }, res: Response) => {
  try {
    const { id } = req.params;

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

    return res.json(todo);
  } catch (err) {
    logger.error('UpdateTodo error:', err);
    return res.status(500).json({ error: 'Failed to update todo' });
  }
};

export const deleteTodo = async (req: Request & { user?: { id: string } }, res: Response) => {
  try {
    const { id } = req.params;

    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const todo = await Todo.findOneAndDelete({ _id: id, user: userId });

    if (!todo) {
      return res.status(404).json({ error: 'Todo not found or not owned by user' });
    }

    // Normalize orders after deletion to remove gaps
    // This ensures sequential order: 0, 1, 2, 3, ...
    const remainingTodos = await Todo.find({ user: userId })
      .sort({ order: 1 })
      .select('_id order')
      .lean();

    if (remainingTodos.length > 0) {
      // Rebuild all orders sequentially
      const bulkOps = remainingTodos.map((t, index) => ({
        updateOne: {
          filter: { _id: t._id },
          update: { $set: { order: index } },
        },
      }));
      await Todo.bulkWrite(bulkOps);
    }

    // Return all todos sorted by order for immediate sync
    const allTodos = await Todo.find({ user: userId })
      .sort({ order: 1, createdAt: -1 })
      .lean();

    return res.json(allTodos);
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

    // Use ordered array of IDs - assign sequential orders based on array position
    // This ensures proper ordering regardless of initial order values
    const bulkOps = todos.map(({ id }, index) => ({
      updateOne: {
        filter: { _id: id, user: userId },
        update: { $set: { order: index } },
      },
    }));

    if (bulkOps.length > 0) {
      await Todo.bulkWrite(bulkOps);
    }

    // Return all todos sorted by order for immediate sync across devices
    const allTodos = await Todo.find({ user: userId })
      .sort({ order: 1, createdAt: -1 })
      .lean();

    return res.json(allTodos);
  } catch (err) {
    logger.error('ReorderTodos error:', err);
    return res.status(500).json({ error: 'Failed to reorder todos' });
  }
};

