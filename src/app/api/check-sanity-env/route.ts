import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check environment variables
    const sanityProjectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
    const sanityDataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
    const sanityApiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION;
    const sanityToken = process.env.SANITY_API_TOKEN;
    const sanityReadToken = process.env.NEXT_PUBLIC_SANITY_READ_TOKEN;

    return NextResponse.json({ 
      success: true,
      projectId: sanityProjectId ? '✅ Set' : '❌ Missing',
      dataset: sanityDataset ? '✅ Set' : '❌ Missing',
      apiVersion: sanityApiVersion ? '✅ Set' : '❌ Missing',
      writeToken: sanityToken ? '✅ Set' : '❌ Missing',
      readToken: sanityReadToken ? '✅ Set' : '❌ Missing',
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}