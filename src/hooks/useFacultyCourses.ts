import { useCallback, useMemo } from 'react';
import { safeClient } from '@/sanity/lib/safeClient';
import { getMultipleCourseEnrollmentCounts } from '@/lib/faculty-course-management';

interface CourseData {
  courses: Course[];
  enrollmentCounts: Record<string, number>;
}

interface Course {
  _id: string;
  title: string;
  slug: { current: string };
  description: string;
  thumbnail?: {
    asset?: {
      _id?: string;
      _ref?: string;
    };
    alt?: string;
  };
  duration: string;
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
      };
      alt?: string;
    };
  };
}

// Cache for course data to prevent repeated fetches
const courseCache = new Map<string, { data: CourseData; timestamp: number }>();
const cacheTimeout = 5 * 60 * 1000; // 5 minutes

// Optimized query for faculty courses with minimal data
const FACULTY_COURSES_QUERY = `*[_type == "course" && faculty->email == $email] | order(createdAt desc) {
  _id,
  title,
  slug,
  description,
  thumbnail {
    asset->{
      _id,
      _ref,
      url
    },
    alt
  },
  duration,
  level,
  isPublished,
  createdAt,
  faculty -> {
    _id,
    name,
    email,
    profileImage {
      asset->{
        _id,
        _ref,
        url
      },
      alt
    }
  }
}`;

export function useFacultyCourses() {
  const fetchFacultyCourses = useCallback(async (email: string) => {
    // Check cache first
    const cacheKey = `faculty-courses-${email}`;
    const cached = courseCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < cacheTimeout) {
      return cached.data;
    }

    try {
      // Try courses query with retry mechanism
      let coursesData;
      try {
        coursesData = await safeClient.fetch(FACULTY_COURSES_QUERY, { email });
      } catch (courseError) {
        // Fallback to basic query without faculty relation
        try {
          coursesData = await safeClient.fetch(
            `*[_type == "course"] | order(createdAt desc) {
              _id,
              title,
              slug,
              description,
              thumbnail {
                asset->{
                  _id,
                  _ref
                },
                alt
              },
              duration,
              level,
              isPublished,
              createdAt
            }`,
            {}
          );
        } catch (fallbackError) {
          throw new Error('Failed to fetch courses from Sanity');
        }
      }
      
      // Try enrollment counts
      let enrollmentData = {};
      try {
        if (coursesData && (coursesData as Course[]).length > 0) {
          const courseIds = (coursesData as Course[]).map((course: Course) => course._id).filter(Boolean);
          if (courseIds.length > 0) {
            enrollmentData = await getMultipleCourseEnrollmentCounts(courseIds);
          }
        }
      } catch (enrollmentError) {
        // Don't throw error, just continue without enrollment counts
      }

      const result: CourseData = {
        courses: (coursesData as Course[]) || [],
        enrollmentCounts: enrollmentData || {}
      };

      // Cache the result
      courseCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      throw error;
    }
  }, []);

  // Clear cache when needed
  const clearCache = useCallback((email?: string) => {
    if (email) {
      courseCache.delete(`faculty-courses-${email}`);
    } else {
      courseCache.clear();
    }
  }, []);

  return useMemo(() => ({
    fetchFacultyCourses,
    clearCache
  }), [fetchFacultyCourses, clearCache]);
}