'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Edit2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useTimeBasedBackground } from '@/hooks/useTimeBasedBackground';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface ProfileCardProps {
  user: SupabaseUser;
}

interface UserProfile {
  gender?: 'male' | 'female';
  registration_number?: string;
  college?: string;
  batch?: string;
  degree?: string;
  department?: string;
  full_name?: string;
}

export default function ProfileCard({ user }: ProfileCardProps) {
  const { backgroundImage, timeOfDay } = useTimeBasedBackground();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile>({});
  const [showGenderDialog, setShowGenderDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [avatarKey, setAvatarKey] = useState(0); // Force re-render of avatar

  const fetchUserProfile = useCallback(async () => {
    try {
      // First fetch user profile from database
      const { data: profileData, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
        // Error fetching profile from database
      }
      
      // Fallback to metadata and localStorage
      const metadata = user.user_metadata;
      
      // Check for cached gender in localStorage
      const cachedGender = localStorage.getItem(`user-gender-${user.id}`) as 'male' | 'female' | null;
      
      // Check if gender is available from signup form in metadata
      const formGender = metadata?.gender as 'male' | 'female' | undefined;
      
      // Create profile with database data, falling back to metadata and cache
      const newProfile: UserProfile = {
        gender: profileData?.gender || cachedGender || formGender || undefined,
        full_name: profileData?.full_name || metadata?.full_name || metadata?.name,
        registration_number: profileData?.registration_number,
        college: profileData?.college,
        batch: profileData?.batch,
        degree: profileData?.degree,
        department: profileData?.department,
      };
      
      setUserProfile(newProfile);
      
      // If user came from Google OAuth and no gender is available, show dialog
      // Check if the user signed up with Google (has iss property in metadata)
      const isGoogleUser = metadata?.iss && metadata.iss.includes('accounts.google.com');
      
      if (isGoogleUser && !profileData?.gender && !cachedGender && !formGender) {
        setShowGenderDialog(true);
      }
    } catch (error) {
      // Error fetching profile
    } finally {
      setLoading(false);
    }
  }, [user.user_metadata, user.id]);

  useEffect(() => {
    fetchUserProfile();
    
    // Listen for avatar updates
    const handleAvatarUpdate = () => {
      setAvatarKey(prev => prev + 1); // Force re-render
    };
    window.addEventListener('avatarUpdated', handleAvatarUpdate);
    
    return () => {
      window.removeEventListener('avatarUpdated', handleAvatarUpdate);
    };
  }, [fetchUserProfile]);

  const updateGender = async (gender: 'male' | 'female') => {
    try {
      // Cache gender in localStorage for immediate avatar update
      localStorage.setItem(`user-gender-${user.id}`, gender);
      
      // Update local state immediately
      setUserProfile(prev => ({ ...prev, gender }));
      setShowGenderDialog(false);
      
      // Save to database
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          gender: gender,
        }, {
          onConflict: 'user_id'
        });
      
      if (error) {
        // Error saving gender to database
      }
    } catch (error) {
      // Error updating gender
    }
  };

  const getAvatarImage = () => {
    // Check if user has selected avatar in localStorage
    const savedAvatar = localStorage.getItem(`user-avatar-${user.id}`);
    if (savedAvatar) {
      return `/${savedAvatar}`;
    }
    
    // Fallback to default based on gender
    if (userProfile.gender === 'male') {
      return '/bitmoji_boy.png';
    } else if (userProfile.gender === 'female') {
      return '/bitmoji_girl.png';
    }
    // Return null if gender not selected - will show placeholder
    return null;
  };

  const getUserName = () => {
    return userProfile.full_name || 
           user.user_metadata?.full_name || 
           user.user_metadata?.name || 
           user.email?.split('@')[0] || 
           'User';
  };

  const getUserEmail = () => {
    return user.email || 'No email provided';
  };

  if (loading) {
    return (
      <div className="bg-black overflow-hidden">
        <div className="h-32 bg-accent animate-pulse"></div>
        <div className="p-6">
          <div className="flex items-start space-x-4">
            <div className="w-20 h-20 bg-accent rounded-full animate-pulse"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-accent rounded animate-pulse"></div>
              <div className="h-3 bg-accent rounded animate-pulse w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Backdrop overlay when gender dialog is open */}
      {showGenderDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-40" />
      )}
      
      {/* Profile Card */}
      <div className="bg-black border overflow-hidden shadow-lg relative z-10">
        {/* Cover Image */}
        <div 
          className="relative h-32 sm:h-40 md:h-48 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          <div className="absolute bg-black bg-opacity-20"></div>
        </div>

        {/* Profile Content */}
        <div className="relative px-4 sm:px-6 pb-6">
          {/* Profile Avatar */}
          <div className="flex flex-col items-start -mt-12 sm:-mt-20">
            {/* Avatar */}
            <div className="relative mb-4">
              <div key={avatarKey} className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full bg-black overflow-hidden flex items-center justify-center">
                {getAvatarImage() ? (
                  <Image
                    src={getAvatarImage()!}
                    alt="Profile Avatar"
                    width={160}
                    height={160}
                    className="w-full h-full object-cover"
                    priority
                    quality={90}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-700">
                    <svg
                      className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-gray-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </div>
            </div>
            
            {/* User Name and Email */}
            <div className="text-center mb-4">
              <div className="flex items-left justify-left gap-2 mb-1">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                  {getUserName()}
                </h2>
                {/* Edit icon beside name */}
                <button
                  onClick={() => router.push('/profile')}
                  className="p-1 rounded-full transition-colors duration-200 group cursor-pointer"
                  aria-label="Edit Profile"
                >
                  <Edit2 className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors duration-200" />
                </button>
              </div>
              <p className="text-gray-300 text-sm sm:text-base">
                {getUserEmail()}
              </p>
            </div>

            {/* All User Details in Straight Line */}
            <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 text-left">
              <div>
                <h3 className="text-gray-400 text-sm font-bold">Registration</h3>
                <p className="text-white text-md">{userProfile.registration_number || '--null--'}</p>
              </div>
              <div>
                <h3 className="text-gray-400 text-sm font-bold">Degree</h3>
                <p className="text-white text-md">{userProfile.degree || '--null--'}</p>
              </div>
              <div>
                <h3 className="text-gray-400 text-sm font-bold">Department</h3>
                <p className="text-white text-md">{userProfile.department || '--null--'}</p>
              </div>
              <div>
                <h3 className="text-gray-400 text-sm font-bold">College</h3>
                <p className="text-white text-md">{userProfile.college || '--null--'}</p>
              </div>
              <div>
                <h3 className="text-gray-400 text-sm font-bold">Batch</h3>
                <p className="text-white text-md">{userProfile.batch || '--null--'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gender Selection Dialog */}
      <AlertDialog open={showGenderDialog} onOpenChange={() => {}}>
        <AlertDialogContent className="bg-black border max-w-sm sm:max-w-md  backdrop-blur-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white text-center text-lg sm:text-xl">
              Select Your Gender
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300 text-center text-sm sm:text-base">
              To personalise your avatar for dashboard
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-center space-x-6 sm:space-x-8 py-4 sm:py-6">
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => {
updateGender('male');
                    }}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-1 border-black hover:border-white transition-all duration-200 overflow-hidden bg-black hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <Image
                      src="/bitmoji_boy.png"
                      alt="Male Avatar"
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Male</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => {
updateGender('female');
                    }}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-1 border-black hover:border-white transition-all duration-200 overflow-hidden bg-black hover:scale-105 focus:outline-none focus:ring-2 focus:ring-pink-500 cursor-pointer"
                  >
                    <Image
                      src="/bitmoji_girl.png"
                      alt="Female Avatar"
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Female</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}