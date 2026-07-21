import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  recommendations: [],
  loading: false
};

const recommendationSlice = createSlice({
  name: 'recommendation',
  initialState,
  reducers: {
    setRecommendations(state, action) {
      state.recommendations = action.payload;
    },
    toggleRecommendationSuccess(state, action) {
      const pubId = action.payload;
      const idx = state.recommendations.indexOf(pubId);
      if (idx > -1) {
        state.recommendations.splice(idx, 1);
      } else {
        state.recommendations.push(pubId);
      }
    }
  }
});

export const { setRecommendations, toggleRecommendationSuccess } = recommendationSlice.actions;
export default recommendationSlice.reducer;
