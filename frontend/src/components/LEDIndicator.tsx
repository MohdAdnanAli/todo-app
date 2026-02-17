import React, { useState } from 'react';
import type { MessageType } from '../types';
import { LED_COLORS } from '../types';

interface LEDIndicatorProps {
  message: string;
  messageType: MessageType;
}

const LEDIndicator: React.FC<LEDIndicatorProps> = ({ message, messageType }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const colors = LED_COLORS[messageType];
  
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
        }}
      />
      
      {/* Tooltip with full message */}
      {showTooltip && message && (
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
    </div>
  );
};

export default LEDIndicator;

