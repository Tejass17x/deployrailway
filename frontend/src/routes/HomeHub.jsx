import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import LandingPage from '../modules/landing/pages/LandingPage';

const HomeHub = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-white text-slate-900 transition-colors duration-300">
      <main className="flex-grow">
        <LandingPage />
      </main>
    </div>
  );
};

export default HomeHub;