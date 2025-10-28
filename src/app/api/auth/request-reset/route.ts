/**
 * POST /api/auth/request-reset
 * Request password reset token
 *
 * Security:
 * - VULN-004 Fix: Rate limiting (3 attempts per hour)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { generateSecureToken } from '@/lib/auth';
import {
  successResponse,
  errorResponse,
  handleApiError,
} from '@/lib/api-response';
import { sendPasswordResetEmail } from '@/lib/email';
import { rateLimiters, addRateLimitHeaders } from '@/lib/rate-limiter';

const requestResetSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export async function POST(req: NextRequest) {
  try {
    // Rate limiting check
    // Security: VULN-004 Fix - Prevent password reset spam/abuse
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
    const { email } = requestResetSchema.parse(body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        fullName: true,
      },
    });

    // Don't reveal if user exists or not (security)
    if (!user) {
      return successResponse({
        message:
          'If an account exists, a password reset link has been sent to your email.',
      });
    }

    // Generate reset token
    const resetToken = generateSecureToken();
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Update user with reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // Send password reset email
    try {
      await sendPasswordResetEmail(user.email, user.fullName, resetToken);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      // Continue anyway - token is saved in database
    }

    return successResponse({
      message: 'Password reset link sent. Please check your email.',
      expiresIn: '1 hour',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
