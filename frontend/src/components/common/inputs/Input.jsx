import React, { forwardRef } from 'react';

const Input = forwardRef(({
  label,
  type = 'text',
  placeholder = '',
  name,
  error,
  required = false,
  className = '',
  disabled = false,
  ...props
}, ref) => {
  return (
    <div className={`flex flex-col w-full space-y-1.5 ${className}`}>
      {label && (
        <label className="text-xs font-semibold text-text-secondary tracking-wide flex items-center gap-1">
          {label}
          {required && <span className="text-accent-red font-bold">*</span>}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        name={name}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-4 py-2 text-sm bg-bg-card border ${
          error ? 'border-accent-red focus:ring-accent-red' : 'border-border focus:ring-primary'
        } rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-opacity-40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
        {...props}
      />
      {error && (
        <span className="text-xs font-medium text-accent-red transition-all">
          {error}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
