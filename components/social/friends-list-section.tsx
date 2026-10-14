"use client";

import { useState, useEffect, useCallback } from 'react';
import { UserMinus, Loader2, Check, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getFriendsList,
  getFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  sendPingRequest,
} from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { EmptyState, ErrorState, StatusDot, timeAgo } from '@/components/ds/primitives';
import { PersonRow, personName } from './person';
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

interface Friend {
  _id: string;
  displayName: string;
  username: string;
  photoURL?: string;
  profileImage?: string;
  onlineStatus: boolean;
  lastSeen?: string;
}

interface FriendRequest {
  _id: string;
  sender: Friend;
  createdAt: string;
}

interface Props {
  view: 'friends' | 'requests';
  /** Lets the page show live counts on its tabs. */
  onCounts?: (c: { friends: number; requests: number; online: number }) => void;
}

type PingState = 'sending' | 'sent';

export function FriendsListSection({ view, onCounts }: Props) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<Friend | null>(null);
  const [pings, setPings] = useState<Record<string, PingState>>({});

  const loadData = useCallback(async () => {
    try {
      setFailed(false);
      const [friendsData, requestsData] = await Promise.all([getFriendsList(), getFriendRequests()]);
      const f: Friend[] = friendsData.friends || [];
      const r: FriendRequest[] = requestsData.requests || [];
      setFriends(f);
      setRequests(r);
      onCounts?.({ friends: f.length, requests: r.length, online: f.filter((x) => x.onlineStatus).length });
    } catch (error) {
      console.error('[FRIENDS LIST] Failed to load friends data:', error);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [onCounts]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAcceptRequest = async (userId: string) => {
    try {
      setActionLoading(userId);
      await acceptFriendRequest(userId);
      toast({ title: 'Request accepted', description: 'You are now friends.' });
      await loadData();
    } catch (error: any) {
      // Network error => backend isn't reachable at all
      if (error.message === 'Network Error' || !error.response) {
        toast({ title: 'Connection error', description: 'Cannot reach the server. Check that the backend is running.', variant: 'destructive' });
      } else {
        toast({ title: 'Error', description: error.response?.data?.message || 'Failed to accept request', variant: 'destructive' });
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectRequest = async (userId: string) => {
    try {
      setActionLoading(userId);
      await rejectFriendRequest(userId);
      toast({ title: 'Request declined' });
      loadData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to reject request', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveFriend = async (userId: string) => {
    try {
      setActionLoading(userId);
      await removeFriend(userId);
      toast({ title: 'Friend removed', description: 'Successfully unfollowed user' });
      loadData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to remove friend', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const handlePingFriend = async (friend: Friend) => {
    if (!friend.onlineStatus) {
      toast({
        title: 'User offline',
        description: `${personName(friend)} is offline. You can only ping online friends.`,
        variant: 'destructive',
      });
      return;
    }
    try {
      setPings((p) => ({ ...p, [friend._id]: 'sending' }));
      await sendPingRequest(friend._id, 'wants to collaborate');
      setPings((p) => ({ ...p, [friend._id]: 'sent' }));
      toast({ title: 'Ping sent', description: `${personName(friend)} has 5 minutes to answer.` });
      // A ping expires on the server after 5 minutes; allow another one after that.
      setTimeout(() => setPings((p) => { const n = { ...p }; delete n[friend._id]; return n; }), 5 * 60_000);
    } catch (error: any) {
      setPings((p) => { const n = { ...p }; delete n[friend._id]; return n; });
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to send ping', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Loading your people">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-14" />)}
      </div>
    );
  }

  if (failed) {
    return <ErrorState title="Couldn't load your people" description="The server didn't respond. Nothing has been changed." onRetry={loadData} />;
  }

  if (view === 'requests') {
    return requests.length > 0 ? (
      <ul>
        {requests.map((r) => (
          <PersonRow key={r._id} person={r.sender} meta={`Asked ${timeAgo(r.createdAt)}`}>
            <Button size="sm" onClick={() => handleAcceptRequest(r.sender._id)} disabled={actionLoading === r.sender._id}>
              {actionLoading === r.sender._id ? <Loader2 className="animate-spin" /> : <Check />} Accept
            </Button>
            <Button size="sm" variant="ghost" onClick={() => handleRejectRequest(r.sender._id)} disabled={actionLoading === r.sender._id} aria-label={`Decline ${personName(r.sender)}`}>
              <X />
            </Button>
          </PersonRow>
        ))}
      </ul>
    ) : (
      <EmptyState title="No pending requests" description="When someone with a private profile asks to connect, it lands here." />
    );
  }

  const list = friends.length > 0 ? (
    <ul>
      {friends.map((f) => {
        const ping = pings[f._id];
        return (
          <PersonRow
            key={f._id}
            person={f}
            online={f.onlineStatus}
            meta={
              <span className="inline-flex items-center gap-1.5">
                <StatusDot tone={f.onlineStatus ? 'success' : 'neutral'} />
                {f.onlineStatus ? 'Online' : f.lastSeen ? `Seen ${timeAgo(f.lastSeen)}` : 'Offline'}
              </span>
            }
          >
            <Button
              size="sm"
              variant={ping === 'sent' ? 'outline' : 'default'}
              onClick={() => handlePingFriend(f)}
              disabled={ping !== undefined || !f.onlineStatus}
              title={!f.onlineStatus ? 'Friends must be online to be pinged' : undefined}
            >
              {ping === 'sending' ? <Loader2 className="animate-spin" /> : ping === 'sent' ? <Check /> : <Zap />}
              {ping === 'sending' ? 'Pinging' : ping === 'sent' ? 'Waiting…' : 'Ping'}
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={() => setConfirmRemove(f)}
              disabled={actionLoading === f._id}
              aria-label={`Remove ${personName(f)}`}
              title="Remove friend"
            >
              {actionLoading === f._id ? <Loader2 className="animate-spin" /> : <UserMinus />}
            </Button>
          </PersonRow>
        );
      })}
    </ul>
  ) : (
    <EmptyState title="No friends yet" description="Find developers in Discover. Once you're connected you can ping them into a live room." />
  );

  return (
    <>
      {list}
      <AlertDialog open={!!confirmRemove} onOpenChange={(o) => !o && setConfirmRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {confirmRemove ? personName(confirmRemove) : 'this friend'}?</AlertDialogTitle>
            <AlertDialogDescription>
              You'll both disappear from each other's friends list and won't be able to ping each other. You can connect again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep friend</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const id = confirmRemove?._id;
                setConfirmRemove(null);
                if (id) handleRemoveFriend(id);
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
