'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
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
  currentModule?: ModuleData | null;
  currentAssignment?: AssignmentData | null;
  currentQuiz?: QuizData | null;
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
  markComplete?: (itemId: string, itemType: 'lecture' | 'module' | 'assignment' | 'quiz', sectionId?: string) => Promise<{ success: boolean; message: string }>;
  isItemCompleted?: (itemId: string) => boolean;
  canNavigatePrevious?: boolean;
  canNavigateNext?: boolean;
}

export default function CourseLearningNav({
  course,
  currentLecture,
  currentModule,
  currentAssignment,
  currentQuiz,
  user,
  onLectureSelect,
  onNavigate,
  onModuleView,
  onAssignmentView,
  onQuizAttempt,
  onDrawerToggle,
  progress,
  canNavigatePrevious = false,
  canNavigateNext = false
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
      <nav className="fixed top-0 left-0 right-0 bg-black border-b px-4 md:px-6 py-3 z-50">
        <div className="flex items-center justify-between w-full">
          {/* Left side - Sidebar Toggle (mobile only) and Back Navigation (desktop only) */}
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {/* Sidebar Toggle - Only visible on mobile */}
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={toggleDrawer}
              className="md:hidden bg-black text-white hover:bg-gray-800 flex-shrink-0"
              title={isDrawerOpen ? "Close Course Menu" : "Open Course Menu"}
            >
              {isDrawerOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
            </Button>
            
            {/* Back Button - Only visible on desktop */}
            <Button 
              size="icon" 
              variant="outline" 
              onClick={() => router.back()}
              className="hidden md:flex bg-black text-white hover:bg-black flex-shrink-0"
              title="Back to Course"
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
              disabled={!canNavigatePrevious}
              className="bg-black border-white text-white hover:bg-gray-800 px-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Previous</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('next')}
              disabled={!canNavigateNext}
              className="bg-black border-white text-white hover:bg-gray-800 px-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-4 w-4 sm:ml-1" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Left Drawer - Permanent on desktop, toggleable on mobile */}
      <div className={`fixed top-16 left-0 h-[calc(100vh-4rem)] bg-black border-b z-50 w-80 sm:w-96 flex flex-col md:translate-x-0 transition-all duration-300 ease-in-out ${
        isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        
        {/* Drawer Header */}
        <div className="p-4 border-b border-black flex-shrink-0">
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
            <div className="space-y-3">
              {/* Progress Bar Skeleton */}
              <div className="space-y-2">
                <div className="h-4 bg-accent rounded animate-pulse"></div>
                <div className="h-2 bg-accent rounded animate-pulse w-3/4"></div>
                <div className="h-3 bg-accent rounded animate-pulse w-1/2"></div>
              </div>
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
                  currentLecture={currentLecture}
                  currentModule={currentModule}
                  currentAssignment={currentAssignment}
                  currentQuiz={currentQuiz}
                  onLectureSelect={onLectureSelect}
                  onModuleView={onModuleView}
                  onAssignmentView={onAssignmentView}
                  onQuizAttempt={onQuizAttempt}
                  completedItemIds={progress?.completed_item_ids || []}
                />
              )}
              
              {!user && (
                <div className="text-center text-white py-8">
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
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={toggleDrawer}
        />
      )}
    </>
  );
}