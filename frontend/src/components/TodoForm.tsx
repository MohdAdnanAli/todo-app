import React, { useState } from 'react';
import { X, Plus, Tag } from 'lucide-react';
import type { TodoCategory, TodoPriority, MessageType } from '../types';

interface TodoFormProps {
  onAdd: (text: string, category?: TodoCategory, priority?: TodoPriority, tags?: string[]) => void;
}

const CATEGORIES: { value: TodoCategory; label: string; color: string }[] = [
  { value: 'work', label: 'Work', color: '#6366f1' },
  { value: 'personal', label: 'Personal', color: '#ec4899' },
  { value: 'shopping', label: 'Shopping', color: '#f97316' },
  { value: 'health', label: 'Health', color: '#22c55e' },
  { value: 'other', label: 'Other', color: '#9ca3af' },
];

const PRIORITIES: { value: TodoPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: '#9ca3af' },
  { value: 'medium', label: 'Medium', color: '#eab308' },
  { value: 'high', label: 'High', color: '#ef4444' },
];

const TodoForm: React.FC<TodoFormProps> = ({ onAdd }) => {
  const [text, setText] = useState('');
  const [category, setCategory] = useState<TodoCategory>('personal');
  const [priority, setPriority] = useState<TodoPriority>('medium');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [showOptions, setShowOptions] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onAdd(text.trim(), category, priority, tags);
      setText('');
      setCategory('personal');
      setPriority('medium');
      setTags([]);
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

  const inputStyle: React.CSSProperties = {
    flex: 1,
    padding: '0.75rem 1rem',
    fontSize: '1rem',
    border: '1px solid var(--border-primary)',
    borderRadius: '8px',
    backgroundColor: 'var(--input-bg)',
    color: 'var(--text-primary)',
    transition: 'all 0.2s ease',
  };

  const buttonStyle: React.CSSProperties = {
    padding: '0.75rem 1.5rem',
    background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 500,
    fontSize: '0.95rem',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  };

  const optionButtonStyle = (isActive: boolean, color: string): React.CSSProperties => ({
    padding: '0.4rem 0.75rem',
    fontSize: '0.75rem',
    border: `1.5px solid ${isActive ? color : 'var(--border-secondary)'}`,
    background: isActive ? `${color}20` : 'transparent',
    color: isActive ? color : 'var(--text-secondary)',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 500,
    transition: 'all 0.2s ease',
  });

  const toggleStyle: React.CSSProperties = {
    padding: '0.5rem',
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border-secondary)',
    borderRadius: '8px',
    cursor: 'pointer',
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  };

  const tagStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.2rem 0.5rem',
    background: 'var(--accent-gradient)',
    color: 'white',
    borderRadius: '4px',
    fontSize: '0.7rem',
    fontWeight: 500,
  };

  return (
    <form 
      onSubmit={handleSubmit}
      style={{ 
        marginBottom: '2rem', 
        display: 'flex', 
        flexDirection: 'column',
        gap: '0.75rem',
        padding: '1.25rem',
        background: 'var(--bg-secondary)',
        borderRadius: '12px',
        border: '1px solid var(--border-secondary)',
      }}
    >
      {/* Main input row */}
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <input
          type="text"
          placeholder="Add a new task..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={inputStyle}
        />
        <button
          type="button"
          onClick={() => setShowOptions(!showOptions)}
          style={toggleStyle}
          title="Task options"
        >
          ⚙️
        </button>
        <button
          type="submit"
          style={buttonStyle}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.3)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(16, 185, 129, 0.2)';
          }}
        >
          <Plus size={18} />
          Add
        </button>
      </div>

      {/* Options panel */}
      {showOptions && (
        <div style={{ 
          padding: '1rem', 
          background: 'var(--bg-tertiary)', 
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}>
          {/* Category selection */}
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 500 }}>
              Category
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  style={optionButtonStyle(category === cat.value, cat.color)}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Priority selection */}
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 500 }}>
              Priority
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {PRIORITIES.map(pri => (
                <button
                  key={pri.value}
                  type="button"
                  onClick={() => setPriority(pri.value)}
                  style={optionButtonStyle(priority === pri.value, pri.color)}
                >
                  {pri.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tags input */}
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 500 }}>
              Tags (press Enter to add, max 5)
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
              {tags.map(tag => (
                <span key={tag} style={tagStyle}>
                  <Tag size={10} />
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'white',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      marginLeft: '0.25rem',
                    }}
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
                  style={{
                    ...inputStyle,
                    flex: '0 0 100px',
                    padding: '0.4rem 0.5rem',
                    fontSize: '0.8rem',
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

export default TodoForm;

