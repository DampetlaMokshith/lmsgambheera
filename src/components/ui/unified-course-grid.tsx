"use client";

import { useEffect, useState, useMemo } from 'react';
import CourseCard from '@/components/ui/course-card';
import EnrolledCourseCard from '@/components/ui/enrolled-course-card';
import { getPublishedCourses, getCoursesByDegreeAndDepartment } from '@/sanity/lib/queries';
import { getMultipleCourseEnrollmentCounts, getMultipleCourseProgress } from '@/lib/course-management';
import { supabase } from '@/lib/supabase';
import { Spinner } from '@/components/ui/spinner';

interface Course {
  _id: string;
  title: string;
  description: string;
  slug: {
    current: string;
  };
  thumbnail: {
    asset: {
      _id?: string;
      _ref?: string;
    };
    alt?: string;
  };
  faculty: {
    name: string;
    profileImage?: {
      asset: {
        _id?: string;
        _ref?: string;
      };
    };
  };
  rating: number;
  totalEnrollments: number;
  estimatedDuration: number;
  level: string;
  price: number;
  tags: string[];
  isPublished: boolean;
  isFeatured?: boolean;
  publishedAt?: string;
  degree?: string;
  department?: string;
}

interface TransformedCourse extends Omit<Course, 'thumbnail' | 'faculty'> {
  thumbnail: {
    asset: {
      _ref: string;
    };
    alt?: string;
  };
  faculty: {
    name: string;
    profileImage?: {
      asset: {
        _ref: string;
      };
    };
  };
}

interface UnifiedCourseGridProps {
  title?: string;
  subtitle?: string;
  showOnlyFeatured?: boolean;
  showOnlyEnrolled?: boolean; // New prop to show only enrolled courses
  maxCourses?: number;
  className?: string;
  userDegree?: string;
  userDepartment?: string;
}

