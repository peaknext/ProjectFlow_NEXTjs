/**
 * POST /api/auth/login
 * User login endpoint
 *
 * Security:
 * - VULN-004 Fix: Rate limiting (5 attempts per 15 minutes)
 * - VULN-001 Fix: bcrypt password verification
 * - VULN-003 Fix: httpOnly cookies instead of localStorage
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { createSession, verifyPassword } from '@/lib/auth';
import { getRolePermissions } from '@/lib/permissions';
import {
  successResponse,
  errorResponse,
  handleApiError,
} from '@/lib/api-response';
import { rateLimiters, addRateLimitHeaders } from '@/lib/rate-limiter';
import { setSessionCookie } from '@/lib/cookie-utils';

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(req: NextRequest) {
  try {
    // Rate limiting check
    // Security: VULN-004 Fix - Prevent brute force attacks
    const rateLimit = rateLimiters.login(req, req.headers.get('x-forwarded-for') || undefined);

    if (!rateLimit.success) {
      const response = NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: rateLimit.message,
          },
        },
        { status: 429 }
      );
      addRateLimitHeaders(response.headers, rateLimit);
      return response;
    }

    // Parse and validate request body
    const body = await req.json();
    const { email, password } = loginSchema.parse(body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { department: true },
    });

    if (!user) {
      return errorResponse(
        'INVALID_CREDENTIALS',
        'Invalid email or password',
        401
      );
    }

    // Verify password (bcrypt)
    // Security: VULN-001 Fix - using bcrypt instead of SHA256
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return errorResponse(
        'INVALID_CREDENTIALS',
        'Invalid email or password',
        401
      );
    }

    // Check user status
    if (user.userStatus !== 'ACTIVE') {
      return errorResponse(
        'ACCOUNT_SUSPENDED',
        'Your account has been suspended. Please contact administrator.',
        403
      );
    }

    // Create session
    const { sessionToken, expiresAt } = await createSession(user.id);

    // Get user permissions
    const permissions = getRolePermissions(user.role);

    // Create response with user data (NO sessionToken in body)
    // Security: VULN-003 Fix - sessionToken is now in httpOnly cookie
    const response = successResponse(
      {
        expiresAt: expiresAt.toISOString(),
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          profileImageUrl: user.profileImageUrl,
          departmentId: user.departmentId,
          department: user.department
            ? {
                id: user.department.id,
                name: user.department.name,
              }
            : null,
          permissions,
        },
      },
      200
    );

    // Set httpOnly cookie with session token
    // Security: VULN-003 Fix - Cannot be accessed via JavaScript (XSS protection)
    setSessionCookie(response, sessionToken, expiresAt);

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
