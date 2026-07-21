import React from 'react';

const Card = ({
  children,
  className = '',
  hoverEffect = true,
  glass = false
}) => {
  const baseCard = glass ? 'glass-card' : 'bg-bg-card border border-border';
  const hoverStyle = hoverEffect ? 'hover:shadow-lg hover:border-slate-300 transition-all duration-300 transform hover:-translate-y-0.5' : '';

  return (
    <div className={`rounded-xl p-6 ${baseCard} ${hoverStyle} ${className}`}>
      {children}
    </div>
  );
};

export default Card;
