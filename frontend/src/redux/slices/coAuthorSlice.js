import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  coAuthors: [],
  loading: false,
  error: null
};

const coAuthorSlice = createSlice({
  name: 'coAuthor',
  initialState,
  reducers: {
    setCoAuthors(state, action) {
      state.coAuthors = action.payload || [];
    },
    setLoading(state, action) {
      state.loading = action.payload;
    },
    setError(state, action) {
      state.error = action.payload;
    }
  }
});

export const { setCoAuthors, setLoading, setError } = coAuthorSlice.actions;
export default coAuthorSlice.reducer;
