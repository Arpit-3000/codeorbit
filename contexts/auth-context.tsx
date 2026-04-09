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
        setUser(null);
        setLoading(false);
        return;
      }

      const userData = await getUserProfile();

      setUser(userData);

    } catch (error: any) {

      console.error("Failed to fetch user:", error);

      // Check if it's a 401 error (token expired)
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        setUser(null);
        // Don't redirect here as the API interceptor will handle it
      } else {
        localStorage.removeItem("token");
        setUser(null);
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

  };

  const logout = () => {

    setUser(null);
    setLoading(false);

    authLogout();

  };

  const handleTokenExpiration = () => {
    
    setUser(null);
    setLoading(false);
    
    // Clear token
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
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

