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

// ===== DND-KIT MOCKS for CI =====
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  closestCenter: () => ({}),
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  TouchSensor: vi.fn(),
  useSensor: vi.fn(() => ({})),
  useSensors: vi.fn(() => ([])),
  DragEndEvent: {},
  DragStartEvent: {},
  DragOverlay: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@dnd-kit/sortable', () => ({
  arrayMove: vi.fn((arr, from, to) => arr),
  SortableContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  sortableKeyboardCoordinates: vi.fn(),
  verticalListSortingStrategy: vi.fn(),
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: { toString: vi.fn(() => 'translate3d(0,0,0)') },
  },
}));

// ===== LUCIDE-REACT ICONS MOCK =====
const LucideIcons = {};
Object.keys({ 
  SlidersHorizontal: true, ChevronDown: true, ChevronUp: true, Search: true, FilterX: true,
  GripVertical: true, Trash2: true, Tag: true, AlertCircle: true
}).forEach(icon => {
  LucideIcons[icon] = ({ size = 16, color = 'currentColor', ...props }) => (
    <div data-testid={`mock-${icon}`} style={{ width: size, height: size, color }} {...props}>
      {icon}
    </div>
  );
});

vi.mock('lucide-react', () => LucideIcons);

// ===== UTILS MOCKS =====
vi.mock('../utils/todoIcons', () => ({
  getSmartIcon: vi.fn(() => ({ size: 18, color: '#818cf8' })),
}));

// ===== CRYPTO POLYFILL for CI (optional - if slow) =====
if (typeof globalThis.crypto === 'undefined' || !globalThis.crypto.subtle) {
  globalThis.crypto = {
    subtle: {
      importKey: vi.fn(),
      deriveKey: vi.fn(),
      encrypt: vi.fn(),
      decrypt: vi.fn(),
    } as any,
    getRandomValues: vi.fn(() => new Uint8Array(16)),
    randomUUID: vi.fn(() => 'mock-uuid'),
  } as any;
}

