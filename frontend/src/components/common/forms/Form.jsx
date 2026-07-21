import React from 'react';

const Form = ({
  children,
  onSubmit,
  className = '',
  id = ''
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit(e);
  };

  return (
    <form
      id={id}
      onSubmit={handleSubmit}
      className={`space-y-4 ${className}`}
      noValidate
    >
      {children}
    </form>
  );
};

export default Form;
