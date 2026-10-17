"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  StreamVideo,
  StreamVideoClient,
  Call,
  useCallStateHooks,
  StreamCall,
  ParticipantView,
} from '@stream-io/video-react-sdk';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import { Loader2, Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, RotateCw, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusDot } from '@/components/ds/primitives';
import { cn } from '@/lib/utils';

interface VideoCallProps {
  apiKey: string;
  token: string;
  userId: string;
  userName: string;
  userImage?: string;
  callId: string;
  /** Ids of people who currently have the room open. Anyone else is hidden from the grid immediately. */
  presentIds?: Set<string> | null;
  participants: Array<{
    _id: string;
    displayName: string;
    username: string;
    photoURL?: string;
    profileImage?: string;
  }>;
  onCallEnd?: () => void;
}

function VideoCallUI({
  roomParticipants,
  presentIds,
  onCallEnd,
}: {
  roomParticipants: VideoCallProps['participants'];
  presentIds?: Set<string> | null;
  onCallEnd?: () => void;
}) {
  const { useCallCallingState, useParticipants, useMicrophoneState, useCameraState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const allParticipants = useParticipants();
  // Someone who left the room is removed from the grid straight away instead of lingering until the SFU times them out
  const callParticipants = allParticipants.filter((p) => p.isLocalParticipant || !presentIds || presentIds.has(p.userId));
  const { microphone } = useMicrophoneState();
  const { camera } = useCameraState();

  const [micOff, setMicOff] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);

  // You can still be in the call without a camera or mic; just say why nothing is being sent.
  const camPerm = (camera as any).state?.hasBrowserPermission ?? true;
  const micPerm = (microphone as any).state?.hasBrowserPermission ?? true;
  const noCamera = (camera as any).state?.devices?.length === 0;
  const noMic = (microphone as any).state?.devices?.length === 0;
  const deviceNotice = !camPerm || !micPerm
    ? 'Camera or microphone access is blocked in your browser. You can see and hear others, but they can’t see or hear you.'
    : noCamera && noMic
      ? 'No camera or microphone found. You’re in the call as a viewer.'
      : noCamera
        ? 'No camera found, or it’s in use by another app or tab. You’re sending audio only.'
        : null;

  useEffect(() => {
    if (callingState === 'left') onCallEnd?.();
  }, [callingState, onCallEnd]);

  const toggleMic = async () => {
    try {
      if (micOff) await microphone.enable();
      else await microphone.disable();
      setMicOff(!micOff);
    } catch (error) {
      console.error('[VIDEO] Failed to toggle mic:', error);
    }
  };

  const toggleCamera = async () => {
    try {
      if (cameraOff) await camera.enable();
      else await camera.disable();
      setCameraOff(!cameraOff);
    } catch (error) {
      console.error('[VIDEO] Failed to toggle camera:', error);
    }
  };

  if (callingState !== 'joined') {
    return (
      <div role="status" className="flex items-center gap-3 p-4 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin text-primary" />
        {callingState === 'joining' ? 'Joining the call…' : callingState === 'reconnecting' ? 'Connection dropped. Reconnecting…' : 'Connecting…'}
      </div>
    );
  }

  const inCall = (id: string) => callParticipants.some((p) => p.userId === id);
  const notInCall = roomParticipants.filter((p) => !inCall(p._id));
  const gone = presentIds ? notInCall.filter((p) => !presentIds.has(p._id)) : [];
  const waiting = notInCall.filter((p) => !gone.includes(p));

  return (
    <div className="flex flex-col">
      <div className={cn('grid gap-px bg-border', callParticipants.length > 1 ? 'grid-cols-2' : 'grid-cols-1')}>
        {callParticipants.map((p) => (
          <div key={p.sessionId} className="relative aspect-video overflow-hidden bg-black">
            <ParticipantView participant={p} ParticipantViewUI={null} />
            <span className="absolute bottom-1.5 left-1.5 rounded-sm bg-black/70 px-1.5 py-0.5 text-[11px] text-white">
              {p.isLocalParticipant ? 'You' : p.name || 'User'}
            </span>
          </div>
        ))}
      </div>

      {deviceNotice && (
        <p role="status" className="flex items-start gap-2 border-b border-warning/30 bg-warning/10 px-3 py-2 text-xs">
          <TriangleAlert className="mt-px size-3.5 shrink-0 text-warning" /> {deviceNotice}
        </p>
      )}

      {gone.length > 0 && (
        <p role="status" className="border-b border-border px-3 py-2 text-xs text-muted-foreground">
          {gone.map((w) => w.displayName || w.username).join(', ')} {gone.length === 1 ? 'isn’t' : 'aren’t'} in the room.
        </p>
      )}

      {waiting.length > 0 && (
        <p className="border-b border-border px-3 py-2 text-xs text-muted-foreground">
          Waiting for {waiting.map((w) => w.displayName || w.username).join(', ')}…
        </p>
      )}

      <div className="flex items-center justify-between gap-2 p-2">
        <span className="flex items-center gap-1.5 px-1 text-xs text-muted-foreground">
          <StatusDot tone="success" live />
          <span className="t-num">{callParticipants.length}</span> in call
        </span>
        <div className="flex items-center gap-1">
          <Button size="icon-sm" variant={micOff ? 'destructive' : 'secondary'} onClick={toggleMic} aria-pressed={micOff} aria-label={micOff ? 'Unmute microphone' : 'Mute microphone'} title={micOff ? 'Unmute' : 'Mute'}>
            {micOff ? <MicOff /> : <Mic />}
          </Button>
          <Button size="icon-sm" variant={cameraOff ? 'destructive' : 'secondary'} onClick={toggleCamera} aria-pressed={cameraOff} aria-label={cameraOff ? 'Turn camera on' : 'Turn camera off'} title={cameraOff ? 'Camera on' : 'Camera off'}>
            {cameraOff ? <VideoOff /> : <VideoIcon />}
          </Button>
          <Button size="sm" variant="destructive" onClick={() => onCallEnd?.()}>
            <PhoneOff /> Leave
          </Button>
        </div>
      </div>
    </div>
  );
}

