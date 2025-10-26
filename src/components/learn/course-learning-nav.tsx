'use client';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Menu, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

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

interface SectionData {
  _id: string;
  title: string;
  description: string;
  order: number;
  lectures?: LectureData[];
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
  courseProgress: number;
  user: { id: string } | null;
  onLectureSelect: (lecture: LectureData, section: SectionData) => void;
  onNavigate: (direction: 'previous' | 'next') => void;
}

export default function CourseLearningNav({
  course,
  currentLecture,
  courseProgress,
  user,
  onLectureSelect,
  onNavigate
}: CourseLearningNavProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 bg-gray-900 border-b border-gray-700 px-4 md:px-6 py-3 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left side - Hamburger and Title */}
        <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
          <Drawer direction="left">
            <DrawerTrigger asChild>
              <Button size="icon" variant="outline" className="bg-transparent border-gray-600 text-white hover:bg-gray-800 flex-shrink-0">
                <Menu className="h-4 w-4" />
              </Button>
            </DrawerTrigger>
            <DrawerContent className="bg-gray-900 border-gray-700 text-white w-80 sm:w-96">
              <DrawerHeader>
                <DrawerTitle className="text-white">{course.title}</DrawerTitle>
                <DrawerDescription className="text-gray-400">
                  Course Content
                </DrawerDescription>
                
                {/* Progress Bar */}
                {user && (
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-300">Course Progress</span>
                      <span className="text-white font-semibold">{Math.round(courseProgress)}%</span>
                    </div>
                    <Progress 
                      value={courseProgress} 
                      className="w-full h-2 bg-gray-700"
                    />
                    <div className="text-xs text-gray-400">
                      {Math.round(courseProgress)}% Complete
                    </div>
                  </div>
                )}
              </DrawerHeader>
              <div className="p-4 flex-1 overflow-y-auto max-h-[60vh]">
                {course.sections.map((section, sectionIndex) => (
                  <div key={section._id} className="mb-6">
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-3">
                      Section {sectionIndex + 1}: {section.title}
                    </h3>
                    {section.lectures && section.lectures.map((lecture, lectureIndex) => (
                      <button
                        key={lecture._id}
                        onClick={() => onLectureSelect(lecture, section)}
                        className={`block w-full text-left p-3 rounded-lg mb-2 transition-colors ${
                          currentLecture?._id === lecture._id 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        <div className="text-sm">
                          {lectureIndex + 1}. {lecture.title}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {lecture.duration} min
                        </div>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
              <DrawerFooter>
                <DrawerClose asChild>
                  <Button variant="outline" className="border-gray-600 text-white hover:bg-gray-800">
                    Close
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
          
          <h1 className="text-lg sm:text-xl font-bold text-white truncate min-w-0">
            {course.title}
          </h1>
        </div>

        {/* Right side - Navigation buttons */}
        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('previous')}
            disabled={!currentLecture}
            className="bg-transparent border-gray-600 text-white hover:bg-gray-800 px-2 sm:px-3"
          >
            <ChevronLeft className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Previous</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('next')}
            disabled={!currentLecture}
            className="bg-transparent border-gray-600 text-white hover:bg-gray-800 px-2 sm:px-3"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-4 w-4 sm:ml-1" />
          </Button>
        </div>
      </div>
    </nav>
  );
}