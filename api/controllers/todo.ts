import { Request, Response } from 'express';
import { Todo } from '../models/Todo';
import { z } from 'zod';

const createTodoSchema = z.object({
  text: z.string().min(1, 'Task text is required').max(500),
});

const updateTodoSchema = z.object({
  text: z.string().min(1).max(500).optional(),
  completed: z.boolean().optional(),
});

export const getTodos = async (req: Request & { user?: { id: string } }, res: Response) => {
  try {
    const todos = await Todo.find({ user: req.user!.id })
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
    const result = createTodoSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.issues[0].message });
    }

    const todo = await Todo.create({
      text: result.data.text,
      user: req.user!.id,
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

    const result = updateTodoSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.issues[0].message });
    }

    const todo = await Todo.findOneAndUpdate(
      { _id: id, user: req.user!.id },
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

    const todo = await Todo.findOneAndDelete({ _id: id, user: req.user!.id });

    if (!todo) {
      return res.status(404).json({ error: 'Todo not found or not owned by user' });
    }

    return res.json({ message: 'Todo deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to delete todo' });
  }
};