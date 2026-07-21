import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  global: false,
  actions: {}
};

const loadingSlice = createSlice({
  name: 'loading',
  initialState,
  reducers: {
    startLoading(state, action) {
      if (action.payload) {
        state.actions[action.payload] = true;
      } else {
        state.global = true;
      }
    },
    stopLoading(state, action) {
      if (action.payload) {
        state.actions[action.payload] = false;
      } else {
        state.global = false;
      }
    },
    resetLoading(state) {
      state.global = false;
      state.actions = {};
    }
  }
});

export const { startLoading, stopLoading, resetLoading } = loadingSlice.actions;
export default loadingSlice.reducer;
