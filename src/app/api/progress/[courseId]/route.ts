import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { client } from "@/sanity/lib/client";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/progress/[courseId]?userId=xxx
 * Get progress data for a user in a specific course
 * 
 * Returns:
 * {
 *   user_id: string,
 *   course_id: string,
 *   completed_items: number,
 *   total_items: number,
 *   progress_percentage: number,
 *   breakdown: {
 *     lectures: { completed: number, total: number },
 *     modules: { completed: number, total: number },
 *     assignments: { completed: number, total: number },
 *     quizzes: { completed: number, total: number }
 *   },
 *   last_activity: string,
 *   completed_item_ids: string[]
 * }
 */
export async function GET(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const courseId = params.courseId;

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId query parameter" },
        { status: 400 }
      );
    }

    if (!courseId) {
      return NextResponse.json(
        { error: "Missing courseId parameter" },
        { status: 400 }
      );
    }

    // Fetch course structure from Sanity to get total counts
    const courseData = await client.fetch(`
      *[_type == "course" && _id == $courseId][0]{
        _id,
        title,
        sections[]->{
          _id,
          lectures[]->{_id},
          modules[]->{_id},
          assignments[]->{_id},
          quiz->{_id}
        }
      }
    `, { courseId });

    if (!courseData) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }

    // Calculate total items in course
    let totalLectures = 0;
    let totalModules = 0;
    let totalAssignments = 0;
    let totalQuizzes = 0;

    courseData.sections?.forEach((section: {
      lectures?: Array<{ _id: string }>;
      modules?: Array<{ _id: string }>;
      assignments?: Array<{ _id: string }>;
      quiz?: { _id: string } | null;
    }) => {
      totalLectures += section.lectures?.length || 0;
      totalModules += section.modules?.length || 0;
      totalAssignments += section.assignments?.length || 0;
      // Quiz is a single reference, not an array
      if (section.quiz?._id) {
        totalQuizzes += 1;
      }
    });

    const totalItems = totalLectures + totalModules + totalAssignments + totalQuizzes;

    // Get user's progress summary
    const { data: summary } = await supabase
      .from("course_progress_summary")
      .select("*")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .single();

    // Get all completed items
    const { data: completions, error: completionsError } = await supabase
      .from("course_item_completions")
      .select("item_id, item_type, completed_at")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .order("completed_at", { ascending: false });

    if (completionsError && completionsError.code !== 'PGRST116') {
      console.error("Error fetching completions:", completionsError);
    }

    const completedItems: Array<{ item_id: string; item_type: string; completed_at: string }> = completions || [];
    const completedCount = completedItems.length;

    // Calculate progress percentage
    const progressPercentage = totalItems > 0
      ? Math.round((completedCount / totalItems) * 100)
      : 0;

    // Update the summary table with calculated percentage
    if (summary) {
      await supabase
        .from("course_progress_summary")
        .update({ progress_percentage: progressPercentage })
        .eq("user_id", userId)
        .eq("course_id", courseId);
    }

    // Build response
    const response = {
      user_id: userId,
      course_id: courseId,
      course_title: courseData.title,
      completed_items: completedCount,
      total_items: totalItems,
      progress_percentage: progressPercentage,
      breakdown: {
        lectures: {
          completed: summary?.lectures_completed || 0,
          total: totalLectures,
        },
        modules: {
          completed: summary?.modules_completed || 0,
          total: totalModules,
        },
        assignments: {
          completed: summary?.assignments_completed || 0,
          total: totalAssignments,
        },
        quizzes: {
          completed: summary?.quizzes_completed || 0,
          total: totalQuizzes,
        },
      },
      last_activity: summary?.last_activity || null,
      started_at: summary?.started_at || null,
      completed_item_ids: completedItems.map((c: { item_id: string }) => c.item_id),
      recent_completions: completedItems.slice(0, 5), // Last 5 completed items
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching progress:", error);
    return NextResponse.json(
      { error: "Failed to fetch progress data" },
      { status: 500 }
    );
  }
}
