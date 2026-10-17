"use client";

import { useState, useEffect, useRef } from 'react';
import { Search, UserPlus, Loader2, Clock, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { searchUsers, sendFriendRequest, getUserSuggestions, SearchUser } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { EmptyState, ErrorState } from '@/components/ds/primitives';
import { PersonRow } from './person';

type FollowStatus = 'none' | 'sending' | 'pending' | 'friends';

/**
 * Discover people. Search runs as you type (debounced) and on Enter; same endpoint as before.
 * The follow button walks through its states instead of flipping silently.
 */
export function UserSearchSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[] | null>(null);
  const [suggestions, setSuggestions] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchFailed, setSearchFailed] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [suggestionsFailed, setSuggestionsFailed] = useState(false);
  const [followStatus, setFollowStatus] = useState<Map<string, FollowStatus>>(new Map());
  const seq = useRef(0);
  const relations = new Map<string, string>([...(searchResults ?? []), ...suggestions].map((u: any) => [u._id, u.relation]));

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    try {
      setLoadingSuggestions(true);
      setSuggestionsFailed(false);
      const data = await getUserSuggestions();
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
      setSuggestionsFailed(true);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const runSearch = async (q: string) => {
    const mine = ++seq.current;
    if (!q.trim()) {
      setSearchResults(null);
      setSearching(false);
      return;
    }
    try {
      setSearching(true);
      setSearchFailed(false);
      const data = await searchUsers(q);
      if (mine === seq.current) setSearchResults(data.users || []);
    } catch (error) {
      console.error('Search failed:', error);
      if (mine === seq.current) setSearchFailed(true);
    } finally {
      if (mine === seq.current) setSearching(false);
    }
  };

  // Debounced live search; ignores out-of-order responses.
  useEffect(() => {
    const t = setTimeout(() => runSearch(searchQuery), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const setStatus = (id: string, s: FollowStatus) => setFollowStatus((prev) => new Map(prev).set(id, s));

  const handleFollowAction = async (userId: string) => {
    const currentStatus = followStatus.get(userId) || 'none';
    if (currentStatus !== 'none') return;

    try {
      setStatus(userId, 'sending');
      const res = await sendFriendRequest(userId);
      // Public profiles connect instantly; private ones wait for approval.
      if (res?.type === 'instant') {
        setStatus(userId, 'friends');
        toast({ title: "You're friends now", description: 'You can ping them from your Friends list.' });
      } else {
        setStatus(userId, 'pending');
        toast({ title: 'Request sent', description: "They'll see it in their notifications." });
      }
    } catch (error: any) {
      setStatus(userId, currentStatus);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to perform action',
        variant: 'destructive',
      });
    }
  };

  const followButton = (userId: string) => {
    // What we've done this session wins; otherwise trust what the server says about an existing relationship.
    const rel = relations.get(userId);
    const status = followStatus.get(userId) || (rel === 'friend' ? 'friends' : rel === 'requested' ? 'pending' : 'none');
    switch (status) {
      case 'sending':
        return (
          <Button size="sm" variant="outline" disabled>
            <Loader2 className="animate-spin" /> Sending
          </Button>
        );
      case 'pending':
        return (
          <Button size="sm" variant="ghost" disabled className="text-muted-foreground">
            <Clock /> Requested
          </Button>
        );
      case 'friends':
        return (
          <Button size="sm" variant="ghost" disabled className="text-muted-foreground">
            <Check /> Friends
          </Button>
        );
      default:
        return (
          <Button size="sm" onClick={() => handleFollowAction(userId)}>
            <UserPlus /> Follow
          </Button>
        );
    }
  };

  const renderUser = (u: SearchUser) => (
    <PersonRow
      key={u._id}
      person={u}
      online={u.onlineStatus}
      meta={u.bio ? <span className="line-clamp-1">{u.bio}</span> : u.email ? <span className="truncate">{u.email}</span> : undefined}
    >
      {followButton(u._id)}
    </PersonRow>
  );

  return (
    <div className="space-y-8">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Find developers by username, name or email"
          aria-label="Search users"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && runSearch(searchQuery)}
          className="h-11 pl-10 pr-10 text-[15px]"
        />
        {searching ? (
          <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        ) : (
          searchQuery && (
            <button onClick={() => setSearchQuery('')} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-faint hover:text-foreground">
              <X className="size-4" />
            </button>
          )
        )}
      </div>

      {searchQuery.trim() ? (
        searchFailed ? (
          <ErrorState compact title="Search didn't go through" description="We couldn't reach the server. Your query is still there." onRetry={() => runSearch(searchQuery)} />
        ) : searchResults === null ? null : searchResults.length === 0 && !searching ? (
          <EmptyState compact title={`No one matches “${searchQuery.trim()}”`} description="Try their exact username, or the email they signed up with." />
        ) : (
          <section aria-label="Search results">
            <p className="t-eyebrow mb-1">{searchResults.length} result{searchResults.length === 1 ? '' : 's'}</p>
            <ul>{searchResults.map(renderUser)}</ul>
          </section>
        )
      ) : (
        <section aria-label="Suggested developers">
          <p className="t-eyebrow mb-1">Suggested</p>
          {loadingSuggestions ? (
            <div className="space-y-3 pt-3">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : suggestionsFailed ? (
            <ErrorState compact title="Couldn't load suggestions" onRetry={loadSuggestions} className="mt-3" />
          ) : suggestions.length > 0 ? (
            <ul>{suggestions.map(renderUser)}</ul>
          ) : (
            <EmptyState compact title="No suggestions right now" description="Search for someone by name above." className="mt-3" />
          )}
        </section>
      )}
    </div>
  );
}
