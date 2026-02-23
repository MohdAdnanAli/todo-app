import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../types';

// Password requirements for validation
const PASSWORD_REQUIREMENTS = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { label: 'One number', test: (p: string) => /[0-9]/.test(p) },
  { label: 'One special character (!@#$%^&*)', test: (p: string) => /[!@#$%^&*]/.test(p) },
];

// Parse URL params manually (no react-router-dom needed)
const getUrlParams = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    token: params.get('token'),
    type: params.get('type'),
  };
};

const EmailAuthPage: React.FC = () => {
  const [token, setToken] = useState<string>('');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [action, setAction] = useState<'verify' | 'reset' | 'none'>('none');

  useEffect(() => {
    const params = getUrlParams();
    
    if (!params.token) {
      setStatus('error');
      setMessage('No token provided. Please check your email link.');
      return;
    }

    setToken(params.token);

    // Determine action based on URL path or type param
    const isVerify = window.location.pathname.includes('verify-email') || params.type === 'verify';
    const isReset = window.location.pathname.includes('reset-password') || params.type === 'reset';

    if (isVerify) {
      setAction('verify');
      handleVerifyEmail(params.token);
    } else if (isReset) {
      setAction('reset');
      setStatus('loading');
    } else {
      setStatus('error');
      setMessage('Invalid link. Please check your email or request a new link.');
    }
  }, []);

  const handleVerifyEmail = async (verifyToken: string) => {
    try {
      await axios.post(
        `${API_URL}/api/auth/verify-email`,
        { token: verifyToken },
        { withCredentials: true }
      );
      setStatus('success');
      setMessage('Email verified! You can now login.');
    } catch (err: any) {
      setStatus('error');
      setMessage(err.response?.data?.error || 'Verification failed. Token may be expired.');
    }
  };

  const containerStyle: React.CSSProperties = {
    background: 'var(--bg-primary)',
    borderRadius: '16px',
    boxShadow: 'var(--shadow)',
    padding: '2.5rem',
    maxWidth: '420px',
    width: '100%',
    margin: 'auto',
    textAlign: 'center',
  };

  if (action === 'reset') {
    return <PasswordResetForm token={token} />;
  }

  return (
    <div style={containerStyle}>
      {status === 'loading' && (
        <>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Verifying Email...</h2>
        </>
      )}

      {status === 'success' && (
        <>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
          <h2 style={{ color: '#22c55e', marginBottom: '0.5rem' }}>Success!</h2>
        </>
      )}

      {status === 'error' && (
        <>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
          <h2 style={{ color: '#ef4444', marginBottom: '0.5rem' }}>Error</h2>
        </>
      )}

      <p style={{ color: 'var(--text-secondary)' }}>{message}</p>

      {status !== 'loading' && (
        <button
          onClick={() => window.location.href = '/'}
          style={{
            padding: '0.875rem 1.5rem',
            background: 'var(--accent-gradient)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: '1rem',
            marginTop: '1rem',
          }}
        >
          Go to Login
        </button>
      )}
    </div>
  );
};

// Password Reset Form Component
const PasswordResetForm: React.FC<{ token: string }> = ({ token }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  // Real-time password validation
  useEffect(() => {
    if (password) {
      const errors = PASSWORD_REQUIREMENTS.filter(req => !req.test(password)).map(req => req.label);
      setPasswordErrors(errors);
    } else {
      setPasswordErrors([]);
    }
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password requirements
    if (passwordErrors.length > 0) {
      setError('Password does not meet requirements');
      return;
    }

    setIsLoading(true);

    try {
      await axios.post(
        `${API_URL}/api/auth/reset-password`,
        { token, password },
        { withCredentials: true }
      );
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset password. The token may be expired.');
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
    marginBottom: '0.5rem',
    boxSizing: 'border-box',
  };

  const containerStyle: React.CSSProperties = {
    background: 'var(--bg-primary)',
    borderRadius: '16px',
    boxShadow: 'var(--shadow)',
    padding: '2.5rem',
    maxWidth: '420px',
    width: '100%',
    margin: 'auto',
    textAlign: 'center',
  };

  if (success) {
    return (
      <div style={containerStyle}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
        <h2 style={{ color: '#22c55e', marginBottom: '0.5rem' }}>Password Reset!</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Your password has been reset. You can now login with your new password.
        </p>
        <button
          onClick={() => window.location.href = '/'}
          style={{
            padding: '0.875rem 1.5rem',
            background: 'var(--accent-gradient)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: '1rem',
          }}
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <h2 style={{ 
        margin: '0 0 1.5rem 0', 
        color: 'var(--text-primary)',
        background: 'var(--accent-gradient)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}>
        Reset Password
      </h2>

      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        Enter your new password below.
      </p>

      {error && (
        <div style={{ 
          padding: '0.75rem', 
          background: 'rgba(239, 68, 68, 0.1)', 
          borderRadius: '8px',
          color: '#ef4444',
          marginBottom: '1rem',
          fontSize: '0.875rem',
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ textAlign: 'left', marginBottom: '0.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.875rem' }}>
            New Password
          </label>
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            placeholder="Enter new password"
            required
          />
        </div>

        <div style={{ textAlign: 'left', marginBottom: '0.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.875rem' }}>
            Confirm Password
          </label>
          <input
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={inputStyle}
            placeholder="Confirm new password"
            required
          />
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem', cursor: 'pointer', justifyContent: 'center' }}>
          <input
            type="checkbox"
            checked={showPassword}
            onChange={(e) => setShowPassword(e.target.checked)}
          />
          Show password
        </label>

        {/* Password Requirements Display */}
        {password && (
          <div style={{ 
            textAlign: 'left', 
            marginBottom: '1.5rem', 
            padding: '0.75rem', 
            background: 'var(--bg-tertiary)', 
            borderRadius: '8px',
            fontSize: '0.75rem',
          }}>
            <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 500 }}>
              Password Requirements:
            </div>
            {PASSWORD_REQUIREMENTS.map((req, i) => (
              <div 
                key={i}
                style={{ 
                  color: req.test(password) ? '#22c55e' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.25rem',
                }}
              >
                <span>{req.test(password) ? '✓' : '○'}</span>
                <span>{req.label}</span>
              </div>
            ))}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || passwordErrors.length > 0}
          style={{
            padding: '0.875rem 1.5rem',
            background: 'var(--accent-gradient)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: isLoading || passwordErrors.length > 0 ? 'not-allowed' : 'pointer',
            fontWeight: 500,
            fontSize: '1rem',
            width: '100%',
            opacity: isLoading ? 0.7 : 1,
          }}
        >
          {isLoading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
    </div>
  );
};

export default EmailAuthPage;

