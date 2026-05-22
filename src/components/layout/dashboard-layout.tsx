'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { LayoutDashboard, BookOpen, Code, Award, Menu, X, User, ChevronDown, LogOut } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import Image from 'next/image';
import SuggestiveSearch from '@/components/ui/suggestive-search';
import StudentNotifications from '@/components/ui/student-notifications';
import { Footer } from '@/components/footer';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  fullscreen?: boolean;
}

export default function DashboardLayout({ children, title, fullscreen = false }: DashboardLayoutProps) {
  const [loading, setLoading] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [avatarKey, setAvatarKey] = useState(0); // Force re-render of avatar
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/auth');
        return;
      }
      
      setUser(session.user);
      setLoading(false);
    };

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!session) {
          router.push('/auth');
        } else {
          setUser(session.user);
          setLoading(false);
        }
      }
    );

    // Listen for avatar updates
    const handleAvatarUpdate = () => {
      setAvatarKey(prev => prev + 1); // Force re-render
    };
    window.addEventListener('avatarUpdated', handleAvatarUpdate);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('avatarUpdated', handleAvatarUpdate);
    };
  }, [router]);

  const handleSignOut = async () => {
    try {
      // Get current user ID before signing out
      const { data: { user } } = await supabase.auth.getUser();
      
      // Clear user role from localStorage
      localStorage.removeItem('userRole');
      localStorage.removeItem('attemptedRole');
      
      // Clear session storage (session-specific data)
      sessionStorage.clear();
      
      await supabase.auth.signOut();
      
      // Force redirect to home page
      window.location.href = '/';
    } catch (error) {
// Still redirect even if there's an error
      window.location.href = '/';
    }
  };

  const getUserFirstName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name.split(' ')[0];
    }
    return user?.email?.split('@')[0] || 'User';
  };

  const getUserAvatar = () => {
    // Check if user has selected avatar in localStorage
    if (user?.id) {
      const savedAvatar = localStorage.getItem(`user-avatar-${user.id}`);
      if (savedAvatar) {
        return `/${savedAvatar}`;
      }
    }
    
    // Fallback to default based on gender
    const gender = user?.user_metadata?.gender;
    if (gender === 'female') {
      return '/bitmoji_girl.png';
    }
    // Default to male avatar (bitmoji_boy.png) if no gender or male
    return '/bitmoji_boy.png';
  };

  const getUserInitials = () => {
    const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'U';
    return name.substring(0, 2).toUpperCase();
  };

  const navigateTo = (path: string) => {
    router.push(path);
  };

  const isActivePage = (path: string) => {
    return pathname === path;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center font-inter">
        <div className="flex flex-col items-center gap-4">
          
          <span className="text-white text-lg"></span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 font-inter">
      <div className="flex w-full h-screen">
        {/* Desktop Sidebar - Hidden on Mobile */}
        <div className="hidden md:block fixed left-0 top-0 h-full w-16 bg-black border-r border-white/10 z-40">
          <div className="flex flex-col h-full p-2">
            {/* MBU Logo at top */}
            <div className="mt-4 mb-8 flex justify-center">
              <div 
                
                className="w-12 h-12 flex items-center justify-center overflow-hidden hover:opacity-80 transition-opacity"
              >
                <Image
                  src="/threadlmslogofavi.png"
                  alt="THREADLMS Logo"
                  width={48}
                  height={48}
                  className="object-contain"
                />
              </div>
            </div>

            {/* Navigation Icons */}
            <div className="flex flex-col space-y-3">
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      onClick={() => navigateTo('/dashboard')}
                      className={`w-12 h-12 cursor-pointer flex items-center justify-center transition-colors ${
                        isActivePage('/dashboard') 
                          ? 'bg-white/10 text-white' 
                          : 'hover:bg-white/10 text-white'
                      }`}
                    >
                      <LayoutDashboard size={20} strokeWidth={2} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="px-3 py-2 text-sm font-normal font-sans">
                    Dashboard
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      onClick={() => navigateTo('/courses')}
                      className={`w-12 h-12 cursor-pointer flex items-center justify-center transition-colors ${
                        isActivePage('/courses') 
                          ? 'bg-white/10 text-white' 
                          : 'hover:bg-white/10 text-white'
                      }`}
                    >
                      <BookOpen size={20} strokeWidth={2} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="px-3 py-2 text-sm font-normal font-sans">
                    Courses
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      onClick={() => navigateTo('/ide')}
                      className={`w-12 h-12 cursor-pointer flex items-center justify-center transition-colors ${
                        isActivePage('/ide') 
                          ? 'bg-white/10 text-white' 
                          : 'hover:bg-white/10 text-white'
                      }`}
                    >
                      <Code size={20} strokeWidth={2} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="px-3 py-2 text-sm font-normal font-sans">
                    IDE
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      onClick={() => navigateTo('/certificates')}
                      className={`w-12 h-12 cursor-pointer flex items-center justify-center transition-colors ${
                        isActivePage('/certificates') 
                          ? 'bg-white/10 text-white' 
                          : 'hover:bg-white/10 text-white'
                      }`}
                    >
                      <Award size={20} strokeWidth={2} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="px-3 py-2 text-sm font-normal font-sans">
                    Certificates & Badges
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        {isMobileSidebarOpen && (
          <div className="md:hidden fixed inset-0 z-50">
            {/* Backdrop with blur */}
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
            
            {/* Sidebar with animation */}
            <div className="absolute left-0 top-0 h-full w-64 bg-black border-r border-white/10 transform transition-transform duration-300 ease-in-out animate-in slide-in-from-left">
              {/* Header with Logo and Close */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div 
                    onClick={() => {
                      navigateTo('/dashboard');
                      setIsMobileSidebarOpen(false);
                    }}
                    className="w-10 h-10 flex items-center justify-center overflow-hidden cursor-pointer"
                  >
                    <Image
                      src="/threadlmslogofavi.png"
                      alt="THREADLMS Logo"
                      width={40}
                      height={40}
                      className="object-contain"
                    />
                  </div>
                  <span className="text-white font-bold text-lg">THREADLMS</span>
                </div>
                <button 
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="text-white hover:bg-white/10 p-2 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Navigation Items */}
              <div className="p-4 space-y-2">
                <button 
                  onClick={() => {
                    navigateTo('/dashboard');
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 p-3 text-left ${
                    isActivePage('/dashboard') 
                      ? 'bg-black text-white' 
                      : 'hover:bg-white/10 text-white'
                  }`}
                >
                  <LayoutDashboard size={20} strokeWidth={2} />
                  <span className="font-medium">Dashboard</span>
                </button>
                
                <button 
                  onClick={() => {
                    navigateTo('/courses');
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 p-3 text-left ${
                    isActivePage('/courses') 
                      ? 'bg-white text-black' 
                      : 'hover:bg-white/10 text-white'
                  }`}
                >
                  <BookOpen size={20} strokeWidth={2} />
                  <span className="font-medium">Courses</span>
                </button>
                
                <button 
                  onClick={() => {
                    navigateTo('/ide');
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 p-3 text-left ${
                    isActivePage('/ide') 
                      ? 'bg-white text-black' 
                      : 'hover:bg-white/10 text-white'
                  }`}
                >
                  <Code size={20} strokeWidth={2} />
                  <span className="font-medium">IDE</span>
                </button>
                
                <button 
                  onClick={() => {
                    navigateTo('/certificates');
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 p-3 text-left ${
                    isActivePage('/certificates') 
                      ? 'bg-white text-black' 
                      : 'hover:bg-white/10 text-white'
                  }`}
                >
                  <Award size={20} strokeWidth={2} />
                  <span className="font-medium">Certificates & Badges</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="md:ml-16 flex-1 flex flex-col">
          {/* Top Navigation Bar */}
          <header className="fixed top-0 left-0 md:left-16 right-0 h-16 bg-black border-b border-white/10 z-30">
            <div className="flex h-full items-center justify-between px-4 md:px-6">
              <div className="flex items-center gap-4">
                {/* Mobile Menu Button */}
                <button 
                  onClick={() => setIsMobileSidebarOpen(true)}
                  className="md:hidden text-white hover:bg-white/10 p-2 cursor-pointer"
                >
                  <Menu size={20} />
                </button>
                
                {/* Search Bar */}
                <div className="w-64 md:w-80">
                  <SuggestiveSearch
                    className="bg-black border-white-400 text-white"
                  />
                </div>
              </div>
              
              {/* Right side - Notifications & Profile */}
              <div className="flex items-center gap-2">
                
                {/* Student Notifications */}
                {user && (
                  <StudentNotifications 
                    userId={user.id}
                    userEmail={user.email || ''}
                  />
                )}

                {/* Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 text-white hover:bg-white/10 p-2 cursor-pointer">
                      <Avatar key={avatarKey} className="w-8 h-8">
                        <AvatarImage src={getUserAvatar() || undefined} alt={getUserFirstName()} />
                        <AvatarFallback className="bg-gray-800 text-white text-sm">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden sm:block font-medium">{getUserFirstName()}</span>
                      <ChevronDown size={16} className="md:ml-0 -ml-1" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-black ">
                    <DropdownMenuItem 
                      className="text-white hover:bg-white/10 cursor-pointer"
                      onClick={() => router.push('/profile')}
                    >
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem 
                          className="text-red-400 hover:bg-white/10 hover:text-red-400 cursor-pointer"
                          onSelect={(e) => e.preventDefault()}
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Logout
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-[#1a1a1a]">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-white">Are you sure you want to logout?</AlertDialogTitle>
                          <AlertDialogDescription className="text-white/70">
                            You will be signed out of your account and redirected to the login page.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-white text-black hover:bg-gray-200 hover:text-black cursor-pointer ">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={handleSignOut}
                            className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                          >
                            Logout
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="pt-16 flex-1 overflow-y-auto bg-black flex flex-col">
            <div className={fullscreen ? "h-full flex-1" : "p-4 md:p-6 flex-1"}>
              <div className={fullscreen ? "h-full" : "max-w-7xl mx-auto"}>
                {title && !fullscreen && <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 md:mb-6">{title}</h2>}
                {children}
              </div>
            </div>
            <div className="hidden md:block mt-auto">
              <Footer />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}