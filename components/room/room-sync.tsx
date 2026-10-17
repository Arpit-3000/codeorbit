"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type MutableRefObject, type ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { getFreshToken } from '@/lib/token';
import { toast } from '@/hooks/use-toast';

/**
 * One realtime connection per room, shared by everything that syncs: the whiteboard, the code editor and
 * video-call presence. The server (services/whiteboard.service.js) is the authority; this just owns the
 * socket, joins the room on every (re)connect, and hands each consumer the snapshot it needs.
 */

export type SyncStatus = 'connecting' | 'live' | 'offline' | 'denied';
export interface CallUser {
  id: string;
  name: string;
}
export interface JoinAck {
  ok: boolean;
  items: any[];
  locks: Array<{ id: string; userId: string; name: string }>;
  userId: string;
  name: string;
  callUsers: CallUser[];
}

interface RoomSyncValue {
  socket: Socket | null;
  status: SyncStatus;
  /** True between a successful join and the next disconnect. */
  joinedRef: MutableRefObject<boolean>;
  me: { id: string; name: string } | null;
  callUsers: CallUser[];
  /** Emit with an ack, resolving `{ ok: false }` when offline or after 8s instead of hanging. */
  send: (event: string, payload?: any) => Promise<any>;
  /** Run `cb` after every successful join (immediately if already joined). Returns an unsubscribe. */
  onJoined: (cb: (ack: JoinAck) => void) => () => void;
}

const RoomSyncContext = createContext<RoomSyncValue | null>(null);

export function useRoomSync() {
  const ctx = useContext(RoomSyncContext);
  if (!ctx) throw new Error('useRoomSync must be used inside <RoomSyncProvider>');
  return ctx;
}

export function RoomSyncProvider({ roomId, children }: { roomId: string; children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<SyncStatus>('connecting');
  const [me, setMe] = useState<{ id: string; name: string } | null>(null);
  const [callUsers, setCallUsers] = useState<CallUser[]>([]);
  const joinedRef = useRef(false);
  const lastAck = useRef<JoinAck | null>(null);
  const listeners = useRef<Set<(ack: JoinAck) => void>>(new Set());
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    let alive = true;
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    const s = io(API_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 400,
      reconnectionDelayMax: 3000,
      // Evaluated on every (re)connect, so an expired Google token is renewed automatically.
      auth: (cb) => {
        getFreshToken().then((token) => cb({ token }));
      },
    });
    socketRef.current = s;

    const join = () => {
      s.emit('join', { roomId }, (ack: JoinAck) => {
        if (!alive) return;
        if (!ack?.ok) {
          joinedRef.current = false;
          setStatus('denied');
          toast({ title: 'Live sync unavailable', description: "You don't have access to this room's board.", variant: 'destructive' });
          return;
        }
        joinedRef.current = true;
        lastAck.current = ack;
        setMe({ id: ack.userId, name: ack.name });
        setCallUsers(ack.callUsers || []);
        setStatus('live');
        listeners.current.forEach((cb) => cb(ack));
      });
    };

    s.on('connect', join);
    s.on('disconnect', () => {
      joinedRef.current = false;
      if (alive) setStatus('offline');
    });
    s.on('connect_error', (err) => {
      joinedRef.current = false;
      if (alive) setStatus(err.message === 'unauthorized' ? 'denied' : 'offline');
    });
    s.on('call:state', ({ users }: { users: CallUser[] }) => alive && setCallUsers(users));
    setSocket(s);

    return () => {
      alive = false;
      joinedRef.current = false;
      lastAck.current = null;
      s.removeAllListeners();
      s.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, [roomId]);

  const send = useCallback(
    (event: string, payload: any = {}) =>
      new Promise<any>((resolve) => {
        const s = socketRef.current;
        if (!s || !joinedRef.current) return resolve({ ok: false, error: 'offline' });
        let done = false;
        const timer = setTimeout(() => {
          if (!done) {
            done = true;
            resolve({ ok: false, error: 'timeout' });
          }
        }, 8000);
        s.emit(event, payload, (ack: any) => {
          if (done) return;
          done = true;
          clearTimeout(timer);
          resolve(ack || { ok: false, error: 'no-ack' });
        });
      }),
    []
  );

  const onJoined = useCallback((cb: (ack: JoinAck) => void) => {
    listeners.current.add(cb);
    if (joinedRef.current && lastAck.current) cb(lastAck.current);
    return () => {
      listeners.current.delete(cb);
    };
  }, []);

  const value = useMemo(() => ({ socket, status, joinedRef, me, callUsers, send, onJoined }), [socket, status, me, callUsers, send, onJoined]);
  return <RoomSyncContext.Provider value={value}>{children}</RoomSyncContext.Provider>;
}
