import React, { memo, useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Todo, TodoCategory, TodoPriority } from '../types';
import { getSmartIcon } from '../utils/todoIcons';
import type { LucideIcon } from 'lucide-react';
import { Trash2, Tag, AlertCircle, GripVertical } from 'lucide-react';

interface SortableTodoItemProps {
  todo: Todo;
  onToggle: (todo: Todo) => void;
  onDelete: (todoId: string) => void;
  dragDisabled?: boolean;
}

const CATEGORY_COLORS: Record<TodoCategory, string> = {
  work: '#818cf8',
  personal: '#f43f5e',
  shopping: '#fb923c',
  health: '#34d399',
  other: '#94a3b8',
};

const PRIORITY_COLORS: Record<TodoPriority, { bg: string; border: string; label: string }> = {
  low: { bg: 'rgba(156, 163, 175, 0.15)', border: '#9ca3af', label: 'Low' },
  medium: { bg: 'rgba(234, 179, 8, 0.15)', border: '#eab308', label: 'Med' },
  high: { bg: 'rgba(239, 68, 68, 0.15)', border: '#ef4444', label: 'High' },
};

function getIconColor(todoText: string, isCompleted: boolean, category?: TodoCategory): string {
  if (isCompleted) return '#9ca3af';
  if (category && CATEGORY_COLORS[category]) return CATEGORY_COLORS[category];

  const lowerText = todoText.toLowerCase();
  if (lowerText.includes('work') || lowerText.includes('meeting') || lowerText.includes('project') ||
    lowerText.includes('deadline') || lowerText.includes('office')) return '#818cf8';
  if (lowerText.includes('buy') || lowerText.includes('shopping') || lowerText.includes('order') ||
    lowerText.includes('grocery')) return '#fb923c';
  if (lowerText.includes('health') || lowerText.includes('doctor') || lowerText.includes('medicine') ||
    lowerText.includes('fitness') || lowerText.includes('gym') || lowerText.includes('workout')) return '#f43f5e';
  if (lowerText.includes('bill') || lowerText.includes('payment') || lowerText.includes('money') ||
    lowerText.includes('budget') || lowerText.includes('tax')) return '#34d399';
  if (lowerText.includes('travel') || lowerText.includes('trip') || lowerText.includes('flight') ||
    lowerText.includes('vacation')) return '#22d3ee';
  if (lowerText.includes('study') || lowerText.includes('learn') || lowerText.includes('course') ||
    lowerText.includes('homework') || lowerText.includes('exam')) return '#c084fc';
  if (lowerText.includes('code') || lowerText.includes('programming') || lowerText.includes('computer') ||
    lowerText.includes('server')) return '#94a3b8';
  if (lowerText.includes('urgent') || lowerText.includes('important') || lowerText.includes('asap')) return '#fbbf24';

  return '#818cf8';
}

const SortableTodoItem: React.FC<SortableTodoItemProps> = memo(({ todo, onToggle, onDelete, dragDisabled = false }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo._id, disabled: dragDisabled });

  const [participantImageLoading, setParticipantImageLoading] = useState(true);
  const imageRef = useRef<HTMLImageElement>(null);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const { category = 'other', priority = 'medium', tags = [], dueDate } = todo;

  const SmartIcon: LucideIcon = getSmartIcon(todo.text);
  const iconColor = getIconColor(todo.text, todo.completed, category);
  const priorityStyle = PRIORITY_COLORS[priority];

  const formattedDueDate = dueDate
    ? new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null;

  // Handle image loading
  useEffect(() => {
    const img = imageRef.current;
    if (!img) return;

    const handleLoad = () => setParticipantImageLoading(false);
    const handleError = () => setParticipantImageLoading(false);

    if (img.complete) {
      setParticipantImageLoading(false);
    } else {
      img.addEventListener('load', handleLoad);
      img.addEventListener('error', handleError);
    }

    return () => {
      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleError);
    };
  }, [todo.participants]);

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`p-2 sm:p-3 mb-2 sm:mb-3 rounded-xl flex items-center gap-1 sm:gap-2 transition-all duration-200 border
        ${isDragging ? 'bg-[var(--accent-primary)] border-[var(--border-primary)] shadow-lg scale-105' : 'hover:bg-[var(--hover-bg)] hover:border-[var(--border-primary)] hover:translate-x-0.5 bg-[var(--card-bg)] border-[var(--border-secondary)]'}`}
    >
      {/* Column 1: Drag handler + Icon with padding */}
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

        <button
          onClick={() => onToggle(todo)}
          className="bg-transparent border-none cursor-pointer rounded-lg transition-all duration-200
            hover:scale-110 active:scale-95"
          aria-label={todo.completed ? 'Mark as incomplete' : 'Mark as complete'}
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

          {/* Participants */}
          {todo.participants && todo.participants.length > 0 && (
            <div className="flex items-center gap-1">
              <div className="flex -space-x-2">
                {todo.participants.slice(0, 3).map((participant) => (
                  <div key={participant.id} className="relative">
                    {participant.avatar ? (
                      <img
                        ref={imageRef}
                        src={participant.avatar}
                        alt={participant.name}
                        className="w-5 h-5 rounded-full border-2 border-[var(--card-bg)]"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-[var(--accent-primary)] border-2 border-[var(--card-bg)] flex items-center justify-center text-[8px] font-medium text-white">
                        {participant.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {participantImageLoading && (
                <div className="w-3 h-3 border-2 border-[var(--border-secondary)] border-t-[var(--accent-primary)] rounded-full animate-spin" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Column 4: Delete button - always show text */}
      <button
        onClick={() => onDelete(todo._id)}
        className="p-2 sm:p-2.5 rounded-lg font-medium text-xs sm:text-sm flex items-center justify-center gap-1 transition-all duration-200
          bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-md flex-shrink-0 whitespace-nowrap
          hover:shadow-lg hover:scale-[1.02] hover:-translate-y-0.5"
        style={{ boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)' }}
        aria-label="Delete todo"
      >
        <Trash2 size={18} />
        <span>Delete</span>
      </button>
    </li>
  );
});

SortableTodoItem.displayName = 'SortableTodoItem';

export default SortableTodoItem;

