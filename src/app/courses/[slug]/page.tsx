'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Users, Clock, Play, BookOpen, CheckCircle, X, Calendar, Globe, Subtitles, MinusIcon, PlusIcon } from 'lucide-react';
import Image from 'next/image';
import { getCourseBySlug, getRelatedCourses } from '@/sanity/lib/queries';
import { enrollUserInCourseBySanityId, checkUserEnrollmentBySanityId, syncCourseToSupabase, getCourseEnrollmentCount, getMultipleCourseEnrollmentCounts } from '@/lib/course-management';
import { supabase } from '@/lib/supabase';
import { urlFor } from '@/sanity/lib/image';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import CourseCard from '@/components/ui/course-card';
import YouTubeVideoModal from '@/components/ui/youtube-video-modal';


interface CourseData {
  _id: string;
  title: string;
  description: string;
  slug: {
    current: string;
  };
  thumbnail: {
    asset: {
      _id: string;
      url: string;
    };
    alt?: string;
  };
  previewVideo?: string;
  faculty: {
    name: string;
    email: string;
    profileImage?: {
      asset: {
        _id: string;
        url: string;
      };
    };
    profession: string;
    about: string;
    skilledAt?: string[];
  };
  degree: string;
  department: string;
  language: string;
  level: string;
  price: number;
  updatedAt?: string;
  subtitles?: boolean;
  whatYouLearn: string[];
  requirements: string[];
  courseIncludes: string[];
  sections: Array<{
    _id: string;
    title: string;
    description: string;
    order: number;
    estimatedDuration?: number;
    lectures?: Array<{
      _id: string;
      title: string;
      slug: { current: string };
      videoUrl?: string;
      duration: number;
      description: string;
      order: number;
      isPreview: boolean;
    }>;
    quiz?: {
      _id: string;
      title: string;
      description: string;
      timeLimit: number;
      passingScore: number;
      questions: Array<{
        question: string;
        options: string[];
        correctAnswer: number;
      }>;
    };
    assignments?: Array<{
      _id: string;
      title: string;
      description: string;
      dueDate: string;
      totalPoints: number;
    }>;
    modules?: Array<{
      _id: string;
      title: string;
      description: string;
      moduleType: string;
      estimatedReadTime: number;
    }>;
  }>;
  tags: string[];
  estimatedDuration: number;
  rating: number;
  totalEnrollments: number;
  difficultyLevel: number;
  publishedAt: string;
  isPublished?: boolean;
}

