import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  requests: [],
  loading: false,
  error: null
};

const requestSlice = createSlice({
  name: 'request',
  initialState,
  reducers: {
    setRequests(state, action) {
      state.requests = action.payload;
      state.loading = false;
    },
    addRequest(state, action) {
      state.requests.unshift(action.payload);
    },
    removeRequest(state, action) {
      const requestId = action.payload;
      state.requests = state.requests.filter(r => r._id !== requestId);
    },
    setLoading(state, action) {
      state.loading = action.payload;
    }
  }
});

export const {
  setRequests,
  addRequest,
  removeRequest,
  setLoading
} = requestSlice.actions;

export default requestSlice.reducer;
