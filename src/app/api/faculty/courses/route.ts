import { NextRequest, NextResponse } from 'next/server';
import { writeClient } from '@/sanity/lib/client';
import { supabase } from '@/lib/supabase';
import { createClient } from 'next-sanity';
import { apiVersion, dataset, projectId, token } from '@/sanity/env';

// Create a dedicated server-side client for this API
const apiWriteClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token,
  perspective: 'raw',
  ignoreBrowserTokenWarning: true,
});

export async function PATCH(request: NextRequest) {
  try {
    const { courseId, updateData } = await request.json();
    
    if (!courseId || !updateData) {
      return NextResponse.json(
        { error: 'Course ID and update data are required' },
        { status: 400 }
      );
    }

    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    // Extract the token
    const accessToken = authHeader.substring(7);
    
    // Verify the session with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      console.error('❌ Authentication error:', authError);
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    console.log('🔐 Authenticated user:', user.email);

    // First, verify that the course belongs to this faculty member using regular client
    const existingCourse = await writeClient.fetch(
      `*[_type == "course" && _id == $courseId && faculty->email == $email][0]`,
      { courseId, email: user.email }
    );

    if (!existingCourse) {
      return NextResponse.json(
        { error: 'Course not found or you do not have permission to edit this course' },
        { status: 403 }
      );
    }

    console.log('📚 Course found, proceeding with update:', existingCourse.title);

    // Add updatedAt timestamp
    const finalUpdateData = {
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    console.log('💾 Attempting to update course with write token...');
    console.log('📋 Update data:', finalUpdateData);
    
    let result;
    try {
      // Try with the API write client first
      result = await apiWriteClient
        .patch(courseId)
        .set(finalUpdateData)
        .commit();
      
      console.log('✅ Course update successful with API client:', result);
    } catch (apiError) {
      console.error('❌ API client failed, trying writeClient:', apiError);
      
      // Fallback to the regular writeClient
      try {
        result = await writeClient
          .patch(courseId)
          .set(finalUpdateData)
          .commit();
        
        console.log('✅ Course update successful with writeClient:', result);
      } catch (writeError) {
        console.error('❌ Both clients failed:', writeError);
        throw writeError;
      }
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Course updated successfully'
    });

  } catch (error) {
    console.error('❌ Error updating course:', error);
    
    // Enhanced error handling
    if (error instanceof Error) {
      if (error.message.includes('Insufficient permissions') || error.message.includes('permission "update" required')) {
        return NextResponse.json(
          { 
            error: 'Insufficient permissions to update course', 
            details: 'The API token does not have write permissions. Please check Sanity token configuration.',
            code: 'INSUFFICIENT_PERMISSIONS'
          },
          { status: 403 }
        );
      } else if (error.message.includes('Invalid token')) {
        return NextResponse.json(
          { 
            error: 'Invalid API token', 
            details: 'The Sanity API token is invalid or expired.',
            code: 'INVALID_TOKEN'
          },
          { status: 401 }
        );
      } else if (error.message.includes('Not found')) {
        return NextResponse.json(
          { 
            error: 'Course not found', 
            details: 'The course may have been deleted or the ID is incorrect.',
            code: 'NOT_FOUND'
          },
          { status: 404 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}