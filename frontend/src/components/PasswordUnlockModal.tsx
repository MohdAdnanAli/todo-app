import React, { useState } from 'react';

interface PasswordUnlockModalProps {
  isOpen: boolean;
  onUnlock: (password: string) => Promise<void>;
  isUnlocking?: boolean;
  error?: string;
}

const PasswordUnlockModal: React.FC<PasswordUnlockModalProps> = ({
  isOpen,
  onUnlock,
  isUnlocking = false,
  error = '',
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim()) {
      await onUnlock(password);
      setPassword('');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="relative rounded-2xl p-8 w-[90%] max-w-[420px]"
        style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-secondary)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
        }}
      >
        <h2 className="m-0 mb-2 text-xl font-semibold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
          Unlock Your Todos
        </h2>
        <p className="m-0 mb-6 text-sm text-[var(--text-secondary)]">
          Enter your password to decrypt and access your tasks
        </p>

        {error && (
          <div
            className="p-3 mb-4 rounded-lg text-sm"
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium text-[var(--text-primary)]">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isUnlocking}
                autoFocus
                className="w-full px-4 py-3 text-base rounded-lg border border-[var(--border-primary)]
                  bg-[var(--input-bg)] text-[var(--text-primary)] transition-all duration-200
                  focus:outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--glow)]
                  disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isUnlocking}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] 
                  hover:text-[var(--text-primary)] transition-colors disabled:cursor-not-allowed"
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isUnlocking || !password.trim()}
            className="w-full py-3 rounded-lg font-medium text-sm
              bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md
              hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md disabled:hover:translate-y-0"
            style={{ boxShadow: 'var(--glow)' }}
          >
            {isUnlocking ? 'Unlocking...' : 'Unlock Todos'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PasswordUnlockModal;
