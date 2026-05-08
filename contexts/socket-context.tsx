"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './auth-context';
import { toast } from '@/hooks/use-toast';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Disable Socket.IO for now - using Stream Chat instead
    console.log('[SOCKET] Socket.IO disabled - using Stream Chat for messaging');
    
    // Early return to prevent Socket.IO initialization
    if (true) {
      return;
    }
    
    if (!user || typeof window === 'undefined') {
      console.log('[SOCKET] Waiting for user or window...');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      console.log('[SOCKET] No token found in localStorage');
      console.log('[SOCKET] Please login to establish socket connection');
      return;
    }

    console.log('[SOCKET] Token found, length:', token.length);
    console.log('[SOCKET] Token preview:', token.substring(0, 20) + '...');

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    console.log('[SOCKET] Connecting to:', API_URL);
    console.log('[SOCKET] User:', user.email);
    console.log('[SOCKET] User ID:', user.id);

    const newSocket = io(API_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('✅ Socket.IO connected');
      console.log('[SOCKET] Socket ID:', newSocket.id);
      setIsConnected(true);
      toast({
        title: 'Connected',
        description: 'Real-time connection established',
      });
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error.message);
      console.error('[SOCKET] Full error:', error);
      setIsConnected(false);
      
      // Check if it's an authentication error
      if (error.message.includes('Authentication error')) {
        console.error('[SOCKET] Authentication failed - Token might be invalid or expired');
        toast({
          title: 'Authentication Error',
          description: 'Please logout and login again to refresh your session',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Connection Error',
          description: 'Failed to connect to server. Please check if backend is running.',
          variant: 'destructive',
        });
      }
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Socket.IO disconnected:', reason);
      setIsConnected(false);
      
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        newSocket.connect();
      }
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Socket.IO reconnected after', attemptNumber, 'attempts');
      setIsConnected(true);
      toast({
        title: 'Reconnected',
        description: 'Connection restored',
      });
    });

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log('🔄 Socket.IO reconnection attempt:', attemptNumber);
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('❌ Socket.IO reconnection error:', error);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('❌ Socket.IO reconnection failed');
      toast({
        title: 'Connection Failed',
        description: 'Could not reconnect to server',
        variant: 'destructive',
      });
    });

    // Listen for notifications
    newSocket.on('notification_received', (notification) => {
      console.log('[SOCKET] Notification received:', notification);
      toast({
        title: notification.title,
        description: notification.message,
      });
    });

    // Listen for ping requests
    newSocket.on('ping_request', (ping) => {
      console.log('[SOCKET] Ping request received:', ping);
      toast({
        title: '📍 Ping Request',
        description: `${ping.sender.displayName || ping.sender.username} wants to collaborate!`,
      });
    });

    // Listen for ping accepted
    newSocket.on('ping_accepted', (data) => {
      console.log('[SOCKET] Ping accepted:', data);
      toast({
        title: '✅ Ping Accepted',
        description: 'Your collaboration request was accepted!',
      });
    });

    // Listen for friend requests
    newSocket.on('friend_request_received', (request) => {
      console.log('[SOCKET] Friend request received:', request);
      toast({
        title: '👥 Friend Request',
        description: `${request.sender.displayName || request.sender.username} wants to follow you`,
      });
    });

    // Listen for friend request accepted
    newSocket.on('friend_request_accepted', (data) => {
      console.log('[SOCKET] Friend request accepted:', data);
      toast({
        title: '✅ Request Accepted',
        description: 'Your friend request was accepted!',
      });
    });

    // Listen for user online/offline
    newSocket.on('user_online', (data) => {
      console.log('[SOCKET] User online:', data.userId);
    });

    newSocket.on('user_offline', (data) => {
      console.log('[SOCKET] User offline:', data.userId);
    });

    setSocket(newSocket);

    return () => {
      console.log('[SOCKET] Cleaning up socket connection');
      newSocket.close();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
}
