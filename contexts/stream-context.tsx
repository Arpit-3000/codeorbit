"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { StreamChat, Channel, Event } from 'stream-chat';
import { useAuth } from './auth-context';
import { toast } from '@/hooks/use-toast';
import { getFreshToken } from '@/lib/token';
import { emitCollab } from '@/lib/collab-events';

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

    if (!localStorage.getItem('token')) {
      console.log('[STREAM] No token found in localStorage');
      return;
    }

    // The effect re-runs when `user` changes identity; without cleanup every run stacked another set of
    // listeners on the same (cached) channel, duplicating toasts and events.
    let cancelled = false;
    let activeChannel: Channel | null = null;
    const EVENT_TYPES = ['friend_request_received', 'request_accepted', 'ping_request', 'ping_accepted', 'ping_rejected', 'user_online', 'user_offline'];

    const initStream = async () => {
      try {
        // Google sessions use a short-lived token, so always read the current one
        const token = await getFreshToken();
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
        const streamClient = StreamChat.getInstance(apiKey, { timeout: 20000 }); // the 3s default is too tight on slower networks
        
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
        if (cancelled) return;
        activeChannel = notifChannel;
        EVENT_TYPES.forEach((t) => notifChannel.off(t as any));
        console.log('[STREAM] ✅ Notification channel setup');

        // Listen for friend requests
        notifChannel.on('friend_request_received', (event: Event) => {
          emitCollab('friends-changed');
          emitCollab('notifications-changed');
          const data = event.data as any;
          toast({
            title: '👥 Friend Request',
            description: `${data.sender?.displayName || data.sender?.username} wants to follow you`,
          });
        });

        // Listen for friend request accepted
        notifChannel.on('request_accepted', (event: Event) => {
          emitCollab('friends-changed');
          emitCollab('notifications-changed');
          toast({
            title: '✅ Request Accepted',
            description: 'Your friend request was accepted!',
          });
        });

        // Listen for ping requests
        notifChannel.on('ping_request', (event: Event) => {
          console.log('[STREAM] Ping request received:', event);
          // the server nests the sender's details under `pingRequest`
          const data = ((event.data as any)?.pingRequest ?? event.data ?? {}) as any;
          emitCollab('pings-changed');
          toast({
            title: '📍 Ping Request',
            description: `${data.displayName || data.username || 'A friend'} wants to collaborate!`,
          });
        });

        // Ping accepted (sender side): the room now exists, so tell Collab Space to show it right away.
        notifChannel.on('ping_accepted', (event: Event) => {
          const data = event.data as any;
          emitCollab('rooms-changed', { roomId: data?.roomId });
          emitCollab('pings-changed');
          emitCollab('notifications-changed');
          toast({
            title: '🎉 Ping accepted',
            description: 'Your room is ready. Join it from Rooms.',
          });
        });

        notifChannel.on('ping_rejected', () => {
          emitCollab('pings-changed');
          emitCollab('notifications-changed');
          toast({ title: 'Ping declined', description: 'Your friend is not available right now.' });
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
      cancelled = true;
      // StreamChat is a shared singleton that the room page also uses, so keep the connection; just drop our listeners.
      EVENT_TYPES.forEach((t) => activeChannel?.off(t as any));
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
