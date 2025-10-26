import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Debug endpoint to check Supabase connection and tables
export async function GET() {
  try {
    console.log('🔍 Testing Supabase connection...');
    
    // Test 1: Check if we can connect to Supabase
    const { error: connectionError } = await supabase
      .from('courses')
      .select('count')
      .limit(1);

    if (connectionError) {
      console.error('❌ Supabase connection failed:', connectionError);
      return NextResponse.json({
        success: false,
        error: 'Supabase connection failed',
        details: connectionError,
        suggestion: 'Check your .env.local file and make sure Supabase credentials are correct'
      });
    }

    // Test 2: Check if courses table exists and get structure
    const { data: tableInfo, error: tableError } = await supabase
      .from('courses')
      .select('*')
      .limit(1);

    // Test 3: Check if course_enrollments table exists
    const { data: enrollmentTableInfo, error: enrollmentError } = await supabase
      .from('course_enrollments')
      .select('*')
      .limit(1);

    // Test 4: Get current user (if any)
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    return NextResponse.json({
      success: true,
      tests: {
        connection: {
          success: !connectionError,
          error: connectionError
        },
        coursesTable: {
          exists: !tableError,
          error: tableError,
          sampleData: tableInfo
        },
        enrollmentsTable: {
          exists: !enrollmentError,
          error: enrollmentError,
          sampleData: enrollmentTableInfo
        },
        auth: {
          user: user ? { id: user.id, email: user.email } : null,
          error: userError
        }
      },
      environment: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      }
    });

  } catch (error) {
    console.error('❌ Debug test failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Debug test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}