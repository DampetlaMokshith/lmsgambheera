'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/dashboard-layout';
import ProfileCard from '@/components/profile-card';
import DashboardStats from '@/components/dashboard-stats';
import ContributionChart from '@/components/contribution-chart';
import UnifiedCourseGrid from '@/components/ui/unified-course-grid';
import { ActivityTracker } from '@/components/activity-tracker';
import { Spinner } from '@/components/ui/spinner';

import type { User as SupabaseUser } from '@supabase/supabase-js';

export default function DashboardPage() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push('/auth');
          return;
        }
        
        setUser(session.user);
      } catch (error) {
        console.error('Error fetching user:', error);
        router.push('/auth');
      } finally {
        setLoading(false);
      }
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

    return () => subscription.unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <DashboardLayout title="">
        <div className="flex items-center justify-center min-h-[50vh]">
          <Spinner />
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout title="">
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-white">Please log in to access your dashboard.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="">
      {/* Activity Tracker - Automatically tracks user activity */}
      <ActivityTracker userId={user.id} pageUrl="/dashboard" activityType="dashboard_visit" />
      
      <div className="space-y-6 sm:space-y-8">
        {/* Header Section */}
        <div className="bg-black border rounded-xl p-15 sm:p-19 md:p-19">
          
        </div>

        {/* Dashboard Title */}
        <div className="text-left">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white font-inter">
            Dashboard
          </h1>
        </div>

        {/* Profile Card */}
        <ProfileCard user={user} />

        {/* Dashboard Stats */}
        <DashboardStats />

        {/* My Enrolled Courses */}
        <UnifiedCourseGrid
          title="My Enrolled Courses"
          subtitle="Continue learning from where you left off"
          showOnlyEnrolled={true}
          maxCourses={4}
        />

        {/* Contribution Chart - Desktop Only */}
        <div className="hidden lg:block">
          <ContributionChart userId={user.id} />
        </div>

        
        
      </div>
    </DashboardLayout>
  );
}