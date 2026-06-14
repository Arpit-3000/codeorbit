"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { StreamChat, Channel, Event } from 'stream-chat';
import { useAuth } from './auth-context';
import { toast } from '@/hooks/use-toast';

interface StreamContextType {
  client: StreamChat | null;
  notificationChannel: Channel | null;
  isConnected: boolean;
  joinRoom: (roomId: string) => Promise<Channel | null>;
  leaveRoom: (channel: Channel) => Promise<void>;
}

const StreamContext = createContext<StreamContextType | undefined>(undefined);

export function StreamProvider({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState<StreamChat | null>(null);
  const [notificationChannel, setNotificationChannel] = useState<Channel | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user || typeof window === 'undefined') {
      console.log('[STREAM] Waiting for user or window...');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      console.log('[STREAM] No token found in localStorage');
      return;
    }

    const initStream = async () => {
      try {
        console.log('[STREAM] Initializing Stream connection...');
        console.log('[STREAM] User:', user.email, user.id);

        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        
        // Get Stream token from backend
        const response = await fetch(`${API_URL}/api/stream/token`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to get Stream token: ${response.statusText}`);
        }

        const { token: streamToken, apiKey, userId } = await response.json();
        console.log('[STREAM] Got Stream credentials');
        console.log('[STREAM] API Key:', apiKey);
        console.log('[STREAM] User ID:', userId);

        // Initialize Stream client
        const streamClient = StreamChat.getInstance(apiKey);
        
        // Connect user (only with minimal data - backend handles user creation)
        await streamClient.connectUser(
          {
            id: userId,
            // DO NOT add other fields here - only id is required
            // Backend creates/updates user with full data
          },
          streamToken
        );

        console.log('[STREAM] ✅ Connected successfully');
        setClient(streamClient);
        setIsConnected(true);

        // Setup notification channel
        const notifChannel = streamClient.channel('messaging', `notifications-${userId}`);
        await notifChannel.watch();
        console.log('[STREAM] ✅ Notification channel setup');

        // Listen for friend requests
        notifChannel.on('friend_request_received', (event: Event) => {
          console.log('[STREAM] Friend request received:', event);
          const data = event.data as any;
          toast({
            title: '👥 Friend Request',
            description: `${data.sender?.displayName || data.sender?.username} wants to follow you`,
          });
        });

        // Listen for friend request accepted
        notifChannel.on('request_accepted', (event: Event) => {
          console.log('[STREAM] Friend request accepted:', event);
          toast({
            title: '✅ Request Accepted',
            description: 'Your friend request was accepted!',
          });
        });

        // Listen for ping requests
        notifChannel.on('ping_request', (event: Event) => {
          console.log('[STREAM] Ping request received:', event);
          const data = event.data as any;
          toast({
            title: '📍 Ping Request',
            description: `${data.displayName || data.username} wants to collaborate!`,
          });
        });

        // ✅ CRITICAL: Listen for ping accepted (User A - sender side)
        notifChannel.on('ping_accepted', (event: Event) => {
          console.log('[PING ACCEPTED] Event received:', event.data);
          const data = event.data as any;
          
          toast({
            title: '🎉 Ping Accepted!',
            description: 'Your collaboration request was accepted. Joining room...',
          });
          
          // Navigate to room if roomId is provided
          if (data.roomId) {
            console.log('[PING ACCEPTED] Navigating to room:', data.roomId);
            // Small delay to show the toast
            setTimeout(() => {
              window.location.href = `/room/${data.roomId}`;
            }, 1000);
          } else {
            console.error('[PING ACCEPTED] No roomId in event data');
          }
        });

        // Listen for user online/offline
        notifChannel.on('user_online', (event: Event) => {
          console.log('[STREAM] User online:', event.user?.id);
        });

        notifChannel.on('user_offline', (event: Event) => {
          console.log('[STREAM] User offline:', event.user?.id);
        });

        setNotificationChannel(notifChannel);

        toast({
          title: 'Connected',
          description: 'Real-time connection established',
        });
      } catch (error: any) {
        console.error('[STREAM] ❌ Connection error:', error);
        setIsConnected(false);
        
        if (error.message.includes('token') || error.message.includes('auth')) {
          toast({
            title: 'Authentication Error',
            description: 'Please logout and login again to refresh your session',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Connection Error',
            description: 'Failed to connect to chat server. Please check if backend is running.',
            variant: 'destructive',
          });
        }
      }
    };

    initStream();

    return () => {
      console.log('[STREAM] Cleaning up connection');
      if (client) {
        client.disconnectUser().catch(console.error);
      }
    };
  }, [user]);

  const joinRoom = async (roomId: string): Promise<Channel | null> => {
    if (!client) {
      console.error('[STREAM] Cannot join room: client not initialized');
      return null;
    }

    try {
      console.log('[STREAM] Joining room:', roomId);
      const channel = client.channel('messaging', `room-${roomId}`);
      await channel.watch();
      console.log('[STREAM] ✅ Room joined successfully');
      return channel;
    } catch (error) {
      console.error('[STREAM] Failed to join room:', error);
      toast({
        title: 'Error',
        description: 'Failed to join room',
        variant: 'destructive',
      });
      return null;
    }
  };

  const leaveRoom = async (channel: Channel): Promise<void> => {
    try {
      await channel.stopWatching();
      console.log('[STREAM] ✅ Left room');
    } catch (error) {
      console.error('[STREAM] Failed to leave room:', error);
    }
  };

  return (
    <StreamContext.Provider value={{ client, notificationChannel, isConnected, joinRoom, leaveRoom }}>
      {children}
    </StreamContext.Provider>
  );
}

export function useStream() {
  const context = useContext(StreamContext);
  if (!context) {
    throw new Error('useStream must be used within StreamProvider');
  }
  return context;
}
