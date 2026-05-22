import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client with service role for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface CourseData {
  _id: string;
  title: string;
  slug: { current: string };
  description?: string;
  thumbnail?: { asset?: { url?: string } };
  faculty?: { name: string; email?: string };
  rating?: number;
  totalEnrollments?: number;
  estimatedDuration?: number;
  level?: string;
  price?: number;
  tags?: string[];
  degree?: string;
  department?: string;
  language?: string;
  publishedAt?: string;
}

// Helper function to sync course to Supabase
async function syncCourseIfNeeded(courseData: CourseData) {
  try {
    // Check if course exists
    const { data: existingCourse } = await supabaseAdmin
      .from('courses')
      .select('id')
      .eq('sanity_id', courseData._id)
      .single();

    if (existingCourse) {
      return existingCourse.id;
    }

    // Course doesn't exist, create it
    const newCourseData = {
      sanity_id: courseData._id,
      title: courseData.title,
      slug: courseData.slug?.current || courseData._id,
      description: courseData.description || '',
      thumbnail_url: courseData.thumbnail?.asset?.url || null,
      faculty_name: courseData.faculty?.name || 'Unknown',
      faculty_email: courseData.faculty?.email || null,
      rating: courseData.rating || 4.5,
      total_enrollments: courseData.totalEnrollments || 0,
      estimated_duration: courseData.estimatedDuration || 0,
      level: courseData.level || 'beginner',
      price: courseData.price || 0,
      tags: courseData.tags || [],
      degree: courseData.degree || null,
      department: courseData.department || null,
      language: courseData.language || 'English',
      is_published: true,
      is_featured: false,
      published_at: courseData.publishedAt ? new Date(courseData.publishedAt).toISOString() : new Date().toISOString(),
    };

    const { data: newCourse, error: createError } = await supabaseAdmin
      .from('courses')
      .upsert(newCourseData, { onConflict: 'sanity_id' })
      .select('id')
      .single();

    if (createError) {
      console.error('Error creating course:', createError);
      return null;
    }

    return newCourse?.id;
  } catch (error) {
    console.error('Error syncing course:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
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

    // Use authenticated user's ID and email
    const userId = authUser.id;
    const authUserEmail = authUser.email;
    
    const body = await request.json();
    const { courseSanityId, userName, courseData: inputCourseData } = body;

    // Validate required fields
    if (!courseSanityId) {
      return NextResponse.json(
        { error: 'Missing required field: courseSanityId' },
        { status: 400 }
      );
    }

    // Try to get the course from Supabase, or sync it if provided
    let courseId: string | null = null;
    let coursePrice = 0;
    
    // First try to get from Supabase
    const { data: existingCourseData, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('id, price, title')
      .eq('sanity_id', courseSanityId)
      .single();

    if (existingCourseData) {
      courseId = existingCourseData.id;
      coursePrice = existingCourseData.price || 0;
    } else if (inputCourseData) {
      // Course not in Supabase but we have course data - sync it
      courseId = await syncCourseIfNeeded(inputCourseData);
      coursePrice = inputCourseData.price || 0;
    }

    if (!courseId) {
      console.error('Course not found and could not be synced:', courseError);
      return NextResponse.json(
        { error: 'Course not found. Please try again later.' },
        { status: 404 }
      );
    }

    // Check if already enrolled
    const { data: existingEnrollment } = await supabaseAdmin
      .from('course_enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .maybeSingle();

    if (existingEnrollment) {
      return NextResponse.json({
        success: true,
        alreadyEnrolled: true,
        message: 'You are already enrolled in this course.',
      });
    }

    // For paid courses, verify payment was made
    if (coursePrice > 0) {
      const { data: payment } = await supabaseAdmin
        .from('payments')
        .select('id, status')
        .eq('user_id', userId)
        .eq('course_sanity_id', courseSanityId)
        .eq('status', 'succeeded')
        .maybeSingle();

      if (!payment) {
        return NextResponse.json(
          { error: 'Payment required for this course.' },
          { status: 402 }
        );
      }
    }

    // Create enrollment using service role (bypasses RLS)
    const { data: enrollment, error: enrollError } = await supabaseAdmin
      .from('course_enrollments')
      .insert({
        user_id: userId,
        course_id: courseId,
        enrolled_at: new Date().toISOString(),
        status: 'active',
        progress: 0,
        user_name: userName || null,
        user_email: authUserEmail || null,
      })
      .select()
      .single();

    if (enrollError) {
      // Handle duplicate enrollment gracefully
      if (enrollError.code === '23505') {
        return NextResponse.json({
          success: true,
          alreadyEnrolled: true,
          message: 'You are already enrolled in this course.',
        });
      }
      console.error('Enrollment error:', enrollError);
      return NextResponse.json(
        { error: `Enrollment failed: ${enrollError.message}` },
        { status: 500 }
      );
    }

    console.log(`User ${userId} successfully enrolled in course ${courseSanityId}`);

    return NextResponse.json({
      success: true,
      enrollment,
      message: 'Successfully enrolled in the course!',
    });
  } catch (error) {
    console.error('Enrollment API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check enrollment status
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

    // Use authenticated user's ID
    const userId = authUser.id;

    const { searchParams } = new URL(request.url);
    const courseSanityId = searchParams.get('courseSanityId');

    if (!courseSanityId) {
      return NextResponse.json(
        { error: 'Missing courseSanityId' },
        { status: 400 }
      );
    }

    // Get course ID
    const { data: courseData } = await supabaseAdmin
      .from('courses')
      .select('id')
      .eq('sanity_id', courseSanityId)
      .single();

    if (!courseData) {
      return NextResponse.json({ enrolled: false });
    }

    // Check enrollment
    const { data: enrollment } = await supabaseAdmin
      .from('course_enrollments')
      .select('id, enrolled_at, progress, status')
      .eq('user_id', userId)
      .eq('course_id', courseData.id)
      .maybeSingle();

    return NextResponse.json({
      enrolled: !!enrollment,
      enrollment: enrollment || null,
    });
  } catch (error) {
    console.error('Check enrollment error:', error);
    return NextResponse.json({ enrolled: false });
  }
}
