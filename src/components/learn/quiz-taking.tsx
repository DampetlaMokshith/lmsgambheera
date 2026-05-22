'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
  Clock, 
  XCircle,
  Trophy,
  AlertCircle,
  Pause,
  Play,
  LogOut
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

interface QuizQuestion {
  _key?: string;
  question: string | Record<string, unknown>[] | Record<string, unknown>;
  options: string[];
  correctAnswer: number;
  explanation?: string | Record<string, unknown>[] | Record<string, unknown>;
}

interface QuizData {
  _id: string;
  title: string;
  timeLimit?: number;
  passingScore?: number;
  questions: QuizQuestion[];
  showCorrectAnswers?: boolean;
  allowRetakes?: boolean;
}

interface QuizTakingProps {
  quiz: QuizData;
  courseId: string;
  courseName: string;
  userId: string;
  onExit: () => void;
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

export default function QuizTaking({ quiz, courseId, courseName, userId, onExit }: QuizTakingProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(quiz.questions.length).fill(null));
  const [visitedQuestions, setVisitedQuestions] = useState<Set<number>>(new Set([0]));
  const [timeRemaining, setTimeRemaining] = useState((quiz.timeLimit || 30) * 60); // Convert minutes to seconds
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [timeTaken, setTimeTaken] = useState(0);
  const [score, setScore] = useState(0);
  const [percentage, setPercentage] = useState(0);

  const submitQuiz = useCallback(async () => {
    if (isSubmitting || hasSubmitted) return;
    
    setIsSubmitting(true);
    setHasSubmitted(true);
    
    // Capture the exact time taken at the moment of submission
    const finalTimeTaken = (quiz.timeLimit || 30) * 60 - timeRemaining;
    setTimeTaken(finalTimeTaken);

    try {
      // Calculate score
      let correctCount = 0;
      quiz.questions.forEach((q, index) => {
        if (answers[index] === q.correctAnswer) {
          correctCount++;
        }
      });

      const calculatedScore = correctCount;
      const calculatedPercentage = Math.round((correctCount / quiz.questions.length) * 100);
      const passed = calculatedPercentage >= (quiz.passingScore || 60);

      setScore(calculatedScore);
      setPercentage(calculatedPercentage);

      // Save quiz attempt with comprehensive data
      try {
        const questionsAnswered = answers.filter(a => a !== null).length;
        
        await supabase
          .from('user_quiz_attempts')
          .insert({
            user_id: userId,
            quiz_id: quiz._id,
            course_id: courseId,
            course_name: courseName,
            
            // Quiz Configuration
            total_questions: quiz.questions.length,
            time_limit_minutes: quiz.timeLimit || 30,
            allows_retakes: quiz.allowRetakes || false,
            passing_score_percentage: quiz.passingScore || 60,
            
            // Attempt Details
            questions_answered: questionsAnswered,
            questions_correct: calculatedScore,
            score: calculatedScore,
            percentage: calculatedPercentage,
            passed: passed,
            
            // Time Tracking
            time_taken: finalTimeTaken,
            time_remaining: timeRemaining,
            
            // Answer Data
            answers: answers,
            
            // Timestamps
            attempted_at: new Date().toISOString(),
            submitted_at: new Date().toISOString()
          });
      } catch (attemptError) {
// This is non-critical, continue
      }

      // Update quiz progress (optional - for historical tracking)
      try {
        const { data: existingProgress } = await supabase
          .from('user_quiz_progress')
          .select('*')
          .eq('user_id', userId)
          .eq('quiz_id', quiz._id)
          .eq('course_id', courseId)
          .single();

        const newTotalAttempts = (existingProgress?.total_attempts || 0) + 1;
        const newBestScore = Math.max(existingProgress?.best_score || 0, calculatedScore);
        const newBestPercentage = Math.max(existingProgress?.best_percentage || 0, calculatedPercentage);

        await supabase
          .from('user_quiz_progress')
          .upsert({
            user_id: userId,
            quiz_id: quiz._id,
            course_id: courseId,
            total_attempts: newTotalAttempts,
            best_score: newBestScore,
            best_percentage: newBestPercentage,
            completed: true,
            passed: passed || (existingProgress?.passed || false),
            last_attempted_at: new Date().toISOString()
          });
      } catch (progressError) {
// This is non-critical, continue
      }

      // Mark quiz as complete in the new progress system
      try {
        await fetch('/api/progress/mark-complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userId,
            course_id: courseId,
            item_id: quiz._id,
            item_type: 'quiz',
          }),
        });
      } catch (progressErr) {
}

