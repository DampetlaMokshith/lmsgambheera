import { NextRequest, NextResponse } from 'next/server';
import { writeClient } from '@/sanity/lib/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { facultyId, updates } = body;

    if (!facultyId) {
      return NextResponse.json(
        { error: 'Faculty ID is required' },
        { status: 400 }
      );
    }

    if (!updates || typeof updates !== 'object') {
      return NextResponse.json(
        { error: 'Updates object is required' },
        { status: 400 }
      );
    }

    // Update faculty profile in Sanity
    const updatedFaculty = await writeClient
      .patch(facultyId)
      .set(updates)
      .commit();

    return NextResponse.json({
      success: true,
      data: updatedFaculty,
      message: 'Faculty profile updated successfully'
    });

  } catch (error) {
return NextResponse.json(
      { 
        error: 'Failed to update faculty profile',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
