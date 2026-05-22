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

    // Get sanityId (course's Sanity ID) from query params
    const { searchParams } = new URL(request.url);
    const sanityId = searchParams.get('sanityId');

    if (!sanityId) {
      return NextResponse.json(
        { error: 'Missing required parameter: sanityId' },
        { status: 400 }
      );
    }

    // Step 1: Get Supabase course UUID from courses table using Sanity ID
    const { data: courseData, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('id, sanity_id, title')
      .eq('sanity_id', sanityId)
      .single();

    if (courseError || !courseData) {
      return NextResponse.json({
        students: [],
        courseTitle: '',
        message: 'Course not found'
      });
    }

    // Step 2: Fetch all students enrolled in this course
    const { data: enrollments, error: enrollError } = await supabaseAdmin
      .from('course_enrollments')
      .select('user_id, user_name, user_email, enrolled_at, progress, certificate_issued')
      .eq('course_id', courseData.id);

    if (enrollError) {
      console.error('Error fetching enrollments:', enrollError);
      return NextResponse.json(
        { error: 'Failed to fetch enrollments', details: enrollError.message },
        { status: 500 }
      );
    }

    if (!enrollments || enrollments.length === 0) {
      return NextResponse.json({
        students: [],
        courseTitle: courseData.title,
        message: 'No students enrolled in this course'
      });
    }

    // Step 3: For each enrollment, get additional user data and progress
    const studentsData = await Promise.all(
      enrollments.map(async (enrollment) => {
        const userId = enrollment.user_id;

        // Get email from enrollment first, fallback to RPC function
        let userEmail = enrollment.user_email || '';
        if (!userEmail) {
          try {
            const { data: rpcEmail } = await supabaseAdmin.rpc('get_user_email', { user_uuid: userId });
            if (rpcEmail) userEmail = rpcEmail;
          } catch {
            // Email fetch failed
          }
        }

        // Get user name from enrollment first, fallback to profiles
        let userName = enrollment.user_name || '';
        if (!userName) {
          // Try user_profiles
          const { data: profileData } = await supabaseAdmin
            .from('user_profiles')
            .select('full_name')
            .eq('user_id', userId)
            .single();

          if (profileData?.full_name) {
            userName = profileData.full_name;
          } else {
            // Fallback to users table
            const { data: userData } = await supabaseAdmin
              .from('users')
              .select('full_name')
              .eq('id', userId)
              .single();

            userName = userData?.full_name || `Student ${userId.substring(0, 8)}`;
          }
        }

        // Get progress from course_progress_summary
        let progressPercentage = enrollment.progress || 0;
        const { data: progressData } = await supabaseAdmin
          .from('course_progress_summary')
          .select('progress_percentage')
          .eq('user_id', userId)
          .eq('course_id', sanityId)
          .single();

        if (progressData?.progress_percentage !== undefined) {
          progressPercentage = progressData.progress_percentage;
        }

        // Get quiz badges count
        const { data: quizData } = await supabaseAdmin
          .from('user_quiz_attempts')
          .select('quiz_id, percentage')
          .eq('user_id', userId)
          .eq('course_id', sanityId)
          .gte('percentage', 60);

        const badgesCount = quizData?.length || 0;

        return {
          id: userId,
          name: userName,
          email: userEmail || 'No email',
          progressPercentage,
          badgesCount,
          enrolledAt: enrollment.enrolled_at,
          certificateIssued: enrollment.certificate_issued || progressPercentage >= 100,
        };
      })
    );

    return NextResponse.json({
      students: studentsData,
      courseTitle: courseData.title,
      totalCount: studentsData.length,
    });
  } catch (error) {
    console.error('Unexpected error in course-students API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
