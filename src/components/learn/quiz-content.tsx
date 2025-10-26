'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

interface QuizContentProps {
  quiz: QuizData;
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

export default function QuizContent({ quiz, courseId, userId }: QuizContentProps) {
  const [showAttemptDialog, setShowAttemptDialog] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [quizProgress, setQuizProgress] = useState<QuizProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isQuizActive, setIsQuizActive] = useState(false);

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
      } catch (error) {
        console.error('Error loading quiz progress:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProgress();
  }, [userId, quiz._id, courseId]);

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
      console.error('Error starting quiz:', error);
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
        console.error('Error loading quiz progress:', error);
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
              <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                <Clock className="w-3 h-3 mr-1" />
                {quiz.timeLimit} minutes
              </Badge>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                <Target className="w-3 h-3 mr-1" />
                Pass: {quiz.passingScore}%
              </Badge>
              <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">
                <ClipboardList className="w-3 h-3 mr-1" />
                {quiz.questions.length} Questions
              </Badge>
              {quizProgress && quizProgress.completed && (
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
                  <Award className="w-3 h-3 mr-1" />
                  Best: {quizProgress.best_percentage}%
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Attempts Info */}
        {quizProgress && quizProgress.total_attempts > 0 && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
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
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-blue-400" />
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
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-400" />
              Quiz Instructions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                {instructions}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attempt Button */}
      <Card className="bg-gray-900 border-gray-700">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <Button
              onClick={handleAttemptClick}
              disabled={isLoading || !userId}
              size="lg"
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white text-lg px-8"
            >
              <ClipboardList className="w-5 h-5 mr-2" />
              {quizProgress && quizProgress.total_attempts > 0 ? 'Retake Quiz' : 'Attempt Quiz'}
            </Button>
            
            {!userId && (
              <p className="text-sm text-gray-400">
                Please log in to attempt this quiz
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Fullscreen Permission Dialog */}
      <AlertDialog open={showAttemptDialog} onOpenChange={setShowAttemptDialog}>
        <AlertDialogContent className="bg-gray-900 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <Maximize2 className="w-5 h-5 text-blue-400" />
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
