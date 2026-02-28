import type { Request, Response } from 'express';
import { Todo } from '../models/Todo';
import { z } from 'zod';

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
    
    const todos = await Todo.find({ user: userId })
      .sort({ order: 1, createdAt: -1 })
      .lean();

    return res.json(todos);
  } catch (err) {
    console.error(err);
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

    // Get the highest order value for this user to place new todo at the end
    const highestOrderTodo = await Todo.findOne({ user: userId })
      .sort({ order: -1 })
      .select('order')
      .lean();
    
    const newOrder = highestOrderTodo ? (highestOrderTodo.order ?? 0) + 1 : 0;

    const todo = await Todo.create({
      text,
      user: userId,
      category,
      priority,
      tags,
      order: newOrder,
    });

    return res.status(201).json(todo);
  } catch (err) {
    console.error(err);
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
    console.error(err);
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

    return res.json({ message: 'Todo deleted' });
  } catch (err) {
    console.error(err);
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

    // Use bulk operations for efficiency
    const bulkOps = todos.map(({ id, order }) => ({
      updateOne: {
        filter: { _id: id, user: userId },
        update: { $set: { order } },
      },
    }));

    if (bulkOps.length > 0) {
      await Todo.bulkWrite(bulkOps);
    }

    return res.json({ message: 'Todos reordered successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to reorder todos' });
  }
};

