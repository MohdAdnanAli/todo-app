import React, { useState, useEffect } from 'react';
import type { MessageType } from '../types';
import { LED_COLORS } from '../types';

interface LEDIndicatorProps {
  message: string;
  messageType: MessageType;
}

const LEDIndicator: React.FC<LEDIndicatorProps> = ({ message, messageType }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showAutoMessage, setShowAutoMessage] = useState(false);
  const colors = LED_COLORS[messageType];
  
  // Auto-show message for 2.5 seconds when message changes
  useEffect(() => {
    if (message) {
      setShowAutoMessage(true);
      const timer = setTimeout(() => {
        setShowAutoMessage(false);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [message]);
  
  // Show message tooltip if either auto-show is active OR user is hovering
  const shouldShowMessage = showAutoMessage || showTooltip;
  
  return (
    <div 
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      style={{
        position: 'absolute',
        right: '4rem',
        top: '20%',
        transform: 'translateY(-50%)',
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          backgroundColor: colors.bg,
          boxShadow: `0 0 10px ${colors.glow}, 0 0 4px ${colors.bg}`,
          border: `2px solid ${colors.border}`,
          transition: 'all 0.3s ease',
          animation: message ? 'pulse 1s ease-in-out' : 'none',
        }}
      />
      
      {/* Tooltip with full message - shows on hover OR auto for 2.5s */}
      {shouldShowMessage && message && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '0.7rem',
            padding: '0.5rem 0.75rem',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            borderRadius: '6px',
            fontSize: '0.75rem',
            whiteSpace: 'nowrap',
            zIndex: 100,
            boxShadow: 'var(--shadow)',
            border: `1px solid ${colors.border}`,
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          {message}
          <div
            style={{
              position: 'absolute',
              top: '-5px',
              right: '8px',
              transform: 'rotate(45deg)',
              width: '10px',
              height: '10px',
              backgroundColor: 'var(--bg-secondary)',
              borderLeft: `1px solid ${colors.border}`,
              borderTop: `1px solid ${colors.border}`,
            }}
          />
        </div>
      )}
      
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default LEDIndicator;

