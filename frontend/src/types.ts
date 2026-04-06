export interface User {
  _id: string;
  email: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
}

export type TodoCategory = 'work' | 'personal' | 'shopping' | 'health' | 'other';
export type TodoPriority = 'low' | 'medium' | 'high';

export interface Todo {
  _id: string;
  text: string;
  completed: boolean;
  category: TodoCategory;
  priority: TodoPriority;
  tags?: string[];
  dueDate?: string | null;
  order?: number;
  createdAt: string;
  updatedAt?: string;
  participants?: Array<{
    id: string;
    name: string;
    avatar?: string;
  }>;
  user?: {
    _id: string;
    displayName?: string;
    email: string;
  };
}

export type AuthMode = 'login' | 'register' | 'forgot-password' | 'reset-password';

export interface ProfileUpdateData {
  displayName?: string;
  bio?: string;
  avatar?: string;
}

export type MessageType = 'success' | 'error' | 'warning' | 'info' | 'idle' | 'loading' | 'primary' | 'pending' | 'accent' | 'attention' | 'system' | 'personal';

export interface Todo {
  _id: string;
  text: string;
  completed: boolean;
  category: TodoCategory;
  priority: TodoPriority;
  tags?: string[];
  dueDate?: string | null;
  order?: number;
  createdAt: string;
  updatedAt?: string;
  participants?: Array<{
    id: string;
    name: string;
    avatar?: string;
  }>;
  user?: {
    _id: string;
    displayName?: string;
    email: string;
  };
  displayText?: string;
  decryptionError?: boolean;
}

export interface ApiError {
  message: string;
  code: string;
  error?: string;
  retryAfter?: number;
}

export type TodoWithExtras = Todo & {
  displayText?: string;
  decryptionError?: boolean;
};



export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalTodos: number;
  completedTodos: number;
  pendingTodos: number;
  completionRate: number;
}

export interface AdminUser {
  _id: string;
  id: string;
  email: string;
  displayName?: string;
  bio?: string;
  avatar?: string;
  emailVerified: boolean;
  todoCount: number;
  completionRate: number;
  createdAt: string;
  lastLogin?: string;
  lastLoginAt?: string;
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'error';
  uptime: number;
  memory: number;
  database: {
    state: 'connected' | 'disconnected' | 'error';
  };
  environment: string;
  timestamp: number;
}

export interface AdminDashboardData {
  stats: AdminStats;
  health: SystemHealth;
  recentUsers: AdminUser[];
}

export interface AdminUsersResponse {
  users: AdminUser[];
  pagination: {
    page: number;
    pages: number;
    total: number;
  };
  limit: number;
}

export interface AdminTodosResponse {
  todos: Todo[];
  pagination: {
    page: number;
    pages: number;
    total: number;
  };
  limit: number;
}

export interface AuthResponse {
  user: User;
  encryptionSalt: string;
  isAdmin: boolean;
}

export interface ApiError {
  message: string;
  code: string;
}

export interface AdminProfile {
  _id: string;
  email: string;
  todoCount: number;
}

export interface BatchSyncInput {
  creates: Partial<Todo>[];
  updates: Array<{ id: string; data: Partial<Todo> }>;
  deletes: string[];
}

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const LED_COLORS: Partial<Record<MessageType, { bg: string; glow: string; border: string }>> = {
  success: { bg: '#10b981', glow: '#34d399', border: '#059669' },
  error: { bg: '#ef4444', glow: '#f87171', border: '#dc2626' },
  warning: { bg: '#f59e0b', glow: '#fbbf24', border: '#d97706' },
  info: { bg: '#3b82f6', glow: '#60a5fa', border: '#2563eb' },
  idle: { bg: '#6b7280', glow: '#9ca3af', border: '#6b7280' },
  loading: { bg: '#6b7280', glow: '#9ca3af', border: '#6b7280' },
  primary: { bg: '#4f46e5', glow: '#6366f1', border: '#3730a3' },
  pending: { bg: '#f59e0b', glow: '#fbbf24', border: '#d97706' },
  accent: { bg: '#ec4899', glow: '#f472b6', border: '#be185d' },
  attention: { bg: '#f59e0b', glow: '#fbbf24', border: '#d97706' },
  system: { bg: '#6b7280', glow: '#9ca3af', border: '#6b7280' },
  personal: { bg: '#8b5cf6', glow: '#a78bfa', border: '#7c3aed' },
};

