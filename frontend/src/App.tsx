import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useTheme } from './theme';
import type { Todo, User, MessageType, TodoCategory, TodoPriority } from './types';
import { API_URL } from './types';
import { encrypt, decrypt } from './utils/crypto';
import { 
  AuthForm, 
  LEDIndicator, 
  ProfileModal,
  ThemeSelector, 
  TodoForm, 
  TodoList 
} from './components';

// Cool geometry loading animation component
const GeometryLoader: React.FC = () => {
  return (
    <div style={{
      position: 'relative',
      width: '120px',
      height: '120px',
      margin: '0 auto 2rem',
    }}>
      {/* Rotating outer ring */}
      <div style={{
        position: 'absolute',
        inset: 0,
        border: '3px solid transparent',
        borderTopColor: '#818cf8',
        borderRadius: '50%',
        animation: 'spin 1.5s linear infinite',
      }} />
      
      {/* Counter-rotating middle ring */}
      <div style={{
        position: 'absolute',
        inset: '12px',
        border: '3px solid transparent',
        borderBottomColor: '#f43f5e',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite reverse',
      }} />
      
      {/* Inner pulsing circle */}
      <div style={{
        position: 'absolute',
        inset: '28px',
        background: 'linear-gradient(135deg, #818cf8 0%, #f43f5e 100%)',
        borderRadius: '50%',
        animation: 'pulse 1.2s ease-in-out infinite',
      }} />
      
      {/* Floating geometric shapes */}
      <div style={{
        position: 'absolute',
        top: '0',
        left: '50%',
        width: '8px',
        height: '8px',
        background: '#fb923c',
        borderRadius: '2px',
        transform: 'translateX(-50%)',
        animation: 'float 2s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10px',
        right: '10px',
        width: '0',
        height: '0',
        borderLeft: '6px solid transparent',
        borderRight: '6px solid transparent',
        borderBottom: '10px solid #34d399',
        animation: 'float 2.5s ease-in-out infinite 0.5s',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '15px',
        left: '10px',
        width: '10px',
        height: '10px',
        background: 'transparent',
        border: '2px solid #c084fc',
        borderRadius: '50%',
        animation: 'float 1.8s ease-in-out infinite 1s',
      }} />
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(0.85); opacity: 0.7; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(180deg); }
        }
      `}</style>
    </div>
  );
};

function App() {
  useTheme(); // Initialize theme context
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<MessageType>('idle');
  const [user, setUser] = useState<User | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  
  // Profile modal state
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  // Encryption state - stored in memory for session
  const [encryptionSalt, setEncryptionSalt] = useState<string>('');
  const [userPassword, setUserPassword] = useState<string>('');

  // Helper to decrypt a single todo
  const decryptTodo = useCallback(async (todo: Todo): Promise<Todo> => {
    if (!userPassword || !encryptionSalt) return todo;
    try {
      const decryptedText = await decrypt(todo.text, userPassword, encryptionSalt);
      return { ...todo, text: decryptedText };
    } catch (err) {
      console.error('Failed to decrypt todo:', err);
      return todo; // Return original if decryption fails
    }
  }, [userPassword, encryptionSalt]);

  // Helper to decrypt all todos
  const decryptAllTodos = useCallback(async (todosToDecrypt: Todo[]): Promise<Todo[]> => {
    if (!userPassword || !encryptionSalt) return todosToDecrypt;
    return Promise.all(todosToDecrypt.map(decryptTodo));
  }, [userPassword, encryptionSalt]);

  // Check auth status and fetch todos on mount or user change
  useEffect(() => {
    const checkAuthAndFetch = async (retries = 3) => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const res = await axios.get(`${API_URL}/api/me`, {
            withCredentials: true,
          });
          
          // If we get here, user is authenticated with valid session cookie
          setUser(res.data.user || null);
          
          // Store encryption salt for session restoration
          if (res.data.encryptionSalt) {
            setEncryptionSalt(res.data.encryptionSalt);
          }

          // Check if user has password in memory (logged in with credentials)
          // If no password, user needs to login to decrypt - show encrypted todos
          if (!userPassword) {
            // Fetch todos but DON'T decrypt - show encrypted with message
            const todosRes = await axios.get(`${API_URL}/api/todos`, {
              withCredentials: true,
            });
            setTodos(todosRes.data); // These are encrypted
            setMessage('Session active - please login to decrypt todos');
            setMessageType('attention');
          } else {
            // User has password in memory (page refresh during active session)
            // Decrypt the todos
            const todosRes = await axios.get(`${API_URL}/api/todos`, {
              withCredentials: true,
            });
            const decryptedTodos = await decryptAllTodos(todosRes.data);
            setTodos(decryptedTodos);
            setMessage('Welcome back!');
            setMessageType('success');
          }
          
          setIsLoading(false);
          return;
        } catch (err: any) {
          const status = err.response?.status;
          
          // 401 means user is not authenticated - show login page immediately
          if (status === 401) {
            setUser(null);
            setTodos([]); // Clear all todos - they are encrypted server-side
            setEncryptionSalt('');
            setUserPassword('');
            setMessage('');
            setMessageType('idle');
            setIsLoading(false);
            return;
          }
          
          // For other errors (network issues), retry with backoff
          console.warn(`Attempt ${attempt} failed:`, err.message);
          if (attempt === retries) {
            setMessage('Unable to connect to server. Please try again later.');
            setMessageType('system');
            setIsLoading(false);
          } else {
            await new Promise(r => setTimeout(r, 1000 * attempt));
          }
        }
      }
    };
    checkAuthAndFetch();
  }, [userPassword, decryptAllTodos]);

  const handleLogin = async (loginEmail: string, loginPassword: string) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/auth/login`,
        { email: loginEmail, password: loginPassword },
        { withCredentials: true }
      );
      setUser(response.data.user);
      setEncryptionSalt(response.data.encryptionSalt || '');
      setUserPassword(loginPassword);
      setMessage('Login successful');
      setMessageType('success');

      const todosRes = await axios.get(`${API_URL}/api/todos`, {
        withCredentials: true,
      });
      // Decrypt todos after receiving
      const decryptedTodos = await decryptAllTodos(todosRes.data);
      setTodos(decryptedTodos);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message;
      
      // Check for account lockout
      if (errorMsg.toLowerCase().includes('locked')) {
        setMessage('Account temporarily locked. Too many failed attempts. Try again in 15 minutes.');
        setMessageType('error');
      } else {
        setMessage('Error: ' + errorMsg);
        setMessageType('error');
      }
    }
  };

  const handleRegister = async (regEmail: string, regPassword: string, regDisplayName: string) => {
    if (!regDisplayName.trim()) {
      setMessage('Display name is required');
      setMessageType('warning');
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/api/auth/register`,
        { email: regEmail, password: regPassword, displayName: regDisplayName },
        { withCredentials: true }
      );
      setUser(response.data.user);
      setEncryptionSalt(response.data.encryptionSalt || '');
      setUserPassword(regPassword);
      setMessage('Account created and logged in! Please check your email to verify your account.');
      setMessageType('success');
      
      const todosRes = await axios.get(`${API_URL}/api/todos`, {
        withCredentials: true,
      });
      const decryptedTodos = await decryptAllTodos(todosRes.data);
      setTodos(decryptedTodos);
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
    setEncryptionSalt('');
    setUserPassword('');
  };

  const handleProfileUpdate = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const handleDeleteAccount = () => {
    // Clear all state and redirect to login
    setUser(null);
    setTodos([]);
    setEncryptionSalt('');
    setUserPassword('');
    setShowProfileModal(false);
    setMessage('');
    setMessageType('idle');
  };

  const handleAddTodo = async (text: string, category?: TodoCategory, priority?: TodoPriority, tags?: string[]) => {
    if (!text.trim()) {
      setMessage('Task text is required');
      setMessageType('warning');
      return;
    }
  
    setMessage('Adding...');
    setMessageType('loading');
    try {
      // Encrypt the todo text before sending
      const encryptedText = await encrypt(text, userPassword, encryptionSalt);
      
      const todoData: Partial<Todo> = { text: encryptedText };
      if (category) todoData.category = category;
      if (priority) todoData.priority = priority;
      if (tags && tags.length > 0) todoData.tags = tags;
      
      const res = await axios.post(
        `${API_URL}/api/todos`,
        todoData,
        { withCredentials: true }
      );
      // Decrypt the returned todo and add to list
      const decryptedTodo = await decryptTodo(res.data);
      setTodos([decryptedTodo, ...todos]);
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

      // Decrypt the returned todo before updating state
      const decryptedTodo = await decryptTodo(res.data);
      setTodos(todos.map(t =>
        t._id === todo._id ? decryptedTodo : t
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

  // Dynamic styles using CSS variables
  const containerStyle: React.CSSProperties = {
    background: 'var(--bg-primary)',
    borderRadius: '16px',
    boxShadow: 'var(--shadow)',
    padding: '2.5rem',
    maxWidth: '560px',
    width: '100%',
    margin: 'auto',
    position: 'relative',
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

  const buttonPrimaryStyle: React.CSSProperties = {
    padding: '0.5rem 1rem',
    background: 'var(--accent-gradient)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 500,
    fontSize: '0.875rem',
    transition: 'all 0.2s ease',
    boxShadow: 'var(--glow)',
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div style={{
        background: 'var(--bg-primary)',
        borderRadius: '16px',
        boxShadow: 'var(--shadow)',
        padding: '3rem',
        maxWidth: '560px',
        width: '100%',
        margin: 'auto',
        textAlign: 'center',
      }}>
        <GeometryLoader />
        <p style={{ 
          color: 'var(--text-secondary)',
          fontSize: '0.95rem',
          marginTop: '1rem'
        }}>Preparing your workspace...</p>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <ThemeSelector />
      
      {/* Header with LED Status Indicator */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        marginBottom: '2rem',
        position: 'relative',
      }}>
        <h1 style={{ 
          textAlign: 'center',
          background: 'var(--accent-gradient)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          margin: 0,
        }}>Todo App</h1>
        
        {/* LED Status Indicator - shows messages for 2.5s then returns to idle tooltip */}
        <LEDIndicator message={message} messageType={messageType} />
      </div>

      {user ? (
        <div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: '1.5rem',
          }}>
            <p style={{ 
              fontWeight: 600, 
              color: 'var(--text-primary)',
              fontSize: '1.1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              margin: 0,
            }}>
              <span style={{ 
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--accent-gradient)',
                color: 'white',
                fontSize: '0.875rem',
              }}>
                {(user.displayName || user.email.split('@')[0]).charAt(0).toUpperCase()}
              </span>
              Welcome, {user.displayName || user.email.split('@')[0]}!
            </p>
            
            {/* Profile Button */}
            <button
              onClick={() => setShowProfileModal(true)}
              style={buttonPrimaryStyle}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 8px var(--glow)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--glow)';
              }}
            >
              ⚙️ Profile
            </button>
          </div>

          {/* Add Todo Form */}
          <TodoForm onAdd={handleAddTodo} />

          {/* Todo List */}
          <TodoList 
            todos={todos} 
            onToggle={handleToggle} 
            onDelete={handleDelete} 
          />

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem' }}>
            <button
              onClick={handleLogout}
              style={{
                ...buttonDangerStyle,
                flex: 1,
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
        </div>
      ) : (
        <AuthForm 
          onLogin={handleLogin} 
          onRegister={handleRegister} 
        />
      )}
      
      {/* Profile Modal */}
      {user && (
        <ProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          user={user}
          onProfileUpdate={handleProfileUpdate}
          onDeleteAccount={handleDeleteAccount}
          onMessage={(msg, type) => {
            setMessage(msg);
            setMessageType(type);
          }}
        />
      )}
    </div>
  );
}

export default App;

