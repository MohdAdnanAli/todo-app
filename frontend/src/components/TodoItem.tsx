import React from 'react';
import type { Todo, TodoCategory, TodoPriority } from '../types';
import { getSmartIcon } from '../utils/todoIcons';
import type { LucideIcon } from 'lucide-react';
import { 
  Trash2,
  Tag,
  AlertCircle
} from 'lucide-react';

interface TodoItemProps {
  todo: Todo;
  onToggle: (todo: Todo) => void;
  onDelete: (todoId: string) => void;
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

// Color palette for smart icons based on todo content - VIBRANT COLORS
function getIconColor(todoText: string, isCompleted: boolean, category?: TodoCategory): string {
  // Grey out when completed
  if (isCompleted) {
    return '#9ca3af';
  }
  
  // Use category color if available
  if (category && CATEGORY_COLORS[category]) {
    return CATEGORY_COLORS[category];
  }
  
  const lowerText = todoText.toLowerCase();
  
  // Work - Electric Indigo (vibrant)
  if (lowerText.includes('work') || lowerText.includes('meeting') || lowerText.includes('project') || 
      lowerText.includes('deadline') || lowerText.includes('office')) {
    return '#818cf8';
  }
  // Shopping - Bright Orange
  if (lowerText.includes('buy') || lowerText.includes('shopping') || lowerText.includes('order') || 
      lowerText.includes('grocery')) {
    return '#fb923c';
  }
  // Health - Hot Pink/Vibrant Red
  if (lowerText.includes('health') || lowerText.includes('doctor') || lowerText.includes('medicine') || 
      lowerText.includes('fitness') || lowerText.includes('gym') || lowerText.includes('workout')) {
    return '#f43f5e';
  }
  // Finance - Bright Green
  if (lowerText.includes('bill') || lowerText.includes('payment') || lowerText.includes('money') || 
      lowerText.includes('budget') || lowerText.includes('tax')) {
    return '#34d399';
  }
  // Travel - Bright Cyan/Sky
  if (lowerText.includes('travel') || lowerText.includes('trip') || lowerText.includes('flight') || 
      lowerText.includes('vacation')) {
    return '#22d3ee';
  }
  // Education - Bright Purple
  if (lowerText.includes('study') || lowerText.includes('learn') || lowerText.includes('course') || 
      lowerText.includes('homework') || lowerText.includes('exam')) {
    return '#c084fc';
  }
  // Tech - Bright Slate/Blue-Grey
  if (lowerText.includes('code') || lowerText.includes('programming') || lowerText.includes('computer') || 
      lowerText.includes('server')) {
    return '#94a3b8';
  }
  // Urgent - Bright Amber/Yellow
  if (lowerText.includes('urgent') || lowerText.includes('important') || lowerText.includes('asap')) {
    return '#fbbf24';
  }
  
  // Default - Electric Indigo
  return '#818cf8';
}

const TodoItem: React.FC<TodoItemProps> = ({ todo, onToggle, onDelete }) => {
  const { category = 'other', priority = 'medium', tags = [] } = todo;
  
  // Get smart icon based on todo text content
  const SmartIcon: LucideIcon = getSmartIcon(todo.text);
  const iconColor = getIconColor(todo.text, todo.completed, category);
  const priorityStyle = PRIORITY_COLORS[priority];

  const buttonDangerStyle: React.CSSProperties = {
    padding: '0.5rem 1rem',
    background: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 500,
    fontSize: '0.875rem',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
  };

  return (
    <li
      style={{
        padding: '1rem',
        marginBottom: '0.75rem',
        background: 'var(--card-bg)',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        transition: 'all 0.2s ease',
        border: '1px solid var(--border-secondary)',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.background = 'var(--hover-bg)';
        e.currentTarget.style.borderColor = 'var(--border-primary)';
        e.currentTarget.style.transform = 'translateX(2px)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.background = 'var(--card-bg)';
        e.currentTarget.style.borderColor = 'var(--border-secondary)';
        e.currentTarget.style.transform = 'translateX(0)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', flex: 1, gap: '0.875rem' }}>
        {/* Smart Icon - always shows the category icon */}
        <button
          onClick={() => onToggle(todo)}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px',
            transition: 'all 0.2s ease',
            flexShrink: 0,
            position: 'relative',
          }}
          onMouseOver={(e) => {
            if (!todo.completed) {
              e.currentTarget.style.transform = 'scale(1.1)';
            }
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
          aria-label={todo.completed ? 'Mark as incomplete' : 'Mark as complete'}
        >
          {/* Always show SmartIcon - category-based icon */}
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: `${iconColor}15`,
              border: todo.completed ? `2px solid ${iconColor}50` : `1.5px solid ${iconColor}40`,
              transition: 'all 0.2s ease',
            }}
          >
            <SmartIcon size={18} color={iconColor} strokeWidth={2.5} />
          </div>
        </button>

        {/* Todo text and metadata */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
            <span
              style={{
                flex: 1,
                textDecoration: todo.completed ? 'line-through' : 'none',
                color: todo.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                fontSize: '0.95rem',
                transition: 'all 0.2s ease',
                lineHeight: 1.4,
              }}
            >
              {todo.text}
            </span>
          </div>
          
          {/* Badges row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {/* Priority badge */}
            {priority !== 'medium' && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.15rem 0.4rem',
                  background: priorityStyle.bg,
                  border: `1px solid ${priorityStyle.border}`,
                  borderRadius: '4px',
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  color: priorityStyle.border,
                  textTransform: 'uppercase',
                }}
              >
                <AlertCircle size={10} />
                {priorityStyle.label}
              </span>
            )}
            
            {/* Category badge */}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0.15rem 0.4rem',
                background: `${CATEGORY_COLORS[category]}15`,
                border: `1px solid ${CATEGORY_COLORS[category]}40`,
                borderRadius: '4px',
                fontSize: '0.65rem',
                fontWeight: 500,
                color: CATEGORY_COLORS[category],
                textTransform: 'capitalize',
              }}
            >
              {category}
            </span>
            
            {/* Tags */}
            {tags.map(tag => (
              <span
                key={tag}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                  padding: '0.15rem 0.4rem',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-secondary)',
                  borderRadius: '4px',
                  fontSize: '0.65rem',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                }}
              >
                <Tag size={10} />
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={() => onDelete(todo._id)}
        style={buttonDangerStyle}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'scale(1.02)';
          e.currentTarget.style.boxShadow = '0 4px 8px rgba(239, 68, 68, 0.3)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 2px 4px rgba(239, 68, 68, 0.2)';
        }}
      >
        <Trash2 size={16} />
        Delete
      </button>
    </li>
  );
};

export default TodoItem;

