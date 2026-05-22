'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import {
  CSS,
} from '@dnd-kit/utilities';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  GripVertical, 
  Plus, 
  Trash2, 
  Edit2, 
  Book, 
  Video, 
  ClipboardList,
  HelpCircle,
  Save,
  X,
  CalendarIcon,
  Upload,
  FileText,
  Link as LinkIcon
} from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { editorClient as writeClient } from '@/sanity/lib/client';
import { safeClient } from '@/sanity/lib/safeClient';
import { toast } from 'sonner';

// Types based on Sanity schemas
interface SanityLecture {
  _id: string;
  _key?: string;
  title: string;
  description?: string;
  duration: number;
  videoUrl: string;
  order: number;
  isPreview?: boolean;
  slug?: {
    current: string;
  };
}

interface SanityModule {
  _id: string;
  _key?: string;
  title: string;
  description?: string;
  moduleType: 'pdf' | 'content' | 'link' | 'video';
  estimatedReadTime?: number;
  order?: number;
  slug?: {
    current: string;
  };
}

interface SanityAssignment {
  _id: string;
  _key?: string;
  title: string;
  description?: Array<{
    _type: string;
    children: Array<{
      text: string;
    }>;
  }>;
  totalPoints?: number;
  dueDate?: string;
  submissionType: 'file' | 'text' | 'both' | 'link';
  order?: number;
  slug?: {
    current: string;
  };
}

interface SanityQuiz {
  _id: string;
  _key?: string;
  title: string;
  description?: string;
  timeLimit?: number;
  passingScore?: number;
  questions: Array<{
    _key: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
  }>;
  slug?: {
    current: string;
  };
}

interface SanityCourseSection {
  _id: string;
  _key?: string;
  title: string;
  description?: string;
  order: number;
  estimatedDuration?: number;
  isActive?: boolean;
  lectures?: SanityLecture[];
  modules?: SanityModule[];
  assignments?: SanityAssignment[];
  quiz?: SanityQuiz;
  slug?: {
    current: string;
  };
}

interface SanityCourse {
  _id: string;
  title: string;
  description: string;
  sections?: SanityCourseSection[];
  slug: {
    current: string;
  };
}

interface CourseContentManagerProps {
  courseSlug: string;
}

