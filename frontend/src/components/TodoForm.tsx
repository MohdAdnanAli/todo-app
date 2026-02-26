import React, { useState, memo } from 'react';
import { X, Plus, Tag } from 'lucide-react';
import type { TodoCategory, TodoPriority } from '../types';

interface TodoFormProps {
  onAdd: (text: string, category?: TodoCategory, priority?: TodoPriority, tags?: string[], dueDate?: string) => void;
}

const CATEGORIES: { value: TodoCategory; label: string; color: string }[] = [
  { value: 'work', label: 'Work', color: '#818cf8' },
  { value: 'personal', label: 'Personal', color: '#f43f5e' },
  { value: 'shopping', label: 'Shopping', color: '#fb923c' },
  { value: 'health', label: 'Health', color: '#34d399' },
  { value: 'other', label: 'Other', color: '#94a3b8' },
];

const PRIORITIES: { value: TodoPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: '#9ca3af' },
  { value: 'medium', label: 'Medium', color: '#eab308' },
  { value: 'high', label: 'High', color: '#ef4444' },
];

const TodoForm: React.FC<TodoFormProps> = memo(({ onAdd }) => {
  const [text, setText] = useState('');
  const [category, setCategory] = useState<TodoCategory>('personal');
  const [priority, setPriority] = useState<TodoPriority>('medium');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [showOptions, setShowOptions] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onAdd(text.trim(), category, priority, tags, dueDate || undefined);
      setText('');
      setCategory('personal');
      setPriority('medium');
      setTags([]);
      setDueDate('');
      setShowOptions(false);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (!tags.includes(newTag) && tags.length < 5) {
        setTags([...tags, newTag]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className="mb-8 flex flex-col gap-3 p-5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-secondary)]"
    >
      {/* Main input row - wraps on small screens */}
      <div className="flex flex-wrap sm:flex-nowrap gap-2 sm:gap-3">
        <input
          type="text"
          placeholder="Add a new task..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 min-w-full sm:min-w-0 px-4 py-3 text-base rounded-lg border border-[var(--border-primary)] 
            bg-[var(--input-bg)] text-[var(--text-primary)] transition-all duration-200
            focus:outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--glow)]"
        />
        <button
          type="button"
          onClick={() => setShowOptions(!showOptions)}
          className="flex-1 sm:flex-initial p-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] 
            cursor-pointer text-[var(--text-secondary)] flex items-center justify-center 
            hover:bg-[var(--hover-bg)] transition-all duration-200"
          title="Task options"
        >
          ⚙️
        </button>
        <button
          type="submit"
          className="flex-1 sm:flex-initial px-6 py-3 rounded-lg font-medium text-base flex items-center justify-center gap-2
            bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md
            hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
          style={{ boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)' }}
        >
          <Plus size={18} />
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Options panel */}
      {showOptions && (
        <div className="p-4 bg-[var(--bg-tertiary)] rounded-lg flex flex-col gap-4 animate-fade-in">
          {/* Category selection */}
          <div>
            <div className="text-xs font-medium text-[var(--text-secondary)] mb-2">Category</div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 border
                    ${category === cat.value
                      ? 'border-2'
                      : 'border border-[var(--border-secondary)]'
                    }`}
                  style={{
                    background: category === cat.value ? `${cat.color}20` : 'transparent',
                    borderColor: category === cat.value ? cat.color : undefined,
                    color: category === cat.color ? cat.color : 'var(--text-secondary)',
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Priority selection */}
          <div>
            <div className="text-xs font-medium text-[var(--text-secondary)] mb-2">Priority</div>
            <div className="flex flex-wrap gap-2">
              {PRIORITIES.map(pri => (
                <button
                  key={pri.value}
                  type="button"
                  onClick={() => setPriority(pri.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 border
                    ${priority === pri.value
                      ? 'border-2'
                      : 'border border-[var(--border-secondary)]'
                    }`}
                  style={{
                    background: priority === pri.value ? `${pri.color}20` : 'transparent',
                    borderColor: priority === pri.value ? pri.color : undefined,
                    color: priority === pri.value ? pri.color : 'var(--text-secondary)',
                  }}
                >
                  {pri.label}
                </button>
              ))}
            </div>
          </div>

          {/* Due Date */}
          <div>
            <div className="text-xs font-medium text-[var(--text-secondary)] mb-2">Due Date (Optional)</div>
            <div className="flex gap-2">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={getTodayDate()}
                className="flex-1 px-3 py-2 text-xs rounded-md border border-[var(--border-primary)] 
                  bg-[var(--input-bg)] text-[var(--text-primary)] transition-all duration-200
                  focus:outline-none focus:border-[var(--accent-primary)]"
              />
              {dueDate && (
                <button
                  type="button"
                  onClick={() => setDueDate('')}
                  className="px-2 py-1 text-xs rounded-md bg-[var(--hover-bg)] border border-[var(--border-secondary)] 
                    text-[var(--text-secondary)] hover:bg-red-500/20 transition-all"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Tags input */}
          <div>
            <div className="text-xs font-medium text-[var(--text-secondary)] mb-2">
              Tags (press Enter to add, max 5)
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              {tags.map(tag => (
                <span 
                  key={tag} 
                  className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-white"
                  style={{ background: 'var(--accent-gradient)' }}
                >
                  <Tag size={10} />
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="bg-transparent border-none text-white cursor-pointer p-0 ml-0.5 flex"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              {tags.length < 5 && (
                <input
                  type="text"
                  placeholder="Add tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  className="flex-shrink-0 w-24 px-2 py-1.5 text-xs rounded-md border border-[var(--border-primary)] 
                    bg-[var(--input-bg)] text-[var(--text-primary)] transition-all duration-200
                    focus:outline-none focus:border-[var(--accent-primary)]"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </form>
  );
});

TodoForm.displayName = 'TodoForm';

export default TodoForm;
