"use client";

import { useState, useEffect, useCallback } from 'react';
import { Check, Trash2, Loader2, CheckCheck, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  Notification,
} from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { EmptyState, ErrorState, timeAgo } from '@/components/ds/primitives';
import { cn } from '@/lib/utils';
import { PersonAvatar } from './person';
import { onCollab } from '@/lib/collab-events';
import { NOTIFICATION_ICON } from './notification-bell';

export function NotificationsSection() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadNotifications = useCallback(async (quiet = false) => {
    try {
      if (!quiet) setFailed(false);
      const data = await getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      if (!quiet) setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    const off = onCollab('notifications-changed', () => loadNotifications(true));
    const poll = setInterval(() => loadNotifications(true), 20_000);
    return () => {
      off();
      clearInterval(poll);
    };
  }, [loadNotifications]);

  const run = async (id: string, fn: () => Promise<unknown>, errorText: string, okText?: string) => {
    try {
      setActionLoading(id);
      await fn();
      if (okText) toast({ title: okText });
      await loadNotifications();
    } catch {
      toast({ title: 'Error', description: errorText, variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="t-eyebrow">
          Activity {unreadCount > 0 && <span className="t-num ml-1 text-primary">{unreadCount} new</span>}
        </p>
        {unreadCount > 0 && (
          <Button size="sm" variant="ghost" onClick={() => run('all', markAllNotificationsAsRead, 'Failed to mark all as read', 'All caught up')} disabled={actionLoading === 'all'}>
            {actionLoading === 'all' ? <Loader2 className="animate-spin" /> : <CheckCheck />} Mark all read
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-12" />)}</div>
      ) : failed ? (
        <ErrorState compact title="Couldn't load activity" onRetry={() => loadNotifications()} />
      ) : notifications.length > 0 ? (
        <ul>
          {notifications.map((n) => {
            // Skip notifications with null sender (data integrity issue)
            if (!n.sender) return null;
            const Icon = NOTIFICATION_ICON[n.type] ?? BellRing;
            const busy = actionLoading === n._id;
            return (
              <li key={n._id} className={cn('group relative flex items-start gap-3 border-b border-border py-3 last:border-b-0', n.read && 'opacity-60')}>
                {!n.read && <span className="absolute -left-3 top-3 bottom-3 w-0.5 bg-primary" aria-hidden />}
                <PersonAvatar person={n.sender} size="md" />
                <div className="min-w-0 flex-1 leading-snug">
                  <p className="flex items-center gap-1.5 text-[13px] font-medium">
                    <Icon className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">{n.title}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{n.message}</p>
                  <p className="t-num mt-1 text-[11px] text-faint">{timeAgo(n.createdAt)}</p>
                </div>
                <div className="flex shrink-0 gap-0.5 opacity-60 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                  {!n.read && (
                    <Button size="icon-sm" variant="ghost" onClick={() => run(n._id, () => markNotificationAsRead(n._id), 'Failed to mark as read')} disabled={busy} aria-label="Mark as read">
                      {busy ? <Loader2 className="animate-spin" /> : <Check />}
                    </Button>
                  )}
                  <Button size="icon-sm" variant="ghost" onClick={() => run(n._id, () => deleteNotification(n._id), 'Failed to delete notification')} disabled={busy} aria-label="Delete notification">
                    <Trash2 />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState compact title="Nothing yet" description="Requests, accepted invites and room events will be listed here." />
      )}
    </div>
  );
}
