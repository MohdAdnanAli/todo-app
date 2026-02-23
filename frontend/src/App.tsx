import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useTheme } from './theme';
import type { Todo, User, MessageType, TodoCategory, TodoPriority } from './types';
import { API_URL } from './types';
import { encrypt, decrypt } from './utils/crypto';
import { 
  AuthForm, 
  // Footer,
  LEDIndicator, 
  ProfileModal,
  ThemeSelector, 
  TodoForm, 
  TodoList,
  GeometryLoader
} from './components';

function App() {
  useTheme();
  
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<MessageType>('idle');
  const [user, setUser] = useState<User | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [encryptionSalt, setEncryptionSalt] = useState<string>('');
  const [userPassword, setUserPassword] = useState<string>('');

  const decryptTodo = useCallback(async (todo: Todo): Promise<Todo> => {
    // Skip decryption if password or salt not available
    if (!userPassword || !encryptionSalt) return todo;
    try {
      const decryptedText = await decrypt(todo.text, userPassword, encryptionSalt);
      return { ...todo, text: decryptedText };
    } catch (err) {
      // Silently return original todo on decryption failure (e.g., already decrypted or invalid format)
      return todo;
    }
  }, [userPassword, encryptionSalt]);

  const decryptAllTodos = useCallback(async (todosToDecrypt: Todo[]): Promise<Todo[]> => {
    // Only decrypt if user has provided their password
    if (!userPassword || !encryptionSalt || todosToDecrypt.length === 0) return todosToDecrypt;
    return Promise.all(todosToDecrypt.map(decryptTodo));
  }, [userPassword, encryptionSalt]);

  useEffect(() => {
    const checkAuthAndFetch = async (retries = 3) => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const res = await axios.get(`${API_URL}/api/me`, {
            withCredentials: true,
          });
          
          setUser(res.data.user || null);
          
          if (res.data.encryptionSalt) {
            setEncryptionSalt(res.data.encryptionSalt);
          }

          if (!userPassword) {
            const todosRes = await axios.get(`${API_URL}/api/todos`, {
              withCredentials: true,
            });
            // Don't try to decrypt - just store encrypted todos
            setTodos(todosRes.data);
            setMessage('Session active - please login to decrypt todos');
            setMessageType('attention');
          } else {
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
      const decryptedTodos = await decryptAllTodos(todosRes.data);
      setTodos(decryptedTodos);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message;
      
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

  if (isLoading) {
    return (
      <div 
        className="rounded-2xl sm:p-12 p-6 max-w-[560px] w-full mx-auto text-center"
        style={{ 
          background: 'var(--bg-primary)', 
          boxShadow: 'var(--shadow)' 
        }}
      >
        <div className="max-w-[120px] mx-auto mb-4 sm:mb-6">
          <GeometryLoader />
        </div>
        <p className="text-[var(--text-secondary)] text-base mt-2">Preparing your workspace...</p>
      </div>
    );
  }

  return (
    <div 
      className="rounded-2xl sm:p-[2.5rem] p-4 max-w-[560px] w-full mx-auto relative"
      style={{ 
        background: 'var(--bg-primary)', 
        boxShadow: 'var(--shadow)' 
      }}
    >
      <ThemeSelector />
      
      {/* Header with LED Status Indicator */}
      <div className="flex items-center justify-center mb-[2rem] relative">
        <h1 className="text-center bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent text-[2rem] font-semibold m-0">
          Todo App
        </h1>
        <LEDIndicator message={message} messageType={messageType} />
      </div>

      {user ? (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-[1.5rem]">
            <p className="font-semibold text-lg text-[var(--text-primary)] flex items-center gap-2 m-0">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm">
                {(user.displayName || user.email.split('@')[0]).charAt(0).toUpperCase()}
              </span>
              <span className="whitespace-nowrap">
                Welcome, {user.displayName || user.email.split('@')[0]}!
              </span>
            </p>
            
            <button
              onClick={() => setShowProfileModal(true)}
              className="px-4 py-2 rounded-lg font-medium text-sm bg-gradient-to-r from-indigo-500 to-purple-500 text-white 
                shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 whitespace-nowrap"
              style={{ boxShadow: 'var(--glow)' }}
            >
              ⚙️ Profile
            </button>
          </div>

          <TodoForm onAdd={handleAddTodo} />

          <TodoList 
            todos={todos} 
            onToggle={handleToggle} 
            onDelete={handleDelete} 
          />

          <div className="flex gap-3 mt-[2rem]">
            <button
              onClick={handleLogout}
              className="flex-1 py-3.5 rounded-lg font-medium text-sm
                bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-md
                hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
              style={{ boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)' }}
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
      
      {/* <Footer developerLink="https://t.me/jerrymanager_bot" /> */}
    </div>
  );
}

export default App;
