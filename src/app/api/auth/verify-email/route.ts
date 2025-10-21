/**
 * POST /api/auth/verify-email
 * Verify user email with token
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import {
  successResponse,
  errorResponse,
  handleApiError,
} from '@/lib/api-response';

const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

export async function POST(req: NextRequest) {
  try {
    // Parse and validate request body
    const body = await req.json();
    const { token } = verifyEmailSchema.parse(body);

    // Find user with verification token
    const user = await prisma.user.findUnique({
      where: { verificationToken: token },
      select: {
        id: true,
        email: true,
        fullName: true,
        isVerified: true,
      },
    });

    if (!user) {
      return errorResponse(
        'INVALID_TOKEN',
        'Invalid or expired verification token',
        400
      );
    }

    // Check if already verified
    if (user.isVerified) {
      return successResponse({
        message: 'Email already verified',
        alreadyVerified: true,
      });
    }

    // Update user to verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null, // Clear the token
      },
    });

    return successResponse({
      message: 'Email verified successfully',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        isVerified: true,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
