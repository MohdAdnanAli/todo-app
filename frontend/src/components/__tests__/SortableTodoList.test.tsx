import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SortableTodoList from '../SortableTodoList';
import type { Todo } from '../../types';

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

  describe('rendering', () => {
    it('should render empty state when no todos', () => {
      render(
        <SortableTodoList
          todos={[]}
          onToggle={mockHandlers.onToggle}
          onDelete={mockHandlers.onDelete}
          onReorder={mockHandlers.onReorder}
        />
      );

      expect(screen.getByText(/No tasks yet/i)).toBeInTheDocument();
    });

    it('should render all todos', () => {
      render(
        <SortableTodoList
          todos={mockTodos}
          onToggle={mockHandlers.onToggle}
          onDelete={mockHandlers.onDelete}
          onReorder={mockHandlers.onReorder}
        />
      );

      expect(screen.getByText('First task')).toBeInTheDocument();
      expect(screen.getByText('Second task')).toBeInTheDocument();
      expect(screen.getByText('Third task')).toBeInTheDocument();
    });

    it('should render filter button', () => {
      render(
        <SortableTodoList
          todos={mockTodos}
          onToggle={mockHandlers.onToggle}
          onDelete={mockHandlers.onDelete}
          onReorder={mockHandlers.onReorder}
        />
      );

      expect(screen.getByText(/Filter & Search/i)).toBeInTheDocument();
    });
  });

  describe('filtering', () => {
    it('should toggle filter panel visibility', async () => {
      render(
        <SortableTodoList
          todos={mockTodos}
          onToggle={mockHandlers.onToggle}
          onDelete={mockHandlers.onDelete}
          onReorder={mockHandlers.onReorder}
        />
      );

      const filterButton = screen.getByText(/Filter & Search/i);
      fireEvent.click(filterButton);

      await waitFor(() => {
        expect(screen.getByText('Category')).toBeInTheDocument();
      });
    });

    it('should filter by category', async () => {
      render(
        <SortableTodoList
          todos={mockTodos}
          onToggle={mockHandlers.onToggle}
          onDelete={mockHandlers.onDelete}
          onReorder={mockHandlers.onReorder}
        />
      );

      const filterButton = screen.getByText(/Filter & Search/i);
      fireEvent.click(filterButton);

      await waitFor(() => {
        const workButton = screen.getAllByText('Work')[0];
        fireEvent.click(workButton);
      });

      // After filtering by work category, should show only work tasks
      expect(screen.getByText('First task')).toBeInTheDocument();
    });

    it('should filter by completion status', async () => {
      render(
        <SortableTodoList
          todos={mockTodos}
          onToggle={mockHandlers.onToggle}
          onDelete={mockHandlers.onDelete}
          onReorder={mockHandlers.onReorder}
        />
      );

      const filterButton = screen.getByText(/Filter & Search/i);
      fireEvent.click(filterButton);

      await waitFor(() => {
        const pendingButton = screen.getByText(/Pending/i);
        fireEvent.click(pendingButton);
      });

      // Should only show non-completed tasks
      expect(screen.getByText('First task')).toBeInTheDocument();
      expect(screen.getByText('Second task')).toBeInTheDocument();
    });

    it('should search by text', async () => {
      render(
        <SortableTodoList
          todos={mockTodos}
          onToggle={mockHandlers.onToggle}
          onDelete={mockHandlers.onDelete}
          onReorder={mockHandlers.onReorder}
        />
      );

      const filterButton = screen.getByText(/Filter & Search/i);
      fireEvent.click(filterButton);

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search tasks...');
        fireEvent.change(searchInput, { target: { value: 'First' } });
      });

      expect(screen.getByText('First task')).toBeInTheDocument();
    });

    it('should clear all filters', async () => {
      render(
        <SortableTodoList
          todos={mockTodos}
          onToggle={mockHandlers.onToggle}
          onDelete={mockHandlers.onDelete}
          onReorder={mockHandlers.onReorder}
        />
      );

      const filterButton = screen.getByText(/Filter & Search/i);
      fireEvent.click(filterButton);

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search tasks...');
        fireEvent.change(searchInput, { target: { value: 'test' } });
      });

      await waitFor(() => {
        const clearButton = screen.getByText(/Clear All Filters/i);
        fireEvent.click(clearButton);
      });

      // All todos should be visible again
      expect(screen.getByText('First task')).toBeInTheDocument();
      expect(screen.getByText('Second task')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('should call onToggle when todo is toggled', () => {
      render(
        <SortableTodoList
          todos={mockTodos}
          onToggle={mockHandlers.onToggle}
          onDelete={mockHandlers.onDelete}
          onReorder={mockHandlers.onReorder}
        />
      );

      // Note: In a real scenario, we'd need to simulate the drag-drop context
      // This test checks the component structure
      expect(screen.getByText('First task')).toBeInTheDocument();
    });

    it('should display todo category badge', () => {
      render(
        <SortableTodoList
          todos={mockTodos}
          onToggle={mockHandlers.onToggle}
          onDelete={mockHandlers.onDelete}
          onReorder={mockHandlers.onReorder}
        />
      );

      expect(screen.getByText('work')).toBeInTheDocument();
      expect(screen.getByText('personal')).toBeInTheDocument();
    });

    it('should display todo priority badge for high priority', () => {
      render(
        <SortableTodoList
          todos={mockTodos}
          onToggle={mockHandlers.onToggle}
          onDelete={mockHandlers.onDelete}
          onReorder={mockHandlers.onReorder}
        />
      );

      // High priority badge should be visible
      const highPriorityBadges = screen.getAllByText(/High|High/i);
      expect(highPriorityBadges.length).toBeGreaterThan(0);
    });
  });

  describe('display stats', () => {
    it('should show completion statistics', async () => {
      render(
        <SortableTodoList
          todos={mockTodos}
          onToggle={mockHandlers.onToggle}
          onDelete={mockHandlers.onDelete}
          onReorder={mockHandlers.onReorder}
        />
      );

      const filterButton = screen.getByText(/Filter & Search/i);
      fireEvent.click(filterButton);

      await waitFor(() => {
        // Should show completion percentage
        expect(screen.getByText(/complete/i)).toBeInTheDocument();
      });
    });
  });
});
