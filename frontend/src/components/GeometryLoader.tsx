import React, { memo } from 'react';

const GeometryLoader: React.FC = memo(() => {
  return (
    <div className="relative w-[120px] h-[120px] mx-auto mb-8">
      {/* Rotating outer ring */}
      <div 
        className="absolute inset-0 rounded-full animate-spin" 
        style={{ 
          border: '3px solid transparent',
          borderTopColor: '#818cf8',
          animationDuration: '1.5s',
        }} 
      />
      
      {/* Counter-rotating middle ring */}
      <div 
        className="absolute rounded-full animate-spin" 
        style={{ 
          inset: '12px',
          border: '3px solid transparent',
          borderBottomColor: '#f43f5e',
          animationDuration: '1s',
          animationDirection: 'reverse',
        }} 
      />
      
      {/* Inner pulsing circle */}
      <div 
        className="absolute rounded-full animate-pulse" 
        style={{ 
          inset: '28px',
          background: 'linear-gradient(135deg, #818cf8 0%, #f43f5e 100%)',
          animationDuration: '1.2s',
        }} 
      />
      
      {/* Floating geometric shapes */}
      <div 
        className="absolute animate-float"
        style={{ 
          top: '0',
          left: '50%',
          width: '8px',
          height: '8px',
          background: '#fb923c',
          borderRadius: '2px',
          transform: 'translateX(-50%)',
        }} 
      />
      <div 
        className="absolute animate-float"
        style={{ 
          bottom: '10px',
          right: '10px',
          width: '0',
          height: '0',
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderBottom: '10px solid #34d399',
          animationDelay: '0.5s',
        }} 
      />
      <div 
        className="absolute animate-float"
        style={{ 
          bottom: '15px',
          left: '10px',
          width: '10px',
          height: '10px',
          background: 'transparent',
          border: '2px solid #c084fc',
          borderRadius: '50%',
          animationDelay: '1s',
        }} 
      />
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(0.85); opacity: 0.7; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(-50%) rotate(0deg); }
          50% { transform: translateY(-8px) translateX(-50%) rotate(180deg); }
        }
        .animate-spin {
          animation: spin 1.5s linear infinite;
        }
        .animate-pulse {
          animation: pulse 1.2s ease-in-out infinite;
        }
        .animate-float {
          animation: float 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
});

GeometryLoader.displayName = 'GeometryLoader';

export default GeometryLoader;
