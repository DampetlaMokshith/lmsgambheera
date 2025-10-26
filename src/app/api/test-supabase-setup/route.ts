import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Test endpoint to verify Supabase setup and create sample course if tables exist
export async function POST() {
  try {
    console.log('🧪 Testing Supabase setup...');

    // Test 1: Check if courses table exists by trying to insert a test course
    const testCourse = {
      sanity_id: 'test-course-' + Date.now(),
      title: 'Test Course - Safe to Delete',
      slug: 'test-course-' + Date.now(),
      description: 'This is a test course created to verify Supabase setup',
      faculty_name: 'Test Instructor',
      faculty_email: 'test@example.com',
      rating: 4.5,
      total_enrollments: 0,
      estimated_duration: 2,
      level: 'beginner',
      price: 0,
      tags: ['test'],
      degree: 'btech',
      department: 'cse',
      language: 'English',
      is_published: true,
      is_featured: false
    };

    console.log('📝 Attempting to insert test course...');
    const { data: insertData, error: insertError } = await supabase
      .from('courses')
      .insert(testCourse)
      .select();

    if (insertError) {
      console.error('❌ Insert failed:', insertError);
      return NextResponse.json({
        success: false,
        step: 'insert_test_course',
        error: insertError,
        message: 'Failed to insert test course. Check if tables are created properly.',
        suggestion: 'Make sure you have run the SQL schema creation scripts in Supabase.'
      });
    }

    console.log('✅ Test course inserted:', insertData);
    const courseId = insertData[0]?.id;

    if (!courseId) {
      return NextResponse.json({
        success: false,
        message: 'Course inserted but no ID returned'
      });
    }

    // Test 2: Try to query the course back
    console.log('🔍 Querying test course back...');
    const { data: queryData, error: queryError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (queryError) {
      console.error('❌ Query failed:', queryError);
      return NextResponse.json({
        success: false,
        step: 'query_test_course',
        error: queryError
      });
    }

    console.log('✅ Test course queried successfully:', queryData);

    // Test 3: Clean up - delete the test course
    console.log('🧹 Cleaning up test course...');
    const { error: deleteError } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId);

    if (deleteError) {
      console.warn('⚠️ Failed to delete test course:', deleteError);
    } else {
      console.log('✅ Test course deleted successfully');
    }

    return NextResponse.json({
      success: true,
      message: 'Supabase setup is working correctly!',
      tests: {
        insert: 'passed',
        query: 'passed',
        delete: deleteError ? 'failed' : 'passed'
      },
      testCourse: queryData
    });

  } catch (error) {
    console.error('❌ Setup test failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Setup test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      suggestion: 'Check your .env.local file and ensure Supabase credentials are correct'
    });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Supabase setup test endpoint',
    instruction: 'Use POST to run the setup test'
  });
}