import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useTheme } from './theme';
import type { Todo, User, MessageType, TodoCategory, TodoPriority } from './types';
import { API_URL } from './types';
import { encrypt, decrypt, decryptAllTodosWithFallback, decryptTodoWithFallback } from './utils/crypto';
import { AdminDashboard } from './pages/AdminDashboard';
import { 
  AuthForm, 
  PasswordUnlockModal,
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
  PremiumFeaturesModal,
  ErrorBoundary,
} from './components';
import { useLocalTodoDecryption } from './hooks/useAuth';
import SmartTodoList from './components/SmartTodoList';
import { onboardingService } from './services/onboarding';
import { offlineStorage, addSyncListener, type SyncStatus } from './services/offlineStorage';
import { todoApi } from './services/api';
import { ArrowRight } from 'lucide-react';

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
  // MUST call useTheme first - always! (hook must be at top level)
  useTheme();
  
  // State hooks - always call in same order
  const [isLoading, setIsLoading] = useState(true);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<MessageType>('idle');
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [encryptionSalt, setEncryptionSalt] = useState<string>('');
  const [encryptionPassword, setEncryptionPassword] = useState<string>('');
  const [showWelcomeTour, setShowWelcomeTour] = useState(false);
  const [showQuickStart, setShowQuickStart] = useState(false);
  const [quickStartChecked, setQuickStartChecked] = useState(false);
  const [showWelcomeBackModal, setShowWelcomeBackModal] = useState(false);
  const [isLoadingTodos, setIsLoadingTodos] = useState(false);
  const [showPremiumFeatures, setShowPremiumFeatures] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [syncMessageType, setSyncMessageType] = useState<MessageType>('idle');
  
  // Clean decryption state - single declaration (unused)
  const [, /* setRawTodos */] = useState<Todo[]>([]);
  
  // Decryption hook (after state - SINGLE instance)
  const { needsUnlock, unlock } = useLocalTodoDecryption(
    [] as any,
    encryptionPassword, 
    encryptionSalt, 
    setEncryptionPassword,
    setTodos
  );
  
  // Sync status listener cleanup
  const syncListenerCleanup = useRef<() => void | undefined>();
  
  // Delete confirmation dialog state
  const [deleteConfirm, setDeleteConfirm] = useState<{

isOpen: boolean;
    todoId: string | null;
    isDeleting: boolean;
  }>({ isOpen: false, todoId: null, isDeleting: false });

  // Track if we've processed Google OAuth redirect
  const googleOAuthProcessed = useRef(false);
  
  // Track if initial auth check is done
  const initialAuthCheckDone = useRef(false);

  // Memoized/decrypt functions - always call in same order
// ENHANCED: Graceful decryption with 🔒 Encrypted fallback
    const decryptTodo = useCallback(async (todo: Todo, password: string, salt: string): Promise<Todo> => {
    if (!password || !salt) return todo;
    try {
      const decryptedText = await decrypt(todo.text, password, salt);
      return { ...todo, text: decryptedText };
    } catch (err: any) {
      console.error('[DECRYPT FAIL] Todo:', todo._id, 'Password len:', password?.length || 0, 'Salt:', !!salt);
      return todo;
    }
  }, []);

