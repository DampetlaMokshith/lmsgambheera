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
return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }
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
// Add updatedAt timestamp
    const finalUpdateData = {
      ...updateData,
      updatedAt: new Date().toISOString()
    };
let result;
    try {
      // Try with the API write client first
      result = await apiWriteClient
        .patch(courseId)
        .set(finalUpdateData)
        .commit();
} catch (apiError) {
// Fallback to the regular writeClient
      try {
        result = await writeClient
          .patch(courseId)
          .set(finalUpdateData)
          .commit();
} catch (writeError) {
throw writeError;
      }
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Course updated successfully'
    });

  } catch (error) {
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

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    
    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
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
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // First, verify that the course belongs to this faculty member
    const existingCourse = await writeClient.fetch(
      `*[_type == "course" && _id == $courseId && faculty->email == $email][0]{
        _id,
        title,
        slug,
        sections[]->{ _id }
      }`,
      { courseId, email: user.email }
    );

    if (!existingCourse) {
      return NextResponse.json(
        { error: 'Course not found or you do not have permission to delete this course' },
        { status: 403 }
      );
    }

    // Step 1: Delete course from Supabase first (this will cascade delete enrollments due to FK constraint)
    const { error: supabaseError } = await supabase
      .from('courses')
      .delete()
      .eq('sanity_id', courseId);

    if (supabaseError) {
      console.error('Supabase deletion error:', supabaseError);
      // Continue with Sanity deletion even if Supabase fails
    }

    // Step 2: Delete all sections associated with the course from Sanity
    if (existingCourse.sections && existingCourse.sections.length > 0) {
      const sectionIds = existingCourse.sections.map((s: { _id: string }) => s._id).filter(Boolean);
      if (sectionIds.length > 0) {
        try {
          // Delete sections one by one
          for (const sectionId of sectionIds) {
            await apiWriteClient.delete(sectionId);
          }
        } catch (sectionError) {
          console.error('Error deleting sections:', sectionError);
          // Continue with course deletion
        }
      }
    }

    // Step 3: Delete the course from Sanity
    try {
      await apiWriteClient.delete(courseId);
    } catch (apiError) {
      // Fallback to writeClient
      try {
        await writeClient.delete(courseId);
      } catch (writeError) {
        throw writeError;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Course deleted successfully'
    });

  } catch (error) {
    console.error('Course deletion error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Insufficient permissions') || error.message.includes('permission "delete" required')) {
        return NextResponse.json(
          { 
            error: 'Insufficient permissions to delete course', 
            details: 'The API token does not have delete permissions.',
            code: 'INSUFFICIENT_PERMISSIONS'
          },
          { status: 403 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to delete course', 
        details: error instanceof Error ? error.message : 'Unknown error',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}
