/**
 * POST /api/auth/send-verification
 * Resend email verification token
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { generateSecureToken } from '@/lib/auth';
import {
  successResponse,
  errorResponse,
  handleApiError,
} from '@/lib/api-response';

const sendVerificationSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export async function POST(req: NextRequest) {
  try {
    // Parse and validate request body
    const body = await req.json();
    const { email } = sendVerificationSchema.parse(body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        fullName: true,
        isVerified: true,
      },
    });

    if (!user) {
      // Don't reveal if user exists or not (security)
      return successResponse({
        message: 'If an account exists, a verification email has been sent.',
      });
    }

    // Check if already verified
    if (user.isVerified) {
      return errorResponse(
        'ALREADY_VERIFIED',
        'Email is already verified',
        400
      );
    }

    // Generate new verification token
    const verificationToken = generateSecureToken();

    // Update user with new token
    await prisma.user.update({
      where: { id: user.id },
      data: { verificationToken },
    });

    // TODO: Send verification email
    // await sendVerificationEmail(user.email, verificationToken);

    return successResponse({
      message: 'Verification email sent. Please check your inbox.',
      email: user.email,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
