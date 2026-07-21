import React, { createContext, useContext } from 'react';
import { useSelector } from 'react-redux';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const authState = useSelector((state) => state.auth);

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    // If not wrapped in AuthProvider, fallback to direct Redux hook
    const authState = useSelector((state) => state.auth);
    return authState;
  }
  return context;
};
