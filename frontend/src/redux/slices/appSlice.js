import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isLoading: false,
  error: null,
  platformVersion: '1.0.0',
  isMobileMenuOpen: false
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setLoading(state, action) {
      state.isLoading = action.payload;
    },
    setError(state, action) {
      state.error = action.payload;
    },
    toggleMobileMenu(state) {
      state.isMobileMenuOpen = !state.isMobileMenuOpen;
    },
    closeMobileMenu(state) {
      state.isMobileMenuOpen = false;
    }
  }
});

export const { setLoading, setError, toggleMobileMenu, closeMobileMenu } = appSlice.actions;
export default appSlice.reducer;
