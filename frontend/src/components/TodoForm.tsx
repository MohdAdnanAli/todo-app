import React, { useState } from 'react';

interface TodoFormProps {
  onAdd: (text: string) => void;
}

const TodoForm: React.FC<TodoFormProps> = ({ onAdd }) => {
  const [text, setText] = useState('');

  const inputStyle: React.CSSProperties = {
    width: '100%',
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
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onAdd(text.trim());
      setText('');
    }
  };

  return (
    <form 
      onSubmit={handleSubmit}
      style={{ 
        marginBottom: '2rem', 
        display: 'flex', 
        gap: '0.75rem',
        padding: '1.25rem',
        background: 'var(--bg-secondary)',
        borderRadius: '12px',
        border: '1px solid var(--border-secondary)',
      }}
    >
      <input
        type="text"
        placeholder="Add a new task..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{ ...inputStyle, flex: 1 }}
      />
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
        Add
      </button>
    </form>
  );
};

export default TodoForm;

