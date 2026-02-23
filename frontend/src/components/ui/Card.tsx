import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  hover = false,
  onClick 
}) => {
  return (
    <div
      className={`
        bg-[var(--card-bg)] rounded-xl border border-[var(--border-secondary)] p-4
        transition-all duration-200
        ${hover ? 'cursor-pointer hover:bg-[var(--hover-bg)] hover:border-[var(--border-primary)] hover:translate-x-0.5' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card;

