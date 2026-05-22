'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Download, Trophy } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getCourseById } from '@/sanity/lib/queries';
import { urlFor } from '@/sanity/lib/image';
import CertificateGenerator from '@/components/certificates/certificate-generator';
import QuizBadgesDialog from '@/components/certificates/quiz-badges-dialog';
import CompareStudentsDialog from '@/components/certificates/compare-students-dialog';

interface EnrolledCourse {
  id: string;
  sanityId: string;
  title: string;
  thumbnail: string;
  progressPercentage: number;
  completedItems: number;
  totalItems: number;
  isCompleted: boolean;
  enrolledAt: string;
}

interface QuizResult {
  quizName: string;
  percentage: number;
  score: number;
  maxScore: number;
  completedAt: string;
}

interface StudentComparison {
  id: string;
  name: string;
  email: string;
  progressPercentage: number;
  badgesCount: number;
  avatar?: string;
  isCurrentUser?: boolean;
  certificateIssued: boolean;
}

export default function CertificatesPage() {
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null);
  
  // Dialog states
  const [certificateDialog, setCertificateDialog] = useState<{
    open: boolean;
    courseName: string;
    completionDate: string;
  }>({ open: false, courseName: '', completionDate: '' });
  
  const [quizBadgesDialog, setQuizBadgesDialog] = useState<{
    open: boolean;
    courseName: string;
    courseId: string;
  }>({ open: false, courseName: '', courseId: '' });
  
  const [compareDialog, setCompareDialog] = useState<{
    open: boolean;
    courseName: string;
    courseId: string;
  }>({ open: false, courseName: '', courseId: '' });

  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [comparisonStudents, setComparisonStudents] = useState<StudentComparison[]>([]);
  const [loadingQuizBadges, setLoadingQuizBadges] = useState(false);
  const [loadingComparison, setLoadingComparison] = useState(false);

  useEffect(() => {
    fetchEnrolledCourses();
  }, []);

  const fetchEnrolledCourses = async () => {
    try {
      setLoading(true);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        setLoading(false);
        return;
      }

      const authUser = session.user;

      // Set user info from auth
      setUser({
        id: authUser.id,
        name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Student',
        email: authUser.email || '',
      });

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
        setEnrolledCourses([]);
        setLoading(false);
        return;
      }

      // Enrich enrollment data with Sanity thumbnails and progress
      const coursesData = await Promise.all(
        data.enrollments.map(async (enrollment: {
          courseId: string;
          sanityId: string;
          title: string;
          enrolledAt: string;
          progressPercentage: number;
        }) => {
          try {
            // Get thumbnail from Sanity
            let thumbnail = '/placeholder-course.jpg';
            let progressData = null;

            if (enrollment.sanityId) {
              try {
                const sanityData = await getCourseById(enrollment.sanityId);
                if (sanityData?.thumbnail) {
                  thumbnail = urlFor(sanityData.thumbnail).width(400).height(225).url();
                }
              } catch {
                // Use placeholder if Sanity fails
              }

              // Fetch progress using Sanity ID
              try {
                const progressResponse = await fetch(
                  `/api/progress/${enrollment.sanityId}?userId=${authUser.id}`
                );
                
                if (progressResponse.ok) {
                  progressData = await progressResponse.json();
                }
              } catch {
                // Use API data if progress endpoint fails
              }
            }

            return {
              id: enrollment.courseId,
              sanityId: enrollment.sanityId,
              title: enrollment.title || 'Untitled Course',
              thumbnail,
              progressPercentage: progressData?.progress_percentage || enrollment.progressPercentage || 0,
              completedItems: progressData?.completed_items || 0,
              totalItems: progressData?.total_items || 0,
              isCompleted: (progressData?.progress_percentage || enrollment.progressPercentage || 0) === 100,
              enrolledAt: enrollment.enrolledAt,
            };
          } catch {
            return null;
          }
        })
      );

      const filteredCourses = coursesData.filter((c): c is EnrolledCourse => c !== null);
      setEnrolledCourses(filteredCourses);
    } catch {
      // Error fetching courses
    } finally {
      setLoading(false);
    }
  };

  const handleViewBadges = async (sanityId: string, courseName: string) => {
    setQuizBadgesDialog({ open: true, courseName, courseId: sanityId });
    setLoadingQuizBadges(true);
    setQuizResults([]); // Clear previous results

    try {
      if (!user) return;
// Fetch quiz attempts directly using Sanity ID (course_id is stored as TEXT/Sanity ID in user_quiz_attempts)
      const { data: quizAttemptsData, error: attemptsError } = await supabase
        .from('user_quiz_attempts')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', sanityId)
        .order('submitted_at', { ascending: false });

      if (attemptsError) {
setQuizResults([]);
        return;
      }
if (quizAttemptsData && quizAttemptsData.length > 0) {
        // Fetch course data from Sanity to get quiz names ONLY
const sanityData = await getCourseById(sanityId);
        
        // Extract quizzes from sections (correct structure)
        const quizzes = sanityData?.sections?.flatMap((section: { quizzes?: Array<{ _id: string; title?: string }> }) => 
          section.quizzes || []
        ) || [];
// Group attempts by quiz_id and get the best attempt for each quiz
        const quizMap = new Map<string, typeof quizAttemptsData[0]>();
        quizAttemptsData.forEach((attempt) => {
          const existing = quizMap.get(attempt.quiz_id);
          if (!existing || (attempt.percentage || 0) > (existing.percentage || 0)) {
            quizMap.set(attempt.quiz_id, attempt);
          }
        });

        const results: QuizResult[] = Array.from(quizMap.values()).map((attempt) => {
          // Try exact match first
          let quizDetails = quizzes.find((q: { _id: string; title?: string }) => q._id === attempt.quiz_id);
          
          // If not found, try matching with the first part of quiz_id (before first dash)
          if (!quizDetails) {
            const shortId = attempt.quiz_id.split('-')[0];
            quizDetails = quizzes.find((q: { _id: string; title?: string }) => q._id.includes(shortId));
          }
return {
            quizName: quizDetails?.title || `Quiz ${attempt.quiz_id.substring(0, 8)}`,
            percentage: attempt.percentage || 0,
            score: attempt.score || 0,
            maxScore: attempt.total_questions || 0,
            completedAt: attempt.submitted_at || attempt.attempted_at || new Date().toISOString(),
          };
        });
setQuizResults(results);
      } else {
setQuizResults([]);
      }
    } catch (error) {
setQuizResults([]);
    } finally {
      setLoadingQuizBadges(false);
    }
  };

  const handleCompare = async (sanityId: string, courseName: string) => {
    setCompareDialog({ open: true, courseName, courseId: sanityId });
    setLoadingComparison(true);
    setComparisonStudents([]); // Clear previous results
    
    try {
      if (!user) return;

      // Fetch all students enrolled in this course via API (uses service role to bypass RLS)
      const response = await fetch(`/api/course-students?sanityId=${sanityId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch course students');
      }

      const data = await response.json();

      if (!data.students || data.students.length === 0) {
        setComparisonStudents([]);
        return;
      }

      // Transform API data to match StudentComparison interface
      const studentsData: StudentComparison[] = data.students.map((student: {
        id: string;
        name: string;
        email: string;
        progressPercentage: number;
        badgesCount: number;
        certificateIssued: boolean;
      }) => ({
        id: student.id,
        name: student.name,
        email: student.email,
        progressPercentage: student.progressPercentage,
        badgesCount: student.badgesCount,
        avatar: undefined,
        isCurrentUser: student.id === user.id,
        certificateIssued: student.certificateIssued,
      }));

      setComparisonStudents(studentsData);
    } catch {
      setComparisonStudents([]);
    } finally {
      setLoadingComparison(false);
    }
  };

  const handleDownloadCertificate = (courseName: string, enrolledAt: string) => {
    if (!user) return;
    setCertificateDialog({
      open: true,
      courseName,
      completionDate: enrolledAt,
    });
  };

  const getInitials = (title: string) => {
    return title
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <DashboardLayout title="Certificates & Badges">
        <div className="space-y-6">
          <div className="bg-black border">
            <div className="p-4 md:p-6">
              <h2 className="text-lg md:text-xl font-semibold text-white">Enrolled Courses</h2>
              <p className="text-gray-400 text-xs md:text-sm mt-1">
                Track your progress and access certificates
              </p>
            </div>

            <div className="p-4 md:p-6">
              {/* Loading message for mobile */}
              <div className="block md:hidden text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-gray-400">Loading courses...</p>
              </div>

              {/* Table skeleton for larger screens */}
              <div className="hidden md:block overflow-x-auto">
                <div className="min-w-[800px]">
                  {/* Table Header Skeleton */}
                  <div className="grid grid-cols-5 gap-4 border-b pb-3 mb-4">
                    <div className="h-4 w-20 bg-accent rounded animate-pulse" />
                    <div className="h-4 w-20 bg-accent rounded animate-pulse" />
                    <div className="h-4 w-20 bg-accent rounded animate-pulse" />
                    <div className="h-4 w-24 bg-accent rounded animate-pulse" />
                    <div className="h-4 w-20 bg-accent rounded animate-pulse" />
                  </div>

                  {/* Table Rows Skeleton */}
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div className="grid grid-cols-5 items-center gap-4 py-4 border-b border-accent" key={i}>
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 bg-accent animate-pulse flex-shrink-0 rounded-full" />
                        <div className="flex flex-col gap-2 flex-1 min-w-0">
                          <div className="h-3 w-24 bg-accent rounded animate-pulse" />
                          <div className="h-4 w-32 bg-accent rounded animate-pulse" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-32 bg-accent rounded animate-pulse" />
                        <div className="h-4 w-12 bg-accent rounded animate-pulse" />
                      </div>
                      <div className="h-9 w-24 bg-accent rounded animate-pulse" />
                      <div className="h-9 w-32 bg-accent rounded animate-pulse" />
                      <div className="h-9 w-24 bg-accent rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Certificates & Badges">
      <div className="space-y-6">
        {/* Courses Table */}
        <div className="bg-black border">
          <div className="p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-semibold text-white">Enrolled Courses</h2>
            <p className="text-gray-400 text-xs md:text-sm mt-1">
              Track your progress and access certificates
            </p>
          </div>

          {enrolledCourses.length === 0 ? (
            <div className="text-center py-16">
              <Trophy className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-2">No enrolled courses yet</p>
              <p className="text-gray-500 text-sm">
                Start learning to earn certificates and badges
              </p>
            </div>
          ) : (
            <>
              {/* Scroll indicator for mobile */}
              <div className="block md:hidden px-4 pb-2">
                <p className="text-xs text-gray-400 text-center">
                  â† Scroll horizontally to view all columns â†’
                </p>
              </div>
              
              
              <div className="w-full overflow-x-auto pb-4 table-scroll">
                

              <Table className="min-w-[1100px]">
                <TableHeader>
                  <TableRow className="border-accent hover:bg-white/5">
                    <TableHead className="text-gray-300 font-semibold">Course</TableHead>
                    <TableHead className="text-gray-300 font-semibold">Progress</TableHead>
                    <TableHead className="text-gray-300 font-semibold">Quizzes</TableHead>
                    <TableHead className="text-gray-300 font-semibold">Certificate</TableHead>
                    <TableHead className="text-gray-300 font-semibold">Compare</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrolledCourses.map((course) => (
                    <TableRow
                      key={course.id}
                      className="border-accent hover:bg-white/5"
                    >
                      <TableCell className="min-w-[200px]">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 md:h-12 md:w-12 flex-shrink-0">
                            <AvatarImage src={course.thumbnail} alt={course.title} />
                            <AvatarFallback className="bg-blue-600 text-white text-xs md:text-sm">
                              {getInitials(course.title)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium text-white text-sm md:text-base truncate">
                              {course.title}
                            </span>
                            <span className="text-xs text-gray-400">
                              {course.completedItems} of {course.totalItems} items
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[150px]">
                        <div className="flex items-center gap-2 md:gap-3">
                          <Progress
                            value={course.progressPercentage}
                            className="w-20 md:w-32 h-2"
                          />
                          <span className="text-white font-semibold text-xs md:text-sm whitespace-nowrap">
                            {Math.round(course.progressPercentage)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[120px]">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewBadges(course.sanityId, course.title)}
                          className="border cursor-pointer text-gray-300 hover:bg-gray-700 text-xs md:text-sm"
                        >
                          <Trophy className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                          Badges
                        </Button>
                      </TableCell>
                      <TableCell className="min-w-[150px]">
                        {course.isCompleted ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleDownloadCertificate(course.title, course.enrolledAt)
                            }
                            className="border-green-600 cursor-pointer text-green-400 hover:bg-green-900/20 text-xs md:text-sm whitespace-nowrap"
                          >
                            <Download className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                            View
                          </Button>
                        ) : (
                          <span className="text-gray-500 text-xs md:text-sm">
                            Not yet
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="min-w-[120px]">
                        <Button
                          size="sm"
                          onClick={() => handleCompare(course.sanityId, course.title)}
                          className="bg-white border text-black hover:bg-white/80 cursor-pointer text-xs md:text-sm"
                        >
                          Compare
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
      </div>

      {/* Dialogs */}
      {user && (
        <>
          <CertificateGenerator
            open={certificateDialog.open}
            onOpenChange={(open) =>
              setCertificateDialog({ ...certificateDialog, open })
            }
            studentName={user.name}
            courseName={certificateDialog.courseName}
            completionDate={certificateDialog.completionDate}
          />

          <QuizBadgesDialog
            open={quizBadgesDialog.open}
            onOpenChange={(open) =>
              setQuizBadgesDialog({ ...quizBadgesDialog, open })
            }
            courseName={quizBadgesDialog.courseName}
            quizResults={quizResults}
            loading={loadingQuizBadges}
          />

          <CompareStudentsDialog
            open={compareDialog.open}
            onOpenChange={(open) => setCompareDialog({ ...compareDialog, open })}
            courseName={compareDialog.courseName}
            students={comparisonStudents}
            loading={loadingComparison}
          />
        </>
      )}
    </DashboardLayout>
  );
}
