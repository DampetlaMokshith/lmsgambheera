'use client';

import { useEffect, useState } from 'react';
import CourseCard from '@/components/ui/course-card';
import { getPublishedCourses, getCoursesByDegreeAndDepartment } from '@/sanity/lib/queries';
import { getMultipleCourseEnrollmentCounts } from '@/lib/course-management';
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

interface TransformedCourse {
  _id: string;
  title: string;
  description: string;
  slug: {
    current: string;
  };
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
  rating: number;
  totalEnrollments: number;
  estimatedDuration: number;
  level: string;
  price: number;
  tags: string[];
  isPublished: boolean;
  isFeatured?: boolean;
  degree?: string;
  department?: string;
}

interface CourseGridProps {
  title?: string;
  subtitle?: string;
  showOnlyFeatured?: boolean;
  maxCourses?: number;
  className?: string;
  userDegree?: string;
  userDepartment?: string;
}

export default function CourseGrid({
  title = " ",
  subtitle = " ",
  showOnlyFeatured = false,
  maxCourses,
  className = "",
  userDegree,
  userDepartment
}: CourseGridProps) {
  const [courses, setCourses] = useState<TransformedCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrollmentCounts, setEnrollmentCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    async function fetchCourses() {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔍 Fetching courses from Sanity...', { userDegree, userDepartment });
        
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
        console.log('Sample course data:', publishedCourses[0]);
        
        // Check for duplicate course titles
        const courseIds = publishedCourses.map((course: Course) => course._id);
        const courseTitles = publishedCourses.map((course: Course) => course.title);
        console.log('🔍 Course IDs:', courseIds);
        console.log('🔍 Course titles:', courseTitles);
        
        // Check for duplicate titles
        const duplicateTitles = courseTitles.filter((title: string, index: number) => courseTitles.indexOf(title) !== index);
        if (duplicateTitles.length > 0) {
          console.warn('⚠️ Found duplicate course titles:', duplicateTitles);
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
        
        // Filter featured courses if needed
        let filteredCourses = showOnlyFeatured 
          ? transformedCourses.filter((course: TransformedCourse) => course.isFeatured)
          : transformedCourses;
        
        // Limit number of courses if specified
        if (maxCourses && maxCourses > 0) {
          filteredCourses = filteredCourses.slice(0, maxCourses);
        }
        
        setCourses(filteredCourses);
        
        // Fetch real enrollment counts from Supabase
        if (filteredCourses.length > 0) {
          try {
            const courseIds = filteredCourses.map(course => course._id);
            const enrollmentData = await getMultipleCourseEnrollmentCounts(courseIds);
            setEnrollmentCounts(enrollmentData);
            console.log('📊 Fetched enrollment counts:', enrollmentData);
          } catch (enrollmentError) {
            console.warn('⚠️ Failed to fetch enrollment counts:', enrollmentError);
          }
        }
        
        console.log(`📊 Displaying ${filteredCourses.length} courses`);
        
      } catch (err) {
        console.error('❌ Error fetching courses:', err);
        setError('Failed to load courses. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchCourses();
  }, [showOnlyFeatured, maxCourses, userDegree, userDepartment]);

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
        
        {courses.length > 0 && (
          <div className="text-sm text-gray-400">
            {courses.length} course{courses.length !== 1 ? 's' : ''} available
          </div>
        )}
      </div>

      {/* Courses Grid */}
      {courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {courses.map((course) => (
            <CourseCard 
              key={course._id} 
              {...course} 
              enrollmentCountOverride={enrollmentCounts[course._id]}
            />
          ))}
        </div>
      ) : (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 text-center">
          <h3 className="text-xl font-semibold text-white mb-4">
            {showOnlyFeatured ? 'No Featured Courses' : 'No Courses Available'}
          </h3>
          <p className="text-gray-400">
            {showOnlyFeatured 
              ? 'No featured courses found. Check out all courses for more options!'
              : 'No published courses found. Check back later for new content!'
            }
          </p>
        </div>
      )}
    </div>
  );
}
