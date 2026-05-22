'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/dashboard-layout';
import Image from 'next/image';
import { useTimeBasedBackground } from '@/hooks/useTimeBasedBackground';
import { Save, User, Calendar as CalendarIcon, Info } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast, Toaster } from 'sonner';
import { format } from 'date-fns';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { cn } from '@/lib/utils';

interface UserProfile {
  gender?: 'male' | 'female';
  registration_number?: string;
  college?: string;
  batch?: string;
  degree?: string;
  department?: string;
  full_name?: string;
  guardian_email?: string;
  date_of_birth?: string;
  selected_avatar?: string;
}

// Avatar options
const GIRL_AVATARS = ['bit5.svg', 'bit2.svg', 'bit3.svg', 'bit4.svg', 'bit1.svg', 'bitmoji_girl.png'];
const BOY_AVATARS = ['bit6.svg', 'bit7.svg', 'bit8.svg', 'bit9.svg', 'bit10.svg', 'bitmoji_boy.png'];

export default function ProfilePage() {
  const { backgroundImage } = useTimeBasedBackground();
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [savingDate, setSavingDate] = useState(false);
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);

  const fetchUserData = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/auth');
        return;
      }
      
      setUser(session.user);
      
      // Load profile data from database first
      const { data: profileData, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
        // Error fetching profile
      }
      
      // Fallback to metadata if no database profile exists
      const metadata = session.user.user_metadata;
      const cachedGender = localStorage.getItem(`user-gender-${session.user.id}`) as 'male' | 'female' | null;
      
      // Load selected avatar from localStorage
      const savedAvatar = localStorage.getItem(`user-avatar-${session.user.id}`);
      
      setUserProfile({
        gender: profileData?.gender || cachedGender || metadata?.gender || undefined,
        full_name: profileData?.full_name || metadata?.full_name || metadata?.name || '',
        guardian_email: profileData?.guardian_email || '',
        date_of_birth: profileData?.date_of_birth || '',
        registration_number: profileData?.registration_number || '',
        college: profileData?.college || '',
        batch: profileData?.batch || '',
        degree: profileData?.degree || '',
        department: profileData?.department || '',
        selected_avatar: savedAvatar || undefined,
      });
      
      // Set selectedDate if date_of_birth exists
      if (profileData?.date_of_birth) {
        setSelectedDate(new Date(profileData.date_of_birth));
      }
    } catch (error) {
      router.push('/auth');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const getAvatarImage = () => {
    // If user has selected a custom avatar, use it
    if (userProfile.selected_avatar) {
      return `/${userProfile.selected_avatar}`;
    }
    
    // Otherwise use default based on gender
    if (userProfile.gender === 'male') {
      return '/bitmoji_boy.png';
    } else if (userProfile.gender === 'female') {
      return '/bitmoji_girl.png';
    }
    return null;
  };

  const handleAvatarSelect = async (avatar: string) => {
    try {
      if (user) {
        // Update local state immediately
        setUserProfile(prev => ({ ...prev, selected_avatar: avatar }));
        
        // Save to localStorage only
        localStorage.setItem(`user-avatar-${user.id}`, avatar);
        
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('avatarUpdated', { detail: { userId: user.id, avatar } }));
        
        toast.success('Avatar updated successfully!');
      }
    } catch (error) {
      toast.error('Failed to update avatar');
    } finally {
      setIsAvatarDialogOpen(false);
    }
  };

  const handleDateSubmit = async () => {
    if (selectedDate) {
      setSavingDate(true);
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      
      try {
        // Save to database immediately
        if (user) {
          const { error } = await supabase
            .from('user_profiles')
            .upsert({
              user_id: user.id,
              date_of_birth: formattedDate,
            }, {
              onConflict: 'user_id'
            });
          
          if (error) {
            toast.error('Failed to save date of birth');
          } else {
            toast.success('Date of birth saved successfully!');
            // Update local state
            setUserProfile(prev => ({ ...prev, date_of_birth: formattedDate }));
          }
        }
      } catch (error) {
        toast.error('Failed to save date of birth');
      } finally {
        setSavingDate(false);
      }
    }
  };

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setUserProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleGenderChange = (gender: 'male' | 'female') => {
    setUserProfile(prev => ({ ...prev, gender }));
    localStorage.setItem(`user-gender-${user?.id}`, gender);
  };

  const handleDegreeChange = (degree: string) => {
    setUserProfile(prev => ({ ...prev, degree }));
  };

  const handleDepartmentChange = (department: string) => {
    setUserProfile(prev => ({ ...prev, department }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (user) {
        // Save gender to localStorage for immediate avatar update
        if (userProfile.gender) {
          localStorage.setItem(`user-gender-${user.id}`, userProfile.gender);
        }
        
        // Prepare data for database (excluding selected_avatar - stored locally)
        const profileData = {
          user_id: user.id,
          full_name: userProfile.full_name,
          gender: userProfile.gender,
          guardian_email: userProfile.guardian_email,
          date_of_birth: userProfile.date_of_birth || null,
          registration_number: userProfile.registration_number,
          college: userProfile.college,
          batch: userProfile.batch,
          degree: userProfile.degree,
          department: userProfile.department,
        };
        
        // Try to upsert the profile data
        const { error } = await supabase
          .from('user_profiles')
          .upsert(profileData, {
            onConflict: 'user_id'
          });
        
        if (error) {
          throw error;
        }
        
        // Check if profile is now complete and delete incomplete notification
        const requiredFields = [
          'full_name',
          'gender',
          'guardian_email',
          'date_of_birth',
          'registration_number',
          'college',
          'batch',
          'degree',
          'department'
        ];

        const isComplete = requiredFields.every(field => {
          const value = profileData[field as keyof typeof profileData];
          return value && value !== '' && value !== null;
        });

        if (isComplete) {
          // Profile is complete - notification system will automatically update
        }
        
        // Show success toast
        toast.success('Profile updated successfully!', {
          description: 'Your profile changes have been saved.',
          duration: 2000,
        });
      }
    } catch (error) {
      toast.error('Failed to save profile', {
        description: 'Please try again later.',
        duration: 4000,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Profile">
        <div className="space-y-6">
          {/* Profile Header Skeleton */}
          <div className="bg-black border overflow-hidden shadow-lg">
            {/* Cover Image Skeleton */}
            <div className="h-32 sm:h-40 md:h-48 bg-accent animate-pulse"></div>
            
            {/* Profile Content Skeleton */}
            <div className="relative px-4 sm:px-6 pb-6">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 sm:-mt-16">
                {/* Avatar Skeleton */}
                <div className="relative mx-auto sm:mx-0">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-accent border animate-pulse"></div>
                </div>
                
                {/* Basic Info Skeleton */}
                <div className="text-center sm:text-left flex-1 space-y-2 sm:pb-0">
                  <div className="h-6 bg-accent rounded animate-pulse w-48 mx-auto sm:mx-0"></div>
                  <div className="h-4 bg-accent rounded animate-pulse w-36 mx-auto sm:mx-0"></div>
                </div>
                
                {/* Save Button Skeleton */}
                <div className="sm:pb-0">
                  <div className="h-10 bg-accent animate-pulse w-32"></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Forms Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Details Skeleton */}
            <div className="bg-black border p-6">
              <div className="h-6 bg-accent rounded animate-pulse w-32 mb-6"></div>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 bg-accent rounded animate-pulse w-24"></div>
                    <div className="h-10 bg-accent border border-gray-700 animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Academic Details Skeleton */}
            <div className="bg-black border p-6">
              <div className="h-6 bg-accent rounded animate-pulse w-32 mb-6"></div>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 bg-accent rounded animate-pulse w-24"></div>
                    <div className="h-10 bg-accent border border-gray-700 animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="">
      {/* Fixed Header with Profile Title and Save Button */}
      <div className="sticky top-0 z-10 bg-black  px-6 py-4 mb-6 -mx-6 -mt-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Profile</h1>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-white text-black hover:bg-gray-200 transition-colors duration-200 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Profile Header with Cover and Avatar */}
        <div className="bg-black border overflow-hidden shadow-lg">
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
            
            {/* Info Icon with Tooltip */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/60 rounded-full transition-colors backdrop-blur-sm">
                    <Info className="w-5 h-5 text-white" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs" showArrow={true}>
                  <p className="text-sm">
                    This image is a fixed image by us and changes according to IST time.
                    <br /><br />
                    <strong>Timings:</strong><br />
                    • 5:00 AM - 12:00 PM: Morning theme<br />
                    • 12:00 PM - 5:00 PM: Afternoon theme<br />
                    • 5:00 PM - 5:00 AM: Evening/Night theme
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Profile Avatar and Basic Info */}
          <div className="relative px-4 sm:px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 sm:-mt-16">
              {/* Avatar */}
              <div className="relative mx-auto sm:mx-0">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-black  overflow-hidden flex items-center justify-center">
                  {getAvatarImage() ? (
                    <Image
                      src={getAvatarImage()!}
                      alt="Profile Avatar"
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-700">
                      <User className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
                    </div>
                  )}
                </div>
              </div>

              {/* Basic Info Display */}
              <div className="text-center sm:text-left flex-1 sm:pb-0">
                <h1 className="text-xl sm:text-2xl font-bold text-white">
                  {userProfile.full_name || user?.email?.split('@')[0] || 'User'}
                </h1>
                <p className="text-gray-300 text-sm">{user?.email}</p>
              </div>
              
              {/* Avatar Selection Button - Top Right Corner */}
              <Dialog open={isAvatarDialogOpen} onOpenChange={setIsAvatarDialogOpen}>
                <DialogTrigger asChild>
                  <button className="flex -space-x-3 hover:opacity-80 transition-opacity p-2 hover:bg-white/5">
                    {(userProfile.gender === 'female' ? GIRL_AVATARS : BOY_AVATARS).slice(0, 4).map((avatar, i) => (
                      <Avatar key={i} className="w-12 h-12 border-2 border-black">
                        <AvatarImage src={`/${avatar}`} alt={`Avatar ${i + 1}`} />
                        <AvatarFallback>A{i + 1}</AvatarFallback>
                      </Avatar>
                    ))}
                  </button>
                </DialogTrigger>
                <DialogContent className="bg-black border sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-white">Choose Your Avatar</DialogTitle>
                    <DialogDescription className="text-gray-400">
                      Select an avatar that represents you best
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid grid-cols-4 gap-6 py-6">
                    {userProfile.gender === 'female' ? (
                      // Girl avatars
                      GIRL_AVATARS.map((avatar) => (
                        <button
                          key={avatar}
                          className="aspect-square rounded-full border-2 border-gray-700 hover:border-white transition-colors p-3 bg-accent overflow-hidden cursor-pointer"
                          onClick={() => handleAvatarSelect(avatar)}
                        >
                          <Image
                            src={`/${avatar}`}
                            alt={avatar}
                            width={100}
                            height={100}
                            className="w-full h-full object-contain"
                          />
                        </button>
                      ))
                    ) : (
                      // Boy avatars
                      BOY_AVATARS.map((avatar) => (
                        <button
                          key={avatar}
                          className="aspect-square rounded-full border-2 border-gray-700 hover:border-white transition-colors p-3 bg-accent overflow-hidden cursor-pointer"
                          onClick={() => handleAvatarSelect(avatar)}
                        >
                          <Image
                            src={`/${avatar}`}
                            alt={avatar}
                            width={100}
                            height={100}
                            className="w-full h-full object-contain"
                          />
                        </button>
                      ))
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Editable Forms */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Details Card */}
          <div className="bg-black border p-6">
            <h2 className="text-xl font-bold text-white mb-6">Personal Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={userProfile.full_name || ''}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  className="w-full px-3 py-2 bg-accent border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-white hover:bg-accent/80 hover:border-gray-600 transition-colors"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-3 py-2 bg-accent border border-gray-600 text-gray-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Gender
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleGenderChange('male')}
                    className={`flex-1 px-4 py-2 cursor-pointer border transition-colors ${
                      userProfile.gender === 'male'
                        ? 'border-white bg-accent text-white'
                        : 'border-gray-700 bg-accent text-white hover:bg-accent/80 hover:border-gray-600'
                    }`}
                  >
                    Male
                  </button>
                  <button
                    onClick={() => handleGenderChange('female')}
                    className={`flex-1 px-4 py-2 border transition-colors cursor-pointer ${
                      userProfile.gender === 'female'
                        ? 'border-white bg-accent text-white'
                        : 'border-gray-700 bg-accent text-white hover:bg-accent/80 hover:border-gray-600'
                    }`}
                  >
                    Female
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Guardian Email ID
                </label>
                <input
                  type="email"
                  value={userProfile.guardian_email || ''}
                  onChange={(e) => handleInputChange('guardian_email', e.target.value)}
                  className="w-full px-3 py-2 bg-popover border border-gray-800 text-white  hover:bg-accent/10 hover:border-gray-100 transition-colors"
                  placeholder="Enter guardian's email"
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Date of Birth
                </label>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "flex-1 justify-start text-left font-normal bg-accent border-gray-700 text-white hover:bg-accent/80 hover:border-gray-600 transition-colors",
                          !selectedDate && "text-gray-400"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "dd/MM/yyyy") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-black border">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        className="bg-black text-white"
                        captionLayout="dropdown"
                        fromYear={1900}
                        toYear={new Date().getFullYear()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Button
                    onClick={handleDateSubmit}
                    disabled={!selectedDate || savingDate}
                    className="px-4 py-2 bg-white text-black hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Academic Details Card */}
          <div className="bg-black border p-6">
            <h2 className="text-xl font-bold text-white mb-6">Academic Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Registration Number
                </label>
                <input
                  type="text"
                  value={userProfile.registration_number || ''}
                  onChange={(e) => handleInputChange('registration_number', e.target.value)}
                  className="w-full px-3 py-2 bg-accent border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-white hover:bg-accent/80 hover:border-gray-600 transition-colors"
                  placeholder="Enter registration number"
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  College Name
                </label>
                <input
                  type="text"
                  value={userProfile.college || ''}
                  onChange={(e) => handleInputChange('college', e.target.value)}
                  className="w-full px-3 py-2 bg-accent border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-white hover:bg-accent/80 hover:border-gray-600 transition-colors"
                  placeholder="Enter college name"
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Batch
                </label>
                <input
                  type="text"
                  value={userProfile.batch || ''}
                  onChange={(e) => handleInputChange('batch', e.target.value)}
                  className="w-full px-3 py-2 bg-accent border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-white hover:bg-accent/80 hover:border-gray-600 transition-colors"
                  placeholder="Enter batch"
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Degree
                </label>
                <div className="flex gap-2">
                  {['btech', 'mtech', 'mba'].map((degree) => (
                    <button
                      key={degree}
                      onClick={() => handleDegreeChange(degree)}
                      className={`flex-1 px-4 py-2 border transition-colors ${
                        userProfile.degree === degree
                          ? 'border-white bg-accent text-white'
                          : 'border-gray-700 bg-accent text-white hover:bg-accent/80 hover:border-gray-600'
                      }`}
                    >
                      {degree}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Department
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['cse', 'mech', 'civil', 'ece'].map((dept) => (
                    <button
                      key={dept}
                      onClick={() => handleDepartmentChange(dept)}
                      className={`px-4 py-2 border transition-colors ${
                        userProfile.department === dept
                          ? 'border-white bg-accent text-white'
                          : 'border-gray-700 bg-accent text-white hover:bg-accent/80 hover:border-gray-600'
                      }`}
                    >
                      {dept}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}