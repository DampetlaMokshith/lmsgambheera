'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getCourseBySlug, getCourseById } from '@/sanity/lib/queries';
import { getCourseProgress } from '@/lib/course-management';
import EnhancedCourseNav from '@/components/learn/enhanced-course-nav';
import LectureContent from '@/components/learn/lecture-content';
import ModuleContent from '@/components/learn/module-content';
import AssignmentContent from '@/components/learn/assignment-content';
import QuizContent from '@/components/learn/quiz-content';
import LectureDiscussion from '@/components/learn/lecture-discussion';
import LectureNotes from '@/components/learn/lecture-notes';
import { useCourseProgress } from '@/hooks/useCourseProgress';
import { supabase } from '@/lib/supabase';

interface LectureData {
  _id: string;
  title: string;
  slug: { current: string };
  videoUrl?: string;
  duration: number;
  description: string;
  order: number;
  isPreview: boolean;
}

interface ModuleData {
  _id: string;
  title: string;
  description: string | Record<string, unknown>[] | Record<string, unknown>;
  fileUrl?: string;
  downloadUrl?: string;
  order: number;
}

interface AssignmentData {
  _id: string;
  title: string;
  description: string | Record<string, unknown>[] | Record<string, unknown>;
  fileUrl?: string;
  downloadUrl?: string;
  dueDate?: string;
  order: number;
}

interface QuizData {
  _id: string;
  title: string;
  description: string | Record<string, unknown>[] | Record<string, unknown>;
  instructions?: string | Record<string, unknown>[] | Record<string, unknown>;
  questions: Record<string, unknown>[];
  timeLimit?: number;
  passingScore?: number;
  allowRetakes?: boolean;
  maxAttempts?: number;
  showCorrectAnswers?: boolean;
  order: number;
}

interface SectionData {
  _id: string;
  title: string;
  description: string | Record<string, unknown>[] | Record<string, unknown>;
  order: number;
  lectures?: LectureData[];
  modules?: ModuleData[];
  assignments?: AssignmentData[];
  quizzes?: QuizData[];
}

interface CourseData {
  _id: string;
  title: string;
  description: string;
  sections: SectionData[];
  faculty: {
    name: string;
    email: string;
  };
}

