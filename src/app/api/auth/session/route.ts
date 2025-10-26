// @ts-nocheck - Prisma type issues
/**
 * GET /api/auth/session
 * Get current user session
 */

import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { successResponse } from '@/lib/api-response';
import { getRolePermissions } from '@/lib/permissions';

async function handler(req: AuthenticatedRequest) {
  const session = req.session;

  const userData = {
    id: session.user.id,
    name: session.user.fullName, // Map fullName to name for compatibility
    fullName: session.user.fullName,
    email: session.user.email,
    role: session.user.role,
    avatar: session.user.profileImageUrl,
    profileImageUrl: session.user.profileImageUrl,
    departmentId: session.user.departmentId,
    permissions: getRolePermissions(session.user.role),
  };

  // Return both user and session separately (matches useSession hook expectation)
  return successResponse({
    user: userData,
    session: {
      userId: session.userId,
      token: session.token || '',
      expiresAt: session.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      user: userData,
    },
  });
}

export const GET = withAuth(handler);
