import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Make a POST request to the sync-courses endpoint
    const response = await fetch('http://localhost:3002/api/sync-courses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    
    return NextResponse.json({
      success: true,
      message: 'Triggered course sync',
      syncResult: result
    });

  } catch (error) {
    console.error('Error triggering sync:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to trigger course sync'
    }, { status: 500 });
  }
}