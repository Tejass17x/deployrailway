import React from 'react';
import { motion } from 'framer-motion';

const Card = ({
  children,
  className = '',
  onClick,
  hoverEffect = false,
  glass = false,
  padding = 'p-6',
  gradientBorder = false, // New feature prop
}) => {
  const baseStyles = 'rounded-2xl transition-all duration-300 relative';
  
  // Adjusted borders to handle standard vs gradient border layouts gracefully
  const themeStyles = glass
    ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-lg' + (gradientBorder ? '' : ' border border-white/20 dark:border-slate-800/50')
    : 'bg-bg-card shadow-sm' + (gradientBorder ? '' : ' border border-border');
    
  const hoverStyles = hoverEffect
    ? 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer' + (gradientBorder ? '' : ' hover:border-slate-300 dark:hover:border-slate-700')
    : '';

  const Component = onClick || gradientBorder ? motion.div : 'div';
  
  // Unified motion configuration to support both click interactions and gradient animation
  const motionProps = (onClick || hoverEffect)
    ? {
        whileHover: { scale: onClick ? 1.01 : 1 },
        whileTap: onClick ? { scale: 0.99 } : {},
        onClick
      }
    : {};

  return (
    <Component
      className={`${baseStyles} ${themeStyles} ${hoverStyles} ${padding} ${className}`}
      {...motionProps}
    >
      {/* Gradient Border Overlay */}
      {gradientBorder && (
        <div className="absolute inset-0 p-[1px] rounded-2xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 -z-10 [mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] [mask-composite:xor] [webkit-mask-composite:xor] pointer-events-none opacity-70 dark:opacity-50" />
      )}
      
      {children}
    </Component>
  );
};

export default Card;
