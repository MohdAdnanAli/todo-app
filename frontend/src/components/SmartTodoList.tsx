import React, { useState, useMemo, memo, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import type { Todo } from '../types';
import { useTodoFilters } from '../hooks/useTodoFilters';
import { TodoItemCore } from './TodoItem';
import { CATEGORIES, PRIORITIES } from '../utils/todoHelpers';
import { SlidersHorizontal, ChevronDown, ChevronUp, Search, FilterX, GripVertical } from 'lucide-react';

interface SmartTodoListProps {
  todos: Todo[];
  onToggle: (todo: Todo) => void;
  onDelete: (todoId: string) => void;
  onReorder?: (reorderedTodos: Todo[]) => void;
  sortable?: boolean;
}

const SmartTodoList: React.FC<SmartTodoListProps> = memo(
  ({ todos, onToggle, onDelete, onReorder, sortable = false }) => {
    const [activeId, setActiveId] = useState<string | null>(null);

    // Use the custom hook for all filter logic
    const {
      categoryFilter,
      priorityFilter,
      showCompleted,
      searchQuery,
      showFilters,
      setCategoryFilter,
      setPriorityFilter,
      setShowCompleted,
      setSearchQuery,
      setShowFilters,
      clearFilters,
      filteredTodos,
      hasActiveFilters,
      stats,
    } = useTodoFilters(todos);

    // DnD sensors - only needed if sortable
    const sensors = useSensors(
      useSensor(PointerSensor, {
        activationConstraint: { distance: 5 },
      }),
      useSensor(TouchSensor, {
        activationConstraint: { delay: 250, tolerance: 5 },
      }),
      useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
      })
    );

    // Only enable drag when sortable prop is true AND no filters active
    const isDragEnabled = sortable && !hasActiveFilters;

    // Find the actual todo object for the active drag item
    const activeTodo = useMemo(() => {
      if (!activeId || !sortable) return null;
      return todos.find(t => t._id === activeId) || null;
    }, [activeId, todos, sortable]);

    // Handlers
    const handleDragStart = useCallback((event: DragStartEvent) => {
      setActiveId(event.active.id as string);
    }, []);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (!over || active.id === over.id || !onReorder) {
        return;
      }

      // Find indices in the FULL sorted todos list (not filtered)
      const oldIndex = todos.findIndex(todo => todo._id === active.id);
      const newIndex = todos.findIndex(todo => todo._id === over.id);

      if (oldIndex === -1 || newIndex === -1) {
        return;
      }

      // Move within the full todos list using arrayMove
      const reorderedTodos = arrayMove(todos, oldIndex, newIndex);

      // Assign new order values based on the new positions
      const updatedTodos = reorderedTodos.map((todo, index) => ({
        ...todo,
        order: index,
      }));

      // Call onReorder with the reordered todos
      onReorder(updatedTodos);
    }, [todos, onReorder]);

    const handleDragCancel = useCallback(() => {
      setActiveId(null);
    }, []);

    // Stable handlers for TodoItem
    const handleToggle = useCallback((todo: Todo) => {
      onToggle(todo);
    }, [onToggle]);

    const handleDelete = useCallback((todoId: string) => {
      onDelete(todoId);
    }, [onDelete]);

    // Empty state
    if (todos.length === 0) {
      return (
        <p className="text-center p-8 rounded-xl border-2 border-dashed border-[var(--border-primary)] text-[var(--text-muted)] bg-[var(--bg-secondary)]">
          No tasks yet. Add one above! ✨
        </p>
      );
    }

    // Filter panel component (memoized)
    const FilterPanel = useMemo(() => (
      <div className="p-4 bg-[var(--bg-secondary)] rounded-b-xl border border-[var(--border-secondary)] border-t-none mb-4 animate-fade-in">
        {/* Search */}
        <div className="relative mb-3">
          <Search 
            size={14} 
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" 
          />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-[var(--border-secondary)] 
              bg-[var(--input-bg)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] 
              focus:ring-2 focus:ring-[var(--glow)] transition-all duration-200"
          />
        </div>
        
        {/* Category filters */}
        <div className="mb-2.5">
          <div className="text-xs font-medium text-[var(--text-muted)] uppercase mb-1.5 tracking-wide">Category</div>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                onClick={() => setCategoryFilter(cat.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 border
                  ${categoryFilter === cat.value
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-transparent'
                    : 'border-[var(--border-secondary)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]'
                  }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Priority filters */}
        <div className="mb-2.5">
          <div className="text-xs font-medium text-[var(--text-muted)] uppercase mb-1.5 tracking-wide">Priority</div>
          <div className="flex flex-wrap gap-1.5">
            {PRIORITIES.map(pri => (
              <button
                key={pri.value}
                onClick={() => setPriorityFilter(pri.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 border
                  ${priorityFilter === pri.value
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-transparent'
                    : 'border-[var(--border-secondary)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]'
                  }`}
              >
                {pri.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Show completed toggle */}
        <div className="mb-2">
          <div className="text-xs font-medium text-[var(--text-muted)] uppercase mb-1.5 tracking-wide">Show</div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setShowCompleted('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 border
                ${showCompleted === 'all'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-transparent'
                  : 'border-[var(--border-secondary)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]'
                }`}
            >
              All
            </button>
            <button
              onClick={() => setShowCompleted(false)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 border
                ${showCompleted === false
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-transparent'
                  : 'border-[var(--border-secondary)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]'
                }`}
            >
              Pending ({stats.pending})
            </button>
            <button
              onClick={() => setShowCompleted(true)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 border
                ${showCompleted === true
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-transparent'
                  : 'border-[var(--border-secondary)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]'
                }`}
            >
              Done ({stats.completed})
            </button>
          </div>
        </div>
        
        {/* Clear filters button */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-3 py-2 text-xs rounded-md border border-[var(--border-secondary)] 
              text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] transition-all duration-200 mt-2"
          >
            <FilterX size={12} />
            Clear All Filters
          </button>
        )}
        
        {/* Results count */}
        <div className="mt-3 pt-3 border-t border-[var(--border-secondary)] text-xs text-[var(--text-muted)] flex justify-between">
          <span>Showing {stats.filtered} of {stats.total} tasks</span>
          {stats.completed > 0 && (
            <span>✓ {Math.round((stats.completed / stats.total) * 100)}% complete</span>
          )}
        </div>
      </div>
    ), [
      searchQuery, categoryFilter, priorityFilter, showCompleted, hasActiveFilters, stats,
      setSearchQuery, setCategoryFilter, setPriorityFilter, setShowCompleted, clearFilters
    ]);

    // Render the todo list
    const renderTodoList = () => {
      // Drag disabled info
      if (sortable && hasActiveFilters && filteredTodos.length > 0) {
        return (
          <>
            <p className="text-center p-2 text-xs text-[var(--text-muted)] bg-[var(--bg-secondary)] rounded-t-xl border border-[var(--border-secondary)] border-b-none">
              ℹ️ Drag and drop is disabled while filters are active. Clear filters to reorder.
            </p>
            <ul className="list-none p-0 m-0">
              {filteredTodos.map((todo) => (
                <TodoItemCore
                  key={todo._id}
                  todo={todo}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                  dragDisabled={true}
                />
              ))}
            </ul>
          </>
        );
      }

      // Non-sortable mode
      if (!sortable) {
        return (
          <ul className="list-none p-0 m-0">
            {filteredTodos.map((todo) => (
              <TodoItemCore
                key={todo._id}
                todo={todo}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            ))}
          </ul>
        );
      }

      // Sortable mode with filters disabled
      return (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext
            items={todos.map(t => t._id)}
            strategy={verticalListSortingStrategy}
            disabled={!isDragEnabled}
          >
            <ul className="list-none p-0 m-0">
              {filteredTodos.map((todo) => {
                // For sortable items, we need to wrap with useSortable
                const SortableItem = React.memo(() => {
                  const {
                    attributes,
                    listeners,
                    setNodeRef,
                    transform,
                    transition,
                    isDragging,
                  } = useSortable({ id: todo._id, disabled: !isDragEnabled });

                  const style = {
                    transform: transform ? `translateY(${transform.y}px)` : undefined,
                    transition,
                    opacity: isDragging ? 0.5 : 1,
                  };

                  // Drag handle
                  const dragHandle = sortable && (
                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                      <button
                        {...attributes}
                        {...listeners}
                        className="p-1.5 sm:p-2 cursor-grab active:cursor-grabbing text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                        style={{ touchAction: 'none' }}
                        aria-label="Drag to reorder"
                      >
                        <GripVertical size={16} />
                      </button>
                    </div>
                  );

                  return (
                    <div ref={setNodeRef} style={style}>
                      <TodoItemCore
                        todo={todo}
                        onToggle={handleToggle}
                        onDelete={handleDelete}
                        dragHandle={dragHandle}
                        dragDisabled={!isDragEnabled}
                        isDragging={isDragging}
                      />
                    </div>
                  );
                });

                SortableItem.displayName = `SortableTodoItem-${todo._id}`;

                return <SortableItem key={todo._id} />;
              })}
            </ul>
          </SortableContext>
          
          {/* Drag Overlay for visual feedback */}
          <DragOverlay>
            {activeTodo ? (
              <div className="p-4 mb-3 rounded-xl bg-[var(--accent-primary)] border border-[var(--border-primary)] shadow-lg scale-105 opacity-90">
                <div className="flex items-center gap-3.5">
                  <div className="w-8 h-8 flex-shrink-0" />
                  <span className="text-base text-[var(--text-primary)]">
                    {activeTodo.text.length > 50 ? activeTodo.text.substring(0, 50) + '...' : activeTodo.text}
                  </span>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      );
    };

    return (
      <div>
        {/* Collapsible Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center justify-between w-full px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200
            ${hasActiveFilters 
              ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' 
              : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-secondary)]'
            }`}
        >
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={14} />
            <span>
              {hasActiveFilters 
                ? `Filtered: ${stats.filtered} of ${stats.total}` 
                : 'Filter & Search'}
            </span>
            {hasActiveFilters && (
              <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs">Active</span>
            )}
          </div>
          {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {/* Expandable Filter Panel */}
        {showFilters && FilterPanel}

        {/* No results message */}
        {filteredTodos.length === 0 && hasActiveFilters && (
          <p className="text-center p-8 rounded-xl border-2 border-dashed border-[var(--border-primary)] text-[var(--text-muted)] bg-[var(--bg-secondary)]">
            No tasks match your filters. Try adjusting them! 🔍
          </p>
        )}

        {/* Todo list */}
        {filteredTodos.length > 0 && renderTodoList()}
      </div>
    );
  }
);

SmartTodoList.displayName = 'SmartTodoList';

export default SmartTodoList;

