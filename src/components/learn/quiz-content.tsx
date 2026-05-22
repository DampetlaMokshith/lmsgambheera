'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  ClipboardList,
  Clock,
  Target,
  Award,
  AlertCircle,
  Maximize2,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import QuizTaking from './quiz-taking';
import Image from 'next/image';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface QuizData {
  _id: string;
  title: string;
  description?: string | Record<string, unknown>[] | Record<string, unknown>;
  instructions?: string | Record<string, unknown>[] | Record<string, unknown>;
  timeLimit?: number; // minutes
  passingScore?: number; // percentage
  questions: QuizQuestion[] | Record<string, unknown>[];
  allowRetakes?: boolean;
  maxAttempts?: number;
  showCorrectAnswers?: boolean;
}

interface QuizProgress {
  user_id: string;
  quiz_id: string;
  course_id: string;
  total_attempts: number;
  best_score: number;
  best_percentage?: number;
  completed?: boolean;
  passed?: boolean;
  last_attempted_at?: string;
}

interface QuizAttempt {
  id: string;
  user_id: string;
  quiz_id: string;
  course_id: string;
  course_name?: string;
  
  // Quiz Configuration
  total_questions: number;
  time_limit_minutes?: number;
  allows_retakes?: boolean;
  passing_score_percentage?: number;
  
  // Attempt Details
  questions_answered: number;
  questions_correct: number;
  score: number;
  percentage: number;
  passed: boolean;
  
  // Time Tracking
  time_taken: number;
  time_remaining?: number;
  
  // Timestamps
  attempted_at: string;
  submitted_at?: string;
}

interface QuizContentProps {
  quiz: QuizData;
  courseId: string;
  courseName: string;
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

// Format time from seconds to MM:SS
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function QuizContent({ quiz, courseId, courseName, userId }: QuizContentProps) {
  const [showAttemptDialog, setShowAttemptDialog] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [quizProgress, setQuizProgress] = useState<QuizProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);

  useEffect(() => {
    // Load quiz progress if user is logged in
    const loadProgress = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        const { data } = await supabase
          .from('user_quiz_progress')
          .select('*')
          .eq('user_id', userId)
          .eq('quiz_id', quiz._id)
          .eq('course_id', courseId)
          .single();

        if (data) {
          setQuizProgress(data);
        }
        
        // Load all quiz attempts for the table
        const { data: attempts } = await supabase
          .from('user_quiz_attempts')
          .select('*')
          .eq('user_id', userId)
          .eq('quiz_id', quiz._id)
          .eq('course_id', courseId)
          .order('attempted_at', { ascending: false });
          
        if (attempts) {
          setQuizAttempts(attempts);
        }
      } catch (error) {
} finally {
        setIsLoading(false);
      }
    };

