import React, { memo } from 'react';
import type { Todo, TodoCategory, TodoPriority } from '../types';
import { getSmartIcon } from '../utils/todoIcons';
import { getIconColor, CATEGORY_COLORS, PRIORITY_COLORS, formatDueDate, formatTimestamp } from '../utils/todoHelpers';
import type { LucideIcon } from 'lucide-react';
import { Trash2, Tag, AlertCircle } from 'lucide-react';

/**
 * Sanitize text to prevent XSS attacks
 * Escapes HTML special characters
 */
function sanitizeText(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

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
  // Defensive check: ensure todo has required properties
  // Return a placeholder instead of null to maintain hook consistency
  if (!todo || !todo._id || typeof todo.text !== 'string') {
    return (
      <li className="p-2 sm:p-3 mb-2 sm:mb-3 rounded-xl border border-dashed border-[var(--border-secondary)] bg-[var(--bg-secondary)] opacity-50">
        <span className="text-sm text-[var(--text-muted)]">Invalid task data</span>
      </li>
    );
  }
  
  const { category = 'other', priority = 'medium', tags = [], dueDate, createdAt } = todo;
  
  const SmartIcon: LucideIcon = React.useMemo(
    () => getSmartIcon(todo.text),
    [todo.text]
  );
  
  const iconColor = useIconColor(todo.text, !!todo.completed, category);
  const priorityStyle = usePriorityStyle(priority);
  const formattedDueDate = formatDueDate(dueDate);
  const formattedTimestamp = formatTimestamp(createdAt);

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
            className="flex-1 text-sm sm:text-base transition-all duration-200 leading-snug max-w-[85vw] sm:max-w-[400px] hyphens-auto overflow-wrap-anywhere break-words"
            style={{
              textDecoration: todo.completed ? 'line-through' : 'none',
              color: todo.completed ? 'var(--text-muted)' : 'var(--text-primary)',
            }}
            dangerouslySetInnerHTML={{ __html: sanitizeText(todo.displayText || todo.text) }}
          />

        {todo.decryptionError && (
          <div className="text-xs text-red-400 mt-1 flex items-center gap-1">
            <AlertCircle size={12} />
            <span>🔒 Encrypted - check password</span>
          </div>
        )}
        </div>
        
        {/* Timestamp - small grey text */}
        {formattedTimestamp && (
          <span className="text-xs text-[var(--text-muted)] mt-0.5 block">
            {formattedTimestamp}
          </span>
        )}
        
        {/* Badges row - show on all screen sizes */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap mt-1 min-h-[20px]">
          {priority !== 'medium' && (
            <span
              className="inline-flex items-center gap-1 px-2 py-1 min-h-[24px] rounded-md text-xs font-semibold uppercase touch-man"
              style={{
                background: priorityStyle.bg,
                border: `1px solid ${priorityStyle.border}`,
                color: priorityStyle.border,
              }}
            >
              <AlertCircle size={12} />
              {priorityStyle.label}
            </span>
          )}

          
          <span
            className="inline-flex items-center px-2 py-1 min-h-[24px] rounded-md text-xs font-medium capitalize touch-man"
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
              {sanitizeText(tag)}
            </span>
          ))}
        </div>
      </div>

      {/* Column 4: Delete button - show only icon on small screens */}
      <button
        onClick={handleDelete}
        className="p-2 sm:px-3 py-1.5 rounded-lg font-medium text-xs sm:text-sm flex items-center justify-center gap-1 transition-all duration-200
          bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-md flex-shrink-0
          hover:shadow-lg hover:scale-[1.02] hover:-translate-y-0.5"
        style={{ boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)' }}
        aria-label="Delete todo"
        disabled={dragDisabled}
      >
        <Trash2 size={16} />
        <span className="hidden sm:inline">Delete</span>
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

