'use client';

import { useEffect, useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart } from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Badge } from '@/components/ui/badge';
import { BookOpen, GraduationCap, FileText, Trophy, TrendingUp, Activity } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { ScrollArea } from '@/components/ui/scroll-area';

interface StudentActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  studentName: string;
  courseId?: string; // Sanity course ID
  supabaseCourseId?: string; // Supabase course UUID (kept for backward compatibility)
}

interface CompletionData {
  category: string;
  completed: number;
  total: number;
  percentage: number;
}

const chartConfig = {
  percentage: {
    label: 'Completion',
    color: '#3b82f6',
  },
} satisfies ChartConfig;

export default function StudentActivityDialog({
  open,
  onOpenChange,
  studentId,
  studentName,
  courseId,
}: StudentActivityDialogProps) {
  const [completionData, setCompletionData] = useState<CompletionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [overallProgress, setOverallProgress] = useState(0);

  const fetchCompletionData = useCallback(async () => {
    try {
      setLoading(true);

      if (!courseId) {
        setCompletionData([]);
        setLoading(false);
        return;
      }

      // Fetch progress data from API endpoint (same as certificates page)
      const progressResponse = await fetch(
        `/api/progress/${courseId}?userId=${studentId}`
      );

      if (!progressResponse.ok) {
        setCompletionData([]);
        setLoading(false);
        return;
      }

      const progressData = await progressResponse.json();

      if (!progressData || !progressData.breakdown) {
        setCompletionData([]);
        setLoading(false);
        return;
      }

      // Prepare completion data from API response
      const data: CompletionData[] = [
        {
          category: 'Lectures',
          completed: progressData.breakdown.lectures.completed || 0,
          total: progressData.breakdown.lectures.total || 0,
          percentage: progressData.breakdown.lectures.total > 0 
            ? Math.round((progressData.breakdown.lectures.completed / progressData.breakdown.lectures.total) * 100) 
            : 0,
        },
        {
          category: 'Modules',
          completed: progressData.breakdown.modules.completed || 0,
          total: progressData.breakdown.modules.total || 0,
          percentage: progressData.breakdown.modules.total > 0 
            ? Math.round((progressData.breakdown.modules.completed / progressData.breakdown.modules.total) * 100) 
            : 0,
        },
        {
          category: 'Assignments',
          completed: progressData.breakdown.assignments.completed || 0,
          total: progressData.breakdown.assignments.total || 0,
          percentage: progressData.breakdown.assignments.total > 0 
            ? Math.round((progressData.breakdown.assignments.completed / progressData.breakdown.assignments.total) * 100) 
            : 0,
        },
        {
          category: 'Quizzes',
          completed: progressData.breakdown.quizzes.completed || 0,
          total: progressData.breakdown.quizzes.total || 0,
          percentage: progressData.breakdown.quizzes.total > 0 
            ? Math.round((progressData.breakdown.quizzes.completed / progressData.breakdown.quizzes.total) * 100) 
            : 0,
        },
      ];

      setCompletionData(data);
      setOverallProgress(progressData.progress_percentage || 0);
    } catch {
      setCompletionData([]);
    } finally {
      setLoading(false);
    }
  }, [studentId, courseId]);

  useEffect(() => {
    if (open && studentId && courseId) {
      fetchCompletionData();
    }
  }, [open, studentId, courseId, fetchCompletionData]);

  // Prepare chart data with dotted line format
  const chartData = completionData.map(item => ({
    name: item.category,
    percentage: item.percentage,
  }));

  const getIcon = (category: string) => {
    switch (category) {
      case 'Lectures':
        return <BookOpen className="w-4 h-4 text-blue-400" />;
      case 'Modules':
        return <GraduationCap className="w-4 h-4 text-green-400" />;
      case 'Assignments':
        return <FileText className="w-4 h-4 text-yellow-400" />;
      case 'Quizzes':
        return <Trophy className="w-4 h-4 text-purple-400" />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] bg-[#0a0a0a] border-gray-800 p-4 md:p-6">
        <DialogHeader className="border-b border-gray-800 pb-4">
          <DialogTitle className="text-white text-lg md:text-2xl font-bold flex items-center gap-2">
            <Activity className="w-5 h-5 md:w-6 md:h-6 text-blue-500" />
            Student Activity Dashboard
          </DialogTitle>
          <DialogDescription className="text-gray-400 text-sm md:text-base">
            {studentName}&apos;s comprehensive progress and completion statistics
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-120px)] pr-4">
          {loading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="flex flex-col items-center gap-3">
                <Spinner className="size-8" />
                <span className="text-gray-400 text-sm">Loading completion data...</span>
              </div>
            </div>
          ) : completionData.length === 0 ? (
            <div className="text-center py-12">
              <GraduationCap className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-2">No completion data available</p>
              <p className="text-gray-500 text-sm">
                This student hasn&apos;t started this course yet
              </p>
            </div>
          ) : (
            <div className="space-y-6">
             

              {/* Radar Chart - Activity Overview */}
              <Card className="bg-[#0a0a0a] border-gray-800 shadow-2xl">
                <CardContent className="pb-4 pt-6 relative">
                  {/* Footer moved to top-right */}
                  <div className="absolute top-2 right-2 md:top-4 md:right-4 z-10 flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm font-semibold text-white">
                      {overallProgress >= 75 ? (
                        <>
                          Outstanding progress <TrendingUp className="h-4 w-4 text-green-500" />
                        </>
                      ) : overallProgress >= 50 ? (
                        <>
                          Good progress <TrendingUp className="h-4 w-4 text-blue-500" />
                        </>
                      ) : overallProgress > 0 ? (
                        <>
                          Keep going <TrendingUp className="h-4 w-4 text-yellow-500" />
                        </>
                      ) : (
                        <>
                          Getting started <Activity className="h-4 w-4 text-gray-500" />
                        </>
                      )}
                    </div>
                    <div className="text-gray-500 text-xs">
                      Overall: {overallProgress}%
                    </div>
                  </div>
                  
                  <ChartContainer
                    config={chartConfig}
                    className="mx-auto aspect-square max-h-[250px] md:max-h-[350px]"
                  >
                    <RadarChart 
                      data={chartData}
                      margin={{ top: 20, right: 30, bottom: 20, left: 30 }}
                    >
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent 
                          formatter={(value) => `${value}%`}
                          hideLabel 
                        />}
                      />
                      <PolarAngleAxis 
                        dataKey="name" 
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                      />
                      <PolarGrid 
                        stroke="#374151"
                        strokeOpacity={0.5}
                      />
                      <PolarRadiusAxis 
                        angle={90} 
                        domain={[0, 100]}
                        tick={{ fill: '#6b7280', fontSize: 10 }}
                      />
                      <Radar
                        dataKey="percentage"
                        fill="var(--color-percentage)"
                        fillOpacity={0.6}
                        stroke="var(--color-percentage)"
                        strokeWidth={2}
                        dot={{
                          r: 4,
                          fillOpacity: 1,
                        }}
                      />
                    </RadarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Detailed Stats - Compact Badge Style */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {completionData.map((item) => (
                  <div 
                    key={item.category} 
                    className="bg-[#0a0a0a] border border-gray-800 p-3 hover:border-gray-700 transition-all hover:scale-105"
                  >
                    <div className="flex flex-col gap-2">
                      {/* Category and Percentage in a Row */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-gray-800/50">
                            {getIcon(item.category)}
                          </div>
                          <p className="text-xs text-gray-400 font-semibold">{item.category}</p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-xs font-bold px-1.5 py-0.5 ${
                            item.percentage === 100
                              ? 'text-green-400 bg-green-500/10 border-green-500/50'
                              : item.percentage >= 75
                              ? 'text-blue-400 bg-blue-500/10 border-blue-500/50'
                              : item.percentage >= 50
                              ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/50'
                              : 'text-red-400 bg-red-500/10 border-red-500/50'
                          }`}
                        >
                          {item.percentage}%
                        </Badge>
                      </div>
                      {/* Count */}
                      <div className="pl-9">
                        <p className="text-lg font-bold text-white">
                          {item.completed}<span className="text-gray-600 text-sm">/{item.total}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
