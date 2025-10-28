/**
 * Rate Limiting Utility
 *
 * Security: VULN-004 Fix - Prevent brute force attacks and DoS
 *
 * Features:
 * - In-memory rate limiting (suitable for single-server deployments)
 * - Configurable limits per endpoint
 * - IP-based tracking
 * - Automatic cleanup of old entries
 */

import { NextRequest } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory storage for rate limits
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 10 * 60 * 1000);

/**
 * Rate limiter configuration
 */
export interface RateLimitConfig {
  /** Time window in milliseconds */
  windowMs: number;
  /** Maximum requests per window */
  max: number;
  /** Custom message when limit exceeded */
  message?: string;
}

/**
 * Rate limiter result
 */
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  message?: string;
}

/**
 * Get client IP address from request
 */
function getClientIp(req: NextRequest): string {
  // Try to get real IP from proxy headers
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to connection remote address
  return req.headers.get('x-client-ip') || 'unknown';
}

/**
 * Check rate limit for a request
 *
 * @param req - Next.js request
 * @param config - Rate limit configuration
 * @param identifier - Optional custom identifier (defaults to IP)
 * @returns Rate limit result
 */
export function checkRateLimit(
  req: NextRequest,
  config: RateLimitConfig,
  identifier?: string
): RateLimitResult {
  const clientId = identifier || getClientIp(req);
  const key = `${req.nextUrl.pathname}:${clientId}`;
  const now = Date.now();

  // Get or create rate limit entry
  let entry = rateLimitStore.get(key);

  if (!entry || entry.resetTime < now) {
    // Create new entry or reset expired one
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, entry);
  }

  // Increment request count
  entry.count++;

  // Check if limit exceeded
  const remaining = Math.max(0, config.max - entry.count);
  const success = entry.count <= config.max;

  return {
    success,
    limit: config.max,
    remaining,
    resetTime: entry.resetTime,
    message: success ? undefined : (config.message || 'Too many requests'),
  };
}

/**
 * Rate limiter middleware wrapper for API routes
 *
 * Usage:
 * ```typescript
 * const limiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 5 });
 *
 * export async function POST(req: NextRequest) {
 *   const limit = limiter(req);
 *   if (!limit.success) {
 *     return NextResponse.json({ error: limit.message }, {
 *       status: 429,
 *       headers: {
 *         'X-RateLimit-Limit': limit.limit.toString(),
 *         'X-RateLimit-Remaining': limit.remaining.toString(),
 *       }
 *     });
 *   }
 *   // ... rest of handler
 * }
 * ```
 */
export function createRateLimiter(config: RateLimitConfig) {
  return (req: NextRequest, identifier?: string): RateLimitResult => {
    return checkRateLimit(req, config, identifier);
  };
}

/**
 * Pre-configured rate limiters for common scenarios
 */
export const rateLimiters = {
  /** Login endpoint - 5 requests per 15 minutes */
  login: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: 'Too many login attempts. Please try again after 15 minutes.',
  }),

  /** Password reset request - 3 requests per hour */
  passwordReset: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: 'Too many password reset requests. Please try again after 1 hour.',
  }),

  /** Registration - 3 requests per hour per IP */
  register: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: 'Too many registration attempts. Please try again after 1 hour.',
  }),

  /** Email verification - 5 requests per hour */
  emailVerification: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    message: 'Too many verification requests. Please try again after 1 hour.',
  }),

  /** General API - 100 requests per minute */
  api: createRateLimiter({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100,
    message: 'Too many API requests. Please slow down.',
  }),

  /** Strict rate limit - 10 requests per minute */
  strict: createRateLimiter({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10,
    message: 'Too many requests. Please try again later.',
  }),
};

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(headers: Headers, result: RateLimitResult): void {
  headers.set('X-RateLimit-Limit', result.limit.toString());
  headers.set('X-RateLimit-Remaining', result.remaining.toString());
  headers.set('X-RateLimit-Reset', new Date(result.resetTime).toISOString());
}
