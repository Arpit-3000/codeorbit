"use client";

import { useState, useEffect, useCallback } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getUserRooms, Room } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { EmptyState, ErrorState, StatusDot, timeAgo } from '@/components/ds/primitives';
import { PersonAvatar, personName } from './person';

export function RoomsSection() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const loadRooms = useCallback(async () => {
    try {
      setFailed(false);
      const data = await getUserRooms();
      setRooms(data.rooms || []);
    } catch (error) {
      console.error('Failed to load rooms:', error);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  return (
    <div className="space-y-4">
      <p className="t-eyebrow flex items-center gap-2">
        <StatusDot tone={rooms.some((r) => r.active) ? 'success' : 'neutral'} live={rooms.some((r) => r.active)} />
        Rooms
      </p>
      {loading ? (
        <Skeleton className="h-16" />
      ) : failed ? (
        <ErrorState compact title="Couldn't load your rooms" onRetry={loadRooms} />
      ) : rooms.length > 0 ? (
        <ul>
          {rooms.map((room) => (
            <li key={room._id} className="flex items-center gap-3 border-b border-border py-3 last:border-b-0">
              <span className="flex -space-x-2">
                {room.participants.slice(0, 3).map((p) => (
                  <PersonAvatar key={p._id} person={p} size="md" className="rounded-md ring-2 ring-background" />
                ))}
              </span>
              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-sm font-medium">{room.participants.map(personName).join(', ')}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {room.active ? 'Live' : 'Closed'} · started {timeAgo(room.createdAt)}
                </p>
              </div>
              {room.active && (
                <Button size="sm" onClick={() => router.push(`/room/${room.roomId}`)}>
                  Rejoin <ArrowUpRight />
                </Button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState compact title="No rooms yet" description="Accept a ping, or ping a friend, and your room appears here." />
      )}
    </div>
  );
}
