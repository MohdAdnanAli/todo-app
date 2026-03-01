import { useState, useMemo, useCallback } from 'react';
import type { Todo, TodoCategory, TodoPriority } from '../types';

export interface UseTodoFiltersOptions {
  /** Initial category filter */
  initialCategory?: TodoCategory | 'all';
  /** Initial priority filter */
  initialPriority?: TodoPriority | 'all';
  /** Initial show completed filter */
  initialShowCompleted?: boolean | 'all';
  /** Initial search query */
  initialSearch?: string;
}

export interface UseTodoFiltersReturn {
  // Filter state
  categoryFilter: TodoCategory | 'all';
  priorityFilter: TodoPriority | 'all';
  showCompleted: boolean | 'all';
  searchQuery: string;
  showFilters: boolean;
  
  // Filter actions
  setCategoryFilter: (category: TodoCategory | 'all') => void;
  setPriorityFilter: (priority: TodoPriority | 'all') => void;
  setShowCompleted: (show: boolean | 'all') => void;
  setSearchQuery: (query: string) => void;
  setShowFilters: (show: boolean) => void;
  clearFilters: () => void;
  
  // Computed values
  filteredTodos: Todo[];
  hasActiveFilters: boolean;
  stats: {
    total: number;
    completed: number;
    pending: number;
    filtered: number;
  };
}

/**
 * Custom hook for managing todo filtering logic
 * Consolidates all filter state and computations in one place
 */
export function useTodoFilters(
  todos: Todo[],
  options: UseTodoFiltersOptions = {}
): UseTodoFiltersReturn {
  const {
    initialCategory = 'all',
    initialPriority = 'all',
    initialShowCompleted = 'all',
    initialSearch = '',
  } = options;

  // Filter state
  const [categoryFilter, setCategoryFilter] = useState<TodoCategory | 'all'>(initialCategory);
  const [priorityFilter, setPriorityFilter] = useState<TodoPriority | 'all'>(initialPriority);
  const [showCompleted, setShowCompleted] = useState<boolean | 'all'>(initialShowCompleted);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [showFilters, setShowFilters] = useState(false);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return categoryFilter !== 'all' || 
           priorityFilter !== 'all' || 
           showCompleted !== 'all' || 
           searchQuery !== '';
  }, [categoryFilter, priorityFilter, showCompleted, searchQuery]);

  // Optimized filter function with early returns
  const filteredTodos = useMemo(() => {
    // Fast path: no filters = return all
    if (!hasActiveFilters) {
      return todos;
    }

    return todos.filter(todo => {
      // Category filter
      if (categoryFilter !== 'all' && todo.category !== categoryFilter) {
        return false;
      }

      // Priority filter
      if (priorityFilter !== 'all' && todo.priority !== priorityFilter) {
        return false;
      }

      // Completed filter
      if (showCompleted !== 'all' && todo.completed !== showCompleted) {
        return false;
      }

      // Search filter - only run if there's a query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        
        // Check text
        if (!todo.text.toLowerCase().includes(query)) {
          // Check tags if text doesn't match
          if (!todo.tags?.some(tag => tag.toLowerCase().includes(query))) {
            return false;
          }
        }
      }

      return true;
    });
  }, [todos, hasActiveFilters, categoryFilter, priorityFilter, showCompleted, searchQuery]);

  // Memoized stats - only recalculate when base data changes
  const stats = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    const pending = total - completed;
    
    return {
      total,
      completed,
      pending,
      filtered: filteredTodos.length,
    };
  }, [todos, filteredTodos.length]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setCategoryFilter('all');
    setPriorityFilter('all');
    setShowCompleted('all');
    setSearchQuery('');
  }, []);

  return {
    // Filter state
    categoryFilter,
    priorityFilter,
    showCompleted,
    searchQuery,
    showFilters,
    
    // Filter actions
    setCategoryFilter,
    setPriorityFilter,
    setShowCompleted,
    setSearchQuery,
    setShowFilters,
    clearFilters,
    
    // Computed values
    filteredTodos,
    hasActiveFilters,
    stats,
  };
}

export default useTodoFilters;

