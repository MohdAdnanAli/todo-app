import axios, { AxiosError } from 'axios';
import type {
  Todo,
  User,
  AuthResponse,
  ProfileUpdateData,
  ApiError,
  AdminStats,
  AdminProfile,
} from '../types';
import { API_URL } from '../types';

// Create axios instance with credentials
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 429) {
      const retryAfter = error.response.data?.retryAfter || 60;
      const customError = new Error('Rate limit exceeded') as Error & { retryAfter?: number; isRateLimit?: boolean };
      customError.retryAfter = retryAfter;
      customError.isRateLimit = true;
      throw customError;
    }
    throw error;
  }
);

// ==================== AUTH ====================

export const authApi = {
  register: async (email: string, password: string, displayName: string): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/api/auth/register', { email, password, displayName });
    return res.data;
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/api/auth/login', { email, password });
    return res.data;
  },

  logout: async (): Promise<{ message: string }> => {
    const res = await api.post<{ message: string }>('/api/auth/logout');
    return res.data;
  },

  verifyEmail: async (token: string): Promise<{ message: string }> => {
    const res = await api.post<{ message: string }>('/api/auth/verify-email', { token });
    return res.data;
  },

  requestPasswordReset: async (email: string): Promise<{ message: string }> => {
    const res = await api.post<{ message: string }>('/api/auth/request-password-reset', { email });
    return res.data;
  },

  resetPassword: async (token: string, password: string): Promise<{ message: string }> => {
    const res = await api.post<{ message: string }>('/api/auth/reset-password', { token, password });
    return res.data;
  },

  getMe: async (): Promise<{ user: User; encryptionSalt: string }> => {
    const res = await api.get<{ user: User; encryptionSalt: string }>('/api/me');
    return res.data;
  },
};

// ==================== PROFILE ====================

export const profileApi = {
  getProfile: async (): Promise<User> => {
    const res = await api.get<User>('/api/profile');
    return res.data;
  },

  updateProfile: async (data: ProfileUpdateData): Promise<{ message: string; user: User }> => {
    const res = await api.put<{ message: string; user: User }>('/api/profile', data);
    return res.data;
  },

  deleteProfile: async (): Promise<{ message: string }> => {
    const res = await api.delete<{ message: string }>('/api/profile');
    return res.data;
  },
};

// ==================== TODOS ====================

export const todoApi = {
  getTodos: async (): Promise<Todo[]> => {
    const res = await api.get<Todo[]>('/api/todos');
    return res.data;
  },

  createTodo: async (todo: Partial<Todo>): Promise<Todo> => {
    const res = await api.post<Todo>('/api/todos', todo);
    return res.data;
  },

  updateTodo: async (id: string, updates: Partial<Todo>): Promise<Todo> => {
    const res = await api.put<Todo>(`/api/todos/${id}`, updates);
    return res.data;
  },

  deleteTodo: async (id: string): Promise<{ message: string }> => {
    const res = await api.delete<{ message: string }>(`/api/todos/${id}`);
    return res.data;
  },
};

// ==================== ADMIN ====================

export const adminApi = {
  getStats: async (): Promise<AdminStats> => {
    const res = await api.get<AdminStats>('/api/admin/stats');
    return res.data;
  },

  getProfiles: async (): Promise<{ totalUsers: number; profiles: AdminProfile[] }> => {
    const res = await api.get<{ totalUsers: number; profiles: AdminProfile[] }>('/api/admin/profiles');
    return res.data;
  },
};

// ==================== ERROR HELPERS ====================

export const getApiErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiError>;
    if (axiosError.response?.data?.error) {
      return axiosError.response.data.error;
    }
    if (axiosError.response?.status === 429) {
      return 'Too many requests. Please try again later.';
    }
    if (axiosError.response?.status === 401) {
      return 'Invalid credentials';
    }
    if (axiosError.response?.status === 409) {
      return 'Email already in use';
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

export const isRateLimitError = (error: unknown): error is Error & { isRateLimit: true; retryAfter: number } => {
  return (error as Error & { isRateLimit?: boolean })?.isRateLimit === true;
};

export const isAccountLockedError = (error: unknown): boolean => {
  const message = getApiErrorMessage(error).toLowerCase();
  return message.includes('locked') || message.includes('too many failed attempts');
};

