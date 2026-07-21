import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  citations: [],
  loading: false,
  error: null
};

const citationSlice = createSlice({
  name: 'citation',
  initialState,
  reducers: {
    setCitations(state, action) {
      state.citations = action.payload || [];
    },
    setLoading(state, action) {
      state.loading = action.payload;
    },
    setError(state, action) {
      state.error = action.payload;
    }
  }
});

export const { setCitations, setLoading, setError } = citationSlice.actions;
export default citationSlice.reducer;
