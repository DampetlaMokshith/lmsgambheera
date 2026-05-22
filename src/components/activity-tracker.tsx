"use client";

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface ActivityTrackerProps {
  userId?: string;
  pageUrl?: string;
  activityType?: string;
  sessionDuration?: number;
}

export const useActivityTracker = ({
  userId,
  pageUrl,
  activityType = 'page_visit',
  sessionDuration = 15,
}: ActivityTrackerProps = {}) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const isActiveRef = useRef<boolean>(true);

  useEffect(() => {
    const getCurrentUserId = async () => {
      if (userId) return userId;
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.user?.id || null;
      } catch (error) {
        return null;
      }
    };

    const trackActivity = async () => {
      try {
        const currentUserId = await getCurrentUserId();
        if (!currentUserId) return;

        const response = await fetch('/api/activity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: currentUserId,
            page_url: pageUrl || window.location.pathname,
            activity_type: activityType,
            session_duration: sessionDuration,
          }),
        });

        const result = await response.json();
        if (!result.success) {
          // Failed to track activity
        }
      } catch (error) {
        // Error tracking activity
      }
    };

    const handleVisibilityChange = () => {
      isActiveRef.current = !document.hidden;
      if (isActiveRef.current) {
        lastActivityRef.current = Date.now();
      }
    };

    const handleUserActivity = () => {
      lastActivityRef.current = Date.now();
      isActiveRef.current = true;
    };

    const startTracking = () => {
      // Track activity every 15 seconds if user is active
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const timeSinceLastActivity = now - lastActivityRef.current;
        
        // Only track if user has been active in the last 30 seconds and page is visible
        if (isActiveRef.current && timeSinceLastActivity < 30000) {
          trackActivity();
        }
      }, sessionDuration * 1000);
    };

    const stopTracking = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    // Set up event listeners for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Start tracking
    startTracking();

    // Track initial page load
    trackActivity();

    // Cleanup function
    return () => {
      stopTracking();
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [userId, pageUrl, activityType, sessionDuration]);

  return null; // This hook doesn't render anything
};

// Component version for easy integration
export const ActivityTracker: React.FC<ActivityTrackerProps> = (props) => {
  useActivityTracker(props);
  return null;
};