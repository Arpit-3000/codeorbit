"use client";

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Loader2,
  Maximize2,
  Minimize2,
  PanelRightClose,
  PanelRightOpen,
  Video,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getRoomById, closeRoom, Room, getStreamToken } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { toast } from '@/hooks/use-toast';
import { useMediaQuery } from '@/hooks/use-media-query';
import { CollaborativeCanvas } from '@/components/room/collaborative-canvas';
import { ChatPanel } from '@/components/room/chat-panel';
import { VideoCall } from '@/components/room/video-call';
import { AuthGuard } from '@/components/auth/auth-guard';
import { PersonAvatar, personName } from '@/components/social/person';
import { Segmented, StatusDot } from '@/components/ds/primitives';
import { StreamChat, Channel as StreamChannel } from 'stream-chat';
import { cn } from '@/lib/utils';

type Connection = 'connecting' | 'connected' | 'reconnecting';
type MobileTab = 'board' | 'chat' | 'call';

const CONNECTION_COPY: Record<Connection, { tone: 'primary' | 'success' | 'warning'; label: string }> = {
  connecting: { tone: 'primary', label: 'Connecting' },
  connected: { tone: 'success', label: 'Connected' },
  reconnecting: { tone: 'warning', label: 'Reconnecting' },
};

function RoomView() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const { user } = useAuth();
  const desktop = useMediaQuery('(min-width: 1024px)');

  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [channel, setChannel] = useState<StreamChannel | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState<string | null>(null);
  const [connection, setConnection] = useState<Connection>('connecting');

  // Call state
  const [streamToken, setStreamToken] = useState<string | null>(null);
  const [streamApiKey, setStreamApiKey] = useState<string | null>(null);
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);

  // Workspace layout state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [videoOpen, setVideoOpen] = useState(true);
  const [chatOpen, setChatOpen] = useState(true);
  const [mobileTab, setMobileTab] = useState<MobileTab>('board');
  const [fullscreen, setFullscreen] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    loadRoom();
  }, [roomId]);

  useEffect(() => {
    const onChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // Handle page unload/refresh: cleanup resources
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (channel) {
        channel.stopWatching().catch(console.error);
      }
      if (isVideoCallActive) {
        e.preventDefault();
        e.returnValue = 'You are in an active call. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [channel, isVideoCallActive]);

  // One owner for the room's chat channel. The effect is keyed on stable ids (not object identity) so an
  // auth refresh can't tear it down, and every step after an await checks `cancelled`.
  const channelRun = useRef(0);
  const roomKey = room?.roomId;
  const userKey = user?.id;
  useEffect(() => {
    if (!roomKey || !userKey) return;
    const run = ++channelRun.current;
    let cancelled = false;
    let ch: StreamChannel | null = null;
    let offClient: Array<{ unsubscribe: () => void }> = [];
    let offChannel: Array<{ unsubscribe: () => void }> = [];

    (async () => {
      try {
        setConnection('connecting');
        const streamData = await getStreamToken();
        if (cancelled) return;
        setStreamToken(streamData.token);
        setStreamApiKey(streamData.apiKey);

        // StreamProvider already connects this same singleton; connecting again with the same user is a no-op.
        const client = StreamChat.getInstance(streamData.apiKey);
        await client.connectUser({ id: userKey }, streamData.token);
        if (cancelled) return;

        ch = client.channel('messaging', room!.streamChannelId || `room-${roomKey}`);
        const channel = ch;

        // The channel's own state is the source of truth for the transcript. It is updated before listeners run,
        // so re-reading it can never miss, duplicate or reorder a message.
        const sync = () => setMessages([...channel.state.messages]);

        // Subscribe BEFORE watching: a message that lands while the initial load is in flight is not lost.
        offChannel = [
          channel.on('message.new', sync),
          channel.on('message.updated', sync),
          channel.on('message.deleted', sync),
          channel.on('typing.start', (event) => {
            if (event.user?.id !== userKey) setIsTyping(event.user?.name || 'Someone');
          }),
          channel.on('typing.stop', (event) => {
            if (event.user?.id !== userKey) setIsTyping(null);
          }),
          channel.on('room_closed' as any, (event: any) => {
            const wasClosedByMe = event.data?.closedBy === userKey;
            toast({
              title: 'Room closed',
              description: wasClosedByMe ? 'You closed the collaboration room' : 'The collaboration room has been closed by another participant',
            });
            setTimeout(() => cleanupAndRedirect(), 1500);
          }),
        ];
        offClient = [
          client.on('connection.changed', (event) => {
            if (event.online === false) setConnection('reconnecting');
            else if (event.online === true) {
              setConnection('connected');
              // anything sent while we were offline is in channel state once Stream recovers
              sync();
            }
          }),
          client.on('connection.recovered', sync),
        ];

        try {
          await channel.watch({ messages: { limit: 50 } });
        } catch (channelError: any) {
          console.error('[STREAM] Channel watch failed:', channelError);
          if (cancelled) return;
          if (channelError.message?.includes('not allowed') || channelError.message?.includes('ReadChannel')) {
            toast({
              title: 'Backend configuration error',
              description: 'Stream users are not configured correctly. Returning you to Collab Space.',
              variant: 'destructive',
            });
            setTimeout(() => router.push('/social'), 5000);
            return;
          }
          throw channelError;
        }
        if (cancelled) return;

        sync();
        setChannel(channel);
        setConnection('connected');
      } catch (error: any) {
        if (cancelled) return;
        console.error('[STREAM] Failed to initialize:', error);
        toast({
          title: 'Chat error',
          description: 'Failed to connect to chat. Some features may not work.',
          variant: 'destructive',
        });
      }
    })();

    return () => {
      cancelled = true;
      offChannel.forEach((o) => o.unsubscribe());
      offClient.forEach((o) => o.unsubscribe());
      const leaving = ch;
      // React StrictMode (dev) mounts, unmounts and remounts immediately. Only stop watching if no newer run took over.
      setTimeout(() => {
        if (leaving && channelRun.current === run) leaving.stopWatching().catch(() => {});
      }, 300);
      setChannel(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomKey, userKey]);

  const loadRoom = async () => {
    try {
      setLoading(true);
      const data = await getRoomById(roomId);
      setRoom(data.room);
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

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !channel) return;

    try {
      await channel.sendMessage({ text: messageInput });
      setMessageInput('');
      await channel.stopTyping();
    } catch (error) {
      console.error('[CHAT] Failed to send message:', error);
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
      // 1. Stop video call if active (VideoCall handles its own cleanup)
      if (isVideoCallActive) {
        setIsVideoCallActive(false);
      }

      // 2. Stop typing and leave the channel
      if (channel) {
        try {
          await channel.stopTyping();
        } catch (err) {
          console.log('[CLEANUP] Could not stop typing:', err);
        }
        try {
          await channel.stopWatching();
        } catch (err) {
          console.log('[CLEANUP] Could not leave channel:', err);
        }
      }

      // Don't disconnect from Stream here: StreamProvider owns the global connection.
      setChannel(null);
      setMessages([]);
      setIsVideoCallActive(false);

      router.push('/social');
    } catch (error) {
      console.error('[CLEANUP] Cleanup error:', error);
      router.push('/social');
    }
  };

  const handleCloseRoom = async () => {
    if (!room) return;
    try {
      setClosing(true);
      // Backend sends room_closed to ALL participants (including this one), which triggers cleanup + redirect.
      await closeRoom(room.roomId);
    } catch (error: any) {
      console.error('[CLOSE] Failed to close room:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to close room',
        variant: 'destructive',
      });
      setClosing(false);
      setConfirmClose(false);
    }
  };

  const handleStartVideoCall = () => {
    if (!streamToken || !streamApiKey) {
      toast({
        title: 'Not ready yet',
        description: 'The call service is still initialising. Try again in a moment.',
        variant: 'destructive',
      });
      return;
    }
    setVideoOpen(true);
    setIsVideoCallActive(true);
  };

  const handleEndCall = () => {
    setIsVideoCallActive(false);
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else document.documentElement.requestFullscreen().catch(() => {});
  };

  if (loading) {
    return (
      <div role="status" className="flex min-h-dvh flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="size-5 animate-spin text-primary" />
        Joining the room…
      </div>
    );
  }

  if (!room || !user) {
    return null;
  }

  const conn = CONNECTION_COPY[connection];

  /* ------------------------------ panels ------------------------------ */

  const board = <CollaborativeCanvas roomId={room.roomId} />;

  const videoPanel = (
    <section aria-label="Video call" className="shrink-0 border-b border-border">
      <div className="flex h-10 items-center justify-between px-3">
        <h2 className="t-eyebrow flex items-center gap-2">
          <StatusDot tone={isVideoCallActive ? 'success' : 'neutral'} live={isVideoCallActive} />
          Call
        </h2>
        <Button size="icon-sm" variant="ghost" onClick={() => setVideoOpen((o) => !o)} aria-expanded={videoOpen} aria-label={videoOpen ? 'Minimise call panel' : 'Expand call panel'}>
          {videoOpen ? <ChevronUp /> : <ChevronDown />}
        </Button>
      </div>
      {videoOpen &&
        (isVideoCallActive && streamToken && streamApiKey ? (
          <VideoCall
            apiKey={streamApiKey}
            token={streamToken}
            userId={user.id}
            userName={user.displayName || user.email}
            userImage={user.photoURL || undefined}
            callId={`video-${room.roomId}`}
            participants={room.participants}
            onCallEnd={handleEndCall}
          />
        ) : (
          <div className="space-y-4 px-3 pb-4">
            <Button className="w-full" onClick={handleStartVideoCall} disabled={!streamToken || !streamApiKey}>
              {!streamToken ? <Loader2 className="animate-spin" /> : <Video />}
              {!streamToken ? 'Preparing call…' : 'Start video call'}
            </Button>
            <ul className="space-y-2">
              {room.participants.map((p) => (
                <li key={p._id} className="flex items-center gap-2.5">
                  <PersonAvatar person={p} size="sm" online={p.onlineStatus} />
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {personName(p)}
                    {p._id === user.id && <span className="ml-1.5 text-xs text-faint">you</span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
    </section>
  );

  const chatPanel = (
    <section aria-label="Chat" className={cn('flex min-h-0 flex-col', chatOpen ? 'flex-1' : 'shrink-0')}>
      <div className="flex h-10 shrink-0 items-center justify-between px-3">
        <h2 className="t-eyebrow">
          Chat {messages.length > 0 && <span className="t-num ml-1 text-faint">{messages.length}</span>}
        </h2>
        <Button size="icon-sm" variant="ghost" onClick={() => setChatOpen((o) => !o)} aria-expanded={chatOpen} aria-label={chatOpen ? 'Minimise chat' : 'Expand chat'}>
          {chatOpen ? <ChevronDown /> : <ChevronUp />}
        </Button>
      </div>
      {chatOpen && (
        <ChatPanel
          messages={messages}
          ready={!!channel}
          typingUser={isTyping}
          input={messageInput}
          onInput={handleTyping}
          onSend={handleSendMessage}
          currentUserId={user.id}
        />
      )}
    </section>
  );

  const sidebar = (
    <div className="flex h-full min-h-0 flex-col bg-card">
      {videoPanel}
      {chatPanel}
    </div>
  );

  /* ------------------------------- shell ------------------------------ */

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border px-3 sm:px-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" onClick={() => router.push('/social')} aria-label="Back to Collab Space">
              <ArrowLeft />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Back to Collab Space</TooltipContent>
        </Tooltip>

        <div className="flex min-w-0 items-center gap-3">
          <span className="flex -space-x-1.5" aria-hidden>
            {room.participants.slice(0, 4).map((p) => (
              <PersonAvatar key={p._id} person={p} size="sm" className="rounded-md ring-2 ring-background" />
            ))}
          </span>
          <div className="min-w-0 leading-tight">
            <h1 className="truncate text-sm font-medium">{room.participants.filter((p) => p._id !== user.id).map(personName).join(', ') || 'Your room'}</h1>
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground" role="status">
              <StatusDot tone={conn.tone} live={connection !== 'connected'} />
              {conn.label}
            </p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-1">
          {desktop && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon-sm" onClick={() => setSidebarOpen((o) => !o)} aria-pressed={!sidebarOpen} aria-label={sidebarOpen ? 'Focus on the board' : 'Show chat and call'}>
                    {sidebarOpen ? <PanelRightClose /> : <PanelRightOpen />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{sidebarOpen ? 'Focus on the board' : 'Show chat and call'}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon-sm" onClick={toggleFullscreen} aria-pressed={fullscreen} aria-label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
                    {fullscreen ? <Minimize2 /> : <Maximize2 />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{fullscreen ? 'Exit fullscreen' : 'Fullscreen'}</TooltipContent>
              </Tooltip>
            </>
          )}
          <Button variant="outline" size="sm" onClick={() => setConfirmClose(true)} className="ml-1 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive">
            <LogOut /> <span className="hidden sm:inline">End room</span>
          </Button>
        </div>
      </header>

      {connection === 'reconnecting' && (
        <p role="alert" className="shrink-0 border-b border-warning/30 bg-warning/10 px-4 py-1.5 text-center text-xs">
          Connection lost. Your strokes and messages will sync once you're back.
        </p>
      )}

      {desktop ? (
        <div className="min-h-0 flex-1">
          <ResizablePanelGroup direction="horizontal" autoSaveId="codeorbit.room.layout">
            <ResizablePanel id="board" order={1} defaultSize={68} minSize={40}>
              <div className="h-full bg-surface-sunken/40">{board}</div>
            </ResizablePanel>
            {sidebarOpen && (
              <>
                <ResizableHandle withHandle />
                <ResizablePanel id="side" order={2} defaultSize={32} minSize={22} maxSize={46}>
                  {sidebar}
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        </div>
      ) : (
        <>
          <div className="shrink-0 border-b border-border px-3 py-2">
            <Segmented
              label="Room view"
              value={mobileTab}
              onChange={setMobileTab}
              options={[
                { value: 'board', label: 'Board' },
                { value: 'chat', label: `Chat${messages.length ? ` · ${messages.length}` : ''}` },
                { value: 'call', label: isVideoCallActive ? 'Call · live' : 'Call' },
              ]}
            />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {mobileTab === 'board' && <div className="h-full bg-surface-sunken/40">{board}</div>}
            {mobileTab === 'chat' && <div className="flex h-full flex-col bg-card">{chatPanel}</div>}
            {mobileTab === 'call' && <div className="bg-card">{videoPanel}</div>}
          </div>
        </>
      )}

      <AlertDialog open={confirmClose} onOpenChange={(o) => !closing && setConfirmClose(o)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End this room for everyone?</AlertDialogTitle>
            <AlertDialogDescription>
              The session closes for all participants and chat and call end. The board is kept, but nobody can rejoin this room.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={closing}>Stay</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleCloseRoom();
              }}
              disabled={closing}
            >
              {closing && <Loader2 className="animate-spin" />}
              {closing ? 'Ending…' : 'End room'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function RoomPage() {
  return (
    <AuthGuard>
      <RoomView />
    </AuthGuard>
  );
}
