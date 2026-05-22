'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { ArrowRightIcon } from 'lucide-react';
import { ContainerTextFlip } from '@/components/ui/container-text-flip';
import { AnimatedShinyText } from '@/components/ui/animated-shiny-text';
import { cn } from '@/lib/utils';
import LoginForm from '@/components/forms/login-form';
import SignupForm from '@/components/forms/signup-form';
import { supabase } from '@/lib/supabase';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is already authenticated
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.push('/dashboard');
        }
      } catch (error) {
        // If there's an error, just stay on auth page
}
    };

    checkSession();
  }, [router]);

  const toggleMode = () => {
    setIsLogin(!isLogin);
  };

  const HeroContent = () => (
    <>
      {/* Animated Shiny Text Badge */}
      <div className="mb-4 xl:mb-6">
        <div
          className={cn(
            "group inline-flex rounded-full border border-black/5 bg-neutral-100 text-sm xl:text-base text-white transition-all ease-in hover:cursor-pointer hover:bg-neutral-200 dark:border-white/5 dark:bg-neutral-900 dark:hover:bg-neutral-800"
          )}
        >
          <AnimatedShinyText className="inline-flex items-center justify-center px-3 xl:px-4 py-1 transition ease-out hover:text-neutral-600 hover:duration-300 hover:dark:text-neutral-400">
            <span>✨ Smart Learning Management System</span>
            <ArrowRightIcon className="ml-1 size-3 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" />
          </AnimatedShinyText>
        </div>
      </div>

      {/* Main Heading with Text Flip - Responsive text sizes */}
      <div className="mb-4 xl:mb-6 max-w-2xl text-left">
        <div className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl leading-tight font-bold tracking-tight text-white">
          <div className="block">Transform your</div>
          <div className="block">education with</div>
          <div className="flex items-center gap-2 flex-wrap">
            <span>a</span>
            <ContainerTextFlip className='text-3xl sm:text-4xl lg:text-5xl xl:text-6xl' words={["smarter", "modern", "powerful", "seamless"]} />
            <span>LMS</span>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm xl:text-md text-gray-400 max-w-md leading-relaxed">
        Experience the future of online learning, track your progress, engage with interactive courses, earn certificates, and unlock your full potential with advanced analytics.
      </p>
    </>
  );

  return (
    <main className="relative bg-black text-white font-inter h-screen overflow-hidden">
      {/* Mobile Layout - Shows on small screens */}
      <div className="lg:hidden h-full flex flex-col overflow-hidden">
        {/* Mobile Logo */}
        <div className="p-4 pb-2 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 relative">
              <Image
                src="/threadlmslogofavi.png"
                alt="THREADLMS Logo"
                fill
                className="object-contain"
              />
            </div>
            <p className="text-2xl font-bold text-white">
              THREADLMS
            </p>
          </div>
        </div>

        {/* Mobile Main Content */}
        <div className="relative px-4 pb-4 flex-shrink-0">
          <div className="relative z-10 space-y-3">
            <HeroContent />
          </div>
        </div>

        {/* Mobile Auth Form */}
        <div className="relative flex-1 flex flex-col justify-center overflow-hidden">
          <div className="relative z-10">
            {isLogin ? (
              <LoginForm onToggleMode={toggleMode} />
            ) : (
              <SignupForm onToggleMode={toggleMode} />
            )}
          </div>
        </div>

        {/* Animated Background for Mobile - Positioned at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-1/2 overflow-hidden pointer-events-none">
          <FloatingPaths position={1} />
          <FloatingPaths position={-1} />
        </div>
      </div>

      {/* Desktop Layout - Shows on large screens */}
      <div className="hidden lg:grid lg:grid-cols-2 h-screen overflow-hidden">
        {/* Left Side - Hero Section */}
        <div className="relative flex flex-col bg-black h-full overflow-hidden">
          
          {/* Logo - Matching faculty auth positioning */}
          <div className="z-10 flex items-center gap-3 pl-4 pt-4 flex-shrink-0">
            <div className="w-10 h-10 relative">
              <Image
                src="/threadlmslogofavi.png"
                alt="THREADLMS Logo"
                fill
                className="object-contain"
              />
            </div>
            <p className="text-lg font-semibold text-white">
              THREADLMS
            </p>
          </div>
          
          {/* Main Content - Positioned slightly above center */}
          <div className="z-10 flex flex-col justify-center flex-1 max-w-2xl pl-8 pb-32">
            <HeroContent />
          </div>
          
          {/* Animated Background - Positioned at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-2/3 overflow-hidden pointer-events-none">
            <FloatingPaths position={1} />
            <FloatingPaths position={-1} />
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="h-full w-full bg-black relative flex items-center justify-center p-4 overflow-hidden">
          {/* Content Container */}
          <div className="relative z-10 w-full max-w-sm xl:max-w-md">
            {isLogin ? (
              <LoginForm onToggleMode={toggleMode} />
            ) : (
              <SignupForm onToggleMode={toggleMode} />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

// Floating Background Animation Component - positioned for bottom display
function FloatingPaths({ position }: { position: number }) {
  const paths = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    d: `M-${200 - i * 3 * position} ${200 + i * 4}C-${200 - i * 3 * position} ${200 + i * 4} -${150 - i * 3 * position} ${350 - i * 4} ${100 - i * 3 * position} ${400 - i * 4}C${300 - i * 3 * position} ${450 - i * 4} ${350 - i * 3 * position} ${600 - i * 4} ${350 - i * 3 * position} ${600 - i * 4}`,
    opacity: 0.1 + i * 0.02,
    width: 0.5 + i * 0.03,
  }));

  return (
    <div className="pointer-events-none absolute inset-0 flex items-end justify-center overflow-hidden">
      <svg
        className="w-full h-full text-white"
        viewBox="0 0 400 500"
        fill="none"
        preserveAspectRatio="xMidYMax slice"
      >
        <title>Background Paths</title>
        {paths.map((path) => (
          <motion.path
            key={path.id}
            d={path.d}
            stroke="currentColor"
            strokeWidth={path.width}
            strokeOpacity={path.opacity}
            initial={{ pathLength: 0.2, opacity: 0.3 }}
            animate={{
              pathLength: 1,
              opacity: [0.2, 0.5, 0.2],
              pathOffset: [0, 1, 0],
            }}
            transition={{
              duration: 15 + Math.random() * 10,
              repeat: Number.POSITIVE_INFINITY,
              ease: 'linear',
            }}
          />
        ))}
      </svg>
    </div>
  );
}