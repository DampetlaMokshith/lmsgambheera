import { NextResponse } from 'next/server';
import { getPublishedCourses } from '@/sanity/lib/queries';

// Simple endpoint to test Sanity connection and data structure
export async function GET() {
  try {
    console.log('🔍 Testing Sanity connection...');
    
    const courses = await getPublishedCourses();
    
    if (!courses) {
      return NextResponse.json({
        success: false,
        message: 'No courses returned from Sanity'
      });
    }

    console.log(`📚 Found ${courses.length} published courses in Sanity`);

    // Show structure of first course for debugging
    const firstCourse = courses[0];
    
    return NextResponse.json({
      success: true,
      message: `Successfully fetched ${courses.length} courses from Sanity`,
      coursesCount: courses.length,
      sampleCourse: firstCourse ? {
        _id: firstCourse._id,
        title: firstCourse.title,
        slug: firstCourse.slug,
        faculty: firstCourse.faculty,
        hasAllRequiredFields: {
          _id: !!firstCourse._id,
          title: !!firstCourse.title,
          slug: !!firstCourse.slug?.current,
          faculty: !!firstCourse.faculty?.name && !!firstCourse.faculty?.email,
          description: !!firstCourse.description
        }
      } : null,
      allCourses: courses.map((course: { _id: string; title: string; slug?: { current: string }; faculty?: { name: string; email: string } }) => ({
        id: course._id,
        title: course.title,
        slug: course.slug?.current,
        facultyName: course.faculty?.name,
        facultyEmail: course.faculty?.email
      }))
    });

  } catch (error) {
    console.error('❌ Sanity test failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Sanity connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}