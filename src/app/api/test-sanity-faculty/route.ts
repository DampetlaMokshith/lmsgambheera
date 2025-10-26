import { NextRequest, NextResponse } from 'next/server';
import { client, writeClient } from '@/sanity/lib/client';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing Sanity connection...');
    
    // Test basic connection
    const projects = await client.fetch('*[_type == "course"][0..2]{_id, title}');
    console.log('✅ Basic query successful:', projects);

    // Test faculty-specific query
    const email = 'suresh@faculty.ece';
    const facultyCourses = await client.fetch(
      '*[_type == "course" && faculty->email == $email] | order(createdAt desc)[0..2]{_id, title, faculty->{email}}',
      { email }
    );
    console.log('✅ Faculty query successful:', facultyCourses);

    // Test faculty data
    const facultyData = await client.fetch(
      '*[_type == "faculty" && email == $email][0]{_id, name, email}',
      { email }
    );
    console.log('✅ Faculty data query successful:', facultyData);

    return NextResponse.json({
      success: true,
      message: 'Sanity connection working',
      data: {
        totalCourses: projects?.length || 0,
        facultyCourses: facultyCourses?.length || 0,
        facultyFound: !!facultyData,
        sampleCourses: projects,
        sampleFacultyCourses: facultyCourses,
        facultyInfo: facultyData
      }
    });

  } catch (error) {
    console.error('❌ Sanity connection test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
}