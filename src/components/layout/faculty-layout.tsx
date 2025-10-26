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
import { BookOpen, Plus, BarChart3, Menu, X, User, ChevronDown, LogOut, Bell } from 'lucide-react';
import Image from 'next/image';
import SuggestiveSearch from '@/components/ui/suggestive-search';
import { NotificationDrawer } from '@/components/ui/notification-drawer';
import { client } from '@/sanity/lib/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface FacultyLayoutProps {
  children: React.ReactNode;
  title: string;
}

interface Faculty {
  _id: string;
  name: string;
  email: string;
  profession?: string;
  about?: string;
  skilledAt?: string[];
  college?: string;
  department?: string;
  gender?: string;
  profileImage?: {
    asset: {
      _ref: string;
    };
  };
}

export default function FacultyLayout({ children, title }: FacultyLayoutProps) {
  const [loading, setLoading] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [faculty, setFaculty] = useState<Faculty | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push('/faculty/auth');
          return;
        }

        setUser(session.user);
        
        // Fetch faculty data from Sanity
        try {
          console.log('🔄 Fetching faculty data for:', session.user.email);
          const facultyData = await client.fetch(
            `*[_type == "faculty" && email == $email][0]{
              _id,
              name,
              email,
              profession,
              about,
              skilledAt,
              college,
              department,
              gender,
              profileImage
            }`,
            { email: session.user.email }
          );
          
          console.log('✅ Faculty data fetched:', facultyData);
          setFaculty(facultyData);
        } catch (error) {
          console.error('❌ Error fetching faculty data:', error);
          // Continue with null faculty data - don't block the UI
          setFaculty(null);
        }
      } catch (error) {
        console.error('❌ Error getting session:', error);
        router.push('/faculty/auth');
      } finally {
        // Always set loading to false
        setLoading(false);
      }
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === 'SIGNED_OUT') {
          router.push('/faculty/auth');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/faculty/auth');
  };

  const navigateTo = (path: string) => {
    router.push(path);
  };

  const isActivePage = (path: string) => {
    return pathname === path;
  };

  const getFacultyFirstName = () => {
    if (faculty?.name) {
      return faculty.name.split(' ')[0];
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'Faculty';
  };

  // Don't show loading screen if we have user but no faculty data
  if (loading && !user) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center font-inter">
        <div className="flex flex-col items-center gap-4">
          <span className="text-white text-lg">Loading...</span>
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
                onClick={() => navigateTo('/faculty/dashboard')}
                className="w-12 h-12 bg-white rounded-lg flex items-center justify-center overflow-hidden cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <Image
                  src="/MBU.jpeg"
                  alt="MBU Logo"
                  width={48}
                  height={48}
                  className="object-cover"
                />
              </div>
            </div>

            {/* Navigation Icons */}
            <div className="flex flex-col space-y-3">
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      onClick={() => navigateTo('/faculty/coursesavailable')}
                      className={`w-12 h-12 cursor-pointer flex items-center justify-center rounded-lg transition-colors ${
                        isActivePage('/faculty/coursesavailable') 
                          ? 'bg-white/10 text-white' 
                          : 'hover:bg-white/10 text-white'
                      }`}
                    >
                      <BookOpen size={20} strokeWidth={2} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="px-3 py-2 text-sm font-normal font-sans">
                    Courses Available
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      onClick={() => navigateTo('/faculty/creatingnewcourse')}
                      className={`w-12 h-12 cursor-pointer flex items-center justify-center rounded-lg transition-colors ${
                        isActivePage('/faculty/creatingnewcourse') 
                          ? 'bg-white/10 text-white' 
                          : 'hover:bg-white/10 text-white'
                      }`}
                    >
                      <Plus size={20} strokeWidth={2} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="px-3 py-2 text-sm font-normal font-sans">
                    Create New Course
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      onClick={() => navigateTo('/faculty/progressandgrades')}
                      className={`w-12 h-12 cursor-pointer flex items-center justify-center rounded-lg transition-colors ${
                        isActivePage('/faculty/progressandgrades') 
                          ? 'bg-white/10 text-white' 
                          : 'hover:bg-white/10 text-white'
                      }`}
                    >
                      <BarChart3 size={20} strokeWidth={2} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="px-3 py-2 text-sm font-normal font-sans">
                    Progress & Grades
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        {isMobileSidebarOpen && (
          <div className="md:hidden fixed inset-0 z-50">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black bg-opacity-50"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
            
            {/* Sidebar */}
            <div className="absolute left-0 top-0 h-full w-64 bg-black border-r border-white/10">
              {/* Header with Logo and Close */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div 
                    onClick={() => {
                      navigateTo('/faculty/dashboard');
                      setIsMobileSidebarOpen(false);
                    }}
                    className="w-10 h-10 bg-white rounded-lg flex items-center justify-center overflow-hidden cursor-pointer"
                  >
                    <Image
                      src="/MBU.jpeg"
                      alt="MBU Logo"
                      width={40}
                      height={40}
                      className="object-cover"
                    />
                  </div>
                  <span className="text-white font-bold text-lg">Faculty Portal</span>
                </div>
                <button 
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="text-white hover:bg-white/10 p-2 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Navigation Items */}
              <div className="p-4 space-y-2">
                <button 
                  onClick={() => {
                    navigateTo('/faculty/coursesavailable');
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 p-3 text-left rounded-lg ${
                    isActivePage('/faculty/coursesavailable') 
                      ? 'bg-white text-black' 
                      : 'hover:bg-white/10 text-white'
                  }`}
                >
                  <BookOpen size={20} strokeWidth={2} />
                  <span className="font-medium">Courses Available</span>
                </button>
                
                <button 
                  onClick={() => {
                    navigateTo('/faculty/creatingnewcourse');
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 p-3 text-left rounded-lg ${
                    isActivePage('/faculty/creatingnewcourse') 
                      ? 'bg-white text-black' 
                      : 'hover:bg-white/10 text-white'
                  }`}
                >
                  <Plus size={20} strokeWidth={2} />
                  <span className="font-medium">Create New Course</span>
                </button>
                
                <button 
                  onClick={() => {
                    navigateTo('/faculty/progressandgrades');
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 p-3 text-left rounded-lg ${
                    isActivePage('/faculty/progressandgrades') 
                      ? 'bg-white text-black' 
                      : 'hover:bg-white/10 text-white'
                  }`}
                >
                  <BarChart3 size={20} strokeWidth={2} />
                  <span className="font-medium">Progress & Grades</span>
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
                  className="md:hidden text-white hover:bg-white/10 p-2 rounded-lg"
                >
                  <Menu size={20} />
                </button>
                
                {/* Search Bar */}
                <div className="w-64 md:w-80">
                  <SuggestiveSearch
                    suggestions={[
                      "Search courses",
                      "Find students", 
                      "Look for assignments",
                      "Browse resources"
                    ]}
                    effect="typewriter"
                    className="bg-black border-white-400 text-white"
                  />
                </div>
              </div>
              
              {/* Right side - Notifications & Profile */}
              <div className="flex items-center lg:gap-3">
                {/* Notifications */}
                <NotificationDrawer>
                  <button className="relative flex items-center gap-1 text-white hover:bg-white/10 p-2 rounded-lg cursor-pointer">
                    <Bell size={20} />
                  </button>
                </NotificationDrawer>

                {/* Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1 text-white hover:bg-white/10 p-2 rounded-lg cursor-pointer">
                      <User size={20} />
                      <span className="hidden sm:block font-medium">{getFacultyFirstName()}</span>
                      <ChevronDown size={16} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-black ">
                    <DropdownMenuItem 
                      className="text-white hover:bg-white/10 cursor-pointer"
                      onClick={() => router.push('/faculty/profile')}
                    >
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem 
                          className="text-white hover:bg-white/10 cursor-pointer"
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
                          <AlertDialogCancel className="bg-white text-white hover:bg-gray-200 hover:text-white cursor-pointer ">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={handleSignOut}
                            className="bg-black hover:bg-black/60 text-white cursor-pointer"
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
          <main className="pt-16 flex-1 overflow-auto bg-black">
            <div className="p-4 md:p-6 h-full">
              <div className="max-w-7xl mx-auto">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 md:mb-6">{title}</h2>
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}