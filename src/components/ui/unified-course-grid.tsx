"use client";

import { useEffect, useState, useMemo } from 'react';
import CourseCard from '@/components/ui/course-card';
import EnrolledCourseCard from '@/components/ui/enrolled-course-card';
import { getPublishedCourses, getCoursesByDegreeAndDepartment } from '@/sanity/lib/queries';
import { getMultipleCourseEnrollmentCounts } from '@/lib/course-management';
import { supabase } from '@/lib/supabase';
import { Spinner } from '@/components/ui/spinner';
import { CourseGridSkeleton } from '@/components/skeletons/course-card-skeleton';
import Image from 'next/image';

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
  excludeCourseId?: string; // Exclude a specific course from results
}

export default function UnifiedCourseGrid({
  title = " ",
  subtitle = " ",
  showOnlyFeatured = false,
  showOnlyEnrolled = false,
  maxCourses,
  className = "",
  userDegree,
  userDepartment,
  excludeCourseId
}: UnifiedCourseGridProps) {
  const [courses, setCourses] = useState<TransformedCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrollmentCounts, setEnrollmentCounts] = useState<Record<string, number>>({});
  const [enrolledCourses, setEnrolledCourses] = useState<Set<string>>(new Set());
  const [courseProgress, setCourseProgress] = useState<Record<string, number>>({});
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userDataLoaded, setUserDataLoaded] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
        setAccessToken(session?.access_token || null);
        setUserDataLoaded(true);
      } catch (error) {
        setUser(null);
        setAccessToken(null);
        setUserDataLoaded(true);
      }
    }
    fetchUser();
  }, []);

  useEffect(() => {
    async function fetchUserEnrollments() {
      if (!user || !userDataLoaded || !accessToken) return;
      
      try {
        // Fetch enrolled courses via API (uses service role to bypass RLS)
        const response = await fetch(`/api/enrollments`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch enrollments');
        }

        const data = await response.json();
        
        if (data.enrollments && data.enrollments.length > 0) {
          // Extract sanity IDs from enrollments
          const enrolledSanityIds = new Set<string>(
            data.enrollments
              .filter((e: { sanityId: string | null }) => e.sanityId)
              .map((e: { sanityId: string }) => e.sanityId)
          );
          setEnrolledCourses(enrolledSanityIds);
          
          // Extract progress data from API response
          const progressData: Record<string, number> = {};
          data.enrollments.forEach((e: { sanityId: string | null; progressPercentage: number }) => {
            if (e.sanityId) {
              progressData[e.sanityId] = e.progressPercentage || 0;
            }
          });
          setCourseProgress(progressData);
        }
      } catch {
        // Failed to fetch user enrollments
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
        
        let publishedCourses;
        
        // Use filtered query if degree is provided
        if (userDegree && userDepartment && userDepartment !== 'all') {
          publishedCourses = await getCoursesByDegreeAndDepartment(userDegree, userDepartment);
        } else if (userDegree && userDepartment === 'all') {
          // Fetch all courses and filter by degree only
          const allCourses = await getPublishedCourses();
          publishedCourses = allCourses.filter((course: Course) => 
            course.degree?.toLowerCase() === userDegree.toLowerCase()
          );
        } else {
          publishedCourses = await getPublishedCourses();
        }
        
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
        
      } catch (err) {
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
    
    // Exclude specific course if excludeCourseId is provided
    if (excludeCourseId) {
      filtered = filtered.filter(course => course._id !== excludeCourseId);
    }
    
    if (showOnlyEnrolled && user) {
      filtered = filtered.filter(course => enrolledCourses.has(course._id));
    } else if (!showOnlyEnrolled) {
      // Filter featured courses if needed
      filtered = showOnlyFeatured 
        ? filtered.filter((course: TransformedCourse) => course.isFeatured)
        : filtered;
    }
    
    // Limit number of courses if specified
    if (maxCourses && maxCourses > 0) {
      filtered = filtered.slice(0, maxCourses);
    }
    
    return filtered;
  }, [courses, showOnlyEnrolled, showOnlyFeatured, maxCourses, user, enrolledCourses, excludeCourseId]);

  // Group courses by degree and department when "ALL" is selected
  const groupedCourses = useMemo(() => {
    if (userDepartment === 'all' && userDegree) {
      const groups: Record<string, TransformedCourse[]> = {};
      filteredCourses.forEach(course => {
        // Only use department name, not degree
        const key = course.department?.toUpperCase() || 'UNKNOWN';
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(course);
      });
      return groups;
    }
    return null;
  }, [filteredCourses, userDepartment, userDegree]);

  // Separate effect for fetching enrollment counts
  useEffect(() => {
    if (filteredCourses.length > 0 && !showOnlyEnrolled) {
      async function fetchEnrollmentCounts() {
        try {
          const courseIds = filteredCourses.map(course => course._id);
          const enrollmentData = await getMultipleCourseEnrollmentCounts(courseIds);
          setEnrollmentCounts(enrollmentData);
} catch (enrollmentError) {
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
        
        <CourseGridSkeleton count={8} columns={4} />
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
        
        <div className="bg-red-900/20 border border-red-700 p-6 text-center">
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

      {/* Courses Grid - Grouped or Regular */}
      {filteredCourses.length > 0 ? (
        groupedCourses ? (
          // Grouped view when ALL departments selected
          <div className="space-y-8">
            {Object.entries(groupedCourses).sort().map(([groupName, groupCourses]) => (
              <div key={groupName} className="space-y-4">
                <h3 className="text-xl font-bold text-white pb-2">
                  For {groupName} :
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {groupCourses.map((course) => {
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
              </div>
            ))}
          </div>
        ) : (
          // Regular grid view
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
        )
      ) : (
        <div className="bg-black border p-8 text-center">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Image
              src="/no_data.svg"
              alt="No data"
              width={120}
              height={120}
              className="opacity-15"
            />
            <h3 className="text-xl font-semibold text-white">
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
        </div>
      )}
    </div>
  );
}