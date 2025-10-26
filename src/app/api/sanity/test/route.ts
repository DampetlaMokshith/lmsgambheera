import { NextResponse } from 'next/server';
import { serverWriteClient, validateWritePermissions } from '@/sanity/lib/server-client';

export async function GET() {
  try {
    console.log('🔍 Checking Sanity write permissions...');
    
    // Test basic read permissions
    const canRead = await serverWriteClient.fetch(`*[_type == "course"][0...1] { _id }`);
    console.log('✅ Read permissions: OK', canRead?.length || 0, 'courses found');

    // Test write permissions validation
    const hasWritePermissions = await validateWritePermissions();
    
    // Try to fetch a specific course to test query capabilities
    const testCourse = await serverWriteClient.fetch(
      `*[_type == "course"][0] { _id, title, faculty-> { email } }`
    );

    return NextResponse.json({
      success: true,
      permissions: {
        read: true,
        write: hasWritePermissions,
      },
      testResults: {
        coursesFound: canRead?.length || 0,
        sampleCourse: testCourse || null,
      },
      message: hasWritePermissions 
        ? 'Sanity permissions are properly configured' 
        : 'Write permissions may be insufficient'
    });

  } catch (error) {
    console.error('❌ Sanity permissions check failed:', error);
    
    let errorMessage = 'Unknown error occurred';
    let errorType = 'UNKNOWN';
    
    if (error instanceof Error) {
      if (error.message.includes('Insufficient permissions')) {
        errorMessage = 'The API token does not have sufficient permissions';
        errorType = 'INSUFFICIENT_PERMISSIONS';
      } else if (error.message.includes('Invalid token')) {
        errorMessage = 'The API token is invalid or expired';
        errorType = 'INVALID_TOKEN';
      } else if (error.message.includes('Not found')) {
        errorMessage = 'Project or dataset not found';
        errorType = 'NOT_FOUND';
      } else {
        errorMessage = error.message;
        errorType = 'SANITY_ERROR';
      }
    }
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      errorType,
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}