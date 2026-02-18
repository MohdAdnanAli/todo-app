import React from 'react';
import type { Todo } from '../types';
import { getSmartIcon } from '../utils/todoIcons';
import type { LucideIcon } from 'lucide-react';
import { 
  Circle, 
  CheckCircle2, 
  Trash2
} from 'lucide-react';

interface TodoItemProps {
  todo: Todo;
  onToggle: (todo: Todo) => void;
  onDelete: (todoId: string) => void;
}

// Color palette for smart icons based on todo content
function getIconColor(todoText: string): string {
  const lowerText = todoText.toLowerCase();
  
  // Work - Blue/Indigo
  if (lowerText.includes('work') || lowerText.includes('meeting') || lowerText.includes('project') || 
      lowerText.includes('deadline') || lowerText.includes('office')) {
    return '#6366f1'; // Indigo
  }
  // Shopping - Orange
  if (lowerText.includes('buy') || lowerText.includes('shopping') || lowerText.includes('order') || 
      lowerText.includes('grocery')) {
    return '#f97316'; // Orange
  }
  // Health - Red/Pink
  if (lowerText.includes('health') || lowerText.includes('doctor') || lowerText.includes('medicine') || 
      lowerText.includes('fitness') || lowerText.includes('gym') || lowerText.includes('workout')) {
    return '#ef4444'; // Red
  }
  // Finance - Green
  if (lowerText.includes('bill') || lowerText.includes('payment') || lowerText.includes('money') || 
      lowerText.includes('budget') || lowerText.includes('tax')) {
    return '#22c55e'; // Green
  }
  // Travel - Sky/Cyan
  if (lowerText.includes('travel') || lowerText.includes('trip') || lowerText.includes('flight') || 
      lowerText.includes('vacation')) {
    return '#0ea5e9'; // Sky
  }
  // Education - Purple
  if (lowerText.includes('study') || lowerText.includes('learn') || lowerText.includes('course') || 
      lowerText.includes('homework') || lowerText.includes('exam')) {
    return '#a855f7'; // Purple
  }
  // Tech - Slate
  if (lowerText.includes('code') || lowerText.includes('programming') || lowerText.includes('computer') || 
      lowerText.includes('server')) {
    return '#64748b'; // Slate
  }
  // Urgent - Amber
  if (lowerText.includes('urgent') || lowerText.includes('important') || lowerText.includes('asap')) {
    return '#eab308'; // Amber
  }
  
  return '#6366f1'; // Default indigo
}

const TodoItem: React.FC<TodoItemProps> = ({ todo, onToggle, onDelete }) => {
  // Get smart icon based on todo text content
  const SmartIcon: LucideIcon = getSmartIcon(todo.text);
  const iconColor = getIconColor(todo.text);

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
        {/* Smart Icon - sits beside checkbox */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: `${iconColor}15`,
            border: `1.5px solid ${iconColor}30`,
            flexShrink: 0,
            transition: 'all 0.2s ease',
          }}
          title="Smart category icon"
        >
          <SmartIcon size={18} color={iconColor} strokeWidth={2.5} />
        </div>

        {/* Custom Toggle Button - replaces checkbox */}
        <button
          onClick={() => onToggle(todo)}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '0.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            transition: 'all 0.2s ease',
            flexShrink: 0,
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'var(--hover-bg)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          aria-label={todo.completed ? 'Mark as incomplete' : 'Mark as complete'}
        >
          {todo.completed ? (
            <CheckCircle2 
              size={24} 
              color="#22c55e" 
              strokeWidth={2.5}
              style={{
                filter: 'drop-shadow(0 0 6px rgba(34, 197, 94, 0.4))',
              }}
            />
          ) : (
            <Circle 
              size={24} 
              color="var(--text-muted)" 
              strokeWidth={2}
              style={{
                transition: 'all 0.2s ease',
              }}
            />
          )}
        </button>

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

