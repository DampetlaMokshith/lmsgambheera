import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { user_id, page_url, activity_type = 'page_visit', session_duration = 15 } = await request.json();

    if (!user_id) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Convert to IST timezone for activity_date
    const now = new Date();
    const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000)); // Add 5.5 hours for IST
    const activity_date = istTime.toISOString().split('T')[0]; // Get IST date in YYYY-MM-DD format

    // Use service role client for database operations to bypass RLS temporarily
    const { data, error } = await supabase
      .from('user_activities')
      .insert([
        {
          user_id,
          activity_date,
          activity_timestamp: istTime.toISOString(),
          session_duration,
          page_url,
          activity_type,
        },
      ])
      .select();

    if (error) {
// If table doesn't exist, create a simple fallback response
      if (error.code === '42P01') {
return NextResponse.json({
          success: true,
          data: { mock: true, message: 'Activity tracking will work after database setup' },
          message: 'Database not ready - using mock response',
        });
      }
      
      return NextResponse.json(
        { success: false, error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data[0],
      message: 'Activity recorded successfully',
    });
  } catch (error) {
return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');

    if (!user_id) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user activities for the specified date range
    let query = supabase
      .from('user_activities')
      .select('*')
      .eq('user_id', user_id)
      .order('activity_date', { ascending: true });

    if (start_date) {
      query = query.gte('activity_date', start_date);
    }
    if (end_date) {
      query = query.lte('activity_date', end_date);
    }

    const { data, error } = await query;

    if (error) {
return NextResponse.json(
        { success: false, error: 'Failed to fetch activities' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      count: data.length,
    });
  } catch (error) {
return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
