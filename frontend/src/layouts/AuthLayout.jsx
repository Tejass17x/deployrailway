import React from 'react';
import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-page px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
