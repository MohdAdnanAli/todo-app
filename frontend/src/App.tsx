import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useTheme } from './theme';
import type { Todo, User, MessageType, TodoCategory, TodoPriority } from './types';
import { API_URL } from './types';
import { encrypt, decrypt } from './utils/crypto';
import { AdminDashboard } from './pages/AdminDashboard';
import { 
  AuthForm, 
  LEDIndicator, 
  ProfileModal,
  WelcomeBackModal,
  ThemeSelector, 
  TodoForm, 
  GeometryLoader,
  WelcomeTour,
  QuickStartChecklist,
  PWAInstallPrompt,
  ConfirmDialog,
  Footer,
} from './components';
import SortableTodoList from './components/SortableTodoList';
import { onboardingService } from './services/onboarding';
import { offlineStorage } from './services/offlineStorage';

// Known temporary/disposable email domains
const TEMPORARY_EMAIL_DOMAINS = [
  'mailinator.com',
  'tempmail.com',
  '10minutemail.com',
  'guerrillamail.com',
  'throwaway.email',
  'trashmail.com',
  'fakeinbox.com',
  'yopmail.com',
  'sharklasers.com',
  'spam4.me',
  'grr.la',
  'maildrop.cc',
  'getnada.com',
  'mohmal.com',
  'tempail.com',
  'dispostable.com',
  'emailondeck.com',
  'fakeemailgenerator.com',
  'mailnesia.com',
  'tempr.email',
  'discard.email',
  'meltmail.com',
  'spambox.us',
  'mintemail.com',
  'spamgourmet.com',
  'mailsac.com',
  'tmails.net',
  'tmpmail.org',
  'tmpmail地址',
];

// Check if email is a temporary/disposable email
const isTemporaryEmail = (email: string): boolean => {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  return TEMPORARY_EMAIL_DOMAINS.some(temp => domain.includes(temp));
};

