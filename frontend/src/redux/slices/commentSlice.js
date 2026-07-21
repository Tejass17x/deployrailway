import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  commentsByPub: {}, // Map of publicationId -> array of comments
  loading: false,
  error: null
};

const commentSlice = createSlice({
  name: 'comment',
  initialState,
  reducers: {
    setComments(state, action) {
      const { publicationId, comments } = action.payload;
      state.commentsByPub[publicationId] = comments;
      state.loading = false;
    },
    addCommentToStore(state, action) {
      const { publicationId, comment } = action.payload;
      if (!state.commentsByPub[publicationId]) {
        state.commentsByPub[publicationId] = [];
      }
      // Top-level comment
      if (!comment.parentId) {
        state.commentsByPub[publicationId].unshift({ ...comment, replies: [] });
      } else {
        // Find parent and add reply
        const addReply = (list) => {
          for (let item of list) {
            if (item._id === comment.parentId) {
              if (!item.replies) item.replies = [];
              item.replies.push({ ...comment, replies: [] });
              return true;
            }
            if (item.replies && item.replies.length > 0) {
              const found = addReply(item.replies);
              if (found) return true;
            }
          }
          return false;
        };
        addReply(state.commentsByPub[publicationId]);
      }
    },
    toggleLikeCommentSuccess(state, action) {
      const { publicationId, commentId, likesCount, liked, userId } = action.payload;
      const list = state.commentsByPub[publicationId];
      if (!list) return;

      const updateLike = (items) => {
        for (let item of items) {
          if (item._id === commentId) {
            item.likesCount = likesCount;
            if (liked) {
              if (!item.likes) item.likes = [];
              item.likes.push(userId);
            } else if (item.likes) {
              const idx = item.likes.indexOf(userId);
              if (idx > -1) item.likes.splice(idx, 1);
            }
            return true;
          }
          if (item.replies && item.replies.length > 0) {
            const found = updateLike(item.replies);
            if (found) return true;
          }
        }
        return false;
      };
      updateLike(list);
    },
    setLoading(state, action) {
      state.loading = action.payload;
    }
  }
});

export const {
  setComments,
  addCommentToStore,
  toggleLikeCommentSuccess,
  setLoading
} = commentSlice.actions;

export default commentSlice.reducer;
