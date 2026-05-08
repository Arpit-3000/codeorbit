"use client";

import { useState, useEffect } from 'react';
import { Users, UserMinus, Loader2, Check, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  getFriendsList,
  getFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  sendPingRequest,
} from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

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

export function FriendsListSection() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('[FRIENDS LIST] Loading data...');
      
      const [friendsData, requestsData] = await Promise.all([
        getFriendsList(),
        getFriendRequests(),
      ]);
      
      console.log('[FRIENDS LIST] Friends data received:', friendsData);
      console.log('[FRIENDS LIST] Friends array:', friendsData.friends);
      console.log('[FRIENDS LIST] Friends count:', friendsData.friends?.length || 0);
      console.log('[FRIENDS LIST] Requests data received:', requestsData);
      console.log('[FRIENDS LIST] Requests count:', requestsData.requests?.length || 0);
      
      setFriends(friendsData.friends || []);
      setRequests(requestsData.requests || []);
    } catch (error) {
      console.error('[FRIENDS LIST] Failed to load friends data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load friends data. Please refresh the page.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (userId: string) => {
    try {
      setActionLoading(userId);
      console.log('[ACCEPT] Starting accept request for user:', userId);
      
      const response = await acceptFriendRequest(userId);
      console.log('[ACCEPT] Request accepted successfully:', response);
      
      toast({
        title: 'Request Accepted',
        description: 'You are now friends!',
      });
      
      // Reload data to reflect changes
      await loadData();
    } catch (error: any) {
      console.error('[ACCEPT] Error accepting request:', error);
      console.error('[ACCEPT] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      
      // Check if it's a network error (backend not running)
      if (error.message === 'Network Error' || !error.response) {
        toast({
          title: 'Connection Error',
          description: 'Cannot connect to server. Please check if backend is running on port 5000.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: error.response?.data?.message || 'Failed to accept request',
          variant: 'destructive',
        });
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectRequest = async (userId: string) => {
    try {
      setActionLoading(userId);
      await rejectFriendRequest(userId);
      toast({
        title: 'Request Rejected',
        description: 'Friend request rejected',
      });
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to reject request',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveFriend = async (userId: string) => {
    try {
      setActionLoading(userId);
      await removeFriend(userId);
      toast({
        title: 'Friend Removed',
        description: 'Successfully unfollowed user',
      });
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to remove friend',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handlePingFriend = async (friend: Friend) => {
    try {
      setActionLoading(`ping-${friend._id}`);
      
      // Check if friend is online
      if (!friend.onlineStatus) {
        toast({
          title: 'User Offline',
          description: `${friend.displayName || friend.username} is currently offline. You can only ping online friends.`,
          variant: 'destructive',
        });
        return;
      }

      console.log('[PING] Sending ping to:', friend._id);
      const response = await sendPingRequest(friend._id, 'wants to collaborate');
      console.log('[PING] Ping sent successfully:', response);
      
      toast({
        title: 'Ping Sent! 🔔',
        description: `Ping request sent to ${friend.displayName || friend.username}`,
      });
    } catch (error: any) {
      console.error('[PING] Error sending ping:', error);
      
      const errorMessage = error.response?.data?.message || 'Failed to send ping';
      toast({
        title: 'Error',
        description: errorMessage,
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
    <Tabs defaultValue="friends" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="friends">
          Friends ({friends.length})
        </TabsTrigger>
        <TabsTrigger value="requests">
          Requests ({requests.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="friends" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Your Friends
            </CardTitle>
            <CardDescription>People you follow and collaborate with</CardDescription>
          </CardHeader>
          <CardContent>
            {friends.length > 0 ? (
              <div className="space-y-3">
                {friends.map((friend) => (
                  <Card key={friend._id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={friend.photoURL || friend.profileImage} />
                          <AvatarFallback>
                            {(friend.displayName || friend.username || 'U')[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold truncate">
                              {friend.displayName || friend.username}
                            </p>
                            {friend.onlineStatus ? (
                              <Badge variant="outline" className="text-green-500 border-green-500">
                                Online
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-gray-500 border-gray-500">
                                Offline
                              </Badge>
                            )}
                          </div>
                          {friend.username && (
                            <p className="text-sm text-muted-foreground">@{friend.username}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handlePingFriend(friend)}
                            disabled={actionLoading === `ping-${friend._id}` || !friend.onlineStatus}
                            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                          >
                            {actionLoading === `ping-${friend._id}` ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Zap className="h-4 w-4 mr-2" />
                                Ping
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveFriend(friend._id)}
                            disabled={actionLoading === friend._id}
                          >
                            {actionLoading === friend._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <UserMinus className="h-4 w-4 mr-2" />
                                Unfollow
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No friends yet. Start by searching for users!
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="requests" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Friend Requests</CardTitle>
            <CardDescription>People who want to follow you</CardDescription>
          </CardHeader>
          <CardContent>
            {requests.length > 0 ? (
              <div className="space-y-3">
                {requests.map((request) => (
                  <Card key={request._id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage
                            src={request.sender.photoURL || request.sender.profileImage}
                          />
                          <AvatarFallback>
                            {(
                              request.sender.displayName ||
                              request.sender.username ||
                              'U'
                            )[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">
                            {request.sender.displayName || request.sender.username}
                          </p>
                          {request.sender.username && (
                            <p className="text-sm text-muted-foreground">
                              @{request.sender.username}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleAcceptRequest(request.sender._id)}
                            disabled={actionLoading === request.sender._id}
                          >
                            {actionLoading === request.sender._id ? (
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
                            onClick={() => handleRejectRequest(request.sender._id)}
                            disabled={actionLoading === request.sender._id}
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
                No pending friend requests
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
