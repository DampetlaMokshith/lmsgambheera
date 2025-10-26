'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import UnifiedCourseGrid from '@/components/ui/unified-course-grid';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/lib/supabase';

export default function CoursesPage() {
  const [userDegree, setUserDegree] = useState<string>('');
  const [userDepartment, setUserDepartment] = useState<string>('');
  const [tempDegree, setTempDegree] = useState<string>('');
  const [tempDepartment, setTempDepartment] = useState<string>('');
  const [showDialog, setShowDialog] = useState(false);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);

  const degrees = [
    { value: 'btech', label: 'B.Tech' },
    { value: 'mtech', label: 'M.Tech' },
    { value: 'mba', label: 'MBA' },
  ];

  const departments = [
    { value: 'cse', label: 'CSE' },
    { value: 'ece', label: 'ECE' },
    { value: 'mech', label: 'MECH' },
    { value: 'civil', label: 'CIVIL' },
  ];

  useEffect(() => {
    async function fetchUserProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        setUser(user);

        // First check cache for temporary selections
        const cachedDegree = localStorage.getItem(`temp-degree-${user.id}`);
        const cachedDepartment = localStorage.getItem(`temp-department-${user.id}`);

        // Fetch user profile from user_profiles table (not profiles)
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('degree, department')
          .eq('user_id', user.id)
          .single();

        console.log('🔍 Profile query result:', { profile, error });

        if (!error && profile && profile.degree && profile.department) {
          // User has saved profile data - use it directly
          console.log('✅ User profile found:', profile);
          setUserDegree(profile.degree);
          setUserDepartment(profile.department);
          
          // Clear any temporary cache since we have permanent data
          localStorage.removeItem(`temp-degree-${user.id}`);
          localStorage.removeItem(`temp-department-${user.id}`);
        } else if (cachedDegree && cachedDepartment) {
          // Use cached temporary selections
          console.log('📦 Using cached selections:', { cachedDegree, cachedDepartment });
          setUserDegree(cachedDegree);
          setUserDepartment(cachedDepartment);
        } else {
          // No profile data and no cache - show dialog
          console.log('❓ No profile data found, showing dialog');
          setShowDialog(true);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // Check cache as fallback
        const cachedDegree = localStorage.getItem(`temp-degree-${user?.id}`);
        const cachedDepartment = localStorage.getItem(`temp-department-${user?.id}`);
        
        if (cachedDegree && cachedDepartment) {
          setUserDegree(cachedDegree);
          setUserDepartment(cachedDepartment);
        } else {
          setShowDialog(true);
        }
      }
    }

    fetchUserProfile();
  }, [user?.id]);

  const handleDialogSubmit = async () => {
    if (tempDegree && tempDepartment && user) {
      // Save temporary selections to cache with user ID for immediate access
      localStorage.setItem(`temp-degree-${user.id}`, tempDegree);
      localStorage.setItem(`temp-department-${user.id}`, tempDepartment);
      
      // Update state for immediate filtering
      setUserDegree(tempDegree);
      setUserDepartment(tempDepartment);
      
      console.log('💾 Saved temporary selections to cache and updating profile:', { tempDegree, tempDepartment });
      
      // Update user profile in user_profiles table (not profiles)
      try {
        const { error } = await supabase
          .from('user_profiles')
          .upsert({
            user_id: user.id,
            degree: tempDegree,
            department: tempDepartment,
            updated_at: new Date().toISOString(),
          });
        
        if (!error) {
          console.log('✅ Profile saved to database');
          // Clear cache since we have permanent storage now
          localStorage.removeItem(`temp-degree-${user.id}`);
          localStorage.removeItem(`temp-department-${user.id}`);
        }
      } catch (error) {
        console.error('❌ Error saving profile:', error);
        // Keep cache as fallback
      }
      
      setShowDialog(false);
      setTempDegree("");
      setTempDepartment("");
    }
  };

  return (
    <DashboardLayout title=" ">
      <div className="space-y-6">
        {/* Header with Select Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white">Courses</h1>
          </div>
          
          <div className="flex gap-3">
            <Select value={userDegree} onValueChange={setUserDegree}>
              <SelectTrigger className="w-[140px] bg-black border text-white">
                <SelectValue placeholder="Degree" />
              </SelectTrigger>
              <SelectContent className="bg-black border-gray-700">
                {degrees.map((degree) => (
                  <SelectItem 
                    key={degree.value} 
                    value={degree.value}
                    className="text-white hover:bg-gray-700 focus:bg-accent"
                  >
                    {degree.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={userDepartment} onValueChange={setUserDepartment}>
              <SelectTrigger className="w-[140px] bg-black border text-white">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent className="bg-black border-gray-700">
                {departments.map((department) => (
                  <SelectItem 
                    key={department.value} 
                    value={department.value}
                    className="text-white hover:bg-gray-700 focus:bg-accent"
                  >
                    {department.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* All Courses */}
        <UnifiedCourseGrid
          title={userDegree || userDepartment 
            ? `For ${degrees.find(d => d.value === userDegree)?.label} ${departments.find(d => d.value === userDepartment)?.label}`.trim()
            : "All Courses"
          }
          subtitle={userDegree || userDepartment 
            ? "Filtered based on your academic profile"
            : "Browse our complete course catalog"
          }
          showOnlyFeatured={false}
          userDegree={userDegree}
          userDepartment={userDepartment}
        />

        {/* Dialog for selecting degree and department */}
        <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
          <AlertDialogContent className="bg-black border">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Select Your Academic Details</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400">
                Please select your degree and department to sort courses according to your field of study.
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-white text-sm font-medium">Degree</label>
                <Select value={tempDegree} onValueChange={setTempDegree}>
                  <SelectTrigger className="bg-accent border text-white">
                    <SelectValue placeholder="Select degree" />
                  </SelectTrigger>
                  <SelectContent className="bg-black border">
                    {degrees.map((degree) => (
                      <SelectItem 
                        key={degree.value} 
                        value={degree.value}
                        className="text-white hover:bg-gray-700 focus:bg-accent"
                      >
                        {degree.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-white text-sm font-medium">Department</label>
                <Select value={tempDepartment} onValueChange={setTempDepartment}>
                  <SelectTrigger className="bg-accent border text-white">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-gray-700">
                    {departments.map((department) => (
                      <SelectItem 
                        key={department.value} 
                        value={department.value}
                        className="text-white hover:bg-gray-700 focus:bg-accent"
                      >
                        {department.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <AlertDialogFooter>
              <AlertDialogAction 
                onClick={handleDialogSubmit}
                disabled={!tempDegree || !tempDepartment}
                className="bg-white hover:bg-white cursor-pointer text-black"
              >
                Apply Filter
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}