'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { GraduationCap, Users } from 'lucide-react';
import Image from 'next/image';
import LoadingPage from '@/components/loading-page';

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState('');
  const [showLoading, setShowLoading] = useState(true);

  const handleStudentClick = async () => {
    setIsLoading('student');
    router.push('/auth');
  };

  const handleFacultyClick = async () => {
    setIsLoading('faculty');
    router.push('/faculty/auth');
  };

  // Hide the loading screen after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {showLoading && <LoadingPage />}
      
      <div className="min-h-screen w-full relative">
        {/* Emerald Void Gradient Background */}
        <div
          className="absolute inset-0 z-0"
          style={{
            background: "radial-gradient(125% 125% at 50% 90%, #000000 40%, #072607 100%)",
          }}
        />
        
        {/* Content */}
        <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
          <div className="max-w-md w-full space-y-8 text-center">
            {/* Logo - Animated with fade and scale */}
            <div 
              className="flex justify-center mb-8 animate-fade-in"
              style={{ animationDelay: '0.1s', opacity: 0, animationFillMode: 'forwards' }}
            >
              <div className="w-24 h-24 bg-white rounded-lg flex items-center justify-center overflow-hidden shadow-2xl transform transition-transform hover:scale-110 duration-300">
                <Image
                  src="/MBU.jpeg"
                  alt="MBU Logo"
                  width={96}
                  height={96}
                  className="object-cover"
                />
              </div>
            </div>

            {/* Title - Animated */}
            <div 
              className="space-y-2 animate-fade-in"
              style={{ animationDelay: '0.3s', opacity: 0, animationFillMode: 'forwards' }}
            >
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                LMS Gambheera
              </h1>
              <p className="text-gray-400 text-lg">
                Learning Management System
              </p>
            </div>

            {/* Question - Animated */}
            <div 
              className="space-y-6 animate-fade-in"
              style={{ animationDelay: '0.5s', opacity: 0, animationFillMode: 'forwards' }}
            >
              <h2 className="text-xl md:text-2xl font-semibold text-white">
                Are you a student or faculty?
              </h2>

              {/* Buttons - Animated with stagger */}
              <div className="space-y-4">
                <div
                  className="animate-fade-in"
                  style={{ animationDelay: '0.7s', opacity: 0, animationFillMode: 'forwards' }}
                >
                  <Button
                    onClick={handleStudentClick}
                    disabled={isLoading !== ''}
                    className="w-full h-14 bg-white hover:bg-gray-100 text-black font-semibold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
                  >
                    <GraduationCap className="mr-3 h-6 w-6" />
                    {isLoading === 'student' ? 'Loading...' : 'Student'}
                  </Button>
                </div>

                <div
                  className="animate-fade-in"
                  style={{ animationDelay: '0.9s', opacity: 0, animationFillMode: 'forwards' }}
                >
                  <Button
                    onClick={handleFacultyClick}
                    disabled={isLoading !== ''}
                    className="w-full h-14 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-lg border border-emerald-500 transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
                  >
                    <Users className="mr-3 h-6 w-6" />
                    {isLoading === 'faculty' ? 'Loading...' : 'Faculty'}
                  </Button>
                </div>
              </div>

              {/* Footer text - Animated */}
              <p 
                className="text-gray-500 text-sm mt-8 animate-fade-in"
                style={{ animationDelay: '1.1s', opacity: 0, animationFillMode: 'forwards' }}
              >
                Choose your role to access the appropriate dashboard
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
