import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  profile: null,
  importStatus: null,
  loading: false,
  error: null
};

const scholarSlice = createSlice({
  name: 'scholar',
  initialState,
  reducers: {
    setScholarProfile(state, action) {
      state.profile = action.payload;
    },
    setImportStatus(state, action) {
      state.importStatus = action.payload;
    },
    setLoading(state, action) {
      state.loading = action.payload;
    },
    setError(state, action) {
      state.error = action.payload;
    },
    clearScholarState(state) {
      state.profile = null;
      state.importStatus = null;
      state.loading = false;
      state.error = null;
    }
  }
});

export const { setScholarProfile, setImportStatus, setLoading, setError, clearScholarState } = scholarSlice.actions;
export default scholarSlice.reducer;
