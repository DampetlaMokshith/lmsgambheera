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
import { BookOpen, Plus, BarChart3, Menu, X, User, ChevronDown, LogOut } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import Image from 'next/image';
import FacultyNotifications from '@/components/ui/faculty-notifications';
import { Footer } from '@/components/footer';
import { client } from '@/sanity/lib/client';
import { urlFor } from '@/sanity/lib/image';
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
      url?: string;
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
setFaculty(facultyData);
        } catch (error) {
// Continue with null faculty data - don't block the UI
          setFaculty(null);
        }
      } catch (error) {
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

  const getFacultyAvatar = () => {
    // Check if faculty has profile image from Sanity
    if (faculty?.profileImage) {
      try {
        // Use Sanity's image URL builder
        const imageUrl = urlFor(faculty.profileImage).width(100).height(100).url();
        return imageUrl;
      } catch (error) {
}
    }
    
    // Fallback to default based on gender
    const gender = faculty?.gender;
    if (gender === 'male' || gender === 'Male') {
      return '/bitmoji_boy.png';
    } else if (gender === 'female' || gender === 'Female') {
      return '/bitmoji_girl.png';
    }
    return null;
  };

  const getFacultyInitials = () => {
    const name = faculty?.name || user?.email?.split('@')[0] || 'F';
    return name.substring(0, 2).toUpperCase();
  };

  // Don't block rendering - let individual pages handle their own loading states
  // This removes the page-level spinner in favor of content-specific loading indicators

  return (
    <div className="min-h-screen bg-black font-inter">
      <div className="flex w-full min-h-screen">
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
                      onClick={() => navigateTo('/faculty/coursesavailable')}
                      className={`w-12 h-12 cursor-pointer flex items-center justify-center transition-colors ${
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
                      className={`w-12 h-12 cursor-pointer flex items-center justify-center transition-colors ${
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
                      className={`w-12 h-12 cursor-pointer flex items-center justify-center transition-colors ${
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
                    
                    className="w-10 h-10 flex items-center justify-center overflow-hidden"
                  >
                    <Image
                      src="/threadlmslogofavi.png"
                      alt="THREADLMS Logo"
                      width={40}
                      height={40}
                      className="object-contain"
                    />
                  </div>
                  <span className="text-white font-bold text-lg">Faculty Portal</span>
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
                    navigateTo('/faculty/coursesavailable');
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 p-3 text-left ${
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
                  className={`w-full flex items-center gap-3 p-3 text-left ${
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
                  className={`w-full flex items-center gap-3 p-3 text-left ${
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
                  className="md:hidden text-white hover:bg-white/10 p-2 cursor-pointer"
                >
                  <Menu size={20} />
                </button>
                
           
              </div>
              
              {/* Right side - Notifications & Profile */}
              <div className="flex items-center gap-2">

                {/* Faculty Notifications */}
                {user && (
                  <FacultyNotifications 
                    userId={user.id}
                    userEmail={user.email || ''}
                  />
                )}

                {/* Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 text-white hover:bg-white/10 p-2 cursor-pointer">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={getFacultyAvatar() || undefined} alt={getFacultyFirstName()} />
                        <AvatarFallback className="bg-gray-800 text-white text-sm">
                          {getFacultyInitials()}
                        </AvatarFallback>
                      </Avatar>
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
                          className="text-red-500 hover:text-red-400 hover:bg-red-900/20 cursor-pointer focus:bg-red-900/20 focus:text-red-400"
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
          <main className="pt-16 flex-1 flex flex-col bg-black min-h-[calc(100vh-64px)]">
            <div className="p-4 md:p-6 flex-1">
              <div className="max-w-7xl mx-auto">
                {title && <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 md:mb-6">{title}</h2>}
                {children}
              </div>
            </div>
            <Footer />
          </main>
        </div>
      </div>
    </div>
  );
}