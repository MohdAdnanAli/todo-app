// Shared types for the application

// Message type for LED status and banners
export type MessageType = 
  | 'error' 
  | 'success' 
  | 'warning' 
  | 'info' 
  | 'loading' 
  | 'idle'
  | 'attention'
  | 'primary'
  | 'accent'
  | 'system'
  | 'personal'
  | 'pending';

// LED color configuration - VIBRANT COLORS
export const LED_COLORS: Record<MessageType, { bg: string; glow: string; border: string }> = {
  error:     { bg: '#f43f5e', glow: 'rgba(244, 63, 94, 0.5)', border: '#fda4af' },
  success:   { bg: '#34d399', glow: 'rgba(52, 211, 153, 0.5)', border: '#6ee7b7' },
  warning:   { bg: '#fbbf24', glow: 'rgba(251, 191, 36, 0.5)', border: '#fde68a' },
  info:      { bg: '#60a5fa', glow: 'rgba(96, 165, 250, 0.5)', border: '#bfdbfe' },
  loading:   { bg: '#a78bfa', glow: 'rgba(167, 139, 250, 0.5)', border: '#c4b5fd' },
  idle:      { bg: '#9ca3af', glow: 'rgba(156, 163, 175, 0.3)', border: '#d1d5db' },
  attention: { bg: '#fb923c', glow: 'rgba(251, 146, 60, 0.5)', border: '#fdba74' },
  primary:   { bg: '#818cf8', glow: 'rgba(129, 140, 248, 0.5)', border: '#c7d2fe' },
  accent:    { bg: '#c084fc', glow: 'rgba(192, 132, 252, 0.5)', border: '#ddd6fe' },
  system:    { bg: '#22d3ee', glow: 'rgba(34, 211, 238, 0.5)', border: '#a5f3fc' },
  personal:  { bg: '#f43f5e', glow: 'rgba(244, 63, 94, 0.5)', border: '#fda4af' },
  pending:   { bg: '#fbbf24', glow: 'rgba(251, 191, 36, 0.5)', border: '#fde68a' },
};

// API URL - use empty string in development to use Vite proxy (same origin)
export const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : '');

// Category type for todos
export type TodoCategory = 'work' | 'personal' | 'shopping' | 'health' | 'other';

// Priority type for todos
export type TodoPriority = 'low' | 'medium' | 'high';

// Participant interface for collaborative todos
export interface TodoParticipant {
  id: string;
  name: string;
  avatar?: string;
}

// Todo interface
export interface Todo {
  _id: string;
  text: string;
  completed: boolean;
  createdAt: string;
  updatedAt?: string;
  category?: TodoCategory;
  priority?: TodoPriority;
  tags?: string[];
  dueDate?: string | null;
  order?: number;
  participants?: TodoParticipant[];
}

// User interface
export interface User {
  id?: string;
  email: string;
  displayName: string;
  bio?: string;
  avatar?: string;
  emailVerified?: boolean;
  lastLoginAt?: string;
  role?: 'user' | 'admin';
  isAdmin?: boolean;
}

// Profile update data
export interface ProfileUpdateData {
  displayName?: string;
  bio?: string;
  avatar?: string;
}

// Password reset request
export interface PasswordResetRequest {
  email: string;
}

// Password reset with token
export interface PasswordResetConfirm {
  token: string;
  password: string;
}

// Email verification
export interface EmailVerification {
  token: string;
}

// Auth response
export interface AuthResponse {
  message: string;
  user?: User;
  encryptionSalt?: string;
}

// API Error response
export interface ApiError {
  error: string;
  message?: string;
  retryAfter?: number; // For rate limiting
}

// Filter options for todos
export interface TodoFilters {
  category?: TodoCategory | 'all';
  priority?: TodoPriority | 'all';
  completed?: boolean | 'all';
  search?: string;
}

// Admin stats
export interface AdminStats {
  totalUsers: number;
  totalTodos: number;
  completedTodos: number;
  pendingTodos: number;
}

// Admin profile with todo count
export interface AdminProfile {
  id: string;
  email: string;
  displayName?: string;
  bio?: string;
  avatar?: string;
  todoCount: number;
  createdAt: string;
}

// Admin User (for API responses)
export interface AdminUser {
  id: string;
  email: string;
  displayName?: string;
  bio?: string;
  avatar?: string;
  emailVerified?: boolean;
  todoCount: number;
  completedTodos?: number;
  completionRate?: number;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt?: string;
}

// Admin Dashboard Stats
export interface AdminDashboardStats {
  totalUsers: number;
  totalTodos: number;
  completedTodos: number;
  pendingTodos: number;
  activeUsers: number;
  completionRate: number;
}

// Admin User Info
export interface AdminUserInfo {
  id: string;
  email: string;
  displayName?: string;
  bio?: string;
  avatar?: string;
  emailVerified: boolean;
  todoCount: number;
  completedTodos: number;
  completionRate: number;
  createdAt: string;
  lastLoginAt?: string;
}

// Admin Dashboard Data
export interface AdminDashboardData {
  stats: AdminDashboardStats;
  recentUsers: AdminUserInfo[];
}

// Admin Users Response
export interface AdminUsersResponse {
  users: AdminUserInfo[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Admin Todo User
export interface AdminTodoUser {
  id: string;
  email: string;
  displayName?: string;
}

// Admin Todo
export interface AdminTodo {
  _id: string;
  text: string;
  completed: boolean;
  category?: string;
  priority?: string;
  createdAt: string;
  user?: AdminTodoUser;
}

// Admin Todos Response
export interface AdminTodosResponse {
  todos: AdminTodo[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// System Health
export interface SystemHealth {
  status: string;
  timestamp: string;
  database: {
    state: string;
    error?: string;
  };
  uptime: string;
  environment: string;
}

// Auth mode for forms
export type AuthMode = 'login' | 'register' | 'forgot-password' | 'reset-password';

