import React from 'react';
import { motion } from 'framer-motion';

const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary', // 'primary', 'secondary', 'outline', 'ghost', 'danger'
  size = 'md', // 'sm', 'md', 'lg'
  disabled = false,
  loading = false,
  className = '',
  icon = null
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const variantStyles = {
    primary: 'bg-primary text-white hover:bg-primary-hover focus:ring-primary',
    secondary: 'bg-bg-card text-text-primary border border-border hover:bg-bg-page focus:ring-primary',
    outline: 'border border-primary text-primary hover:bg-light-blue focus:ring-primary',
    ghost: 'text-text-secondary hover:text-text-primary hover:bg-bg-page focus:ring-gray-300',
    danger: 'bg-accent-red text-white hover:bg-red-600 focus:ring-accent-red'
  };

  const isDisabled = disabled || loading;

  return (
    <motion.button
      whileHover={isDisabled ? {} : { scale: 1.02 }}
      whileTap={isDisabled ? {} : { scale: 0.98 }}
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {loading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : icon ? (
        <span className="mr-2 flex items-center justify-center">{icon}</span>
      ) : null}
      {children}
    </motion.button>
  );
};

export default Button;
