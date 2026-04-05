import React from 'react';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import type { Todo } from '../types';
import { TodoItemCore } from './TodoItem';

interface VirtualTodoListProps {
  todos: Todo[];
  onToggle: (todo: Todo) => void;
  onDelete: (todoId: string) => void;
  height?: number;
  itemHeight?: number;
}

const VirtualTodoList: React.FC<VirtualTodoListProps> = ({
  todos,
  onToggle,
  onDelete,
  height = 400,
  itemHeight = 80,
}) => {
  const Row = React.useCallback(({ index, style }: ListChildComponentProps) => {
    const todo = todos[index];
    return (
      <div 
        style={{ 
          ...style, 
          transition: 'transform 0.2s ease-out, opacity 0.2s ease-out',
          willChange: 'transform, opacity'
        }}
      >
        <TodoItemCore
          todo={todo}
          onToggle={() => onToggle(todo)}
          onDelete={() => onDelete(todo._id)}
        />
      </div>
    );
  }, [todos, onToggle, onDelete]);

  if (todos.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-[var(--text-muted)] border-2 border-dashed border-[var(--border-primary)] rounded-xl bg-[var(--bg-secondary)] shadow-sm">
        No tasks yet ✨
      </div>
    );
  }

  return (
    <List
      height={height}
      itemCount={todos.length}
      itemSize={itemHeight}
      width="100%"
      className="border border-[var(--border-secondary)] rounded-xl shadow-sm"
    >
      {Row}
    </List>
  );
};

export default VirtualTodoList;

