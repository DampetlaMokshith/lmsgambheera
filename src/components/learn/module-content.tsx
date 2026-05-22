'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Clock, 
  CheckCircle2,
  Target
} from 'lucide-react';
import { toast } from 'sonner';
import { projectId, dataset } from '@/sanity/env';

interface ModuleData {
  _id: string;
  title: string;
  description: string | Record<string, unknown>[] | Record<string, unknown>;
  file?: {
    asset: {
      _id: string;
      _ref: string;
      _type: string;
      url: string;
    };
  };
  fileUrl?: string;
  downloadUrl?: string;
  order: number;
  moduleType?: string;
  difficulty?: string;
  tags?: string[];
  estimatedReadTime?: number;
  learningObjectives?: string[];
}

interface ModuleContentProps {
  module: ModuleData;
  courseId: string;
  userId?: string;
}

export default function ModuleContent({ module, courseId, userId }: ModuleContentProps) {
  const [isMarkedAsRead, setIsMarkedAsRead] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  useEffect(() => {
    // Check if already marked as read
    const checkProgress = async () => {
      if (!userId || !courseId) return;
      
      try {
        const response = await fetch(`/api/progress/${courseId}?userId=${userId}`);
        if (response.ok) {
          const progressData = await response.json();
          const isCompleted = progressData.completed_item_ids?.includes(module._id);
          setIsMarkedAsRead(isCompleted);
        }
      } catch (error) {
}
    };

    checkProgress();

    // Get file URL - prefer the url from Sanity query, fallback to manual construction
    if (module.file?.asset?.url) {
      setFileUrl(module.file.asset.url);
} else if (module.file?.asset?._ref) {
      const ref = module.file.asset._ref;
      const [, id, extension] = ref.split('-');
      const url = `https://cdn.sanity.io/files/${projectId}/${dataset}/${id}.${extension}`;
      setFileUrl(url);
} else if (module.fileUrl) {
      setFileUrl(module.fileUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, module._id, module.file, module.fileUrl]);

  const handleMarkAsRead = async () => {
    if (!userId) {
      toast.error('Please log in to track your progress');
      return;
    }

    setIsLoading(true);
    try {
      // Mark complete using new progress API
      const response = await fetch('/api/progress/mark-complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          course_id: courseId,
          item_id: module._id,
          item_type: 'module',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark module as complete');
      }

      setIsMarkedAsRead(true);
      toast.success('Module marked as completed!');
    } catch (error) {
toast.error('Failed to update progress');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3">
              {module.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              {module.moduleType && (
                <Badge variant="outline" className="bg-white text-black border-white">
                  <FileText className="w-3 h-3 mr-1" />
                  {module.moduleType.toUpperCase()}
                </Badge>
              )}
              {module.difficulty && (
                <Badge variant="outline" className="bg-white text-black border-white">
                  {module.difficulty}
                </Badge>
              )}
              {module.estimatedReadTime && (
                <Badge variant="outline" className="bg-white text-black border-white">
                  <Clock className="w-3 h-3 mr-1" />
                  {module.estimatedReadTime} min read
                </Badge>
              )}
            </div>
          </div>
          
          {/* Mark as Read Button - Right side on desktop, below on mobile */}
          {userId && (
            <div className="flex-shrink-0">
              <Button
                onClick={handleMarkAsRead}
                disabled={isMarkedAsRead || isLoading}
                className={`${
                  isMarkedAsRead 
                    ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-400 cursor-not-allowed' 
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                {isMarkedAsRead ? 'Done' : isLoading ? 'Marking...' : 'Mark as Read'}
              </Button>
            </div>
          )}
        </div>

        {/* Tags */}
        {module.tags && module.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {module.tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="bg-white/5 text-white border-0">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      

      {/* Learning Objectives */}
      {module.learningObjectives && module.learningObjectives.length > 0 && (
        <Card className="bg-black border">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-white" />
              Learning Objectives
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {module.learningObjectives.map((objective, index) => (
                <li key={index} className="flex items-start gap-3 text-gray-300">
                  
                  <span>💠{objective}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Module File/Resource */}
      {fileUrl && (
        <Card className="bg-black">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center">
              
              Module File:
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Clickable File Box */}
            <a 
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <div className="bg-black hover:border-purple-500 p-6 transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-16 h-16 bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                    <FileText className="w-8 h-8 text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-semibold text-lg mb-1 group-hover:text-purple-300 transition-colors">
                      {module.title}
                    </h4>
                    <p className="text-gray-400 text-sm">
                      Click to open PDF
                    </p>
                  </div>
                </div>
              </div>
            </a>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
