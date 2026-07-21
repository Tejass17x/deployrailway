import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// After login, authenticated users should land on /home (HomeFeed), never on /
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  return children;
};

export default PublicRoute;
