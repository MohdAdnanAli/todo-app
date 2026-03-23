import axios, { AxiosError } from 'axios';
import type {
  Todo,
  User,
  AuthResponse,
  ProfileUpdateData,
  ApiError,
  AdminStats,
  AdminProfile,
  AdminDashboardData,
  AdminUsersResponse,
  AdminTodosResponse,
  SystemHealth,
  AdminUser,
} from '../types';
import { API_URL } from '../types';
import { safeConsole } from '../utils/safeConsole';

// Create axios instance with credentials
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Track if a refresh is in progress
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

// Subscribe to token refresh
const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

// Notify all subscribers when new token arrives
const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
};

// Response interceptor for error handling and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    // Handle network errors gracefully - don't crash the app
    if (!error.response) {
      const networkError = new Error('Unable to connect to server. Please check your internet connection.') as Error & { isNetworkError?: boolean };
      networkError.isNetworkError = true;
      safeConsole.warn('Network error:', error.message);
      throw networkError;
    }

    const originalRequest = error.config as any;

    // If 401 and not already refreshing, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, wait for new token
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call the refresh endpoint
        const response = await axios.post(
          `${API_URL}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );
        
        const { accessToken } = response.data;
        
        // Notify all waiting requests
        onTokenRefreshed(accessToken);
        isRefreshing = false;

        // Retry the original request
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        // Refresh failed - dispatch logout event but don't crash
        try {
          window.dispatchEvent(new CustomEvent('auth:logout', { detail: { reason: 'token_expired' } }));
        } catch (e) {
          safeConsole.warn('Failed to dispatch logout event:', e);
        }
        return Promise.reject(refreshError);
      }
    }

    if (error.response?.status === 429) {
      const retryAfter = error.response.data?.retryAfter || 60;
      const customError = new Error('Rate limit exceeded') as Error & { retryAfter?: number; isRateLimit?: boolean };
      customError.retryAfter = retryAfter;
      customError.isRateLimit = true;
      throw customError;
    }

    // Log other errors for debugging but don't crash
    safeConsole.warn('API Error:', error.response?.status, error.response?.data);
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

  refreshToken: async (): Promise<{ accessToken: string; expiresIn: number }> => {
    const res = await api.post<{ accessToken: string; expiresIn: number }>('/api/auth/refresh');
    return res.data;
  },

  getMe: async (): Promise<{ user: User; encryptionSalt: string; encryptionPassword?: string; googleId?: string; isAdmin?: boolean; isGoogleUser?: boolean }> => {
    const res = await api.get<{ user: User; encryptionSalt: string; encryptionPassword?: string; googleId?: string; isAdmin?: boolean; isGoogleUser?: boolean }>('/api/me');
    return res.data;
  },

  setToken: async (token: string): Promise<{ message: string }> => {
    const res = await api.post<{ message: string }>('/api/auth/set-token', { token });
    return res.data;
  },

};

// ==================== GOOGLE OAUTH ====================

export const googleApi = {
  // Get Google OAuth URL - pass frontend URL so backend knows where to redirect after OAuth
  getAuthUrl: async (): Promise<{ authUrl: string; state: string }> => {
    // Pass the current frontend origin so backend can redirect back to the correct URL
    const frontendUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
    const res = await api.get<{ authUrl: string; state: string }>('/api/auth/google/url', {
      params: frontendUrl ? { frontendUrl } : {}
    });
    return res.data;
  },

  // Link Google account to existing user
  linkAccount: async (googleToken: string): Promise<{ message: string; user: { id: string; email: string; displayName: string; isGoogleUser: boolean } }> => {
    const res = await api.post<{ message: string; user: { id: string; email: string; displayName: string; isGoogleUser: boolean } }>('/api/auth/google/link', { googleToken });
    return res.data;
  },

  // Unlink Google account from user
  unlinkAccount: async (password: string): Promise<{ message: string }> => {
    const res = await api.post<{ message: string }>('/api/auth/google/unlink', { password });
    return res.data;
  },

  // Get Google auth status
  getStatus: async (): Promise<{ isGoogleUser: boolean; hasGoogleLinked: boolean; authProvider: string }> => {
    const res = await api.get<{ isGoogleUser: boolean; hasGoogleLinked: boolean; authProvider: string }>('/api/auth/google/status');
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

// ==================== ONBOARDING ====================

export interface OnboardingStatus {
  hasCompletedOnboarding: boolean;
  onboardingCompletedAt: string | null;
  quickStartProgress: {
    firstTask: boolean;
    categorize: boolean;
    setPriority: boolean;
  };
}

export const onboardingApi = {
  getStatus: async (): Promise<OnboardingStatus> => {
    const res = await api.get<OnboardingStatus>('/api/onboarding/status');
    return res.data;
  },

  complete: async (): Promise<{ message: string; hasCompletedOnboarding: boolean; onboardingCompletedAt: string }> => {
    const res = await api.post<{ message: string; hasCompletedOnboarding: boolean; onboardingCompletedAt: string }>('/api/onboarding/complete');
    return res.data;
  },

  updateQuickStart: async (progress: {
    firstTask?: boolean;
    categorize?: boolean;
    setPriority?: boolean;
  }): Promise<{ message: string; quickStartProgress: OnboardingStatus['quickStartProgress'] }> => {
    const res = await api.put<{ message: string; quickStartProgress: OnboardingStatus['quickStartProgress'] }>('/api/onboarding/quickstart', progress);
    return res.data;
  },

  reset: async (): Promise<{ message: string; hasCompletedOnboarding: boolean; quickStartProgress: OnboardingStatus['quickStartProgress'] }> => {
    const res = await api.post<{ message: string; hasCompletedOnboarding: boolean; quickStartProgress: OnboardingStatus['quickStartProgress'] }>('/api/onboarding/reset');
    return res.data;
  },
};

// ==================== TODOS ====================

interface BatchSyncInput {
  creates: Partial<Todo>[];
  updates: { id: string; data: Partial<Todo> }[];
  deletes: string[];
}

interface BatchSyncResult {
  success: boolean;
  processed: {
    creates: number;
    updates: number;
    deletes: number;
  };
  total: number;
}

export const todoApi = {
  reorderTodos: async (reorderData: { todos: Array<{ id: string; order: number }> }): Promise<Todo[]> => {
    const res = await api.post<Todo[]>('/api/todos/reorder', reorderData);
    return res.data;
  },
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

  batchSync: async (batch: BatchSyncInput): Promise<BatchSyncResult> => {
    const res = await api.post<BatchSyncResult>('/api/todos/batch-sync', batch);
    return res.data;
  },

  getTodosDelta: async (since?: string): Promise<Todo[]> => {
    const params = since ? { since } : {};
    const res = await api.get<Todo[]>('/api/todos/delta', { params });
    return res.data;
  },
};

// ==================== ADMIN ====================

export const adminApi = {
  // Dashboard
  getDashboard: async (): Promise<AdminDashboardData> => {
    const res = await api.get<AdminDashboardData>('/api/admin/dashboard');
    return res.data;
  },

  // User Management
  getUsers: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<AdminUsersResponse> => {
    const res = await api.get<AdminUsersResponse>('/api/admin/users', { params });
    return res.data;
  },

  getUser: async (userId: string): Promise<{ user: AdminUser; todos: { total: number; completed: number; pending: number; items: Todo[] } }> => {
    const res = await api.get<{ user: AdminUser; todos: { total: number; completed: number; pending: number; items: Todo[] } }>(`/api/admin/users/${userId}`);
    return res.data;
  },

  updateUser: async (userId: string, data: Partial<AdminUser>): Promise<{ message: string; user: AdminUser }> => {
    const res = await api.put<{ message: string; user: AdminUser }>(`/api/admin/users/${userId}`, data);
    return res.data;
  },

  deleteUser: async (userId: string): Promise<{ message: string }> => {
    const res = await api.delete<{ message: string }>(`/api/admin/users/${userId}`);
    return res.data;
  },

  // Todo Management
  getTodos: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    completed?: 'true' | 'false' | 'all';
  }): Promise<AdminTodosResponse> => {
    const res = await api.get<AdminTodosResponse>('/api/admin/todos', { params });
    return res.data;
  },

  deleteTodo: async (todoId: string): Promise<{ message: string }> => {
    const res = await api.delete<{ message: string }>(`/api/admin/todos/${todoId}`);
    return res.data;
  },

  deleteMultipleTodos: async (todoIds: string[]): Promise<{ message: string; deletedCount: number }> => {
    const res = await api.post<{ message: string; deletedCount: number }>('/api/admin/todos/delete-many', { todoIds });
    return res.data;
  },

  // System Health
  getSystemHealth: async (): Promise<SystemHealth> => {
    const res = await api.get<SystemHealth>('/api/admin/health');
    return res.data;
  },

  // Legacy/Deprecated - use new endpoints above
  getStats: async (): Promise<AdminStats> => {
    const data = await api.get<AdminDashboardData>('/api/admin/dashboard');
    return data.data.stats;
  },

  getProfiles: async (): Promise<{ totalUsers: number; profiles: AdminProfile[] }> => {
    const data = await api.get<AdminUsersResponse>('/api/admin/users');
    const users = data.data;
    return {
      totalUsers: users.pagination.total,
      profiles: users.users.map((u) => ({
        id: u.id,
        email: u.email,
        displayName: u.displayName,
        bio: u.bio,
        avatar: u.avatar,
        todoCount: u.todoCount,
        createdAt: u.createdAt,
      })),
    };
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

export const isGoogleOauthError = (error: unknown): boolean => {
  return axios.isAxiosError(error) && (
    error.response?.status === 503 ||
    error.response?.data?.error?.includes('OAuth') ||
    error.response?.data?.error?.includes('configured')
  );
};

export const isAccountLockedError = (error: unknown): boolean => {
  return axios.isAxiosError(error) && (
    error.response?.data?.isAccountLocked === true ||
    error.response?.data?.error?.includes('locked') ||
    error.response?.data?.error?.includes('failed attempts')
  );
};
