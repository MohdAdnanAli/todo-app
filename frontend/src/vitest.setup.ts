import { afterEach, vi, beforeEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Simple IndexedDB mock
const indexedDBMock = {
  open: vi.fn(() => {
    const request: any = {
      result: {},
      error: null,
      onsuccess: null,
      onerror: null,
      onupgradeneeded: null,
    };
    return request;
  }),
  deleteDatabase: vi.fn(() => ({ result: {} })),
  cmp: vi.fn(),
};

beforeEach(() => {
  Object.defineProperty(window, 'indexedDB', {
    value: indexedDBMock,
    writable: true,
  });
});

// Mock localStorage with proper implementation
const createLocalStorageMock = () => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] || null,
  };
};

Object.defineProperty(window, 'localStorage', {
  value: createLocalStorageMock(),
  writable: true,
});

// Global mocks for decryption/tests compatibility
vi.mock('../src/utils/crypto', () => ({
  ...vi.importActual('../src/utils/crypto'),
  encrypt: vi.fn((text) => text),
  decrypt: vi.fn((text, _, __) => text), 
  clearKeyCache: vi.fn(),
}));

vi.mock('../src/hooks/useAuth', () => ({
  useLocalTodoDecryption: vi.fn(() => ({
    needsUnlock: false,
    unlock: vi.fn(),
    decryptedTodos: [],
    isReady: true,
    decryptAllTodos: vi.fn((todos) => Promise.resolve(todos)),
  })),
}));

vi.mock('../src/hooks/useTodoFilters', () => ({
  useTodoFilters: vi.fn((todos) => ({
    categoryFilter: 'all',
    priorityFilter: 'all',
    showCompleted: 'all',
    searchQuery: '',
    showFilters: false,
    filteredTodos: todos,
    hasActiveFilters: false,
    stats: {
      total: todos.length,
      filtered: todos.length,
      pending: todos.filter((t: any) => !t.completed).length,
      completed: todos.filter((t: any) => t.completed).length,
    },
    setCategoryFilter: vi.fn(),
    setPriorityFilter: vi.fn(),
    setShowCompleted: vi.fn(),
    setSearchQuery: vi.fn(),
    setShowFilters: vi.fn(),
    clearFilters: vi.fn(),
  })),
}));

// Mock ThemeContext - default light theme for CSS vars
vi.mock('../src/theme/ThemeContext', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
  useTheme: vi.fn(() => ({ theme: 'light', toggleTheme: vi.fn() })),
}));


// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

// Mock ResizeObserver
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock requestAnimationFrame
globalThis.requestAnimationFrame = ((callback: FrameRequestCallback) => {
  return setTimeout(callback, 16) as unknown as number;
}) as (callback: FrameRequestCallback) => number;

globalThis.cancelAnimationFrame = ((id: number) => {
  clearTimeout(id);
}) as (id: number) => void;

// Mock IntersectionObserver
globalThis.IntersectionObserver = class IntersectionObserver implements IntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];
  
  constructor() {}
  
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return []; }
} as unknown as typeof IntersectionObserver;

