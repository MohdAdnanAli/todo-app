import React, { useState, useMemo } from 'react';
import type { Todo, TodoCategory, TodoPriority } from '../types';
import TodoItem from './TodoItem';
import { SlidersHorizontal, ChevronDown, ChevronUp, Search, FilterX } from 'lucide-react';

interface TodoListProps {
  todos: Todo[];
  onToggle: (todo: Todo) => void;
  onDelete: (todoId: string) => void;
}

const CATEGORIES: { value: TodoCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'work', label: 'Work' },
  { value: 'personal', label: 'Personal' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'health', label: 'Health' },
  { value: 'other', label: 'Other' },
];

const PRIORITIES: { value: TodoPriority | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const TodoList: React.FC<TodoListProps> = ({ todos, onToggle, onDelete }) => {
  const [categoryFilter, setCategoryFilter] = useState<TodoCategory | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TodoPriority | 'all'>('all');
  const [showCompleted, setShowCompleted] = useState<boolean | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Check if any filters are active
  const hasActiveFilters = categoryFilter !== 'all' || priorityFilter !== 'all' || showCompleted !== 'all' || searchQuery !== '';

  // Filter todos based on current filters
  const filteredTodos = useMemo(() => {
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
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesText = todo.text.toLowerCase().includes(query);
        const matchesTags = todo.tags?.some(tag => tag.toLowerCase().includes(query));
        if (!matchesText && !matchesTags) {
          return false;
        }
      }
      
      return true;
    });
  }, [todos, categoryFilter, priorityFilter, showCompleted, searchQuery]);

  // Count stats
  const stats = useMemo(() => ({
    total: todos.length,
    completed: todos.filter(t => t.completed).length,
    pending: todos.filter(t => !t.completed).length,
    filtered: filteredTodos.length,
  }), [todos, filteredTodos]);

  const filterButtonStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '0.35rem 0.65rem',
    fontSize: '0.7rem',
    border: `1.5px solid ${isActive ? 'var(--accent-primary)' : 'var(--border-secondary)'}`,
    background: isActive ? 'var(--accent-gradient)' : 'transparent',
    color: isActive ? 'white' : 'var(--text-secondary)',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 500,
    transition: 'all 0.2s ease',
  });

  const searchInputStyle: React.CSSProperties = {
    padding: '0.5rem 0.75rem',
    paddingLeft: '2rem',
    fontSize: '0.85rem',
    border: '1px solid var(--border-secondary)',
    borderRadius: '6px',
    backgroundColor: 'var(--input-bg)',
    color: 'var(--text-primary)',
    width: '100%',
  };

  const toggleButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: '0.65rem 0.85rem',
    fontSize: '0.8rem',
    border: '1px solid var(--border-secondary)',
    borderRadius: '8px',
    backgroundColor: hasActiveFilters ? 'var(--accent-gradient)' : 'var(--bg-secondary)',
    color: hasActiveFilters ? 'white' : 'var(--text-primary)',
    cursor: 'pointer',
    fontWeight: 500,
    transition: 'all 0.2s ease',
  };

  const clearFilters = () => {
    setCategoryFilter('all');
    setPriorityFilter('all');
    setShowCompleted('all');
    setSearchQuery('');
  };

  // Empty states
  if (todos.length === 0) {
    return (
      <p style={{ 
        color: 'var(--text-muted)', 
        textAlign: 'center',
        padding: '2rem',
        background: 'var(--bg-secondary)',
        borderRadius: '12px',
        border: '2px dashed var(--border-primary)',
      }}>
        No tasks yet. Add one above! ✨
      </p>
    );
  }

  return (
    <div>
      {/* Collapsible Filter Toggle */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        style={toggleButtonStyle}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <SlidersHorizontal size={14} />
          <span>
            {hasActiveFilters 
              ? `Filtered: ${stats.filtered} of ${stats.total}` 
              : 'Filter & Search'}
          </span>
          {hasActiveFilters && (
            <span style={{ 
              background: 'rgba(255,255,255,0.2)', 
              padding: '0.1rem 0.4rem', 
              borderRadius: '4px',
              fontSize: '0.7rem',
            }}>
              Active
            </span>
          )}
        </div>
        {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {/* Expandable Filter Panel */}
      {showFilters && (
        <div style={{ 
          padding: '1rem', 
          background: 'var(--bg-secondary)', 
          borderRadius: '0 0 12px 12px',
          border: '1px solid var(--border-secondary)',
          borderTop: 'none',
          marginBottom: '1rem',
          animation: 'slideDown 0.2s ease',
        }}>
          {/* Search */}
          <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
            <Search 
              size={14} 
              style={{ 
                position: 'absolute', 
                left: '0.6rem', 
                top: '50%', 
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }} 
            />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={searchInputStyle}
            />
          </div>
          
          {/* Category filters */}
          <div style={{ marginBottom: '0.6rem' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 500, textTransform: 'uppercase' }}>
              Category
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setCategoryFilter(cat.value)}
                  style={filterButtonStyle(categoryFilter === cat.value)}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Priority filters */}
          <div style={{ marginBottom: '0.6rem' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 500, textTransform: 'uppercase' }}>
              Priority
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
              {PRIORITIES.map(pri => (
                <button
                  key={pri.value}
                  onClick={() => setPriorityFilter(pri.value)}
                  style={filterButtonStyle(priorityFilter === pri.value)}
                >
                  {pri.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Show completed toggle */}
          <div style={{ marginBottom: '0.5rem' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 500, textTransform: 'uppercase' }}>
              Show
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
              <button
                onClick={() => setShowCompleted('all')}
                style={filterButtonStyle(showCompleted === 'all')}
              >
                All
              </button>
              <button
                onClick={() => setShowCompleted(false)}
                style={filterButtonStyle(showCompleted === false)}
              >
                Pending ({stats.pending})
              </button>
              <button
                onClick={() => setShowCompleted(true)}
                style={filterButtonStyle(showCompleted === true)}
              >
                Done ({stats.completed})
              </button>
            </div>
          </div>
          
          {/* Clear filters button */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.4rem 0.75rem',
                fontSize: '0.75rem',
                background: 'transparent',
                border: '1px solid var(--border-secondary)',
                borderRadius: '6px',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                marginTop: '0.5rem',
              }}
            >
              <FilterX size={12} />
              Clear All Filters
            </button>
          )}
          
          {/* Results count */}
          <div style={{ 
            marginTop: '0.6rem', 
            paddingTop: '0.6rem', 
            borderTop: '1px solid var(--border-secondary)',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            display: 'flex',
            justifyContent: 'space-between',
          }}>
            <span>Showing {stats.filtered} of {stats.total} tasks</span>
            {stats.completed > 0 && (
              <span>✓ {Math.round((stats.completed / stats.total) * 100)}% complete</span>
            )}
          </div>
        </div>
      )}

      {/* No results message */}
      {filteredTodos.length === 0 && hasActiveFilters && (
        <p style={{ 
          color: 'var(--text-muted)', 
          textAlign: 'center',
          padding: '2rem',
          background: 'var(--bg-secondary)',
          borderRadius: '12px',
          border: '2px dashed var(--border-primary)',
        }}>
          No tasks match your filters. Try adjusting them! 🔍
        </p>
      )}

      {/* Todo list */}
      {filteredTodos.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {filteredTodos.map((todo) => (
            <TodoItem
              key={todo._id}
              todo={todo}
              onToggle={onToggle}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </div>
  );
};

export default TodoList;