// SortableContentItem component for draggable content items
function SortableContentItem({ 
  item, 
  index, 
  onEdit, 
  badge, 
  duration, 
  color 
}: {
  item: SanityLecture | SanityModule | SanityAssignment | SanityQuiz;
  index: number;
  onEdit: () => void;
  badge?: string;
  duration: string;
  color: 'blue' | 'green' | 'orange' | 'purple';
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const colorClasses = {
    blue: 'border-blue-400 text-blue-400',
    green: 'border-green-400 text-green-400', 
    orange: 'border-orange-400 text-orange-400',
    purple: 'border-purple-400 text-purple-400'
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-zinc-900 px-2 sm:px-3 py-2 rounded flex items-center justify-between hover:bg-zinc-800 transition-colors gap-2"
    >
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab hover:cursor-grabbing text-gray-400 hover:text-white flex items-center flex-shrink-0"
        >
          <GripVertical className="w-3 h-3 sm:w-4 sm:h-4" />
        </div>
        <span className="text-[10px] sm:text-xs text-gray-400 w-4 sm:w-6 flex-shrink-0">
          {('order' in item ? item.order : 0) || index + 1}.
        </span>
        <span className="text-xs sm:text-sm text-white truncate flex-1 min-w-0">
          {item.title}
        </span>
      </div>
      <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
        {badge && (
          <Badge variant="outline" className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0 ${colorClasses[color]}`}>
            {badge}
          </Badge>
        )}
        <span className="text-[10px] sm:text-xs text-gray-400">
          {duration}
        </span>
        <div 
          className="h-5 w-5 sm:h-6 sm:w-6 p-0 text-gray-400 hover:text-white cursor-pointer flex items-center justify-center"
          onClick={onEdit}
        >
          <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
        </div>
      </div>
    </div>
  );
}

// Sortable Section Component
function SortableSection({ 
  section, 
  index, 
  onSectionUpdate, 
  onSectionDelete,
  onContentEdit,
  onContentDragEnd,
  onAddContent
}: {
  section: SanityCourseSection;
  index: number;
  onSectionUpdate: (sectionId: string, updates: Partial<SanityCourseSection>) => void;
  onSectionDelete: (sectionId: string) => void;
  onContentEdit: (contentType: string, contentId: string, sectionId: string) => void;
  onContentDragEnd: (event: DragEndEvent, contentType: string, sectionId: string) => void;
  onAddContent: (contentType: string, sectionId: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editForm, setEditForm] = useState({
    title: section.title,
    description: section.description || ''
  });

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `${section._id}-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSave = () => {
    onSectionUpdate(section._id, {
      title: editForm.title,
      description: editForm.description
    });
    setIsEditing(false);
  };

  // Calculate section statistics
  const lectureCount = section.lectures?.length || 0;
  const moduleCount = section.modules?.length || 0;
  const assignmentCount = section.assignments?.length || 0;
  const hasQuiz = section.quiz ? 1 : 0;
  const totalItems = lectureCount + moduleCount + assignmentCount + hasQuiz;

  // Calculate total duration
  const lectureDuration = section.lectures?.reduce((sum, lecture) => sum + (lecture.duration || 0), 0) || 0;
  const moduleDuration = section.modules?.reduce((sum, module) => sum + (module.estimatedReadTime || 0), 0) || 0;
  const totalDuration = lectureDuration + moduleDuration;

  return (
    <div ref={setNodeRef} style={style}>
      <AccordionItem
        value={`section-${index}`}
        className="border bg-black border-gray-700 mb-2"
      >
        <AccordionTrigger className="group px-2 sm:px-4 py-2 sm:py-3 hover:no-underline [&>svg]:hidden">
          <div className="flex w-full items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab hover:cursor-grabbing text-gray-400 hover:text-white flex items-center flex-shrink-0"
              >
                <GripVertical className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              
              {isEditing ? (
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <Input
                    value={editForm.title}
                    onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white text-sm min-w-[150px] sm:min-w-[200px]"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSave();
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white p-1.5 sm:px-2.5 sm:py-2 rounded cursor-pointer flex items-center"
                  >
                    <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditing(false);
                    }}
                    className="border border-gray-600 text-gray-300 hover:bg-gray-700 p-1.5 sm:px-2.5 sm:py-2 rounded cursor-pointer flex items-center"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                  <span className="text-left text-white text-xs sm:text-sm font-medium truncate">
                    Section {section.order || index + 1}: {section.title}
                  </span>
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditing(true);
                    }}
                    className="text-gray-400 hover:text-white h-5 w-5 sm:h-6 sm:w-6 p-0 cursor-pointer flex items-center justify-center flex-shrink-0"
                  >
                    <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              <div className="text-[10px] sm:text-sm text-gray-400 whitespace-nowrap">
                {totalItems} items • {totalDuration}min
              </div>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteDialog(true);
                }}
                className="text-red-400 hover:text-red-300 hover:bg-red-900/20 h-6 w-6 sm:h-7 sm:w-7 p-0 cursor-pointer flex items-center justify-center rounded flex-shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
          </div>
        </AccordionTrigger>
        
        <AccordionContent className="p-0">
          <div className="px-2 sm:px-4 pb-3 sm:pb-4 space-y-2 sm:space-y-3">
            {/* Section Description */}
            {isEditing && (
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Section description..."
                className="bg-gray-700 border-gray-600 text-white text-sm"
                rows={2}
              />
            )}
            
            {/* Sub-accordion for content types */}
            <Accordion type="multiple" className="space-y-1">
              {/* Lectures Sub-section */}
              {section.lectures && section.lectures.length > 0 && (
                <AccordionItem value="lectures" className="border-none">
                  <AccordionTrigger className="py-2 px-3 bg-gray-750 text-sm hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4 text-blue-400" />
                      <span className="text-blue-400 font-medium">
                        Lectures ({section.lectures.length})
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 space-y-1">
                    <DndContext collisionDetection={closestCenter} onDragEnd={(event) => onContentDragEnd(event, 'lectures', section._id)}>
                      <SortableContext items={section.lectures.map(l => l._id)} strategy={verticalListSortingStrategy}>
                        {section.lectures
                          .sort((a, b) => (a.order || 0) - (b.order || 0))
                          .map((lecture, lectureIndex) => (
                            <SortableContentItem
                              key={lecture._id}
                              item={lecture}
                              index={lectureIndex}
                              onEdit={() => onContentEdit('lecture', lecture._id, section._id)}
                              badge={lecture.isPreview ? "Preview" : undefined}
                              duration={`${lecture.duration || 0}min`}
                              color="blue"
                            />
                          ))}
                      </SortableContext>
                    </DndContext>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Modules Sub-section */}
              {section.modules && section.modules.length > 0 && (
                <AccordionItem value="modules" className="border-none">
                  <AccordionTrigger className="py-2 px-3 bg-gray-750 text-sm hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Book className="w-4 h-4 text-green-400" />
                      <span className="text-green-400 font-medium">
                        Study Modules ({section.modules.length})
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 space-y-1">
                    <DndContext collisionDetection={closestCenter} onDragEnd={(event) => onContentDragEnd(event, 'modules', section._id)}>
                      <SortableContext items={section.modules.map(m => m._id)} strategy={verticalListSortingStrategy}>
                        {section.modules
                          .sort((a, b) => (a.order || 0) - (b.order || 0))
                          .map((module, moduleIndex) => (
                            <SortableContentItem
                              key={module._id}
                              item={module}
                              index={moduleIndex}
                              onEdit={() => onContentEdit('module', module._id, section._id)}
                              badge={module.moduleType?.toUpperCase()}
                              duration={`${module.estimatedReadTime || 0}min read`}
                              color="green"
                            />
                          ))}
                      </SortableContext>
                    </DndContext>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Assignments Sub-section */}
              {section.assignments && section.assignments.length > 0 && (
                <AccordionItem value="assignments" className="border-none">
                  <AccordionTrigger className="py-2 px-3 bg-gray-750 text-sm hover:no-underline">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-orange-400" />
                      <span className="text-orange-400 font-medium">
                        Assignments ({section.assignments.length})
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 space-y-1">
                    <DndContext collisionDetection={closestCenter} onDragEnd={(event) => onContentDragEnd(event, 'assignments', section._id)}>
                      <SortableContext items={section.assignments.map(a => a._id)} strategy={verticalListSortingStrategy}>
                        {section.assignments
                          .sort((a, b) => (a.order || 0) - (b.order || 0))
                          .map((assignment, assignmentIndex) => (
                            <SortableContentItem
                              key={assignment._id}
                              item={assignment}
                              index={assignmentIndex}
                              onEdit={() => onContentEdit('assignment', assignment._id, section._id)}
                              badge={assignment.submissionType?.toUpperCase()}
                              duration={`${assignment.totalPoints || 0} pts`}
                              color="orange"
                            />
                          ))}
                      </SortableContext>
                    </DndContext>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Quiz Sub-section */}
              {section.quiz && (
                <AccordionItem value="quiz" className="border-none">
                  <AccordionTrigger className="py-2 px-3 bg-gray-750 text-sm hover:no-underline">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-purple-400" />
                      <span className="text-purple-400 font-medium">
                        Section Quiz
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2">
                    <div className="bg-zinc-900 px-3 py-2 rounded flex items-center justify-between hover:bg-zinc-800 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-white">
                          {section.quiz.title}
                        </span>
                        {section.quiz.questions && (
                          <Badge variant="outline" className="text-xs border-purple-400 text-purple-400">
                            {section.quiz.questions.length} QUESTIONS
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400">
                          {section.quiz.timeLimit || 0}min
                        </span>
                        <div 
                          className="h-6 w-6 p-0 text-gray-400 hover:text-white cursor-pointer flex items-center justify-center"
                          onClick={() => onContentEdit('quiz', section.quiz!._id, section._id)}
                        >
                          <Edit2 className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>

            {/* Add Content Buttons */}
            <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-700">
              <div 
                className="border border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white text-xs px-2 py-1 rounded cursor-pointer flex items-center transition-colors"
                onClick={() => onAddContent('lecture', section._id)}
              >
                <Plus className="w-3 h-3 mr-1" /> Lecture
              </div>
              <div 
                className="border border-green-400 text-green-400 hover:bg-green-400 hover:text-white text-xs px-2 py-1 rounded cursor-pointer flex items-center transition-colors"
                onClick={() => onAddContent('module', section._id)}
              >
                <Plus className="w-3 h-3 mr-1" /> Module
              </div>
              <div 
                className="border border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-white text-xs px-2 py-1 rounded cursor-pointer flex items-center transition-colors"
                onClick={() => onAddContent('assignment', section._id)}
              >
                <Plus className="w-3 h-3 mr-1" /> Assignment
              </div>
              <div 
                className="border border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white text-xs px-2 py-1 rounded cursor-pointer flex items-center transition-colors"
                onClick={() => onAddContent('quiz', section._id)}
              >
                <Plus className="w-3 h-3 mr-1" /> Quiz
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-[#111] border border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Section</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to delete this section? This action cannot be undone
              and all content within this section will be removed from the course.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onSectionDelete(section._id)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function CourseContentManager({ courseSlug }: CourseContentManagerProps) {
  const [course, setCourse] = useState<SanityCourse | null>(null);
  const [sections, setSections] = useState<SanityCourseSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  
  // Edit modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<{
    type: 'lecture' | 'module' | 'assignment' | 'quiz';
    id: string;
    sectionId: string;
    data: any;
  } | null>(null);
  
  // Add section modal state
  const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState(false);
  const [newSectionData, setNewSectionData] = useState({
    title: '',
    description: ''
  });

  // Lock body scroll when any modal is open
  useEffect(() => {
    if (isEditModalOpen || isAddSectionModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isEditModalOpen, isAddSectionModalOpen]);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchCourseData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch course with expanded sections and content
      const courseData = await safeClient.fetch(
        `*[_type == "course" && slug.current == $slug][0] {
          _id,
          title,
          description,
          slug,
          sections[]-> {
            _id,
            title,
            description,
            order,
            estimatedDuration,
            isActive,
            slug,
            lectures[]-> {
              _id,
              title,
              description,
              duration,
              videoUrl,
              order,
              isPreview,
              slug
            },
            modules[]-> {
              _id,
              title,
              description,
              moduleType,
              estimatedReadTime,
              order,
              slug
            },
            assignments[]-> {
              _id,
              title,
              description,
              totalPoints,
              dueDate,
              submissionType,
              order,
              slug
            },
            quiz-> {
              _id,
              title,
              description,
              timeLimit,
              passingScore,
              questions,
              slug
            }
          }
        }`,
        { slug: courseSlug }
      ) as SanityCourse | null;

      if (courseData) {
        setCourse(courseData);
        // Sort sections by order
        const sortedSections = (courseData.sections || []).sort((a: SanityCourseSection, b: SanityCourseSection) => 
          (a.order || 0) - (b.order || 0)
        );
        setSections(sortedSections);
      } else {
        toast.error('Course not found');
      }
    } catch (error) {
toast.error('Failed to load course data');
    } finally {
      setLoading(false);
    }
  }, [courseSlug]);

  useEffect(() => {
    fetchCourseData();
  }, [fetchCourseData]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      // Extract index from composite ID (format: sectionId-index)
      const activeIdStr = String(active.id);
      const overIdStr = String(over.id);
      const oldIndex = parseInt(activeIdStr.split('-').pop() || '0');
      const newIndex = parseInt(overIdStr.split('-').pop() || '0');

      if (isNaN(oldIndex) || isNaN(newIndex) || oldIndex === newIndex) return;

      const reorderedSections = arrayMove(sections, oldIndex, newIndex).map((section, index) => ({
        ...section,
        order: index + 1
      }));

      setSections(reorderedSections);
      
      // Update order in Sanity for each section
      try {
        await Promise.all(
          reorderedSections.map(section =>
            writeClient.patch(section._id).set({ order: section.order }).commit()
          )
        );
        
        // Also update the course's sections array order
        if (course) {
          const reorderedRefs = reorderedSections.map(s => ({
            _type: 'reference',
            _ref: s._id,
            _key: s._id
          }));
          await writeClient.patch(course._id).set({ sections: reorderedRefs }).commit();
        }
        
        toast.success('Section order updated');
      } catch (error) {
        toast.error('Failed to update section order');
        // Revert on error
        fetchCourseData();
      }
    }
  };

  const handleSectionUpdate = async (sectionId: string, updates: Partial<SanityCourseSection>) => {
    try {
      await writeClient.patch(sectionId).set(updates).commit();
      setSections(sections.map(section =>
        section._id === sectionId ? { ...section, ...updates } : section
      ));
      toast.success('Section updated');
    } catch (error) {
toast.error('Failed to update section');
    }
  };

  const handleContentDragEnd = async (event: DragEndEvent, contentType: string, sectionId: string) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const section = sections.find(s => s._id === sectionId);
    if (!section) return;

    const contentArray = section[contentType as keyof SanityCourseSection] as (SanityLecture | SanityModule | SanityAssignment)[];
    if (!contentArray) return;

    const oldIndex = contentArray.findIndex(item => item._id === active.id);
    const newIndex = contentArray.findIndex(item => item._id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reorderedContent = arrayMove(contentArray, oldIndex, newIndex);
      
      // Update order values
      const updatedContent = reorderedContent.map((item, index) => ({
        ...item,
        order: index + 1
      }));

      // Update local state
      setSections(sections.map(s => 
        s._id === sectionId 
          ? { ...s, [contentType]: updatedContent }
          : s
      ));

      try {
        // Update order in Sanity for each item
        await Promise.all(
          updatedContent.map(item => 
            writeClient.patch(item._id).set({ order: item.order }).commit()
          )
        );
        toast.success(`${contentType} order updated`);
      } catch (error) {
toast.error(`Failed to update ${contentType} order`);
        fetchCourseData(); // Revert on error
      }
    }
  };

  const handleAddContent = async (contentType: string, sectionId: string) => {
    try {
let newContent;
      
      switch (contentType) {
        case 'lecture':
          newContent = await writeClient.create({
            _type: 'lecture',
            title: 'New Lecture',
            description: '',
            duration: 0,
            videoUrl: '',
            order: 1,
            isPreview: false,
            slug: {
              _type: 'slug',
              current: `new-lecture-${Date.now()}`
            }
          });
          break;
          
        case 'module':
          newContent = await writeClient.create({
            _type: 'module',
            title: 'New Module',
            description: '',
            moduleType: 'reading',
            estimatedReadTime: 0,
            content: '',
            order: 1,
            slug: {
              _type: 'slug',
              current: `new-module-${Date.now()}`
            }
          });
          break;
          
        case 'assignment':
          newContent = await writeClient.create({
            _type: 'assignment',
            title: 'New Assignment',
            description: '',
            totalPoints: 100,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
            submissionType: 'file',
            instructions: '',
            order: 1,
            slug: {
              _type: 'slug',
              current: `new-assignment-${Date.now()}`
            }
          });
          break;
          
        case 'quiz':
          newContent = await writeClient.create({
            _type: 'quiz',
            title: 'New Quiz',
            description: '',
            timeLimit: 30,
            passingScore: 70,
            questions: [],
            slug: {
              _type: 'slug',
              current: `new-quiz-${Date.now()}`
            }
          });
          break;
          
        default:
          toast.error('Unknown content type');
          return;
      }
// Add content reference to section
      const section = sections.find(s => s._id === sectionId);
      if (section && newContent) {
        const contentArrayKey = contentType === 'quiz' ? 'quiz' : `${contentType}s`;
        const currentContent = (section as any)[contentArrayKey] || [];
        
        if (contentType === 'quiz') {
          // Quiz is a single reference, not an array
          await writeClient.patch(sectionId).set({
            quiz: { _type: 'reference', _ref: newContent._id }
          }).commit();
        } else {
          // Lectures, modules, assignments are arrays
          const currentRefs = currentContent.map((item: any) => ({ _type: 'reference', _ref: item._id }));
          await writeClient.patch(sectionId).set({
            [contentArrayKey]: [...currentRefs, { _type: 'reference', _ref: newContent._id }]
          }).commit();
        }
// Refresh course data
        fetchCourseData();
        toast.success(`New ${contentType} added successfully!`);
      }
    } catch (error: any) {
// Handle specific permission errors with helpful messages
      if (error.message?.includes('permission') || error.message?.includes('create')) {
        toast.error(`Insufficient permissions to create ${contentType}. Please check your Sanity API token has write/create permissions.`);
      } else if (error.message?.includes('unauthorized')) {
        toast.error('Unauthorized. Please check your Sanity authentication.');
      } else if (error.message?.includes('transaction')) {
        toast.error(`Transaction failed while creating ${contentType}. Please try again.`);
      } else {
        toast.error(`Failed to create ${contentType}. Please try again.`);
      }
    }
  };

  const handleSaveContent = async (contentData: any) => {
    if (!editingContent) return;
    
    try {
// Update content in Sanity with proper error handling
      const result = await writeClient.patch(editingContent.id).set(contentData).commit();
// Update local state
      setSections(sections.map(section => {
        if (section._id === editingContent.sectionId) {
          const contentType = editingContent.type + 's'; // lectures, modules, etc.
          const updatedContent = (section as any)[contentType]?.map((item: any) =>
            item._id === editingContent.id ? { ...item, ...contentData } : item
          );
          return { ...section, [contentType]: updatedContent };
        }
        return section;
      }));
      
      toast.success(`${editingContent.type} updated successfully!`);
      setIsEditModalOpen(false);
      setEditingContent(null);
      
      // Refresh data from Sanity to ensure consistency
      setTimeout(() => fetchCourseData(), 1000);
    } catch (error: any) {
// Handle specific permission errors
      if (error.message?.includes('permission')) {
        toast.error('Insufficient permissions. Please check your Sanity API token has write access.');
      } else if (error.message?.includes('unauthorized')) {
        toast.error('Unauthorized. Please check your Sanity authentication.');
      } else {
        toast.error('Failed to save changes. Please try again.');
      }
    }
  };

  const handleSectionDelete = async (sectionId: string) => {
    try {
      // Remove section reference from course
      if (course) {
        const updatedSectionRefs = course.sections?.filter(section => section._id !== sectionId) || [];
        await writeClient.patch(course._id).set({
          sections: updatedSectionRefs.map(section => ({ _type: 'reference', _ref: section._id }))
        }).commit();
      }
      
      setSections(sections.filter(section => section._id !== sectionId));
      toast.success('Section deleted');
    } catch (error) {
toast.error('Failed to delete section');
    }
  };

  const handleContentEdit = async (contentType: string, contentId: string, sectionId: string) => {
    try {
      // Fetch the specific content data from Sanity
      let contentData;
      
      switch (contentType) {
        case 'lecture':
          contentData = await safeClient.fetch(`*[_id == $id][0]`, { id: contentId });
          break;
        case 'module':
          contentData = await safeClient.fetch(`*[_id == $id][0]`, { id: contentId });
          break;
        case 'assignment':
          contentData = await safeClient.fetch(`*[_id == $id][0]`, { id: contentId });
          break;
        case 'quiz':
          contentData = await safeClient.fetch(`*[_id == $id][0]`, { id: contentId });
          break;
        default:
          toast.error('Unknown content type');
          return;
      }
      
      if (contentData) {
        setEditingContent({
          type: contentType as 'lecture' | 'module' | 'assignment' | 'quiz',
          id: contentId,
          sectionId,
          data: contentData
        });
        setIsEditModalOpen(true);
      } else {
        toast.error('Content not found');
      }
    } catch (error) {
toast.error('Failed to load content for editing');
    }
  };

  const addNewSection = async () => {
    setIsAddSectionModalOpen(true);
  };

  const handleCreateSection = async () => {
    if (!newSectionData.title.trim()) {
      toast.error('Section title is required');
      return;
    }

    try {
// Create new section in Sanity
      const newSection = await writeClient.create({
        _type: 'courseSection',
        title: newSectionData.title,
        description: newSectionData.description,
        order: sections.length + 1,
        isActive: true,
        lectures: [],
        modules: [],
        assignments: []
      });
// Add section reference to course
      if (course) {
        const currentSectionRefs = course.sections?.map(section => ({ _type: 'reference', _ref: section._id })) || [];
        await writeClient.patch(course._id).set({
          sections: [...currentSectionRefs, { _type: 'reference', _ref: newSection._id }]
        }).commit();
}

      // Reset form and close modal
      setNewSectionData({ title: '', description: '' });
      setIsAddSectionModalOpen(false);
      
      // Refresh course data to get the new section with all references
      fetchCourseData();
      toast.success('New section added successfully!');
    } catch (error: any) {
// Handle specific permission errors with helpful messages
      if (error.message?.includes('permission') || error.message?.includes('create')) {
        toast.error('Insufficient permissions to create section. Please check your Sanity API token has write/create permissions.');
      } else if (error.message?.includes('unauthorized')) {
        toast.error('Unauthorized. Please check your Sanity authentication.');
      } else if (error.message?.includes('transaction')) {
        toast.error('Transaction failed while creating section. Please try again.');
      } else {
        toast.error('Failed to create section. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Spinner className="h-8 w-8 text-white mx-auto mb-4" />
          <p className="text-gray-400">Loading course content...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400 mb-4">Course not found</p>
      </div>
    );
  }

  // Calculate course statistics
  const totalSections = sections.length;
  const totalLectures = sections.reduce((sum, section) => sum + (section.lectures?.length || 0), 0);
  const totalModules = sections.reduce((sum, section) => sum + (section.modules?.length || 0), 0);
  const totalAssignments = sections.reduce((sum, section) => sum + (section.assignments?.length || 0), 0);
  const totalQuizzes = sections.reduce((sum, section) => sum + (section.quiz ? 1 : 0), 0);
  const totalDuration = sections.reduce((sum, section) => {
    const lectureDuration = section.lectures?.reduce((lSum, lecture) => lSum + (lecture.duration || 0), 0) || 0;
    const moduleDuration = section.modules?.reduce((mSum, module) => mSum + (module.estimatedReadTime || 0), 0) || 0;
    return sum + lectureDuration + moduleDuration;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Course Content Statistics */}
      <Card className="bg-black border">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2 sm:gap-4">
            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-lg md:text-xl font-semibold text-white truncate">{course.title}</h3>
              <p className="text-xs sm:text-sm text-gray-400 mt-0.5 sm:mt-1">Course Content Management</p>
            </div>
            <div className="text-xs text-gray-400 whitespace-nowrap">
              {totalSections} sections • {totalLectures + totalModules + totalAssignments + totalQuizzes} items • {Math.floor(totalDuration / 60)}h {(totalDuration % 60).toFixed(0)}m
            </div>
          </div>
          
          {/* Stats - Single row on all devices */}
          <div className="flex items-center justify-between gap-2 overflow-hidden py-2">
            <div className="text-center flex-shrink-0 min-w-[50px]">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-400">{totalLectures}</div>
              <div className="text-[10px] sm:text-xs text-gray-400">Lectures</div>
            </div>
            <div className="text-center flex-shrink-0 min-w-[50px]">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-400">{totalModules}</div>
              <div className="text-[10px] sm:text-xs text-gray-400">Modules</div>
            </div>
            <div className="text-center flex-shrink-0 min-w-[50px]">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-orange-400">{totalAssignments}</div>
              <div className="text-[10px] sm:text-xs text-gray-400">Assignments</div>
            </div>
            <div className="text-center flex-shrink-0 min-w-[50px]">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-purple-400">{totalQuizzes}</div>
              <div className="text-[10px] sm:text-xs text-gray-400">Quizzes</div>
            </div>
            <div className="text-center flex-shrink-0 min-w-[60px]">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-white">{Math.floor(totalDuration / 60)}h {(totalDuration % 60).toFixed(0)}m</div>
              <div className="text-[10px] sm:text-xs text-gray-400">Duration</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sections */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={sections.map((s, idx) => `${s._id}-${idx}`)} 
          strategy={verticalListSortingStrategy}
        >
          <Accordion
            type="multiple"
            value={expandedSections}
            onValueChange={setExpandedSections}
            className="space-y-2"
          >
            {sections.map((section, index) => (
              <SortableSection
                key={`section-${section._id}-${index}`}
                section={section}
                index={index}
                onSectionUpdate={handleSectionUpdate}
                onSectionDelete={handleSectionDelete}
                onContentEdit={handleContentEdit}
                onContentDragEnd={handleContentDragEnd}
                onAddContent={handleAddContent}
              />
            ))}
          </Accordion>
        </SortableContext>
      </DndContext>

      {/* Add New Section Button */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button
          onClick={addNewSection}
          variant="outline"
          className="w-full border-dashed border-gray-600 text-gray-400 hover:text-white hover:border-white hover:bg-gray-800 py-6 sm:py-8"
        >
          <Plus className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />
          Add New Section
        </Button>
      </motion.div>

      {/* Edit Content Modal */}
      {isEditModalOpen && editingContent && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 md:p-4 overflow-hidden"
          onClick={() => setIsEditModalOpen(false)}
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          <div 
            className="bg-[#111] border border-gray-700 w-full max-w-2xl max-h-[95vh] md:max-h-[90vh] rounded-lg flex flex-col my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 md:p-6 border-b border-gray-700 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-lg md:text-xl font-bold text-white capitalize">
                  Edit {editingContent.type}
                </h2>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-gray-400 hover:text-white cursor-pointer p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <ScrollArea className="flex-1 max-h-[calc(95vh-100px)] md:max-h-[calc(90vh-100px)]">
              <div className="p-4 md:p-6">
                <ContentEditForm
                  contentType={editingContent.type}
                  contentData={editingContent.data}
                  onSave={handleSaveContent}
                  onCancel={() => setIsEditModalOpen(false)}
                />
              </div>
            </ScrollArea>
          </div>
        </div>
      )}

      {/* Add Section Modal */}
      {isAddSectionModalOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 md:p-4 overflow-y-auto"
          onClick={() => {
            setIsAddSectionModalOpen(false);
            setNewSectionData({ title: '', description: '' });
          }}
        >
          <div 
            className="bg-[#111] border border-gray-700 w-full max-w-md rounded-lg my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 md:p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg md:text-xl font-bold text-white">Add New Section</h2>
                <button
                  onClick={() => {
                    setIsAddSectionModalOpen(false);
                    setNewSectionData({ title: '', description: '' });
                  }}
                  className="text-gray-400 hover:text-white cursor-pointer p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-4 md:p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="section-title" className="text-white">Section Title</Label>
                <Input
                  id="section-title"
                  value={newSectionData.title}
                  onChange={(e) => setNewSectionData(prev => ({ ...prev, title: e.target.value }))}
                  className="bg-black border text-white"
                  placeholder="Enter section title..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="section-description" className="text-white">Description (Optional)</Label>
                <Textarea
                  id="section-description"
                  value={newSectionData.description}
                  onChange={(e) => setNewSectionData(prev => ({ ...prev, description: e.target.value }))}
                  className="bg-black border text-white"
                  placeholder="Enter section description..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddSectionModalOpen(false);
                    setNewSectionData({ title: '', description: '' });
                  }}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateSection}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={!newSectionData.title.trim()}
                >
                  Create Section
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ContentEditForm component for editing different content types
function ContentEditForm({ 
  contentType, 
  contentData, 
  onSave, 
  onCancel 
}: {
  contentType: 'lecture' | 'module' | 'assignment' | 'quiz';
  contentData: any;
  onSave: (data: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState(contentData);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const updateField = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Common fields for all content types */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-white">Title</Label>
        <Input
          id="title"
          value={formData.title || ''}
          onChange={(e) => updateField('title', e.target.value)}
          className="bg-gray-800 border-gray-600 text-white"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-white">Description</Label>
        <Textarea
          id="description"
          value={formData.description || ''}
          onChange={(e) => updateField('description', e.target.value)}
          className="bg-gray-800 border-gray-600 text-white"
          rows={3}
        />
      </div>

      {/* Lecture-specific fields */}
      {contentType === 'lecture' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="videoUrl" className="text-white">YouTube Video URL</Label>
            <Input
              id="videoUrl"
              value={formData.videoUrl || ''}
              onChange={(e) => updateField('videoUrl', e.target.value)}
              className="bg-gray-800 border-gray-600 text-white"
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration" className="text-white">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration || 0}
                onChange={(e) => updateField('duration', parseInt(e.target.value) || 0)}
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-white">Preview Lecture</Label>
              <div className="flex items-center space-x-3 pt-2">
                <Checkbox
                  id="isPreview"
                  checked={formData.isPreview || false}
                  onCheckedChange={(checked) => updateField('isPreview', checked)}
                  className="border-gray-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <label htmlFor="isPreview" className="text-gray-300 text-sm cursor-pointer">
                  Allow preview without enrollment
                </label>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Module-specific fields */}
      {contentType === 'module' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="moduleType" className="text-white">Module Type</Label>
            <Select
              value={formData.moduleType || 'pdf'}
              onValueChange={(value) => updateField('moduleType', value)}
            >
              <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                <SelectValue placeholder="Select module type" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="pdf">PDF Document</SelectItem>
                <SelectItem value="content">Rich Text Content</SelectItem>
                <SelectItem value="link">External Link</SelectItem>
                <SelectItem value="video">Video Resource</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="estimatedReadTime" className="text-white">Estimated Read Time (minutes)</Label>
            <Input
              id="estimatedReadTime"
              type="number"
              value={formData.estimatedReadTime || 0}
              onChange={(e) => updateField('estimatedReadTime', parseInt(e.target.value) || 0)}
              className="bg-gray-800 border-gray-600 text-white"
            />
          </div>
          
          {/* File upload for PDF type */}
          {formData.moduleType === 'pdf' && (
            <div className="space-y-2">
              <Label className="text-white">Upload PDF File</Label>
              <div className="flex items-center gap-4">
                <label className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-center gap-2 px-4 py-8 border-2 border-dashed border-gray-600 rounded-lg hover:border-gray-500 transition-colors bg-gray-800/50">
                    <Upload className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-400">
                      {formData.file?.asset?._ref ? 'File uploaded - Click to replace' : 'Click to upload PDF'}
                    </span>
                  </div>
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          const asset = await writeClient.assets.upload('file', file, {
                            filename: file.name
                          });
                          updateField('file', {
                            _type: 'file',
                            asset: {
                              _type: 'reference',
                              _ref: asset._id
                            }
                          });
                          toast.success('File uploaded successfully!');
                        } catch {
                          toast.error('Failed to upload file');
                        }
                      }
                    }}
                  />
                </label>
                {formData.file?.asset?._ref && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-green-900/30 border border-green-700 rounded">
                    <FileText className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 text-sm">PDF Uploaded</span>
                    <button
                      type="button"
                      onClick={() => updateField('file', null)}
                      className="ml-2 p-1 rounded-full hover:bg-red-500/20 text-green-400 hover:text-red-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* External URL for link/video types */}
          {(formData.moduleType === 'link' || formData.moduleType === 'video') && (
            <div className="space-y-2">
              <Label htmlFor="externalUrl" className="text-white">
                {formData.moduleType === 'video' ? 'Video URL' : 'External Link URL'}
              </Label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="externalUrl"
                  value={formData.externalUrl || ''}
                  onChange={(e) => updateField('externalUrl', e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white pl-10"
                  placeholder={formData.moduleType === 'video' ? 'https://youtube.com/watch?v=...' : 'https://example.com/resource'}
                />
              </div>
            </div>
          )}
          
          {/* Rich text content placeholder */}
          {formData.moduleType === 'content' && (
            <div className="space-y-2">
              <Label htmlFor="content" className="text-white">Module Content</Label>
              <Textarea
                id="content"
                value={typeof formData.content === 'string' ? formData.content : ''}
                onChange={(e) => updateField('content', e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
                rows={8}
                placeholder="Enter module content here..."
              />
            </div>
          )}
        </>
      )}

      {/* Assignment-specific fields */}
      {contentType === 'assignment' && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalPoints" className="text-white">Total Points</Label>
              <Input
                id="totalPoints"
                type="number"
                value={formData.totalPoints || 0}
                onChange={(e) => updateField('totalPoints', parseInt(e.target.value) || 0)}
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-white">Due Date & Time</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.dueDate ? (
                      format(new Date(formData.dueDate), "PPP 'at' HH:mm")
                    ) : (
                      <span className="text-gray-400">Select date & time</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-black border-gray-700" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.dueDate ? new Date(formData.dueDate) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        // Preserve existing time or default to current time
                        const existingDate = formData.dueDate ? new Date(formData.dueDate) : new Date();
                        date.setHours(existingDate.getHours(), existingDate.getMinutes());
                        updateField('dueDate', date.toISOString());
                      }
                    }}
                    initialFocus
                    className="bg-black"
                  />
                  <div className="border-t border-gray-700 p-3 bg-black">
                    <Label className="text-white text-sm mb-2 block">Time</Label>
                    <div className="flex gap-2">
                      <Select
                        value={formData.dueDate ? new Date(formData.dueDate).getHours().toString().padStart(2, '0') : '12'}
                        onValueChange={(hour) => {
                          const date = formData.dueDate ? new Date(formData.dueDate) : new Date();
                          date.setHours(parseInt(hour));
                          updateField('dueDate', date.toISOString());
                        }}
                      >
                        <SelectTrigger className="w-20 bg-black border-gray-700 text-white">
                          <SelectValue placeholder="HH" />
                        </SelectTrigger>
                        <SelectContent className="bg-black border-gray-700">
                          <ScrollArea className="h-48">
                            {Array.from({ length: 24 }, (_, i) => (
                              <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                                {i.toString().padStart(2, '0')}
                              </SelectItem>
                            ))}
                          </ScrollArea>
                        </SelectContent>
                      </Select>
                      <span className="text-white self-center">:</span>
                      <Select
                        value={formData.dueDate ? new Date(formData.dueDate).getMinutes().toString().padStart(2, '0') : '00'}
                        onValueChange={(minute) => {
                          const date = formData.dueDate ? new Date(formData.dueDate) : new Date();
                          date.setMinutes(parseInt(minute));
                          updateField('dueDate', date.toISOString());
                        }}
                      >
                        <SelectTrigger className="w-20 bg-black border-gray-700 text-white">
                          <SelectValue placeholder="MM" />
                        </SelectTrigger>
                        <SelectContent className="bg-black border-gray-700">
                          <ScrollArea className="h-48">
                            {Array.from({ length: 60 }, (_, i) => (
                              <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                                {i.toString().padStart(2, '0')}
                              </SelectItem>
                            ))}
                          </ScrollArea>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-white">Submission Type</Label>
            <Select
              value={formData.submissionType || 'file'}
              onValueChange={(value) => updateField('submissionType', value)}
            >
              <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                <SelectValue placeholder="Select submission type" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="file">File Upload</SelectItem>
                <SelectItem value="text">Text Submission</SelectItem>
                <SelectItem value="url">URL Link</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="instructions" className="text-white">Assignment Instructions</Label>
            <Textarea
              id="instructions"
              value={formData.instructions || ''}
              onChange={(e) => updateField('instructions', e.target.value)}
              className="bg-gray-800 border-gray-600 text-white"
              rows={6}
              placeholder="Detailed instructions for the assignment..."
            />
          </div>
        </>
      )}

      {/* Quiz-specific fields */}
      {contentType === 'quiz' && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="timeLimit" className="text-white">Time Limit (minutes)</Label>
              <Input
                id="timeLimit"
                type="number"
                value={formData.timeLimit || 0}
                onChange={(e) => updateField('timeLimit', parseInt(e.target.value) || 0)}
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="passingScore" className="text-white">Passing Score (%)</Label>
              <Input
                id="passingScore"
                type="number"
                min="0"
                max="100"
                value={formData.passingScore || 70}
                onChange={(e) => updateField('passingScore', parseInt(e.target.value) || 70)}
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-white">Quiz Questions</Label>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  const newQuestion = {
                    id: Date.now(),
                    question: '',
                    options: ['', '', '', ''],
                    correctAnswer: 0
                  };
                  updateField('questions', [...(formData.questions || []), newQuestion]);
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-1" /> Add Question
              </Button>
            </div>
            
            {(formData.questions || []).map((question: any, index: number) => (
              <div key={question.id || index} className="border border-gray-700 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-white">Question {index + 1}</Label>
                  <button
                    type="button"
                    onClick={() => {
                      const updatedQuestions = formData.questions.filter((_: any, i: number) => i !== index);
                      updateField('questions', updatedQuestions);
                    }}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <Input
                  value={question.question || ''}
                  onChange={(e) => {
                    const updatedQuestions = [...formData.questions];
                    updatedQuestions[index] = { ...question, question: e.target.value };
                    updateField('questions', updatedQuestions);
                  }}
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder="Enter question..."
                />
                
                <div className="space-y-2">
                  <Label className="text-white text-sm">Answer Options</Label>
                  {question.options?.map((option: string, optionIndex: number) => (
                    <div key={optionIndex} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name={`correct-${index}`}
                        checked={question.correctAnswer === optionIndex}
                        onChange={() => {
                          const updatedQuestions = [...formData.questions];
                          updatedQuestions[index] = { ...question, correctAnswer: optionIndex };
                          updateField('questions', updatedQuestions);
                        }}
                        className="w-4 h-4"
                      />
                      <Input
                        value={option}
                        onChange={(e) => {
                          const updatedQuestions = [...formData.questions];
                          const updatedOptions = [...question.options];
                          updatedOptions[optionIndex] = e.target.value;
                          updatedQuestions[index] = { ...question, options: updatedOptions };
                          updateField('questions', updatedQuestions);
                        }}
                        className="bg-gray-800 border-gray-600 text-white flex-1"
                        placeholder={`Option ${optionIndex + 1}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="border-gray-600 text-gray-300 hover:bg-gray-700"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Save Changes
        </Button>
      </div>
    </form>
  );
}