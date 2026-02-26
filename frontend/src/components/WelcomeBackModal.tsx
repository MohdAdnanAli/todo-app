import React from 'react';
import { LogIn } from 'lucide-react';

interface WelcomeBackModalProps {
  isOpen: boolean;
  userName: string;
  onGetIn: () => void;
  isLoading?: boolean;
}

const WelcomeBackModal: React.FC<WelcomeBackModalProps> = ({
  isOpen,
  userName,
  onGetIn,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="relative rounded-2xl p-8 w-[90%] max-w-[420px] text-center"
        style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-secondary)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
        }}
      >
        <h2 className="m-0 mb-2 text-2xl font-semibold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
          Welcome back! 👋
        </h2>
        <p className="m-0 mb-6 text-sm text-[var(--text-secondary)]">
          Hello, <span className="font-semibold text-[var(--text-primary)]">{userName}</span>
        </p>

        <button
          onClick={onGetIn}
          disabled={isLoading}
          className="w-full py-3 rounded-lg font-medium text-base
            bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md
            hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md disabled:hover:translate-y-0
            flex items-center justify-center gap-2"
          style={{ boxShadow: 'var(--glow)' }}
        >
          <LogIn size={18} />
          {isLoading ? 'Loading your tasks...' : 'Get In'}
        </button>
      </div>
    </div>
  );
};

export default WelcomeBackModal;
