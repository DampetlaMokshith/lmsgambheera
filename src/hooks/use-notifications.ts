"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data: {
    icon?: string;
    actionUrl?: string;
    actionText?: string;
    courseTitle?: string;
    courseSlug?: string;
    courseSanityId?: string;
    facultyName?: string;
    studentName?: string;
    isDynamic?: boolean;
    [key: string]: unknown;
  };
  read: boolean;
  created_at: string;
  updated_at: string;
}

interface UseNotificationsOptions {
  role?: 'student' | 'faculty';
  autoRefreshInterval?: number; // in milliseconds
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { role = 'student', autoRefreshInterval = 60000 } = options;
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user || !session?.access_token) {
        setNotifications([]);
        setUnreadCount(0);
        setLoading(false);
        return;
      }

      setUserId(session.user.id);
      setAccessToken(session.access_token);

      const response = await fetch(`/api/notifications?role=${role}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [role]);

  // Mark single notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    // Handle dynamic notifications (stored in local state only)
    if (notificationId.startsWith('dynamic_')) {
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      return true;
    }

    if (!accessToken) return false;

    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ notificationId }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark as read');
      }

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;;
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!userId || !accessToken) return false;

    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ markAllRead: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark all as read');
      }

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }, [userId, accessToken]);

  // Initial fetch and setup auto-refresh
  useEffect(() => {
    fetchNotifications();

    // Set up auto-refresh
    const intervalId = setInterval(fetchNotifications, autoRefreshInterval);

    return () => clearInterval(intervalId);
  }, [fetchNotifications, autoRefreshInterval]);

  // Format relative time
  const formatTime = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now.getTime() - time.getTime();

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return time.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: time.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  // Format full date and time
  const formatFullDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return {
    notifications,
    loading,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    formatTime,
    formatFullDateTime,
  };
}

export default useNotifications;