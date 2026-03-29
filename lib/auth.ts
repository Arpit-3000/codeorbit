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

      if (
        error.response?.status === 401 &&
        !error.config.url?.includes("/auth/login") &&
        !error.config.url?.includes("/auth/signup")
      ) {
        localStorage.removeItem("token");
        window.location.href = "/auth/login";
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
    return response.data.user;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch profile');
  }
};

// Logout
export const logout = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
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

