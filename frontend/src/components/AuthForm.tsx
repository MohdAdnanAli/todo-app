import React, { useState } from 'react';

type AuthMode = 'login' | 'register';

interface AuthFormProps {
  onLogin: (email: string, password: string) => void;
  onRegister: (email: string, password: string, displayName: string) => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onLogin, onRegister }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState('');

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
    cursor: 'pointer',
    fontWeight: 500,
    fontSize: '0.95rem',
    transition: 'all 0.2s ease',
    boxShadow: 'var(--glow)',
  };

  const buttonSecondaryStyle: React.CSSProperties = {
    padding: '0.75rem 1.5rem',
    background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 500,
    fontSize: '0.95rem',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)',
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login') {
      onLogin(email, password);
    } else {
      onRegister(email, password, displayName);
    }
  };

  return (
    <div style={{ padding: '0.5rem' }}>
      <div style={{ 
        marginBottom: '1.5rem', 
        display: 'flex', 
        gap: '0',
        borderBottom: '2px solid var(--border-secondary)',
      }}>
        <button
          type="button"
          onClick={() => setMode('login')}
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
          onClick={() => setMode('register')}
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

      <form onSubmit={handleSubmit}>
        <div style={{ 
          padding: '1.5rem', 
          background: 'var(--bg-secondary)', 
          borderRadius: '12px',
          border: '1px solid var(--border-secondary)',
        }}>
          {mode === 'register' && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.875rem' }}>Display Name</label>
              <input
                type="text"
                placeholder="Choose a display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                style={inputStyle}
              />
            </div>
          )}
          
          {mode === 'register' && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.875rem' }}>Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
              />
            </div>
          )}

          {mode === 'login' && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.875rem' }}>Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
              />
            </div>
          )}
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.875rem' }}>
              {mode === 'login' ? 'Password' : 'Password'}
            </label>
            <div style={passwordInputContainerStyle}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder={mode === 'login' ? 'Enter your password' : 'Create a password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
          
          <button
            type="submit"
            style={mode === 'login' ? { ...buttonPrimaryStyle, width: '100%' } : { ...buttonSecondaryStyle, width: '100%' }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              if (mode === 'login') {
                e.currentTarget.style.boxShadow = '0 4px 8px var(--glow)';
              } else {
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.3)';
              }
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              if (mode === 'login') {
                e.currentTarget.style.boxShadow = 'var(--glow)';
              } else {
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(16, 185, 129, 0.2)';
              }
            }}
          >
            {mode === 'login' ? 'Login' : 'Create Account'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AuthForm;

