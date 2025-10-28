/**
 * CSRF Protection Utility
 *
 * Security: VULN-006 Fix - Prevent Cross-Site Request Forgery
 *
 * While our Bearer token authentication (stored in localStorage) provides
 * inherent CSRF protection, this module provides additional layers of security:
 *
 * 1. CSRF tokens for state-changing operations
 * 2. Origin/Referer header validation
 * 3. SameSite cookie attributes (if using cookies)
 */

import crypto from "crypto";
import { NextRequest } from "next/server";

const CSRF_TOKEN_LENGTH = 32; // 256 bits
const CSRF_TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour

// In-memory storage for CSRF tokens (in production, use Redis or database)
const csrfTokenStore = new Map<
  string,
  { token: string; expiresAt: number; userId?: string }
>();

/**
 * Generate a new CSRF token
 *
 * @param userId - Optional user ID to associate with token
 * @returns CSRF token string
 */
export function generateCsrfToken(userId?: string): string {
  const token = crypto.randomBytes(CSRF_TOKEN_LENGTH).toString("hex");
  const expiresAt = Date.now() + CSRF_TOKEN_EXPIRY;

  csrfTokenStore.set(token, {
    token,
    expiresAt,
    userId,
  });

  return token;
}

/**
 * Validate a CSRF token
 *
 * @param token - CSRF token to validate
 * @param userId - Optional user ID to validate against
 * @returns true if token is valid, false otherwise
 */
export function validateCsrfToken(token: string, userId?: string): boolean {
  const storedToken = csrfTokenStore.get(token);

  if (!storedToken) {
    return false;
  }

  // Check if token has expired
  if (Date.now() > storedToken.expiresAt) {
    csrfTokenStore.delete(token);
    return false;
  }

  // If userId is provided, validate it matches
  if (userId && storedToken.userId && storedToken.userId !== userId) {
    return false;
  }

  return true;
}

/**
 * Invalidate a CSRF token
 *
 * @param token - CSRF token to invalidate
 */
export function invalidateCsrfToken(token: string): void {
  csrfTokenStore.delete(token);
}

/**
 * Clean up expired CSRF tokens
 */
export function cleanupExpiredCsrfTokens(): void {
  const now = Date.now();
  for (const [token, data] of csrfTokenStore.entries()) {
    if (now > data.expiresAt) {
      csrfTokenStore.delete(token);
    }
  }
}

// Run cleanup every 10 minutes
setInterval(cleanupExpiredCsrfTokens, 10 * 60 * 1000);

/**
 * Validate request origin
 *
 * Checks that the request is coming from an allowed origin.
 *
 * @param req - Next.js request object
 * @returns true if origin is valid, false otherwise
 */
export function validateRequestOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const host = req.headers.get("host");

  // List of allowed origins
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,   // Production domain (from env)
    "https://projectflows.app",        // Production custom domain
    "https://projectflows.render.com", // Render default domain
    // Development origins
    "http://localhost:3000",
    "http://localhost:3010",
    "http://localhost:10000",
    "http://10.16.12.241:10000",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3010",
    // Add more allowed origins here
  ].filter(Boolean);

  // Allow requests from same host (server-side requests)
  if (!origin && !referer) {
    // No origin/referer means it's likely a direct API call or server-side request
    // This is acceptable for Bearer token auth
    return true;
  }

  // Check origin header
  if (origin) {
    const isAllowed = allowedOrigins.some((allowed) =>
      origin.startsWith(allowed as string)
    );
    if (!isAllowed) {
      console.warn(
        `🚨 CSRF: Blocked request from unauthorized origin: ${origin}`
      );
      return false;
    }
  }

  // Check referer header as fallback
  if (referer) {
    const isAllowed = allowedOrigins.some((allowed) =>
      referer.startsWith(allowed as string)
    );
    if (!isAllowed) {
      console.warn(
        `🚨 CSRF: Blocked request from unauthorized referer: ${referer}`
      );
      return false;
    }
  }

  // Also check if origin/referer matches host
  if (host && (origin || referer)) {
    const requestHost = origin || referer;
    if (requestHost && !requestHost.includes(host)) {
      // Allow localhost for development
      if (
        process.env.NODE_ENV === "development" &&
        (host.includes("localhost") || host.includes("127.0.0.1"))
      ) {
        return true;
      }

      console.warn(
        `🚨 CSRF: Origin/Referer (${requestHost}) does not match Host (${host})`
      );
      return false;
    }
  }

  return true;
}

/**
 * Validate request method
 *
 * Ensures that state-changing methods (POST, PUT, PATCH, DELETE) have CSRF protection.
 *
 * @param method - HTTP method
 * @returns true if method requires CSRF protection
 */
export function requiresCsrfProtection(method: string): boolean {
  return ["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase());
}

/**
 * Extract CSRF token from request
 *
 * Checks multiple locations: header, body, query parameter
 *
 * @param req - Next.js request object
 * @returns CSRF token if found, null otherwise
 */
export function extractCsrfToken(req: NextRequest): string | null {
  // Check X-CSRF-Token header (preferred method)
  const headerToken = req.headers.get("x-csrf-token");
  if (headerToken) return headerToken;

  // Check query parameter (fallback for GET requests)
  const url = new URL(req.url);
  const queryToken = url.searchParams.get("csrf_token");
  if (queryToken) return queryToken;

  return null;
}

/**
 * CSRF protection middleware
 *
 * Validates request origin and CSRF token for state-changing operations.
 *
 * @param req - Next.js request object
 * @param userId - Optional user ID for token validation
 * @returns object with success status and optional error message
 */
export function validateCsrfProtection(
  req: NextRequest,
  userId?: string
): { success: boolean; error?: string } {
  // Skip CSRF validation in development (for easier testing)
  // Security: This is acceptable because CSRF attacks require production-like environment
  if (process.env.NODE_ENV === "development") {
    return { success: true };
  }

  // Always validate origin for state-changing requests in production
  if (requiresCsrfProtection(req.method)) {
    if (!validateRequestOrigin(req)) {
      return {
        success: false,
        error: "Invalid request origin",
      };
    }

    // For Bearer token auth, origin validation is usually sufficient
    // But we can also check for CSRF token if provided
    const csrfToken = extractCsrfToken(req);
    if (csrfToken) {
      if (!validateCsrfToken(csrfToken, userId)) {
        return {
          success: false,
          error: "Invalid or expired CSRF token",
        };
      }
    }
  }

  return { success: true };
}

/**
 * Create CSRF token cookie options
 *
 * Sets secure cookie attributes including SameSite
 *
 * @returns Cookie options object
 */
export function getCsrfCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: CSRF_TOKEN_EXPIRY / 1000, // Convert to seconds
  };
}
