'use client';

import React, { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  GripVertical, 
  Plus, 
  Trash2, 
  Edit3, 
  PlayCircle, 
  CheckSquare, 
  HelpCircle,
  Save,
  X,
  Book
} from 'lucide-react';

// Types based on Sanity schema
interface CourseSection {
  _id: string;
  _key: string;
  title: string;
  description?: string;
  lectures?: Lecture[];
  modules?: Module[];
  assignments?: Assignment[];
  quiz?: Quiz;
  order: number;
}

interface Lecture {
  _id: string;
  _key: string;
  title: string;
  description?: string;
  duration?: number; // in minutes
  videoUrl?: string;
  order: number;
}

interface Module {
  _id: string;
  _key: string;
  title: string;
  description?: string;
  content?: string;
  estimatedReadTime?: number; // in minutes
  moduleType: 'reading' | 'document' | 'resource';
  order: number;
}

interface Assignment {
  _id: string;
  _key: string;
  title: string;
  description?: string;
  instructions?: string;
  totalPoints?: number;
  dueDate?: string;
  order: number;
}

interface Quiz {
  _id: string;
  _key: string;
  title: string;
  description?: string;
  questions: QuizQuestion[];
  timeLimit?: number; // in minutes
  passingScore?: number;
}

interface QuizQuestion {
  _id: string;
  _key: string;
  questionText: string;
  questionType: 'multiple-choice' | 'true-false' | 'short-answer';
  options?: string[];
  correctAnswer?: string | number;
  points: number;
}

interface CourseContentEditorProps {
  sections: CourseSection[];
  onSectionsChange: (sections: CourseSection[]) => void;
}

// Sortable Section Component
function SortableSection({ 
  section, 
  index, 
  onSectionUpdate, 
  onSectionDelete
}: {
  section: CourseSection;
  index: number;
  onSectionUpdate: (sectionId: string, updates: Partial<CourseSection>) => void;
  onSectionDelete: (sectionId: string) => void;
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
          <div className="flex w-full items-center justify-between pr-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
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
                    className="bg-gray-700 border-gray-600 text-white text-sm"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Button size="sm" onClick={handleSave} className="bg-green-600 hover:bg-green-700 flex-shrink-0">
                    <Save className="w-3 h-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setIsEditing(false)}
                    className="border-gray-600 flex-shrink-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-left text-white font-medium truncate">
                    Section {index + 1}: {section.title}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditing(true);
                    }}
                    className="text-gray-400 hover:text-white h-6 w-6 p-0 flex-shrink-0"
                  >
                    <Edit3 className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="text-sm text-white whitespace-nowrap">
                {totalItems} items • {totalDuration}min
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onSectionDelete(section._id);
                }}
                className="text-red-400 hover:text-red-300 hover:bg-red-900/20 h-6 w-6 p-0"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </AccordionTrigger>
        
        <AccordionContent className="p-0">
          <div className="px-4 pb-4 space-y-3 mt-2">
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
            
            {/* Lectures */}
            {section.lectures && section.lectures.map((lecture, lectureIndex) => (
              <div
                key={lecture._id}
                className="border-t border-gray-700 bg-gray-750 px-4 py-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <PlayCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span className="text-sm text-white truncate">
                    {lectureIndex + 1}. {lecture.title}
                  </span>
                  <Badge variant="outline" className="text-xs border-blue-400 text-blue-400 flex-shrink-0">
                    Lecture
                  </Badge>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <span className="text-xs text-white whitespace-nowrap">
                    {lecture.duration || 0}min
                  </span>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-gray-400 hover:text-white">
                    <Edit3 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}

            {/* Modules */}
            {section.modules && section.modules.map((module, moduleIndex) => (
              <div
                key={module._id}
                className="border-t border-gray-700 bg-gray-750 px-4 py-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Book className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span className="text-sm text-white truncate">
                    {moduleIndex + 1}. {module.title}
                  </span>
                  <Badge variant="outline" className="text-xs border-green-400 text-green-400 flex-shrink-0">
                    {module.moduleType}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <span className="text-xs text-white whitespace-nowrap">
                    {module.estimatedReadTime || 0}min read
                  </span>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-gray-400 hover:text-white">
                    <Edit3 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}

            {/* Assignments */}
            {section.assignments && section.assignments.map((assignment, assignmentIndex) => (
              <div
                key={assignment._id}
                className="border-t border-gray-700 bg-gray-750 px-4 py-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <CheckSquare className="w-4 h-4 text-orange-400 flex-shrink-0" />
                  <span className="text-sm text-white truncate">
                    {assignmentIndex + 1}. {assignment.title}
                  </span>
                  <Badge variant="outline" className="text-xs border-orange-400 text-orange-400 flex-shrink-0">
                    Assignment
                  </Badge>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <span className="text-xs text-white whitespace-nowrap">
                    {assignment.totalPoints || 0} pts
                  </span>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-gray-400 hover:text-white">
                    <Edit3 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}

            {/* Quiz */}
            {section.quiz && (
              <div className="border-t border-gray-700 bg-gray-750 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <HelpCircle className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span className="text-sm text-white truncate">
                    {section.quiz.title}
                  </span>
                  <Badge variant="outline" className="text-xs border-purple-400 text-purple-400 flex-shrink-0">
                    Quiz
                  </Badge>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <span className="text-xs text-white whitespace-nowrap">
                    {section.quiz.questions?.length || 0} questions • {section.quiz.timeLimit || 0}min
                  </span>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-gray-400 hover:text-white">
                    <Edit3 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )}

            {/* Add Content Buttons */}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white"
              >
                <Plus className="w-3 h-3 mr-1" /> Lecture
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="border-green-400 text-green-400 hover:bg-green-400 hover:text-white"
              >
                <Plus className="w-3 h-3 mr-1" /> Module
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-white"
              >
                <Plus className="w-3 h-3 mr-1" /> Assignment
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white"
              >
                <Plus className="w-3 h-3 mr-1" /> Quiz
              </Button>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </div>
  );
}

export default function CourseContentEditor({ 
  sections, 
  onSectionsChange
}: CourseContentEditorProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex((section) => section._id === active.id);
      const newIndex = sections.findIndex((section) => section._id === over.id);

      const reorderedSections = arrayMove(sections, oldIndex, newIndex).map((section, index) => ({
        ...section,
        order: index
      }));

      onSectionsChange(reorderedSections);
    }
  };

  const handleSectionUpdate = (sectionId: string, updates: Partial<CourseSection>) => {
    const updatedSections = sections.map(section =>
      section._id === sectionId ? { ...section, ...updates } : section
    );
    onSectionsChange(updatedSections);
  };

  const handleSectionDelete = (sectionId: string) => {
    const updatedSections = sections.filter(section => section._id !== sectionId);
    onSectionsChange(updatedSections);
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
    onSectionsChange([...sections, newSection]);
  };

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
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white">Course Content</h3>
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
          className="w-full border-dashed border-gray-600 text-gray-400 hover:text-white hover:border-white hover:bg-gray-800 py-8"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add New Section
        </Button>
      </motion.div>
    </div>
  );
}