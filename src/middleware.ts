import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // ============================================================================
  // SECURITY HEADERS
  // Security: VULN-007 & VULN-012 Fix - Comprehensive security headers
  // ============================================================================

  // Prevent Clickjacking attacks
  response.headers.set('X-Frame-Options', 'DENY');

  // Prevent MIME-type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Control referrer information
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Enable XSS filter (legacy browsers)
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Control DNS prefetching
  response.headers.set('X-DNS-Prefetch-Control', 'off');

  // HSTS - Force HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // Permissions Policy (formerly Feature-Policy)
  // Restrict dangerous browser features
  const permissionsPolicy = [
    'accelerometer=()',
    'camera=()',
    'geolocation=()',
    'gyroscope=()',
    'magnetometer=()',
    'microphone=()',
    'payment=()',
    'usb=()',
  ];
  response.headers.set('Permissions-Policy', permissionsPolicy.join(', '));

  // Content Security Policy (CSP)
  // Note: Adjust based on your actual needs (e.g., CDNs, analytics)
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-eval needed for React dev
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", // Google Fonts CSS
    "img-src 'self' data: https:",
    "font-src 'self' data: https://fonts.gstatic.com", // Google Fonts files
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ];
  response.headers.set('Content-Security-Policy', cspDirectives.join('; '));

  // ============================================================================
  // CORS CONFIGURATION (VULN-005 Fix)
  // ============================================================================

  const origin = request.headers.get('origin');

  // Allowed origins (production)
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL, // Production domain
    'https://projectflows.render.com', // Render domain
  ].filter(Boolean); // Remove undefined values

  // Development: Allow localhost
  if (process.env.NODE_ENV === 'development') {
    if (origin?.includes('localhost') || origin?.includes('127.0.0.1')) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }
  } else {
    // Production: Check against whitelist
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }
  }

  // Handle OPTIONS preflight requests
  if (request.method === 'OPTIONS') {
    return response;
  }

  // ============================================================================
  // AUTHENTICATION CHECK
  // ============================================================================

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
    return response;
  }

  // If user is on a public path, allow access
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return response;
  }

  // For all other paths (dashboard, projects, etc.), let the page handle auth
  // The auth hook will redirect to /login if no token is found
  return response;
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
