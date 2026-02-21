import React, { useState, useEffect } from 'react';
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

const AuthForm: React.FC<AuthFormProps> = ({ onLogin, onRegister }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [resetToken, setResetToken] = useState('');
  
  // Error and loading states
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Password validation for registration
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  
  // Rate limiting
  const [rateLimitSeconds, setRateLimitSeconds] = useState(0);

  // Validate password on change
  useEffect(() => {
    if (mode === 'register' && password) {
      const errors = PASSWORD_REQUIREMENTS.filter(req => !req.test(password)).map(req => req.label);
      setPasswordErrors(errors);
    } else {
      setPasswordErrors([]);
    }
  }, [password, mode]);

  // Countdown for rate limiting
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
      
      // Handle rate limiting
      if (isRateLimitError(err)) {
        setRateLimitSeconds(err.retryAfter || 60);
        setError(`Too many attempts. Please wait ${err.retryAfter || 60} seconds.`);
        return;
      }
      
      // Handle account lockout
      if (isAccountLockedError(err)) {
        setError('Account temporarily locked due to too many failed attempts. Try again in 15 minutes.');
        return;
      }
      
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

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
    color: 'var(--text-muted)',
    fontSize: '0.875rem',
    padding: '0.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const buttonPrimaryStyle: React.CSSProperties = {
    padding: '0.75rem 1.5rem',
    background: 'var(--accent-gradient)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: isLoading ? 'not-allowed' : 'pointer',
    fontWeight: 500,
    fontSize: '0.95rem',
    transition: 'all 0.2s ease',
    boxShadow: 'var(--glow)',
    opacity: isLoading ? 0.7 : 1,
  };

  const buttonSecondaryStyle: React.CSSProperties = {
    padding: '0.75rem 1.5rem',
    background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: isLoading ? 'not-allowed' : 'pointer',
    fontWeight: 500,
    fontSize: '0.95rem',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)',
    opacity: isLoading ? 0.7 : 1,
  };

  const toggleActiveStyle: React.CSSProperties = {
    padding: '0.6rem 1.2rem',
    marginRight: '0.5rem',
    background: 'var(--accent-gradient)',
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
    background: 'var(--bg-tertiary)',
    color: 'var(--text-secondary)',
    border: 'none',
    borderRadius: '8px 8px 0 0',
    cursor: 'pointer',
    fontWeight: 500,
    transition: 'all 0.2s ease',
  };

  const errorStyle: React.CSSProperties = {
    padding: '0.75rem',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '8px',
    color: '#ef4444',
    fontSize: '0.875rem',
    marginBottom: '1rem',
  };

  const successStyle: React.CSSProperties = {
    padding: '0.75rem',
    background: 'rgba(34, 197, 94, 0.1)',
    border: '1px solid rgba(34, 197, 94, 0.3)',
    borderRadius: '8px',
    color: '#22c55e',
    fontSize: '0.875rem',
    marginBottom: '1rem',
  };

  const linkStyle: React.CSSProperties = {
    color: 'var(--accent-primary)',
    cursor: 'pointer',
    textDecoration: 'underline',
    fontSize: '0.875rem',
  };

  const passwordReqStyle = (met: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.75rem',
    color: met ? '#22c55e' : 'var(--text-muted)',
    marginBottom: '0.25rem',
  });

  // Show tabs only for login/register modes
  const showTabs = mode === 'login' || mode === 'register';

  return (
    <div style={{ padding: '0.5rem' }}>
      {showTabs && (
        <div style={{ 
          marginBottom: '1.5rem', 
          display: 'flex', 
          gap: '0',
          borderBottom: '2px solid var(--border-secondary)',
        }}>
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); setSuccessMessage(''); }}
            style={mode === 'login' ? toggleActiveStyle : toggleInactiveStyle}
            onMouseOver={(e) => {
              if (mode !== 'login') {
                e.currentTarget.style.background = 'var(--hover-bg)';
              }
            }}
            onMouseOut={(e) => {
              if (mode !== 'login') {
                e.currentTarget.style.background = 'var(--bg-tertiary)';
              }
            }}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(''); setSuccessMessage(''); }}
            style={mode === 'register' ? toggleActiveStyle : toggleInactiveStyle}
            onMouseOver={(e) => {
              if (mode !== 'register') {
                e.currentTarget.style.background = 'var(--hover-bg)';
              }
            }}
            onMouseOut={(e) => {
              if (mode !== 'register') {
                e.currentTarget.style.background = 'var(--bg-tertiary)';
              }
            }}
          >
            Register
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ 
          padding: '1.5rem', 
          background: 'var(--bg-secondary)', 
          borderRadius: '12px',
          border: '1px solid var(--border-secondary)',
        }}>
          {/* Error Message */}
          {error && (
            <div style={errorStyle}>
              {rateLimitSeconds > 0 && `⏳ ${rateLimitSeconds}s — `}
              {error}
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div style={successStyle}>
              ✓ {successMessage}
            </div>
          )}

          {/* Display Name - Register only */}
          {mode === 'register' && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.875rem' }}>
                Display Name *
              </label>
              <input
                type="text"
                placeholder="Choose a display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
          )}

          {/* Email - Register and Forgot Password */}
          {(mode === 'register' || mode === 'forgot-password' || mode === 'login') && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.875rem' }}>
                Email
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
          )}

          {/* Reset Token - Reset Password mode */}
          {mode === 'reset-password' && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.875rem' }}>
                Reset Token *
              </label>
              <input
                type="text"
                placeholder="Paste the token from your email"
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
          )}

          {/* Password - Login, Register, Reset Password */}
          {(mode === 'login' || mode === 'register' || mode === 'reset-password') && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.875rem' }}>
                Password {mode === 'register' && '*'}
              </label>
              <div style={passwordInputContainerStyle}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={mode === 'login' ? 'Enter your password' : 'Create a password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
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
          )}

          {/* Confirm Password - Register and Reset Password */}
          {(mode === 'register' || mode === 'reset-password') && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.875rem' }}>
                Confirm Password *
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
          )}

          {/* Password Requirements - Register only */}
          {mode === 'register' && password && (
            <div style={{ marginBottom: '1.5rem', padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 500 }}>
                Password Requirements:
              </div>
              {PASSWORD_REQUIREMENTS.map((req, i) => (
                <div key={i} style={passwordReqStyle(req.test(password))}>
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
            style={mode === 'login' || mode === 'reset-password' ? 
              { ...buttonPrimaryStyle, width: '100%' } : 
              { ...buttonSecondaryStyle, width: '100%' }}
            onMouseOver={(e) => {
              if (!isLoading && rateLimitSeconds === 0) {
                e.currentTarget.style.transform = 'translateY(-1px)';
                if (mode === 'login' || mode === 'reset-password') {
                  e.currentTarget.style.boxShadow = '0 4px 8px var(--glow)';
                } else {
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.3)';
                }
              }
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              if (mode === 'login' || mode === 'reset-password') {
                e.currentTarget.style.boxShadow = 'var(--glow)';
              } else {
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(16, 185, 129, 0.2)';
              }
            }}
          >
            {isLoading ? 'Please wait...' : 
             rateLimitSeconds > 0 ? `Wait ${rateLimitSeconds}s...` :
             mode === 'login' ? 'Login' :
             mode === 'register' ? 'Create Account' :
             mode === 'forgot-password' ? 'Send Reset Link' :
             'Reset Password'}
          </button>

          {/* Forgot Password Link - Login only */}
          {mode === 'login' && (
            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
              <span 
                style={linkStyle}
                onClick={() => { setMode('forgot-password'); setError(''); setSuccessMessage(''); }}
              >
                Forgot Password?
              </span>
            </div>
          )}

          {/* Back to Login - Forgot/Reset Password modes */}
          {(mode === 'forgot-password' || mode === 'reset-password') && (
            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
              <span 
                style={linkStyle}
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

