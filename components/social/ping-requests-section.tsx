"use client";

import { useState, useEffect, useCallback } from 'react';
import { Check, X, Loader2, Send, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getPendingPings,
  acceptPingRequest,
  rejectPingRequest,
  sendPingRequest,
  getFriendsList,
  PingRequest,
} from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { EmptyState, ErrorState, StatusDot, formatCountdown } from '@/components/ds/primitives';
import { PersonAvatar, PersonRow, personName } from './person';

/**
 * Incoming pings are the most time-sensitive thing in Collab Space (they expire in 5 minutes),
 * so each one carries its own countdown, and the list re-checks the server every 15s.
 */
export function PingRequestsSection({ onCount }: { onCount?: (n: number) => void }) {
  const router = useRouter();
  const [pings, setPings] = useState<PingRequest[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [opening, setOpening] = useState<string | null>(null);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState('');
  const [pingMessage, setPingMessage] = useState('');
  const [now, setNow] = useState(() => Date.now());

  const loadData = useCallback(async (quiet = false) => {
    try {
      if (!quiet) setLoading(true);
      setFailed(false);
      const [pingsData, friendsData] = await Promise.all([getPendingPings(), getFriendsList()]);
      const p: PingRequest[] = pingsData.pings || [];
      setPings(p);
      setFriends(friendsData.friends || []);
      onCount?.(p.length);
    } catch (error) {
      console.error('[PING REQUESTS] Failed to load pings:', error);
      if (!quiet) setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [onCount]);

  useEffect(() => {
    loadData();
    const poll = setInterval(() => loadData(true), 15_000);
    return () => clearInterval(poll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (pings.length === 0) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [pings.length]);

  const handleAccept = async (pingId: string) => {
    try {
      setActionLoading(pingId);
      const response = await acceptPingRequest(pingId);
      setOpening(pingId);
      toast({ title: 'Ping accepted', description: 'Opening the collaboration room…' });
      setTimeout(() => router.push(`/room/${response.roomId}`), 800);
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to accept ping', variant: 'destructive' });
      setActionLoading(null);
    }
  };

  const handleReject = async (pingId: string) => {
    try {
      setActionLoading(pingId);
      await rejectPingRequest(pingId);
      toast({ title: 'Ping declined' });
      loadData(true);
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to reject ping', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendPing = async () => {
    if (!selectedFriend) {
      toast({ title: 'Pick a friend first', variant: 'destructive' });
      return;
    }
    try {
      setActionLoading('send');
      await sendPingRequest(selectedFriend, pingMessage || undefined);
      toast({ title: 'Ping sent', description: 'They have 5 minutes to answer.' });
      setSendDialogOpen(false);
      setSelectedFriend('');
      setPingMessage('');
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to send ping', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const online = friends.filter((f) => f.onlineStatus);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="t-eyebrow flex items-center gap-2">
          <StatusDot tone={pings.length ? 'primary' : 'neutral'} live={pings.length > 0} />
          Pings {pings.length > 0 && <span className="t-num text-primary">{pings.length}</span>}
        </p>
        <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Send /> New ping
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ping a friend</DialogTitle>
              <DialogDescription>They get a live invite to a room with chat, whiteboard and video. It expires in 5 minutes.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="friend-select">Friend</Label>
                <Select value={selectedFriend} onValueChange={setSelectedFriend}>
                  <SelectTrigger id="friend-select" className="w-full">
                    <SelectValue placeholder="Choose a friend…" />
                  </SelectTrigger>
                  <SelectContent>
                    {online.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">No friends are online right now</div>
                    ) : (
                      online.map((friend) => (
                        <SelectItem key={friend._id} value={friend._id}>
                          <span className="flex items-center gap-2">
                            <PersonAvatar person={friend} size="sm" />
                            {personName(friend)}
                          </span>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Only friends who are online can be pinged.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ping-message">Message <span className="text-faint">(optional)</span></Label>
                <Input id="ping-message" placeholder="Let's work through a graph problem together" value={pingMessage} onChange={(e) => setPingMessage(e.target.value)} />
              </div>
              <Button className="w-full" onClick={handleSendPing} disabled={actionLoading === 'send' || !selectedFriend}>
                {actionLoading === 'send' ? <Loader2 className="animate-spin" /> : <Send />}
                {actionLoading === 'send' ? 'Sending' : 'Send ping'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <Skeleton className="h-16" />
      ) : failed ? (
        <ErrorState compact title="Couldn't check for pings" onRetry={() => loadData()} />
      ) : pings.length > 0 ? (
        <ul className="border-l-2 border-primary pl-4">
          {pings.map((ping) => {
            const left = new Date(ping.expiresAt).getTime() - now;
            const busy = actionLoading === ping._id;
            return (
              <PersonRow
                key={ping._id}
                person={ping.sender}
                meta={
                  <span>
                    {ping.message || 'wants to collaborate'}
                    {ping.expiresAt && (
                      <span className={left < 60_000 ? 't-num ml-2 text-destructive' : 't-num ml-2 text-faint'}>
                        {left > 0 ? `· ${formatCountdown(left)} left` : '· expiring'}
                      </span>
                    )}
                  </span>
                }
              >
                <Button size="sm" onClick={() => handleAccept(ping._id)} disabled={busy || left <= 0}>
                  {opening === ping._id ? <Loader2 className="animate-spin" /> : busy ? <Loader2 className="animate-spin" /> : <Check />}
                  {opening === ping._id ? 'Opening…' : 'Join'}
                </Button>
                <Button size="icon-sm" variant="ghost" onClick={() => handleReject(ping._id)} disabled={busy} aria-label={`Decline ping from ${personName(ping.sender)}`}>
                  <X />
                </Button>
              </PersonRow>
            );
          })}
        </ul>
      ) : (
        <EmptyState
          compact
          icon={<Radio className="size-4" />}
          title="No pings waiting"
          description={online.length ? `${online.length} friend${online.length === 1 ? ' is' : 's are'} online. Ping one to start a room.` : 'Nobody is online right now.'}
        />
      )}
    </div>
  );
}
