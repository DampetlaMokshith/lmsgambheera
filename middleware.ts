import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Define protected routes to optimize middleware processing
const PROTECTED_ROUTES = {
  STUDENT: ['/dashboard'],
  FACULTY: ['/faculty'],
  AUTH: ['/auth', '/faculty/auth']
} as const;

// Helper function to check if path matches any protected routes
function isProtectedRoute(pathname: string): 'student' | 'faculty' | 'auth' | null {
  if (PROTECTED_ROUTES.STUDENT.some(route => pathname.startsWith(route))) {
    return 'student';
  }
  if (PROTECTED_ROUTES.FACULTY.some(route => pathname.startsWith(route)) && !pathname.startsWith('/faculty/auth')) {
    return 'faculty';
  }
  if (PROTECTED_ROUTES.AUTH.some(route => pathname === route)) {
    return 'auth';
  }
  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files, API routes, and Sanity Studio
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/studio') ||
    pathname.includes('.') // Skip files with extensions
  ) {
    return NextResponse.next();
  }

  // Check if this route needs protection
  const routeType = isProtectedRoute(pathname);
  if (!routeType) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Only create Supabase client if we need authentication
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: Record<string, unknown>) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  try {
    // Get session with timeout to prevent hanging
    const { data: { session } } = await Promise.race([
      supabase.auth.getSession(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Session timeout')), 3000)
      )
    ]) as { data: { session: unknown } };

    // Handle route protection based on type
    switch (routeType) {
      case 'student':
        if (!session) {
          return NextResponse.redirect(new URL('/auth', request.url));
        }
        break;
      
      case 'faculty':
        if (!session) {
          return NextResponse.redirect(new URL('/faculty/auth', request.url));
        }
        break;
      
      case 'auth':
        if (session) {
          // Redirect based on which auth page they're on
          if (pathname === '/auth') {
            return NextResponse.redirect(new URL('/dashboard', request.url));
          } else if (pathname === '/faculty/auth') {
            return NextResponse.redirect(new URL('/faculty/coursesavailable', request.url));
          }
        }
        break;
    }

    return response;
  } catch (error) {
    console.warn('Middleware session check failed:', error);
    // In case of error, allow the request to proceed and let client-side handle auth
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)  
     * - favicon.ico (favicon file)
     * - studio (Sanity Studio)
     * - api (API routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|studio|api).*)',
  ],
}