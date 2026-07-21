import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  notifications: {
    emailAlerts: true,
    newFollowers: true,
    citationsAlert: true,
    collaborationRequests: true
  },
  privacy: {
    publicProfile: true,
    showStats: true,
    privateBookmarks: false
  },
  loading: false,
  error: null
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    updateNotificationSetting: (state, action) => {
      const { key, value } = action.payload;
      if (state.notifications[key] !== undefined) {
        state.notifications[key] = value;
      }
    },
    updatePrivacySetting: (state, action) => {
      const { key, value } = action.payload;
      if (state.privacy[key] !== undefined) {
        state.privacy[key] = value;
      }
    },
    setSettingsLoading: (state, action) => {
      state.loading = action.payload;
    },
    setSettingsError: (state, action) => {
      state.error = action.payload;
    }
  }
});

export const { 
  updateNotificationSetting, 
  updatePrivacySetting, 
  setSettingsLoading, 
  setSettingsError 
} = settingsSlice.actions;

export default settingsSlice.reducer;
