import React from 'react';
import { useOutletContext } from 'react-router-dom';
import SettingsPage from '../../settings/pages/SettingsPage';

const Settings = () => {
  const { profile, refetch, isOwnProfile, username } = useOutletContext();

  return (
    <SettingsPage
      profile={profile}
      refetch={refetch}
      isOwnProfile={isOwnProfile}
      username={username}
    />
  );
};

export default Settings;

