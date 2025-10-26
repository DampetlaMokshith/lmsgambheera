'use client';

import { useEffect, useState } from 'react';

interface ProgressBreakdown {
  lectures: { completed: number; total: number };
  modules: { completed: number; total: number };
  assignments: { completed: number; total: number };
  quizzes: { completed: number; total: number };
}

interface CourseProgress {
  user_id: string;
  course_id: string;
  course_title: string;
  completed_items: number;
  total_items: number;
  progress_percentage: number;
  breakdown: ProgressBreakdown;
  last_activity: string | null;
  started_at: string | null;
  completed_item_ids: string[];
  recent_completions: Array<{
    item_id: string;
    item_type: string;
    completed_at: string;
  }>;
}

/**
 * Hook to fetch and track course progress
 * @param userId - User's UUID
 * @param courseId - Sanity course _id
 * @param autoRefresh - Whether to auto-refresh on mount (default: true)
 */
export function useCourseProgress(
  userId: string | null | undefined,
  courseId: string | null | undefined,
  autoRefresh: boolean = true
) {
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = async () => {
    if (!userId || !courseId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/progress/${courseId}?userId=${userId}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch progress');
      }

      const data = await response.json();
      setProgress(data);
    } catch (err) {
      console.error('Error fetching progress:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const markComplete = async (
    itemId: string,
    itemType: 'lecture' | 'module' | 'assignment' | 'quiz',
    sectionId?: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!userId || !courseId) {
      throw new Error('User ID and Course ID are required');
    }

    try {
      const response = await fetch('/api/progress/mark-complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          course_id: courseId,
          item_id: itemId,
          item_type: itemType,
          section_id: sectionId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark item as complete');
      }

      const result = await response.json();
      
      // Refresh progress data
      await fetchProgress();
      
      return result;
    } catch (err) {
      console.error('Error marking item complete:', err);
      throw err;
    }
  };

  const isItemCompleted = (itemId: string): boolean => {
    return progress?.completed_item_ids.includes(itemId) || false;
  };

  useEffect(() => {
    if (autoRefresh && userId && courseId) {
      fetchProgress();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, courseId, autoRefresh]);

  return {
    progress,
    loading,
    error,
    fetchProgress,
    markComplete,
    isItemCompleted,
  };
}
