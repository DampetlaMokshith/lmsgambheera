import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { client as sanityClient } from '@/sanity/lib/client';

export async function GET() {
  const results = {
    timestamp: new Date().toISOString(),
    tests: {} as Record<string, unknown>
  };

  try {
    // Test 1: Supabase Connection
    console.log('🔍 Testing Supabase connection...');
    const { data: supabaseTest, error: supabaseError } = await supabase
      .from('courses')
      .select('id, title, sanity_id')
      .limit(1);

    results.tests.supabase = {
      success: !supabaseError,
      error: supabaseError ? {
        code: supabaseError.code,
        message: supabaseError.message,
        details: supabaseError.details
      } : null,
      data: supabaseTest
    };

    // Test 2: Sanity Connection
    console.log('🔍 Testing Sanity connection...');
    const sanityTest = await sanityClient.fetch(`
      *[_type == "course"] | order(_createdAt desc) [0...3] {
        _id,
        title,
        slug,
        _createdAt
      }
    `);

    results.tests.sanity = {
      success: true,
      coursesFound: sanityTest.length,
      courses: sanityTest
    };

    // Test 3: Check if any courses exist in Supabase
    const { data: existingCourses, error: existingError } = await supabase
      .from('courses')
      .select('id, title, sanity_id, created_at')
      .limit(10);

    results.tests.existingSupabaseCourses = {
      success: !existingError,
      count: existingCourses?.length || 0,
      courses: existingCourses || []
    };

    // Test 4: Environment Check
    results.tests.environment = {
      nodeEnv: process.env.NODE_ENV,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasSanityProjectId: !!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
      hasSanityDataset: !!process.env.NEXT_PUBLIC_SANITY_DATASET
    };

    return NextResponse.json({
      success: true,
      message: 'Connection tests completed',
      results
    });

  } catch (error) {
    console.error('Connection test error:', error);
    
    // Add the error to results
    results.tests.error = {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    };

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      results
    }, { status: 500 });
  }
}