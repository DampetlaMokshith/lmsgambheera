'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  GraduationCapIcon, 
  ArrowRightIcon
} from 'lucide-react';
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
        console.log('Session check failed:', error);
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
      <div className="mb-6">
        <div
          className={cn(
            "group inline-flex rounded-full border border-black/5 bg-neutral-100 text-base text-white transition-all ease-in hover:cursor-pointer hover:bg-neutral-200 dark:border-white/5 dark:bg-neutral-900 dark:hover:bg-neutral-800"
          )}
        >
          <AnimatedShinyText className="inline-flex items-center justify-center px-4 py-1 transition ease-out hover:text-neutral-600 hover:duration-300 hover:dark:text-neutral-400">
            <span>✨ Introducing Newsletters for students</span>
            <ArrowRightIcon className="ml-1 size-3 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" />
          </AnimatedShinyText>
        </div>
      </div>

      {/* Main Heading with Text Flip - 3 Lines */}
      <div className="mb-6 max-w-2xl text-left">
        <div className="text-6xl leading-tight font-bold tracking-tight text-white md:text-6xl md:leading-tight">
          <div className="block">Make your</div>
          <div className="block">learning look</div>
          <div className="flex items-center gap-2">
            <span>10x</span>
            <ContainerTextFlip className='text-6xl' words={["better", "beautiful", "modern", "awesome"]} />
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-md text-gray-400 max-w-md leading-relaxed">
        Copy paste the most trending components and use them in your websites without having to worry about styling and animations.
      </p>
    </>
  );

  return (
    <main className="relative bg-black text-white font-inter">
      {/* Mobile Layout - Shows on small screens */}
      <div className="lg:hidden">
        {/* Mobile Logo */}
        <div className="p-4 pb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white">
              <GraduationCapIcon className="size-6 text-black" />
            </div>
            <p className="text-2xl font-bold text-white">
              LMS Gambheera
            </p>
          </div>
        </div>

        {/* Mobile Main Content */}
        <div className="relative px-4 pb-1">
          {/* Animated Background for Mobile */}
          <div className="absolute inset-0">
            <FloatingPaths position={1} />
            <FloatingPaths position={-1} />
          </div>
          
          <div className="relative z-10 space-y-3">
            <HeroContent />
          </div>
        </div>

        {/* Mobile Auth Form */}
        <div className="relative">
          <div className="relative z-10">
            {isLogin ? (
              <LoginForm onToggleMode={toggleMode} />
            ) : (
              <SignupForm onToggleMode={toggleMode} />
            )}
          </div>
        </div>
      </div>

      {/* Desktop Layout - Shows on large screens */}
      <div className="hidden lg:grid lg:grid-cols-2 lg:h-screen overflow-hidden">
        {/* Left Side - Hero Section */}
        <div className="relative flex flex-col p-10 bg-black">
          
          {/* Logo */}
          <div className="z-10 flex items-center gap-3 mb-8">
            <div className="p-2 rounded-lg bg-white">
              <GraduationCapIcon className="size-6 text-black" />
            </div>
            <p className="text-2xl font-bold text-white">
              LMS Gambheera
            </p>
          </div>
          
          {/* Main Content - Moved further up and to the right */}
          <div className="z-10 flex flex-col justify-start flex-1 max-w-2xl ml-12 mt-8">
            <HeroContent />
          </div>
          
          {/* Animated Background */}
          <div className="absolute inset-0">
            <FloatingPaths position={1} />
            <FloatingPaths position={-1} />
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="h-screen w-full bg-black relative overflow-hidden">
          
          
          {/* Content Container */}
          <div className="relative z-10 flex h-screen flex-col justify-center -mt-1">
            <div className="mx-auto w-full max-w-sm">
              {isLogin ? (
                <LoginForm onToggleMode={toggleMode} />
              ) : (
                <SignupForm onToggleMode={toggleMode} />
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// Floating Background Animation Component
function FloatingPaths({ position }: { position: number }) {
  const paths = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    d: `M-${200 - i * 3 * position} -${100 + i * 4}C-${200 - i * 3 * position} -${100 + i * 4} -${150 - i * 3 * position} ${150 - i * 4} ${100 - i * 3 * position} ${200 - i * 4}C${300 - i * 3 * position} ${250 - i * 4} ${350 - i * 3 * position} ${400 - i * 4} ${350 - i * 3 * position} ${400 - i * 4}`,
    opacity: 0.1 + i * 0.02,
    width: 0.5 + i * 0.02,
  }));

  return (
    <div className="pointer-events-none absolute inset-0">
      <svg
        className="h-full w-full text-white"
        viewBox="0 0 400 300"
        fill="none"
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