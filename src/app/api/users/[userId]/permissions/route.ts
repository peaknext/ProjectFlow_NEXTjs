/**
 * GET /api/users/:userId/permissions
 * Get user's permissions based on role and context
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/api-middleware';
import {
  successResponse,
  errorResponse,
} from '@/lib/api-response';
import { getRolePermissions, getEffectiveRole } from '@/lib/permissions';

async function handler(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const { userId } = params;

  // Get query parameters
  const { searchParams } = new URL(req.url);
  const departmentId = searchParams.get('departmentId') || undefined;
  const projectId = searchParams.get('projectId') || undefined;

  // Get user
  const user = await prisma.user.findUnique({
    where: { id: userId, deletedAt: null },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      departmentId: true,
      additionalRoles: true,
      department: {
        select: {
          id: true,
          name: true,
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
    return errorResponse('USER_NOT_FOUND', 'User not found', 404);
  }

  // Get base role permissions
  const basePermissions = getRolePermissions(user.role);

  // Get effective role if context provided
  let effectiveRole = user.role;
  let effectivePermissions = basePermissions;

  if (departmentId || projectId) {
    effectiveRole = await getEffectiveRole(userId, { departmentId, projectId });
    effectivePermissions = getRolePermissions(effectiveRole);
  }

  // Parse additional roles
  const additionalRoles = (user.additionalRoles as Record<string, string>) || {};

  return successResponse({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
    },
    baseRole: user.role,
    effectiveRole,
    permissions: effectivePermissions,
    basePermissions,
    additionalRoles,
    scope: user.department
      ? {
          department: {
            id: user.department.id,
            name: user.department.name,
          },
          division: {
            id: user.department.division.id,
            name: user.department.division.name,
          },
          missionGroup: {
            id: user.department.division.missionGroup.id,
            name: user.department.division.missionGroup.name,
          },
        }
      : null,
  });
}

export const GET = withAuth(handler);
