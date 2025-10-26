import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    console.log('🔍 Testing Supabase connection and permissions...');
    
    // Test basic connection
    const { error: connectionError } = await supabase
      .from('courses')
      .select('id')
      .limit(1);
    
    if (connectionError) {
      return NextResponse.json({
        success: false,
        error: 'Connection failed',
        details: {
          code: connectionError.code,
          message: connectionError.message,
          details: connectionError.details,
          hint: connectionError.hint
        }
      }, { status: 500 });
    }

    // Test courses table access
    const { data: coursesData, error: coursesError } = await supabase
      .from('courses')
      .select('id, title, sanity_id')
      .limit(5);

    // Test course_enrollments table access
    const { data: enrollmentsData, error: enrollmentsError } = await supabase
      .from('course_enrollments')
      .select('id, user_id, course_id')
      .limit(5);

    return NextResponse.json({
      success: true,
      connection: 'OK',
      tests: {
        courses: {
          success: !coursesError,
          error: coursesError ? {
            code: coursesError.code,
            message: coursesError.message,
            details: coursesError.details
          } : null,
          count: coursesData?.length || 0,
          sample: coursesData
        },
        enrollments: {
          success: !enrollmentsError,
          error: enrollmentsError ? {
            code: enrollmentsError.code,
            message: enrollmentsError.message,
            details: enrollmentsError.details
          } : null,
          count: enrollmentsData?.length || 0,
          sample: enrollmentsData
        }
      }
    });

  } catch (error) {
    console.error('Debug test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
}