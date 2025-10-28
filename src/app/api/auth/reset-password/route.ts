/**
 * POST /api/auth/reset-password
 * Reset password with token
 *
 * Security:
 * - VULN-001 Fix: bcrypt password hashing
 * - VULN-008 Fix: Server-side password validation
 * - VULN-004 Fix: Rate limiting (3 attempts per hour)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import {
  successResponse,
  errorResponse,
  handleApiError,
} from '@/lib/api-response';
import { passwordSchema } from '@/lib/validations/password-schema';
import { rateLimiters, addRateLimitHeaders } from '@/lib/rate-limiter';

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: passwordSchema, // VULN-008 Fix: Server-side password validation
});

export async function POST(req: NextRequest) {
  try {
    // Rate limiting check
    // Security: VULN-004 Fix - Prevent brute force token guessing
    const rateLimit = rateLimiters.passwordReset(req);

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
    const { token, newPassword } = resetPasswordSchema.parse(body);

    // Find user with reset token
    const user = await prisma.user.findUnique({
      where: { resetToken: token },
      select: {
        id: true,
        email: true,
        resetTokenExpiry: true,
      },
    });

    if (!user) {
      return errorResponse(
        'INVALID_TOKEN',
        'Invalid or expired reset token',
        400
      );
    }

    // Check if token expired
    if (!user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      return errorResponse('TOKEN_EXPIRED', 'Reset token has expired', 400);
    }

    // Hash password with bcrypt
    // Security: VULN-001 Fix - using bcrypt instead of SHA256
    const passwordHash = await hashPassword(newPassword);

    // Update user password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        salt: '', // Legacy field - not used with bcrypt
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    // Invalidate all existing sessions for security
    await prisma.session.deleteMany({
      where: { userId: user.id },
    });

    return successResponse({
      message:
        'Password reset successfully. Please login with your new password.',
      sessionsInvalidated: true,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
