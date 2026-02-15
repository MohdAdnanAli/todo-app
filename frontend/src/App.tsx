import { useState, useEffect } from 'react';
import axios from 'axios';

interface Todo {
  _id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

// Message type for LED status
type MessageType = 
  | 'error' 
  | 'success' 
  | 'warning' 
  | 'info' 
  | 'loading' 
  | 'idle'
  | 'attention'
  | 'primary'
  | 'accent'
  | 'system'
  | 'personal'
  | 'pending';

// LED color configuration
const LED_COLORS: Record<MessageType, { bg: string; glow: string; border: string }> = {
  error:     { bg: '#ef4444', glow: 'rgba(239, 68, 68, 0.5)', border: '#fca5a5' },
  success:   { bg: '#22c55e', glow: 'rgba(34, 197, 94, 0.5)', border: '#86efac' },
  warning:   { bg: '#eab308', glow: 'rgba(234, 179, 8, 0.5)', border: '#fde047' },
  info:      { bg: '#3b82f6', glow: 'rgba(59, 130, 246, 0.5)', border: '#93c5fd' },
  loading:   { bg: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.5)', border: '#c4b5fd' },
  idle:      { bg: '#9ca3af', glow: 'rgba(156, 163, 175, 0.3)', border: '#d1d5db' },
  attention: { bg: '#f97316', glow: 'rgba(249, 115, 22, 0.5)', border: '#fdba74' },
  primary:   { bg: '#6366f1', glow: 'rgba(99, 102, 241, 0.5)', border: '#a5b4fc' },
  accent:    { bg: '#a855f7', glow: 'rgba(168, 85, 247, 0.5)', border: '#d8b4fe' },
  system:    { bg: '#06b6d4', glow: 'rgba(6, 182, 212, 0.5)', border: '#67e8f9' },
  personal:  { bg: '#ec4899', glow: 'rgba(236, 72, 153, 0.5)', border: '#f9a8d4' },
  pending:   { bg: '#f59e0b', glow: 'rgba(245, 158, 11, 0.5)', border: '#fcd34d' },
};

// Use environment variable
// In development, use localhost
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000');

function App() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<MessageType>('idle');
  const [showTooltip, setShowTooltip] = useState(false);
  const [user, setUser] = useState<{ email: string; displayName: string } | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodoText, setNewTodoText] = useState('');

  // Check auth status and fetch todos on mount or user change
  useEffect(() => {
    const checkAuthAndFetch = async (retries = 3) => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const res = await axios.get(`${API_URL}/api/me`, {
            withCredentials: true,
          });
          setUser(res.data.user || null);

          const todosRes = await axios.get(`${API_URL}/api/todos`, {
            withCredentials: true,
          });
          setTodos(todosRes.data);
          setMessage('Session active');
          setMessageType('attention');
          return;
        } catch (err: any) {
          console.warn(`Attempt ${attempt} failed:`, err.message);
          if (attempt === retries) {
            setMessage('Unable to connect to server. Please try again later.');
            setMessageType('system');
          } else {
            await new Promise(r => setTimeout(r, 3000 * attempt)); // backoff
          }
        }
      }
    };
    checkAuthAndFetch();
  }, []);

  const handleLogin = async () => {
    try {
      const response = await axios.post(
        `${API_URL}/api/auth/login`,
        { email, password },
        { withCredentials: true }
      );
      setUser(response.data.user);
      setMessage('Login successful');
      setMessageType('success');

      const todosRes = await axios.get(`${API_URL}/api/todos`, {
        withCredentials: true,
      });
      setTodos(todosRes.data);
    } catch (err: any) {
      setMessage('Error: ' + (err.response?.data?.error || err.message));
      setMessageType('error');
    }
  };

  const handleRegister = async () => {
    if (!displayName.trim()) {
      setMessage('Display name is required');
      setMessageType('warning');
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/api/auth/register`,
        { email, password, displayName },
        { withCredentials: true }
      );
      setUser(response.data.user);
      setMessage('Account created and logged in');
      setMessageType('success');
      
      const todosRes = await axios.get(`${API_URL}/api/todos`, {
        withCredentials: true,
      });
      setTodos(todosRes.data);
    } catch (err: any) {
      setMessage('Error: ' + (err.response?.data?.error || err.message));
      setMessageType('error');
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API_URL}/api/auth/logout`, {}, {
        withCredentials: true,
      });
      setMessage('Logged out successfully');
      setMessageType('info');
    } catch (err: any) {
      console.error('Logout failed:', err);
      setMessage('Logout failed, but session cleared locally');
      setMessageType('warning');
    }
  
    setUser(null);
    setTodos([]);
  };

  const handleAddTodo = async () => {
    if (!newTodoText.trim()) {
      setMessage('Task text is required');
      setMessageType('warning');
      return;
    }
  
    setMessage('Adding...');
    setMessageType('loading');
    try {
      const res = await axios.post(
        `${API_URL}/api/todos`,
        { text: newTodoText },
        { withCredentials: true }
      );
      setTodos([res.data, ...todos]);
      setNewTodoText('');
      setMessage('Todo added');
      setMessageType('primary');
    } catch (err: any) {
      setMessage('Error: ' + (err.response?.data?.error || err.message));
      setMessageType('error');
    }
  };

  const handleToggle = async (todo: Todo) => {
    try {
      const res = await axios.put(
        `${API_URL}/api/todos/${todo._id}`,
        { completed: !todo.completed },
        { withCredentials: true }
      );

      setTodos(todos.map(t =>
        t._id === todo._id ? res.data : t
      ));
      setMessage(todo.completed ? 'Task marked as pending' : 'Task completed');
      setMessageType(todo.completed ? 'pending' : 'success');
    } catch (err: any) {
      setMessage('Error updating todo: ' + (err.response?.data?.error || err.message));
      setMessageType('error');
    }
  };

  const handleDelete = async (todoId: string) => {
    if (!window.confirm('Delete this task?')) return;

    try {
      await axios.delete(`${API_URL}/api/todos/${todoId}`, {
        withCredentials: true,
      });

      setTodos(todos.filter(t => t._id !== todoId));
      setMessage('Todo deleted');
      setMessageType('accent');
    } catch (err: any) {
      setMessage('Error deleting todo: ' + (err.response?.data?.error || err.message));
      setMessageType('error');
    }
  };

  const containerStyle: React.CSSProperties = {
    background: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    padding: '2.5rem',
    maxWidth: '560px',
    width: '100%',
    margin: 'auto',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem 1rem',
    fontSize: '1rem',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    color: '#1f2937',
    transition: 'all 0.2s ease',
  };

  const passwordInputContainerStyle: React.CSSProperties = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  };

  const passwordToggleStyle: React.CSSProperties = {
    position: 'absolute',
    right: '0.75rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#6b7280',
    fontSize: '0.875rem',
    padding: '0.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const buttonPrimaryStyle: React.CSSProperties = {
    padding: '0.75rem 1.5rem',
    background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 500,
    fontSize: '0.95rem',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px rgba(79, 70, 229, 0.2)',
  };

  const buttonSecondaryStyle: React.CSSProperties = {
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

  const todoItemStyle: React.CSSProperties = {
    padding: '1rem',
    marginBottom: '0.75rem',
    background: '#f9fafb',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    transition: 'all 0.2s ease',
    border: '1px solid #f3f4f6',
  };

  const toggleActiveStyle: React.CSSProperties = {
    padding: '0.6rem 1.2rem',
    marginRight: '0.5rem',
    background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px 8px 0 0',
    cursor: 'pointer',
    fontWeight: 500,
    transition: 'all 0.2s ease',
  };

  const toggleInactiveStyle: React.CSSProperties = {
    padding: '0.6rem 1.2rem',
    marginRight: '0.5rem',
    background: '#f3f4f6',
    color: '#6b7280',
    border: 'none',
    borderRadius: '8px 8px 0 0',
    cursor: 'pointer',
    fontWeight: 500,
    transition: 'all 0.2s ease',
  };

  return (
    <div style={containerStyle}>
      <h1 style={{ 
        textAlign: 'center', 
        marginBottom: '2rem',
        background: 'linear-gradient(135deg, #4f46e5 0%, #8b5cf6 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}>Todo App</h1>

      {user ? (
        <div>
          <p style={{ 
            fontWeight: 600, 
            marginBottom: '1.5rem',
            color: '#374151',
            fontSize: '1.1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <span style={{ 
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
              color: 'white',
              fontSize: '0.875rem',
            }}>
              {(user.displayName || user.email.split('@')[0]).charAt(0).toUpperCase()}
            </span>
            Welcome, {user.displayName || user.email.split('@')[0]}!
          </p>

          {/* Add Todo Form */}
          <div style={{ 
            marginBottom: '2rem', 
            display: 'flex', 
            gap: '0.75rem',
            padding: '1.25rem',
            background: '#f9fafb',
            borderRadius: '12px',
            border: '1px solid #f3f4f6',
          }}>
            <input
              type="text"
              placeholder="Add a new task..."
              value={newTodoText}
              onChange={(e) => setNewTodoText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
              style={{ ...inputStyle, flex: 1 }}
            />
            <button
              onClick={handleAddTodo}
              style={buttonSecondaryStyle}
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
          </div>

          {/* Todo List */}
          {todos.length === 0 ? (
            <p style={{ 
              color: '#9ca3af', 
              textAlign: 'center',
              padding: '2rem',
              background: '#f9fafb',
              borderRadius: '12px',
              border: '2px dashed #e5e7eb',
            }}>
              No tasks yet. Add one above! ✨
            </p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {todos.map((todo) => (
                <li
                  key={todo._id}
                  style={todoItemStyle}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#f3f4f6';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.transform = 'translateX(2px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = '#f9fafb';
                    e.currentTarget.style.borderColor = '#f3f4f6';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => handleToggle(todo)}
                      style={{ marginRight: '1rem', cursor: 'pointer' }}
                    />
                    <span
                      style={{
                        flex: 1,
                        textDecoration: todo.completed ? 'line-through' : 'none',
                        color: todo.completed ? '#9ca3af' : '#374151',
                        fontSize: '0.95rem',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {todo.text}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDelete(todo._id)}
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
              ))}
            </ul>
          )}

          <button
            onClick={handleLogout}
            style={{
              ...buttonDangerStyle,
              marginTop: '2rem',
              width: '100%',
              padding: '0.875rem',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(239, 68, 68, 0.3)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(239, 68, 68, 0.2)';
            }}
          >
            Logout
          </button>
        </div>
      ) : (
        <div style={{ padding: '0.5rem' }}>
          <div style={{ 
            marginBottom: '1.5rem', 
            display: 'flex', 
            gap: '0',
            borderBottom: '2px solid #f3f4f6',
          }}>
            <button
              onClick={() => setMode('login')}
              style={mode === 'login' ? toggleActiveStyle : toggleInactiveStyle}
              onMouseOver={(e) => {
                if (mode !== 'login') {
                  e.currentTarget.style.background = '#e5e7eb';
                }
              }}
              onMouseOut={(e) => {
                if (mode !== 'login') {
                  e.currentTarget.style.background = '#f3f4f6';
                }
              }}
            >
              Login
            </button>
            <button
              onClick={() => setMode('register')}
              style={mode === 'register' ? toggleActiveStyle : toggleInactiveStyle}
              onMouseOver={(e) => {
                if (mode !== 'register') {
                  e.currentTarget.style.background = '#e5e7eb';
                }
              }}
              onMouseOut={(e) => {
                if (mode !== 'register') {
                  e.currentTarget.style.background = '#f3f4f6';
                }
              }}
            >
              Register
            </button>
          </div>

          <div style={{ 
            padding: '1.5rem', 
            background: '#f9fafb', 
            borderRadius: '12px',
            border: '1px solid #f3f4f6',
          }}>
            {mode === 'login' ? (
              <>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: 500, fontSize: '0.875rem' }}>Email</label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: 500, fontSize: '0.875rem' }}>Password</label>
                  <div style={passwordInputContainerStyle}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{ ...inputStyle, paddingRight: '2.5rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={passwordToggleStyle}
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleLogin}
                  style={{ ...buttonPrimaryStyle, width: '100%' }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(79, 70, 229, 0.3)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(79, 70, 229, 0.2)';
                  }}
                >
                  Login
                </button>
              </>
            ) : (
              <>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: 500, fontSize: '0.875rem' }}>Display Name</label>
                  <input
                    type="text"
                    placeholder="Choose a display name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: 500, fontSize: '0.875rem' }}>Email</label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: 500, fontSize: '0.875rem' }}>Password</label>
                  <div style={passwordInputContainerStyle}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{ ...inputStyle, paddingRight: '2.5rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={passwordToggleStyle}
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleRegister}
                  style={{ ...buttonSecondaryStyle, width: '100%' }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.3)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(16, 185, 129, 0.2)';
                  }}
                >
                  Create Account
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* LED Status Indicator with Hover Tooltip */}
      <div style={{ position: 'relative', marginBottom: '1rem' }}>
        <div
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 500 }}>
            Status:
          </span>
          <div
            style={{
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              backgroundColor: LED_COLORS[messageType].bg,
              boxShadow: `0 0 8px ${LED_COLORS[messageType].glow}, 0 0 4px ${LED_COLORS[messageType].bg}`,
              border: `2px solid ${LED_COLORS[messageType].border}`,
              transition: 'all 0.3s ease',
            }}
          />
          <span style={{ 
            fontSize: '0.75rem', 
            color: LED_COLORS[messageType].bg,
            fontWeight: 600,
            textTransform: 'capitalize',
          }}>
            {messageType}
          </span>
        </div>
        
        {/* Tooltip with full message */}
        {showTooltip && message && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              marginTop: '0.5rem',
              padding: '0.5rem 0.75rem',
              backgroundColor: '#1f2937',
              color: '#ffffff',
              borderRadius: '6px',
              fontSize: '0.75rem',
              whiteSpace: 'nowrap',
              zIndex: 100,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              border: `1px solid ${LED_COLORS[messageType].border}`,
            }}
          >
            {message}
            <div
              style={{
                position: 'absolute',
                top: '-5px',
                left: '50%',
                transform: 'translateX(-50%) rotate(45deg)',
                width: '10px',
                height: '10px',
                backgroundColor: '#1f2937',
                borderLeft: `1px solid ${LED_COLORS[messageType].border}`,
                borderTop: `1px solid ${LED_COLORS[messageType].border}`,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

