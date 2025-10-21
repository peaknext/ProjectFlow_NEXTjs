/**
 * POST /api/auth/reset-password
 * Reset password with token
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { hashPassword, generateSecureToken } from '@/lib/auth';
import {
  successResponse,
  errorResponse,
  handleApiError,
} from '@/lib/api-response';

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(req: NextRequest) {
  try {
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

    // Generate new salt and hash password
    const salt = generateSecureToken();
    const passwordHash = hashPassword(newPassword, salt);

    // Update user password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        salt,
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