export function VideoCall({
  apiKey,
  token,
  userId,
  userName,
  userImage,
  callId,
  presentIds,
  participants,
  onCallEnd,
}: VideoCallProps) {
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<Call | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  // React StrictMode (dev) mounts, unmounts and remounts straight away. Counting runs lets a stale cleanup see that
  // a newer run took over and leave the shared client alone, instead of tearing down the live call.
  const runs = useRef(0);
  const [error, setError] = useState<string | null>(null);

  // Stream rejects a connection whose user data exceeds 5KB. A profile photo stored as a data: URL is far bigger
  // than that, and it made the call hang on "Setting up the call…" forever. Only send a short, real URL.
  const safeImage = userImage && /^https?:\/\//i.test(userImage) && userImage.length <= 500 ? userImage : undefined;
  const safeName = (userName || 'User').slice(0, 80);

  useEffect(() => {
    const run = ++runs.current;
    let videoClient: StreamVideoClient | null = null;
    let videoCall: Call | null = null;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    // Start on the next tick, not synchronously. In React dev StrictMode the first run is torn down immediately, and
    // a join already in flight can't be cleanly cancelled: it left a second "ghost" session for the same user in
    // the call (2 people showed as 4). Deferring means the throwaway run never joins at all.
    const startTimer = setTimeout(() => void start(), 0);

    const start = async () => {
      try {
        setFailed(false);
        setError(null);
        // One client per user: asking again returns the same one instead of opening a second connection
        const config = {
          apiKey,
          user: { id: userId, name: safeName, image: safeImage },
          token,
          // Defaults are tight for slower networks; a timeout here is the most common reason a call "won't connect"
          options: { timeout: 20000, defaultWsTimeout: 20000 } as any,
        };
        // First attempt shares the per-user instance. A retry (after a failure we disconnected) must build a fresh
        // client: the registry would hand back the dead one ("User token is not set").
        videoClient = attempt === 0 ? StreamVideoClient.getOrCreateInstance(config) : new StreamVideoClient(config);
        videoCall = videoClient.call('default', callId);
        // create: true => create the call if nobody has started it yet. Retry transient failures. A watchdog turns
        // a join that never settles (the SDK can swallow connection errors) into a visible, retryable failure.
        const watchdog = new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error('timeout: the video service did not respond')), 30000);
        });
        watchdog.catch(() => {});
        for (let attempt = 1; ; attempt++) {
          try {
            await Promise.race([videoCall.join({ create: true }), watchdog]);
            clearTimeout(timer);
            break;
          } catch (e: any) {
            if (attempt >= 3 || cancelled || /token|auth|jwt|permission|forbidden/i.test(String(e?.message))) throw e;
            await videoCall.leave().catch(() => {});
            await new Promise((r) => setTimeout(r, 1200 * attempt));
          }
        }
        if (cancelled) return;
        setClient(videoClient);
        setCall(videoCall);
      } catch (e: any) {
        clearTimeout(timer);
        console.error('[VIDEO] Failed to initialize call:', e);
        // Drop a half-connected client so "Try again" starts from scratch instead of reusing a broken one
        videoCall?.leave().catch(() => {});
        videoClient?.disconnectUser().catch(() => {});
        if (cancelled) return;
        const msg = String(e?.message || e);
        setError(
          /5KB|PayloadTooBig|413/i.test(msg)
            ? 'Your profile data is too large for the video service. Try again after updating your profile photo.'
            : /token|auth|jwt|expired/i.test(msg)
            ? 'Your call session expired. Reload the page and try again.'
            : /network|fetch|timeout|websocket|ice/i.test(msg)
              ? 'Couldn’t reach the video service. Check your connection (some networks block video calls) and try again.'
              : 'Couldn’t start the call. Try again in a moment.'
        );
        setFailed(true);
      }
    };

    return () => {
      cancelled = true;
      clearTimeout(startTimer);
      clearTimeout(timer);
      setClient(null);
      setCall(null);
      const leaving = videoCall;
      const owner = videoClient;
      leaving?.leave().catch(() => {});
      setTimeout(() => {
        if (runs.current === run) owner?.disconnectUser().catch(() => {});
      }, 300);
    };
  }, [apiKey, token, userId, userName, userImage, callId, attempt]);

  const retry = useCallback(() => setAttempt((a) => a + 1), []);

  if (failed) {
    return (
      <div role="alert" className="space-y-3 p-4">
        <p className="text-sm font-medium">Couldn't start the call</p>
        <p className="text-xs text-muted-foreground">{error ?? 'Try again in a moment.'}</p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={retry}>
            <RotateCw /> Try again
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onCallEnd?.()}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  if (!client || !call) {
    return (
      <div role="status" className="flex items-center gap-3 p-4 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin text-primary" />
        Setting up the call…
      </div>
    );
  }

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <VideoCallUI roomParticipants={participants} presentIds={presentIds} onCallEnd={onCallEnd} />
      </StreamCall>
    </StreamVideo>
  );
}
