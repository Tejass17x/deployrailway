import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  query: '',
  type: 'all',
  results: [],
  loading: false,
  error: null
};

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setQuery(state, action) {
      state.query = action.payload;
    },
    setType(state, action) {
      state.type = action.payload;
    },
    setResults(state, action) {
      state.results = action.payload;
      state.loading = false;
      state.error = null;
    },
    setLoading(state, action) {
      state.loading = action.payload;
    },
    setError(state, action) {
      state.error = action.payload;
      state.loading = false;
    },
    clearSearch(state) {
      state.query = '';
      state.type = 'all';
      state.results = [];
      state.loading = false;
      state.error = null;
    }
  }
});

export const {
  setQuery,
  setType,
  setResults,
  setLoading,
  setError,
  clearSearch
} = searchSlice.actions;

export default searchSlice.reducer;
