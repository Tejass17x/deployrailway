import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  publications: [],
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
  loading: false,
  error: null
};

const publicationSlice = createSlice({
  name: 'publication',
  initialState,
  reducers: {
    setPublications(state, action) {
      const { docs, total, page, limit, totalPages } = action.payload;
      state.publications = docs || [];
      state.total = total || 0;
      state.page = page || 1;
      state.limit = limit || 10;
      state.totalPages = totalPages || 0;
    },
    setLoading(state, action) {
      state.loading = action.payload;
    },
    setError(state, action) {
      state.error = action.payload;
    }
  }
});

export const { setPublications, setLoading, setError } = publicationSlice.actions;
export default publicationSlice.reducer;
