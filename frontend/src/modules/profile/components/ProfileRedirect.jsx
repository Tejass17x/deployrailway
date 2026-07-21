import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

const ProfileRedirect = () => {
  const { user } = useSelector((state) => state.auth);

  if (user) {
    const slug = user.slug || (user.profileSlug && user.profileSlug !== 'undefined' ? user.profileSlug : null) || user.username || 'me';
    return <Navigate to={`/profile/${slug}`} replace />;
  }

  return <Navigate to="/login" replace />;
};

export default ProfileRedirect;
