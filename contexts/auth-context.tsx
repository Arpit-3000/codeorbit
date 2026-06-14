// "use client";

// import React, { createContext, useContext, useEffect, useState } from 'react';
// import { User, getUserProfile, logout as authLogout } from '@/lib/auth';

// interface AuthContextType {
//   user: User | null;
//   loading: boolean;
//   login: (user: User) => void;
//   logout: () => void;
//   refreshUser: () => Promise<void>;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export function AuthProvider({ children }: { children: React.ReactNode }) {
//   const [user, setUser] = useState<User | null>(null);
//   const [loading, setLoading] = useState(true);

//   const refreshUser = async () => {
//     try {
//       if (typeof window !== 'undefined') {
//         const token = localStorage.getItem('token');
//         if (token) {
//           const userData = await getUserProfile();
//           setUser(userData);
//         }
//       }
//     } catch (error) {
//       console.error('Failed to fetch user:', error);
//       if (typeof window !== 'undefined') {
//         localStorage.removeItem('token');
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     refreshUser();
//   }, []);

//   const login = (userData: User) => {
//     setUser(userData);
//   };

//   const logout = () => {
//     setUser(null);
//     authLogout();
//   };

//   return (
//     <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export function useAuth() {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// }


"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState
} from "react";

import {
  User,
  getUserProfile,
  logout as authLogout
} from "@/lib/auth";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  handleTokenExpiration: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {

    try {

      if (typeof window === "undefined") {
        setLoading(false);
        return;
      }

      const token = localStorage.getItem("token");

      if (!token) {
        console.log('[AUTH] No token found in localStorage');
        setUser(null);
        setLoading(false);
        return;
      }

      console.log('[AUTH] Token found, fetching user profile...');

      // Fetch user profile from backend
      const userData = await getUserProfile();
      
      console.log('[AUTH] ✅ User profile loaded:', userData.email);
      setUser(userData);

    } catch (error: any) {

      console.error("[AUTH] Failed to fetch user:", error);

      // Only clear token on 401 (Unauthorized) - token expired/invalid
      if (error.response?.status === 401) {
        console.log('[AUTH] Token expired (401), clearing token');
        localStorage.removeItem("token");
        setUser(null);
        // Don't redirect here - the API interceptor will handle it
      } else {
        // For other errors (network, 500, etc), keep the user logged in
        // Don't clear the token - it might be a temporary issue
        console.warn('[AUTH] ⚠️ API error but keeping user logged in:', error.message);
        
        // Try to get cached user data
        const cachedUserData = localStorage.getItem('user_data');
        if (cachedUserData) {
          try {
            const parsedUser = JSON.parse(cachedUserData);
            console.log('[AUTH] Using cached user data');
            setUser(parsedUser);
          } catch (e) {
            console.error('[AUTH] Failed to parse cached user data');
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }

    } finally {

      setLoading(false);

    }

  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = (userData: User) => {

    setUser(userData);
    setLoading(false);
    
    // Cache user data in localStorage for offline access
    if (typeof window !== "undefined") {
      localStorage.setItem('user_data', JSON.stringify(userData));
    }

  };

  const logout = () => {

    setUser(null);
    setLoading(false);
    
    // Clear cached user data
    if (typeof window !== "undefined") {
      localStorage.removeItem('user_data');
    }

    authLogout();

  };

  const handleTokenExpiration = () => {
    
    setUser(null);
    setLoading(false);
    
    // Clear token and cached data
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem('user_data');
    }
    
    // Redirect to login page
    if (typeof window !== "undefined") {
      window.location.href = "/auth/login";
    }
    
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        refreshUser,
        handleTokenExpiration
      }}
    >
      {children}
    </AuthContext.Provider>
  );

}

export function useAuth() {

  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used within AuthProvider"
    );
  }

  return context;

}