function App() {
  useTheme();
  
  const [isLoading, setIsLoading] = useState(true);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<MessageType>('idle');
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [encryptionSalt, setEncryptionSalt] = useState<string>('');
  const [userPassword, setUserPassword] = useState<string>('');
  const [showWelcomeTour, setShowWelcomeTour] = useState(false);
  const [showQuickStart, setShowQuickStart] = useState(false);
  const [quickStartChecked, setQuickStartChecked] = useState(false);
  const [showWelcomeBackModal, setShowWelcomeBackModal] = useState(false);
  const [isLoadingTodos, setIsLoadingTodos] = useState(false);
  
  // Delete confirmation dialog state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    todoId: string | null;
    isDeleting: boolean;
  }>({ isOpen: false, todoId: null, isDeleting: false });

  const decryptTodo = useCallback(async (todo: Todo): Promise<Todo> => {
    if (!userPassword || !encryptionSalt) return todo;
    try {
      const decryptedText = await decrypt(todo.text, userPassword, encryptionSalt);
      return { ...todo, text: decryptedText };
    } catch (err) {
      return todo;
    }
  }, [userPassword, encryptionSalt]);

  const decryptAllTodos = useCallback(async (todosToDecrypt: Todo[]): Promise<Todo[]> => {
    if (!userPassword || !encryptionSalt || todosToDecrypt.length === 0) return todosToDecrypt;
    return Promise.all(todosToDecrypt.map(decryptTodo));
  }, [userPassword, encryptionSalt, decryptTodo]);

  const handleGetIn = async () => {
    setIsLoadingTodos(true);
    try {
      const todosRes = await axios.get(`${API_URL}/api/todos`, {
        withCredentials: true,
      });
      // If no password is set, just load the todos as-is (encrypted)
      if (!userPassword) {
        setTodos(todosRes.data);
      } else {
        const decryptedTodos = await decryptAllTodos(todosRes.data);
        setTodos(decryptedTodos);
      }
      await offlineStorage.saveTodos(todosRes.data);
      setShowWelcomeBackModal(false);
      setMessage('Ready to go!');
      setMessageType('success');
    } catch (err: any) {
      setMessage('Error loading your tasks');
      setMessageType('error');
    } finally {
      setIsLoadingTodos(false);
    }
  };

  // Load todos from offline storage and password on mount
  useEffect(() => {
    const loadOfflineTodos = async () => {
      try {
        const offlineTodos = await offlineStorage.getAllTodos();
        if (offlineTodos.length > 0) {
          setTodos(offlineTodos);
        }
        // Try to restore password from storage
        const storedPassword = await offlineStorage.getPassword();
        if (storedPassword) {
          setUserPassword(storedPassword);
        }
      } catch (error) {
        console.error('Error loading offline todos:', error);
      }
    };
    loadOfflineTodos();
  }, []);

  // Separate effect to handle auth check - runs AFTER userPassword is restored
  useEffect(() => {
    const checkAuthAndFetch = async (retries = 3) => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const res = await axios.get(`${API_URL}/api/me`, {
            withCredentials: true,
          });
          
          setUser(res.data.user || null);
          setIsAdmin(res.data.isAdmin || false);
          
          if (res.data.encryptionSalt) {
            setEncryptionSalt(res.data.encryptionSalt);
          }

          // Fetch todos from server
          const todosRes = await axios.get(`${API_URL}/api/todos`, {
            withCredentials: true,
          });
          
          // Use the current userPassword value (which may have been restored from storage)
          if (userPassword) {
            const decryptedTodos = await decryptAllTodos(todosRes.data);
            setTodos(decryptedTodos);
            await offlineStorage.saveTodos(decryptedTodos);
          } else {
            setTodos(todosRes.data);
            await offlineStorage.saveTodos(todosRes.data);
          }
          
          // Only show welcome modal on first visit (no todos in offline storage AND no userPassword)
          const offlineTodos = await offlineStorage.getAllTodos();
          if (offlineTodos.length === 0 && !userPassword) {
            setShowWelcomeBackModal(true);
            setMessage('');
            setMessageType('idle');
          } else {
            // User already has todos or password, show them normally
            setShowWelcomeBackModal(false);
            if (userPassword) {
              setMessage('Welcome back!');
              setMessageType('success');
            }
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

      // Save password for future reloads
      await offlineStorage.savePassword(loginPassword);

      const todosRes = await axios.get(`${API_URL}/api/todos`, {
        withCredentials: true,
      });
      const decryptedTodos = await decryptAllTodos(todosRes.data);
      setTodos(decryptedTodos);
      await offlineStorage.saveTodos(decryptedTodos);
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

    // Check for temporary/disposable email
    if (isTemporaryEmail(regEmail)) {
      setMessage('Please use a valid email address. Temporary emails are not allowed.');
      setMessageType('error');
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

      // Save password for future reloads
      await offlineStorage.savePassword(regPassword);
      
      const todosRes = await axios.get(`${API_URL}/api/todos`, {
        withCredentials: true,
      });
      const decryptedTodos = await decryptAllTodos(todosRes.data);
      setTodos(decryptedTodos);
      await offlineStorage.saveTodos(decryptedTodos);
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
    } catch (err: any) {
      console.error('Logout failed:', err);
    }
  
    setUser(null);
    setIsAdmin(false);
    setShowAdminDashboard(false);
    setTodos([]);
    setEncryptionSalt('');
    setUserPassword('');
    setShowWelcomeBackModal(false);
    
    // Clear stored password on logout
    await offlineStorage.clearPassword();
    
    // Redirect directly to login page (home)
    window.location.href = '/';
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
    
    // Clear stored password on account deletion
    offlineStorage.clearPassword().catch(err => console.error('Error clearing password:', err));
  };

  const handleAddTodo = async (text: string, category?: TodoCategory, priority?: TodoPriority, tags?: string[], dueDate?: string) => {
    if (!text.trim()) {
      setMessage('Task text is required');
      setMessageType('warning');
      return;
    }
  
    // Track if this is the first task being added
    const isFirstTask = todos.length === 0;
    const hasCategory = !!category;
    const hasPriority = !!priority;
  
    setMessage('Adding...');
    setMessageType('loading');
    try {
      const encryptedText = await encrypt(text, userPassword, encryptionSalt);
      
      const todoData: Partial<Todo> = { 
        text: encryptedText,
      };
      if (category) todoData.category = category;
      if (priority) todoData.priority = priority;
      if (tags && tags.length > 0) todoData.tags = tags;
      if (dueDate) todoData.dueDate = dueDate;
      
      const res = await axios.post(
        `${API_URL}/api/todos`,
        todoData,
        { withCredentials: true }
      );
      
      // Backend returns all todos sorted - decrypt and set directly
      const decryptedTodos = await decryptAllTodos(res.data);
      setTodos(decryptedTodos);
      await offlineStorage.saveTodos(decryptedTodos);
      
      // Auto-complete quick-start tasks
      if (isFirstTask) {
        await checkAndAutoCompleteTask('first-task');
      }
      if (hasCategory) {
        await checkAndAutoCompleteTask('categorize');
      }
      if (hasPriority) {
        await checkAndAutoCompleteTask('set-priority');
      }
      
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
      const updatedTodos = todos.map(t =>
        t._id === todo._id ? decryptedTodo : t
      );
      setTodos(updatedTodos);
      await offlineStorage.saveTodos(updatedTodos);
      setMessage(todo.completed ? 'Task marked as pending' : 'Task completed');
      setMessageType(todo.completed ? 'pending' : 'success');
    } catch (err: any) {
      setMessage('Error updating todo: ' + (err.response?.data?.error || err.message));
      setMessageType('error');
    }
  };

  const handleDeleteClick = (todoId: string) => {
    setDeleteConfirm({ isOpen: true, todoId, isDeleting: false });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.todoId) return;
    
    setDeleteConfirm(prev => ({ ...prev, isDeleting: true }));

    try {
      const res = await axios.delete(`${API_URL}/api/todos/${deleteConfirm.todoId}`, {
        withCredentials: true,
      });

      // Backend returns all todos sorted - decrypt and set directly
      const decryptedTodos = await decryptAllTodos(res.data);
      setTodos(decryptedTodos);
      await offlineStorage.saveTodos(decryptedTodos);
      setMessage('Todo deleted');
      setMessageType('accent');
    } catch (err: any) {
      setMessage('Error deleting todo: ' + (err.response?.data?.error || err.message));
      setMessageType('error');
    } finally {
      setDeleteConfirm({ isOpen: false, todoId: null, isDeleting: false });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({ isOpen: false, todoId: null, isDeleting: false });
  };

  const handleReorder = async (reorderedTodos: Todo[]) => {
    // Optimistic update - show reordered immediately
    setTodos(reorderedTodos);
    await offlineStorage.saveTodos(reorderedTodos);
    
    // Use batch reorder endpoint for efficiency
    try {
      const reorderData = reorderedTodos.map((todo) => ({
        id: todo._id,
        // Order will be assigned by server based on array index
      }));
      
      const res = await axios.post(
        `${API_URL}/api/todos/reorder`,
        { todos: reorderData },
        { withCredentials: true }
      );
      
      // Server returns all todos with correct order - decrypt and sync
      const decryptedTodos = await decryptAllTodos(res.data);
      setTodos(decryptedTodos);
      await offlineStorage.saveTodos(decryptedTodos);
    } catch (err) {
      console.error('Error saving order:', err);
      // On error, the optimistic update will remain - user can retry
    }
  };

  const handleTourComplete = async () => {
    setShowWelcomeTour(false);
    await onboardingService.markOnboardingAsCompleted();
  };

  const handleQuickStartComplete = async () => {
    setShowQuickStart(false);
  };

  // Check quick-start progress and show checklist for new users
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user || quickStartChecked) return;
      
      try {
        // Check if onboarding has been completed
        const onboardingCompleted = await onboardingService.hasCompletedOnboarding();
        
        // Show welcome tour for first-time users (onboarding not completed)
        if (!onboardingCompleted) {
          setShowWelcomeTour(true);
          // Pre-populate example todos for new users
          await onboardingService.createExampleTodos();
          
          // Load the example todos from offline storage into UI state
          const exampleTodos = await offlineStorage.getAllTodos();
          if (exampleTodos.length > 0) {
            setTodos(exampleTodos);
            await offlineStorage.saveTodos(exampleTodos);
          }
        }
        
        // Check quick-start progress and show checklist
        const isComplete = await onboardingService.isQuickStartComplete();
        
        // Show checklist if user hasn't completed all tasks yet
        if (!isComplete) {
          setShowQuickStart(true);
        }
        setQuickStartChecked(true);
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        setQuickStartChecked(true);
      }
    };
    
    checkOnboardingStatus();
  }, [user, quickStartChecked]);

  // Auto-complete quick-start tasks when user performs actions
  const checkAndAutoCompleteTask = async (taskId: string) => {
    try {
      const progress = await onboardingService.getQuickStartProgress();
      const task = progress.find(t => t.id === taskId);
      if (task && !task.completed) {
        await onboardingService.updateQuickStartTask(taskId, true);
      }
    } catch (error) {
      console.error('Error auto-completing task:', error);
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
          <GeometryLoader initialMessage="Preparing your workspace..." />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl sm:p-[2.5rem] p-4 w-full mx-auto relative ${showAdminDashboard ? 'max-w-[90vw]' : 'max-w-[560px]'}`}
      style={{
        background: 'var(--bg-primary)',
        boxShadow: 'var(--shadow)'
      }}
    >
      <ThemeSelector ledMessage={message} ledMessageType={messageType} />
      
      <div className="flex items-center justify-center mb-[2rem] relative">
        <h1 className="text-center bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent text-[2rem] font-semibold m-0">
          Todo App
        </h1>
        <div className="header-led-container">
          <LEDIndicator message={message} messageType={messageType} />
        </div>
      </div>

      {user ? (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-[1.5rem] gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <p
                onClick={() => setShowProfileModal(true)}
                className="font-semibold text-lg text-[var(--text-primary)] flex items-center gap-2 m-0 cursor-pointer hover:opacity-80 transition-opacity"
              >
                {user.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.displayName || user.email}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm flex-shrink-0">
                    {(user.displayName || user.email.split('@')[0]).charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="whitespace-nowrap">
                  Welcome, {user.displayName || user.email.split('@')[0]}!
                </span>
              </p>
              {user.bio && (
                <span className="text-xs text-[var(--text-muted)]">
                  ({user.bio.length > 20 ? user.bio.substring(0, 20) + '...' : user.bio})
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 ml-auto sm:ml-0">
              <button
                
                title="Premium Feature is in Beta"
                className="px-4 py-2 rounded-lg font-medium text-sm bg-gradient-to-r from-indigo-500 to-purple-500 text-white
                  shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 whitespace-nowrap"
                style={{ boxShadow: 'var(--glow)' }}
              >
                ⏰
              </button>
              {isAdmin && (
                <button
                  onClick={() => setShowAdminDashboard(true)}
                  className="px-3 py-2 rounded-lg font-medium text-sm bg-gradient-to-r from-cyan-500 to-blue-500 text-white
                    shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 whitespace-nowrap"
                  style={{ boxShadow: 'var(--glow)' }}
                >
                  ⚙️ Admin
                </button>
              )}
            </div>
          </div>

          {showAdminDashboard ? (
            <AdminDashboard onClose={() => setShowAdminDashboard(false)} />
          ) : (
            <>
              {showQuickStart && <QuickStartChecklist onComplete={handleQuickStartComplete} />}
              
              <TodoForm onAdd={handleAddTodo} />

              <SortableTodoList 
                todos={todos} 
                onToggle={handleToggle} 
                onDelete={handleDeleteClick}
                onReorder={handleReorder}
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
            </>
          )}
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

      {showWelcomeBackModal && user && (
        <WelcomeBackModal
          isOpen={showWelcomeBackModal}
          userName={user.displayName || user.email.split('@')[0]}
          onGetIn={handleGetIn}
          isLoading={isLoadingTodos}
        />
      )}

      <WelcomeTour 
        isOpen={showWelcomeTour}
        onClose={() => setShowWelcomeTour(false)}
        onComplete={handleTourComplete}
      />

      <PWAInstallPrompt />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isLoading={deleteConfirm.isDeleting}
      />

      <Footer />
    </div>
  );
}

export default App;

