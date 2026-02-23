import React, { useState, useEffect, memo } from 'react';
import { authApi, getApiErrorMessage, isRateLimitError, isAccountLockedError } from '../services/api';
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

const AuthForm: React.FC<AuthFormProps> = memo(({ onLogin, onRegister }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [resetToken, setResetToken] = useState('');
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [rateLimitSeconds, setRateLimitSeconds] = useState(0);

  useEffect(() => {
    if (mode === 'register' && password) {
      const errors = PASSWORD_REQUIREMENTS.filter(req => !req.test(password)).map(req => req.label);
      setPasswordErrors(errors);
    } else {
      setPasswordErrors([]);
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

          {/* Password Requirements */}
          {mode === 'register' && password && (
            <div className="mb-6 p-3 rounded-lg bg-[var(--bg-tertiary)]">
              <div className="text-xs font-medium text-[var(--text-secondary)] mb-2">Password Requirements:</div>
              {PASSWORD_REQUIREMENTS.map((req, i) => (
                <div 
                  key={i} 
                  className="flex items-center gap-2 text-xs mb-1"
                  style={{ color: req.test(password) ? '#22c55e' : 'var(--text-muted)' }}
                >
                  <span>{req.test(password) ? '✓' : '○'}</span>
                  <span>{req.label}</span>
                </div>
              ))}
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
             mode === 'login' ? 'Login' :
             mode === 'register' ? 'Create Account' :
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
});

AuthForm.displayName = 'AuthForm';

export default AuthForm;
