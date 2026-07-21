import React from 'react';

const Skeleton = ({
  variant = 'text', // 'text', 'circular', 'rectangular'
  width = '100%',
  height,
  className = ''
}) => {
  const baseStyles = 'bg-slate-200 dark:bg-slate-800 animate-pulse';
  
  const variantStyles = {
    text: 'rounded h-3.5 my-1.5 w-full',
    circular: 'rounded-full',
    rectangular: 'rounded-xl'
  };

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined
  };

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      style={style}
    />
  );
};

export default Skeleton;
