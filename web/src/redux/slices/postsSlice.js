import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../api/client';

export const fetchPosts = createAsyncThunk(
  'posts/fetchPosts',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/posts', { params });
      return response.data; // { data: [...], pagination: { page, limit, total, totalPages } }
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchPostById = createAsyncThunk(
  'posts/fetchPostById',
  async (postId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/posts/${postId}`);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const createPost = createAsyncThunk(
  'posts/createPost',
  async (postData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/posts', postData);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const updatePost = createAsyncThunk(
  'posts/updatePost',
  async ({ postId, data }, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch(`/posts/${postId}`, data);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const deletePost = createAsyncThunk(
  'posts/deletePost',
  async (postId, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/posts/${postId}`);
      return postId;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const votePost = createAsyncThunk(
  'posts/votePost',
  async ({ postId, type }, { rejectWithValue }) => {
    try {
      if (type === 'remove') {
        await apiClient.delete(`/posts/${postId}/like`);
      } else {
        await apiClient.post(`/posts/${postId}/like`, { type });
      }
      // Re-fetch post to update rating
      const updated = await apiClient.get(`/posts/${postId}`);
      return updated.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const toggleFavorite = createAsyncThunk(
  'posts/toggleFavorite',
  async ({ postId, isFavorite }, { rejectWithValue }) => {
    try {
      if (isFavorite) {
        await apiClient.delete(`/posts/${postId}/favorite`);
      } else {
        await apiClient.post(`/posts/${postId}/favorite`);
      }
      return { postId, isFavorite: !isFavorite };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const toggleSubscription = createAsyncThunk(
  'posts/toggleSubscription',
  async ({ postId, isSubscribed }, { rejectWithValue }) => {
    try {
      if (isSubscribed) {
        await apiClient.delete(`/posts/${postId}/subscribe`);
      } else {
        await apiClient.post(`/posts/${postId}/subscribe`);
      }
      return { postId, isSubscribed: !isSubscribed };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const postsSlice = createSlice({
  name: 'posts',
  initialState: {
    items: [],
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 1,
    },
    sort: 'publish_date',
    order: 'desc',
    filters: {
      categoryId: null,
      status: 'active',
      dateFrom: null,
      dateTo: null,
      search: '',
    },
    currentPost: null,
    status: 'idle',
    error: null,
  },
  reducers: {
    setSort: (state, action) => {
      state.sort = action.payload.sort;
      state.order = action.payload.order || 'desc';
      state.pagination.page = 1;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.page = 1;
    },
    setPage: (state, action) => {
      state.pagination.page = action.payload;
    },
    setLimit: (state, action) => {
      state.pagination.limit = action.payload;
      state.pagination.page = 1;
    },
    clearCurrentPost: (state) => {
      state.currentPost = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch posts
      .addCase(fetchPosts.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.data || [];
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Fetch single post
      .addCase(fetchPostById.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchPostById.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentPost = action.payload;
      })
      .addCase(fetchPostById.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Update post
      .addCase(updatePost.fulfilled, (state, action) => {
        state.currentPost = action.payload;
        const index = state.items.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      // Vote post
      .addCase(votePost.fulfilled, (state, action) => {
        if (state.currentPost && state.currentPost.id === action.payload.id) {
          state.currentPost = action.payload;
        }
        const index = state.items.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      // Delete post
      .addCase(deletePost.fulfilled, (state, action) => {
        state.items = state.items.filter((p) => p.id !== action.payload);
        if (state.currentPost && state.currentPost.id === action.payload) {
          state.currentPost = null;
        }
      });
  },
});

export const { setSort, setFilters, setPage, setLimit, clearCurrentPost } = postsSlice.actions;
export default postsSlice.reducer;

