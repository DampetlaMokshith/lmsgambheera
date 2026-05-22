'use client';

import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Target } from "lucide-react";

interface CourseProgressBarProps {
  percent: number;
  completedItems?: number;
  totalItems?: number;
  showDetails?: boolean;
  className?: string;
  loading?: boolean;
}

/**
 * Reusable course progress bar component
 * Displays progress percentage with optional details
 */
export function CourseProgressBar({
  percent,
  completedItems,
  totalItems,
  showDetails = false,
  className = "",
  loading = false,
}: CourseProgressBarProps) {
  // Ensure percentage is between 0 and 100
  const safePercent = Math.max(0, Math.min(100, Math.round(percent)));

  if (loading) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="h-4 bg-accent rounded animate-pulse"></div>
        <div className="h-2 bg-accent rounded animate-pulse"></div>
        <div className="h-3 bg-accent rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Header with percentage */}
      <div className="flex justify-between items-center text-sm">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-gray-400" />
          <span className="text-gray-300 font-medium">Progress</span>
        </div>
        <div className="flex items-center gap-1.5">
          {safePercent === 100 && (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          )}
          <span className="text-white font-semibold">{safePercent}%</span>
        </div>
      </div>

      {/* Progress bar */}
      <Progress
        value={safePercent}
        className="h-2 bg-black border border-gray-700"
      />

      {/* Optional details */}
      {showDetails && completedItems !== undefined && totalItems !== undefined && (
        <div className="flex justify-between items-center text-xs text-gray-400">
          <span>
            {completedItems} of {totalItems} items completed
          </span>
          {safePercent === 100 ? (
            <span className="text-green-500 font-medium">Complete</span>
          ) : (
            <span className="text-blue-400 font-medium">In Progress</span>
          )}
        </div>
      )}
    </div>
  );
}
