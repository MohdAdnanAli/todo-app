import React, { useState, useEffect, memo } from 'react';
import type { MessageType } from '../types';
import { LED_COLORS } from '../types';

interface LEDIndicatorProps {
  message: string;
  messageType: MessageType;
}

const LEDIndicator: React.FC<LEDIndicatorProps> = memo(({ message, messageType }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showAutoMessage, setShowAutoMessage] = useState(false);
  const colors = LED_COLORS[messageType];
  
  useEffect(() => {
    if (message) {
      setShowAutoMessage(true);
      const timer = setTimeout(() => {
        setShowAutoMessage(false);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [message]);
  
  const shouldShowMessage = showAutoMessage || showTooltip;
  
  return (
    <div 
      className="absolute right-16 top-1/2 -translate-y-1/2 cursor-pointer"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div
        className="w-4 h-4 rounded-full transition-all duration-300"
        style={{
          backgroundColor: colors.bg,
          boxShadow: `0 0 10px ${colors.glow}, 0 0 4px ${colors.bg}`,
          border: `2px solid ${colors.border}`,
          animation: message ? 'pulse 1s ease-in-out' : 'none',
        }}
      />
      
      {shouldShowMessage && message && (
        <div
          className="absolute top-full right-0 mt-2 px-3 py-2 rounded-md text-xs whitespace-nowrap z-50 animate-fade-in"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            boxShadow: 'var(--shadow)',
            border: `1px solid ${colors.border}`,
          }}
        >
          {message}
          <div
            className="absolute -top-1.5 right-3 rotate-45 w-2.5 h-2.5"
            style={{
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
      `}</style>
    </div>
  );
});

LEDIndicator.displayName = 'LEDIndicator';

export default LEDIndicator;
