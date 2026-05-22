'use client';

import { useEffect, useState } from 'react';

const greetings = [
  { text: 'Hello', lang: 'en' },
  { text: 'नमस्ते', lang: 'hi' },
  { text: 'నమస్కారం', lang: 'te' },
  { text: 'வணக்கம்', lang: 'ta' },
  { text: 'ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ', lang: 'pa' },
  { text: 'নমস্কার', lang: 'bn' }
];

export default function ThreadLoading() {
  const [currentGreeting, setCurrentGreeting] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Change greeting every 500ms for smoother animation
    const interval = setInterval(() => {
      setIsVisible(false);
      
      setTimeout(() => {
        setCurrentGreeting((prev) => {
          if (prev >= greetings.length - 1) {
            clearInterval(interval);
            return prev;
          }
          return prev + 1;
        });
        setIsVisible(true);
      }, 100); // Fade out duration
      
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center overflow-hidden px-4">
      {/* Background Text - THREADLMS */}
      <div className="absolute inset-0 flex items-center justify-center px-2 sm:px-4">
        <h1 
          className="text-white opacity-10 whitespace-nowrap select-none tracking-wider text-center"
          style={{
            fontSize: 'clamp(2rem, 10vw, 16rem)',
            lineHeight: '1',
            fontWeight: 400,
            fontFamily: 'var(--font-peste-trial), serif'
          }}
        >
          THREAD-LMS
        </h1>
      </div>

      {/* Foreground Text - Greetings */}
      <div className="relative z-10 flex items-center justify-center">
        <p
          className={`text-white font-inter text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-medium transition-opacity duration-100 ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            textShadow: '0 0 20px rgba(255, 255, 255, 0.3)'
          }}
        >
          {greetings[currentGreeting].text}
        </p>
      </div>
    </div>
  );
}
