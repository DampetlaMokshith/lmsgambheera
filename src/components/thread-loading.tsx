'use client';

import { useEffect, useState } from 'react';

const greetings = [
  { text: 'hello', lang: 'en' },
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
    // Change greeting every 500ms (3000ms / 6 greetings = 500ms per greeting)
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
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center overflow-hidden">
      {/* Background Text - THREADLMS */}
      <div className="absolute inset-0 flex items-center justify-center px-4">
        <h1 
          className="text-white opacity-10 whitespace-nowrap select-none font-peste tracking-wider"
          style={{
            fontSize: 'clamp(3rem, 12vw, 16rem)',
            lineHeight: '1',
            fontWeight: 400
          }}
        >
          THREADLMS
        </h1>
      </div>

      {/* Foreground Text - Greetings */}
      <div className="relative z-10 flex items-center justify-center">
        <p
          className={`text-white font-inter text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-medium transition-opacity duration-100 ${
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
