import { useState, useCallback } from 'react';
import axios from 'axios';
import type { User, Todo } from '../types';
import { API_URL } from '../types';
import { decrypt } from '../utils/crypto';

interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  encryptionSalt: string;
  userPassword: string;
  setUserPassword: (password: string) => void;
  setEncryptionSalt: (salt: string) => void;
  setUser: (user: User | null) => void;
  setIsLoading: (loading: boolean) => void;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [encryptionSalt, setEncryptionSalt] = useState('');
  const [userPassword, setUserPassword] = useState('');

  return {
    user,
    isLoading,
    encryptionSalt,
    userPassword,
    setUserPassword,
    setEncryptionSalt,
    setUser,
    setIsLoading,
  };
};

export const useTodos = (
  userPassword: string, 
  encryptionSalt: string,
  decryptAllTodos: (todos: Todo[]) => Promise<Todo[]>,
  setTodos: React.Dispatch<React.SetStateAction<Todo[]>>
) => {
  const fetchTodos = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/todos`, {
        withCredentials: true,
      });
      
      if (userPassword && encryptionSalt) {
        const decryptedTodos = await decryptAllTodos(res.data);
        setTodos(decryptedTodos);
      } else {
        setTodos(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch todos:', error);
    }
  }, [userPassword, encryptionSalt, decryptAllTodos, setTodos]);

  return { fetchTodos };
};

export const useAuthCheck = (
  setUser: React.Dispatch<React.SetStateAction<User | null>>,
  setEncryptionSalt: React.Dispatch<React.SetStateAction<string>>,
  setUserPassword: React.Dispatch<React.SetStateAction<string>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setMessage: React.Dispatch<React.SetStateAction<string>>,
  setMessageType: React.Dispatch<React.SetStateAction<string>>
) => {
  return useCallback(async (retries = 3) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const res = await axios.get(`${API_URL}/api/me`, {
          withCredentials: true,
        });
        
        setUser(res.data.user || null);
        
        if (res.data.encryptionSalt) {
          setEncryptionSalt(res.data.encryptionSalt);
        }

        setIsLoading(false);
        return true;
      } catch (err: any) {
        const status = err.response?.status;
        
        if (status === 401) {
          setUser(null);
          setEncryptionSalt('');
          setUserPassword('');
          setMessage('');
          setMessageType('idle');
          setIsLoading(false);
          return false;
        }
        
        if (attempt === retries) {
          setMessage('Unable to connect to server. Please try again later.');
          setMessageType('system');
          setIsLoading(false);
          return false;
        } else {
          await new Promise(r => setTimeout(r, 1000 * attempt));
        }
      }
    }
    return false;
  }, [setUser, setEncryptionSalt, setUserPassword, setIsLoading, setMessage, setMessageType]);
};

export const useDecryption = (userPassword: string, encryptionSalt: string) => {
  const decryptTodo = useCallback(async (todo: Todo): Promise<Todo> => {
    if (!userPassword || !encryptionSalt) return todo;
    try {
      const decryptedText = await decrypt(todo.text, userPassword, encryptionSalt);
      return { ...todo, text: decryptedText };
    } catch (err) {
      console.error('Failed to decrypt todo:', err);
      return todo;
    }
  }, [userPassword, encryptionSalt]);

  const decryptAllTodos = useCallback(async (todosToDecrypt: Todo[]): Promise<Todo[]> => {
    if (!userPassword || !encryptionSalt) return todosToDecrypt;
    return Promise.all(todosToDecrypt.map(decryptTodo));
  }, [userPassword, encryptionSalt]);

  return { decryptTodo, decryptAllTodos };
};
