import { configureStore } from '@reduxjs/toolkit';
import appReducer from './slices/appSlice';
import loadingReducer from './slices/loadingSlice';
import authReducer from './slices/authSlice';
import scholarReducer from './slices/scholarSlice';
import publicationReducer from './slices/publicationSlice';
import coAuthorReducer from './slices/coAuthorSlice';
import citationReducer from './slices/citationSlice';
import researchAreaReducer from './slices/researchAreaSlice';
import feedReducer from './slices/feedSlice';
import searchReducer from './slices/searchSlice';
import messageReducer from './slices/messageSlice';
import bookmarkReducer from './slices/bookmarkSlice';
import commentReducer from './slices/commentSlice';
import likeReducer from './slices/likeSlice';
import shareReducer from './slices/shareSlice';
import recommendationReducer from './slices/recommendationSlice';
import requestReducer from './slices/requestSlice';
import settingsReducer from './slices/settingsSlice';
import projectReducer from './slices/projectSlice';

export const store = configureStore({
  reducer: {
    app: appReducer,
    loading: loadingReducer,
    auth: authReducer,
    scholar: scholarReducer,
    publication: publicationReducer,
    coAuthor: coAuthorReducer,
    citation: citationReducer,
    researchArea: researchAreaReducer,
    feed: feedReducer,
    search: searchReducer,
    message: messageReducer,
    bookmark: bookmarkReducer,
    comment: commentReducer,
    like: likeReducer,
    share: shareReducer,
    recommendation: recommendationReducer,
    request: requestReducer,
    settings: settingsReducer,
    project: projectReducer
  },
  devTools: process.env.NODE_ENV !== 'production'
});

export default store;
