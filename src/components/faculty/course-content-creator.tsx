'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  GripVertical,
  Plus,
  Edit3,
  Trash2,
  Save,
  X,
  PlayCircle,
  Book,
  CheckSquare,
  HelpCircle,
  Clock,
} from 'lucide-react';

// Course content interfaces
interface CourseSection {
  _id: string;
  _key?: string;
  title: string;
  description?: string;
  order: number;
  estimatedDuration?: number;
  isActive?: boolean;
  lectures?: ContentItem[];
  modules?: ContentItem[];
  assignments?: ContentItem[];
  quiz?: ContentItem;
}

interface ContentItem {
  _id: string;
  _key?: string;
  title: string;
  description?: string;
  duration?: number;
  order?: number;
  dueDate?: string;
  [key: string]: unknown;
}

interface CourseContentManagerProps {
  initialSections?: CourseSection[];
  onSectionsChange?: (sections: CourseSection[]) => void;
  editable?: boolean;
}

// Sortable Section Component
function SortableSection({ 
  section, 
  index, 
  onSectionUpdate, 
  onSectionDelete,
  onAddContent,
  editable = true
}: {
  section: CourseSection;
  index: number;
  onSectionUpdate: (sectionId: string, updates: Partial<CourseSection>) => void;
  onSectionDelete: (sectionId: string) => void;
  onAddContent: (sectionId: string, contentType: string) => void;
  editable?: boolean;
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
  } = useSortable({ 
    id: section._id,
    disabled: !editable
  });

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
  const moduleDuration = section.modules?.reduce((sum, module) => sum + (module.duration || 0), 0) || 0;
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
              {editable && (
                <div
                  {...attributes}
                  {...listeners}
                  className="cursor-grab hover:cursor-grabbing text-gray-400 hover:text-white flex items-center"
                >
                  <GripVertical className="w-4 h-4" />
                </div>
              )}
              
              {isEditing ? (
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <Input
                    value={editForm.title}
                    onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white text-sm"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span 
                    onClick={handleSave} 
                    className="inline-flex items-center justify-center h-8 w-8 bg-green-600 hover:bg-green-700 text-white rounded cursor-pointer"
                  >
                    <Save className="w-3 h-3" />
                  </span>
                  <span 
                    onClick={() => setIsEditing(false)}
                    className="inline-flex items-center justify-center h-8 w-8 border border-gray-600 text-white rounded cursor-pointer hover:bg-gray-700"
                  >
                    <X className="w-3 h-3" />
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-left text-white font-medium">
                    Section {index + 1}: {section.title}
                  </span>
                  {editable && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEditing(true);
                      }}
                      className="inline-flex items-center justify-center h-6 w-6 text-gray-400 hover:text-white cursor-pointer rounded hover:bg-gray-700"
                    >
                      <Edit3 className="w-3 h-3" />
                    </span>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-sm text-white flex items-center gap-2">
                <span>{totalItems} items</span>
                <Clock className="w-3 h-3" />
                <span>{totalDuration}min</span>
              </div>
              {editable && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Are you sure you want to delete this section?')) {
                      onSectionDelete(section._id);
                    }
                  }}
                  className="inline-flex items-center justify-center h-6 w-6 text-red-400 hover:text-red-300 hover:bg-red-900/20 cursor-pointer rounded"
                >
                  <Trash2 className="w-3 h-3" />
                </span>
              )}
            </div>
          </div>
        </AccordionTrigger>
        
        <AccordionContent className="p-0">
          <div className="px-4 pb-4 space-y-3">
            {/* Section Description */}
            {section.description && (
              <p className="text-sm text-gray-400 mt-2">{section.description}</p>
            )}
            
            {/* Lectures */}
            {section.lectures && section.lectures.map((lecture) => (
              <div
                key={lecture._id}
                className="border-t border-gray-700 bg-gray-750 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="flex items-center gap-3">
                  <PlayCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <div>
                    <div className="text-white font-medium">{lecture.title}</div>
                    <div className="text-sm text-gray-400">{lecture.duration || 0} min</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-7 sm:ml-0">
                  <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">Lecture</span>
                  {editable && (
                    <span className="inline-flex items-center justify-center h-8 w-8 text-gray-400 hover:text-white cursor-pointer rounded hover:bg-gray-700 flex-shrink-0">
                      <Edit3 className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </div>
            ))}

            {/* Modules */}
            {section.modules && section.modules.map((module) => (
              <div
                key={module._id}
                className="border-t border-gray-700 bg-gray-750 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="flex items-center gap-3">
                  <Book className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <div>
                    <div className="text-white font-medium">{module.title}</div>
                    <div className="text-sm text-gray-400">{module.duration || 0} min read</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-7 sm:ml-0">
                  <span className="text-xs bg-green-500 text-white px-2 py-1 rounded">Module</span>
                  {editable && (
                    <span className="inline-flex items-center justify-center h-8 w-8 text-gray-400 hover:text-white cursor-pointer rounded hover:bg-gray-700 flex-shrink-0">
                      <Edit3 className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </div>
            ))}

            {/* Assignments */}
            {section.assignments && section.assignments.map((assignment) => (
              <div
                key={assignment._id}
                className="border-t border-gray-700 bg-gray-750 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="flex items-center gap-3">
                  <CheckSquare className="w-4 h-4 text-orange-400 flex-shrink-0" />
                  <div>
                    <div className="text-white font-medium">{assignment.title}</div>
                    <div className="text-sm text-gray-400">Due: {assignment.dueDate || 'No due date'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-7 sm:ml-0">
                  <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded">Assignment</span>
                  {editable && (
                    <span className="inline-flex items-center justify-center h-8 w-8 text-gray-400 hover:text-white cursor-pointer rounded hover:bg-gray-700 flex-shrink-0">
                      <Edit3 className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </div>
            ))}

            {/* Quiz */}
            {section.quiz && (
              <div className="border-t border-gray-700 bg-gray-750 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <HelpCircle className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <div>
                    <div className="text-white font-medium">{section.quiz.title}</div>
                    <div className="text-sm text-gray-400">Quiz</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-7 sm:ml-0">
                  <span className="text-xs bg-purple-500 text-white px-2 py-1 rounded">Quiz</span>
                  {editable && (
                    <span className="inline-flex items-center justify-center h-8 w-8 text-gray-400 hover:text-white cursor-pointer rounded hover:bg-gray-700 flex-shrink-0">
                      <Edit3 className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Add Content Buttons */}
            {editable && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-700">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => onAddContent(section._id, 'lecture')}
                  className="border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white"
                >
                  <Plus className="w-3 h-3 mr-1" /> Lecture
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => onAddContent(section._id, 'module')}
                  className="border-green-400 text-green-400 hover:bg-green-400 hover:text-white"
                >
                  <Plus className="w-3 h-3 mr-1" /> Module
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => onAddContent(section._id, 'assignment')}
                  className="border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-white"
                >
                  <Plus className="w-3 h-3 mr-1" /> Assignment
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => onAddContent(section._id, 'quiz')}
                  className="border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white"
                >
                  <Plus className="w-3 h-3 mr-1" /> Quiz
                </Button>
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </div>
  );
}

export default function CourseContentManager({ 
  initialSections = [],
  onSectionsChange,
  editable = true
}: CourseContentManagerProps) {
  const [sections, setSections] = useState<CourseSection[]>(initialSections);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Sync sections with parent component
  useEffect(() => {
    if (onSectionsChange) {
      onSectionsChange(sections);
    }
  }, [sections, onSectionsChange]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex((section) => section._id === active.id);
      const newIndex = sections.findIndex((section) => section._id === over.id);

      const reorderedSections = arrayMove(sections, oldIndex, newIndex).map((section, index) => ({
        ...section,
        order: index
      }));

      setSections(reorderedSections);
    }
  };

  const handleSectionUpdate = (sectionId: string, updates: Partial<CourseSection>) => {
    setSections(sections.map(section =>
      section._id === sectionId ? { ...section, ...updates } : section
    ));
  };

  const handleSectionDelete = (sectionId: string) => {
    setSections(sections.filter(section => section._id !== sectionId));
  };

  const handleAddContent = async (sectionId: string, contentType: string) => {
    // For now, just add a placeholder - in real implementation, this would create actual content
    const newContent = {
      _id: `${contentType}_${Date.now()}`,
      _key: `${contentType}_${Date.now()}`,
      title: `New ${contentType.charAt(0).toUpperCase() + contentType.slice(1)}`,
      description: '',
      duration: contentType === 'lecture' ? 10 : contentType === 'module' ? 5 : undefined,
      order: 0
    };

    setSections(sections.map(section => {
      if (section._id === sectionId) {
        if (contentType === 'quiz') {
          return { ...section, quiz: newContent };
        } else {
          const contentArray = section[contentType as keyof CourseSection] as ContentItem[] || [];
          return { 
            ...section, 
            [contentType]: [...contentArray, newContent]
          };
        }
      }
      return section;
    }));

    toast.success(`${contentType.charAt(0).toUpperCase() + contentType.slice(1)} added successfully!`);
  };

  const addNewSection = () => {
    const newSection: CourseSection = {
      _id: `section_${Date.now()}`,
      _key: `section_${Date.now()}`,
      title: 'New Section',
      description: '',
      order: sections.length,
      lectures: [],
      modules: [],
      assignments: []
    };
    setSections([...sections, newSection]);
  };

  // Calculate course statistics
  const totalSections = sections.length;
  const totalLectures = sections.reduce((sum, section) => sum + (section.lectures?.length || 0), 0);
  const totalModules = sections.reduce((sum, section) => sum + (section.modules?.length || 0), 0);
  const totalAssignments = sections.reduce((sum, section) => sum + (section.assignments?.length || 0), 0);
  const totalQuizzes = sections.reduce((sum, section) => sum + (section.quiz ? 1 : 0), 0);
  const totalDuration = sections.reduce((sum, section) => {
    const lectureDuration = section.lectures?.reduce((lSum, lecture) => lSum + (lecture.duration || 0), 0) || 0;
    const moduleDuration = section.modules?.reduce((mSum, module) => mSum + (module.duration || 0), 0) || 0;
    return sum + lectureDuration + moduleDuration;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Course Content Statistics */}
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white">Course Content Overview</h3>
            <div className="text-sm text-gray-400">
              {totalSections} sections • {totalLectures + totalModules + totalAssignments + totalQuizzes} items • {Math.floor(totalDuration / 60)}h {totalDuration % 60}m
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{totalLectures}</div>
              <div className="text-sm text-gray-400">Lectures</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{totalModules}</div>
              <div className="text-sm text-gray-400">Modules</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400">{totalAssignments}</div>
              <div className="text-sm text-gray-400">Assignments</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{totalQuizzes}</div>
              <div className="text-sm text-gray-400">Quizzes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{Math.floor(totalDuration / 60)}h {totalDuration % 60}m</div>
              <div className="text-sm text-gray-400">Duration</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sections */}
      {editable ? (
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
                  onAddContent={handleAddContent}
                  editable={editable}
                />
              ))}
            </Accordion>
          </SortableContext>
        </DndContext>
      ) : (
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
              onAddContent={handleAddContent}
              editable={editable}
            />
          ))}
        </Accordion>
      )}

      {/* Add New Section Button */}
      {editable && (
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            onClick={addNewSection}
            variant="outline"
            className="w-full border-dashed border-gray-600 text-gray-400 hover:text-white hover:border-white hover:bg-gray-800 py-8"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Section
          </Button>
        </motion.div>
      )}
    </div>
  );
}