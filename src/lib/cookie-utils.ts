/**
 * Cookie Utilities for Session Management
 *
 * Security: VULN-003 Fix - Migrate from localStorage to httpOnly cookies
 *
 * httpOnly cookies provide better security than localStorage because:
 * 1. Cannot be accessed via JavaScript (XSS protection)
 * 2. Automatically sent with requests (no manual token management)
 * 3. Can be configured with secure, sameSite flags
 */

import { NextResponse } from 'next/server';

const COOKIE_NAME = 'sessionToken';

/**
 * Cookie configuration
 */
export const COOKIE_CONFIG = {
  httpOnly: true, // Cannot be accessed via JavaScript (XSS protection)
  secure: process.env.NODE_ENV === 'production', // HTTPS only in production
  sameSite: 'lax' as const, // CSRF protection
  path: '/', // Available on all routes
  maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
};

/**
 * Set session cookie on response
 *
 * @param response - NextResponse object
 * @param sessionToken - Session token to store
 * @param expiresAt - Optional expiration date
 * @returns Modified response with cookie set
 */
export function setSessionCookie(
  response: NextResponse,
  sessionToken: string,
  expiresAt?: Date
): NextResponse {
  const cookieOptions = {
    ...COOKIE_CONFIG,
    ...(expiresAt && { expires: expiresAt }),
  };

  response.cookies.set(COOKIE_NAME, sessionToken, cookieOptions);

  return response;
}

/**
 * Clear session cookie on response
 *
 * @param response - NextResponse object
 * @returns Modified response with cookie cleared
 */
export function clearSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set(COOKIE_NAME, '', {
    ...COOKIE_CONFIG,
    maxAge: 0, // Expire immediately
    expires: new Date(0), // Set to past date
  });

  return response;
}

/**
 * Get session token from request cookies
 *
 * @param cookies - Request cookies object
 * @returns Session token if found, null otherwise
 */
export function getSessionToken(cookies: any): string | null {
  const cookie = cookies.get(COOKIE_NAME);
  return cookie?.value || null;
}

/**
 * Create cookie string for Set-Cookie header
 *
 * Useful for manual cookie setting when NextResponse is not available
 *
 * @param sessionToken - Session token to store
 * @param expiresAt - Optional expiration date
 * @returns Cookie string for Set-Cookie header
 */
export function createSessionCookieString(
  sessionToken: string,
  expiresAt?: Date
): string {
  const parts = [`${COOKIE_NAME}=${sessionToken}`];

  if (expiresAt) {
    parts.push(`Expires=${expiresAt.toUTCString()}`);
  } else {
    parts.push(`Max-Age=${COOKIE_CONFIG.maxAge}`);
  }

  parts.push(`Path=${COOKIE_CONFIG.path}`);

  if (COOKIE_CONFIG.httpOnly) {
    parts.push('HttpOnly');
  }

  if (COOKIE_CONFIG.secure) {
    parts.push('Secure');
  }

  if (COOKIE_CONFIG.sameSite) {
    parts.push(`SameSite=${COOKIE_CONFIG.sameSite}`);
  }

  return parts.join('; ');
}

/**
 * Get cookie name constant
 *
 * @returns Cookie name
 */
export function getSessionCookieName(): string {
  return COOKIE_NAME;
}
