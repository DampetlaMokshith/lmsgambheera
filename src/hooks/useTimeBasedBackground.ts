'use client';

import { useState, useEffect } from 'react';

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export const useTimeBasedBackground = () => {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('morning');

  useEffect(() => {
    const updateTimeOfDay = () => {
      // Get current time in IST
      const now = new Date();
      const istTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
      const hour = istTime.getHours();

      if (hour >= 0 && hour < 12) {
        setTimeOfDay('morning');
      } else if (hour >= 12 && hour <= 15) {
        setTimeOfDay('afternoon');
      } else if (hour > 15 && hour <= 18) {
        setTimeOfDay('evening');
      } else {
        setTimeOfDay('night');
      }
    };

    // Update immediately
    updateTimeOfDay();

    // Update every minute to check for time changes
    const interval = setInterval(updateTimeOfDay, 60000);

    return () => clearInterval(interval);
  }, []);

  const getBackgroundImage = (): string => {
    switch (timeOfDay) {
      case 'morning':
        return '/background-morning-desktop.svg';
      case 'afternoon':
        return '/background-afternoon.png';
      case 'evening':
        return '/background-evening.png';
      case 'night':
        return '/background-night.png';
      default:
        return '/background-morning-desktop.svg';
    }
  };

  


  return {
    timeOfDay,
    backgroundImage: getBackgroundImage(),
  };
};