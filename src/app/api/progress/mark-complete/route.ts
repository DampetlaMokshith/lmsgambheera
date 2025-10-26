import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Create Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/progress/mark-complete
 * Mark a course item (lecture, module, assignment, quiz) as completed
 * 
 * Request body:
 * {
 *   user_id: string,      // UUID of the user
 *   course_id: string,    // Sanity course _id
 *   item_id: string,      // Sanity item _id
 *   item_type: 'lecture' | 'module' | 'assignment' | 'quiz',
 *   section_id?: string   // Optional: Sanity section _id
 * }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user_id, course_id, item_id, item_type, section_id } = body;

    // Validate required fields
    if (!user_id || !course_id || !item_id || !item_type) {
      return NextResponse.json(
        { error: "Missing required fields: user_id, course_id, item_id, item_type" },
        { status: 400 }
      );
    }

    // Validate item_type
    const validTypes = ['lecture', 'module', 'assignment', 'quiz'];
    if (!validTypes.includes(item_type)) {
      return NextResponse.json(
        { error: `Invalid item_type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Insert or ignore if already exists (UPSERT)
    const { data, error } = await supabase
      .from("course_item_completions")
      .upsert(
        {
          user_id,
          course_id,
          item_id,
          item_type,
          section_id: section_id || null,
          completed_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,course_id,item_id,item_type',
          ignoreDuplicates: true,
        }
      )
      .select()
      .single();

    if (error) {
      console.error("Error marking item as complete:", error);
      return NextResponse.json(
        { error: "Failed to mark item as complete", details: error.message },
        { status: 500 }
      );
    }

    // The trigger will automatically update the progress_summary table
    return NextResponse.json({
      success: true,
      message: "Item marked as complete",
      data,
    });
  } catch (error) {
    console.error("Unexpected error in mark-complete:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/progress/mark-complete
 * Unmark a course item as completed (for testing or undo functionality)
 * 
 * Request body: Same as POST
 */
export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { user_id, course_id, item_id, item_type } = body;

    if (!user_id || !course_id || !item_id || !item_type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("course_item_completions")
      .delete()
      .eq("user_id", user_id)
      .eq("course_id", course_id)
      .eq("item_id", item_id)
      .eq("item_type", item_type);

    if (error) {
      console.error("Error unmarking item:", error);
      return NextResponse.json(
        { error: "Failed to unmark item", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Item unmarked successfully",
    });
  } catch (error) {
    console.error("Unexpected error in DELETE mark-complete:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
