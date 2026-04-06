import React from 'react';
import type { MessageType } from '../types';
import { LED_COLORS } from '../types';

interface MessageBannerProps {
  message: string;
  messageType: MessageType;
  onClose?: () => void;
}

const MessageBanner: React.FC<MessageBannerProps> = ({ 
  message, 
  messageType,
  onClose 
}) => {
  if (!message) return null;
  
  const colors = LED_COLORS[messageType] || { bg: '#6b7280', glow: '#9ca3af', border: '#6b7280' };
  
  const getIcon = () => {
    switch (messageType) {
      case 'error': return '⚠️';
      case 'success': return '✅';
      case 'warning': return '⚡';
      case 'loading': return '⏳';
      case 'info': return 'ℹ️';
      case 'attention': return '🔔';
      case 'primary': return '✨';
      case 'accent': return '💜';
      case 'system': return '🔧';
      case 'personal': return '👤';
      case 'pending': return '⏰';
      case 'idle': return '💤';
      default: return null;
    }
  };
  
  return (
    <div
      style={{
        padding: '0.75rem 1rem',
        marginBottom: '1rem',
        borderRadius: '8px',
        backgroundColor: colors?.bg ?? '#6b7280',
        color: 'white',
        fontWeight: 500,
        fontSize: '0.9rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: `0 2px 8px ${colors?.glow ?? '#9ca3af'}`,
        border: `1px solid ${colors?.border ?? '#6b7280'}`,
        animation: 'fadeIn 0.3s ease',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {getIcon()}
        {message}
      </span>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            padding: '0.25rem',
            fontSize: '1rem',
            opacity: 0.8,
            transition: 'opacity 0.2s',
          }}
          onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
          onMouseOut={(e) => e.currentTarget.style.opacity = '0.8'}
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default MessageBanner;

