"use client";

import { useState, useEffect } from 'react';
import { Bell, Check, Trash2, Loader2, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  Notification,
} from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

export function NotificationsSection() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      setActionLoading(notificationId);
      await markNotificationAsRead(notificationId);
      loadNotifications();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to mark as read',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setActionLoading('all');
      await markAllNotificationsAsRead();
      toast({
        title: 'Success',
        description: 'All notifications marked as read',
      });
      loadNotifications();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to mark all as read',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      setActionLoading(notificationId);
      await deleteNotification(notificationId);
      loadNotifications();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to delete notification',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
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

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive">{unreadCount}</Badge>
              )}
            </CardTitle>
            <CardDescription>Stay updated with your activity</CardDescription>
          </div>
          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleMarkAllAsRead}
              disabled={actionLoading === 'all'}
            >
              {actionLoading === 'all' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <CheckCheck className="h-4 w-4 mr-2" />
                  Mark all as read
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notification) => {
              // Skip notifications with null sender (data integrity issue)
              if (!notification.sender) {
                console.warn('Notification with null sender:', notification._id);
                return null;
              }
              
              return (
                <Card
                  key={notification._id}
                  className={notification.read ? 'opacity-60' : 'border-primary/50'}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="text-2xl">{getNotificationIcon(notification.type)}</div>
                      <Avatar className="h-10 w-10">
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
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">{notification.title}</p>
                          {!notification.read && (
                            <Badge variant="default" className="text-xs">New</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {!notification.read && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMarkAsRead(notification._id)}
                            disabled={actionLoading === notification._id}
                          >
                            {actionLoading === notification._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(notification._id)}
                          disabled={actionLoading === notification._id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No notifications yet
          </div>
        )}
      </CardContent>
    </Card>
  );
}