export default function CoursePage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [course, setCourse] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFacultyModal, setShowFacultyModal] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [enrollmentCount, setEnrollmentCount] = useState<number>(0);
  const [relatedCourses, setRelatedCourses] = useState<CourseData[]>([]);
  const [relatedCoursesEnrollmentCounts, setRelatedCoursesEnrollmentCounts] = useState<Record<string, number>>({});
  const [showVideoModal, setShowVideoModal] = useState(false);

  useEffect(() => {
    // Get current user
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    async function fetchCourse() {
      try {
        setLoading(true);
        const courseData = await getCourseBySlug(slug);
        
        if (!courseData) {
          setError('Course not found');
          return;
        }
        
        setCourse(courseData);

        // Fetch real enrollment count from Supabase
        const realEnrollmentCount = await getCourseEnrollmentCount(courseData._id);
        setEnrollmentCount(realEnrollmentCount);

        // Fetch related courses from same degree and department
        const relatedCoursesData = await getRelatedCourses(
          courseData.degree, 
          courseData.department, 
          courseData._id, 
          6
        );
        setRelatedCourses(relatedCoursesData);

        // Fetch enrollment counts for related courses
        if (relatedCoursesData.length > 0) {
          const relatedCourseIds = relatedCoursesData.map((course: CourseData) => course._id);
          const enrollmentCounts = await getMultipleCourseEnrollmentCounts(relatedCourseIds);
          setRelatedCoursesEnrollmentCounts(enrollmentCounts);
        }

        // Check if user is enrolled
        if (user) {
          try {
            const enrollment = await checkUserEnrollmentBySanityId(user.id, courseData._id);
            setIsEnrolled(!!enrollment);
          } catch {
            console.log('Not enrolled yet');
          }
        }
      } catch (err) {
        console.error('Error fetching course:', err);
        setError('Failed to load course. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      fetchCourse();
    }
  }, [slug, user]);

  const handleEnrollment = async () => {
    if (!user) {
      // Redirect to login
      window.location.href = '/auth';
      return;
    }

    if (!course) return;

    try {
      setEnrolling(true);
      
      console.log('🎯 Starting enrollment process for course:', course.title);
      
      // First sync the course to Supabase if it doesn't exist
      try {
        console.log('🔄 Syncing course to Supabase...');
        await syncCourseToSupabase({
          _id: course._id,
          title: course.title,
          slug: course.slug,
          description: course.description,
          thumbnail: course.thumbnail,
          faculty: course.faculty,
          rating: course.rating || 4.5,
          totalEnrollments: course.totalEnrollments || 0,
          estimatedDuration: course.estimatedDuration || 0,
          level: course.level,
          price: course.price || 0,
          tags: course.tags || [],
          degree: course.degree,
          department: course.department,
          language: course.language || 'English',
          isPublished: true,
          isFeatured: false,
          publishedAt: course.publishedAt
        });
        console.log('✅ Course sync completed');
      } catch (syncError) {
        console.log('⚠️ Course sync failed or already exists:', syncError);
        // Continue with enrollment even if sync fails (course might already exist)
      }
      
      // Then enroll the user
      console.log('📝 Enrolling user...');
      await enrollUserInCourseBySanityId(user.id, course._id);
      setIsEnrolled(true);
      
      // Update enrollment count
      const updatedCount = await getCourseEnrollmentCount(course._id);
      setEnrollmentCount(updatedCount);
      
      console.log('🎉 Enrollment successful!');
      toast.success('Successfully enrolled in the course!', {
        style: {
          backgroundColor: 'white',
          color: 'black',
        },
        position: 'bottom-right',
      });
      
      // Redirect to learn page after successful enrollment
      setTimeout(() => {
        window.location.href = `/courses/learn/${course._id}`;
      }, 1500);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown enrollment error';
      console.error('❌ Enrollment failed:', errorMessage);
      console.error('❌ Full error object:', err);
      
      if (errorMessage.includes('already enrolled')) {
        setIsEnrolled(true);
        alert('You are already enrolled in this course!');
      } else if (errorMessage.includes('not found in database')) {
        alert('Course setup issue. Please try again or contact support.');
      } else {
        alert(`Enrollment failed: ${errorMessage}`);
      }
    } finally {
      setEnrolling(false);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Star key="half" className="w-5 h-5 fill-yellow-400/50 text-yellow-400" />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} className="w-5 h-5 text-gray-400" />
      );
    }

    return stars;
  };

  // Calculate course statistics
  const calculateCourseStats = () => {
    if (!course?.sections) return { totalSections: 0, totalLectures: 0, totalMinutes: 0 };
    
    let totalLectures = 0;
    let totalMinutes = 0;
    
    course.sections.forEach(section => {
      // Count lectures
      if (section.lectures) {
        totalLectures += section.lectures.length;
        totalMinutes += section.lectures.reduce((sum, lecture) => sum + (lecture.duration || 0), 0);
      }
      
      // Add reading time from modules
      if (section.modules) {
        totalMinutes += section.modules.reduce((sum, module) => sum + (module.estimatedReadTime || 0), 0);
      }
    });
    
    return {
      totalSections: course.sections.length,
      totalLectures,
      totalMinutes
    };
  };

  const { totalSections, totalLectures, totalMinutes } = calculateCourseStats();

  if (loading) {
    return (
      <DashboardLayout title="">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Spinner />
            <p className="text-gray-400 mt-4">Loading course details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !course) {
    return (
      <DashboardLayout title="Course Not Found">
        <div className="bg-red-900/20 border border-red-700 rounded-xl p-6 text-center">
          <h3 className="text-lg font-semibold text-red-400 mb-2">Course Not Found</h3>
          <p className="text-red-300">{error || 'The requested course could not be found.'}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={course.title}>
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="flex flex-col lg:flex-row gap-8 h-screen lg:h-auto">
          {/* Mobile: Right Column First, Desktop: Right Column Second */}
          <div className="order-1 lg:order-2 lg:w-1/3 lg:sticky lg:top-4 lg:h-fit">
            {/* Course Preview Card */}
            <div className="bg-black border border-gray-700 rounded-sm overflow-hidden">
              {/* Video Preview */}
              <div className="relative aspect-video">
                <Image
                  src={urlFor(course.thumbnail).width(400).height(225).url()}
                  alt={course.title}
                  fill
                  className="object-cover"
                />
                {course.previewVideo && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Button
                      variant="ghost"
                      size="lg"
                      className="bg-white/20 backdrop-blur-sm hover:bg-white/30"
                      onClick={() => setShowVideoModal(true)}
                    >
                      <Play className="w-8 h-8 text-white fill-white mr-2" />
                      Preview
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="p-4 sm:p-6 space-y-4">
                {/* Price Section */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    {/* Price */}
                    <div>
                      {course.price === 0 ? (
                        <div>
                          <div className="text-2xl sm:text-3xl font-bold text-white">₹0</div>
                          <div className="text-sm text-gray-400">Free</div>
                        </div>
                      ) : (
                        <div className="text-2xl sm:text-3xl font-bold text-white">
                          ₹{course.price.toLocaleString()}
                        </div>
                      )}
                    </div>

                    {/* Includes Text */}
                    <div className="text-lg sm:text-sm text-white text-right">
                      <div className="font-bold">Includes:</div>
                      <div className="text-xs text-white mt-1">
                        <div>Modules</div>
                        <div>Assignments</div>
                        <div>Quizzes</div>
                      </div>
                    </div>
                  </div>

                  {/* Enrollment Button - Full Width */}
                  <Button
                    onClick={handleEnrollment}
                    disabled={enrolling || isEnrolled}
                    className={`w-full py-3 text-base font-semibold ${
                      isEnrolled
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                    }`}
                  >
                    {enrolling ? (
                      <>
                        <Spinner className="w-5 h-5 mr-2" />
                        Enrolling...
                      </>
                    ) : isEnrolled ? (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Enrolled
                      </>
                    ) : (
                      <>
                        <BookOpen className="w-5 h-5 mr-2" />
                        Enroll Now
                      </>
                    )}
                  </Button>
                </div>

                {/* Topics Covered */}
                <div className="space-y-3 pt-4 border-t border-gray-700">
                  <h4 className="font-semibold text-white text-sm sm:text-base">Topics covered</h4>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {course.tags?.map((tag, index) => (
                      <Badge key={index} variant="outline" className="bg-white border text-black text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Course Includes */}
                <div className="space-y-3 pt-4 border-t border-gray-700">
                  <h4 className="font-semibold text-white text-sm sm:text-base">This course includes:</h4>
                  <ul className="space-y-2">
                    {course.courseIncludes?.map((item, index) => (
                      <li key={index} className="flex items-start space-x-2 text-sm text-gray-300">
                        <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-xs sm:text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile: Left Column Second, Desktop: Left Column First */}
          <div className="order-2 lg:order-1 lg:w-2/3 lg:overflow-y-auto lg:max-h-screen lg:pr-4 scrollbar-hide">
            <div className="space-y-6">
              {/* Course Header */}
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-white border-gray-600 text-black">
                    {course.degree?.toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className="bg-white border-gray-600 text-black">
                    {course.department?.toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className="bg-white border-gray-600 text-black">
                    {course.level?.charAt(0).toUpperCase() + course.level?.slice(1)}
                  </Badge>
                </div>
                
                {/* Description Section */}
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-white">Description</h3>
                  <p className="text-gray-300 text-base leading-relaxed">
                    {course.description}
                  </p>
                </div>

                {/* Course Stats */}
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      {renderStars(course.rating || 4.5)}
                    </div>
                    <span className="text-white font-medium">{course.rating || 4.5}</span>
                    <span className="text-gray-400">ratings</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-gray-400">
                    <Users className="w-5 h-5" />
                    <span>{enrollmentCount.toLocaleString()} students</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-gray-400">
                    <Clock className="w-5 h-5" />
                    <span>{course.estimatedDuration || 0} hours</span>
                  </div>
                </div>

                {/* Faculty Info */}
                <div className="space-y-2">
                  <span className="text-gray-400">Created by </span>
                  <button
                    onClick={() => setShowFacultyModal(true)}
                    className="text-blue-400 hover:text-blue-300 transition-colors underline font-medium"
                  >
                    {course.faculty.name}
                  </button>
                </div>

                {/* Course Details */}
                <div className="space-y-3 pt-4">
                  {/* Last Updated */}
                  {course.updatedAt && (
                    <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-400">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span>Last updated {new Date(course.updatedAt).toLocaleDateString()}</span>
                    </div>
                  )}

                  {/* Language */}
                  <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-400">
                    <Globe className="w-4 h-4 flex-shrink-0" />
                    <span>{course.language || 'English'}</span>
                  </div>

                  {/* Subtitles */}
                  <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-400">
                    <Subtitles className="w-4 h-4 flex-shrink-0" />
                    <span>Subtitles: {course.subtitles ? 'English' : 'Not available'}</span>
                  </div>
                </div>

                {/* What You'll Learn */}
                <div className="space-y-4 pt-6">
                  <h3 className="text-xl font-semibold text-white">What you&apos;ll learn</h3>
                  <ul className="space-y-3">
                    {course.whatYouLearn?.map((item, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0 mt-2" />
                        <span className="text-gray-300 text-sm sm:text-base">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Course Content Section */}
                <div className="space-y-6 pt-6">
                  <h3 className="text-2xl font-semibold text-white">Course content</h3>
                  
                  {/* Course Stats and Controls */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="text-sm text-gray-400">
                      {totalSections} sections • {totalLectures} lectures • {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m total length
                    </div>
                  </div>

                  {/* Multi-level Accordion */}
                  {course.sections && course.sections.length > 0 && (
                    <div className="w-full max-w-5xl mx-auto">
                      <Accordion
                        className="-space-y-1 w-full"
                        type="multiple"
                        value={expandedSections}
                        onValueChange={setExpandedSections}
                      >
                        {course.sections.map((section, sectionIndex) => {
                          // Calculate section statistics
                          const lecturesCount = section.lectures?.length || 0;
                          const modulesCount = section.modules?.length || 0;
                          const assignmentsCount = section.assignments?.length || 0;
                          const hasQuiz = section.quiz ? 1 : 0;
                          
                          const totalItems = lecturesCount + modulesCount + assignmentsCount + hasQuiz;
                          
                          // Calculate duration from lectures and modules
                          const lectureMinutes = section.lectures?.reduce((sum, lecture) => sum + (lecture.duration || 0), 0) || 0;
                          const moduleMinutes = section.modules?.reduce((sum, module) => sum + (module.estimatedReadTime || 0), 0) || 0;
                          const sectionMinutes = lectureMinutes + moduleMinutes;
                          
                          return (
                            <AccordionItem
                              className="overflow-hidden border bg-gray-800 "
                              key={`section-${sectionIndex}-${section._id}`}
                              value={`section-${sectionIndex}`}
                            >
                              <AccordionTrigger className="group px-4 py-3 hover:no-underline [&>svg]:hidden">
                                <div className="flex w-full items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="relative size-4 shrink-0">
                                      <PlusIcon className="absolute inset-0 size-4 text-gray-400 transition-opacity duration-200 group-data-[state=open]:opacity-0" />
                                      <MinusIcon className="absolute inset-0 size-4 text-gray-400 opacity-0 transition-opacity duration-200 group-data-[state=open]:opacity-100" />
                                    </div>
                                    <span className="text-left text-white font-medium">
                                      Section {sectionIndex + 1}: {section.title}
                                    </span>
                                  </div>
                                  <div className="text-sm text-white">
                                    {totalItems} items • {sectionMinutes}min
                                  </div>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="p-0">
                                {/* Lectures */}
                                {section.lectures && section.lectures.map((lecture, lectureIndex) => (
                                  <div
                                    className="border-t border-gray-700 bg-gray-750 px-4 py-3 flex items-center justify-between"
                                    key={lecture._id}
                                  >
                                    <div className="flex items-center gap-3">
                                      <span className="text-sm text-white">
                                        {lectureIndex + 1}. {lecture.title}
                                      </span>
                                      {lecture.isPreview && (
                                        <Badge variant="outline" className="text-xs border-blue-400 text-blue-400">
                                          Preview
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="text-xs text-white">
                                      {lecture.duration}min
                                    </div>
                                  </div>
                                ))}

                                {/* Modules */}
                                {section.modules && section.modules.map((module, moduleIndex) => (
                                  <div
                                    className="border-t border-gray-700 bg-gray-750 px-4 py-3 flex items-center justify-between"
                                    key={module._id}
                                  >
                                    <div className="flex items-center gap-3">
                                      <span className="text-sm text-white">
                                        {moduleIndex + 1}. {module.title}
                                      </span>
                                      <Badge variant="outline" className="text-xs border-green-400 text-green-400">
                                        {module.moduleType}
                                      </Badge>
                                    </div>
                                    <div className="text-xs text-white">
                                      {module.estimatedReadTime}min read
                                    </div>
                                  </div>
                                ))}

                                {/* Assignments */}
                                {section.assignments && section.assignments.map((assignment, assignmentIndex) => (
                                  <div
                                    className="border-t border-gray-700 bg-gray-750 px-4 py-3 flex items-center justify-between"
                                    key={assignment._id}
                                  >
                                    <div className="flex items-center gap-3">
                                      <span className="text-sm text-white">
                                        {assignmentIndex + 1}. {assignment.title}
                                      </span>
                                      <Badge variant="outline" className="text-xs border-orange-400 text-orange-400">
                                        Assignment
                                      </Badge>
                                    </div>
                                    <div className="text-xs text-white">
                                      {assignment.totalPoints} pts
                                    </div>
                                  </div>
                                ))}

                                {/* Quiz */}
                                {section.quiz && (
                                  <div className="border-t border-gray-700 bg-gray-750 px-4 py-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <span className="text-sm text-white">
                                        {section.quiz.title}
                                      </span>
                                      <Badge variant="outline" className="text-xs border text-black bg-white">
                                        Quiz
                                      </Badge>
                                    </div>
                                    <div className="text-xs text-white">
                                      {section.quiz.questions.length} questions • {section.quiz.timeLimit}min
                                    </div>
                                  </div>
                                )}
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                      </Accordion>
                    </div>
                  )}
                </div>

                {/* Requirements Section */}
                <div className="space-y-4 pt-6">
                  <h3 className="text-xl font-semibold text-white">Requirements</h3>
                  <ul className="space-y-3">
                    {course.requirements?.map((requirement, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-red-400 rounded-full flex-shrink-0 mt-2" />
                        <span className="text-gray-300 text-sm sm:text-base">{requirement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Courses Section - Mobile: Below Requirements, Desktop: Sidebar with scroll */}
      {relatedCourses.length > 0 && (
        <>
          {/* Mobile View - Below Requirements */}
          <div className="md:hidden max-w-7xl mx-auto mt-8 px-4 sm:px-6 lg:px-8">
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white">
                  More courses from {course.degree} {course.department}
                </h2>
                <p className="mt-3 text-base text-gray-400">
                  Explore other courses in the same field
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {relatedCourses.map((relatedCourse) => (
                  <CourseCard
                    key={relatedCourse._id}
                    _id={relatedCourse._id}
                    title={relatedCourse.title}
                    description={relatedCourse.description}
                    slug={relatedCourse.slug}
                    thumbnail={{
                      asset: {
                        _ref: relatedCourse.thumbnail?.asset?._id || '',
                      },
                      alt: relatedCourse.thumbnail?.alt
                    }}
                    faculty={{
                      name: relatedCourse.faculty.name,
                      profileImage: relatedCourse.faculty.profileImage ? {
                        asset: {
                          _ref: relatedCourse.faculty.profileImage.asset._id
                        }
                      } : undefined
                    }}
                    rating={relatedCourse.rating}
                    totalEnrollments={relatedCourse.totalEnrollments}
                    estimatedDuration={relatedCourse.estimatedDuration}
                    level={relatedCourse.level}
                    price={relatedCourse.price}
                    tags={relatedCourse.tags}
                    isPublished={relatedCourse.isPublished ?? true}
                    enrollmentCountOverride={relatedCoursesEnrollmentCounts[relatedCourse._id]}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Desktop View - Stays in sidebar (unchanged) */}
          <div className="hidden md:block max-w-7xl mx-auto mt-16 px-4 sm:px-6 lg:px-8">
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-white">
                  More courses from {course.degree} {course.department}
                </h2>
                <p className="mt-4 text-lg text-gray-400">
                  Explore other courses in the same field to expand your knowledge
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedCourses.map((relatedCourse) => (
                  <CourseCard
                    key={relatedCourse._id}
                    _id={relatedCourse._id}
                    title={relatedCourse.title}
                    description={relatedCourse.description}
                    slug={relatedCourse.slug}
                    thumbnail={{
                      asset: {
                        _ref: relatedCourse.thumbnail?.asset?._id || '',
                      },
                      alt: relatedCourse.thumbnail?.alt
                    }}
                    faculty={{
                      name: relatedCourse.faculty.name,
                      profileImage: relatedCourse.faculty.profileImage ? {
                        asset: {
                          _ref: relatedCourse.faculty.profileImage.asset._id
                        }
                      } : undefined
                    }}
                    rating={relatedCourse.rating}
                    totalEnrollments={relatedCourse.totalEnrollments}
                    estimatedDuration={relatedCourse.estimatedDuration}
                    level={relatedCourse.level}
                    price={relatedCourse.price}
                    tags={relatedCourse.tags}
                    isPublished={relatedCourse.isPublished ?? true}
                    enrollmentCountOverride={relatedCoursesEnrollmentCounts[relatedCourse._id]}
                  />
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Faculty Modal */}
      {showFacultyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowFacultyModal(false)}
          />
          
          {/* Modal Content */}
          <div className="relative bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setShowFacultyModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Modal Content */}
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Profile Image */}
              <div className="flex-shrink-0 self-center sm:self-start">
                <div className="w-24 h-24 relative rounded-full overflow-hidden border-2 border-gray-600">
                  {course.faculty.profileImage ? (
                    <Image
                      src={urlFor(course.faculty.profileImage).width(96).height(96).url()}
                      alt={course.faculty.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                      {course.faculty.name.charAt(0)}
                    </div>
                  )}
                </div>
              </div>

              {/* Faculty Details */}
              <div className="flex-1 space-y-4">
                {/* Name and Profession */}
                <div className="text-center sm:text-left">
                  <h3 className="text-xl font-bold text-white">{course.faculty.name}</h3>
                  <p className="text-gray-400 text-sm">{course.faculty.profession}</p>
                </div>

                {/* About Section */}
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">About</h4>
                  <p className="text-gray-300 text-sm leading-relaxed">{course.faculty.about}</p>
                </div>

                {/* Skilled At Section */}
                {course.faculty.skilledAt && course.faculty.skilledAt.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-2">Skilled At</h4>
                    <div className="flex flex-wrap gap-2">
                      {course.faculty.skilledAt.map((skill, index) => (
                        <Badge key={index} variant="outline" className="border-gray-600 text-gray-300 text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* YouTube Video Modal */}
      {course?.previewVideo && (
        <YouTubeVideoModal
          isOpen={showVideoModal}
          onClose={() => setShowVideoModal(false)}
          videoUrl={course.previewVideo}
          title={`${course.title} - Preview`}
        />
      )}
    </DashboardLayout>
  );
}