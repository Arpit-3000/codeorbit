"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getUserRooms, Room } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { EmptyState, ErrorState, StatusDot, timeAgo } from '@/components/ds/primitives';
import { PersonAvatar, personName } from './person';
import { onCollab } from '@/lib/collab-events';
import { cn } from '@/lib/utils';

export function RoomsSection() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const known = useRef<Set<string> | null>(null);

  const loadRooms = useCallback(async (quiet = false) => {
    try {
      if (!quiet) setFailed(false);
      const data = await getUserRooms();
      const next: Room[] = data.rooms || [];
      // A room we haven't seen before (after the first load) is one a friend just opened for us.
      if (known.current) {
        const added = next.filter((r) => !known.current!.has(r.roomId)).map((r) => r.roomId);
        if (added.length) setFresh((f) => new Set([...f, ...added]));
      }
      known.current = new Set(next.map((r) => r.roomId));
      setRooms(next);
    } catch (error) {
      console.error('Failed to load rooms:', error);
      if (!quiet) setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRooms();
    // Primary path: Stream's `ping_accepted` event. Backstops: a short poll, and a refetch when the tab regains focus.
    const off = onCollab('rooms-changed', () => loadRooms(true));
    const poll = setInterval(() => loadRooms(true), 5000);
    const onVisible = () => document.visibilityState === 'visible' && loadRooms(true);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      off();
      clearInterval(poll);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
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
        <ErrorState compact title="Couldn't load your rooms" onRetry={() => loadRooms()} />
      ) : rooms.length > 0 ? (
        <ul>
          {rooms.map((room) => (
            <li
              key={room._id}
              className={cn(
                'flex items-center gap-3 border-b border-border py-3 last:border-b-0',
                fresh.has(room.roomId) && 'rounded-md bg-primary/5 px-2 -mx-2'
              )}
            >
              <span className="flex -space-x-2">
                {room.participants.slice(0, 3).map((p) => (
                  <PersonAvatar key={p._id} person={p} size="md" className="rounded-md ring-2 ring-background" />
                ))}
              </span>
              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-sm font-medium">{room.participants.map(personName).join(', ')}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {fresh.has(room.roomId) && <span className="mr-1.5 font-medium text-primary">Ready to join ·</span>}
                  {room.active ? 'Live' : 'Closed'} · started {timeAgo(room.createdAt)}
                </p>
              </div>
              {room.active && (
                <Button size="sm" variant={fresh.has(room.roomId) ? 'default' : 'secondary'} onClick={() => router.push(`/room/${room.roomId}`)}>
                  {fresh.has(room.roomId) ? 'Join room' : 'Rejoin'} <ArrowUpRight />
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
