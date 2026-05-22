import { NextRequest, NextResponse } from 'next/server';
import { syncCourseToSupabase } from '@/lib/course-management';

// This endpoint can be called by Sanity webhooks when a course is published
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the webhook payload
    if (!body || !body._id || !body.title) {
      return NextResponse.json(
        { error: 'Invalid course data' },
        { status: 400 }
      );
    }

    // Only sync published courses
    if (!body.isPublished) {
      return NextResponse.json(
        { message: 'Course not published, skipping sync' },
        { status: 200 }
      );
    }

    // Sync course to Supabase
    await syncCourseToSupabase(body);

    return NextResponse.json(
      { message: 'Course synced successfully' },
      { status: 200 }
    );
  } catch (error) {
return NextResponse.json(
      { error: 'Failed to sync course' },
      { status: 500 }
    );
  }
}

// For manual testing - GET endpoint to sync a specific course
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get('courseId');

  if (!courseId) {
    return NextResponse.json(
      { error: 'Course ID is required' },
      { status: 400 }
    );
  }

  try {
    // You would fetch the course from Sanity here using the courseId
    // For now, returning a placeholder response
    return NextResponse.json(
      { message: 'Manual sync endpoint - implement course fetching from Sanity' },
      { status: 200 }
    );
  } catch (error) {
return NextResponse.json(
      { error: 'Failed to sync course manually' },
      { status: 500 }
    );
  }
}
