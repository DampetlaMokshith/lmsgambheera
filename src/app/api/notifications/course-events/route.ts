import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client with service role for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - Create course-related notifications
export async function POST(request: NextRequest) {
  try {
    // Authentication: Check for internal key or valid user auth
    const authHeader = request.headers.get('authorization');
    const internalKey = request.headers.get('x-internal-key');
    
    let isAuthenticated = false;
    let authenticatedUserId: string | null = null;
    
    // Check internal key first (for server-to-server calls)
    if (internalKey === process.env.SUPABASE_SERVICE_ROLE_KEY) {
      isAuthenticated = true;
    } else if (authHeader?.startsWith('Bearer ')) {
      // Check user authentication
      const accessToken = authHeader.substring(7);
      const { data: { user } } = await supabaseAdmin.auth.getUser(accessToken);
      if (user) {
        isAuthenticated = true;
        authenticatedUserId = user.id;
      }
    }
    
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { eventType, courseData, facultyId, studentId, studentName } = body;

    switch (eventType) {
      case 'course_created':
      case 'course_updated':
        // Notify all students about new/updated course
        return await notifyStudentsAboutCourse(eventType, courseData);

      case 'student_completed':
        // Notify faculty when a student completes their course
        return await notifyFacultyAboutCompletion(facultyId, courseData, studentId, studentName);

      default:
        return NextResponse.json(
          { error: 'Invalid event type' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Unexpected error in course-events API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Notify all students about new or updated course
async function notifyStudentsAboutCourse(
  eventType: 'course_created' | 'course_updated',
  courseData: {
    title: string;
    slug: string;
    sanityId: string;
    facultyName: string;
    department?: string;
    degree?: string;
  }
) {
  try {
    // Get all student users
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('role', 'student');

    if (usersError) {
      console.error('Error fetching students:', usersError);
      return NextResponse.json(
        { error: 'Failed to fetch students' },
        { status: 500 }
      );
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ message: 'No students to notify', count: 0 });
    }

    const isNew = eventType === 'course_created';
    const notifications = users.map(user => ({
      user_id: user.id,
      type: eventType,
      title: isNew ? 'New Course Available! 📚' : 'Course Updated 🔄',
      message: isNew 
        ? `${courseData.facultyName} has created a new course: "${courseData.title}"${courseData.department ? ` in ${courseData.department}` : ''}`
        : `"${courseData.title}" has been updated by ${courseData.facultyName}`,
      data: {
        courseTitle: courseData.title,
        courseSlug: courseData.slug,
        courseSanityId: courseData.sanityId,
        facultyName: courseData.facultyName,
        department: courseData.department,
        degree: courseData.degree,
        actionUrl: `/courses/${courseData.slug}`,
        actionText: 'View Course',
        icon: isNew ? '📚' : '🔄',
      },
      read: false,
    }));

    // Batch insert notifications (max 1000 at a time)
    const batchSize = 1000;
    let insertedCount = 0;
    
    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize);
      const { error } = await supabaseAdmin
        .from('notifications')
        .insert(batch);
      
      if (error) {
        console.error('Error inserting notification batch:', error);
      } else {
        insertedCount += batch.length;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Notified ${insertedCount} students about ${isNew ? 'new' : 'updated'} course`,
      count: insertedCount,
    });
  } catch (error) {
    console.error('Error notifying students:', error);
    return NextResponse.json(
      { error: 'Failed to notify students' },
      { status: 500 }
    );
  }
}

// Notify faculty when a student completes their course
async function notifyFacultyAboutCompletion(
  facultyId: string,
  courseData: {
    title: string;
    sanityId: string;
  },
  studentId: string,
  studentName: string
) {
  try {
    // Get faculty user_id from users table using sanity_faculty_id
    const { data: facultyUser, error: facultyError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('sanity_faculty_id', facultyId)
      .single();

    if (facultyError || !facultyUser) {
      console.error('Error finding faculty:', facultyError);
      return NextResponse.json(
        { error: 'Faculty not found' },
        { status: 404 }
      );
    }

    // Create notification for faculty
    const { error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: facultyUser.id,
        type: 'student_completed',
        title: 'Student Completed Your Course! 🎉',
        message: `${studentName} has successfully completed "${courseData.title}"`,
        data: {
          studentId,
          studentName,
          courseTitle: courseData.title,
          courseSanityId: courseData.sanityId,
          actionUrl: '/faculty/progressandgrades',
          actionText: 'View Progress',
          icon: '🎉',
        },
        read: false,
      });

    if (error) {
      console.error('Error creating notification:', error);
      return NextResponse.json(
        { error: 'Failed to create notification' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Notified faculty about ${studentName}'s completion`,
    });
  } catch (error) {
    console.error('Error notifying faculty:', error);
    return NextResponse.json(
      { error: 'Failed to notify faculty' },
      { status: 500 }
    );
  }
}
