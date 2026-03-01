import React, { memo } from 'react';
import type { Todo, TodoCategory, TodoPriority } from '../types';
import { getSmartIcon } from '../utils/todoIcons';
import { getIconColor, CATEGORY_COLORS, PRIORITY_COLORS, formatDueDate } from '../utils/todoHelpers';
import type { LucideIcon } from 'lucide-react';
import { Trash2, Tag, AlertCircle } from 'lucide-react';

interface TodoItemProps {
  todo: Todo;
  onToggle: (todo: Todo) => void;
  onDelete: (todoId: string) => void;
  dragHandle?: React.ReactNode;
  dragDisabled?: boolean;
  isDragging?: boolean;
}

// Stable memoized icon color calculation
const useIconColor = (text: string, completed: boolean, category?: TodoCategory) => {
  return React.useMemo(
    () => getIconColor(text, completed, category),
    [text, completed, category]
  );
};

// Stable memoized priority style
const usePriorityStyle = (priority: TodoPriority) => {
  return React.useMemo(
    () => PRIORITY_COLORS[priority],
    [priority]
  );
};

const TodoItemCore: React.FC<TodoItemProps> = memo(({ 
  todo, 
  onToggle, 
  onDelete,
  dragHandle,
  dragDisabled = false,
  isDragging = false,
}) => {
  const { category = 'other', priority = 'medium', tags = [], dueDate } = todo;
  
  const SmartIcon: LucideIcon = React.useMemo(
    () => getSmartIcon(todo.text),
    [todo.text]
  );
  
  const iconColor = useIconColor(todo.text, todo.completed, category);
  const priorityStyle = usePriorityStyle(priority);
  const formattedDueDate = formatDueDate(dueDate);

  // Stable handlers that don't cause re-renders
  const handleToggle = React.useCallback(() => {
    onToggle(todo);
  }, [onToggle, todo]);

  const handleDelete = React.useCallback(() => {
    onDelete(todo._id);
  }, [onDelete, todo._id]);

  return (
    <li
      className={`
        p-2 sm:p-3 mb-2 sm:mb-3 rounded-xl flex items-center gap-1 sm:gap-2 
        transition-all duration-200 border
        ${isDragging 
          ? 'bg-[var(--accent-primary)] border-[var(--border-primary)] shadow-lg scale-105' 
          : 'hover:bg-[var(--hover-bg)] hover:border-[var(--border-primary)] hover:translate-x-0.5 bg-[var(--card-bg)] border-[var(--border-secondary)]'
        }
      `}
    >
      {/* Drag handle (optional) */}
      {dragHandle}

      {/* Column 1: Icon with padding */}
      <div className="flex-shrink-0">
        <button
          onClick={handleToggle}
          className="bg-transparent border-none cursor-pointer rounded-lg transition-all duration-200
            hover:scale-110 active:scale-95"
          aria-label={todo.completed ? 'Mark as incomplete' : 'Mark as complete'}
          disabled={dragDisabled}
        >
          <div 
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200"
            style={{
              backgroundColor: `${iconColor}15`,
              border: todo.completed ? `2px solid ${iconColor}50` : `1.5px solid ${iconColor}40`,
            }}
          >
            <SmartIcon size={18} color={iconColor} strokeWidth={2.5} />
          </div>
        </button>
      </div>

      {/* Column 2-3: Text and metadata */}
      <div className="flex-1 min-w-0 py-1">
        <div className="flex items-start gap-2">
          <span
            className="flex-1 text-sm sm:text-base transition-all duration-200 leading-snug"
            style={{
              textDecoration: todo.completed ? 'line-through' : 'none',
              color: todo.completed ? 'var(--text-muted)' : 'var(--text-primary)',
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap',
            }}
          >
            {todo.text}
          </span>
        </div>
        
        {/* Badges row - show on all screen sizes */}
        <div className="flex items-center gap-1.5 flex-wrap mt-1">
          {priority !== 'medium' && (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold uppercase"
              style={{
                background: priorityStyle.bg,
                border: `1px solid ${priorityStyle.border}`,
                color: priorityStyle.border,
              }}
            >
              <AlertCircle size={10} />
              {priorityStyle.label}
            </span>
          )}
          
          <span
            className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium capitalize"
            style={{
              background: `${CATEGORY_COLORS[category]}15`,
              border: `1px solid ${CATEGORY_COLORS[category]}40`,
              color: CATEGORY_COLORS[category],
            }}
          >
            {category}
          </span>

          {formattedDueDate && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] text-[var(--text-secondary)]">
              📅 {formattedDueDate}
            </span>
          )}
          
          {tags.map(tag => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium
                bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] text-[var(--text-secondary)]"
            >
              <Tag size={10} />
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Column 4: Delete button - always show text */}
      <button
        onClick={handleDelete}
        className="p-2 sm:px-3 py-1.5 rounded-lg font-medium text-xs sm:text-sm flex items-center justify-center gap-1 transition-all duration-200
          bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-md flex-shrink-0 whitespace-nowrap
          hover:shadow-lg hover:scale-[1.02] hover:-translate-y-0.5"
        style={{ boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)' }}
        aria-label="Delete todo"
        disabled={dragDisabled}
      >
        <Trash2 size={16} />
        <span>Delete</span>
      </button>
    </li>
  );
});

TodoItemCore.displayName = 'TodoItemCore';

// Default export for non-sortable usage
const TodoItem: React.FC<Omit<TodoItemProps, 'dragHandle' | 'dragDisabled' | 'isDragging'>> = memo(
  ({ todo, onToggle, onDelete }) => (
    <TodoItemCore todo={todo} onToggle={onToggle} onDelete={onDelete} />
  )
);

TodoItem.displayName = 'TodoItem';

export { TodoItem, TodoItemCore };
export default TodoItem;

