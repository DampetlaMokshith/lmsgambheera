'use client';

import { useEffect, useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy } from 'lucide-react';
import Image from 'next/image';
import { getCourseById } from '@/sanity/lib/queries';

interface QuizStatsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  studentName: string;
  courseId: string;
}

interface QuizResult {
  quizName: string;
  percentage: number;
  score: number;
  maxScore: number;
  completedAt: string;
}

export default function StudentQuizStatsDialog({
  open,
  onOpenChange,
  studentId,
  studentName,
  courseId,
}: QuizStatsDialogProps) {
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQuizStats = useCallback(async () => {
    try {
      setLoading(true);
      setQuizResults([]);

      // Fetch quiz attempts via API (bypasses RLS)
      const response = await fetch(
        `/api/faculty/quiz-stats?userId=${studentId}&courseId=${courseId}`
      );

      if (!response.ok) {
        setQuizResults([]);
        return;
      }

      const data = await response.json();

      if (!data.success || !data.quizAttempts || data.quizAttempts.length === 0) {
        setQuizResults([]);
        return;
      }

      // Fetch course data from Sanity to get quiz names
      let quizzes: Array<{ _id: string; title?: string }> = [];
      try {
        const sanityData = await getCourseById(courseId);
        quizzes = sanityData?.sections?.flatMap(
          (section: { quizzes?: Array<{ _id: string; title?: string }> }) =>
            section.quizzes || []
        ) || [];
      } catch {
        // Silently handle error - quiz names will use fallback
      }

      // Map attempts to quiz results with names
      const results: QuizResult[] = data.quizAttempts.map(
        (attempt: {
          quiz_id: string;
          percentage?: number;
          score?: number;
          total_questions?: number;
          submitted_at?: string;
          attempted_at?: string;
        }) => {
          // Try exact match first
          let quizDetails = quizzes.find((q) => q._id === attempt.quiz_id);

          // Try partial match
          if (!quizDetails) {
            const shortId = attempt.quiz_id.split('-')[0];
            quizDetails = quizzes.find((q) => q._id.includes(shortId));
          }

          return {
            quizName: quizDetails?.title || `Quiz ${attempt.quiz_id.substring(0, 8)}`,
            percentage: attempt.percentage || 0,
            score: attempt.score || 0,
            maxScore: attempt.total_questions || 0,
            completedAt: attempt.submitted_at || attempt.attempted_at || new Date().toISOString(),
          };
        }
      );

      setQuizResults(results);
    } catch {
      setQuizResults([]);
    } finally {
      setLoading(false);
    }
  }, [studentId, courseId]);

  useEffect(() => {
    if (open && studentId && courseId) {
      fetchQuizStats();
    }
  }, [open, studentId, courseId, fetchQuizStats]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-5xl bg-black border max-h-[90vh] overflow-y-auto p-4 md:p-6" hideCloseButton>
        <DialogHeader>
          <DialogTitle className="text-white text-lg md:text-2xl">Quiz Badges & Results</DialogTitle>
          <DialogDescription className="text-gray-400 text-xs md:text-sm">
            {studentName}&apos;s quiz performance and earned badges
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 md:mt-6">
          {loading ? (
            <div className="border bg-black overflow-x-auto md:overflow-visible">
              <Table className="min-w-[600px]">
                <TableHeader>
                  <TableRow className="border-white/20">
                    <TableHead className="text-gray-300 font-semibold text-xs md:text-sm">Quiz Name</TableHead>
                    <TableHead className="text-gray-300 font-semibold text-xs md:text-sm">Percentage</TableHead>
                    <TableHead className="text-gray-300 font-semibold text-xs md:text-sm">Pass/Fail</TableHead>
                    <TableHead className="text-gray-300 font-semibold text-xs md:text-sm">Badge</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[1, 2, 3].map((i) => (
                    <TableRow key={i} className="border animate-pulse">
                      <TableCell><div className="h-4 bg-accent w-32"></div></TableCell>
                      <TableCell><div className="h-4 bg-accent w-24"></div></TableCell>
                      <TableCell><div className="h-6 bg-accent w-16"></div></TableCell>
                      <TableCell><div className="h-8 w-8 bg-accent"></div></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : quizResults.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-2">No quiz attempts yet</p>
              <p className="text-gray-500 text-sm">
                This student hasn&apos;t attempted any quizzes in this course
              </p>
            </div>
          ) : (
            <>
              {/* Scroll indicator for mobile */}
              <div className="block md:hidden pb-2">
                <p className="text-xs text-gray-400 text-center">
                  ← Scroll to view all columns →
                </p>
              </div>

              <div className="border bg-black overflow-x-auto md:overflow-visible table-scroll">
                <Table className="min-w-[600px]">
                  <TableHeader>
                    <TableRow className="border-white/20 hover:bg-white/5">
                      <TableHead className="text-gray-300 font-semibold text-xs md:text-sm">Quiz Name</TableHead>
                      <TableHead className="text-gray-300 font-semibold text-xs md:text-sm">Percentage</TableHead>
                      <TableHead className="text-gray-300 font-semibold text-xs md:text-sm">Pass/Fail</TableHead>
                      <TableHead className="text-gray-300 font-semibold text-xs md:text-sm">Badge</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quizResults.map((quiz, index) => {
                      const isPassed = quiz.percentage >= 60;

                      return (
                        <TableRow key={index} className="border hover:bg-white/5">
                          <TableCell className="text-white font-medium text-xs md:text-sm">{quiz.quizName}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-16 md:w-24 h-2 bg-accent overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-500 ${
                                    isPassed
                                      ? 'bg-white'
                                      : 'bg-gradient-to-r from-red-500 to-orange-500'
                                  }`}
                                  style={{ width: `${quiz.percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-white font-semibold text-xs md:text-sm whitespace-nowrap">
                                {quiz.percentage.toFixed(0)}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                isPassed
                                  ? 'bg-green-600 hover:bg-green-700 text-white text-xs md:text-sm'
                                  : 'bg-red-600 hover:bg-red-700 text-white text-xs md:text-sm'
                              }
                            >
                              {isPassed ? 'Pass' : 'Fail'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {isPassed ? (
                              <div className="relative w-8 h-8 md:w-10 md:h-10">
                                <Image
                                  src="/badge3.svg"
                                  alt="Badge"
                                  width={80}
                                  height={80}
                                  className="object-contain"
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-white font-bold text-xs md:text-10px">
                                    {quiz.percentage.toFixed(0)}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-500 text-sm">No badge</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </div>
        <div className="flex justify-end mt-4">
          <Button
            onClick={() => onOpenChange(false)}
            className="bg-white text-black hover:bg-gray-200"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}