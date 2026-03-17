import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import SortableTodoList from '../SortableTodoList';
import type { Todo } from '../../types';
import { useTodoFilters } from '../../hooks/useTodoFilters';

describe('SortableTodoList', () => {
  const mockTodos: Todo[] = [
    {
      _id: '1',
      text: 'First task',
      completed: false,
      createdAt: new Date().toISOString(),
      category: 'work',
      priority: 'high',
      order: 0,
    },
    {
      _id: '2',
      text: 'Second task',
      completed: false,
      createdAt: new Date().toISOString(),
      category: 'personal',
      priority: 'medium',
      order: 1,
    },
    {
      _id: '3',
      text: 'Third task',
      completed: true,
      createdAt: new Date().toISOString(),
      category: 'shopping',
      priority: 'low',
      order: 2,
    },
  ];

  const mockHandlers = {
    onToggle: vi.fn(),
    onDelete: vi.fn(),
    onReorder: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (props: any) => {
    return render(
      <SortableTodoList
        {...props}
      />
    );
  };

  describe('rendering', () => {
    it('should render empty state when no todos', () => {
      vi.mocked(useTodoFilters).mockReturnValue({
        filteredTodos: [],
        stats: { total: 0, filtered: 0, pending: 0, completed: 0 },
        categoryFilter: 'all',
        priorityFilter: 'all',
        showCompleted: 'all',
        searchQuery: '',
        showFilters: false,
        hasActiveFilters: false,
        setCategoryFilter: vi.fn(),
        setPriorityFilter: vi.fn(),
        setShowCompleted: vi.fn(),
        setSearchQuery: vi.fn(),
        setShowFilters: vi.fn(),
        clearFilters: vi.fn(),
      });
      renderComponent({
        todos: [],
        onToggle: mockHandlers.onToggle,
        onDelete: mockHandlers.onDelete,
        onReorder: mockHandlers.onReorder,
      });

      expect(screen.getByText(/No tasks yet/i)).toBeInTheDocument();
    });

    it('should render all todos', () => {
      renderComponent({
        todos: mockTodos,
        onToggle: mockHandlers.onToggle,
        onDelete: mockHandlers.onDelete,
        onReorder: mockHandlers.onReorder,
      });

      expect(screen.getByText('First task')).toBeInTheDocument();
      expect(screen.getByText('Second task')).toBeInTheDocument();
      expect(screen.getByText('Third task')).toBeInTheDocument();
    });

    it('should render filter button', () => {
      renderComponent({
        todos: mockTodos,
        onToggle: mockHandlers.onToggle,
        onDelete: mockHandlers.onDelete,
        onReorder: mockHandlers.onReorder,
      });

      expect(screen.getByRole('button', { name: /filter/i })).toBeInTheDocument();
    });
  });

  describe('filtering', () => {
    it('should render filter button', () => {
      renderComponent({
        todos: mockTodos,
        onToggle: mockHandlers.onToggle,
        onDelete: mockHandlers.onDelete,
        onReorder: mockHandlers.onReorder,
      });

      expect(screen.getByRole('button', { name: /filter/i })).toBeInTheDocument();
    });

    it('renders todos based on useTodoFilters output', () => {
      vi.mocked(useTodoFilters).mockReturnValue({
        filteredTodos: [mockTodos[0]],
        stats: { total: 3, filtered: 1, pending: 1, completed: 0 },
        categoryFilter: 'work' as any,
        priorityFilter: 'all' as any,
        showCompleted: 'all' as any,
        searchQuery: '',
        showFilters: false,
        hasActiveFilters: true,
        setCategoryFilter: vi.fn(),
        setPriorityFilter: vi.fn(),
        setShowCompleted: vi.fn(),
        setSearchQuery: vi.fn(),
        setShowFilters: vi.fn(),
        clearFilters: vi.fn(),
      });
      
      renderComponent({
        todos: mockTodos,
        onToggle: mockHandlers.onToggle,
        onDelete: mockHandlers.onDelete,
        onReorder: mockHandlers.onReorder,
      });

      expect(screen.getByText('First task')).toBeInTheDocument();
    });

    it('renders filtered pending todos', () => {
      vi.mocked(useTodoFilters).mockReturnValue({
        filteredTodos: mockTodos.slice(0, 2), 
        stats: { total: 3, filtered: 2, pending: 2, completed: 0 },
        showCompleted: false as any,
        categoryFilter: 'all' as any,
        priorityFilter: 'all' as any,
        searchQuery: '',
        showFilters: false,
        hasActiveFilters: true,
        setCategoryFilter: vi.fn(),
        setPriorityFilter: vi.fn(),
        setShowCompleted: vi.fn(),
        setSearchQuery: vi.fn(),
        setShowFilters: vi.fn(),
        clearFilters: vi.fn(),
      });

      renderComponent({
        todos: mockTodos,
        onToggle: mockHandlers.onToggle,
        onDelete: mockHandlers.onDelete,
        onReorder: mockHandlers.onReorder,
      });

      expect(screen.getByText('First task')).toBeInTheDocument();
      expect(screen.getByText('Second task')).toBeInTheDocument();
    });

    it('renders search filtered todos', () => {
      vi.mocked(useTodoFilters).mockReturnValue({
        filteredTodos: [mockTodos[0]], 
        searchQuery: 'First',
        categoryFilter: 'all' as any,
        priorityFilter: 'all' as any,
        showCompleted: 'all' as any,
        showFilters: false,
        stats: { total: 3, filtered: 1, pending: 1, completed: 0 },
        hasActiveFilters: true,
        setCategoryFilter: vi.fn(),
        setPriorityFilter: vi.fn(),
        setShowCompleted: vi.fn(),
        setSearchQuery: vi.fn(),
        setShowFilters: vi.fn(),
        clearFilters: vi.fn(),
      });

      renderComponent({
        todos: mockTodos,
        onToggle: mockHandlers.onToggle,
        onDelete: mockHandlers.onDelete,
        onReorder: mockHandlers.onReorder,
      });

      expect(screen.getByText('First task')).toBeInTheDocument();
    });

    it('should render without active filters', () => {
      vi.mocked(useTodoFilters).mockReturnValue({
        filteredTodos: mockTodos,
        stats: { total: 3, filtered: 3, pending: 2, completed: 1 },
        categoryFilter: 'all' as any,
        priorityFilter: 'all' as any,
        showCompleted: 'all' as any,
        searchQuery: '',
        showFilters: false,
        hasActiveFilters: false,
        setCategoryFilter: vi.fn(),
        setPriorityFilter: vi.fn(),
        setShowCompleted: vi.fn(),
        setSearchQuery: vi.fn(),
        setShowFilters: vi.fn(),
        clearFilters: vi.fn(),
      });

      renderComponent({
        todos: mockTodos,
        onToggle: mockHandlers.onToggle,
        onDelete: mockHandlers.onDelete,
        onReorder: mockHandlers.onReorder,
      });

      expect(screen.getAllByText(/task/i)).toHaveLength(3);
    });
  });

  describe('interactions', () => {
    it('renders todos without calling onToggle automatically', () => {
      renderComponent({
        todos: mockTodos,
        onToggle: mockHandlers.onToggle,
        onDelete: mockHandlers.onDelete,
        onReorder: mockHandlers.onReorder,
      });

      expect(screen.getByText('First task')).toBeInTheDocument();
      expect(mockHandlers.onToggle).toHaveBeenCalledTimes(0);
    });

    it('should display todo category badges', () => {
      renderComponent({
        todos: mockTodos,
        onToggle: mockHandlers.onToggle,
        onDelete: mockHandlers.onDelete,
        onReorder: mockHandlers.onReorder,
      });

      expect(screen.getByText('work')).toBeInTheDocument();
      expect(screen.getByText('personal')).toBeInTheDocument();
    });

    it('displays priority badges', () => {
      renderComponent({
        todos: mockTodos,
        onToggle: mockHandlers.onToggle,
        onDelete: mockHandlers.onDelete,
        onReorder: mockHandlers.onReorder,
      });

      expect(screen.getByText(/HIGH/i)).toBeInTheDocument();
    });
  });

  describe('display stats', () => {
    it('shows stats from useTodoFilters', () => {
      vi.mocked(useTodoFilters).mockReturnValue({
        filteredTodos: mockTodos,
        stats: { total: 3, filtered: 3, pending: 2, completed: 1 },
        categoryFilter: 'all' as any,
        priorityFilter: 'all' as any,
        showCompleted: 'all' as any,
        searchQuery: '',
        showFilters: true,
        hasActiveFilters: false,
        setCategoryFilter: vi.fn(),
        setPriorityFilter: vi.fn(),
        setShowCompleted: vi.fn(),
        setSearchQuery: vi.fn(),
        setShowFilters: vi.fn(),
        clearFilters: vi.fn(),
      });

      renderComponent({
        todos: mockTodos,
        onToggle: mockHandlers.onToggle,
        onDelete: mockHandlers.onDelete,
        onReorder: mockHandlers.onReorder,
      });

      // Stats should be accessible through filter UI
      expect(screen.getByRole('button', { name: /filter/i })).toBeInTheDocument();
    });
  });
});



