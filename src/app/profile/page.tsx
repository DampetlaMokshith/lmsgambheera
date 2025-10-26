'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/dashboard-layout';
import Image from 'next/image';
import { useTimeBasedBackground } from '@/hooks/useTimeBasedBackground';
import { Save, User, Check } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { toast, Toaster } from 'sonner';
import { format } from 'date-fns';
import type { User as SupabaseUser } from '@supabase/supabase-js';

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
}

export default function ProfilePage() {
  const { backgroundImage } = useTimeBasedBackground();
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

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
        console.error('Error fetching profile:', error);
      }
      
      // Fallback to metadata if no database profile exists
      const metadata = session.user.user_metadata;
      const cachedGender = localStorage.getItem(`user-gender-${session.user.id}`) as 'male' | 'female' | null;
      
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
      });
      
      // Set selectedDate if date_of_birth exists
      if (profileData?.date_of_birth) {
        setSelectedDate(new Date(profileData.date_of_birth));
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      router.push('/auth');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const getAvatarImage = () => {
    if (userProfile.gender === 'male') {
      return '/bitmoji_boy.png';
    } else if (userProfile.gender === 'female') {
      return '/bitmoji_girl.png';
    }
    return null;
  };

  const handleDateSubmit = async () => {
    if (selectedDate) {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      
      try {
        // Update profile with selected date
        await handleInputChange('date_of_birth', formattedDate);
        
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
            console.error('Error saving date of birth:', error);
            toast.error('Failed to save date of birth');
          } else {
            toast.success('Date of birth saved successfully!');
            // Update local state
            setUserProfile(prev => ({ ...prev, date_of_birth: formattedDate }));
          }
        }
      } catch (error) {
        console.error('Error submitting date:', error);
        toast.error('Failed to save date of birth');
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

  const handleSave = async () => {
    setSaving(true);
    try {
      if (user) {
        // Save gender to localStorage for immediate avatar update
        if (userProfile.gender) {
          localStorage.setItem(`user-gender-${user.id}`, userProfile.gender);
        }
        
        // Prepare data for database
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
        
        console.log('Profile saved to database:', profileData);
        
        // Show success toast
        toast.success('Profile updated successfully!', {
          description: 'Your profile changes have been saved.',
          duration: 2000,
        });
      }
    } catch (error) {
      console.error('Error saving profile:', error);
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
          <div className="bg-black border rounded-xl overflow-hidden shadow-lg">
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
                  <div className="h-10 bg-accent rounded-lg animate-pulse w-32"></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Forms Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Details Skeleton */}
            <div className="bg-black border rounded-xl p-6">
              <div className="h-6 bg-accent rounded animate-pulse w-32 mb-6"></div>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 bg-accent rounded animate-pulse w-24"></div>
                    <div className="h-10 bg-accent border border-gray-700 rounded-lg animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Academic Details Skeleton */}
            <div className="bg-black border rounded-xl p-6">
              <div className="h-6 bg-accent rounded animate-pulse w-32 mb-6"></div>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 bg-accent rounded animate-pulse w-24"></div>
                    <div className="h-10 bg-accent border border-gray-700 rounded-lg animate-pulse"></div>
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
    <DashboardLayout title="Profile">
      <div className="space-y-6">
        {/* Profile Header with Cover and Avatar */}
        <div className="bg-black border rounded-xl overflow-hidden shadow-lg">
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

              {/* Save Button */}
              <div className="sm:pb-0">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full sm:w-auto px-6 py-2 bg-black border-3 text-white rounded-lg hover:bg-accent hover:text-white transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Editable Forms */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Details Card */}
          <div className="bg-black border rounded-xl p-6">
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
                  className="w-full px-3 py-2 bg-accent border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white"
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
                  className="w-full px-3 py-2 bg-accent border border-gray-600 rounded-lg text-gray-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Gender
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleGenderChange('male')}
                    className={`flex-1 px-4 py-2 cursor-pointer rounded-lg border transition-colors ${
                      userProfile.gender === 'male'
                        ? 'border-white bg-accent text-white'
                        : 'border-gray-500 bg-accent text-white hover:bg-accent/50'
                    }`}
                  >
                    Male
                  </button>
                  <button
                    onClick={() => handleGenderChange('female')}
                    className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                      userProfile.gender === 'female'
                        ? 'border-white bg-accent text-white'
                        : 'border-gray-500 bg-accent text-gray-300 hover:bg-accent/50'
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
                  className="w-full px-3 py-2 bg-accent border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white"
                  placeholder="Enter guardian's email"
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Date of Birth
                </label>
                <div className="space-y-4">
                  {/* Display current date if set */}
                  {userProfile.date_of_birth && (
                    <div className="text-white text-sm bg-accent px-3 py-2 rounded-lg border border-gray-700">
                      Selected: {format(new Date(userProfile.date_of_birth), 'PP')}
                    </div>
                  )}
                  
                  {/* Calendar Component */}
                  <div className="bg-black border rounded-lg p-4">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      className="rounded-lg bg-accent text-white"
                      captionLayout="dropdown"
                    />
                    
                    {/* Submit Button */}
                    {selectedDate && (
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">
                            Selected: {format(selectedDate, 'PP')}
                          </span>
                          <Button
                            onClick={handleDateSubmit}
                            className="bg-white text-black hover:bg-gray-200 px-4 py-2 rounded-lg"
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Submit Date
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Academic Details Card */}
          <div className="bg-black border rounded-xl p-6">
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
                  className="w-full px-3 py-2 bg-accent border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white"
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
                  className="w-full px-3 py-2 bg-accent border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white"
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
                  className="w-full px-3 py-2 bg-accent border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white"
                  placeholder="Enter batch"
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Degree
                </label>
                <input
                  type="text"
                  value={userProfile.degree || ''}
                  onChange={(e) => handleInputChange('degree', e.target.value)}
                  className="w-full px-3 py-2 bg-accent border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white"
                  placeholder="Enter degree"
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Department
                </label>
                <input
                  type="text"
                  value={userProfile.department || ''}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  className="w-full px-3 py-2 bg-accent border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white"
                  placeholder="Enter department"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <Toaster 
        position="bottom-right"
        theme="light"
        toastOptions={{
          style: {
            background: 'white',
            color: 'black',
            border: '1px solid #374151',
          },
          className: 'bg-black text-white border-gray-700',
        }}
        closeButton
      />
    </DashboardLayout>
  );
}