"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setNotifications([]);
        setUnreadCount(0);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching notifications:', error);
        return;
      }

      const notificationData = data || [];
      setNotifications(notificationData);
      setUnreadCount(notificationData.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
        return false;
      }

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        return false;
      }

      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  };

  const createNotification = async (
    type: string,
    title: string,
    message: string,
    data: Record<string, unknown> = {}
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type,
          title,
          message,
          data
        });

      if (error) {
        console.error('Error creating notification:', error);
        return false;
      }

      // Refresh notifications
      fetchNotifications();
      return true;
    } catch (error) {
      console.error('Error creating notification:', error);
      return false;
    }
  };

  // Auto-refresh notifications
  useEffect(() => {
    fetchNotifications();

    // Set up real-time subscription
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    createNotification,
    refreshNotifications: fetchNotifications
  };
}

// Utility functions for creating specific notification types
export const notificationUtils = {
  createWelcomeSignup: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    return await supabase.rpc('create_welcome_notification');
  },

  createWelcomeBack: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    return await supabase.rpc('create_welcome_back_notification', {
      user_uuid: user.id
    });
  },

  createCourseNotification: async (
    type: 'course_added' | 'course_updated' | 'course_enrolled' | 'lecture_released',
    courseTitle: string,
    courseId?: string
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    return await supabase.rpc('create_course_notification', {
      user_uuid: user.id,
      notification_type: type,
      course_title: courseTitle,
      course_id: courseId
    });
  },

  createDiscussionNotification: async (
    courseTitle: string,
    authorName: string,
    courseId?: string
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    return await supabase.rpc('create_discussion_notification', {
      user_uuid: user.id,
      course_title: courseTitle,
      author_name: authorName,
      course_id: courseId
    });
  },

  createTodoNotification: async (
    assignmentTitle: string,
    courseTitle: string,
    assignmentId?: string
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    return await supabase.rpc('create_todo_notification', {
      user_uuid: user.id,
      assignment_title: assignmentTitle,
      course_title: courseTitle,
      assignment_id: assignmentId
    });
  }
};