    loadProgress();
  }, [userId, quiz._id, courseId, isQuizActive]);

  const handleAttemptClick = () => {
    if (!userId) {
      toast.error('Please log in to take the quiz');
      return;
    }

    // Check if max attempts reached
    if (quizProgress && !quiz.allowRetakes) {
      if (quizProgress.total_attempts >= 1) {
        toast.error('You have already attempted this quiz. Retakes are not allowed.');
        return;
      }
    }

    if (quizProgress && quiz.maxAttempts && quizProgress.total_attempts >= quiz.maxAttempts) {
      toast.error(`You have reached the maximum number of attempts (${quiz.maxAttempts})`);
      return;
    }

    setShowAttemptDialog(true);
  };

  const handleStartQuiz = async () => {
    setIsStarting(true);

    try {
      // Request fullscreen
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }

      // Close dialog and start quiz
      setShowAttemptDialog(false);
      setIsQuizActive(true);
      toast.success('Quiz started! Good luck!');
      
    } catch (error) {
toast.error('Could not enter fullscreen mode');
    } finally {
      setIsStarting(false);
    }
  };

  const handleExitQuiz = () => {
    setIsQuizActive(false);
    // Refresh progress data
    const loadProgress = async () => {
      if (!userId) return;
      
      try {
        const { data } = await supabase
          .from('user_quiz_progress')
          .select('*')
          .eq('user_id', userId)
          .eq('quiz_id', quiz._id)
          .eq('course_id', courseId)
          .single();

        if (data) {
          setQuizProgress(data);
        }
      } catch (error) {
}
    };
    loadProgress();
  };

  const instructions = getSafeText(quiz.instructions);
  const description = quiz.description || '';

  // If quiz is active, show the quiz-taking interface
  if (isQuizActive && userId) {
    // Transform questions to the expected format
    const quizForTaking = {
      ...quiz,
      questions: quiz.questions as QuizQuestion[]
    };
    
    return (
      <QuizTaking
        quiz={quizForTaking}
        courseId={courseId}
        courseName={courseName}
        userId={userId}
        onExit={handleExitQuiz}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3">
              {quiz.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className="bg-white text-black border-white">
                <Clock className="w-3 h-3 mr-1" />
                {quiz.timeLimit} minutes
              </Badge>
              <Badge variant="outline" className="bg-white text-black border-white">
                <Target className="w-3 h-3 mr-1" />
                Pass: {quiz.passingScore}%
              </Badge>
              <Badge variant="outline" className="bg-white text-black border-white">
                <ClipboardList className="w-3 h-3 mr-1" />
                {quiz.questions.length} Questions
              </Badge>
              {quizProgress && quizProgress.completed && (
                <Badge variant="outline" className="bg-white text-black border-white">
                  <Award className="w-3 h-3 mr-1" />
                  Best: {quizProgress.best_percentage}%
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Attempts Info */}
        {quizProgress && quizProgress.total_attempts > 0 && (
          <div className="bg-black p-4 mb-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="text-blue-400 font-medium">
                  Attempts: {quizProgress.total_attempts}
                  {quiz.maxAttempts && ` / ${quiz.maxAttempts}`}
                </p>
                {quizProgress.passed && (
                  <p className="text-emerald-400 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    You have passed this quiz!
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Description */}
      {description && (
        <Card className="bg-black">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-white" />
              Description
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
              {getSafeText(description)}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      {instructions && (
        <Card className="bg-black">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-white" />
              Quiz Instructions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-yellow-500/10 border border-yellow-500/30 p-4">
              <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                {instructions}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quiz Attempts Table */}
      {quizAttempts.length > 0 && (
        <Card className="bg-black">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-white" />
              Quiz Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-black hover:bg-white/5">
                    <TableHead className="text-gray-400">Attempt</TableHead>
                    <TableHead className="text-gray-400">Status</TableHead>
                    <TableHead className="text-gray-400">Time Taken</TableHead>
                    <TableHead className="text-gray-400">Correct Answers</TableHead>
                    <TableHead className="text-gray-400">Score</TableHead>
                    <TableHead className="text-gray-400">Percentage</TableHead>
                    <TableHead className="text-gray-400 text-center">Badge</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quizAttempts.map((attempt, index) => {
                    const passed = attempt.percentage >= (quiz.passingScore || 60);
                    const timeTaken = attempt.time_taken;
                    const questionsCorrect = attempt.questions_correct || attempt.score;
                    
                    return (
                      <TableRow key={attempt.id} className="border-black hover:bg-white/5">
                        <TableCell className="text-white">{quizAttempts.length - index}</TableCell>
                        <TableCell>
                          <Badge className={passed ? 'bg-emerald-500' : 'bg-red-500'}>
                            {passed ? 'Passed' : 'Failed'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-white">{formatTime(timeTaken)}</TableCell>
                        <TableCell className="text-white">{questionsCorrect} / {attempt.total_questions || quiz.questions.length}</TableCell>
                        <TableCell className="text-white">{attempt.score} pts</TableCell>
                        <TableCell className="text-white font-semibold">{attempt.percentage}%</TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            <div className="relative w-16 h-16">
                              <Image
                                src="/badge3.svg"
                                alt="Quiz Badge"
                                width={64}
                                height={64}
                                className="object-contain"
                              />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-white font-bold text-sm drop-shadow-lg">
                                  {attempt.percentage}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attempt Button */}
      <Card className="bg-black">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            {/* Show retake button only if retakes are allowed or no attempts yet */}
            {(quiz.allowRetakes || quizAttempts.length === 0) && (
              <Button
                onClick={handleAttemptClick}
                disabled={isLoading || !userId}
                size="lg"
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white text-lg px-8"
              >
                <ClipboardList className="w-5 h-5 mr-2" />
                {quizAttempts.length > 0 ? 'Retake Quiz' : 'Attempt Quiz'}
              </Button>
            )}
            
            {!userId && (
              <p className="text-sm text-gray-400">
                Please log in to attempt this quiz
              </p>
            )}
            
            {userId && !quiz.allowRetakes && quizAttempts.length > 0 && (
              <p className="text-sm text-gray-400">
                Retakes are not allowed for this quiz
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Fullscreen Permission Dialog */}
      <AlertDialog open={showAttemptDialog} onOpenChange={setShowAttemptDialog}>
        <AlertDialogContent className="bg-black border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <Maximize2 className="w-5 h-5 text-white" />
              Fullscreen Mode Required
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-gray-300">
                <p>This quiz will be displayed in fullscreen mode to ensure a focused testing environment.</p>
                <br />
                <strong className="text-white">Quiz Details:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Time Limit: {quiz.timeLimit} minutes</li>
                  <li>Total Questions: {quiz.questions.length}</li>
                  <li>Passing Score: {quiz.passingScore}%</li>
                  <li>You must answer ALL questions to submit</li>
                </ul>
                <br />
                <p>Are you ready to start the quiz?</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStartQuiz}
              disabled={isStarting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isStarting ? 'Starting...' : 'Start Quiz'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
