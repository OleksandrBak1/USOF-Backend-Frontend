import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../api/client';

const initialToken = localStorage.getItem('usof_token') || null;
let initialUser = null;
try {
  const stored = localStorage.getItem('usof_user');
  if (stored) initialUser = JSON.parse(stored);
} catch (e) {
  initialUser = null;
}

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      const { token, user } = response.data;
      localStorage.setItem('usof_token', token);
      localStorage.setItem('usof_user', JSON.stringify(user));
      return { token, user };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/auth/register', userData);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      await apiClient.post('/auth/logout');
    } catch (err) {
    } finally {
      localStorage.removeItem('usof_token');
      localStorage.removeItem('usof_user');
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/users/${userId}`);
      localStorage.setItem('usof_user', JSON.stringify(response.data));
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'auth/updateUserProfile',
  async ({ userId, data }, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch(`/users/${userId}`, data);
      localStorage.setItem('usof_user', JSON.stringify(response.data));
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const uploadUserAvatar = createAsyncThunk(
  'auth/uploadUserAvatar',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: initialToken,
    user: initialUser,
    role: initialUser ? initialUser.role : null,
    status: 'idle',
    error: null,
  },
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    },
    localLogout: (state) => {
      state.token = null;
      state.user = null;
      state.role = null;
      state.status = 'idle';
      state.error = null;
      localStorage.removeItem('usof_token');
      localStorage.removeItem('usof_user');
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.role = action.payload.user.role;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.status = 'succeeded';
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.token = null;
        state.user = null;
        state.role = null;
        state.status = 'idle';
      })
      // Fetch current user
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.role = action.payload.role;
      })
      // Update profile
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.user = { ...state.user, ...action.payload };
        if (action.payload.role) {
          state.role = action.payload.role;
        }
        localStorage.setItem('usof_user', JSON.stringify(state.user));
      })
      // Upload avatar
      .addCase(uploadUserAvatar.fulfilled, (state, action) => {
        if (state.user && action.payload) {
          const pic = action.payload.profile_picture || action.payload.avatar_url;
          state.user = {
            ...state.user,
            ...action.payload,
            profile_picture: pic,
          };
          localStorage.setItem('usof_user', JSON.stringify(state.user));
        }
      });
  },
});

export const { clearAuthError, localLogout } = authSlice.actions;
export default authSlice.reducer;
