import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_BASE_URL } from '../../config/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  avatar?: string;
}

interface AuthResponse {
  user: User;
  token: string;
  message?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

// Check both possible storage keys to ensure robust token retrieval
const savedToken =
  localStorage.getItem('lavilla_token') ||
  localStorage.getItem('token');

const initialState: AuthState = {
  user: null,
  token: savedToken,
  isAuthenticated: Boolean(savedToken),
  loading: false,
  error: null,
};

async function requestAuth(
  endpoint: 'register' | 'login',
  body: Record<string, string>
): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  const contentType = response.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    throw new Error(
      `The server returned a non-JSON response (${response.status}). Check that the backend is running and the API URL is correct.`
    );
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error || data.message || 'Authentication request failed.'
    );
  }

  if (!data.user || !data.token) {
    throw new Error(
      'The server response is missing the user or authentication token.'
    );
  }

  return data as AuthResponse;
}

export const registerUser = createAsyncThunk<
  AuthResponse,
  { name: string; email: string; password: string },
  { rejectValue: string }
>(
  'auth/registerUser',
  async (userData, { rejectWithValue }) => {
    try {
      return await requestAuth('register', {
        name: userData.name.trim(),
        email: userData.email.trim().toLowerCase(),
        password: userData.password,
      });
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Registration failed.'
      );
    }
  }
);

export const loginUser = createAsyncThunk<
  AuthResponse,
  { email: string; password: string },
  { rejectValue: string }
>(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      return await requestAuth('login', {
        email: credentials.email.trim().toLowerCase(),
        password: credentials.password,
      });
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Login failed.'
      );
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

      localStorage.removeItem('lavilla_token');
      localStorage.removeItem('token');
    },

    clearAuthError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      // Registration: create the account, but do not sign the user in.
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload || action.error.message || 'Registration failed.';
      })

      // Login: authenticate and save the token.
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;

        localStorage.setItem('lavilla_token', action.payload.token);
        localStorage.setItem('token', action.payload.token);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload || action.error.message || 'Login failed.';
      });
  },
});

export const { logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;