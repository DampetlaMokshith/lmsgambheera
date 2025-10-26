'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
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
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
  X
} from 'lucide-react';
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
      className="bg-gray-700 px-3 py-2 rounded flex items-center justify-between hover:bg-gray-650 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab hover:cursor-grabbing text-gray-400 hover:text-white flex items-center"
        >
          <GripVertical className="w-3 h-3" />
        </div>
        <span className="text-xs text-gray-400 w-6">
          {('order' in item ? item.order : 0) || index + 1}.
        </span>
        <span className="text-sm text-white flex-1">
          {item.title}
        </span>
        {badge && (
          <Badge variant="outline" className={`text-xs ${colorClasses[color]}`}>
            {badge}
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-400">
          {duration}
        </span>
        <div 
          className="h-6 w-6 p-0 text-gray-400 hover:text-white cursor-pointer flex items-center justify-center"
          onClick={onEdit}
        >
          <Edit2 className="w-3 h-3" />
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
  } = useSortable({ id: section._id });

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
        className="border bg-gray-800 border-gray-700 rounded-lg mb-2"
      >
        <AccordionTrigger className="group px-4 py-3 hover:no-underline [&>svg]:hidden">
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab hover:cursor-grabbing text-gray-400 hover:text-white flex items-center"
              >
                <GripVertical className="w-4 h-4" />
              </div>
              
              {isEditing ? (
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <Input
                    value={editForm.title}
                    onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white text-sm min-w-[200px]"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSave();
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs cursor-pointer flex items-center"
                  >
                    <Save className="w-3 h-3" />
                  </div>
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditing(false);
                    }}
                    className="border border-gray-600 text-gray-300 hover:bg-gray-700 px-2 py-1 rounded text-xs cursor-pointer flex items-center"
                  >
                    <X className="w-3 h-3" />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-left text-white font-medium">
                    Section {section.order || index + 1}: {section.title}
                  </span>
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditing(true);
                    }}
                    className="text-gray-400 hover:text-white h-6 w-6 p-0 cursor-pointer flex items-center justify-center"
                  >
                    <Edit2 className="w-3 h-3" />
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-sm text-white">
                {totalItems} items • {totalDuration}min
              </div>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onSectionDelete(section._id);
                }}
                className="text-red-400 hover:text-red-300 hover:bg-red-900/20 h-6 w-6 p-0 cursor-pointer flex items-center justify-center rounded"
              >
                <Trash2 className="w-3 h-3" />
              </div>
            </div>
          </div>
        </AccordionTrigger>
        
        <AccordionContent className="p-0">
          <div className="px-4 pb-4 space-y-3">
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
                  <AccordionTrigger className="py-2 px-3 bg-gray-750 rounded-md text-sm hover:no-underline">
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
                  <AccordionTrigger className="py-2 px-3 bg-gray-750 rounded-md text-sm hover:no-underline">
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
                  <AccordionTrigger className="py-2 px-3 bg-gray-750 rounded-md text-sm hover:no-underline">
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
                  <AccordionTrigger className="py-2 px-3 bg-gray-750 rounded-md text-sm hover:no-underline">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-purple-400" />
                      <span className="text-purple-400 font-medium">
                        Section Quiz
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2">
                    <div className="bg-gray-700 px-3 py-2 rounded flex items-center justify-between hover:bg-gray-650 transition-colors">
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
      console.error('❌ Error fetching course data:', error);
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
      const oldIndex = sections.findIndex((section) => section._id === active.id);
      const newIndex = sections.findIndex((section) => section._id === over.id);

      const reorderedSections = arrayMove(sections, oldIndex, newIndex).map((section, index) => ({
        ...section,
        order: index + 1
      }));

      setSections(reorderedSections);
      
      // Update order in Sanity
      try {
        await Promise.all(
          reorderedSections.map(section =>
            writeClient.patch(section._id).set({ order: section.order }).commit()
          )
        );
        toast.success('Section order updated');
      } catch (error) {
        console.error('❌ Error updating section order:', error);
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
      console.error('❌ Error updating section:', error);
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
        console.error(`❌ Error updating ${contentType} order:`, error);
        toast.error(`Failed to update ${contentType} order`);
        fetchCourseData(); // Revert on error
      }
    }
  };

  const handleAddContent = async (contentType: string, sectionId: string) => {
    try {
      console.log(`🔄 Creating new ${contentType} for section:`, sectionId);
      
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

      console.log(`✅ Created ${contentType}:`, newContent._id);

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
        
        console.log(`✅ Added ${contentType} reference to section`);
        
        // Refresh course data
        fetchCourseData();
        toast.success(`New ${contentType} added successfully!`);
      }
    } catch (error: any) {
      console.error(`❌ Error creating ${contentType}:`, error);
      
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
      console.log('🔄 Saving content:', editingContent.type, editingContent.id);
      
      // Update content in Sanity with proper error handling
      const result = await writeClient.patch(editingContent.id).set(contentData).commit();
      console.log('✅ Sanity save result:', result);
      
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
      console.error('❌ Error saving content:', error);
      
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
    if (!confirm('Are you sure you want to delete this section? This will also remove it from the course.')) {
      return;
    }

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
      console.error('❌ Error deleting section:', error);
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
      console.error('❌ Error fetching content for edit:', error);
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
      console.log('🔄 Creating new section:', newSectionData.title);
      
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

      console.log('✅ Created section:', newSection._id);

      // Add section reference to course
      if (course) {
        const currentSectionRefs = course.sections?.map(section => ({ _type: 'reference', _ref: section._id })) || [];
        await writeClient.patch(course._id).set({
          sections: [...currentSectionRefs, { _type: 'reference', _ref: newSection._id }]
        }).commit();
        
        console.log('✅ Added section reference to course');
      }

      // Reset form and close modal
      setNewSectionData({ title: '', description: '' });
      setIsAddSectionModalOpen(false);
      
      // Refresh course data to get the new section with all references
      fetchCourseData();
      toast.success('New section added successfully!');
    } catch (error: any) {
      console.error('❌ Error creating section:', error);
      
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
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
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
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
            <div>
              <h3 className="text-lg sm:text-xl font-semibold text-white">{course.title}</h3>
              <p className="text-sm text-gray-400 mt-1">Course Content Management</p>
            </div>
            <div className="text-xs sm:text-sm text-gray-400">
              {totalSections} sections • {totalLectures + totalModules + totalAssignments + totalQuizzes} items • {Math.floor(totalDuration / 60)}h {totalDuration % 60}m
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-blue-400">{totalLectures}</div>
              <div className="text-xs sm:text-sm text-gray-400">Lectures</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-green-400">{totalModules}</div>
              <div className="text-xs sm:text-sm text-gray-400">Modules</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-orange-400">{totalAssignments}</div>
              <div className="text-xs sm:text-sm text-gray-400">Assignments</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-purple-400">{totalQuizzes}</div>
              <div className="text-xs sm:text-sm text-gray-400">Quizzes</div>
            </div>
            <div className="text-center col-span-2 sm:col-span-3 lg:col-span-1">
              <div className="text-xl sm:text-2xl font-bold text-white">{Math.floor(totalDuration / 60)}h {totalDuration % 60}m</div>
              <div className="text-xs sm:text-sm text-gray-400">Duration</div>
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
        <SortableContext items={sections.map(s => s._id)} strategy={verticalListSortingStrategy}>
          <Accordion
            type="multiple"
            value={expandedSections}
            onValueChange={setExpandedSections}
            className="space-y-2"
          >
            {sections.map((section, index) => (
              <SortableSection
                key={section._id}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white capitalize">
                  Edit {editingContent.type}
                </h2>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <ContentEditForm
                contentType={editingContent.type}
                contentData={editingContent.data}
                onSave={handleSaveContent}
                onCancel={() => setIsEditModalOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Add Section Modal */}
      {isAddSectionModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg border border-gray-700 w-full max-w-md">
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Add New Section</h2>
                <button
                  onClick={() => {
                    setIsAddSectionModalOpen(false);
                    setNewSectionData({ title: '', description: '' });
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="section-title" className="text-white">Section Title</Label>
                <Input
                  id="section-title"
                  value={newSectionData.title}
                  onChange={(e) => setNewSectionData(prev => ({ ...prev, title: e.target.value }))}
                  className="bg-gray-800 border-gray-600 text-white"
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
                  className="bg-gray-800 border-gray-600 text-white"
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
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isPreview || false}
                  onChange={(e) => updateField('isPreview', e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-gray-300">Allow preview without enrollment</span>
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
            <select
              id="moduleType"
              value={formData.moduleType || 'reading'}
              onChange={(e) => updateField('moduleType', e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2"
            >
              <option value="reading">Reading</option>
              <option value="interactive">Interactive</option>
              <option value="reference">Reference</option>
            </select>
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
          
          <div className="space-y-2">
            <Label htmlFor="content" className="text-white">Module Content</Label>
            <Textarea
              id="content"
              value={formData.content || ''}
              onChange={(e) => updateField('content', e.target.value)}
              className="bg-gray-800 border-gray-600 text-white"
              rows={8}
              placeholder="Module content in markdown format..."
            />
          </div>
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
              <Label htmlFor="dueDate" className="text-white">Due Date</Label>
              <Input
                id="dueDate"
                type="datetime-local"
                value={formData.dueDate ? new Date(formData.dueDate).toISOString().slice(0, 16) : ''}
                onChange={(e) => updateField('dueDate', e.target.value ? new Date(e.target.value).toISOString() : null)}
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="submissionType" className="text-white">Submission Type</Label>
            <select
              id="submissionType"
              value={formData.submissionType || 'file'}
              onChange={(e) => updateField('submissionType', e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2"
            >
              <option value="file">File Upload</option>
              <option value="text">Text Submission</option>
              <option value="url">URL Link</option>
            </select>
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
                <Plus className="w-3 h-3 mr-1" /> Add Question
              </Button>
            </div>
            
            {(formData.questions || []).map((question: any, index: number) => (
              <div key={question.id || index} className="border border-gray-700 rounded-lg p-4 space-y-3">
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