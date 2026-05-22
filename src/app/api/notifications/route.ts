import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client with service role for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown>;
  read: boolean;
  created_at: string;
  updated_at: string;
}

// GET - Fetch notifications for a user
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
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') || 'student'; // 'student' or 'faculty'

    // Fetch notifications
    const { data: notifications, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json(
        { error: 'Failed to fetch notifications', details: error.message },
        { status: 500 }
      );
    }

    // Generate dynamic notifications based on role
    const dynamicNotifications = await generateDynamicNotifications(userId, role);

    // Combine stored and dynamic notifications
    const allNotifications = [...(notifications || []), ...dynamicNotifications];
    
    // Sort by created_at
    allNotifications.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const unreadCount = allNotifications.filter(n => !n.read).length;

    return NextResponse.json({
      notifications: allNotifications,
      unreadCount,
      totalCount: allNotifications.length,
    });
  } catch (error) {
    console.error('Unexpected error in notifications API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new notification (internal use only)
export async function POST(request: NextRequest) {
  try {
    // This endpoint should only be called by server-side code
    // Check for internal API key or valid user auth
    const authHeader = request.headers.get('authorization');
    const internalKey = request.headers.get('x-internal-key');
    
    // Validate either internal key or user auth
    let authorizedUserId: string | null = null;
    
    if (internalKey === process.env.SUPABASE_SERVICE_ROLE_KEY) {
      // Internal server call - allow any userId
      authorizedUserId = 'internal';
    } else if (authHeader?.startsWith('Bearer ')) {
      const accessToken = authHeader.substring(7);
      const { data: { user } } = await supabaseAdmin.auth.getUser(accessToken);
      if (user) {
        authorizedUserId = user.id;
      }
    }
    
    if (!authorizedUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userId, type, title, message, data } = body;

    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data: notification, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        data: data || {},
        read: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return NextResponse.json(
        { error: 'Failed to create notification', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ notification });
  } catch (error) {
    console.error('Unexpected error in notifications API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Mark notification(s) as read
export async function PATCH(request: NextRequest) {
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
    
    const body = await request.json();
    const { notificationId, markAllRead } = body;

    if (markAllRead) {
      // Mark all notifications as read for the authenticated user
      const { error } = await supabaseAdmin
        .from('notifications')
        .update({ read: true, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) {
        console.error('Error marking all as read:', error);
        return NextResponse.json(
          { error: 'Failed to mark all as read', details: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, message: 'All notifications marked as read' });
    }

    if (notificationId) {
      // Mark single notification as read - verify it belongs to the user
      const { error } = await supabaseAdmin
        .from('notifications')
        .update({ read: true, updated_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', userId); // Only update if user owns this notification

      if (error) {
        console.error('Error marking as read:', error);
        return NextResponse.json(
          { error: 'Failed to mark as read', details: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Missing notificationId or markAllRead parameter' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Unexpected error in notifications API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Generate dynamic notifications based on profile completion and other factors
async function generateDynamicNotifications(userId: string, role: string) {
  const dynamicNotifications: Notification[] = [];

  if (role === 'student') {
    // Check student profile completion
    const profileIncomplete = await checkStudentProfileCompletion(userId);
    if (profileIncomplete) {
      dynamicNotifications.push({
        id: `dynamic_profile_${userId}`,
        user_id: userId,
        type: 'profile_incomplete',
        title: 'Complete Your Profile 📋',
        message: 'Please fill in all your personal and academic details to get the most out of your learning experience.',
        data: {
          actionUrl: '/profile',
          actionText: 'Complete Profile',
          icon: '📋',
          isDynamic: true,
        },
        read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  } else if (role === 'faculty') {
    // Check faculty profile completion
    const profileIncomplete = await checkFacultyProfileCompletion(userId);
    if (profileIncomplete) {
      dynamicNotifications.push({
        id: `dynamic_profile_${userId}`,
        user_id: userId,
        type: 'profile_incomplete',
        title: 'Complete Your Profile 📋',
        message: 'Please fill in all your profile details to be visible to students.',
        data: {
          actionUrl: '/faculty/profile',
          actionText: 'Complete Profile',
          icon: '📋',
          isDynamic: true,
        },
        read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  }

  return dynamicNotifications;
}

// Check if student profile is incomplete
async function checkStudentProfileCompletion(userId: string): Promise<boolean> {
  try {
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!profile) return true;

    // Check required fields for student
    const requiredFields = [
      'full_name',
      'gender',
      'date_of_birth',
      'registration_number',
      'college',
      'batch',
      'degree',
      'department',
    ];

    return requiredFields.some(field => !profile[field] || profile[field] === '');
  } catch {
    return false;
  }
}

// Check if faculty profile is incomplete
async function checkFacultyProfileCompletion(userId: string): Promise<boolean> {
  try {
    // Get sanity_faculty_id from users table
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('sanity_faculty_id, email')
      .eq('id', userId)
      .single();

    if (!userData?.sanity_faculty_id) return true;

    // Note: Faculty profile is in Sanity CMS, so we can't check completion here
    // This would need to be done via Sanity query if needed
    return false;
  } catch {
    return false;
  }
}
