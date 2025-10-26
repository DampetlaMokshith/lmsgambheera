'use client';

import { useEffect } from 'react';
import VideoPlayer from '@/components/ui/video-player';

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

interface LectureContentProps {
  lecture: LectureData;
  courseId?: string;
  userId?: string;
  onMarkComplete?: () => void;
}

export default function LectureContent({ 
  lecture, 
  courseId, 
  userId,
  onMarkComplete 
}: LectureContentProps) {
  
  // Auto-mark lecture as complete when opened (simulating video play)
  useEffect(() => {
    const markLectureComplete = async () => {
      if (!userId || !courseId || !lecture._id) return;

      try {
        await fetch('/api/progress/mark-complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userId,
            course_id: courseId,
            item_id: lecture._id,
            item_type: 'lecture',
          }),
        });
        
        // Call parent callback if provided
        onMarkComplete?.();
      } catch (error) {
        console.error('Error marking lecture complete:', error);
      }
    };

    // Mark complete after a short delay (simulating user starting to watch)
    const timer = setTimeout(markLectureComplete, 3000); // 3 seconds after opening
    
    return () => clearTimeout(timer);
  }, [lecture._id, courseId, userId, onMarkComplete]);
  return (
    <div className="space-y-6">
      {/* Video Section - Reduced size */}
      <div className="w-full max-w-4xl mx-auto">
        {lecture.videoUrl ? (
          <VideoPlayer
            videoUrl={lecture.videoUrl}
            title={lecture.title}
          />
        ) : (
          <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <div className="text-2xl sm:text-4xl mb-4">📹</div>
                <p className="text-sm sm:text-base">Video not available for this lecture</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lecture Information */}
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Lecture Title and Duration */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            {lecture.title}
          </h2>
          <div className="flex items-center text-gray-400 text-sm sm:text-base">
            <span className="bg-gray-800 px-3 py-1 rounded-full">
              {lecture.duration} minutes
            </span>
          </div>
        </div>

        {/* Lecture Description */}
        <div>
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-3">Description</h3>
          <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
            {lecture.description || 'No description available for this lecture.'}
          </p>
        </div>
      </div>
    </div>
  );
}