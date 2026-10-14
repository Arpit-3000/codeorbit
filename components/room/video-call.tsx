"use client";

import { useCallback, useEffect, useState } from 'react';
import {
  StreamVideo,
  StreamVideoClient,
  Call,
  useCallStateHooks,
  StreamCall,
  ParticipantView,
} from '@stream-io/video-react-sdk';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import { Loader2, Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, RotateCw } from 'lucide-react';
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
  onCallEnd,
}: {
  roomParticipants: VideoCallProps['participants'];
  onCallEnd?: () => void;
}) {
  const { useCallCallingState, useParticipants, useMicrophoneState, useCameraState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const callParticipants = useParticipants();
  const { microphone } = useMicrophoneState();
  const { camera } = useCameraState();

  const [micOff, setMicOff] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);

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
  const waiting = roomParticipants.filter((p) => !inCall(p._id));

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
  participants,
  onCallEnd,
}: VideoCallProps) {
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<Call | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    // Held in locals (not state) so cleanup always sees the real objects and actually leaves the call.
    let videoClient: StreamVideoClient | null = null;
    let videoCall: Call | null = null;
    let cancelled = false;

    (async () => {
      try {
        setFailed(false);
        videoClient = new StreamVideoClient({
          apiKey,
          user: { id: userId, name: userName, image: userImage },
          token,
        });
        videoCall = videoClient.call('default', callId);
        // create: true => create the call if nobody has started it yet
        await videoCall.join({ create: true });
        if (cancelled) return;
        setClient(videoClient);
        setCall(videoCall);
      } catch (error) {
        console.error('[VIDEO] Failed to initialize call:', error);
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      setClient(null);
      setCall(null);
      videoCall?.leave().catch(() => {});
      videoClient?.disconnectUser().catch(() => {});
    };
  }, [apiKey, token, userId, userName, userImage, callId, attempt]);

  const retry = useCallback(() => setAttempt((a) => a + 1), []);

  if (failed) {
    return (
      <div role="alert" className="space-y-3 p-4">
        <p className="text-sm font-medium">Couldn't start the call</p>
        <p className="text-xs text-muted-foreground">Check that your browser has camera and microphone access, then try again.</p>
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
        <VideoCallUI roomParticipants={participants} onCallEnd={onCallEnd} />
      </StreamCall>
    </StreamVideo>
  );
}