      // Show confetti if passed (only once)
      if (passed && !showResults) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }

      setShowResults(true);
      setShowSubmitDialog(false);

    } catch (error) {
toast.error('Failed to submit quiz. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [answers, quiz, userId, courseId, courseName, timeRemaining, hasSubmitted, isSubmitting, showResults]);

  const handleAutoSubmit = useCallback(async () => {
    if (!hasSubmitted) {
      toast.error('Time is up! Submitting your quiz automatically...');
      await submitQuiz();
    }
  }, [submitQuiz, hasSubmitted]);

  // Timer logic
  useEffect(() => {
    if (isPaused || hasSubmitted) return;
    
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Auto-submit when time runs out
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [handleAutoSubmit, isPaused, hasSubmitted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleQuestionNavigate = (questionIndex: number) => {
    setCurrentQuestion(questionIndex);
    setVisitedQuestions(prev => new Set([...prev, questionIndex]));
  };

  const getQuestionStatus = (index: number) => {
    if (index === currentQuestion) return 'current';
    if (answers[index] !== null) return 'answered';
    if (visitedQuestions.has(index)) return 'visited';
    return 'not-visited';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'current': return 'bg-red-500 text-white';
      case 'answered': return 'bg-green-500 text-white';
      case 'visited': return 'bg-yellow-500 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const allQuestionsAnswered = () => {
    return answers.every(answer => answer !== null);
  };

  const handleSubmitClick = () => {
    if (!allQuestionsAnswered()) {
      toast.error('Please answer all questions before submitting');
      return;
    }
    setShowSubmitDialog(true);
  };

  const handleExitFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    onExit();
  };

  // Results Modal
  if (showResults) {
    const passed = percentage >= (quiz.passingScore || 60);

    return (
      <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl bg-black border">
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              {/* Icon */}
              <div className="flex justify-center">
                {passed ? (
                  <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center">
                    <Trophy className="w-12 h-12 text-emerald-400" />
                  </div>
                ) : (
                  <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center">
                    <XCircle className="w-12 h-12 text-red-400" />
                  </div>
                )}
              </div>

              {/* Title */}
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  {passed ? 'Congratulations!' : 'Quiz Completed'}
                </h2>
                <p className="text-gray-400">
                  {passed 
                    ? "You've successfully passed the quiz!" 
                    : "Keep practicing! You'll do better next time."}
                </p>
              </div>

              {/* Score */}
              <div className="space-y-4">
                <div className="text-6xl font-bold">
                  <span className={passed ? 'text-emerald-400' : 'text-red-400'}>
                    {percentage}%
                  </span>
                </div>
                <div className="text-gray-300">
                  <p className="text-lg">
                    You got {score} out of {quiz.questions.length} questions correct
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    Passing Score: {quiz.passingScore || 60}%
                  </p>
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700">
                <div className="text-center">
                  <p className="text-gray-400 text-sm mb-1">Time Taken</p>
                  <p className="text-white font-semibold">
                    {formatTime(timeTaken)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 text-sm mb-1">Status</p>
                  <Badge className={passed ? 'bg-emerald-500' : 'bg-red-500'}>
                    {passed ? 'Passed' : 'Failed'}
                  </Badge>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4">
                <Button
                  onClick={handleExitFullscreen}
                  size="lg"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Exit Quiz
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQ = quiz.questions[currentQuestion];
  const questionText = getSafeText(currentQ.question);

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 overflow-auto">
      <div className="min-h-screen flex">
        {/* Left Sidebar - Question Navigation */}
        <div className="w-64 bg-black border-r border p-6 flex flex-col">
          {/* Timer */}
          <div className="mb-6">
            <div className={`text-center p-4 ${
              timeRemaining < 60 ? 'bg-red-500/20 border' : 'bg-blue-500/20 border '
            }`}>
              <Clock className={`w-6 h-6 mx-auto mb-2 ${
                timeRemaining < 60 ? 'text-red-400' : 'text-blue-400'
              }`} />
              <div className={`text-2xl font-bold ${
                timeRemaining < 60 ? 'text-red-400' : 'text-white'
              }`}>
                {formatTime(timeRemaining)}
              </div>
              <p className="text-xs text-gray-400 mt-1">Time Remaining</p>
            </div>
            
            {/* Timer Controls */}
            <div className="mt-3 space-y-2">
              <Button
                onClick={() => setIsPaused(!isPaused)}
                variant="outline"
                className="w-full bg-black text-white hover:bg-gray-800 border-gray-700"
                size="sm"
              >
                {isPaused ? (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Resume Timer
                  </>
                ) : (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Pause Timer
                  </>
                )}
              </Button>
              
              <Button
                onClick={() => setShowExitDialog(true)}
                variant="outline"
                className="w-full bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/30"
                size="sm"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Exit Quiz
              </Button>
            </div>
          </div>

          {/* Legend */}
          <div className="mb-4 space-y-2">
            <h3 className="text-white font-semibold mb-3">Choose a Question</h3>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-500"></div>
                <span className="text-gray-300">Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-red-500"></div>
                <span className="text-gray-300">Current</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-gray-600"></div>
                <span className="text-gray-300">Not Visited</span>
              </div>
            </div>
          </div>

          {/* Question Grid */}
          <div className="flex-1 overflow-auto">
            <div className="grid grid-cols-4 gap-2">
              {quiz.questions.map((_, index) => {
                const status = getQuestionStatus(index);
                return (
                  <button
                    key={index}
                    onClick={() => handleQuestionNavigate(index)}
                    className={`
                      aspect-square font-semibold text-sm
                      transition-all hover:scale-110
                      ${getStatusColor(status)}
                    `}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-6">
            <Button
              onClick={handleSubmitClick}
              disabled={!allQuestionsAnswered()}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
            >
              Submit Quiz
            </Button>
            {!allQuestionsAnswered() && (
              <p className="text-xs text-yellow-400 text-center mt-2">
                Answer all questions to submit
              </p>
            )}
          </div>
        </div>

        {/* Right Side - Question Display */}
        <div className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-white">{quiz.title}</h1>
                <Badge variant="outline" className="bg-black text-white border-blue-500/30">
                  Question {currentQuestion + 1} / {quiz.questions.length}
                </Badge>
              </div>
            </div>

            {/* Question Card */}
            <Card className="bg-black mb-6">
              <CardContent className="p-8">
                {/* Question Text */}
                <div className="mb-8">
                  <h2 className="text-xl text-white font-medium leading-relaxed">
                    {questionText}
                  </h2>
                </div>

                {/* Options */}
                <div className="space-y-4">
                  {currentQ.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(index)}
                      className={`
                        w-full text-left p-6 border-2 transition-all cursor-pointer
                        ${answers[currentQuestion] === index
                          ? 'bg-blue-500/20 border-blue-500 text-white'
                          : 'bg-black border text-gray-300 hover:border-white/5'
                        }
                      `}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`
                          flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center font-semibold
                          ${answers[currentQuestion] === index
                            ? 'border-blue-500 bg-blue-500 text-white'
                            : 'border-gray-600 text-gray-400'
                          }
                        `}>
                          {String.fromCharCode(65 + index)}
                        </div>
                        <span className="flex-1 pt-0.5">{option}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between">
              <Button
                onClick={() => handleQuestionNavigate(currentQuestion - 1)}
                disabled={currentQuestion === 0}
                variant="outline"
                className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700 disabled:opacity-50"
              >
                Previous
              </Button>
              
              <div className="text-gray-400 text-sm">
                {answers.filter(a => a !== null).length} / {quiz.questions.length} answered
              </div>

              <Button
                onClick={() => handleQuestionNavigate(currentQuestion + 1)}
                disabled={currentQuestion === quiz.questions.length - 1}
                className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent className="bg-black border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-400" />
              Submit Quiz?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-gray-300">
                <p>Are you sure you want to submit your quiz? You won&apos;t be able to change your answers after submission.</p>
                <br />
                <strong className="text-white">Summary:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Total Questions: {quiz.questions.length}</li>
                  <li>Answered: {answers.filter(a => a !== null).length}</li>
                  <li>Time Remaining: {formatTime(timeRemaining)}</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={submitQuiz}
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Exit Confirmation Dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent className="bg-gray-900 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-400" />
              Exit Quiz?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-gray-300">
                <p>Are you sure you want to exit the quiz? You will receive a score of 0%.</p>
                <br />
                <p className="text-red-400 font-semibold">Warning: Your progress will not be saved!</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExitFullscreen}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Exit Quiz
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
