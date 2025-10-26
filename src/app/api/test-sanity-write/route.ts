import { NextRequest, NextResponse } from 'next/server';
import { writeClient } from '@/sanity/lib/client';

export async function GET() {
  try {
    // Test if we can write to Sanity
    const testDoc = {
      _type: 'test',
      title: 'Test Document',
      timestamp: new Date().toISOString()
    };

    // Try to create a test document
    const result = await writeClient.create(testDoc);
    
    // Clean up - delete the test document
    await writeClient.delete(result._id);

    return NextResponse.json({ 
      success: true, 
      message: 'Sanity write permissions working correctly',
      testId: result._id
    });
  } catch (error) {
    console.error('Sanity write test failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { facultyId, updates } = await request.json();
    
    console.log('📥 API received faculty update request:', { facultyId, updates });
    
    if (!facultyId || !updates) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing facultyId or updates' 
      }, { status: 400 });
    }

    // Validate facultyId format
    if (!facultyId || typeof facultyId !== 'string') {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid facultyId format' 
      }, { status: 400 });
    }

    // Clean and validate updates
    const cleanUpdates = {
      ...(updates.name && { name: String(updates.name).trim() }),
      ...(updates.profession && { profession: String(updates.profession).trim() }),
      ...(updates.about && { about: String(updates.about).trim() }),
      ...(updates.college && { college: String(updates.college).trim() }),
      ...(updates.department && { department: String(updates.department).trim() }),
      ...(updates.gender && { gender: String(updates.gender).trim() }),
      ...(Array.isArray(updates.skilledAt) && { skilledAt: updates.skilledAt }),
    };

    console.log('🧹 Cleaned updates:', cleanUpdates);

    // Test if we can read the document first
    const existingDoc = await writeClient.getDocument(facultyId);
    if (!existingDoc) {
      return NextResponse.json({ 
        success: false, 
        error: 'Faculty document not found' 
      }, { status: 404 });
    }

    console.log('📖 Found existing document:', existingDoc._id);

    // Perform the update
    const result = await writeClient
      .patch(facultyId)
      .set(cleanUpdates)
      .commit();

    console.log('✅ Faculty update successful:', result);

    return NextResponse.json({ 
      success: true, 
      data: result,
      message: 'Faculty profile updated successfully'
    });
  } catch (error) {
    console.error('❌ Faculty update API error:', {
      error,
      errorType: typeof error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : 'No stack',
      errorString: String(error)
    });
    
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: String(error)
    }, { status: 500 });
  }
}