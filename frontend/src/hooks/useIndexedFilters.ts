import { useMemo } from 'react';
import type { Todo } from '../types';

export function useIndexedFilters(todos: Todo[]) {
  const indexes = useMemo(() => {
    const byCategory = new Map<string, Todo[]>();
    const byPriority = new Map<string, Todo[]>();
    
    todos.forEach(todo => {
      // Category index
      if (!byCategory.has(todo.category)) {
        byCategory.set(todo.category, []);
      }
      byCategory.get(todo.category)!.push(todo);
      
      // Priority index
      if (!byPriority.has(todo.priority)) {
        byPriority.set(todo.priority, []);
      }
      byPriority.get(todo.priority)!.push(todo);
    });
    
    return { byCategory, byPriority };
  }, [todos]);
  
  return indexes;
}

export default useIndexedFilters;