export default function UnifiedCourseGrid({
  title = " ",
  subtitle = " ",
  showOnlyFeatured = false,
  showOnlyEnrolled = false,
  maxCourses,
  className = "",
  userDegree,
  userDepartment
}: UnifiedCourseGridProps) {
  const [courses, setCourses] = useState<TransformedCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrollmentCounts, setEnrollmentCounts] = useState<Record<string, number>>({});
  const [enrolledCourses, setEnrolledCourses] = useState<Set<string>>(new Set());
  const [courseProgress, setCourseProgress] = useState<Record<string, number>>({});
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [userDataLoaded, setUserDataLoaded] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        setUserDataLoaded(true);
      } catch (error) {
        console.error('Error fetching user:', error);
        setUser(null);
        setUserDataLoaded(true);
      }
    }
    fetchUser();
  }, []);

  useEffect(() => {
    async function fetchUserEnrollments() {
      if (!user || !userDataLoaded) return;
      
      try {
        const { data: enrollments } = await supabase
          .from('course_enrollments')
          .select('course_id')
          .eq('user_id', user.id);
        
        if (enrollments) {
          // Get courses data to map supabase IDs to sanity IDs
          const { data: coursesData } = await supabase
            .from('courses')
            .select('id, sanity_id')
            .in('id', enrollments.map(e => e.course_id));
          
          if (coursesData) {
            const enrolledSanityIds = new Set(
              coursesData
                .filter(course => course.sanity_id)
                .map(course => course.sanity_id!)
            );
            setEnrolledCourses(enrolledSanityIds);
            
            // Get progress for enrolled courses
            const enrolledCourseIds = Array.from(enrolledSanityIds);
            if (enrolledCourseIds.length > 0) {
              const progressData = await getMultipleCourseProgress(user.id, enrolledCourseIds);
              setCourseProgress(progressData);
            }
          }
        }
      } catch (error) {
        console.warn('⚠️ Failed to fetch user enrollments:', error);
      }
    }

    fetchUserEnrollments();
  }, [user, userDataLoaded]);

  useEffect(() => {
    async function fetchCourses() {
      if (!userDataLoaded) return; // Wait for user data to be loaded
      
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔍 Fetching courses from Sanity...', { userDegree, userDepartment, showOnlyEnrolled });
        
        let publishedCourses;
        
        // Use filtered query if degree and department are provided
        if (userDegree && userDepartment) {
          console.log(`🎯 Filtering courses for ${userDegree} ${userDepartment}`);
          publishedCourses = await getCoursesByDegreeAndDepartment(userDegree, userDepartment);
        } else {
          console.log('📚 Fetching all published courses');
          publishedCourses = await getPublishedCourses();
        }
        
        console.log(`✅ Fetched ${publishedCourses.length} courses from Sanity`);
        
        // Transform Sanity data to match CourseCard expectations
        const transformedCourses: TransformedCourse[] = publishedCourses
          .filter((course: Course) => 
            course.thumbnail?.asset?._ref || course.thumbnail?.asset?._id
          )
          .map((course: Course): TransformedCourse => ({
            _id: course._id,
            title: course.title,
            description: course.description,
            slug: course.slug,
            thumbnail: {
              asset: {
                _ref: course.thumbnail.asset._ref || course.thumbnail.asset._id || `image-${course._id}`
              },
              alt: course.thumbnail.alt || course.title
            },
            faculty: {
              name: course.faculty?.name || 'Unknown Faculty',
              profileImage: course.faculty?.profileImage?.asset ? {
                asset: {
                  _ref: course.faculty.profileImage.asset._ref || course.faculty.profileImage.asset._id || `profile-${course._id}`
                }
              } : undefined
            },
            rating: course.rating || 4.5,
            totalEnrollments: course.totalEnrollments || 0,
            estimatedDuration: course.estimatedDuration || 0,
            level: course.level || 'beginner',
            price: course.price || 0,
            tags: course.tags || [],
            isPublished: course.isPublished !== false,
            isFeatured: course.isFeatured || false,
            degree: course.degree,
            department: course.department
          }));
        
        setCourses(transformedCourses);
        
        console.log(`📊 Displaying ${transformedCourses.length} courses`);
        
      } catch (err) {
        console.error('❌ Error fetching courses:', err);
        setError('Failed to load courses. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchCourses();
  }, [showOnlyFeatured, showOnlyEnrolled, maxCourses, userDegree, userDepartment, userDataLoaded]);

  // Separate effect for filtering courses based on enrollment
  const filteredCourses = useMemo(() => {
    let filtered = courses;
    
    if (showOnlyEnrolled && user) {
      filtered = courses.filter(course => enrolledCourses.has(course._id));
    } else if (!showOnlyEnrolled) {
      // Filter featured courses if needed
      filtered = showOnlyFeatured 
        ? courses.filter((course: TransformedCourse) => course.isFeatured)
        : courses;
    }
    
    // Limit number of courses if specified
    if (maxCourses && maxCourses > 0) {
      filtered = filtered.slice(0, maxCourses);
    }
    
    return filtered;
  }, [courses, showOnlyEnrolled, showOnlyFeatured, maxCourses, user, enrolledCourses]);

  // Separate effect for fetching enrollment counts
  useEffect(() => {
    if (filteredCourses.length > 0 && !showOnlyEnrolled) {
      async function fetchEnrollmentCounts() {
        try {
          const courseIds = filteredCourses.map(course => course._id);
          const enrollmentData = await getMultipleCourseEnrollmentCounts(courseIds);
          setEnrollmentCounts(enrollmentData);
          console.log('📊 Fetched enrollment counts:', enrollmentData);
        } catch (enrollmentError) {
          console.warn('⚠️ Failed to fetch enrollment counts:', enrollmentError);
        }
      }
      fetchEnrollmentCounts();
    }
  }, [filteredCourses, showOnlyEnrolled]);

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
          <p className="text-gray-400">{subtitle}</p>
        </div>
        
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <Spinner />
            <p className="text-center text-gray-400">Loading courses...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
          <p className="text-gray-400">{subtitle}</p>
        </div>
        
        <div className="bg-red-900/20 border border-red-700 rounded-xl p-6 text-center">
          <h3 className="text-lg font-semibold text-red-400 mb-2">Error Loading Courses</h3>
          <p className="text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
          <p className="text-gray-400">{subtitle}</p>
        </div>
        
        {filteredCourses.length > 0 && (
          <div className="text-sm text-gray-400">
            {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} available
          </div>
        )}
      </div>

      {/* Courses Grid */}
      {filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCourses.map((course) => {
            const isEnrolled = enrolledCourses.has(course._id);
            
            if (isEnrolled) {
              return (
                <EnrolledCourseCard 
                  key={`enrolled-${course._id}`}
                  {...course}
                  progress={courseProgress[course._id] || 0}
                />
              );
            } else {
              return (
                <CourseCard 
                  key={course._id}
                  {...course}
                  enrollmentCountOverride={enrollmentCounts[course._id]}
                />
              );
            }
          })}
        </div>
      ) : (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 text-center">
          <h3 className="text-xl font-semibold text-white mb-4">
            {showOnlyEnrolled ? 'No Enrolled Courses' : showOnlyFeatured ? 'No Featured Courses' : 'No Courses Available'}
          </h3>
          <p className="text-gray-400">
            {showOnlyEnrolled 
              ? 'You haven\'t enrolled in any courses yet. Browse available courses to get started!'
              : showOnlyFeatured 
                ? 'No featured courses found. Check out all courses for more options!'
                : 'No published courses found. Check back later for new content!'
            }
          </p>
        </div>
      )}
    </div>
  );
}