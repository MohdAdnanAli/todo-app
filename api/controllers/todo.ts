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
});

const updateTodoSchema = z.object({
  text: z.string().min(1).max(500).optional(),
  completed: z.boolean().optional(),
  category: z.enum(CATEGORIES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  tags: z.array(z.string().max(50)).optional(),
});

export const getTodos = async (req: Request & { user?: { id: string } }, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const todos = await Todo.find({ user: userId })
      .sort({ createdAt: -1 })
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

    const todo = await Todo.create({
      text,
      user: userId,
      category,
      priority,
      tags,
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

