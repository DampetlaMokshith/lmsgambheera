'use client';

import ThreadLoading from '@/components/thread-loading';
import { useEffect, useState } from 'react';

export default function LoadingPage() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Hide loading page after 4 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) {
    return null;
  }

  return <ThreadLoading />;
}