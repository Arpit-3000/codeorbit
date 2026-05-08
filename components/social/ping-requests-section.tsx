"use client";

import { useState, useEffect } from 'react';
import { Radio, Check, X, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
import {
  getPendingPings,
  acceptPingRequest,
  rejectPingRequest,
  sendPingRequest,
  getFriendsList,
  PingRequest,
} from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';

export function PingRequestsSection() {
  const router = useRouter();
  const [pings, setPings] = useState<PingRequest[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState('');
  const [pingMessage, setPingMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('[PING REQUESTS] Loading data...');
      
      const [pingsData, friendsData] = await Promise.all([
        getPendingPings(),
        getFriendsList(),
      ]);
      
      console.log('[PING REQUESTS] Pings received:', pingsData.pings?.length || 0);
      console.log('[PING REQUESTS] Friends received:', friendsData.friends?.length || 0);
      console.log('[PING REQUESTS] Online friends:', friendsData.friends?.filter(f => f.onlineStatus).length || 0);
      
      setPings(pingsData.pings || []);
      setFriends(friendsData.friends || []);
    } catch (error) {
      console.error('[PING REQUESTS] Failed to load pings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load ping requests',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (pingId: string) => {
    try {
      setActionLoading(pingId);
      const response = await acceptPingRequest(pingId);
      toast({
        title: 'Ping Accepted!',
        description: 'Redirecting to collaboration room...',
      });
      // Redirect to room
      setTimeout(() => {
        router.push(`/room/${response.roomId}`);
      }, 1000);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to accept ping',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (pingId: string) => {
    try {
      setActionLoading(pingId);
      await rejectPingRequest(pingId);
      toast({
        title: 'Ping Rejected',
        description: 'Ping request rejected',
      });
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to reject ping',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendPing = async () => {
    if (!selectedFriend) {
      toast({
        title: 'Error',
        description: 'Please select a friend',
        variant: 'destructive',
      });
      return;
    }

    try {
      setActionLoading('send');
      console.log('[PING REQUESTS] Sending ping to:', selectedFriend);
      console.log('[PING REQUESTS] Message:', pingMessage);
      
      await sendPingRequest(selectedFriend, pingMessage || undefined);
      
      console.log('[PING REQUESTS] Ping sent successfully');
      
      toast({
        title: 'Ping Sent! 🔔',
        description: 'Your collaboration request has been sent',
      });
      
      setSendDialogOpen(false);
      setSelectedFriend('');
      setPingMessage('');
    } catch (error: any) {
      console.error('[PING REQUESTS] Failed to send ping:', error);
      
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to send ping',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Radio className="h-5 w-5" />
                Ping Requests
                {pings.length > 0 && (
                  <Badge variant="destructive">{pings.length}</Badge>
                )}
              </CardTitle>
              <CardDescription>
                Collaboration requests from your friends
              </CardDescription>
            </div>
            <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Send className="h-4 w-4 mr-2" />
                  Send Ping
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Send Ping Request</DialogTitle>
                  <DialogDescription>
                    Invite a friend to collaborate in real-time
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="friend-select">Select Friend</Label>
                    <Select value={selectedFriend} onValueChange={setSelectedFriend}>
                      <SelectTrigger id="friend-select" className="w-full">
                        <SelectValue placeholder="Choose a friend..." />
                      </SelectTrigger>
                      <SelectContent>
                        {friends.filter((f) => f.onlineStatus).length === 0 ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            No friends are currently online
                          </div>
                        ) : (
                          friends
                            .filter((f) => f.onlineStatus)
                            .map((friend) => (
                              <SelectItem key={friend._id} value={friend._id}>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage src={friend.photoURL || friend.profileImage} />
                                    <AvatarFallback>
                                      {(friend.displayName || friend.username || 'U')[0].toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span>{friend.displayName || friend.username}</span>
                                  <Badge variant="outline" className="text-green-500 border-green-500 ml-auto">
                                    Online
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))
                        )}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      You can only ping friends who are online
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ping-message">Message (Optional)</Label>
                    <Input
                      id="ping-message"
                      placeholder="Let's solve problems together!"
                      value={pingMessage}
                      onChange={(e) => setPingMessage(e.target.value)}
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleSendPing}
                    disabled={actionLoading === 'send' || !selectedFriend}
                  >
                    {actionLoading === 'send' ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Send Ping
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {pings.length > 0 ? (
            <div className="space-y-3">
              {pings.map((ping) => (
                <Card key={ping._id} className="border-primary/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={ping.sender.photoURL || ping.sender.profileImage}
                        />
                        <AvatarFallback>
                          {(
                            ping.sender.displayName ||
                            ping.sender.username ||
                            'U'
                          )[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold">
                          {ping.sender.displayName || ping.sender.username}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {ping.message || 'wants to collaborate'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(ping.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAccept(ping._id)}
                          disabled={actionLoading === ping._id}
                        >
                          {actionLoading === ping._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Accept
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(ping._id)}
                          disabled={actionLoading === ping._id}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No pending ping requests
            </div>
          )}
        </CardContent>
      </Card>

      {friends.filter((f) => f.onlineStatus).length === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <p>No friends are currently online</p>
            <p className="text-sm mt-2">
              You can only ping friends who are online
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
