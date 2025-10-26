'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Clipboard, 
  HelpCircle,
  Plus,
  Minus
} from 'lucide-react'

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
  description: string;
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

interface ProgressData {
  lectureProgress: Record<string, boolean>;
  moduleProgress: Record<string, boolean>;
  assignmentProgress: Record<string, boolean>;
  quizProgress: Record<string, { completed: boolean; score?: number; maxScore?: number }>;
}

interface CourseProgressAccordionProps {
  sections: SectionData[];
  courseId: string;
  userId: string;
  currentLecture: LectureData | null;
  onLectureSelect: (lecture: LectureData, section: SectionData) => void;
  onModuleView: (module: ModuleData) => void;
  onAssignmentView: (assignment: AssignmentData) => void;
  onQuizAttempt: (quiz: QuizData) => void;
}

// Helper function to safely render text (handles both string and Portable Text)
function getSafeText(text: string | Record<string, unknown>[] | Record<string, unknown> | undefined): string {
  if (!text) return '';
  if (typeof text === 'string') return text;
  
  // If it's Portable Text array, extract text from blocks
  if (Array.isArray(text)) {
    return text
      .map((block: Record<string, unknown>) => {
        if (block._type === 'block' && Array.isArray(block.children)) {
          return block.children
            .map((child: Record<string, unknown>) => child.text || '')
            .join('');
        }
        return '';
      })
      .join(' ');
  }
  
  return '';
}

