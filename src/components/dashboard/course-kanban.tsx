'use client';

import { useEffect, useState } from 'react';
import { getCourseById } from '@/sanity/lib/queries';
import { urlFor } from '@/sanity/lib/image';
import Image from 'next/image';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BookOpen, CheckCircle2, PlayCircle, Clock, LucideIcon, Tag } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { KanbanSkeleton } from '@/components/skeletons/kanban-skeleton';
import { supabase } from '@/lib/supabase';

interface Course {
  _id: string;
  title: string;
  slug: {
    current: string;
  };
  description?: string;
  thumbnail?: {
    asset?: {
      _ref: string;
      _type: string;
    };
  } | null;
  faculty: {
    name: string;
    profileImage?: {
      asset?: {
        _ref: string;
        _type: string;
      };
    } | null;
  };
  level?: string;
  department?: string;
  estimatedDuration?: string;
  progress?: number;
}

interface CourseKanbanProps {
  userId: string;
}

export default function CourseKanban({ userId }: CourseKanbanProps) {
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [inProgressCourses, setInProgressCourses] = useState<Course[]>([]);
  const [completedCourses, setCompletedCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEnrolledCourses() {
      try {
        // Get session for authentication
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          setLoading(false);
          return;
        }

        // Fetch enrolled courses via API (uses service role to bypass RLS)
        const response = await fetch(`/api/enrollments`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch enrollments');
        }

        const data = await response.json();

        if (!data.enrollments || data.enrollments.length === 0) {
          setLoading(false);
          return;
        }

        // Fetch full course details from Sanity for richer UI
        const coursesPromises = data.enrollments.map(async (enrollment: {
          sanityId: string;
          title: string;
          slug: string;
          progressPercentage: number;
          facultyName: string;
        }) => {
          try {
            // Only fetch from Sanity if we have a sanityId
            if (enrollment.sanityId) {
              const sanityData = await getCourseById(enrollment.sanityId);
              
              if (sanityData) {
                return {
                  _id: sanityData._id,
                  title: sanityData.title,
                  slug: sanityData.slug,
                  description: sanityData.description,
                  thumbnail: sanityData.thumbnail,
                  faculty: {
                    name: sanityData.faculty?.name || enrollment.facultyName || 'Unknown Faculty',
                    profileImage: sanityData.faculty?.profileImage || null,
                  },
                  level: sanityData.level,
                  department: sanityData.department,
                  estimatedDuration: sanityData.estimatedDuration,
                  progress: enrollment.progressPercentage || 0,
                };
              }
            }
            
            // Fallback if Sanity data not available
            return {
              _id: enrollment.sanityId || enrollment.title,
              title: enrollment.title,
              slug: { current: enrollment.slug },
              description: '',
              thumbnail: null,
              faculty: {
                name: enrollment.facultyName || 'Unknown Faculty',
                profileImage: null,
              },
              level: undefined,
              department: undefined,
              estimatedDuration: undefined,
              progress: enrollment.progressPercentage || 0,
            };
          } catch {
            return null;
          }
        });

        const allCoursesData = await Promise.all(coursesPromises);
        const validCourses: Course[] = allCoursesData.filter(c => c !== null) as Course[];

        // ALL courses go to enrolled column
        setEnrolledCourses(validCourses);
        
        // ALSO show in progress and completed columns (courses can appear in multiple columns)
        const inProgress = validCourses.filter(c => {
          const progress = c.progress || 0;
          return progress > 0 && progress < 100;
        });
        const completed = validCourses.filter(c => (c.progress || 0) === 100);

        setInProgressCourses(inProgress);
        setCompletedCourses(completed);
      } catch {
        setEnrolledCourses([]);
        setInProgressCourses([]);
        setCompletedCourses([]);
      } finally {
        setLoading(false);
      }
    }

    fetchEnrolledCourses();
  }, [userId]);

  if (loading) {
    return <KanbanSkeleton />;
  }

  if (enrolledCourses.length === 0 && inProgressCourses.length === 0 && completedCourses.length === 0) {
    return (
      <div className="w-full bg-black border p-8 text-center">
        <BookOpen className="w-8 h-8 text-white mx-auto mb-4" />
        <h3 className="text-md font-semibold text-white mb-2">No Enrolled Courses yet!</h3>
        
        <Link
          href="/courses"
          className="inline-block px-6 py-2 bg-white text-black rounded-full hover:bg-gray-200 transition-colors"
        >
          Browse Courses
        </Link>
      </div>
    );
  }

  const CourseCard = ({ course, showProgress = true }: { course: Course; showProgress?: boolean }) => {
    const thumbnailUrl = course.thumbnail?.asset
      ? urlFor(course.thumbnail).width(300).height(300).url()
      : null;

    const facultyImageUrl = course.faculty.profileImage?.asset
      ? urlFor(course.faculty.profileImage).width(100).height(100).url()
      : null;

    return (
      <Link href={`/courses/${course.slug.current}`}>
        <div className="bg-black border border-gray-800 overflow-hidden hover:border-gray-600 transition-all duration-300 cursor-pointer group shadow-md hover:shadow-lg">
          <div className="flex gap-3 p-3">
            {/* Thumbnail - Left Side Square */}
            {thumbnailUrl ? (
              <div className="relative w-24 h-24 flex-shrink-0 overflow-hidden bg-gray-800">
                <Image
                  src={thumbnailUrl}
                  alt={course.title}
                  fill
                  className="object-cover"
                  sizes="96px"
                  quality={90}
                  loading="lazy"
                />
              </div>
            ) : (
              <div className="w-24 h-24 flex-shrink-0 bg-gray-900 flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-gray-600" />
              </div>
            )}

            {/* Content - Right Side */}
            <div className="flex-1 min-w-0">
              {/* Title */}
              <h3 className="font-semibold text-white text-sm mb-2 line-clamp-2">
                {course.title}
              </h3>

              {/* Faculty Info */}
              <div className="flex items-center gap-2 mb-2">
                <Avatar className="w-5 h-5">
                  {facultyImageUrl && <AvatarImage src={facultyImageUrl} alt={course.faculty.name} />}
                  <AvatarFallback className="text-[10px] bg-gradient-to-br from-blue-500 to-purple-500">
                    {course.faculty.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-[11px] text-gray-400 truncate">{course.faculty.name}</span>
              </div>

              {/* Tags and Duration */}
              <div className="flex items-center gap-2 flex-wrap mb-2">
                {course.level && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full text-[10px] font-medium">
                    <Tag className="w-2.5 h-2.5" />
                    {course.level}
                  </span>
                )}
                {course.department && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded-full text-[10px] font-medium">
                    <Tag className="w-2.5 h-2.5" />
                    {course.department}
                  </span>
                )}
                <span className="flex items-center gap-1 text-[11px] text-gray-500">
                  <Clock className="w-3 h-3" />
                  {course.estimatedDuration}h
                </span>
              </div>

              {/* Progress Bar */}
              {showProgress && course.progress !== undefined && course.progress > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-white font-semibold">{course.progress}%</span>
                  </div>
                  <Progress value={course.progress} className="h-1.5" />
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    );
  };

  const Column = ({ title, courses, icon: Icon }: { title: string; courses: Course[]; icon: LucideIcon }) => (
    <div className="flex-1 min-w-[320px] snap-center">
      <div className="bg-black border border-gray-800 overflow-hidden h-full flex flex-col shadow-xl">
        {/* Column Header */}
        <div className="p-5 border-b border-gray-800 bg-black">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/5">
              <Icon className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-bold text-white text-lg">{title}</h3>
            <span className="ml-auto bg-white/10 text-white text-sm font-semibold px-3 py-1 rounded-full">
              {courses.length}
            </span>
          </div>
        </div>

        {/* Cards Container */}
        <ScrollArea className="flex-1 max-h-[650px]">
          <div className="p-4 space-y-4">
            {courses.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-sm">
                <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-8 h-8 text-gray-600" />
                </div>
                <p>No courses yet</p>
              </div>
            ) : (
              courses.map((course) => <CourseCard key={course._id} course={course} showProgress={title !== "Enrolled"} />)
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-white mb-2">My Learning Journey</h2>
        <p className="text-gray-400">Track your course progress and achievements</p>
      </div>
      <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth">
        <Column title="Enrolled" courses={enrolledCourses} icon={BookOpen} />
        <Column title="In Progress" courses={inProgressCourses} icon={PlayCircle} />
        <Column title="Completed" courses={completedCourses} icon={CheckCircle2} />
      </div>
    </div>
  );
}
