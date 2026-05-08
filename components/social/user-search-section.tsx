"use client";

import { useState, useEffect } from 'react';
import { Search, UserPlus, UserCheck, Loader2, Clock, UserMinus } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { searchUsers, sendFriendRequest, getUserSuggestions, SearchUser } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';

type FollowStatus = 'none' | 'pending' | 'following';

export function UserSearchSection() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [suggestions, setSuggestions] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [followStatus, setFollowStatus] = useState<Map<string, FollowStatus>>(new Map());

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    try {
      setLoadingSuggestions(true);
      const data = await getUserSuggestions();
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      const data = await searchUsers(searchQuery);
      setSearchResults(data.users || []);
      
      // If no results, show message
      if (data.users.length === 0) {
        toast({
          title: 'No Results',
          description: 'No users found. Try searching by username or email.',
        });
      }
    } catch (error) {
      console.error('Search failed:', error);
      toast({
        title: 'Search Failed',
        description: 'Failed to search users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFollowAction = async (userId: string) => {
    const currentStatus = followStatus.get(userId) || 'none';

    try {
      if (currentStatus === 'none') {
        // Send follow request
        await sendFriendRequest(userId);
        setFollowStatus(prev => new Map(prev).set(userId, 'pending'));
        toast({
          title: 'Success',
          description: 'Follow request sent',
        });
      } else if (currentStatus === 'following') {
        // Unfollow user
        // TODO: Call unfollow API when available
        setFollowStatus(prev => new Map(prev).set(userId, 'none'));
        toast({
          title: 'Success',
          description: 'Unfollowed user',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to perform action',
        variant: 'destructive',
      });
    }
  };

  const getFollowButton = (userId: string) => {
    const status = followStatus.get(userId) || 'none';

    switch (status) {
      case 'pending':
        return (
          <Button size="sm" variant="outline" disabled>
            <Clock className="h-4 w-4 mr-2" />
            Pending
          </Button>
        );
      case 'following':
        return (
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => handleFollowAction(userId)}
          >
            <UserMinus className="h-4 w-4 mr-2" />
            Unfollow
          </Button>
        );
      default:
        return (
          <Button
            size="sm"
            onClick={() => handleFollowAction(userId)}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Follow
          </Button>
        );
    }
  };

  const UserCard = ({ user }: { user: SearchUser }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.photoURL || user.profileImage} />
            <AvatarFallback>
              {(user.displayName || user.username || user.email || 'U')[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold truncate">
                {user.displayName || user.username || 'User'}
              </p>
              {user.onlineStatus && (
                <Badge variant="outline" className="text-green-500 border-green-500">
                  Online
                </Badge>
              )}
            </div>
            {user.username && (
              <p className="text-sm text-muted-foreground">@{user.username}</p>
            )}
            {user.email && (
              <p className="text-xs text-muted-foreground">{user.email}</p>
            )}
            {user.bio && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{user.bio}</p>
            )}
          </div>
          {getFollowButton(user._id)}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Search Users</CardTitle>
            <CardDescription>Find and connect with other developers</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by username, name, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {searchResults.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Search Results</h3>
          <div className="space-y-3">
            {searchResults.map((user) => (
              <UserCard key={user._id} user={user} />
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold mb-4">Suggested Users</h3>
        {loadingSuggestions ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : suggestions.length > 0 ? (
          <div className="space-y-3">
            {suggestions.map((user) => (
              <UserCard key={user._id} user={user} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No suggestions available
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
