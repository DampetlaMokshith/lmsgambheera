'use client';

import { useState, useEffect } from 'react';
import FacultyLayout from '@/components/layout/faculty-layout';
import { Button } from '@/components/ui/button';
import FacultyCard from '@/components/ui/faculty-card';
import { useFacultyAuth } from '@/hooks/useFacultyAuth';
import { useFacultyCourses } from '@/hooks/useFacultyCourses';
import { toast } from 'sonner';

interface Course {
  _id: string;
  title: string;
  slug: { current: string };
  description: string;
  thumbnail?: {
    asset?: {
      _id?: string;
      _ref?: string;
      url?: string;
    };
    alt?: string;
  };
  duration?: string;
  level: string;
  isPublished: boolean;
  createdAt: string;
  faculty: {
    _id: string;
    name: string;
    email: string;
    profileImage?: {
      asset?: {
        _id?: string;
        _ref?: string;
        url?: string;
      };
      alt?: string;
    };
  };
  enrollmentCount?: number;
}

export default function CoursesAvailablePage() {
  const { user, loading: authLoading } = useFacultyAuth();
  const { fetchFacultyCourses } = useFacultyCourses();
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollmentCounts, setEnrollmentCounts] = useState<Record<string, number>>({});

  // Load courses when user is authenticated
  useEffect(() => {
    if (!authLoading && user?.email) {
      setLoading(true);
      fetchFacultyCourses(user.email)
        .then(({ courses, enrollmentCounts }) => {
          setCourses(courses as Course[]);
          setEnrollmentCounts(enrollmentCounts);
          console.log('✅ Courses loaded successfully:', (courses as Course[]).length);
        })
        .catch((error) => {
          console.error('❌ Failed to load courses:', error);
          // Show user-friendly error message
          if (error.message.includes('Sanity')) {
            toast.error('Unable to connect to course database. Please check your internet connection and try again.');
          } else if (error.message.includes('network') || error.message.includes('fetch')) {
            toast.error('Network error. Please check your connection and try again.');
          } else {
            toast.error('Failed to load courses. Please try again later.');
          }
          // Set empty state to show "no courses" message
          setCourses([]);
          setEnrollmentCounts({});
        })
        .finally(() => setLoading(false));
    }
  }, [authLoading, user, fetchFacultyCourses]);

  // Memoized course components to prevent unnecessary re-renders
  const courseComponents = courses.map((course) => (
    <FacultyCard
      key={course._id}
      _id={course._id}
      title={course.title}
      description={course.description}
      slug={course.slug}
      thumbnail={course.thumbnail}
      faculty={course.faculty}
      duration={course.duration}
      level={course.level}
      isPublished={course.isPublished}
      enrollmentCount={enrollmentCounts[course._id] || 0}
      createdAt={course.createdAt}
    />
  ));

  // Loading state
  if (authLoading || loading) {
    return (
      <FacultyLayout title="Courses Available">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
            <div className="text-white">Loading your courses...</div>
          </div>
        </div>
      </FacultyLayout>
    );
  }

  return (
    <FacultyLayout title="Courses Available">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-gray-400">
              Manage your courses and track student progress
            </p>
            {courses.length > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                {courses.length} course{courses.length !== 1 ? 's' : ''} found
              </p>
            )}
          </div>
          <Button 
            onClick={() => window.location.href = '/faculty/creatingnewcourse'}
            className="bg-white text-black hover:bg-gray-100 cursor-pointer transition-all duration-200"
          >
            Create New Course
          </Button>
        </div>

        {/* Courses Grid */}
        {courses.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <h3 className="text-lg font-medium text-white mb-2">No courses found</h3>
              <p className="text-sm">You haven&apos;t created any courses yet. Create your first course to get started.</p>
            </div>
            <Button 
              onClick={() => window.location.href = '/faculty/creatingnewcourse'}
              className="bg-white text-black hover:bg-gray-100 cursor-pointer transition-all duration-200"
            >
              Create Your First Course
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {courseComponents}
          </div>
        )}
      </div>
    </FacultyLayout>
  );
}