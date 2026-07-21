import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  likedPublications: [],
  loading: false
};

const likeSlice = createSlice({
  name: 'like',
  initialState,
  reducers: {
    setLikedPublications(state, action) {
      state.likedPublications = action.payload;
    },
    toggleLikeSuccess(state, action) {
      const pubId = action.payload;
      const idx = state.likedPublications.indexOf(pubId);
      if (idx > -1) {
        state.likedPublications.splice(idx, 1);
      } else {
        state.likedPublications.push(pubId);
      }
    }
  }
});

export const { setLikedPublications, toggleLikeSuccess } = likeSlice.actions;
export default likeSlice.reducer;
