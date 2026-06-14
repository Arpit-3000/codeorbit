import axios from "axios";
import { signInWithPopup } from "firebase/auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

if (typeof window !== "undefined") {

  api.interceptors.request.use((config) => {

    const token = localStorage.getItem("token");

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;

  });

  api.interceptors.response.use(
    (response) => response,
    (error) => {

      // Only redirect on 401 for auth-related endpoints
      // Don't redirect on network errors or other failures
      if (
        error.response?.status === 401 &&
        !error.config.url?.includes("/auth/login") &&
        !error.config.url?.includes("/auth/signup")
      ) {
        console.log('[AUTH API] 401 Unauthorized - Token expired or invalid');
        localStorage.removeItem("token");
        localStorage.removeItem("user_data");
        window.location.href = "/auth/login";
      } else if (error.response?.status === 401) {
        // 401 on login/signup page - don't redirect
        console.log('[AUTH API] 401 on auth page - invalid credentials');
      } else if (!error.response) {
        // Network error - don't logout user
        console.warn('[AUTH API] Network error - keeping user logged in');
      }

      return Promise.reject(error);
    }
  );
}

export interface User {
  id: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  provider: "local" | "google";
  username?: string;
  lastSyncedAt?: string | null;
  platforms?: {
    leetcode?: any;
    codeforces?: any;
    github?: any;
    codechef?: any;
    gfg?: any;
  };
}

export interface AuthResponse {
  message: string;
  token: string;
  user?: User;
}

// Local Authentication
export const signupWithEmail = async (email: string, password: string): Promise<{ message: string }> => {
  try {
    const response = await api.post('/auth/signup', { email, password });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Signup failed');
  }
};

export const loginWithEmail = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const response = await api.post('/auth/login', { email, password });
    const data = response.data;
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', data.token);
      // Cache user data for offline access
      if (data.user) {
        localStorage.setItem('user_data', JSON.stringify(data.user));
      }
    }
    
    return data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Login failed');
  }
};

// Google Authentication
export const signInWithGoogle = async (): Promise<AuthResponse> => {
  try {
    // Dynamic import to avoid SSR issues
    const { auth, googleProvider } = await import('./firebase');
    
    if (!auth || !googleProvider) {
      throw new Error('Firebase not initialized');
    }
    
    const result = await signInWithPopup(auth, googleProvider);
    const idToken = await result.user.getIdToken();
    
    const response = await api.post('/auth/google', { idToken });
    const data = response.data;
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', data.token);
      // Cache user data for offline access
      if (data.user) {
        localStorage.setItem('user_data', JSON.stringify(data.user));
      }
    }
    
    return data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Google sign-in failed');
  }
};

// Get User Profile
export const getUserProfile = async (): Promise<User> => {
  try {
    const response = await api.get('/auth/profile');
    console.log('[AUTH API] User profile response:', response.data);
    
    // Cache user data for offline access
    if (typeof window !== 'undefined' && response.data.user) {
      localStorage.setItem('user_data', JSON.stringify(response.data.user));
    }
    
    return response.data.user;
  } catch (error: any) {
    console.error('[AUTH API] Failed to fetch profile:', error.response?.status, error.message);
    throw error;
  }
};

// Logout
export const logout = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('user_data');
    window.location.href = '/auth/login';
  }
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  if (typeof window !== 'undefined') {
    return !!localStorage.getItem('token');
  }
  return false;
};

export default api;

