import { NextResponse } from 'next/server';
import { getPublishedCourses } from '@/sanity/lib/queries';
import { syncCourseToSupabase } from '@/lib/course-management';

// Manual sync endpoint to sync all published courses from Sanity to Supabase
export async function POST() {
  try {
    console.log('Starting course sync from Sanity to Supabase...');
    
    // Get all published courses from Sanity
    const courses = await getPublishedCourses();
    
    if (!courses || courses.length === 0) {
      return NextResponse.json(
        { message: 'No published courses found in Sanity' },
        { status: 200 }
      );
    }

    console.log(`Found ${courses.length} published courses in Sanity`);

    const syncResults = [];

    // Sync each course to Supabase
    for (const course of courses) {
      try {
        await syncCourseToSupabase({
          _id: course._id,
          title: course.title,
          slug: course.slug,
          description: course.description,
          thumbnail: course.thumbnail,
          faculty: course.faculty,
          rating: course.rating || 4.5,
          totalEnrollments: course.totalEnrollments || 0,
          estimatedDuration: course.estimatedDuration || 0,
          level: course.level,
          price: course.price || 0,
          tags: course.tags || [],
          degree: course.degree || '',
          department: course.department || '',
          language: course.language || 'English',
          isPublished: course.isPublished || true,
          isFeatured: course.isFeatured || false,
          publishedAt: course.publishedAt
        });
        
        syncResults.push({ 
          courseId: course._id, 
          title: course.title, 
          status: 'success' 
        });
        
        console.log(`✅ Synced: ${course.title}`);
      } catch (error) {
        syncResults.push({ 
          courseId: course._id, 
          title: course.title, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        
        console.log(`❌ Failed to sync: ${course.title}`, error);
      }
    }

    const successCount = syncResults.filter(r => r.status === 'success').length;
    const errorCount = syncResults.filter(r => r.status === 'error').length;

    return NextResponse.json({
      message: `Sync completed. ${successCount} successful, ${errorCount} failed.`,
      results: syncResults,
      summary: {
        total: courses.length,
        successful: successCount,
        failed: errorCount
      }
    });

  } catch (error) {
    console.error('Error during course sync:', error);
    return NextResponse.json(
      { 
        error: 'Failed to sync courses', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check sync status
export async function GET() {
  try {
    const courses = await getPublishedCourses();
    
    return NextResponse.json({
      message: 'Sync endpoint ready',
      publishedCoursesInSanity: courses?.length || 0,
      instruction: 'Use POST to sync all courses from Sanity to Supabase'
    });
  } catch (error) {
    console.error('Error checking courses:', error);
    return NextResponse.json(
      { error: 'Failed to check courses' },
      { status: 500 }
    );
  }
}