"use client";

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getNotifications, markNotificationAsRead, Notification } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    loadNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await getNotifications(10, 0);
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Close popover first for better UX
    setOpen(false);
    
    // Mark as read in background (don't block UI)
    if (!notification.read) {
      try {
        await markNotificationAsRead(notification._id);
        // Update local state immediately for better UX
        setNotifications(prev => 
          prev.map(n => n._id === notification._id ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error: any) {
        console.error('Failed to mark as read:', error);
        // Don't show error to user, just log it
        // The notification will still be marked as read on next load
      }
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'friend_request':
        return '👥';
      case 'request_accepted':
        return '✅';
      case 'follow':
        return '👤';
      case 'ping_request':
        return '📍';
      case 'ping_accepted':
        return '🎉';
      case 'message':
        return '💬';
      default:
        return '🔔';
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          <Link href="/social?tab=notifications">
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </Link>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length > 0 ? (
            notifications.map((notification) => {
              // Skip notifications with null sender (data integrity issue)
              if (!notification.sender) {
                console.warn('Notification with null sender:', notification._id);
                return null;
              }
              
              return (
                <button
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full p-3 hover:bg-accent transition-colors text-left border-b last:border-b-0 ${
                    !notification.read ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="text-xl">{getNotificationIcon(notification.type)}</div>
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={notification.sender.photoURL || notification.sender.profileImage}
                      />
                      <AvatarFallback>
                        {(
                          notification.sender.displayName ||
                          notification.sender.username ||
                          'U'
                        )[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{notification.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                    )}
                  </div>
                </button>
              );
            })
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              No notifications
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
