import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../api/client';

export const fetchPostComments = createAsyncThunk(
  'comments/fetchPostComments',
  async (postId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/posts/${postId}/comments`);
      return response.data; // array of comments
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const createComment = createAsyncThunk(
  'comments/createComment',
  async ({ postId, content, parent_comment_id }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/posts/${postId}/comments`, {
        content,
        parent_comment_id: parent_comment_id || null,
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const updateCommentStatus = createAsyncThunk(
  'comments/updateCommentStatus',
  async ({ commentId, status }, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch(`/comments/${commentId}`, { status });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const markSolutionComment = createAsyncThunk(
  'comments/markSolutionComment',
  async (commentId, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch(`/comments/${commentId}/solution`);
      return { commentId, result: response.data };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const voteComment = createAsyncThunk(
  'comments/voteComment',
  async ({ commentId, type }, { rejectWithValue }) => {
    try {
      if (type === 'remove') {
        await apiClient.delete(`/comments/${commentId}/like`);
      } else {
        await apiClient.post(`/comments/${commentId}/like`, { type });
      }
      const updated = await apiClient.get(`/comments/${commentId}`);
      return updated.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const deleteComment = createAsyncThunk(
  'comments/deleteComment',
  async (commentId, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/comments/${commentId}`);
      return commentId;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// Sorting helper: by default ascending order by number of likes, with accepted answer first
const sortCommentsAscendingByLikes = (list) => {
  return [...list].sort((a, b) => {
    if (a.is_solution && !b.is_solution) return -1;
    if (!a.is_solution && b.is_solution) return 1;
    return (a.likes_count || 0) - (b.likes_count || 0);
  });
};

const commentsSlice = createSlice({
  name: 'comments',
  initialState: {
    items: [],
    status: 'idle',
    error: null,
  },
  reducers: {
    clearComments: (state) => {
      state.items = [];
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch comments
      .addCase(fetchPostComments.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchPostComments.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = sortCommentsAscendingByLikes(action.payload);
      })
      .addCase(fetchPostComments.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Create comment
      .addCase(createComment.fulfilled, (state, action) => {
        state.items = sortCommentsAscendingByLikes([...state.items, action.payload]);
      })
      // Update comment status
      .addCase(updateCommentStatus.fulfilled, (state, action) => {
        const index = state.items.findIndex((c) => c.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = { ...state.items[index], ...action.payload };
        }
      })
      // Mark solution
      .addCase(markSolutionComment.fulfilled, (state, action) => {
        const isNowSolution = action.payload?.result?.solution !== undefined
          ? Boolean(action.payload.result.solution)
          : false;

        state.items = state.items.map((c) => {
          if (c.id === action.payload.commentId) {
            return {
              ...c,
              is_solution: isNowSolution ? true : false,
            };
          }
          if (isNowSolution) {
            return {
              ...c,
              is_solution: false,
            };
          }
          return c;
        });
        state.items = sortCommentsAscendingByLikes(state.items);
      })
      // Vote comment
      .addCase(voteComment.fulfilled, (state, action) => {
        const index = state.items.findIndex((c) => c.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        state.items = sortCommentsAscendingByLikes(state.items);
      })
      // Delete comment
      .addCase(deleteComment.fulfilled, (state, action) => {
        state.items = state.items.filter((c) => c.id !== action.payload);
      });
  },
});

export const { clearComments } = commentsSlice.actions;
export default commentsSlice.reducer;

