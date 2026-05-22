'use client';

import ThreadLoading from '@/components/thread-loading';
import { useEffect, useState } from 'react';

export default function LoadingPage() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Show loading animation for 3500ms to allow all hello greetings to complete
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) {
    return null;
  }

  return <ThreadLoading />;
}