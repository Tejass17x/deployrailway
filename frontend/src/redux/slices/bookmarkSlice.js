import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  bookmarks: [],
  folders: ['General'],
  loading: false,
  error: null
};

const bookmarkSlice = createSlice({
  name: 'bookmark',
  initialState,
  reducers: {
    setLoading(state, action) {
      state.loading = action.payload;
    },
    setBookmarks(state, action) {
      state.bookmarks = action.payload;
      state.loading = false;
      state.error = null;
    },
    setFolders(state, action) {
      state.folders = action.payload;
    },
    addBookmark(state, action) {
      if (!state.bookmarks.some(b => b.publicationId?._id === action.payload.publicationId?._id || b.publicationId === action.payload.publicationId)) {
        state.bookmarks.push(action.payload);
      }
    },
    removeBookmark(state, action) {
      const pubId = action.payload;
      state.bookmarks = state.bookmarks.filter(b => 
        (b.publicationId?._id || b.publicationId) !== pubId
      );
    },
    moveBookmarkInStore(state, action) {
      const { publicationId, folderName } = action.payload;
      const b = state.bookmarks.find(item => 
        (item.publicationId?._id || item.publicationId) === publicationId
      );
      if (b) {
        b.folderName = folderName;
      }
      if (!state.folders.includes(folderName)) {
        state.folders.push(folderName);
      }
    },
    setError(state, action) {
      state.error = action.payload;
      state.loading = false;
    }
  }
});

export const {
  setLoading,
  setBookmarks,
  setFolders,
  addBookmark,
  removeBookmark,
  moveBookmarkInStore,
  setError
} = bookmarkSlice.actions;

export default bookmarkSlice.reducer;
