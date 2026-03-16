import React, { useState, useEffect, memo } from 'react';
import type { MessageType } from '../types';
import { LED_COLORS } from '../types';

export interface LEDIndicatorProps {
  message?: string;
  messageType: MessageType;
  variant?: 'default' | 'small-screen-header' | 'sync';
  size?: number;
}

const LEDIndicator: React.FC<LEDIndicatorProps> = memo(({ 
  message, 
  messageType, 
  variant = 'default' as const, 
  size 
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showAutoMessage, setShowAutoMessage] = useState(false);
  const colors = LED_COLORS[messageType];
  
  const defaultSize = size ?? 3;
  const ledSize = `${defaultSize}px`;
  
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
  
  const containerClass = 
    variant === 'sync'
      ? "absolute -top-1 -right-1 z-20 pointer-events-none" 
    : variant === 'small-screen-header'
      ? "flex items-center" 
      : "absolute right-16 top-1/2 -translate-y-1/2 cursor-pointer";
  
  const animationClass = variant === 'sync' 
    ? messageType === 'loading' 
      ? 'animate-sync-flicker' 
      : messageType === 'pending' 
      ? 'animate-sync-pulse' 
      : 'animate-sync-alert'
    : message 
      ? 'animate-pulse'
      : '';
  
  return (
    <div 
      className={containerClass}
      onMouseEnter={() => variant !== 'sync' && setShowTooltip(true)}
      onMouseLeave={() => variant !== 'sync' && setShowTooltip(false)}
    >
      <div
        className={`rounded-full transition-all duration-300 border-2 ${animationClass}`}
        style={{
          width: ledSize,
          height: ledSize,
          backgroundColor: colors.bg,
          boxShadow: `0 0 ${defaultSize * 5}px ${colors.glow}, 0 0 ${defaultSize * 2.5}px ${colors.glow}, 0 0 ${defaultSize}px ${colors.bg}`,
          borderColor: colors.border,
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
        @keyframes sync-flicker {
          0%, 100% { 
            background-color: ${colors.bg};
            box-shadow: 0 0 ${defaultSize * 5}px ${colors.glow}, 0 0 ${defaultSize * 2.5}px ${colors.glow}, 0 0 ${defaultSize}px ${colors.bg};
          }
          50% { 
            background-color: #9ca3af;
            box-shadow: 0 0 ${defaultSize * 5}px rgba(156, 163, 175, 0.5), 0 0 ${defaultSize * 2.5}px rgba(156, 163, 175, 0.3);
          }
        }
        @keyframes sync-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.3); }
        }
        @keyframes sync-alert {
          0%, 100% { 
            transform: scale(1) rotate(-5deg);
            box-shadow: 0 0 ${defaultSize * 6}px ${colors.glow};
          }
          50% { 
            transform: scale(1.2) rotate(5deg);
            box-shadow: 0 0 ${defaultSize * 8}px ${colors.glow};
          }
        }
      `}</style>
    </div>
  );
});

LEDIndicator.displayName = 'LEDIndicator';

export default LEDIndicator;

