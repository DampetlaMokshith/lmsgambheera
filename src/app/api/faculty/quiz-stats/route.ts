import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Create Supabase client with service role key to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/faculty/quiz-stats?userId=xxx&courseId=yyy
 * Fetch quiz attempts for a specific student in a specific course
 * Uses service role to bypass RLS
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const courseId = searchParams.get('courseId');

    if (!userId || !courseId) {
      return NextResponse.json(
        { error: "Missing userId or courseId query parameter" },
        { status: 400 }
      );
    }

    // Fetch quiz attempts from user_quiz_attempts table
    // course_id in this table is stored as Sanity ID (text)
    const { data: quizAttempts, error: attemptsError } = await supabase
      .from('user_quiz_attempts')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .order('submitted_at', { ascending: false });

    if (attemptsError) {
      return NextResponse.json(
        { error: "Failed to fetch quiz attempts", details: attemptsError.message },
        { status: 500 }
      );
    }

    // Also fetch quiz progress for summary data
    const { data: quizProgress } = await supabase
      .from('user_quiz_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .order('last_attempted_at', { ascending: false });

    // Group attempts by quiz_id and get the best attempt for each
    const quizMap = new Map<string, typeof quizAttempts[0]>();
    if (quizAttempts) {
      quizAttempts.forEach((attempt) => {
        const existing = quizMap.get(attempt.quiz_id);
        if (!existing || (attempt.percentage || 0) > (existing.percentage || 0)) {
          quizMap.set(attempt.quiz_id, attempt);
        }
      });
    }

    const bestAttempts = Array.from(quizMap.values());

    return NextResponse.json({
      success: true,
      quizAttempts: bestAttempts,
      quizProgress: quizProgress || [],
      totalAttempts: quizAttempts?.length || 0,
    });

  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
