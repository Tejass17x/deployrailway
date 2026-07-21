import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  feed: [],
  trending: [],
  recommended: [],
  latest: [],
  followingFeed: [],
  currentPublication: null,
  questions: [],
  projects: [],
  events: [],
  datasets: [],
  suggestedResearchers: [],
  loading: false,
  error: null
};

const feedSlice = createSlice({
  name: 'feed',
  initialState,
  reducers: {
    setLoading(state, action) {
      state.loading = action.payload;
    },
    setFeed(state, action) {
      state.feed = action.payload;
      state.loading = false;
      state.error = null;
    },
    setTrending(state, action) {
      state.trending = action.payload;
      state.loading = false;
      state.error = null;
    },
    setRecommended(state, action) {
      state.recommended = action.payload;
      state.loading = false;
      state.error = null;
    },
    setLatest(state, action) {
      state.latest = action.payload;
      state.loading = false;
      state.error = null;
    },
    setFollowingFeed(state, action) {
      state.followingFeed = action.payload;
      state.loading = false;
      state.error = null;
    },
    setCurrentPublication(state, action) {
      state.currentPublication = action.payload;
      state.loading = false;
      state.error = null;
    },
    setQuestions(state, action) {
      state.questions = action.payload;
      state.loading = false;
      state.error = null;
    },
    setProjects(state, action) {
      state.projects = action.payload;
      state.loading = false;
      state.error = null;
    },
    setEvents(state, action) {
      state.events = action.payload;
      state.loading = false;
      state.error = null;
    },
    setDatasets(state, action) {
      state.datasets = action.payload;
      state.loading = false;
      state.error = null;
    },
    setSuggestedResearchers(state, action) {
      state.suggestedResearchers = action.payload;
    },
    setError(state, action) {
      state.error = action.payload;
      state.loading = false;
    },
    toggleLikeInFeed(state, action) {
      const pubId = action.payload;
      const toggle = (list) => {
        const item = list.find(p => p._id === pubId || p.id === pubId);
        if (item) {
          item.liked = !item.liked;
          item.citations = item.liked ? (item.citations || 0) + 1 : Math.max(0, (item.citations || 0) - 1);
        }
      };
      toggle(state.feed);
      toggle(state.trending);
      toggle(state.recommended);
      toggle(state.latest);
      toggle(state.followingFeed);
      if (state.currentPublication && (state.currentPublication._id === pubId || state.currentPublication.id === pubId)) {
        state.currentPublication.liked = !state.currentPublication.liked;
        state.currentPublication.likesCount = state.currentPublication.liked 
          ? (state.currentPublication.likesCount || 0) + 1 
          : Math.max(0, (state.currentPublication.likesCount || 0) - 1);
      }
    },
    toggleBookmarkInFeed(state, action) {
      const pubId = action.payload;
      const toggle = (list) => {
        const item = list.find(p => p._id === pubId || p.id === pubId);
        if (item) {
          item.bookmarked = !item.bookmarked;
        }
      };
      toggle(state.feed);
      toggle(state.trending);
      toggle(state.recommended);
      toggle(state.latest);
      toggle(state.followingFeed);
      if (state.currentPublication && (state.currentPublication._id === pubId || state.currentPublication.id === pubId)) {
        state.currentPublication.bookmarked = !state.currentPublication.bookmarked;
        state.currentPublication.bookmarksCount = state.currentPublication.bookmarked
          ? (state.currentPublication.bookmarksCount || 0) + 1
          : Math.max(0, (state.currentPublication.bookmarksCount || 0) - 1);
      }
    }
  }
});

export const {
  setLoading,
  setFeed,
  setTrending,
  setRecommended,
  setLatest,
  setFollowingFeed,
  setCurrentPublication,
  setQuestions,
  setProjects,
  setEvents,
  setDatasets,
  setSuggestedResearchers,
  setError,
  toggleLikeInFeed,
  toggleBookmarkInFeed
} = feedSlice.actions;

export default feedSlice.reducer;
