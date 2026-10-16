import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { API_BASE_URL } from '../../config/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  avatar?: string;
}
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}
const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  error: null,
};
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData: { name: string; email: string; password?: string }, thunkAPI) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        return thunkAPI.rejectWithValue(errorData.error || 'Registration failed');
      }
      return await response.json();
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message || 'Network error occurred');
    }
  }
);
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials: { email: string; password?: string }, thunkAPI) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      // 1. Check if the response failed
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        
        // 2. Safely check if the backend actually sent JSON back
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          return thunkAPI.rejectWithValue(errorData.error || 'Invalid credentials');
        } else {
          // 3. Fallback safely if it returned HTML text (like a 401 or 404 page)
          await response.text();
          return thunkAPI.rejectWithValue('Invalid credentials or server error occurred');
        }
      }

      return await response.json();
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message || 'Network error occurred');
    }
  }
);
export const loginWithOAuth = createAsyncThunk(
  'auth/loginWithOAuth',
  async (oauthPayload: { email: string; name: string; avatar?: string }, thunkAPI) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/oauth-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(oauthPayload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        return thunkAPI.rejectWithValue(errorData.error || 'OAuth login failed');
      }
      return await response.json();
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message || 'Network error occurred');
    }
  }
);
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem('token');
    },
    clearAuthError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(registerUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(registerUser.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        localStorage.setItem('token', action.payload.token);
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Local Login
      .addCase(loginUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        localStorage.setItem('token', action.payload.token);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // OAuth Login
      .addCase(loginWithOAuth.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(loginWithOAuth.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        localStorage.setItem('token', action.payload.token);
      })
      .addCase(loginWithOAuth.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});
export const { logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;