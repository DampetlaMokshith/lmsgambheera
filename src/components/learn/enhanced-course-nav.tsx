'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { CourseProgressAccordion } from './course-progress-accordion';
import { CourseProgressBar } from './course-progress-bar';

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
  questions: Record<string, unknown>[];
  timeLimit?: number;
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

interface CourseLearningNavProps {
  course: CourseData;
  currentLecture: LectureData | null;
  user: { id: string } | null;
  onLectureSelect: (lecture: LectureData, section: SectionData) => void;
  onNavigate: (direction: 'previous' | 'next') => void;
  onModuleView: (module: ModuleData) => void;
  onAssignmentView: (assignment: AssignmentData) => void;
  onQuizAttempt: (quiz: QuizData) => void;
  onDrawerToggle?: (isOpen: boolean) => void;
  progress?: {
    progress_percentage: number;
    completed_items: number;
    total_items: number;
    completed_item_ids: string[];
  } | null;
  markComplete?: (itemId: string, itemType: 'lecture' | 'module' | 'assignment' | 'quiz', sectionId?: string) => Promise<void>;
  isItemCompleted?: (itemId: string) => boolean;
}

export default function CourseLearningNav({
  course,
  currentLecture,
  user,
  onLectureSelect,
  onNavigate,
  onModuleView,
  onAssignmentView,
  onQuizAttempt,
  onDrawerToggle,
  progress
}: CourseLearningNavProps) {
  const router = useRouter();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false); // Default closed on mobile
  const [loading] = useState(false);

  // Set drawer open on desktop by default
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) { // md breakpoint
        setIsDrawerOpen(true);
        onDrawerToggle?.(true);
      } else {
        setIsDrawerOpen(false);
        onDrawerToggle?.(false);
      }
    };
    
    // Set initial state
    handleResize();
    
    // Add resize listener
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [onDrawerToggle]);

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
    onDrawerToggle?.(!isDrawerOpen);
  };

  return (
    <>
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 bg-black border-b border-gray-700 px-4 md:px-6 py-3 z-50">
        <div className="flex items-center justify-between w-full">
          {/* Left side - Hamburger (mobile only), Back Navigation and Title */}
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {/* Hamburger Menu - Only visible on mobile */}
            <Button 
              size="icon" 
              variant="outline" 
              onClick={toggleDrawer}
              className="bg-black border-white text-white hover:bg-gray-800 flex-shrink-0 md:hidden"
              title="Toggle Course Menu"
            >
              <Menu className="h-4 w-4" />
            </Button>
            
            <Button 
              size="icon" 
              variant="outline" 
              onClick={() => router.push('/courses')}
              className="bg-black border-white text-white hover:bg-gray-800 flex-shrink-0"
              title="Back to Courses"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            
            <h1 className="text-lg sm:text-xl font-bold text-white truncate min-w-0">
              {course.title}
            </h1>
          </div>

          {/* Right side - Navigation buttons */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('previous')}
              disabled={!currentLecture}
              className="bg-black border-white text-white hover:bg-gray-800 px-3"
            >
              <ChevronLeft className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Previous</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('next')}
              disabled={!currentLecture}
              className="bg-black border-white text-white hover:bg-gray-800 px-3"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-4 w-4 sm:ml-1" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Left Drawer - Permanent on desktop, toggleable on mobile */}
      <div className={`fixed top-16 left-0 h-[calc(100vh-4rem)] bg-black border z-40 w-80 sm:w-96 flex flex-col md:translate-x-0 transition-transform duration-300 ${
        isDrawerOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        
        {/* Drawer Header */}
        <div className="p-4 border-b border-gray-700 flex-shrink-0">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-white">{course.title}</h2>
          </div>
          
          {/* Progress Section */}
          {user && progress && (
            <CourseProgressBar
              percent={progress.progress_percentage || 0}
              completedItems={progress.completed_items}
              totalItems={progress.total_items}
              showDetails={true}
            />
          )}
          
          {!progress && user && loading && (
            <div className="space-y-2">
              <div className="h-4 bg-gray-700 rounded animate-pulse"></div>
              <div className="h-3 bg-gray-700 rounded animate-pulse"></div>
            </div>
          )}
        </div>

        {/* Drawer Content with Scroll */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 pb-8">
              {user && (
                <CourseProgressAccordion
                  sections={course.sections}
                  courseId={course._id}
                  userId={user.id}
                  currentLecture={currentLecture}
                  onLectureSelect={onLectureSelect}
                  onModuleView={onModuleView}
                  onAssignmentView={onAssignmentView}
                  onQuizAttempt={onQuizAttempt}
                />
              )}
              
              {!user && (
                <div className="text-center text-gray-400 py-8">
                  <p>Please log in to track your progress</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Backdrop for mobile */}
      {isDrawerOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={toggleDrawer}
        />
      )}
    </>
  );
}