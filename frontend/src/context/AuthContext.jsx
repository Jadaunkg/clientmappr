import React, { createContext, useReducer, useCallback, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

/**
 * Auth Context for managing authentication state globally
 * @type {React.Context}
 */
export const AuthContext = createContext();

/**
 * Initial state for auth reducer
 */
const initialState = {
  user: null,
  accessToken: localStorage.getItem('accessToken') || null,
  refreshToken: localStorage.getItem('refreshToken') || null,
  loading: false,
  error: null,
  isAuthenticated: !!localStorage.getItem('accessToken'),
};

/**
 * Auth reducer to manage state updates
 * @param {Object} state - Current state
 * @param {Object} action - Action object
 * @returns {Object} New state
 */
function authReducer(state, action) {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, loading: true, error: null };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        loading: false,
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
        isAuthenticated: true,
        error: null,
      };
    case 'AUTH_ERROR':
      return { ...state, loading: false, error: action.payload };
    case 'LOGOUT':
      return {
        user: null,
        accessToken: null,
        refreshToken: null,
        loading: false,
        error: null,
        isAuthenticated: false,
      };
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'RESTORE_TOKEN':
      return {
        ...state,
        accessToken: action.payload.accessToken,
        isAuthenticated: !!action.payload.accessToken,
      };
    default:
      return state;
  }
}

/**
 * Auth Context Provider component
 * Provides authentication state and functions to the entire app
 */
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

  /**
   * Sign up with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} fullName - User's full name
   * @throws {Error} If signup fails
   */
  const signup = useCallback(async (email, password, fullName) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const response = await axios.post(`${API_URL}/auth/signup`, {
        email,
        password,
        fullName,
      });

      const { data } = response;

      // Store tokens in localStorage
      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken || '');
      localStorage.setItem('user', JSON.stringify(data.data.user));

      // Set auth header for future requests
      axios.defaults.headers.common.Authorization = `Bearer ${data.data.accessToken}`;

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: data.data.user,
          accessToken: data.data.accessToken,
          refreshToken: data.data.refreshToken || '',
        },
      });

      return data.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Signup failed. Please try again.';
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    }
  }, [API_URL]);

  /**
   * Login with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @throws {Error} If login fails
   */
  const login = useCallback(async (email, password) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const response = await axios.post(`${API_URL}/auth/login-callback`, {
        email,
        password,
      });

      const { data } = response;

      if (!data.data || !data.data.accessToken) {
        throw new Error('Invalid response from server');
      }

      // Store tokens in localStorage
      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken || '');
      localStorage.setItem('user', JSON.stringify(data.data.user));

      // Set auth header for future requests
      axios.defaults.headers.common.Authorization = `Bearer ${data.data.accessToken}`;

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: data.data.user,
          accessToken: data.data.accessToken,
          refreshToken: data.data.refreshToken || '',
        },
      });

      return data.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || error.response?.data?.error || 'Login failed. Please check your credentials.';
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    }
  }, [API_URL]);

  /**
   * Login via Google OAuth
   */
  const loginWithGoogle = useCallback(() => {
    try {
      dispatch({ type: 'AUTH_START' });
      // Redirect to backend Google OAuth endpoint
      // Backend will handle OAuth flow and redirect back with token
      window.location.href = `${API_URL}/auth/google`;
    } catch (error) {
      const errorMessage = 'Failed to initiate Google authentication';
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
    }
  }, [API_URL]);

  /**
   * Login via LinkedIn OAuth
   */
  const loginWithLinkedIn = useCallback(() => {
    try {
      dispatch({ type: 'AUTH_START' });
      // Redirect to backend LinkedIn OAuth endpoint
      // Backend will handle OAuth flow and redirect back with token
      window.location.href = `${API_URL}/auth/linkedin`;
    } catch (error) {
      const errorMessage = 'Failed to initiate LinkedIn authentication';
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
    }
  }, [API_URL]);

  /**
   * Logout user and clear all auth data
   */
  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common.Authorization;
    dispatch({ type: 'LOGOUT' });
  }, []);

  /**
   * Verify email with token
   * @param {string} token - Verification token
   */
  const verifyEmail = useCallback(async (token) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const response = await axios.post(`${API_URL}/auth/verify-email`, { token });
      dispatch({ type: 'CLEAR_ERROR' });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Email verification failed.';
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    }
  }, [API_URL]);

  /**
   * Request password reset
   * @param {string} email - User email
   */
  const resetPassword = useCallback(async (email) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const response = await axios.post(`${API_URL}/auth/reset-password`, { email });
      dispatch({ type: 'CLEAR_ERROR' });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Password reset failed.';
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    }
  }, [API_URL]);

  /**
   * Refresh access token using refresh token
   */
  const refreshAccessToken = useCallback(async () => {
    try {
      const response = await axios.post(`${API_URL}/auth/refresh-token`, {
        refreshToken: state.refreshToken,
      });

      const { accessToken } = response.data.data;
      localStorage.setItem('accessToken', accessToken);
      axios.defaults.headers.common.Authorization = `Bearer ${accessToken}`;

      dispatch({
        type: 'RESTORE_TOKEN',
        payload: { accessToken },
      });

      return accessToken;
    } catch (error) {
      // If refresh fails, logout user
      logout();
      throw new Error('Session expired. Please login again.');
    }
  }, [API_URL, state.refreshToken, logout]);

  /**
   * Handle OAuth callback from Google/LinkedIn
   * Called when redirected back from OAuth provider with token and user data
   */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const userParam = params.get('user');
    const error = params.get('error');

    if (token && userParam) {
      try {
        // Parse user data from the URL parameter
        const userData = JSON.parse(userParam);
        
        // Store tokens and user in localStorage
        localStorage.setItem('accessToken', token);
        localStorage.setItem('user', JSON.stringify(userData));
        axios.defaults.headers.common.Authorization = `Bearer ${token}`;

        // Update auth state
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: {
            user: userData,
            accessToken: token,
            refreshToken: '',
          },
        });

        // Clear URL params and navigate to dashboard
        window.history.replaceState({}, document.title, '/dashboard');
        navigate('/dashboard', { replace: true });
      } catch (e) {
        console.error('Failed to parse OAuth response:', e);
        dispatch({ type: 'AUTH_ERROR', payload: 'Failed to process authentication' });
      }
    } else if (error) {
      dispatch({ type: 'AUTH_ERROR', payload: error });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [navigate]);

  const value = {
    state,
    signup,
    login,
    loginWithGoogle,
    loginWithLinkedIn,
    logout,
    verifyEmail,
    resetPassword,
    refreshAccessToken,
    clearError: () => dispatch({ type: 'CLEAR_ERROR' }),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Custom hook to use Auth Context
 * @returns {Object} Auth context value
 */
export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
