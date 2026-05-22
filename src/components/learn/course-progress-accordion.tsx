'use client'

import { useState, useEffect } from 'react'
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

interface CourseProgressAccordionProps {
  sections: SectionData[];
  currentLecture: LectureData | null;
  currentModule?: ModuleData | null;
  currentAssignment?: AssignmentData | null;
  currentQuiz?: QuizData | null;
  onLectureSelect: (lecture: LectureData, section: SectionData) => void;
  onModuleView: (module: ModuleData) => void;
  onAssignmentView: (assignment: AssignmentData) => void;
  onQuizAttempt: (quiz: QuizData) => void;
  completedItemIds?: string[];
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
  currentLecture,
  currentModule,
  currentAssignment,
  currentQuiz,
  onLectureSelect,
  onModuleView,
  onAssignmentView,
  onQuizAttempt,
  completedItemIds = []
}: CourseProgressAccordionProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  // Helper function to check if item is completed
  const isItemCompleted = (itemId: string) => completedItemIds.includes(itemId);

  // Auto-expand the section containing current content
  useEffect(() => {
    let currentSectionId: string | null = null;
    
    // Find which section contains the current content
    for (const section of sections) {
      if (currentLecture && section.lectures?.some(l => l._id === currentLecture._id)) {
        currentSectionId = `section-${sections.indexOf(section)}-${section._id}`;
        break;
      }
      if (currentModule && section.modules?.some(m => m._id === currentModule._id)) {
        currentSectionId = `section-${sections.indexOf(section)}-${section._id}`;
        break;
      }
      if (currentAssignment && section.assignments?.some(a => a._id === currentAssignment._id)) {
        currentSectionId = `section-${sections.indexOf(section)}-${section._id}`;
        break;
      }
      if (currentQuiz && section.quizzes?.some(q => q._id === currentQuiz._id)) {
        currentSectionId = `section-${sections.indexOf(section)}-${section._id}`;
        break;
      }
    }
    
    if (currentSectionId && !expandedSections.includes(currentSectionId)) {
      setExpandedSections([currentSectionId]);
    }
  }, [currentLecture, currentModule, currentAssignment, currentQuiz, sections, expandedSections]);

  return (
    <Accordion 
      type="multiple" 
      className="w-full space-y-2"
      value={expandedSections}
      onValueChange={setExpandedSections}
    >
      {sections.map((section, sectionIndex) => {
        const totalItems = (section.lectures?.length || 0) + (section.modules?.length || 0) + 
                          (section.assignments?.length || 0) + (section.quizzes?.length || 0);
        
        // Check if all items in section are completed using completedItemIds
        const allItemIds = [
          ...(section.lectures?.map(l => l._id) || []),
          ...(section.modules?.map(m => m._id) || []),
          ...(section.assignments?.map(a => a._id) || []),
          ...(section.quizzes?.map(q => q._id) || [])
        ];
        
        const allSectionItemsCompleted = totalItems > 0 && 
          allItemIds.every(id => isItemCompleted(id));
        
        return (
          <AccordionItem 
            key={`section-${sectionIndex}-${section._id}`}
            value={`section-${sectionIndex}-${section._id}`}
            className="bg-black border rounded-sm overflow-hidden"
          >
            <AccordionTrigger className="px-4 py-3 text-white font-semibold text-left [&[data-state=open]>svg]:rotate-180">
              <div className="flex items-center justify-between w-full gap-3 pr-4">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-sm">Section {sectionIndex + 1}: {section.title}</span>
                  {allSectionItemsCompleted && (
                    <Badge className="bg-green-500 text-white text-xs animate-in fade-in slide-in-from-left-2 duration-300">
                      Completed
                    </Badge>
                  )}
                </div>
                <Badge variant="secondary" className="bg-white/10 text-white text-xs flex-shrink-0">
                  {totalItems} {totalItems === 1 ? 'item' : 'items'}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-0 pb-4 bg-black">
              <div className="space-y-2 mt-2 px-4">
              
              {/* Lectures Section */}
              {section.lectures && section.lectures.length > 0 && (
                <Collapsible defaultOpen className="space-y-1">
                  <CollapsibleTrigger className="w-full group">
                    <div className="flex items-center gap-2 px-3 py-2 bg-black hover:bg-white/5 transition-colors">
                      <Plus className="h-4 w-4 text-white group-data-[state=open]:hidden" />
                      <Minus className="h-4 w-4 text-white hidden group-data-[state=open]:block" />
                      
                      <span className="text-sm font-medium text-white">Lectures ({section.lectures.length})</span>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2 mt-1">
                    {section.lectures.map((lecture, index) => {
                const isWatched = isItemCompleted(lecture._id);
                const isCurrent = currentLecture?._id === lecture._id;
                
                return (
                  <div 
                    key={`${section._id}-lecture-${lecture._id}-${index}`}
                    onClick={() => onLectureSelect(lecture, section)}
                    className={`flex items-center justify-between px-4 py-3 transition-all cursor-pointer border ${
                      isCurrent 
                        ? 'bg-white/5  text-white' 
                        : 'bg-black  hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        isWatched ? 'bg-green-500' : 'bg-gray-500'
                      }`} />
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium break-words ${
                            isCurrent ? 'text-white' : 'text-gray-200'
                          }`}>
                            {index + 1}. {lecture.title}
                          </p>
                          {isWatched && !isCurrent && (
                            <Badge className="bg-green-500 text-white text-xs animate-in fade-in slide-in-from-left-2 duration-300">
                              Completed
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {lecture.duration} minutes
                        </p>
                      </div>
                    </div>
                    {isCurrent && (
                      <div className="flex-shrink-0">
                        <span className="text-xs font-medium text-white bg-black px-2 py-1 rounded">
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
                    <div className="flex items-center gap-2 px-3 py-2 bg-black hover:bg-white/5 transition-colors">
                      <Plus className="h-4 w-4 text-white group-data-[state=open]:hidden" />
                      <Minus className="h-4 w-4 text-white hidden group-data-[state=open]:block" />
                      
                      <span className="text-sm font-medium text-white">Modules ({section.modules.length})</span>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2 mt-1">
                    {section.modules.map((module, index) => {
                const isCompleted = isItemCompleted(module._id);
                
                return (
                  <div 
                    key={`${section._id}-module-${module._id}-${index}`}
                    onClick={() => onModuleView(module)}
                    className="flex items-center justify-between px-4 py-3 transition-all cursor-pointer border bg-black border hover:bg-white/5"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-500'
                      }`} />
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-200 break-words">
                            {module.title}
                          </p>
                          {isCompleted && (
                            <Badge className="bg-green-500 text-white text-xs animate-in fade-in slide-in-from-left-2 duration-300">
                              Completed
                            </Badge>
                          )}
                        </div>
                        {module.description && (
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                            {getSafeText(module.description)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0 ml-2">
                      <FileText className="h-4 w-4 text-white" />
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
                    <div className="flex items-center gap-2 px-3 py-2 bg-black hover:bg-white/5 transition-colors">
                      <Plus className="h-4 w-4 text-white group-data-[state=open]:hidden" />
                      <Minus className="h-4 w-4 text-white hidden group-data-[state=open]:block" />
                      
                      <span className="text-sm font-medium text-white">Assignments ({section.assignments.length})</span>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2 mt-1">
                    {section.assignments.map((assignment, index) => {
                const isCompleted = isItemCompleted(assignment._id);
                
                return (
                  <div 
                    key={`${section._id}-assignment-${assignment._id}-${index}`}
                    onClick={() => onAssignmentView(assignment)}
                    className="flex items-center justify-between px-4 py-3 transition-all cursor-pointer border bg-black border hover:bg-white/5"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-500'
                      }`} />
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-200 break-words">
                            {assignment.title}
                          </p>
                          {isCompleted && (
                            <Badge className="bg-green-500 text-white text-xs animate-in fade-in slide-in-from-left-2 duration-300">
                              Completed
                            </Badge>
                          )}
                        </div>
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
                      <Clipboard className="h-4 w-4 text-white" />
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
                    <div className="flex items-center gap-2 px-3 py-2 bg-black hover:bg-white/5 transition-colors">
                      <Plus className="h-4 w-4 text-white group-data-[state=open]:hidden" />
                      <Minus className="h-4 w-4 text-white hidden group-data-[state=open]:block" />
                      
                      <span className="text-sm font-medium text-white">Quizzes ({section.quizzes.length})</span>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2 mt-1">
                    {section.quizzes.map((quiz, index) => {
                const isCompleted = isItemCompleted(quiz._id);
                
                return (
                  <div 
                    key={`${section._id}-quiz-${quiz._id}-${index}`}
                    onClick={() => onQuizAttempt(quiz)}
                    className="flex items-center justify-between px-4 py-3 transition-all cursor-pointer border bg-black border hover:bg-white/5"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-500'
                      }`} />
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-200 break-words">
                            {quiz.title}
                          </p>
                          {isCompleted && (
                            <Badge className="bg-green-500 text-white text-xs animate-in fade-in slide-in-from-left-2 duration-300">
                              Completed
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {quiz.questions?.length} questions
                          {quiz.timeLimit && ` • ${quiz.timeLimit} minutes`}
                        </p>
                      </div>
                    </div>
                    <div className="flex-shrink-0 ml-2">
                      <HelpCircle className="h-4 w-4 text-white" />
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