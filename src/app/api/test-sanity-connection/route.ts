import { NextResponse } from 'next/server';
import { client as sanityClient } from '@/sanity/lib/client';

export async function GET() {
  try {
    console.log('🔍 Testing Sanity connection and fetching courses...');
    
    // Test Sanity connection
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

    // Also test a simple query to make sure Sanity is working
    const allDocuments = await sanityClient.fetch(`
      *[_type == "course"] | order(_createdAt desc) [0...5] {
        _id,
        _type,
        title,
        _createdAt
      }
    `);

    return NextResponse.json({
      success: true,
      sanityConnection: 'OK',
      coursesFound: courses.length,
      courses: courses,
      recentDocuments: allDocuments,
      message: courses.length === 0 ? 'No courses found in Sanity. Please create courses in Sanity Studio first.' : `Found ${courses.length} courses ready to sync`
    });

  } catch (error) {
    console.error('Sanity test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to connect to Sanity or fetch courses'
    }, { status: 500 });
  }
}