import { NextResponse } from 'next/server';
import { client as sanityClient } from '@/sanity/lib/client';
import { syncCourseToSupabase } from '@/lib/course-management';

export async function POST() {
  try {
    console.log('Starting course sync process...');
    
    // Fetch all courses from Sanity
    const courses = await sanityClient.fetch(`
      *[_type == "course"]{
        _id,
        title,
        description,
        slug,
        thumbnail,
        price,
        category,
        difficulty,
        duration,
        faculty->{
          _id,
          name,
          email
        },
        modules[]->{
          _id,
          title,
          description
        },
        prerequisites,
        objectives,
        isPublished,
        _createdAt,
        _updatedAt
      }
    `);

    console.log(`Found ${courses.length} courses in Sanity`);

    const syncResults = [];
    let successCount = 0;
    let errorCount = 0;

    // Sync each course to Supabase
    for (const course of courses) {
      try {
        console.log(`Syncing course: ${course.title}`);
        const result = await syncCourseToSupabase(course);
        
        successCount++;
        syncResults.push({
          sanityId: course._id,
          title: course.title,
          status: 'success',
          supabaseId: result?.[0]?.id || 'unknown'
        });
      } catch (error) {
        errorCount++;
        console.error(`Error syncing course ${course.title}:`, error);
        syncResults.push({
          sanityId: course._id,
          title: course.title,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Course sync completed. Success: ${successCount}, Errors: ${errorCount}`,
      totalCourses: courses.length,
      successCount,
      errorCount,
      results: syncResults
    });

  } catch (error) {
    console.error('Course sync error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to sync courses'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Course sync endpoint. Use POST to sync courses from Sanity to Supabase.',
    usage: {
      method: 'POST',
      description: 'Syncs all courses from Sanity to Supabase database'
    }
  });
}