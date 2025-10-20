/**
 * GET /api/users/me
 * Get current authenticated user
 */

import { NextRequest } from 'next/server';
import { withAuth, type AuthenticatedRequest } from '@/lib/api-middleware';
import { successResponse } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { getRolePermissions } from '@/lib/permissions';

async function handler(req: AuthenticatedRequest) {
  // Get full user data
  const user = await prisma.user.findUnique({
    where: { id: req.session.userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      profileImageUrl: true,
      departmentId: true,
      jobTitle: true,
      jobLevel: true,
      pinnedTasks: true,
      additionalRoles: true,
      createdAt: true,
      department: {
        select: {
          id: true,
          name: true,
          tel: true,
          division: {
            select: {
              id: true,
              name: true,
              missionGroup: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user) {
    return successResponse(null, 404);
  }

  // Get permissions
  const permissions = getRolePermissions(user.role);

  return successResponse({
    ...user,
    permissions,
  });
}

export const GET = withAuth(handler);
