import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Simple check of environment variables
    const config = {
      projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ? '✅ Set' : '❌ Missing',
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ? '✅ Set' : '❌ Missing',
      writeToken: process.env.SANITY_API_TOKEN ? '✅ Set' : '❌ Missing',
      tokenPreview: process.env.SANITY_API_TOKEN ? process.env.SANITY_API_TOKEN.substring(0, 10) + '...' : 'Not set'
    };

    console.log('🔧 Environment Check:', config);

    return NextResponse.json({
      success: true,
      message: 'Environment variables check completed',
      config
    });

  } catch (error) {
    console.error('❌ Environment check failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}