export function CourseProgressAccordion({
  sections,
  courseId,
  userId,
  currentLecture,
  onLectureSelect,
  onModuleView,
  onAssignmentView,
  onQuizAttempt
}: CourseProgressAccordionProps) {
  const [progress, setProgress] = useState<ProgressData>({
    lectureProgress: {},
    moduleProgress: {},
    assignmentProgress: {},
    quizProgress: {}
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, userId]);

  const fetchProgress = async () => {
    try {
      // Fetch all progress data
      const [lectureRes, moduleRes, assignmentRes, quizRes] = await Promise.all([
        supabase
          .from('user_lecture_progress')
          .select('lecture_id, watched')
          .eq('user_id', userId)
          .eq('course_id', courseId),
        supabase
          .from('user_module_progress')
          .select('module_id, completed')
          .eq('user_id', userId)
          .eq('course_id', courseId),
        supabase
          .from('user_assignment_progress')
          .select('assignment_id, completed')
          .eq('user_id', userId)
          .eq('course_id', courseId),
        supabase
          .from('user_quiz_progress')
          .select('quiz_id, completed, score, max_score')
          .eq('user_id', userId)
          .eq('course_id', courseId)
      ]);

      const lectureProgress: Record<string, boolean> = {};
      lectureRes.data?.forEach(item => {
        lectureProgress[item.lecture_id] = item.watched;
      });

      const moduleProgress: Record<string, boolean> = {};
      moduleRes.data?.forEach(item => {
        moduleProgress[item.module_id] = item.completed;
      });

      const assignmentProgress: Record<string, boolean> = {};
      assignmentRes.data?.forEach(item => {
        assignmentProgress[item.assignment_id] = item.completed;
      });

      const quizProgress: Record<string, { completed: boolean; score?: number; maxScore?: number }> = {};
      quizRes.data?.forEach(item => {
        quizProgress[item.quiz_id] = {
          completed: item.completed,
          score: item.score,
          maxScore: item.max_score
        };
      });

      setProgress({
        lectureProgress,
        moduleProgress,
        assignmentProgress,
        quizProgress
      });
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-12 bg-gray-700 rounded mb-2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <Accordion type="multiple" className="w-full space-y-2">
      {sections.map((section, sectionIndex) => {
        const totalItems = (section.lectures?.length || 0) + (section.modules?.length || 0) + 
                          (section.assignments?.length || 0) + (section.quizzes?.length || 0);
        
        return (
          <AccordionItem 
            key={`section-${sectionIndex}-${section._id}`}
            value={`section-${sectionIndex}-${section._id}`}
            className="bg-black border border-white/20 rounded-lg overflow-hidden"
          >
            <AccordionTrigger className="px-4 py-3 hover:bg-white/5 text-white font-semibold text-left [&[data-state=open]>svg]:rotate-90">
              <div className="flex items-center justify-between w-full gap-3 pr-4">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-sm">Section {sectionIndex + 1}: {section.title}</span>
                </div>
                <Badge variant="secondary" className="bg-white/10 text-white border-0 text-xs flex-shrink-0">
                  {totalItems} {totalItems === 1 ? 'item' : 'items'}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-0 pb-4 bg-black/50">
              <div className="space-y-2 mt-2 px-4">
              
              {/* Lectures Section */}
              {section.lectures && section.lectures.length > 0 && (
                <Collapsible defaultOpen className="space-y-1">
                  <CollapsibleTrigger className="w-full group">
                    <div className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-md transition-colors">
                      <Plus className="h-4 w-4 text-blue-400 group-data-[state=open]:hidden" />
                      <Minus className="h-4 w-4 text-blue-400 hidden group-data-[state=open]:block" />
                      
                      <span className="text-sm font-medium text-white">Lectures ({section.lectures.length})</span>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2 mt-1">
                    {section.lectures.map((lecture, index) => {
                const isWatched = progress.lectureProgress[lecture._id];
                const isCurrent = currentLecture?._id === lecture._id;
                
                return (
                  <div 
                    key={`${section._id}-lecture-${lecture._id}-${index}`}
                    onClick={() => onLectureSelect(lecture, section)}
                    className={`flex items-center justify-between px-4 py-3 rounded-md transition-all cursor-pointer border ${
                      isCurrent 
                        ? 'bg-blue-500/20 border-blue-500/50 text-white' 
                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        isWatched ? 'bg-green-500' : 'bg-gray-500'
                      }`} />
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <p className={`text-sm font-medium break-words ${
                          isCurrent ? 'text-white' : 'text-gray-200'
                        }`}>
                          {index + 1}. {lecture.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {lecture.duration} minutes
                        </p>
                      </div>
                    </div>
                    {isCurrent && (
                      <div className="flex-shrink-0">
                        <span className="text-xs font-medium text-blue-400 bg-blue-500/20 px-2 py-1 rounded">
                          Playing
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Modules Section */}
              {section.modules && section.modules.length > 0 && (
                <Collapsible defaultOpen className="space-y-1">
                  <CollapsibleTrigger className="w-full group">
                    <div className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-md transition-colors">
                      <Plus className="h-4 w-4 text-purple-400 group-data-[state=open]:hidden" />
                      <Minus className="h-4 w-4 text-purple-400 hidden group-data-[state=open]:block" />
                      <FileText className="h-4 w-4 text-purple-400" />
                      <span className="text-sm font-medium text-white">Modules ({section.modules.length})</span>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2 mt-1">
                    {section.modules.map((module, index) => {
                const isCompleted = progress.moduleProgress[module._id];
                
                return (
                  <div 
                    key={`${section._id}-module-${module._id}-${index}`}
                    onClick={() => onModuleView(module)}
                    className="flex items-center justify-between px-4 py-3 rounded-md transition-all cursor-pointer border bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-500'
                      }`} />
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <p className="text-sm font-medium text-gray-200 break-words">
                          {module.title}
                        </p>
                        {module.description && (
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                            {getSafeText(module.description)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0 ml-2">
                      <FileText className="h-4 w-4 text-purple-400" />
                    </div>
                  </div>
                );
              })}
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Assignments Section */}
              {section.assignments && section.assignments.length > 0 && (
                <Collapsible defaultOpen className="space-y-1">
                  <CollapsibleTrigger className="w-full group">
                    <div className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-md transition-colors">
                      <Plus className="h-4 w-4 text-orange-400 group-data-[state=open]:hidden" />
                      <Minus className="h-4 w-4 text-orange-400 hidden group-data-[state=open]:block" />
                      <Clipboard className="h-4 w-4 text-orange-400" />
                      <span className="text-sm font-medium text-white">Assignments ({section.assignments.length})</span>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2 mt-1">
                    {section.assignments.map((assignment, index) => {
                const isCompleted = progress.assignmentProgress[assignment._id];
                
                return (
                  <div 
                    key={`${section._id}-assignment-${assignment._id}-${index}`}
                    onClick={() => onAssignmentView(assignment)}
                    className="flex items-center justify-between px-4 py-3 rounded-md transition-all cursor-pointer border bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-500'
                      }`} />
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <p className="text-sm font-medium text-gray-200 break-words">
                          {assignment.title}
                        </p>
                        {assignment.description && (
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                            {getSafeText(assignment.description)}
                          </p>
                        )}
                        {assignment.dueDate && (
                          <p className="text-xs text-orange-400 mt-1">
                            Due: {new Date(assignment.dueDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0 ml-2">
                      <Clipboard className="h-4 w-4 text-orange-400" />
                    </div>
                  </div>
                );
              })}
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Quizzes Section */}
              {section.quizzes && section.quizzes.length > 0 && (
                <Collapsible defaultOpen className="space-y-1">
                  <CollapsibleTrigger className="w-full group">
                    <div className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-md transition-colors">
                      <Plus className="h-4 w-4 text-yellow-400 group-data-[state=open]:hidden" />
                      <Minus className="h-4 w-4 text-yellow-400 hidden group-data-[state=open]:block" />
                      <HelpCircle className="h-4 w-4 text-yellow-400" />
                      <span className="text-sm font-medium text-white">Quizzes ({section.quizzes.length})</span>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2 mt-1">
                    {section.quizzes.map((quiz, index) => {
                const quizProgress = progress.quizProgress[quiz._id];
                const isCompleted = quizProgress?.completed;
                
                return (
                  <div 
                    key={`${section._id}-quiz-${quiz._id}-${index}`}
                    onClick={() => onQuizAttempt(quiz)}
                    className="flex items-center justify-between px-4 py-3 rounded-md transition-all cursor-pointer border bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-500'
                      }`} />
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <p className="text-sm font-medium text-gray-200 break-words">
                          {quiz.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {quiz.questions?.length} questions
                          {quiz.timeLimit && ` • ${quiz.timeLimit} minutes`}
                        </p>
                        {isCompleted && quizProgress.score !== undefined && (
                          <p className="text-xs text-green-400 mt-1">
                            Score: {quizProgress.score}/{quizProgress.maxScore}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0 ml-2">
                      <HelpCircle className="h-4 w-4 text-yellow-400" />
                    </div>
                  </div>
                );
              })}
                  </CollapsibleContent>
                </Collapsible>
              )}
              
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}