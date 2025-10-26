/**
 * POST /api/users/me/change-password
 * Change current user's password
 */

import { withAuth, type AuthenticatedRequest } from '@/lib/api-middleware';
import { successResponse, errorResponse } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { hashPassword, verifyPassword, generateSecureToken } from '@/lib/auth';

async function handler(req: AuthenticatedRequest) {
  const userId = req.session.userId;
  const body = await req.json();

  const { currentPassword, newPassword } = body;

  // Validate input
  if (!currentPassword || !newPassword) {
    return errorResponse('BAD_REQUEST', 'Current password and new password are required', 400);
  }

  // Validate new password strength
  if (newPassword.length < 8) {
    return errorResponse('BAD_REQUEST', 'New password must be at least 8 characters long', 400);
  }

  // Get current user with password hash
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      passwordHash: true,
      salt: true,
    },
  });

  if (!user) {
    return errorResponse('NOT_FOUND', 'User not found', 404);
  }

  // Verify current password
  const isValidPassword = verifyPassword(currentPassword, user.salt, user.passwordHash);
  if (!isValidPassword) {
    return errorResponse('UNAUTHORIZED', 'Current password is incorrect', 401);
  }

  // Generate new salt and hash
  const newSalt = generateSecureToken();
  const newPasswordHash = hashPassword(newPassword, newSalt);

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: newPasswordHash,
      salt: newSalt,
    },
  });

  // Invalidate all existing sessions except current one
  await prisma.session.deleteMany({
    where: {
      userId: userId,
      sessionToken: {
        not: req.session.sessionToken,
      },
    },
  });

  return successResponse({
    message: 'Password changed successfully',
  });
}

export const POST = withAuth(handler);
