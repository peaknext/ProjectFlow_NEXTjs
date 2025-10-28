/**
 * POST /api/users/me/change-password
 * Change current user's password
 */

import { withAuth, type AuthenticatedRequest } from '@/lib/api-middleware';
import { successResponse, errorResponse } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/auth';
import { passwordSchema } from '@/lib/validations/password-schema';

async function handler(req: AuthenticatedRequest) {
  const userId = req.session.userId;
  const body = await req.json();

  const { currentPassword, newPassword } = body;

  // Validate input
  if (!currentPassword || !newPassword) {
    return errorResponse('BAD_REQUEST', 'Current password and new password are required', 400);
  }

  // Validate new password strength
  // Security: VULN-008 Fix - using password validation schema
  const passwordValidation = passwordSchema.safeParse(newPassword);
  if (!passwordValidation.success) {
    return errorResponse('BAD_REQUEST', passwordValidation.error.issues[0].message, 400);
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
  // Security: VULN-001 Fix - using bcrypt verification
  const isValidPassword = await verifyPassword(currentPassword, user.passwordHash);
  if (!isValidPassword) {
    return errorResponse('UNAUTHORIZED', 'Current password is incorrect', 401);
  }

  // Hash new password with bcrypt
  // Security: VULN-001 Fix - using bcrypt instead of SHA256
  const newPasswordHash = await hashPassword(newPassword);

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: newPasswordHash,
      salt: '', // Legacy field - not used with bcrypt
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
