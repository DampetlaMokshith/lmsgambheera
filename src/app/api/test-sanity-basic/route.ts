import { NextResponse } from 'next/server';
import { createClient } from 'next-sanity';

export async function GET() {
  try {
    // Test with minimal configuration first
    const testClient = createClient({
      projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
      apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2023-05-03',
      useCdn: false,
      // No token for basic connectivity test
    });

    console.log('🔍 Testing basic Sanity connectivity...');
    
    // Try a very simple query first
    const basicTest = await testClient.fetch('*[_type == "course"][0]{_id}');
    console.log('✅ Basic connectivity test passed');

    // Now test with authentication
    const authClient = createClient({
      projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
      apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2023-05-03',
      useCdn: false,
      token: process.env.NEXT_PUBLIC_SANITY_READ_TOKEN,
    });

    const authTest = await authClient.fetch('*[_type == "course"][0]{_id, title}');
    console.log('✅ Authenticated query test passed');

    return NextResponse.json({
      success: true,
      message: 'Sanity connection successful',
      tests: {
        basicConnectivity: !!basicTest,
        authenticatedQuery: !!authTest,
        projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
        dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
        hasReadToken: !!process.env.NEXT_PUBLIC_SANITY_READ_TOKEN
      }
    });

  } catch (error) {
    console.error('❌ Sanity connection test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      config: {
        projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'NOT_SET',
        dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'NOT_SET',
        hasReadToken: !!process.env.NEXT_PUBLIC_SANITY_READ_TOKEN,
        hasWriteToken: !!process.env.SANITY_API_TOKEN
      }
    }, { status: 500 });
  }
}