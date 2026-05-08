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
      
      // Connect current user - this also creates the user if it doesn't exist
      await client.connectUser(
        {
          id: user!.id,
          name: user!.displayName || user!.email,
          image: user!.photoURL,
        },
        streamData.token
      );

      console.log('[STREAM] Current user connected successfully');
      setChatClient(client);

      // Upsert all participant users to ensure they exist in Stream
      console.log('[STREAM] Upserting all participants...');
      const upsertPromises = room!.participants.map(async (participant) => {
        try {
          const userData = {
            id: participant._id,
            name: participant.displayName || participant.username || participant.email || 'User',
            image: participant.photoURL || participant.profileImage || undefined,
          };
          console.log('[STREAM] Upserting user:', userData);
          await client.upsertUser(userData);
          console.log('[STREAM] ✅ User upserted successfully:', participant._id);
          return participant._id;
        } catch (err: any) {
          console.error('[STREAM] ❌ Failed to upsert user:', participant._id, err.message);
          throw err;
        }
      });

      // Wait for all users to be created
      const memberIds = await Promise.all(upsertPromises);
      console.log('[STREAM] All users upserted. Member IDs:', memberIds);

      // Get or create channel
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

  const handleCloseRoom = async () => {
    if (!room) return;

    try {
      await closeRoom(room.roomId);
      
      // Disconnect from Stream Chat
      if (chatClient) {
        await chatClient.disconnectUser();
      }

      toast({
        title: 'Room Closed',
        description: 'The collaboration room has been closed',
      });
      router.push('/social');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to close room',
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/social')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex -space-x-2">
                {room.participants.map((participant) => (
                  <Avatar
                    key={participant._id}
                    className="h-8 w-8 border-2 border-background"
                  >
                    <AvatarImage src={participant.photoURL || participant.profileImage} />
                    <AvatarFallback>
                      {(participant.displayName || participant.username || 'U')[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <div>
                <h1 className="text-lg font-semibold">Collaboration Room</h1>
                <p className="text-xs text-muted-foreground">
                  {room.participants.map(p => p.displayName || p.username).join(', ')}
                </p>
              </div>
            </div>
            <Button variant="destructive" size="sm" onClick={handleCloseRoom}>
              <Trash2 className="h-4 w-4 mr-2" />
              Close Room
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Chat */}
        <div className="w-80 border-r bg-card flex flex-col">
          <div className="border-b px-4 py-3">
            <h2 className="font-semibold">Discussion Chat</h2>
          </div>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {!channel ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Connecting to chat...</p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-8">
                No messages yet. Start the conversation!
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div key={msg.id} className="flex gap-3">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={msg.user?.image} />
                      <AvatarFallback className="text-xs">
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
                      <p className="text-sm text-muted-foreground mt-1 break-words">
                        {msg.text}
                      </p>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex gap-3">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="text-xs">
                        {isTyping[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{isTyping}</p>
                      <p className="text-sm text-muted-foreground italic">typing...</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Message Input */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => handleTyping(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                disabled={!channel}
                className="flex-1"
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={!channel || !messageInput.trim()}
                size="icon"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            {!channel && (
              <p className="text-xs text-muted-foreground mt-2">Connecting to chat...</p>
            )}
          </div>
        </div>

        {/* Center - Canvas */}
        <div className="flex-1 flex flex-col bg-muted/20">
          <div className="flex-1 p-4">
            <Card className="h-full">
              <CollaborativeCanvas roomId={room.roomId} />
            </Card>
          </div>
        </div>

        {/* Right Sidebar - Video Call */}
        <div className="w-80 border-l bg-card flex flex-col overflow-y-auto">
          <div className="border-b px-4 py-3">
            <h2 className="font-semibold">Video Call</h2>
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
                    className="w-full bg-blue-600 hover:bg-blue-700 h-12"
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
                  <p className="text-xs text-muted-foreground text-center">
                    Initializing call features...
                  </p>
                )}
              </>
            )}

            {/* Participants */}
            {!isVideoCallActive && (
              <div className="pt-4">
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Participants ({room.participants.length})
                </h3>
                <div className="space-y-3">
                  {room.participants.map((participant) => (
                    <div key={participant._id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={participant.photoURL || participant.profileImage} />
                        <AvatarFallback>
                          {(participant.displayName || participant.username || 'U')[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {participant.displayName || participant.username}
                        </p>
                        {participant.onlineStatus ? (
                          <Badge variant="outline" className="text-green-500 border-green-500 text-xs mt-1">
                            Online
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-500 border-gray-500 text-xs mt-1">
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