export default function LearnPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  
  const [course, setCourse] = useState<CourseData | null>(null);
  const [currentSection, setCurrentSection] = useState<SectionData | null>(null);
  const [currentLecture, setCurrentLecture] = useState<LectureData | null>(null);
  const [currentModule, setCurrentModule] = useState<ModuleData | null>(null);
  const [currentAssignment, setCurrentAssignment] = useState<AssignmentData | null>(null);
  const [currentQuiz, setCurrentQuiz] = useState<QuizData | null>(null);
  const [contentType, setContentType] = useState<'lecture' | 'module' | 'assignment' | 'quiz'>('lecture');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [sanityCourseid, setSanityCourseId] = useState<string | null>(null);
  const [canNavigatePrevious, setCanNavigatePrevious] = useState(false);
  const [canNavigateNext, setCanNavigateNext] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  // Use the progress hook
  const { 
    progress, 
    markComplete,
    isItemCompleted,
    fetchProgress 
  } = useCourseProgress(user?.id, sanityCourseid);

  useEffect(() => {
    async function fetchCourseData() {
      try {
        setLoading(true);
        
        // First check if user is authenticated
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          // Redirect to auth page if not logged in
          router.push('/auth');
          return;
        }
        
        const currentUser = session.user;
        const accessToken = session.access_token;
        
        setUser(currentUser);
        
        // First check if courseId is a Supabase course ID
        const { data: supabaseCourse, error: supabaseError } = await supabase
          .from('courses')
          .select('sanity_id, slug')
          .eq('id', courseId)
          .single();

        let courseData = null;
        let sanityId = courseId;

        if (supabaseError || !supabaseCourse) {
          // Try using courseId as sanity_id directly
          try {
            courseData = await getCourseById(courseId);
            sanityId = courseId;
          } catch {
            // If that fails, try as slug
            try {
              courseData = await getCourseBySlug(courseId);
              sanityId = courseData?._id || courseId;
            } catch {
            }
          }
        } else {
          // Fetch from Sanity using sanity_id
          sanityId = supabaseCourse.sanity_id;
          try {
            courseData = await getCourseById(supabaseCourse.sanity_id);
          } catch {
            // Fallback to slug if available
            if (supabaseCourse.slug) {
              courseData = await getCourseBySlug(supabaseCourse.slug);
            }
          }
        }
        
        if (!courseData) {
          setError('Course not found or not accessible');
          return;
        }
        
        // Check if the course is free (price = 0) or user is enrolled
        const coursePrice = courseData.price || 0;
        
        if (coursePrice > 0) {
          // Paid course - check enrollment via server API (bypasses RLS)
          const checkResponse = await fetch(`/api/enroll?courseSanityId=${courseData._id}`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          });
          const checkData = await checkResponse.json();
          
          if (!checkData.enrolled) {
            // User not enrolled - redirect to course page
            setAccessDenied(true);
            setError('You need to enroll in this course to access the content.');
            setTimeout(() => {
              router.push(`/courses/${courseData.slug?.current || courseId}`);
            }, 2000);
            return;
          }
        }
          
        setCourse(courseData);
        setSanityCourseId(courseData._id);
        
        // Fetch course progress
        try {
          if (currentUser) {
            const progress = await getCourseProgress(currentUser.id, courseData._id);
          }
        } catch (progressError) {
        }
        
        // Restore previous content state from localStorage if available
        const savedState = localStorage.getItem(`course_${courseData._id}_state`);
        if (savedState) {
          try {
            const state = JSON.parse(savedState);
            setContentType(state.contentType);
            
            // Find and set the saved content item
            if (state.contentType === 'lecture' && state.itemId) {
              for (const section of courseData.sections) {
                const lecture = section.lectures?.find((l: LectureData) => l._id === state.itemId);
                if (lecture) {
                  setCurrentLecture(lecture);
                  setCurrentSection(section);
                  return;
                }
              }
            } else if (state.contentType === 'module' && state.itemId) {
              for (const section of courseData.sections) {
                const module = section.modules?.find((m: ModuleData) => m._id === state.itemId);
                if (module) {
                  setCurrentModule(module);
                  setCurrentSection(section);
                  return;
                }
              }
            } else if (state.contentType === 'assignment' && state.itemId) {
              for (const section of courseData.sections) {
                const assignment = section.assignments?.find((a: AssignmentData) => a._id === state.itemId);
                if (assignment) {
                  setCurrentAssignment(assignment);
                  setCurrentSection(section);
                  return;
                }
              }
            } else if (state.contentType === 'quiz' && state.itemId) {
              for (const section of courseData.sections) {
                const quiz = section.quizzes?.find((q: QuizData) => q._id === state.itemId);
                if (quiz) {
                  setCurrentQuiz(quiz);
                  setCurrentSection(section);
                  return;
                }
              }
            }
          } catch (e) {
            // Failed to restore state
          }
        }
        
        // Set first lecture as current if no saved state
        if (courseData.sections && courseData.sections.length > 0) {
          const firstSection = courseData.sections[0];
          setCurrentSection(firstSection);
          
          if (firstSection.lectures && firstSection.lectures.length > 0) {
            setCurrentLecture(firstSection.lectures[0]);
          }
        }
      } catch (err) {
        setError('Failed to load course. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    if (courseId) {
      fetchCourseData();
    }
  }, [courseId]);
  
  // Calculate navigation state
  useEffect(() => {
    if (!course || !course.sections) return;
    
    interface ContentItem {
      type: 'lecture' | 'module' | 'assignment' | 'quiz';
      data: LectureData | ModuleData | AssignmentData | QuizData;
      section: SectionData;
    }

    const allContent: ContentItem[] = [];
    
    course.sections.forEach(section => {
      const sectionContent: ContentItem[] = [];
      
      if (section.lectures) {
        section.lectures.forEach(lecture => {
          sectionContent.push({ type: 'lecture', data: lecture, section });
        });
      }
      
      if (section.modules) {
        section.modules.forEach(module => {
          sectionContent.push({ type: 'module', data: module, section });
        });
      }
      
      if (section.assignments) {
        section.assignments.forEach(assignment => {
          sectionContent.push({ type: 'assignment', data: assignment, section });
        });
      }
      
      if (section.quizzes) {
        section.quizzes.forEach(quiz => {
          sectionContent.push({ type: 'quiz', data: quiz, section });
        });
      }
      
      sectionContent.sort((a, b) => {
        const orderA = 'order' in a.data ? a.data.order : 0;
        const orderB = 'order' in b.data ? b.data.order : 0;
        return orderA - orderB;
      });
      
      allContent.push(...sectionContent);
    });

    // Find current item index
    let currentIndex = -1;
    
    if (currentLecture) {
      currentIndex = allContent.findIndex(item => 
        item.type === 'lecture' && item.data._id === currentLecture._id
      );
    } else if (currentModule) {
      currentIndex = allContent.findIndex(item => 
        item.type === 'module' && item.data._id === currentModule._id
      );
    } else if (currentAssignment) {
      currentIndex = allContent.findIndex(item => 
        item.type === 'assignment' && item.data._id === currentAssignment._id
      );
    } else if (currentQuiz) {
      currentIndex = allContent.findIndex(item => 
        item.type === 'quiz' && item.data._id === currentQuiz._id
      );
    }

    // Update navigation state
    setCanNavigatePrevious(currentIndex > 0);
    setCanNavigateNext(currentIndex >= 0 && currentIndex < allContent.length - 1);
  }, [course, currentLecture, currentModule, currentAssignment, currentQuiz]);
  const handleLectureSelect = (lecture: LectureData, section: SectionData) => {
    setCurrentLecture(lecture);
    setCurrentSection(section);
    setCurrentModule(null);
    setCurrentAssignment(null);
    setCurrentQuiz(null);
    setContentType('lecture');
    // Save state
    if (course) {
      localStorage.setItem(`course_${course._id}_state`, JSON.stringify({
        contentType: 'lecture',
        itemId: lecture._id
      }));
    }
  };

  const handleModuleView = (module: ModuleData) => {
    setCurrentModule(module);
    setCurrentLecture(null);
    setCurrentAssignment(null);
    setCurrentQuiz(null);
    setContentType('module');
    // Save state
    if (course) {
      localStorage.setItem(`course_${course._id}_state`, JSON.stringify({
        contentType: 'module',
        itemId: module._id
      }));
    }
  };

  const handleAssignmentView = (assignment: AssignmentData) => {
    setCurrentAssignment(assignment);
    setCurrentLecture(null);
    setCurrentModule(null);
    setCurrentQuiz(null);
    setContentType('assignment');
    // Save state
    if (course) {
      localStorage.setItem(`course_${course._id}_state`, JSON.stringify({
        contentType: 'assignment',
        itemId: assignment._id
      }));
    }
  };

  const handleQuizAttempt = (quiz: QuizData) => {
    setCurrentQuiz(quiz);
    setCurrentLecture(null);
    setCurrentModule(null);
    setCurrentAssignment(null);
    setContentType('quiz');
    // Save state
    if (course) {
      localStorage.setItem(`course_${course._id}_state`, JSON.stringify({
        contentType: 'quiz',
        itemId: quiz._id
      }));
    }
  };

  const handleDrawerToggle = (isOpen: boolean) => {
    setIsDrawerOpen(isOpen);
  };

  const navigateToLecture = (direction: 'previous' | 'next') => {
    if (!course || !course.sections) return;

    // Build complete ordered list of all content items
    interface ContentItem {
      type: 'lecture' | 'module' | 'assignment' | 'quiz';
      data: LectureData | ModuleData | AssignmentData | QuizData;
      section: SectionData;
    }

    const allContent: ContentItem[] = [];
    
    course.sections.forEach(section => {
      // Add all content from this section in order
      const sectionContent: ContentItem[] = [];
      
      // Add lectures
      if (section.lectures) {
        section.lectures.forEach(lecture => {
          sectionContent.push({ type: 'lecture', data: lecture, section });
        });
      }
      
      // Add modules
      if (section.modules) {
        section.modules.forEach(module => {
          sectionContent.push({ type: 'module', data: module, section });
        });
      }
      
      // Add assignments
      if (section.assignments) {
        section.assignments.forEach(assignment => {
          sectionContent.push({ type: 'assignment', data: assignment, section });
        });
      }
      
      // Add quizzes
      if (section.quizzes) {
        section.quizzes.forEach(quiz => {
          sectionContent.push({ type: 'quiz', data: quiz, section });
        });
      }
      
      // Sort by order if available
      sectionContent.sort((a, b) => {
        const orderA = 'order' in a.data ? a.data.order : 0;
        const orderB = 'order' in b.data ? b.data.order : 0;
        return orderA - orderB;
      });
      
      allContent.push(...sectionContent);
    });

    // Find current item index
    let currentIndex = -1;
    
    if (currentLecture) {
      currentIndex = allContent.findIndex(item => 
        item.type === 'lecture' && item.data._id === currentLecture._id
      );
    } else if (currentModule) {
      currentIndex = allContent.findIndex(item => 
        item.type === 'module' && item.data._id === currentModule._id
      );
    } else if (currentAssignment) {
      currentIndex = allContent.findIndex(item => 
        item.type === 'assignment' && item.data._id === currentAssignment._id
      );
    } else if (currentQuiz) {
      currentIndex = allContent.findIndex(item => 
        item.type === 'quiz' && item.data._id === currentQuiz._id
      );
    }


    if (currentIndex === -1) return;

    // Navigate to next/previous item
    let targetIndex = -1;
    if (direction === 'previous' && currentIndex > 0) {
      targetIndex = currentIndex - 1;
    } else if (direction === 'next' && currentIndex < allContent.length - 1) {
      targetIndex = currentIndex + 1;
    }

    if (targetIndex === -1) return;

    const targetItem = allContent[targetIndex];
    
    // Set the appropriate content based on type
    setCurrentLecture(null);
    setCurrentModule(null);
    setCurrentAssignment(null);
    setCurrentQuiz(null);
    setCurrentSection(targetItem.section);
    
    switch (targetItem.type) {
      case 'lecture':
        setCurrentLecture(targetItem.data as LectureData);
        setContentType('lecture');
        if (course) {
          localStorage.setItem(`course_${course._id}_state`, JSON.stringify({
            contentType: 'lecture',
            itemId: (targetItem.data as LectureData)._id
          }));
        }
        break;
      case 'module':
        setCurrentModule(targetItem.data as ModuleData);
        setContentType('module');
        if (course) {
          localStorage.setItem(`course_${course._id}_state`, JSON.stringify({
            contentType: 'module',
            itemId: (targetItem.data as ModuleData)._id
          }));
        }
        break;
      case 'assignment':
        setCurrentAssignment(targetItem.data as AssignmentData);
        setContentType('assignment');
        if (course) {
          localStorage.setItem(`course_${course._id}_state`, JSON.stringify({
            contentType: 'assignment',
            itemId: (targetItem.data as AssignmentData)._id
          }));
        }
        break;
      case 'quiz':
        setCurrentQuiz(targetItem.data as QuizData);
        setContentType('quiz');
        if (course) {
          localStorage.setItem(`course_${course._id}_state`, JSON.stringify({
            contentType: 'quiz',
            itemId: (targetItem.data as QuizData)._id
          }));
        }
        break;
    }
  };

  // Calculate navigation state
  useEffect(() => {
    if (!course || !course.sections) return;
    
    interface ContentItem {
      type: 'lecture' | 'module' | 'assignment' | 'quiz';
      data: LectureData | ModuleData | AssignmentData | QuizData;
      section: SectionData;
    }

    const allContent: ContentItem[] = [];
    
    course.sections.forEach(section => {
      const sectionContent: ContentItem[] = [];
      
      if (section.lectures) {
        section.lectures.forEach(lecture => {
          sectionContent.push({ type: 'lecture', data: lecture, section });
        });
      }
      
      if (section.modules) {
        section.modules.forEach(module => {
          sectionContent.push({ type: 'module', data: module, section });
        });
      }
      
      if (section.assignments) {
        section.assignments.forEach(assignment => {
          sectionContent.push({ type: 'assignment', data: assignment, section });
        });
      }
      
      if (section.quizzes) {
        section.quizzes.forEach(quiz => {
          sectionContent.push({ type: 'quiz', data: quiz, section });
        });
      }
      
      sectionContent.sort((a, b) => {
        const orderA = 'order' in a.data ? a.data.order : 0;
        const orderB = 'order' in b.data ? b.data.order : 0;
        return orderA - orderB;
      });
      
      allContent.push(...sectionContent);
    });

    // Find current item index
    let currentIndex = -1;
    
    if (currentLecture) {
      currentIndex = allContent.findIndex(item => 
        item.type === 'lecture' && item.data._id === currentLecture._id
      );
    } else if (currentModule) {
      currentIndex = allContent.findIndex(item => 
        item.type === 'module' && item.data._id === currentModule._id
      );
    } else if (currentAssignment) {
      currentIndex = allContent.findIndex(item => 
        item.type === 'assignment' && item.data._id === currentAssignment._id
      );
    } else if (currentQuiz) {
      currentIndex = allContent.findIndex(item => 
        item.type === 'quiz' && item.data._id === currentQuiz._id
      );
    }

    // Update navigation state
    setCanNavigatePrevious(currentIndex > 0);
    setCanNavigateNext(currentIndex >= 0 && currentIndex < allContent.length - 1);
  }, [course, currentLecture, currentModule, currentAssignment, currentQuiz]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="inline-block">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-white text-sm">Loading course...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          {accessDenied ? (
            <>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Enrollment Required</h3>
              <p className="text-gray-400 mb-4">{error || 'You need to enroll in this course to access the content.'}</p>
              <p className="text-gray-500 text-sm">Redirecting to course page...</p>
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold text-red-400 mb-2">Course Not Found</h3>
              <p className="text-red-300">{error || 'The requested course could not be found.'}</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Fixed Navigation */}
      <EnhancedCourseNav
        course={course}
        currentLecture={currentLecture}
        currentModule={currentModule}
        currentAssignment={currentAssignment}
        currentQuiz={currentQuiz}
        user={user}
        onLectureSelect={handleLectureSelect}
        onNavigate={navigateToLecture}
        onModuleView={handleModuleView}
        onAssignmentView={handleAssignmentView}
        onQuizAttempt={handleQuizAttempt}
        onDrawerToggle={handleDrawerToggle}
        progress={progress}
        markComplete={markComplete}
        isItemCompleted={isItemCompleted}
        canNavigatePrevious={canNavigatePrevious}
        canNavigateNext={canNavigateNext}
      />
      {/* Main Content with dynamic margin based on drawer state */}
      <div 
        className={`pt-20 px-4 md:px-6 py-6 transition-all duration-300 ${
          isDrawerOpen 
            ? 'md:ml-80 lg:ml-96' 
            : 'ml-0'
        }`}
      >
        <div className="max-w-7xl mx-auto">
          {contentType === 'lecture' && currentLecture ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content Area */}
              <div className="lg:col-span-2">
                <LectureContent 
                  lecture={currentLecture} 
                  courseId={course._id}
                  userId={user?.id}
                  onMarkComplete={fetchProgress}
                />
              </div>

              {/* Discussion Sidebar */}
              <div className={`lg:col-span-1 ${isDrawerOpen ? 'hidden md:block' : 'block'}`}>
                <div className="space-y-6">
                  {/* Notes Section */}
                  {user && (
                    <LectureNotes
                      courseId={course._id}
                      lectureId={currentLecture._id}
                      userId={user.id}
                    />
                  )}

                  {/* Discussion Section */}
                  {user ? (
                    <LectureDiscussion 
                      courseId={course._id} 
                      lectureId={currentLecture._id}
                      userId={user.id} 
                    />
                  ) : (
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Lecture Discussion</h3>
                      <div className="bg-gray-900 border border-gray-700 p-6">
                        <p className="text-gray-400 text-center text-sm">
                          Please log in to participate in the discussion.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : contentType === 'module' && currentModule ? (
            <div className="max-w-5xl mx-auto">
              <ModuleContent 
                module={currentModule} 
                courseId={course._id}
                userId={user?.id}
              />
            </div>
          ) : contentType === 'assignment' && currentAssignment ? (
            <div className="max-w-5xl mx-auto">
              <AssignmentContent 
                assignment={currentAssignment} 
                courseId={course._id}
                userId={user?.id}
              />
            </div>
          ) : contentType === 'quiz' && currentQuiz ? (
            <div className="max-w-5xl mx-auto">
              <QuizContent 
                quiz={currentQuiz} 
                courseId={course._id}
                courseName={course.title}
                userId={user?.id}
              />
            </div>
          ) : (
            <div className="text-center text-gray-400 py-12">
              <div className="text-4xl sm:text-6xl mb-4">📚</div>
              <p className="text-sm sm:text-base">Select a lecture, module, assignment, or quiz from the menu to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
