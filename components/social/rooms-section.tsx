"use client";

import { useState, useEffect } from 'react';
import { MessageSquare, Users, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getUserRooms, Room } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';

export function RoomsSection() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      setLoading(true);
      const data = await getUserRooms();
      setRooms(data.rooms || []);
    } catch (error) {
      console.error('Failed to load rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = (roomId: string) => {
    router.push(`/room/${roomId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Discussion Rooms
        </CardTitle>
        <CardDescription>
          Your active collaboration rooms
        </CardDescription>
      </CardHeader>
      <CardContent>
        {rooms.length > 0 ? (
          <div className="space-y-3">
            {rooms.map((room) => (
              <Card key={room._id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-2">
                      {room.participants.slice(0, 3).map((participant) => (
                        <Avatar
                          key={participant._id}
                          className="h-10 w-10 border-2 border-background"
                        >
                          <AvatarImage
                            src={participant.photoURL || participant.profileImage}
                          />
                          <AvatarFallback>
                            {(
                              participant.displayName ||
                              participant.username ||
                              'U'
                            )[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">
                          Room with{' '}
                          {room.participants
                            .map((p) => p.displayName || p.username)
                            .join(', ')}
                        </p>
                        {room.active ? (
                          <Badge variant="default" className="bg-green-500">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Closed</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {room.participants.length} participants
                        </span>
                        <span>
                          Created{' '}
                          {formatDistanceToNow(new Date(room.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        {room.participants
                          .filter((p) => p.onlineStatus)
                          .map((p) => (
                            <Badge
                              key={p._id}
                              variant="outline"
                              className="text-xs text-green-500 border-green-500"
                            >
                              {p.displayName || p.username} online
                            </Badge>
                          ))}
                      </div>
                    </div>
                    {room.active && (
                      <Button onClick={() => handleJoinRoom(room.roomId)}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Join Room
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No active rooms</p>
            <p className="text-sm mt-2">
              Send a ping to a friend to start collaborating!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
