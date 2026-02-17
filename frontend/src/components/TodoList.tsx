import React from 'react';
import type { Todo } from '../types';
import TodoItem from './TodoItem';

interface TodoListProps {
  todos: Todo[];
  onToggle: (todo: Todo) => void;
  onDelete: (todoId: string) => void;
}

const TodoList: React.FC<TodoListProps> = ({ todos, onToggle, onDelete }) => {
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
    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {todos.map((todo) => (
        <TodoItem
          key={todo._id}
          todo={todo}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
};

export default TodoList;

