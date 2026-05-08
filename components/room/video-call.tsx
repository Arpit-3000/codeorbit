"use client";

import { useEffect, useState } from 'react';
import {
  StreamVideo,
  StreamVideoClient,
  Call,
  useCallStateHooks,
  StreamCall,
  ParticipantView,
} from '@stream-io/video-react-sdk';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import { Loader2, Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

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
  onCallEnd 
}: { 
  roomParticipants: VideoCallProps['participants'];
  onCallEnd?: () => void;
}) {
  const { useCallCallingState, useParticipants, useMicrophoneState, useCameraState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const callParticipants = useParticipants();
  const { microphone, isMute } = useMicrophoneState();
  const { camera, isMute: isCameraOff } = useCameraState();

  const [localMuted, setLocalMuted] = useState(false);
  const [localCameraOff, setLocalCameraOff] = useState(false);

  useEffect(() => {
    if (callingState === 'left') {
      onCallEnd?.();
    }
  }, [callingState, onCallEnd]);

  const toggleMic = async () => {
    try {
      if (localMuted) {
        await microphone.enable();
      } else {
        await microphone.disable();
      }
      setLocalMuted(!localMuted);
    } catch (error) {
      console.error('[VIDEO] Failed to toggle mic:', error);
    }
  };

  const toggleCamera = async () => {
    try {
      if (localCameraOff) {
        await camera.enable();
      } else {
        await camera.disable();
      }
      setLocalCameraOff(!localCameraOff);
    } catch (error) {
      console.error('[VIDEO] Failed to toggle camera:', error);
    }
  };

  const handleEndCall = () => {
    onCallEnd?.();
  };

  if (callingState !== 'joined') {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            {callingState === 'joining' ? 'Joining video call...' : 'Connecting...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Video Call Status */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-3 w-3 rounded-full bg-blue-500 animate-pulse" />
          <p className="text-sm font-medium">Video Call Active</p>
        </div>
        <p className="text-xs text-muted-foreground">
          {callParticipants.length} participant{callParticipants.length !== 1 ? 's' : ''} in call
        </p>
      </div>

      {/* Video Participants */}
      <div className="space-y-3 max-h-[300px] overflow-y-auto">
        {callParticipants.length > 0 ? (
          callParticipants.map((participant) => (
            <div key={participant.sessionId} className="relative rounded-lg overflow-hidden bg-black aspect-video">
              <ParticipantView
                participant={participant}
                ParticipantViewUI={null}
              />
              <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded text-xs text-white">
                {participant.name || 'User'} {participant.isLocalParticipant && '(You)'}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Waiting for others to join...
          </div>
        )}
      </div>

      {/* Video Controls */}
      <div className="grid grid-cols-3 gap-2">
        <Button
          variant={localMuted ? "destructive" : "outline"}
          size="lg"
          className="h-16"
          onClick={toggleMic}
        >
          <div className="flex flex-col items-center gap-1">
            {localMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            <span className="text-xs">{localMuted ? 'Unmute' : 'Mute'}</span>
          </div>
        </Button>
        
        <Button
          variant={localCameraOff ? "destructive" : "outline"}
          size="lg"
          className="h-16"
          onClick={toggleCamera}
        >
          <div className="flex flex-col items-center gap-1">
            {localCameraOff ? <VideoOff className="h-5 w-5" /> : <VideoIcon className="h-5 w-5" />}
            <span className="text-xs">{localCameraOff ? 'Camera Off' : 'Camera On'}</span>
          </div>
        </Button>

        <Button
          variant="destructive"
          size="lg"
          className="h-16"
          onClick={handleEndCall}
        >
          <div className="flex flex-col items-center gap-1">
            <PhoneOff className="h-5 w-5" />
            <span className="text-xs">End Call</span>
          </div>
        </Button>
      </div>

      {/* Participants Status */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Participants</h4>
        {roomParticipants.map((participant) => {
          const isInCall = callParticipants.some(p => p.userId === participant._id);
          return (
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
                {isInCall ? (
                  <Badge variant="outline" className="text-green-500 border-green-500 text-xs mt-1">
                    In Call
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-gray-500 border-gray-500 text-xs mt-1">
                    Not in Call
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeCall = async () => {
      try {
        console.log('[VIDEO] Initializing video call...');
        console.log('[VIDEO] User:', userId, userName);
        console.log('[VIDEO] Call ID:', callId);

        // Create video client
        const videoClient = new StreamVideoClient({
          apiKey,
          user: {
            id: userId,
            name: userName,
            image: userImage,
          },
          token,
        });

        setClient(videoClient);

        // Create or join call
        const videoCall = videoClient.call('default', callId);
        
        // Join the call (create: true means create if doesn't exist)
        await videoCall.join({ create: true });
        
        console.log('[VIDEO] ✅ Call joined successfully');
        console.log('[VIDEO] Participants:', videoCall.state.participants);
        setCall(videoCall);
      } catch (error) {
        console.error('[VIDEO] Failed to initialize call:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeCall();

    return () => {
      console.log('[VIDEO] Cleaning up video call...');
      if (call) {
        call.leave().catch(console.error);
      }
      if (client) {
        client.disconnectUser().catch(console.error);
      }
    };
  }, [apiKey, token, userId, userName, userImage, callId]);

  if (loading || !client || !call) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Setting up video call...</p>
        </div>
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
