import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths that don't require authentication
  const publicPaths = [
    '/login',
    '/register',
    '/verify-email',
    '/request-reset',
    '/reset-password',
  ];

  // API routes are handled separately
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Check if user has session token (client-side check only, real auth is done in API)
  // Since we can't access localStorage in middleware, we'll check for the token in cookies
  // For now, we'll allow the pages to handle their own auth checks
  // The real protection happens in the API routes via withAuth middleware

  // If user is on a public path, allow access
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // For all other paths (dashboard, projects, etc.), let the page handle auth
  // The auth hook will redirect to /login if no token is found
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
};
