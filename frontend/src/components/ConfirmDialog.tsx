import React from 'react';
import { AlertTriangle, X, Check } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'danger',
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: 'text-red-500',
      iconBg: 'bg-red-500/10',
      button: 'bg-red-600 hover:bg-red-700',
    },
    warning: {
      icon: 'text-yellow-500',
      iconBg: 'bg-yellow-500/10',
      button: 'bg-yellow-600 hover:bg-yellow-700',
    },
    info: {
      icon: 'text-blue-500',
      iconBg: 'bg-blue-500/10',
      button: 'bg-blue-600 hover:bg-blue-700',
    },
  };

  const style = variantStyles[variant];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onCancel();
      }}
    >
      <div
        className="
          w-full max-w-sm
          bg-[var(--bg-primary)] rounded-2xl p-6
          border border-[var(--border-secondary)]
          shadow-[0_20px_40px_rgba(0,0,0,0.3)]
          animate-fade-in
        "
      >
        {/* Icon */}
        <div className={`flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full ${style.iconBg}`}>
          <AlertTriangle size={32} className={style.icon} />
        </div>

        {/* Title */}
        <h3
          className="text-xl font-semibold text-center mb-2"
          style={{
            color: 'var(--text-primary)',
          }}
        >
          {title}
        </h3>

        {/* Message */}
        <p
          className="text-center mb-6"
          style={{
            color: 'var(--text-secondary)',
          }}
        >
          {message}
        </p>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="
              flex-1 px-4 py-3 rounded-lg font-medium text-base
              bg-[var(--bg-tertiary)] text-[var(--text-primary)]
              border border-[var(--border-secondary)]
              hover:bg-[var(--hover-bg)]
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center justify-center gap-2
            "
          >
            <X size={18} />
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`
              flex-1 px-4 py-3 rounded-lg font-medium text-base text-white
              ${style.button}
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center justify-center gap-2
            `}
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Check size={18} />
                {confirmLabel}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
