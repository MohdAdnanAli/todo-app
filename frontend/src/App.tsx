import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useTheme } from './theme';
import type { Todo, User, MessageType } from './types';
import { API_URL } from './types';
import { encrypt, decrypt } from './utils/crypto';
import { 
  AuthForm, 
  LEDIndicator, 
  MessageBanner, 
  ThemeSelector, 
  TodoForm, 
  TodoList 
} from './components';

function App() {
  useTheme(); // Initialize theme context
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<MessageType>('idle');
  const [user, setUser] = useState<User | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  
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
          
          // If we get here, user is authenticated
          setUser(res.data.user || null);
          
          // Store encryption salt for session restoration
          if (res.data.encryptionSalt) {
            setEncryptionSalt(res.data.encryptionSalt);
          }

          const todosRes = await axios.get(`${API_URL}/api/todos`, {
            withCredentials: true,
          });
          
          // For session restore, we don't have the password, so store encrypted todos
          // User will need to re-login to decrypt
          setTodos(todosRes.data);
          setMessage('Session active - please login to decrypt todos');
          setMessageType('attention');
          setIsLoading(false);
          return;
        } catch (err: any) {
          const status = err.response?.status;
          
          // 401 means user is not authenticated - show login page immediately
          if (status === 401) {
            setUser(null);
            setTodos([]);
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
  }, []);

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
      setMessage('Error: ' + (err.response?.data?.error || err.message));
      setMessageType('error');
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
      setMessage('Account created and logged in');
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

  const handleAddTodo = async (text: string) => {
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
      
      const res = await axios.post(
        `${API_URL}/api/todos`,
        { text: encryptedText },
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
        <div style={{
          fontSize: '2rem',
          marginBottom: '1rem',
        }}>⏳</div>
        <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
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
        
        {/* LED Status Indicator */}
        <LEDIndicator message={message} messageType={messageType} />
      </div>

      {/* Message Banner - displays messages prominently */}
      <MessageBanner 
        message={message} 
        messageType={messageType} 
        onClose={() => {
          setMessage('');
          setMessageType('idle');
        }}
      />

      {user ? (
        <div>
          <p style={{ 
            fontWeight: 600, 
            marginBottom: '1.5rem',
            color: 'var(--text-primary)',
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
              background: 'var(--accent-gradient)',
              color: 'white',
              fontSize: '0.875rem',
            }}>
              {(user.displayName || user.email.split('@')[0]).charAt(0).toUpperCase()}
            </span>
            Welcome, {user.displayName || user.email.split('@')[0]}!
          </p>

          {/* Add Todo Form */}
          <TodoForm onAdd={handleAddTodo} />

          {/* Todo List */}
          <TodoList 
            todos={todos} 
            onToggle={handleToggle} 
            onDelete={handleDelete} 
          />

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
        <AuthForm 
          onLogin={handleLogin} 
          onRegister={handleRegister} 
        />
      )}
    </div>
  );
}

export default App;

