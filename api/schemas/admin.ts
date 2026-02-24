import { z } from 'zod';

// ───────────────────────────────────────────────
// User Management Schemas
// ───────────────────────────────────────────────

export const adminUpdateUserSchema = z.object({
  displayName: z.string().max(50).optional(),
  bio: z.string().max(500).optional(),
  avatar: z.string().url().optional().or(z.literal('')),
  emailVerified: z.boolean().optional(),
});

export const adminDeleteMultipleTodosSchema = z.object({
  todoIds: z.array(z.string()).min(1, 'At least one todo ID is required'),
});

// ───────────────────────────────────────────────
// Query Schemas
// ───────────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const userQuerySchema = paginationSchema.extend({
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'email', 'displayName', 'lastLoginAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const todoQuerySchema = paginationSchema.extend({
  search: z.string().optional(),
  completed: z.enum(['true', 'false', 'all']).default('all'),
});

