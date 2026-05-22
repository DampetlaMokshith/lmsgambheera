'use client';

import { useEffect, useState } from 'react';
import FacultyLayout from '@/components/layout/faculty-layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart3, Trophy, CheckCircle, XCircle, MoreVertical } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getCourseById } from '@/sanity/lib/queries';
import { urlFor } from '@/sanity/lib/image';
import { useFacultyAuth } from '@/hooks/useFacultyAuth';
import StudentActivityDialog from '@/components/faculty/student-activity-dialog';
import StudentQuizStatsDialog from '@/components/faculty/student-quiz-stats-dialog';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Course {
  id: string;
  sanityId: string;
  title: string;
  thumbnail: string;
  slug: string;
}

interface StudentData {
  id: string;
  name: string;
  email: string;
  avatar: string;
  progressPercentage: number;
  certificateIssued: boolean;
  enrolledAt: string;
  profile: {
    fullName: string;
    gender: string;
    guardianEmail: string;
    dateOfBirth: string;
    registrationNumber: string;
    college: string;
    batch: string;
    degree: string;
    department: string;
  };
}

interface CourseWithStudents {
  course: Course;
  students: StudentData[];
}

export default function ProgressAndGradesPage() {
  const { user, loading: authLoading } = useFacultyAuth();
  const [coursesWithStudents, setCoursesWithStudents] = useState<CourseWithStudents[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataFetched, setDataFetched] = useState(false); // Track if data was fetched
  
  // Dialog states
  const [activityDialog, setActivityDialog] = useState<{
    open: boolean;
    studentId: string;
    studentName: string;
    courseId: string;
  }>({ open: false, studentId: '', studentName: '', courseId: '' });
  
  const [quizDialog, setQuizDialog] = useState<{
    open: boolean;
    studentId: string;
    studentName: string;
    courseId: string;
  }>({ open: false, studentId: '', studentName: '', courseId: '' });

  useEffect(() => {
    if (!authLoading && user?.email && !dataFetched) {
      fetchCoursesAndStudents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, dataFetched]);

  const fetchCoursesAndStudents = async () => {
    try {
      setLoading(true);

      // Step 1: Fetch faculty's courses from Supabase
      const { data: facultyCourses, error: coursesError } = await supabase
        .from('courses')
        .select('id, sanity_id, slug')
        .eq('faculty_email', user?.email)
        .eq('is_published', true);

      if (coursesError) {
        throw coursesError;
      }
      if (!facultyCourses || facultyCourses.length === 0) {
        setCoursesWithStudents([]);
        setLoading(false);
        setDataFetched(true);
        return;
      }

      // Step 2: Fetch course details from Sanity and enrolled students
      const coursesData = await Promise.all(
        facultyCourses.map(async (course) => {
          try {
            // Fetch Sanity course data
            const sanityData = await getCourseById(course.sanity_id);
            if (!sanityData) return null;

            const thumbnailUrl = sanityData.thumbnail
              ? urlFor(sanityData.thumbnail).width(400).height(300).url()
              : '/placeholder-course.png';

            // Fetch enrolled students with user data from course_enrollments
            const { data: enrollments, error: enrollmentError } = await supabase
              .from('course_enrollments')
              .select('user_id, user_name, user_email, certificate_issued, enrolled_at')
              .eq('course_id', course.id)
              .order('enrolled_at', { ascending: false });

            if (enrollmentError) {
              // Error handled silently
            }

            if (!enrollments || enrollments.length === 0) {
              return {
                course: {
                  id: course.id,
                  sanityId: course.sanity_id,
                  title: sanityData.title,
                  thumbnail: thumbnailUrl,
                  slug: course.slug,
                },
                students: [],
              };
            }

            // Collect all user IDs for batch profile fetch via API
            const userIds = enrollments.map(e => e.user_id).filter(Boolean);

            // Fetch profiles from API endpoint (bypasses RLS)
            let profilesMap: Record<string, {
              fullName: string;
              gender: string;
              guardianEmail: string;
              dateOfBirth: string;
              registrationNumber: string;
              college: string;
              batch: string;
              degree: string;
              department: string;
            }> = {};

            try {
              const profilesResponse = await fetch(
                `/api/faculty/student-profiles?userIds=${userIds.join(',')}`
              );
              
              if (profilesResponse.ok) {
                const profilesData = await profilesResponse.json();
                if (profilesData.success && profilesData.profiles) {
                  profilesMap = profilesData.profiles;
                }
              }
            } catch {
              // Error handled silently
            }

            // Build student data using the profiles map
            const studentsData = await Promise.all(
              enrollments.map(async (enrollment) => {
                try {
                  // Get profile from the map (already fetched via API)
                  const profile = profilesMap[enrollment.user_id];

                  // Fetch progress using API endpoint
                  let progressPercentage = 0;
                  try {
                    const progressResponse = await fetch(
                      `/api/progress/${course.sanity_id}?userId=${enrollment.user_id}`
                    );
                    
                    if (progressResponse.ok) {
                      const progressData = await progressResponse.json();
                      progressPercentage = progressData?.progress_percentage || 0;
                    }
                  } catch {
                    // Progress fetch failed silently
                  }

                  const userName = enrollment.user_name || profile?.fullName || enrollment.user_email?.split('@')[0] || 'Student';
                  const userEmail = enrollment.user_email || 'N/A';

                  // Build profile object with actual values or N/A
                  const profileData = profile || {
                    fullName: userName,
                    gender: 'N/A',
                    guardianEmail: 'N/A',
                    dateOfBirth: 'N/A',
                    registrationNumber: 'N/A',
                    college: 'N/A',
                    batch: 'N/A',
                    degree: 'N/A',
                    department: 'N/A',
                  };

                  return {
                    id: enrollment.user_id,
                    name: userName,
                    email: userEmail,
                    avatar: profile?.gender === 'female' ? 'bitmoji_girl.png' : 'bitmoji_boy.png',
                    progressPercentage,
                    certificateIssued: progressPercentage === 100,
                    enrolledAt: enrollment.enrolled_at,
                    profile: profileData,
                  };
                } catch {
                  return null;
                }
              })
            );

            const validStudents = studentsData.filter((s): s is StudentData => s !== null);

            return {
              course: {
                id: course.id,
                sanityId: course.sanity_id,
                title: sanityData.title,
                thumbnail: thumbnailUrl,
                slug: course.slug,
              },
              students: validStudents,
            };
          } catch {
            return null;
          }
        })
      );

      const validCourses = coursesData.filter((c): c is CourseWithStudents => c !== null);
      setCoursesWithStudents(validCourses);
      setDataFetched(true);
    } catch {
      setCoursesWithStudents([]);
      setDataFetched(true);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenActivityDialog = (studentId: string, studentName: string, courseId: string) => {
    setActivityDialog({ open: true, studentId, studentName, courseId });
  };

  const handleOpenQuizDialog = (studentId: string, studentName: string, courseId: string) => {
    setQuizDialog({ open: true, studentId, studentName, courseId });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (authLoading || loading) {
    return (
      <FacultyLayout title="Progress & Grades">
        <div className="space-y-6">
          <div>
            <div className="h-4 w-64 bg-accent animate-pulse mb-2"></div>
            <div className="h-3 w-40 bg-accent animate-pulse"></div>
          </div>
          <div className="bg-black border">
            <div className="p-4 md:p-6 border-b border-gray-800">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 md:w-24 md:h-24 bg-accent animate-pulse flex-shrink-0" />
                <div className="flex-1">
                  <div className="h-5 w-48 bg-accent animate-pulse mb-2" />
                  <div className="h-3 w-32 bg-accent animate-pulse" />
                </div>
              </div>
            </div>
            <div className="p-4 md:p-6">
              <div className="overflow-x-auto">
                <div className="min-w-[900px]">
                  <div className="grid grid-cols-6 gap-4 border-b pb-3 mb-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-4 w-20 bg-accent animate-pulse" />
                    ))}
                  </div>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div className="grid grid-cols-6 items-center gap-4 py-4 border-b border-accent" key={i}>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-accent animate-pulse flex-shrink-0" />
                        <div className="h-4 w-24 bg-accent animate-pulse" />
                      </div>
                      <div className="h-4 w-32 bg-accent animate-pulse" />
                      <div className="h-9 w-28 bg-accent animate-pulse" />
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-32 bg-accent animate-pulse" />
                        <div className="h-4 w-12 bg-accent animate-pulse" />
                      </div>
                      <div className="h-9 w-24 bg-accent animate-pulse" />
                      <div className="h-9 w-24 bg-accent animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </FacultyLayout>
    );
  }

  if (!user) {
    return (
      <FacultyLayout title="Progress & Grades">
        <div className="text-center py-16">
          <p className="text-gray-400">Please log in to view progress and grades.</p>
        </div>
      </FacultyLayout>
    );
  }

  return (
    <FacultyLayout title="Progress & Grades">
      <div className="space-y-6 md:space-y-8">
        {/* Header */}
        <div>
          <p className="text-gray-400 text-sm md:text-base">
            Track your students&apos; progress and performance across all your courses
          </p>
          {coursesWithStudents.length > 0 && (
            <p className="text-xs md:text-sm text-gray-500 mt-1">
              {coursesWithStudents.length} course{coursesWithStudents.length !== 1 ? 's' : ''} •{' '}
              {coursesWithStudents.reduce((sum, c) => sum + c.students.length, 0)} total students
            </p>
          )}
        </div>

        {/* Course Tables */}
        {coursesWithStudents.length === 0 ? (
          <div className="text-center py-16 bg-black border">
            <BarChart3 className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-2">No student enrollments yet</p>
            <p className="text-gray-500 text-sm">
              Students enrolled in your courses will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {coursesWithStudents.map((courseData) => (
              <div key={courseData.course.id} className="bg-black border">
                {/* Course Header */}
                <div className="p-4 md:p-6 border-b border-gray-800">
                  <div className="flex items-center gap-4">
                    <div className="relative w-20 h-20 md:w-24 md:h-24 overflow-hidden flex-shrink-0 border border-gray-800">
                      <Image
                        src={courseData.course.thumbnail}
                        alt={courseData.course.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 80px, 96px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg md:text-xl font-semibold text-white truncate">
                        {courseData.course.title}
                      </h2>
                      <p className="text-gray-400 text-sm mt-1">
                        {courseData.students.length} student{courseData.students.length !== 1 ? 's' : ''} enrolled
                      </p>
                    </div>
                  </div>
                </div>

                {/* Students Table */}
                {courseData.students.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-400">No students enrolled in this course yet</p>
                  </div>
                ) : (
                  <>
                    {/* Mobile scroll indicator */}
                    <div className="block md:hidden px-4 pt-4 pb-2">
                      <p className="text-xs text-gray-400 text-center">
                        ← Scroll horizontally to view all columns →
                      </p>
                    </div>

                    <div className="w-full overflow-x-auto pb-4 table-scroll">
                      <Table className="min-w-[900px]">
                        <TableHeader>
                          <TableRow className="border-gray-800 hover:bg-white/5">
                            <TableHead className="text-gray-300 font-semibold">Student</TableHead>
                            <TableHead className="text-gray-300 font-semibold">Email</TableHead>
                            <TableHead className="text-gray-300 font-semibold">Progress</TableHead>
                            <TableHead className="text-gray-300 font-semibold">Completion</TableHead>
                            <TableHead className="text-gray-300 font-semibold">Certificate</TableHead>
                            <TableHead className="text-gray-300 font-semibold">Quiz Stats</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {courseData.students.map((student) => (
                            <TableRow
                              key={student.id}
                              className="border-gray-800 hover:bg-white/5"
                            >
                              <TableCell className="min-w-[200px]">
                                <div className="flex items-center gap-3">
                                 
                                  <span className="font-medium text-white">{student.name}</span>
                                  
                                  {/* 3-dot menu with student profile tooltip */}
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-8 w-8 p-0 hover:bg-gray-800"
                                      >
                                        <MoreVertical className="h-4 w-4 text-gray-400" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent 
                                      className="w-72 bg-black border-gray-800 p-4"
                                      align="start"
                                    >
                                      <div className="space-y-3">
                                        <div className="flex items-center gap-3 pb-3 border-b border-gray-800">
                                          
                                          <div>
                                            <h4 className="font-semibold text-white">{student.name}</h4>
                                            <p className="text-xs text-gray-400">{student.email}</p>
                                          </div>
                                        </div>
                                        
                                        <div className="space-y-2 text-sm">
                                          <div>
                                            <span className="text-gray-400">Gender: </span>
                                            <span className="text-white capitalize">{student.profile.gender}</span>
                                          </div>
                                          <div>
                                            <span className="text-gray-400">Registration: </span>
                                            <span className="text-white">{student.profile.registrationNumber}</span>
                                          </div>
                                          <div>
                                            <span className="text-gray-400">College: </span>
                                            <span className="text-white">{student.profile.college}</span>
                                          </div>
                                          <div>
                                            <span className="text-gray-400">Department: </span>
                                            <span className="text-white">{student.profile.department}</span>
                                          </div>
                                          <div>
                                            <span className="text-gray-400">Batch: </span>
                                            <span className="text-white">{student.profile.batch}</span>
                                          </div>
                                          <div>
                                            <span className="text-gray-400">Degree: </span>
                                            <span className="text-white">{student.profile.degree}</span>
                                          </div>
                                          <div>
                                            <span className="text-gray-400">DOB: </span>
                                            <span className="text-white">{student.profile.dateOfBirth}</span>
                                          </div>
                                          <div>
                                            <span className="text-gray-400">Guardian: </span>
                                            <span className="text-white text-xs">{student.profile.guardianEmail}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </TableCell>
                              <TableCell className="text-gray-400 min-w-[200px]">
                                {student.email}
                              </TableCell>
                              <TableCell className="min-w-[120px]">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenActivityDialog(student.id, student.name, courseData.course.sanityId)}
                                  className="border cursor-pointer text-blue-400 hover:bg-blue-900/20 text-xs md:text-sm"
                                >
                                  <BarChart3 className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                                  View Activity
                                </Button>
                              </TableCell>
                              <TableCell className="min-w-[180px]">
                                <div className="flex items-center gap-2 md:gap-3">
                                  <Progress
                                    value={student.progressPercentage}
                                    className="w-20 md:w-32 h-2"
                                  />
                                  <span className="text-white font-semibold text-xs md:text-sm whitespace-nowrap">
                                    {Math.round(student.progressPercentage)}%
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="min-w-[120px]">
                                {student.certificateIssued ? (
                                  <div className="flex items-center gap-2 text-green-400">
                                    <CheckCircle className="h-4 w-4" />
                                    <span className="text-sm">Issued</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 text-gray-500">
                                    <XCircle className="h-4 w-4" />
                                    <span className="text-sm">Not yet</span>
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="min-w-[120px]">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenQuizDialog(student.id, student.name, courseData.course.sanityId)}
                                  className="border cursor-pointer text-yellow-400 hover:bg-yellow-900/20 text-xs md:text-sm"
                                >
                                  <Trophy className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                                  Quiz Stats
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <StudentActivityDialog
        open={activityDialog.open}
        onOpenChange={(open) => setActivityDialog({ ...activityDialog, open })}
        studentId={activityDialog.studentId}
        studentName={activityDialog.studentName}
        courseId={activityDialog.courseId}
      />

      <StudentQuizStatsDialog
        open={quizDialog.open}
        onOpenChange={(open) => setQuizDialog({ ...quizDialog, open })}
        studentId={quizDialog.studentId}
        studentName={quizDialog.studentName}
        courseId={quizDialog.courseId}
      />
    </FacultyLayout>
  );
}
