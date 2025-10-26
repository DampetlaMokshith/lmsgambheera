'use client';

import { useEffect, useState, useCallback } from 'react';
import { Bell } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { supabase } from '@/lib/supabase';

interface WelcomeNotificationProps {
  userId: string;
  userEmail: string;
}

const motivationalQuotes = [
  "Knowledge is power!",
  "Learn something new every day!",
  "Your future self will thank you!",
  "Education is the key to success!",
  "Every expert was once a beginner!",
  "The best time to learn is now!",
  "Invest in yourself, it pays dividends!",
  "Learning never stops!",
  "Grow through what you go through!",
  "Knowledge has no expiry date!"
];

export default function WelcomeNotification({ userId, userEmail }: WelcomeNotificationProps) {
  const [hasNotification, setHasNotification] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [userName, setUserName] = useState('');

  const getFirstNameFromEmail = (email: string) => {
    return email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1);
  };

  const createUserProfile = useCallback(async () => {
    try {
      const firstName = getFirstNameFromEmail(userEmail);
      
      const { error } = await supabase
        .from('profiles')
        .insert([
          {
            id: userId,
            full_name: firstName,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]);

      if (error) {
        console.error('Error creating profile:', error);
      } else {
        setUserName(firstName);
      }
    } catch (error) {
      console.error('Error creating user profile:', error);
    }
  }, [userId, userEmail]);

  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        // Check if user has profiles table entry (indicating they've been here before)
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error && error.code === 'PGRST116') {
          // User doesn't exist in profiles - first time signup
          setIsNewUser(true);
          setHasNotification(true);
          await createUserProfile();
        } else if (profile) {
          // Existing user - show welcome back message
          setIsNewUser(false);
          setHasNotification(true);
          setUserName(profile.full_name || getFirstNameFromEmail(userEmail));
        }
      } catch (error) {
        console.error('Error checking user status:', error);
      }
    };

    checkUserStatus();
  }, [userId, userEmail, createUserProfile]);

  const getRandomQuote = () => {
    return motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
  };

  const handleNotificationClick = () => {
    setShowTooltip(!showTooltip);
  };

  const handleDismiss = () => {
    setHasNotification(false);
    setShowTooltip(false);
  };

  if (!hasNotification) {
    return (
      <button className="text-white hover:bg-white/10 p-2 rounded-lg cursor-pointer">
        <Bell size={20} />
      </button>
    );
  }

  const welcomeMessage = isNewUser 
    ? `Welcome to LMS Gambheera, ${userName || getFirstNameFromEmail(userEmail)}!`
    : `Welcome back, ${userName || getFirstNameFromEmail(userEmail)}!`;

  const quote = getRandomQuote();

  return (
    <TooltipProvider>
      <Tooltip open={showTooltip} onOpenChange={setShowTooltip}>
        <TooltipTrigger asChild>
          <button 
            className="relative text-white hover:bg-white/10 p-2 rounded-lg cursor-pointer transition-colors"
            onClick={handleNotificationClick}
            aria-label="Notifications"
          >
            <Bell size={20} />
            {/* Notification dot */}
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          </button>
        </TooltipTrigger>
        <TooltipContent 
          side="bottom" 
          align="end"
          className="w-64 sm:w-72 md:w-80 p-4 bg-gray-900 border border-gray-700 shadow-lg max-w-[90vw] z-50"
          sideOffset={8}
          avoidCollisions
        >
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1 pr-2">
                <h3 className="font-semibold text-white text-sm leading-tight">
                  {welcomeMessage}
                </h3>
                <p className="text-gray-300 text-xs italic leading-relaxed">
                  &ldquo;{quote}&rdquo;
                </p>
                {isNewUser && (
                  <p className="text-gray-400 text-xs leading-relaxed">
                    Start your learning journey with us today!
                  </p>
                )}
              </div>
              <button
                onClick={handleDismiss}
                className="text-gray-400 hover:text-white ml-1 text-sm flex-shrink-0 w-5 h-5 flex items-center justify-center hover:bg-gray-700 rounded transition-colors"
                aria-label="Dismiss notification"
              >
                ✕
              </button>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}