// ENHANCED: Batch decryption with graceful fallbacks
  const decryptAllTodos = useCallback(async (todosToDecrypt: Todo[], password: string, salt: string): Promise<Todo[]> => {
    if (!password || !salt || todosToDecrypt.length === 0) return todosToDecrypt;
    return Promise.all(
      todosToDecrypt.map(async (todo) => {
        try {
          return await decryptTodo(todo, password, salt);
        } catch {
          return todo; // Keep encrypted text
        }
      })
    );
  }, [decryptTodo]);

  const sortTodosByOrder = useCallback((todos: Todo[]): Todo[] => [...todos].sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity)), []);



  const handleGetIn = async () => {
    setIsLoadingTodos(true);
    try {
      const todosRes = await axios.get(`${API_URL}/api/todos`, {
        withCredentials: true,
      });
      
      // Ensure we have an array before mapping
      const todosData = Array.isArray(todosRes.data) ? todosRes.data : [];
      
      // If no password is set, just load the todos as-is (encrypted)
      if (!encryptionPassword) {
        setTodos(sortTodosByOrder(todosData));
      } else {
        const decryptedTodos = await decryptAllTodos(todosData, encryptionPassword, encryptionSalt);
        setTodos(sortTodosByOrder(decryptedTodos));
      }
      await offlineStorage.saveTodos(sortTodosByOrder(todosData));
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
        
        // Try to restore password from storage FIRST (before loading todos)
        const storedPassword = await offlineStorage.getPassword();
        const storedSalt = await offlineStorage.getEncryptionSalt();
        
        if (storedPassword) {
          setEncryptionPassword(storedPassword);
        }
        if (storedSalt) {
          setEncryptionSalt(storedSalt);
        }
        
        // Skip offline decrypt - wait for auth check to ensure correct password
      } catch (error) {
        console.error('Error loading offline todos:', error);
      }
    };
    loadOfflineTodos();
  }, []);

  // Handle Google OAuth params - runs once on mount
  useEffect(() => {
    const handleGoogleOAuthParams = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const googleAuth = urlParams.get('google_auth');
      const encryptionSaltParam = urlParams.get('encryptionSalt');
      const googleIdParam = urlParams.get('googleId');

      if (googleAuth === 'success') {
        // Mark as processed to prevent second effect from running
        googleOAuthProcessed.current = true;
        
        // Save encryption salt for Google users
        if (encryptionSaltParam) {
          await offlineStorage.saveEncryptionSalt(encryptionSaltParam);
          setEncryptionSalt(encryptionSaltParam);
        }
        
        // FIXED: Don't set googleId as password - use server-provided encryptionPassword
        // Save googleId as password for Google users - this is used for encryption
        if (googleIdParam) {
          await offlineStorage.savePassword(googleIdParam);
          setEncryptionPassword(googleIdParam); // Fallback until /api/me loads
        }
        
        // Clear URL params immediately
        window.history.replaceState({}, '', window.location.pathname);
        
        // Immediately check auth and fetch todos - don't wait for other effects
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
          
          const todosData = Array.isArray(todosRes.data) ? todosRes.data : [];
          
          // Use encryptionPassword from /api/me
          const encPassword = res.data.encryptionPassword || encryptionPassword || googleIdParam || '';
          const decryptedTodos = await decryptAllTodos(todosData, encPassword, encryptionSalt || encryptionSaltParam || '');
          setTodos(decryptedTodos);
          await offlineStorage.saveTodos(decryptedTodos);
          
          setIsLoading(false);
          setMessage('Welcome back!');
          setMessageType('success');
        } catch (err) {
          console.error('Google OAuth auth check failed:', err);
          // If auth fails, still stop loading to show the page
          setIsLoading(false);
        }
      }
    };
    handleGoogleOAuthParams();
  }, []);

  // Separate effect to handle auth check - runs on mount
  useEffect(() => {
    // Skip if Google OAuth was already processed or if we've already done initial check
    if (googleOAuthProcessed.current || initialAuthCheckDone.current) {
      return;
    }
    
    // Mark as done immediately to prevent re-runs
    initialAuthCheckDone.current = true;
    
    const checkAuthAndFetch = async (retries = 3) => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const res = await axios.get(`${API_URL}/api/me`, {
            withCredentials: true,
          });
          
          setUser(res.data.user || null);
          setIsAdmin(res.data.isAdmin || false);
          
          // Get salt from server response
          const serverSalt = res.data.encryptionSalt || '';
          if (serverSalt) {
            setEncryptionSalt(serverSalt);
          }

          // Fetch todos from server
          const todosRes = await axios.get(`${API_URL}/api/todos`, {
            withCredentials: true,
          });
          
          // Ensure we have an array before mapping
          const todosData = Array.isArray(todosRes.data) ? todosRes.data : [];
          
          // Get current password/salt from state (should be loaded from storage by now)
          const currentPassword = encryptionPassword || res.data.encryptionPassword;
          const currentSalt = encryptionSalt || serverSalt;
          
          // Use password from storage OR from server response to decrypt
      if (currentPassword && currentSalt) {
        const decryptedTodos = await decryptAllTodos(todosData, currentPassword, currentSalt);
            setTodos(decryptedTodos);
            await offlineStorage.saveTodos(todosData); // Save raw encrypted todos
      } else {
        setTodos(todosData);
        await offlineStorage.saveTodos(todosData);
      }
          
          // Only show welcome modal on first visit (no todos in offline storage AND no userPassword)
          const offlineTodos = await offlineStorage.getAllTodos();
          if (offlineTodos.length === 0 && !currentPassword) {
            setShowWelcomeBackModal(true);
            setMessage('');
            setMessageType('idle');
          } else {
            // User already has todos or password, show them normally
            setShowWelcomeBackModal(false);
            if (currentPassword) {
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
            // API unavailable - stop loading and show login form
            // Don't show error message, just let user log in
            setIsLoading(false);
          } else {
            await new Promise(r => setTimeout(r, 1000 * attempt));
          }
        }
      }
    };
    
    // Don't set loading false here - let it stay true until API responds or fails
    // But we already marked initialAuthCheckDone as true so this won't run again
    checkAuthAndFetch();
  }, []);

  const handleLogin = async (loginEmail: string, loginPassword: string) => {
    setMessage('Logging in...');
    setMessageType('loading');
    try {
      const response = await axios.post(
        `${API_URL}/api/auth/login`,
        { email: loginEmail, password: loginPassword },
        { withCredentials: true }
      );
      
      // Get data from response - use local variables to avoid state race conditions
      const { user: userData, encryptionSalt: salt, isAdmin: loginIsAdmin } = response.data;
      
      // Set user data first
      setUser(userData);
      setIsAdmin(loginIsAdmin || false);
      setEncryptionSalt(salt || '');
      setEncryptionPassword(loginPassword);

      // Save password for future reloads
      await offlineStorage.savePassword(loginPassword);

      // Fetch todos - handle errors gracefully
      try {
        const todosRes = await axios.get(`${API_URL}/api/todos`, {
          withCredentials: true,
        });
        const todosData = Array.isArray(todosRes.data) ? todosRes.data : [];
        
        // Decrypt todos using local variables instead of state to avoid race condition
        let decryptedTodos = todosData;
        if (loginPassword && salt) {
          try {
            decryptedTodos = await Promise.all(
              todosData.map(async (todo: Todo) => {
                try {
                  const decryptedText = await decrypt(todo.text, loginPassword, salt);
                  return { ...todo, text: decryptedText };
                } catch {
                  return todo; // Return encrypted if decrypt fails
                }
              })
            );
          } catch (decryptErr) {
            console.warn('Decryption failed, showing encrypted todos:', decryptErr);
          }
        }
        
        setTodos(decryptedTodos);
        await offlineStorage.saveTodos(decryptedTodos);
      } catch (todoErr) {
        console.warn('Failed to fetch todos after login:', todoErr);
        setTodos([]);
      }
      
      // Only set loading to false AFTER everything is done
      setMessage('Login successful');
      setMessageType('success');
      setIsLoading(false);
    } catch (err: any) {
      // Always stop loading on error
      setIsLoading(false);
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

    setMessage('Creating account...');
    setMessageType('loading');
    try {
      const response = await axios.post(
        `${API_URL}/api/auth/register`,
        { email: regEmail, password: regPassword, displayName: regDisplayName },
        { withCredentials: true }
      );
      
      // Get data from response - use local variables to avoid state race conditions
      const { user: userData, encryptionSalt: salt, isAdmin: regIsAdmin } = response.data;
      
      // Set user data first
      setUser(userData);
      setIsAdmin(regIsAdmin || false);
      setEncryptionSalt(salt || '');
      setEncryptionPassword(regPassword);

      // Save password for future reloads
      await offlineStorage.savePassword(regPassword);
      
      // Fetch todos - handle errors gracefully
      try {
        const todosRes = await axios.get(`${API_URL}/api/todos`, {
          withCredentials: true,
        });
        const todosData = Array.isArray(todosRes.data) ? todosRes.data : [];
        
        // Decrypt todos using local variables instead of state to avoid race condition
        let decryptedTodos = todosData;
        if (regPassword && salt) {
          try {
            decryptedTodos = await Promise.all(
              todosData.map(async (todo: Todo) => {
                try {
                  const decryptedText = await decrypt(todo.text, regPassword, salt);
                  return { ...todo, text: decryptedText };
                } catch {
                  return todo; // Return encrypted if decrypt fails
                }
              })
            );
          } catch (decryptErr) {
            console.warn('Decryption failed, showing encrypted todos:', decryptErr);
          }
        }
        
        setTodos(decryptedTodos);
        await offlineStorage.saveTodos(decryptedTodos);
      } catch (todoErr) {
        console.warn('Failed to fetch todos after registration:', todoErr);
        setTodos([]);
      }
      
      // Only set loading to false AFTER everything is done
      setMessage('Account created and logged in! Please check your email to verify your account.');
      setMessageType('success');
      setIsLoading(false);
    } catch (err: any) {
      // Always stop loading on error
      setIsLoading(false);
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
    setEncryptionPassword('');
    setShowWelcomeBackModal(false);
    
    // Clear stored password on logout
    await offlineStorage.clearPassword();
    await offlineStorage.clearEncryptionSalt();
    
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
    offlineStorage.clearEncryptionSalt().catch(err => console.error('Error clearing encryption salt:', err));
  };

  const handleAddTodo = async (text: string, category?: TodoCategory, priority?: TodoPriority, tags?: string[], dueDate?: string) => {
    if (!text.trim()) {
      setMessage('Task text is required');
      setMessageType('warning');
      return;
    }

    // Encrypt BEFORE local action
    let encryptedText = text;
    if (encryptionPassword && encryptionSalt) {
      try {
        encryptedText = await encrypt(text, encryptionPassword, encryptionSalt);
      } catch (encryptErr) {
        console.warn('Encryption failed, saving as plain text:', encryptErr);
      }
    }
    
    // OFFLINE-FIRST: optimistic local create + auto-queue
    const isFirstTask = todos.length === 0;
    const hasCategory = !!category;
    const hasPriority = !!priority;
    
    try {
      const newTodo = await offlineStorage.performLocalAction('create', {
        text: encryptedText,
        category,
        priority,
        tags,
        dueDate
      }) as Todo;
      
      // Optimistic UI update (decrypt for display)
      const decryptedNewTodo = await decryptTodo(newTodo, userPassword, encryptionSalt);
      setTodos(prev => sortTodosByOrder([decryptedNewTodo, ...prev.filter(t => t._id !== newTodo._id)]));
      
      setMessage('Todo added ✓ (syncing...)');
      setMessageType('primary');
      
      // Quick-start
      if (isFirstTask) await checkAndAutoCompleteTask('first-task');
      if (hasCategory) await checkAndAutoCompleteTask('categorize');
      if (hasPriority) await checkAndAutoCompleteTask('set-priority');
      
    } catch (err: any) {
      setMessage('Local save failed: ' + err.message);
      setMessageType('error');
    }
  };

  const handleToggle = async (todo: Todo) => {
    // OFFLINE-FIRST toggle
    const updatedTodo = await offlineStorage.performLocalAction('toggle', {
      _id: todo._id,
      completed: !todo.completed
    }) as Todo;
    
    // Optimistic UI (decrypt)
    const decryptedTodo = await decryptTodo(updatedTodo, userPassword, encryptionSalt);
    setTodos(prev => sortTodosByOrder(prev.map(t => t._id === todo._id ? decryptedTodo : t)));
    
    setMessage(todo.completed ? 'Task marked as pending ✓' : 'Task completed ✓');
    setMessageType(todo.completed ? 'pending' : 'success');
  };

  const handleDeleteClick = (todoId: string) => {
    setDeleteConfirm({ isOpen: true, todoId, isDeleting: false });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.todoId) return;
    
    setDeleteConfirm(prev => ({ ...prev, isDeleting: true }));

    try {
      await offlineStorage.performLocalAction('delete', { _id: deleteConfirm.todoId });
      setTodos(prev => sortTodosByOrder(prev.filter(t => t._id !== deleteConfirm.todoId)));
      setMessage('Todo deleted ✓');
      setMessageType('accent');
    } catch (err: any) {
      setMessage('Local delete failed: ' + err.message);
      setMessageType('error');
    } finally {
      setDeleteConfirm({ isOpen: false, todoId: null, isDeleting: false });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({ isOpen: false, todoId: null, isDeleting: false });
  };

    const handleReorder = async (reorderedTodos: Todo[]) => {
      try {
        console.log('[REORDER] Starting - optimistic update');
        // 1. Optimistic UI (with order preservation)
        const optimisticTodos = sortTodosByOrder([...reorderedTodos]);
        setTodos(optimisticTodos);
        
        // REORDER BUG FIX: Validate crypto state before API
        if (!encryptionPassword || !encryptionSalt) {
          console.warn('[REORDER] No password/salt - using optimistic only');
          setMessage('Local reorder saved (no encryption)');
          setMessageType('warning');
          return;
        }
        
        // 2. Server sync (authoritative but with fallback)
        const reorderData = {
          todos: reorderedTodos.map(t => ({ id: t._id.toString(), order: t.order ?? 0 }))
        };
        console.log('[REORDER] Sending to server:', reorderData.todos.length, 'todos');
        
        const response = await todoApi.reorderTodos(reorderData);
        const serverTodosRaw: Todo[] = Array.isArray(response) ? response : (response as any)?.data || [];
        
        if (serverTodosRaw.length === 0) {
          console.warn('[REORDER] Empty server response - keeping optimistic');
          setMessage('Local reorder saved (server empty)');
          setMessageType('warning');
          return;
        }
        
        // REORDER BUG FIX: Use NEW safe batch decrypt (preserves order on fail)
        console.log('[REORDER] Decrypting server response...');
        const serverTodos = await decryptAllTodosWithFallback(serverTodosRaw, encryptionPassword, encryptionSalt);
        
        // REORDER BUG FIX: Validate server order vs client expectation
        const clientOrderSum = optimisticTodos.reduce((sum, t) => sum + (t.order ?? Infinity), 0);
        const serverOrderSum = serverTodos.reduce((sum, t) => sum + (t.order ?? Infinity), 0);
        const orderMatch = Math.abs(clientOrderSum - serverOrderSum) < 10; // Tolerance for small diffs
        
        if (orderMatch) {
          console.log('[REORDER] Server order OK - using server todos');
          setTodos(sortTodosByOrder(serverTodos));
          setMessage('✅ Reorder synced');
        } else {
          console.warn('[REORDER] Server order mismatch! Client sum:', clientOrderSum, 'Server sum:', serverOrderSum, '- keeping optimistic');
          // HYBRID FALLBACK: Use server data but optimistic order
          const hybridTodos = serverTodos.map((serverTodo, i) => {
            const optimisticTodo = optimisticTodos.find(t => t._id === serverTodo._id);
            return {
              ...serverTodo,
              order: optimisticTodo?.order ?? serverTodo.order ?? i,
            };
          });
          setTodos(sortTodosByOrder(hybridTodos));
          setMessage('🔧 Reorder fixed (server order issue)');
        }
        setMessageType('success');
        
      } catch (err: any) {
        console.error('[REORDER] Failed:', err);
        setMessage('Local reorder saved');
        setMessageType('warning');
      }
    };

  const handleTourComplete = async () => {
    setShowWelcomeTour(false);
    await onboardingService.markOnboardingAsCompleted();
  };

  const handleQuickStartComplete = async () => {
    setShowQuickStart(false);
  };

  // Auto-complete quick-start tasks when user performs actions
  // Must be defined BEFORE useEffect that might call it
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

  // Check quick-start progress and show checklist for new users
  // This runs once when user is authenticated and todos are loaded
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      // Only run when: user exists, todos are loaded (not loading), and we haven't checked yet
      if (!user || isLoadingTodos || quickStartChecked) return;
      
      try {
        // Check if onboarding has been completed
        const onboardingCompleted = await onboardingService.hasCompletedOnboarding();
        
        // Show welcome tour for first-time users (onboarding not completed)
        if (!onboardingCompleted) {
          setShowWelcomeTour(true);
        }
        
        // Check quick-start progress and show checklist
        // Only show if user hasn't completed all tasks
        const isComplete = await onboardingService.isQuickStartComplete();
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
  }, [user, isLoadingTodos, quickStartChecked]);

// Sync status listener - updates SyncLED
  useEffect(() => {
    if (!user) return;
    
    // Initial status
    offlineStorage.getSyncStatus().then(status => {
      setSyncStatus(status);
      updateSyncLED(status);
    });
    
    const cleanup = addSyncListener((status: SyncStatus) => {
      setSyncStatus(status);
      updateSyncLED(status);
    });
    
    syncListenerCleanup.current = cleanup;
    
    return () => {
      cleanup();
      offlineStorage.cleanup();
    };
  }, [user]);

  const updateSyncLED = (status: SyncStatus) => {
    if (status.syncInProgress) {
      setSyncMessageType('loading'); // green-grey flicker
    } else if (status.pendingCount > 0) {
      setSyncMessageType('pending'); // grey pulse/stuck
    } else if (status.lastError || !status.isOnline) {
      setSyncMessageType('error'); // red pulse
    } else if (status.lastSyncAt) {
      setSyncMessageType('success'); // green static
    } else {
      setSyncMessageType('idle'); // grey static
    }
  };

  // Render loading state - ensures hooks are always called in same order
  if (isLoading) {
    return (
      <ErrorBoundary>
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
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
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
          <LEDIndicator message={message} messageType={messageType} variant="default" />
        </div>
      </div>

      {user ? (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-[1.5rem] gap-2">
            <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
              <div className="relative">
                <p
                  onClick={() => setShowProfileModal(true)}
                  className="font-semibold text-lg text-[var(--text-primary)] flex items-center gap-2 m-0 cursor-pointer hover:opacity-80 transition-opacity flex-1 min-w-0"
                >
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.displayName || user.email}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0 relative z-0"
                    />
                  ) : (
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm flex-shrink-0 relative z-0">
                      {(user.displayName || user.email.split('@')[0]).charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="truncate max-w-[180px] sm:max-w-[250px]">
                    Welcome, {user.displayName || user.email.split('@')[0]}!
                  </span>
                </p>
{syncStatus && (
                  <LEDIndicator 
                    message="" 
                    messageType={syncMessageType} 
                    variant="small-screen-header" 
                  />
                )}
              </div>
              {user.bio && (
                <span className="text-xs text-[var(--text-muted)] truncate max-w-[150px]">
                  ({user.bio.length > 20 ? user.bio.substring(0, 20) + '...' : user.bio})
                </span>
              )}
            </div>


            <div className="flex items-center gap-2 ml-auto sm:ml-0">
              <button
                onClick={() => setShowPremiumFeatures(true)}
                title="Premium Features (Beta)"
                className="px-4 py-2 rounded-lg font-medium text-sm bg-gradient-to-r from-indigo-500 to-purple-500 text-white
                  shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 whitespace-nowrap flex items-center gap-1.5"
                style={{ boxShadow: 'var(--glow)' }}
              >
                <ArrowRight size={16} className="transform -rotate-45" />
                Go Premium
              </button>
              {isAdmin && (
                <button
                  onClick={() => setShowAdminDashboard(prev => !prev)}
                  className="px-3 py-2 rounded-lg font-medium text-sm bg-gradient-to-r from-cyan-500 to-blue-500 text-white
                    shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 whitespace-nowrap"
                  style={{ boxShadow: 'var(--glow)' }}
                >
                  {showAdminDashboard ? '✕ Close' : '⚙️ Admin'}
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

              <SmartTodoList 
                todos={todos} 
                onToggle={handleToggle} 
                onDelete={handleDeleteClick}
                onReorder={handleReorder}
                sortable={true}
              />
              
              {/* Password Unlock Modal */}
              <PasswordUnlockModal
                isOpen={needsUnlock}
                onUnlock={unlock}
                isUnlocking={false}
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

      {showWelcomeBackModal && user && !showWelcomeTour && (
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

      {/* Premium Features Modal */}
      <PremiumFeaturesModal
        isOpen={showPremiumFeatures}
        onClose={() => setShowPremiumFeatures(false)}
      />

      <Footer />
    </div>
    </ErrorBoundary>
  );
}

export default App;
