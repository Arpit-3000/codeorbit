"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, UserPlus, UserCheck, Users, Radio, MessageSquare, BellRing, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getNotifications, markNotificationAsRead, Notification } from '@/lib/api';
import { timeAgo } from '@/components/ds/primitives';
import { cn } from '@/lib/utils';
import { onCollab } from '@/lib/collab-events';

export const NOTIFICATION_ICON: Record<string, LucideIcon> = {
  friend_request: UserPlus,
  request_accepted: UserCheck,
  follow: Users,
  ping_request: Radio,
  ping_accepted: Radio,
  message: MessageSquare,
};

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    const off = onCollab('notifications-changed', loadNotifications);
    return () => {
      clearInterval(interval);
      off();
    };
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await getNotifications(10, 0);
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
      setFailed(false);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      setFailed(true);
    } finally {
      setLoaded(true);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    setOpen(false);

    if (!notification.read) {
      try {
        await markNotificationAsRead(notification._id);
        setNotifications(prev =>
          prev.map(n => n._id === notification._id ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error: any) {
        // The notification will still be marked as read on next load
        console.error('Failed to mark as read:', error);
      }
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        >
          <Bell />
          {unreadCount > 0 && (
            <span className="t-num absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[22rem] max-w-[calc(100vw-1.5rem)] p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-baseline gap-2">
            <h3 className="t-title text-sm">Notifications</h3>
            {unreadCount > 0 && <span className="t-num text-xs text-primary">{unreadCount} new</span>}
          </div>
          <Link href="/social?tab=notifications" onClick={() => setOpen(false)} className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
            View all
          </Link>
        </div>
        <div className="max-h-[26rem] overflow-y-auto">
          {notifications.length > 0 ? (
            notifications.map((notification) => {
              // Skip notifications with null sender (data integrity issue)
              if (!notification.sender) return null;
              const Icon = NOTIFICATION_ICON[notification.type] ?? BellRing;

              return (
                <button
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    'relative flex w-full gap-3 border-b px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-accent/60',
                    !notification.read && 'bg-primary-soft/60'
                  )}
                >
                  {!notification.read && <span className="absolute left-0 top-0 h-full w-0.5 bg-primary" aria-hidden />}
                  <Avatar className="size-8 rounded-md after:rounded-md">
                    <AvatarImage className="rounded-md" src={notification.sender.photoURL || notification.sender.profileImage} />
                    <AvatarFallback className="rounded-md text-xs">
                      {(notification.sender.displayName || notification.sender.username || 'U')[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 text-[13px] font-medium">
                      <Icon className="size-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate">{notification.title}</span>
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{notification.message}</p>
                    <p className="t-eyebrow mt-1.5 normal-case tracking-normal">{timeAgo(notification.createdAt)}</p>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="px-6 py-10 text-center">
              <p className="text-sm font-medium">
                {failed ? "Couldn't reach notifications" : loaded ? "You're all caught up" : 'Checking for updates…'}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {failed
                  ? 'We will keep retrying every 30 seconds.'
                  : 'Friend requests, pings and room invites will show up here.'}
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
