"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Loader2, 
  Users, 
  Video, 
  Mic, 
  MicOff, 
  VideoOff, 
  Volume2, 
  VolumeX,
  ArrowLeft,
  Trash2,
  Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { getRoomById, closeRoom, Room, getStreamToken } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { toast } from '@/hooks/use-toast';
import { CollaborativeCanvas } from '@/components/room/collaborative-canvas';
import { StreamChat, Channel as StreamChannel } from 'stream-chat';
import { VideoCall } from '@/components/room/video-call';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const { user } = useAuth();

  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatClient, setChatClient] = useState<StreamChat | null>(null);
  const [channel, setChannel] = useState<StreamChannel | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState<string | null>(null);
  
  // Call states
  const [streamToken, setStreamToken] = useState<string | null>(null);
  const [streamApiKey, setStreamApiKey] = useState<string | null>(null);
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);

  useEffect(() => {
    loadRoom();
  }, [roomId]);

  useEffect(() => {
    if (room && user) {
      initializeStreamChat();
    }

    return () => {
      if (chatClient) {
        chatClient.disconnectUser().catch(console.error);
      }
      if (channel) {
        // Remove all event listeners
        channel.off('message.new');
        channel.off('typing.start');
        channel.off('typing.stop');
        channel.off('room_closed');
      }
    };
  }, [room, user]);

  const loadRoom = async () => {
    try {
      setLoading(true);
      const data = await getRoomById(roomId);
      setRoom(data.room);
      console.log('[ROOM] Room loaded:', data.room);
    } catch (error: any) {
      console.error('[ROOM] Failed to load room:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load room',
        variant: 'destructive',
      });
      router.push('/social');
    } finally {
      setLoading(false);
    }
  };

  const initializeStreamChat = async () => {
    try {
      console.log('[STREAM] Initializing Stream Chat...');
      console.log('[STREAM] Current user:', user!.id, user!.displayName);
      console.log('[STREAM] Room participants:', room!.participants.map(p => ({ id: p._id, name: p.displayName || p.username })));
      
      // Get Stream token from backend
      const streamData = await getStreamToken();
      console.log('[STREAM] Token received, API Key:', streamData.apiKey);

      // Store token and API key for video/voice calls
      setStreamToken(streamData.token);
      setStreamApiKey(streamData.apiKey);

      // Initialize Stream Chat client
      const client = StreamChat.getInstance(streamData.apiKey);
      
      // Connect current user (only with id field - backend handles user creation)
      await client.connectUser(
        {
          id: user!.id,
          // DO NOT add other fields - backend creates user with full data
        },
        streamData.token
      );

      console.log('[STREAM] Current user connected successfully');
      setChatClient(client);

      // Get or create channel with participant IDs
      // Backend should have already created these users
      const memberIds = room!.participants.map(p => p._id);
      console.log('[STREAM] Channel members:', memberIds);

      const channelId = room!.streamChannelId || `room-${room!.roomId}`;
      console.log('[STREAM] Creating/getting channel:', channelId);
      
      const streamChannel = client.channel('messaging', channelId, {
        name: 'Collaboration Room',
        members: memberIds,
      });

      await streamChannel.watch();
      console.log('[STREAM] ✅ Channel connected successfully');
      setChannel(streamChannel);

      // Load existing messages first
      const state = await streamChannel.query({
        messages: { limit: 50 },
      });
      setMessages(state.messages || []);

      // Listen for NEW messages only (after loading existing ones)
      streamChannel.on('message.new', (event) => {
        console.log('[STREAM] New message:', event.message);
        // Only add if not already in the list (prevent duplicates)
        setMessages((prev) => {
          const exists = prev.some(msg => msg.id === event.message.id);
          if (exists) return prev;
          return [...prev, event.message];
        });
      });

      // Listen for typing
      streamChannel.on('typing.start', (event) => {
        if (event.user?.id !== user!.id) {
          setIsTyping(event.user?.name || 'Someone');
        }
      });

      streamChannel.on('typing.stop', (event) => {
        if (event.user?.id !== user!.id) {
          setIsTyping(null);
        }
      });

      // Listen for room closed event
      streamChannel.on('room_closed', (event) => {
        console.log('[ROOM CLOSED] Room was closed by:', event.data?.closedBy);
        
        const wasClosedByMe = event.data?.closedBy === user!.id;
        
        toast({
          title: 'Room Closed',
          description: wasClosedByMe 
            ? 'You closed the collaboration room' 
            : 'The collaboration room has been closed by another participant',
        });

        // Cleanup and redirect after showing notification
        setTimeout(() => {
          cleanupAndRedirect();
        }, 2000);
      });

      // Handle connection state changes
      client.on('connection.changed', (event) => {
        console.log('[STREAM] Connection state:', event);
        if (event.online === false) {
          console.log('[STREAM] ⚠️ Connection lost');
          toast({
            title: 'Connection Lost',
            description: 'Trying to reconnect...',
            variant: 'destructive',
          });
        } else if (event.online === true) {
          console.log('[STREAM] ✅ Connection restored');
          toast({
            title: 'Connection Restored',
            description: 'You are back online',
          });
        }
      });

      toast({
        title: 'Chat Connected',
        description: 'Real-time chat is ready!',
      });
    } catch (error: any) {
      console.error('[STREAM] Failed to initialize:', error);
      toast({
        title: 'Chat Error',
        description: 'Failed to connect to chat. Some features may not work.',
        variant: 'destructive',
      });
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !channel) return;

    try {
      await channel.sendMessage({
        text: messageInput,
      });
      setMessageInput('');
      
      // Stop typing indicator
      await channel.stopTyping();
    } catch (error) {
      console.error('[STREAM] Failed to send message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    }
  };

  const handleTyping = async (value: string) => {
    setMessageInput(value);

    if (channel) {
      if (value.length > 0) {
        await channel.keystroke();
      } else {
        await channel.stopTyping();
      }
    }
  };

  const cleanupAndRedirect = async () => {
    try {
      console.log('[ROOM] Starting cleanup...');
      
      // Stop typing if active
      if (channel) {
        try {
          await channel.stopTyping();
        } catch (err) {
          console.log('[ROOM] Could not stop typing:', err);
        }
      }

      // Disconnect from Stream Chat
      if (chatClient) {
        try {
          await chatClient.disconnectUser();
          console.log('[ROOM] ✅ Disconnected from Stream');
        } catch (err) {
          console.log('[ROOM] Could not disconnect:', err);
        }
      }

      // Clear states
      setChannel(null);
      setChatClient(null);
      setMessages([]);
      setIsVideoCallActive(false);

      console.log('[ROOM] ✅ Cleanup complete');
      
      // Redirect to social page
      router.push('/social');
    } catch (error) {
      console.error('[ROOM] Cleanup error:', error);
      // Force redirect even if cleanup fails
      router.push('/social');
    }
  };

  const handleCloseRoom = async () => {
    if (!room) return;

    // Show confirmation dialog
    const confirmed = window.confirm(
      'Are you sure you want to close this room? This will end the session for all participants.'
    );
    
    if (!confirmed) return;

    try {
      console.log('[ROOM] Closing room:', room.roomId);
      
      // Call backend to close room
      // Backend will send room_closed event to all participants
      await closeRoom(room.roomId);
      
      console.log('[ROOM] ✅ Room close request sent to backend');
      
      // The room_closed event listener will handle cleanup and redirect
      // No need to do it here as the event will be received
      
    } catch (error: any) {
      console.error('[ROOM] Failed to close room:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to close room',
        variant: 'destructive',
      });
    }
  };

  const handleStartVideoCall = () => {
    if (!streamToken || !streamApiKey) {
      toast({
        title: 'Error',
        description: 'Stream not initialized. Please wait...',
        variant: 'destructive',
      });
      return;
    }
    setIsVideoCallActive(true);
    toast({
      title: 'Video Call Started',
      description: 'Starting video call...',
    });
  };

  const handleEndCall = () => {
    setIsVideoCallActive(false);
    toast({
      title: 'Call Ended',
      description: 'You have left the call',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!room) {
    return null;
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header - Fixed */}
      <div className="border-b bg-card shadow-sm z-10 flex-shrink-0">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/social')}
                className="hover:bg-primary/10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {room.participants.map((participant) => (
                    <Avatar
                      key={participant._id}
                      className="h-9 w-9 border-2 border-background ring-2 ring-primary/10"
                    >
                      <AvatarImage src={participant.photoURL || participant.profileImage} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                        {(participant.displayName || participant.username || 'U')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <div>
                  <h1 className="text-lg font-semibold flex items-center gap-2">
                    Collaboration Room
                    <Badge variant="outline" className="text-green-500 border-green-500">
                      Active
                    </Badge>
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {room.participants.map(p => p.displayName || p.username).join(' • ')}
                  </p>
                </div>
              </div>
            </div>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleCloseRoom}
              className="shadow-sm"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Close Room
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - Fixed Height with Internal Scroll */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Chat (Scrollable) */}
        <div className="w-80 border-r bg-card flex flex-col">
          {/* Chat Header - Fixed */}
          <div className="border-b px-4 py-3 bg-muted/30 flex-shrink-0">
            <h2 className="font-semibold flex items-center gap-2">
              <Send className="h-4 w-4 text-primary" />
              Chat
            </h2>
          </div>
          
          {/* Messages - Scrollable Only This Section */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
            {!channel ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">Connecting to chat...</p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-8">
                <div className="mb-3 flex justify-center">
                  <div className="p-4 rounded-full bg-primary/10">
                    <Send className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <p className="font-medium">No messages yet</p>
                <p className="text-xs mt-1">Start the conversation!</p>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div key={msg.id} className="flex gap-3 animate-in fade-in slide-in-from-bottom-2">
                    <Avatar className="h-8 w-8 flex-shrink-0 ring-2 ring-primary/10">
                      <AvatarImage src={msg.user?.image} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs">
                        {msg.user?.name?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <p className="text-sm font-medium">{msg.user?.name || 'User'}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(msg.created_at).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                      <div className="mt-1 bg-muted/50 rounded-lg px-3 py-2 text-sm break-words">
                        {msg.text}
                      </div>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex gap-3 opacity-70">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="text-xs bg-muted">
                        {isTyping[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{isTyping}</p>
                      <div className="flex gap-1 mt-1">
                        <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Message Input - Fixed at Bottom */}
          <div className="border-t p-4 bg-muted/20 flex-shrink-0">
            <div className="flex gap-2">
              <Input
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => handleTyping(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                disabled={!channel}
                className="flex-1 bg-background"
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={!channel || !messageInput.trim()}
                size="icon"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            {!channel && (
              <p className="text-xs text-muted-foreground mt-2">Connecting to chat...</p>
            )}
          </div>
        </div>

        {/* Center - Canvas (Fixed, No Scroll) */}
        <div className="flex-1 flex flex-col bg-gradient-to-br from-muted/20 to-muted/40 p-6 overflow-hidden">
          <div className="h-full">
            <CollaborativeCanvas roomId={room.roomId} />
          </div>
        </div>

        {/* Right Sidebar - Video Call (Scrollable if needed) */}
        <div className="w-80 border-l bg-card flex flex-col overflow-y-auto">
          {/* Video Header - Fixed */}
          <div className="border-b px-4 py-3 bg-muted/30 flex-shrink-0">
            <h2 className="font-semibold flex items-center gap-2">
              <Video className="h-4 w-4 text-primary" />
              Video Call
            </h2>
          </div>

          <div className="p-4 space-y-4">
            {/* Video Call Section */}
            {isVideoCallActive && streamToken && streamApiKey ? (
              <div className="space-y-4">
                <VideoCall
                  apiKey={streamApiKey}
                  token={streamToken}
                  userId={user!.id}
                  userName={user!.displayName || user!.email}
                  userImage={user!.photoURL}
                  callId={`video-${room.roomId}`}
                  participants={room.participants}
                  onCallEnd={handleEndCall}
                />
              </div>
            ) : (
              <>
                {/* Call Button */}
                <div className="space-y-2">
                  <Button 
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-12 shadow-lg"
                    onClick={handleStartVideoCall}
                    disabled={!streamToken || !streamApiKey}
                  >
                    <Video className="h-5 w-5 mr-2" />
                    Start Video Call
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Video call includes audio and video
                  </p>
                </div>

                {!streamToken && (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
                    <p className="text-xs text-muted-foreground">
                      Initializing call features...
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Participants */}
            {!isVideoCallActive && (
              <div className="pt-4">
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Participants ({room.participants.length})
                </h3>
                <div className="space-y-3">
                  {room.participants.map((participant) => (
                    <div key={participant._id} className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-muted/50 to-muted/30 border border-border/50 hover:border-primary/30 transition-all">
                      <Avatar className="h-10 w-10 ring-2 ring-primary/10">
                        <AvatarImage src={participant.photoURL || participant.profileImage} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                          {(participant.displayName || participant.username || 'U')[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {participant.displayName || participant.username}
                        </p>
                        {participant.onlineStatus ? (
                          <Badge variant="outline" className="text-green-500 border-green-500 text-xs mt-1">
                            <div className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse"></div>
                            Online
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-500 border-gray-500 text-xs mt-1">
                            <div className="h-1.5 w-1.5 rounded-full bg-gray-500 mr-1.5"></div>
                            Offline
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
