'use client';

import { useState } from 'react';
import { Bell, Check, User, GraduationCap, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useNotifications, Notification } from '@/hooks/use-notifications';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface FacultyNotificationsProps {
  userId?: string;
  userEmail?: string;
}

export default function FacultyNotifications({}: FacultyNotificationsProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  
  const {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    formatTime,
    formatFullDateTime,
  } = useNotifications({ role: 'faculty' });

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if not already
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Navigate if action URL exists
    if (notification.data.actionUrl) {
      setOpen(false);
      router.push(notification.data.actionUrl);
    }
  };

  const getNotificationEmoji = (type: string) => {
    switch (type) {
      case 'profile_incomplete':
        return '📋';
      case 'student_completed':
        return '🎉';
      default:
        return '🔔';
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="relative p-2 hover:bg-white/10 transition-colors text-white cursor-pointer rounded-lg"
          aria-label="Notifications"
        >
          <Bell size={20} className={unreadCount === 0 ? 'opacity-50' : ''} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] h-4 w-4 flex items-center justify-center font-bold rounded-full">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </SheetTrigger>
      
      <SheetContent 
        side="right" 
        className="w-full sm:w-[400px] bg-black border-l border-gray-800 p-0"
      >
        <SheetHeader className="px-4 py-4 border-b border-gray-800">
          <div className="flex items-center justify-between gap-2">
            <SheetTitle className="text-white text-lg font-semibold">
              Notifications
            </SheetTitle>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsRead()}
                className="text-xs text-gray-400 hover:text-white hover:bg-gray-800 mt-1 mr-6"
              >
                <Check className="w-3 h-3 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
          {unreadCount > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
            </p>
          )}
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-100px)]">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-pulse flex flex-col items-center gap-3">
                <div className="w-8 h-8 bg-gray-800 rounded-full" />
                <div className="w-32 h-4 bg-gray-800 rounded" />
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No notifications yet</p>
              <p className="text-gray-600 text-xs mt-1">
                We&apos;ll notify you about student completions
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800/50">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "p-4 cursor-pointer transition-colors hover:bg-gray-900/50",
                    !notification.read && "bg-gray-900/30 border-l-2 border-l-purple-500"
                  )}
                >
                  <div className="flex gap-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-0.5">
                      <span className="text-xl">{getNotificationEmoji(notification.type)}</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={cn(
                          "text-sm font-medium",
                          !notification.read ? "text-white" : "text-gray-300"
                        )}>
                          {notification.title}
                        </h4>
                        {!notification.read && (
                          <span className="flex-shrink-0 w-2 h-2 bg-purple-500 rounded-full mt-1.5" />
                        )}
                      </div>
                      
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                        {notification.message}
                      </p>

                      {/* Action button and time */}
                      <div className="flex items-center justify-between mt-3">
                        {notification.data.actionUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                          >
                            {notification.data.actionText || 'View'}
                            <ChevronRight className="w-3 h-3 ml-1" />
                          </Button>
                        )}
                        <span 
                          className="text-[10px] text-gray-600"
                          title={formatFullDateTime(notification.created_at)}
                        >
                          {formatTime(notification.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}