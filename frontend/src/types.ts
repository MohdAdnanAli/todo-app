export interface User {
  _id: string;
  email: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
}

// Extend existing Todo type if needed
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
}

// Add other types as needed
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export type MessageType = 'success' | 'error' | 'warning' | 'info' | 'idle' | 'loading' | 'primary' | 'pending' | 'accent';

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
};

