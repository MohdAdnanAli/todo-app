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

// LED color configuration
export const LED_COLORS: Record<MessageType, { bg: string; glow: string; border: string }> = {
  error:     { bg: '#ef4444', glow: 'rgba(239, 68, 68, 0.5)', border: '#fca5a5' },
  success:   { bg: '#22c55e', glow: 'rgba(34, 197, 94, 0.5)', border: '#86efac' },
  warning:   { bg: '#eab308', glow: 'rgba(234, 179, 8, 0.5)', border: '#fde047' },
  info:      { bg: '#3b82f6', glow: 'rgba(59, 130, 246, 0.5)', border: '#93c5fd' },
  loading:   { bg: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.5)', border: '#c4b5fd' },
  idle:      { bg: '#9ca3af', glow: 'rgba(156, 163, 175, 0.3)', border: '#d1d5db' },
  attention: { bg: '#f97316', glow: 'rgba(249, 115, 22, 0.5)', border: '#fdba74' },
  primary:   { bg: '#6366f1', glow: 'rgba(99, 102, 241, 0.5)', border: '#a5b4fc' },
  accent:    { bg: '#a855f7', glow: 'rgba(168, 85, 247, 0.5)', border: '#d8b4fe' },
  system:    { bg: '#06b6d4', glow: 'rgba(6, 182, 212, 0.5)', border: '#67e8f9' },
  personal:  { bg: '#ec4899', glow: 'rgba(236, 72, 153, 0.5)', border: '#f9a8d4' },
  pending:   { bg: '#f59e0b', glow: 'rgba(245, 158, 11, 0.5)', border: '#fcd34d' },
};

// API URL
export const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000');

// Category type for todos
export type TodoCategory = 'work' | 'personal' | 'shopping' | 'health' | 'other';

// Priority type for todos
export type TodoPriority = 'low' | 'medium' | 'high';

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
  displayName: string;
  bio?: string;
  avatar?: string;
  todoCount: number;
  createdAt: string;
}

// Auth mode for forms
export type AuthMode = 'login' | 'register' | 'forgot-password' | 'reset-password';

