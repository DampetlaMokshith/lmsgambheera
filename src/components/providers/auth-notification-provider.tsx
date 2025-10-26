"use client";

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { notificationUtils } from '@/hooks/use-notifications';

export function useAuthNotifications() {
  useEffect(() => {
    const handleAuthStateChange = async (event: string, session: { user: { created_at: string; id: string } } | null) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Check if this is a new user (created_at is recent)
        const userCreatedAt = new Date(session.user.created_at);
        const now = new Date();
        const timeDiff = now.getTime() - userCreatedAt.getTime();
        const isNewUser = timeDiff < 60000; // Within 1 minute of creation

        if (isNewUser) {
          // New user signup - welcome message will be created by trigger
          console.log('New user detected, welcome notification will be created by trigger');
        } else {
          // Returning user - create welcome back notification
          try {
            await notificationUtils.createWelcomeBack();
          } catch (error) {
            console.error('Error creating welcome back notification:', error);
          }
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    return () => {
      subscription?.unsubscribe();
    };
  }, []);
}

// Component to be used in the main app layout
export function AuthNotificationProvider({ children }: { children: React.ReactNode }) {
  useAuthNotifications();
  return <>{children}</>;
}