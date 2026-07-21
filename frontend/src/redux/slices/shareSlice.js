import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  shareLogs: [],
  activeShare: null
};

const shareSlice = createSlice({
  name: 'share',
  initialState,
  reducers: {
    logShare(state, action) {
      state.shareLogs.push(action.payload);
    },
    setActiveShare(state, action) {
      state.activeShare = action.payload;
    }
  }
});

export const { logShare, setActiveShare } = shareSlice.actions;
export default shareSlice.reducer;
