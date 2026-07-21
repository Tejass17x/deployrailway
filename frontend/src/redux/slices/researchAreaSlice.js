import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  researchAreas: [],
  loading: false,
  error: null
};

const researchAreaSlice = createSlice({
  name: 'researchArea',
  initialState,
  reducers: {
    setResearchAreas(state, action) {
      state.researchAreas = action.payload || [];
    },
    setLoading(state, action) {
      state.loading = action.payload;
    },
    setError(state, action) {
      state.error = action.payload;
    }
  }
});

export const { setResearchAreas, setLoading, setError } = researchAreaSlice.actions;
export default researchAreaSlice.reducer;
