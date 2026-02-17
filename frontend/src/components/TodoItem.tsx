import React from 'react';
import type { Todo } from '../types';

interface TodoItemProps {
  todo: Todo;
  onToggle: (todo: Todo) => void;
  onDelete: (todoId: string) => void;
}

const TodoItem: React.FC<TodoItemProps> = ({ todo, onToggle, onDelete }) => {
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
      <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={() => onToggle(todo)}
          style={{ marginRight: '1rem', cursor: 'pointer' }}
        />
        <span
          style={{
            flex: 1,
            textDecoration: todo.completed ? 'line-through' : 'none',
            color: todo.completed ? 'var(--text-muted)' : 'var(--text-primary)',
            fontSize: '0.95rem',
            transition: 'all 0.2s ease',
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
        Delete
      </button>
    </li>
  );
};

export default TodoItem;

