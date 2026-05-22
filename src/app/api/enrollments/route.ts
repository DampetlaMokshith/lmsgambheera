import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client with service role for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Authentication: Get the bearer token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const accessToken = authHeader.substring(7);
    
    // Verify the token and get the authenticated user
    const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    
    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // Use authenticated user's ID - ignore any userId from params
    const userId = authUser.id;

    // Fetch enrollments with course details using service role (bypasses RLS)
    const { data: enrollments, error: enrollError } = await supabaseAdmin
      .from('course_enrollments')
      .select(`
        id,
        course_id,
        enrolled_at,
        progress,
        status,
        last_accessed,
        certificate_issued,
        user_name,
        user_email
      `)
      .eq('user_id', userId)
      .order('enrolled_at', { ascending: false });

    if (enrollError) {
      console.error('Error fetching enrollments:', enrollError);
      return NextResponse.json(
        { error: 'Failed to fetch enrollments', details: enrollError.message },
        { status: 500 }
      );
    }

    if (!enrollments || enrollments.length === 0) {
      return NextResponse.json({ enrollments: [], courses: [] });
    }

    // Get course details for each enrollment
    const courseIds = enrollments.map(e => e.course_id);
    const { data: courses, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('id, sanity_id, title, slug, thumbnail_url, faculty_name')
      .in('id', courseIds);

    if (courseError) {
      console.error('Error fetching courses:', courseError);
      return NextResponse.json(
        { error: 'Failed to fetch course details', details: courseError.message },
        { status: 500 }
      );
    }

    // Get progress data for each course (using sanity_id as course_id in progress table)
    const sanityIds = courses?.map(c => c.sanity_id).filter(Boolean) || [];
    let progressData: Array<{
      course_id: string;
      progress_percentage: number;
      lectures_completed: number;
      modules_completed: number;
      total_completed: number;
      last_activity: string;
    }> = [];
    
    if (sanityIds.length > 0) {
      const { data: progress, error: progressError } = await supabaseAdmin
        .from('course_progress_summary')
        .select('course_id, progress_percentage, lectures_completed, modules_completed, total_completed, last_activity')
        .eq('user_id', userId)
        .in('course_id', sanityIds);
      
      if (!progressError && progress) {
        progressData = progress;
      }
    }

    // Create maps for easy lookup
    const courseMap = new Map(courses?.map(c => [c.id, c]) || []);
    const progressMap = new Map(progressData.map(p => [p.course_id, p]));

    // Combine enrollment data with course and progress details
    const enrichedEnrollments = enrollments.map(enrollment => {
      const course = courseMap.get(enrollment.course_id);
      const sanityId = course?.sanity_id;
      const progress = sanityId ? progressMap.get(sanityId) : null;

      return {
        enrollmentId: enrollment.id,
        courseId: enrollment.course_id,
        sanityId: sanityId || null,
        title: course?.title || 'Unknown Course',
        slug: course?.slug || '',
        thumbnailUrl: course?.thumbnail_url || null,
        facultyName: course?.faculty_name || 'Unknown',
        enrolledAt: enrollment.enrolled_at,
        status: enrollment.status,
        lastAccessed: enrollment.last_accessed,
        certificateIssued: enrollment.certificate_issued,
        userName: enrollment.user_name,
        userEmail: enrollment.user_email,
        progressPercentage: progress?.progress_percentage || 0,
        lecturesCompleted: progress?.lectures_completed || 0,
        modulesCompleted: progress?.modules_completed || 0,
        totalCompleted: progress?.total_completed || 0,
        lastActivity: progress?.last_activity || null,
      };
    });

    return NextResponse.json({
      enrollments: enrichedEnrollments,
      totalCount: enrichedEnrollments.length,
    });
  } catch (error) {
    console.error('Unexpected error in enrollments API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
