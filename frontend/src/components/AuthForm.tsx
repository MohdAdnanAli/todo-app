import React, { useState, useEffect, useCallback } from 'react';
import type { JSX } from 'react';
import { authApi, googleApi, getApiErrorMessage, isRateLimitError, isAccountLockedError } from '../services/api';
import type { AuthMode } from '../types';

interface AuthFormProps {
  onLogin: (email: string, password: string) => void;
  onRegister: (email: string, password: string, displayName: string) => void;
}

const PASSWORD_REQUIREMENTS = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { label: 'One number', test: (p: string) => /[0-9]/.test(p) },
  { label: 'One special character (!@#$%^&*)', test: (p: string) => /[!@#$%^&*]/.test(p) },
];

// Calculate password strength score (0-100)
const calculatePasswordStrength = (password: string): number => {
  if (!password) return 0;
  let score = 0;
  
  // Length checks
  if (password.length >= 8) score += 20;
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;
  
  // Character type checks
  if (/[a-z]/.test(password)) score += 15;
  if (/[A-Z]/.test(password)) score += 15;
  if (/[0-9]/.test(password)) score += 15;
  if (/[!@#$%^&*]/.test(password)) score += 15;
  
  return Math.min(100, score);
};

// Get strength color and label
const getStrengthInfo = (score: number): { color: string; label: string; bgColor: string } => {
  if (score < 40) return { color: '#ef4444', label: 'Weak', bgColor: 'rgba(239, 68, 68, 0.3)' };
  if (score < 60) return { color: '#f59e0b', label: 'Fair', bgColor: 'rgba(245, 158, 11, 0.3)' };
  if (score < 80) return { color: '#22c55e', label: 'Good', bgColor: 'rgba(34, 197, 94, 0.3)' };
  return { color: '#10b981', label: 'Strong', bgColor: 'rgba(16, 185, 129, 0.3)' };
};

// Helper function to get token from URL
const getTokenFromUrl = (): string | null => {
  const params = new URLSearchParams(window.location.search);
  return params.get('token');
};

// Google SVG Icon
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const AuthForm = ({ onLogin, onRegister }: AuthFormProps): JSX.Element => {
  // Check URL for reset token on initial load
  const urlToken = typeof window !== 'undefined' ? getTokenFromUrl() : null;
  const initialMode: AuthMode = urlToken ? 'reset-password' : 'login';
  
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [resetToken, setResetToken] = useState(urlToken || '');
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [rateLimitSeconds, setRateLimitSeconds] = useState(0);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Check for Google OAuth success or errors in URL
  useEffect(() => {
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const googleAuth = urlParams?.get('google_auth');
    const googleError = urlParams?.get('google_error') ?? null;
    
    // Handle success - just clear the URL, auth is via cookie
    if (googleAuth === 'success') {
      window.history.replaceState({}, document.title, window.location.pathname);
      // Don't need to do anything else - the cookie should already be set
      // and the app will authenticate on reload/re-render
      return;
    }
    
    // Handle errors
    if (googleError) {
      setError(decodeURIComponent(googleError));
      // Clear URL params
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Google Sign-In handler - opens in popup
  const handleGoogleSignIn = useCallback(async () => {
    try {
      setError('');
      
      // Get Google OAuth URL from backend
      const { authUrl } = await googleApi.getAuthUrl();
      
      // Add popup parameter to trigger popup flow in backend
      const popupAuthUrl = authUrl.includes('?') 
        ? `${authUrl}&popup=true` 
        : `${authUrl}?popup=true`;
      
      // Open Google OAuth in a popup window
      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const popup = window.open(
        popupAuthUrl,
        'Google Sign-In',
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
      );
      
      if (!popup) {
        // Fallback to redirect if popup is blocked
        window.location.href = popupAuthUrl;
        return;
      }
      
      // Listen for messages from the popup
      const handleMessage = (event: MessageEvent) => {
        // Verify the origin matches our expected domains
        const allowedOrigins = [
          window.location.origin,
          'https://metb-todo.vercel.app',
          'https://todo-app-srbx.onrender.com',
        ];
        
        // Also accept messages with no origin (some browser scenarios)
        if (!event.origin || allowedOrigins.includes(event.origin)) {
          if (event.data?.type === 'google-auth-success') {
            // Close popup immediately
            try { popup.close(); } catch(e) {}
            
            // Remove listener to prevent duplicate handling
            window.removeEventListener('message', handleMessage);
            
            // Reload to trigger auth check - the cookie should now be set
            window.location.reload();
          } else if (event.data?.type === 'google-auth-error') {
            setError(event.data.message || 'Google sign-in failed');
            try { popup.close(); } catch(e) {}
            window.removeEventListener('message', handleMessage);
          }
        }
      };
      
      window.addEventListener('message', handleMessage);
      
      // Poll for popup closure as backup
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          
          // Check if authentication was successful by checking cookie
          // Small delay to allow cookie to be set
          setTimeout(() => {
            if (document.cookie.includes('auth_token')) {
              window.location.reload();
            }
          }, 500);
        }
      }, 500);
      
    } catch (err: unknown) {
      getApiErrorMessage(err);
      setError('Failed to initiate Google sign-in. Please try again.');
    }
  }, []);

  // Check URL for token when mode changes to reset-password
  useEffect(() => {
    if (mode === 'reset-password' && !resetToken) {
      const token = getTokenFromUrl();
      if (token) {
        setResetToken(token);
      }
    }
  }, [mode, resetToken]);

  useEffect(() => {
    // Validate password for both register and reset-password modes
    if ((mode === 'register' || mode === 'reset-password') && password) {
      const errors = PASSWORD_REQUIREMENTS.filter(req => !req.test(password)).map(req => req.label);
      setPasswordErrors(errors);
      setPasswordStrength(calculatePasswordStrength(password));
    } else {
      setPasswordErrors([]);
      setPasswordStrength(0);
    }
  }, [password, mode]);

  useEffect(() => {
    if (rateLimitSeconds <= 0) return;
    const timer = setTimeout(() => setRateLimitSeconds(s => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [rateLimitSeconds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    if (mode === 'register') {
      if (passwordErrors.length > 0) {
        setError('Password does not meet requirements');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    }

    if (mode === 'reset-password') {
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (passwordErrors.length > 0) {
        setError('Password does not meet requirements');
        return;
      }
    }

    setIsLoading(true);

    try {
      if (mode === 'login') {
        await onLogin(email, password);
      } else if (mode === 'register') {
        await onRegister(email, password, displayName);
      } else if (mode === 'forgot-password') {
        const response = await authApi.requestPasswordReset(email);
        setSuccessMessage(response.message);
        setMode('login');
      } else if (mode === 'reset-password') {
        await authApi.resetPassword(resetToken, password);
        setSuccessMessage('Password reset successful! Please login with your new password.');
        setMode('login');
      }
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      
      if (isRateLimitError(err)) {
        setRateLimitSeconds(err.retryAfter || 60);
        setError(`Too many attempts. Please wait ${err.retryAfter || 60} seconds.`);
        return;
      }
      
      if (isAccountLockedError(err)) {
        setError('Account temporarily locked due to too many failed attempts. Try again in 15 minutes.');
        return;
      }
      
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const showTabs = mode === 'login' || mode === 'register';

  return (
    <div className="p-2">
      {showTabs && (
        <div className="flex mb-6 border-b-2 border-[var(--border-secondary)]">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); setSuccessMessage(''); }}
            className={`px-5 py-2.5 mx-1 font-medium transition-all duration-200 rounded-tl-lg
              ${mode === 'login' 
                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' 
                : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]'
              }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(''); setSuccessMessage(''); }}
            className={`px-5 py-2.5 mx-1 font-medium transition-all duration-200 rounded-tr-lg
              ${mode === 'register' 
                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' 
                : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]'
              }`}
          >
            Register
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="p-6 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-secondary)]">
          {/* Error Message */}
          {error && (
            <div className="p-3 mb-4 rounded-lg text-sm"
              style={{ 
                background: 'rgba(239, 68, 68, 0.1)', 
                border: '1px solid rgba(239, 68, 68, 0.3)', 
                color: '#ef4444' 
              }}
            >
              {rateLimitSeconds > 0 && `⏳ ${rateLimitSeconds}s — `}
              {error}
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="p-3 mb-4 rounded-lg text-sm"
              style={{ 
                background: 'rgba(34, 197, 94, 0.1)', 
                border: '1px solid rgba(34, 197, 94, 0.3)', 
                color: '#22c55e' 
              }}
            >
              ✓ {successMessage}
            </div>
          )}

          {/* Display Name - Register only */}
          {mode === 'register' && (
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-[var(--text-primary)]">
                Display Name *
              </label>
              <input
                type="text"
                placeholder="Choose a display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full px-4 py-3 text-base rounded-lg border border-[var(--border-primary)] 
                  bg-[var(--input-bg)] text-[var(--text-primary)] transition-all duration-200
                  focus:outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--glow)]"
              />
            </div>
          )}

          {/* Email */}
          {(mode === 'register' || mode === 'forgot-password' || mode === 'login') && (
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-[var(--text-primary)]">
                Email
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 text-base rounded-lg border border-[var(--border-primary)] 
                  bg-[var(--input-bg)] text-[var(--text-primary)] transition-all duration-200
                  focus:outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--glow)]"
              />
            </div>
          )}

          {/* Reset Token */}
          {mode === 'reset-password' && (
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-[var(--text-primary)]">
                Reset Token *
              </label>
              <input
                type="text"
                placeholder="Paste the token from your email"
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                required
                className="w-full px-4 py-3 text-base rounded-lg border border-[var(--border-primary)] 
                  bg-[var(--input-bg)] text-[var(--text-primary)] transition-all duration-200
                  focus:outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--glow)]"
              />
            </div>
          )}

          {/* Password */}
          {(mode === 'login' || mode === 'register' || mode === 'reset-password') && (
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-[var(--text-primary)]">
                Password {mode === 'register' && '*'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={mode === 'login' ? 'Enter your password' : 'Create a password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 text-base rounded-lg border border-[var(--border-primary)] 
                    bg-[var(--input-bg)] text-[var(--text-primary)] transition-all duration-200
                    focus:outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--glow)]"
                  style={{ paddingRight: '3rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none 
                    cursor-pointer text-[var(--text-muted)] text-sm p-1"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {/* Password Strength Meter - Show for register and reset-password */}
              {(mode === 'register' || mode === 'reset-password') && password && (
                <div className="mt-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-[var(--text-muted)]">Password Strength</span>
                    <span className="text-xs font-medium" style={{ color: getStrengthInfo(passwordStrength).color }}>
                      {getStrengthInfo(passwordStrength).label}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-300"
                      style={{ 
                        width: `${passwordStrength}%`,
                        backgroundColor: getStrengthInfo(passwordStrength).color
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Confirm Password */}
          {(mode === 'register' || mode === 'reset-password') && (
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-[var(--text-primary)]">
                Confirm Password *
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-3 text-base rounded-lg border border-[var(--border-primary)] 
                  bg-[var(--input-bg)] text-[var(--text-primary)] transition-all duration-200
                  focus:outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--glow)]"
              />
            </div>
          )}

          {/* Password Requirements - Show for both register and reset-password */}
          {(mode === 'register' || mode === 'reset-password') && password && (
            <div className="mb-6 p-3 rounded-lg bg-[var(--bg-tertiary)]">
              <div className="text-xs font-medium text-[var(--text-secondary)] mb-2">
                {mode === 'reset-password' ? 'New Password Requirements:' : 'Password Requirements:'}
              </div>
              {PASSWORD_REQUIREMENTS.map((req) => (
                <div 
                  key={req.label}
                  className="flex items-center gap-2 text-xs mb-1"
                  style={{ color: req.test(password) ? '#22c55e' : 'var(--text-muted)' }}
                >
                  <span>{req.test(password) ? '✓' : '○'}</span>
                  <span>{req.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Google Sign-In Button - Show for login and register */}
          {(mode === 'login' || mode === 'register') && (
            <div className="mb-4">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-lg font-medium text-base transition-all duration-200
                  bg-white text-gray-700 border border-gray-300 hover:bg-gray-50
                  disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center justify-center gap-3"
              >
                <GoogleIcon />
                {isLoading ? 'Please wait...' : mode === 'login' ? 'Continue with Google' : 'Sign up with Google'}
              </button>
            </div>
          )}

          {/* Divider */}
          {(mode === 'login' || mode === 'register') && (
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--border-secondary)]"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[var(--bg-secondary)] px-2 text-[var(--text-muted)]">Or</span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || rateLimitSeconds > 0}
            className={`w-full py-3 rounded-lg font-medium text-base transition-all duration-200
              ${(mode === 'login' || mode === 'reset-password')
                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5'
                : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5'
              }
              disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
            style={{ boxShadow: 'var(--glow)' }}
          >
            {isLoading ? 'Please wait...' : 
             rateLimitSeconds > 0 ? `Wait ${rateLimitSeconds}s...` :
             mode === 'login' ? 'Login with Email' :
             mode === 'register' ? 'Create Account with Email' :
             mode === 'forgot-password' ? 'Send Reset Link' :
             'Reset Password'}
          </button>

          {/* Forgot Password Link */}
          {mode === 'login' && (
            <div className="mt-4 text-center">
              <span 
                className="text-sm cursor-pointer underline text-[var(--accent-primary)] hover:text-[var(--accent-secondary)]"
                onClick={() => { setMode('forgot-password'); setError(''); setSuccessMessage(''); }}
              >
                Forgot Password?
              </span>
            </div>
          )}

          {/* Back to Login */}
          {(mode === 'forgot-password' || mode === 'reset-password') && (
            <div className="mt-4 text-center">
              <span 
                className="text-sm cursor-pointer underline text-[var(--accent-primary)] hover:text-[var(--accent-secondary)]"
                onClick={() => { setMode('login'); setError(''); setSuccessMessage(''); }}
              >
                Back to Login
              </span>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default AuthForm;

