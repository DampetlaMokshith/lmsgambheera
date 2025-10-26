'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileUpload } from '@/components/ui/file-upload';
import { 
  Clipboard, 
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileText,
  Upload,
  Scale
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { projectId, dataset } from '@/sanity/env';

interface AssignmentData {
  _id: string;
  title: string;
  description: string | Record<string, unknown>[] | Record<string, unknown>;
  attachments?: Array<{
    asset: {
      _id: string;
      _ref: string;
      _type: string;
      url: string;
    };
  }>;
  fileUrl?: string;
  downloadUrl?: string;
  dueDate?: string;
  order: number;
  instructions?: string | Record<string, unknown>[] | Record<string, unknown>;
  rubric?: string | Record<string, unknown>[] | Record<string, unknown>;
  totalPoints?: number;
  difficulty?: string;
  tags?: string[];
  allowedFileTypes?: string[];
  maxFileSize?: number;
  submissionType?: string;
}

interface AssignmentContentProps {
  assignment: AssignmentData;
  courseId: string;
  userId?: string;
}

// Helper function to safely render text
function getSafeText(text: string | Record<string, unknown>[] | Record<string, unknown> | undefined): string {
  if (!text) return '';
  if (typeof text === 'string') return text;
  
  if (Array.isArray(text)) {
    return text
      .filter(block => block._type === 'block')
      .map(block => {
        if (block.children && Array.isArray(block.children)) {
          return block.children
            .map((child: Record<string, unknown>) => child.text || '')
            .join('');
        }
        return '';
      })
      .join('\n');
  }
  
  return '';
}

export default function AssignmentContent({ assignment, courseId, userId }: AssignmentContentProps) {
  const [isMarkedAsRead, setIsMarkedAsRead] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>([]);

  useEffect(() => {
    // Check if already marked as read
    const checkProgress = async () => {
      if (!userId) return;
      
      const { data } = await supabase
        .from('user_assignment_progress')
        .select('marked_as_read')
        .eq('user_id', userId)
        .eq('assignment_id', assignment._id)
        .single();
      
      if (data?.marked_as_read) {
        setIsMarkedAsRead(true);
      }
    };

    checkProgress();

    // Get attachment URLs - prefer url from Sanity query, fallback to manual construction
    if (assignment.attachments && assignment.attachments.length > 0) {
      const urls = assignment.attachments.map(att => {
        // First try the url from the query
        if (att.asset.url) {
          console.log('Assignment file URL from Sanity:', att.asset.url);
          return att.asset.url;
        }
        // Fallback to manual construction
        const ref = att.asset._ref;
        const [, id, extension] = ref.split('-');
        const url = `https://cdn.sanity.io/files/${projectId}/${dataset}/${id}.${extension}`;
        console.log('Assignment file URL (constructed):', url);
        return url;
      });
      setAttachmentUrls(urls);
    }
  }, [userId, assignment._id, assignment.attachments]);

  const handleMarkAsRead = async () => {
    if (!userId) {
      toast.error('Please log in to track your progress');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('user_assignment_progress')
        .upsert({
          user_id: userId,
          course_id: courseId,
          assignment_id: assignment._id,
          viewed: true,
          marked_as_read: true,
          viewed_at: new Date().toISOString(),
          marked_at: new Date().toISOString()
        });

      if (error) throw error;

      setIsMarkedAsRead(true);
      toast.success('Assignment marked as read!');
    } catch (error) {
      console.error('Error marking assignment as read:', error);
      toast.error('Failed to update progress');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (files: File[]) => {
    // Validate file types
    if (assignment.allowedFileTypes && assignment.allowedFileTypes.length > 0) {
      const invalidFiles = files.filter(file => {
        const extension = file.name.split('.').pop()?.toLowerCase();
        return !assignment.allowedFileTypes?.some(type => 
          type === extension || type.includes(extension || '')
        );
      });

      if (invalidFiles.length > 0) {
        toast.error(`Invalid file type(s): ${invalidFiles.map(f => f.name).join(', ')}`);
        return;
      }
    }

    // Validate file size
    if (assignment.maxFileSize) {
      const maxSize = assignment.maxFileSize * 1024 * 1024; // Convert MB to bytes
      const oversizedFiles = files.filter(file => file.size > maxSize);

      if (oversizedFiles.length > 0) {
        toast.error(`File(s) exceed maximum size of ${assignment.maxFileSize}MB`);
        return;
      }
    }

    setUploadedFiles(files);
    toast.success(`${files.length} file(s) ready to submit`);
  };

  const handleSubmit = async () => {
    if (!userId) {
      toast.error('Please log in to submit assignment');
      return;
    }

    if (uploadedFiles.length === 0) {
      toast.error('Please upload at least one file');
      return;
    }

    setIsLoading(true);
    try {
      // Mark assignment as complete
      const response = await fetch('/api/progress/mark-complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          course_id: courseId,
          item_id: assignment._id,
          item_type: 'assignment',
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error('Server response:', result);
        throw new Error(result.error || 'Failed to mark assignment as complete');
      }

      setIsMarkedAsRead(true);
      toast.success('Assignment submitted successfully!');
      // TODO: Implement actual file upload to storage
    } catch (error) {
      console.error('Error submitting assignment:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit assignment';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const description = getSafeText(assignment.description);
  const instructions = getSafeText(assignment.instructions);
  const rubric = getSafeText(assignment.rubric);
  const isOverdue = assignment.dueDate && new Date(assignment.dueDate) < new Date();
  const dueDate = assignment.dueDate ? new Date(assignment.dueDate) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3">
              {assignment.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              {assignment.totalPoints && (
                <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/30">
                  <Clipboard className="w-3 h-3 mr-1" />
                  {assignment.totalPoints} points
                </Badge>
              )}
              {assignment.difficulty && (
                <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                  {assignment.difficulty}
                </Badge>
              )}
              {dueDate && (
                <Badge 
                  variant="outline" 
                  className={`${
                    isOverdue 
                      ? 'bg-red-500/10 text-red-400 border-red-500/30' 
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  }`}
                >
                  <Calendar className="w-3 h-3 mr-1" />
                  Due: {dueDate.toLocaleDateString()}
                  {isOverdue && ' (Overdue)'}
                </Badge>
              )}
            </div>
          </div>
          
          {/* Mark as Read Button */}
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
        {assignment.tags && assignment.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {assignment.tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="bg-white/5 text-white border-0">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Overdue Warning */}
        {isOverdue && (
          <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-400 text-sm">
              This assignment is past its due date. Please contact your instructor if you need an extension.
            </p>
          </div>
        )}
      </div>

      {/* Description */}
      {description && (
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-400" />
              Description
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
              {description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      {instructions && (
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Clipboard className="w-5 h-5 text-orange-400" />
              Instructions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
              {instructions}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Grading Rubric */}
      {rubric && (
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Scale className="w-5 h-5 text-emerald-400" />
              Grading Rubric
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
              {rubric}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Assignment Files & Resources */}
      {attachmentUrls.length > 0 && (
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-400" />
              Assignment Files & Resources
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {attachmentUrls.map((url, index) => {
              const fileName = `Resource ${index + 1}`;
              const fileExtension = url.split('.').pop()?.toUpperCase() || 'FILE';
              
              return (
                <a 
                  key={index}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <div className="bg-black border-2 border-gray-700 hover:border-orange-500 rounded-lg p-6 transition-all cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0 w-16 h-16 bg-orange-500/20 rounded-lg flex items-center justify-center group-hover:bg-orange-500/30 transition-colors">
                        <FileText className="w-8 h-8 text-orange-400 group-hover:text-orange-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-semibold text-lg mb-1 group-hover:text-orange-300 transition-colors">
                          {fileName} ({fileExtension})
                        </h4>
                        <p className="text-gray-400 text-sm">
                          Click to open file
                        </p>
                      </div>
                    </div>
                  </div>
                </a>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Submission Section */}
      {userId && (
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-emerald-400" />
              Submit Assignment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Submission Requirements */}
            <div className="space-y-4">
              {assignment.totalPoints && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Total Points:</span>
                  <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/30">
                    {assignment.totalPoints} points
                  </Badge>
                </div>
              )}
              
              {assignment.allowedFileTypes && assignment.allowedFileTypes.length > 0 && (
                <div className="text-sm">
                  <p className="text-gray-400 mb-2">Allowed file types:</p>
                  <div className="flex flex-wrap gap-2">
                    {assignment.allowedFileTypes.map((type, index) => (
                      <Badge key={index} variant="outline" className="bg-white/5 text-white border-white/20">
                        .{type}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {assignment.maxFileSize && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Maximum file size:</span>
                  <Badge variant="outline" className="bg-white/5 text-white border-white/20">
                    {assignment.maxFileSize} MB
                  </Badge>
                </div>
              )}
            </div>

            {/* File Upload Area */}
            <div className="border border-dashed border-gray-700 rounded-lg bg-black/30">
              <FileUpload onChange={handleFileUpload} />
            </div>

            {/* Uploaded Files Display */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-400">Files ready to submit:</p>
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm text-white truncate">{file.name}</span>
                    </div>
                    <span className="text-xs text-emerald-400">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </div>
                ))}
              </div>
            )}
            
            {/* Submit Button */}
            <Button 
              onClick={handleSubmit}
              disabled={uploadedFiles.length === 0 || Boolean(isOverdue)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
              size="lg"
            >
              <Upload className="w-4 h-4 mr-2" />
              Submit Assignment
            </Button>
            
            {isOverdue && (
              <p className="text-xs text-red-400 text-center">
                This assignment is past due. Contact your instructor for late submission.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
