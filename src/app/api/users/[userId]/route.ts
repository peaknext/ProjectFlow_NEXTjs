/**
 * GET /api/users/:userId
 * PATCH /api/users/:userId
 * DELETE /api/users/:userId
 * User management endpoints
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { withAuth, withPermission } from '@/lib/api-middleware';
import {
  successResponse,
  errorResponse,
  handleApiError,
} from '@/lib/api-response';
import { hashPassword, generateSecureToken } from '@/lib/auth';

const updateUserSchema = z.object({
  fullName: z.string().min(1).optional(),
  departmentId: z.string().nullable().optional(),
  role: z
    .enum(['ADMIN', 'CHIEF', 'LEADER', 'HEAD', 'MEMBER', 'USER'])
    .optional(),
  profileImageUrl: z.string().url().nullable().optional(),
  jobTitle: z.string().nullable().optional(),
  jobLevel: z.string().nullable().optional(),
  additionalRoles: z.record(z.string()).nullable().optional(),
  password: z.string().min(8).optional(), // Allow password change
});

/**
 * GET /api/users/:userId
 * Get single user details
 */
async function getHandler(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const { userId } = params;

  const user = await prisma.user.findUnique({
    where: { id: userId, deletedAt: null },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      profileImageUrl: true,
      departmentId: true,
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
      userStatus: true,
      isVerified: true,
      jobTitle: true,
      jobLevel: true,
      additionalRoles: true,
      pinnedTasks: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    return errorResponse('USER_NOT_FOUND', 'User not found', 404);
  }

  return successResponse({ user });
}

/**
 * PATCH /api/users/:userId
 * Update user details
 */
async function patchHandler(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
    });

    if (!existingUser) {
      return errorResponse('USER_NOT_FOUND', 'User not found', 404);
    }

    // Parse and validate request body
    const body = await req.json();
    const updates = updateUserSchema.parse(body);

    // Prepare update data
    const updateData: any = {};

    if (updates.fullName !== undefined) updateData.fullName = updates.fullName;
    if (updates.departmentId !== undefined)
      updateData.departmentId = updates.departmentId;
    if (updates.role !== undefined) updateData.role = updates.role;
    if (updates.profileImageUrl !== undefined)
      updateData.profileImageUrl = updates.profileImageUrl;
    if (updates.jobTitle !== undefined) updateData.jobTitle = updates.jobTitle;
    if (updates.jobLevel !== undefined) updateData.jobLevel = updates.jobLevel;
    if (updates.additionalRoles !== undefined)
      updateData.additionalRoles = updates.additionalRoles;

    // Handle password change
    if (updates.password) {
      const salt = generateSecureToken();
      updateData.salt = salt;
      updateData.passwordHash = hashPassword(updates.password, salt);
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        profileImageUrl: true,
        departmentId: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        userStatus: true,
        jobTitle: true,
        jobLevel: true,
        updatedAt: true,
      },
    });

    return successResponse({
      user: updatedUser,
      message: 'User updated successfully',
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/users/:userId
 * Soft delete user
 */
async function deleteHandler(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const { userId } = params;

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id: userId, deletedAt: null },
  });

  if (!existingUser) {
    return errorResponse('USER_NOT_FOUND', 'User not found', 404);
  }

  // Soft delete user
  await prisma.user.update({
    where: { id: userId },
    data: {
      deletedAt: new Date(),
      userStatus: 'INACTIVE',
    },
  });

  // Invalidate all sessions
  await prisma.session.deleteMany({
    where: { userId },
  });

  return successResponse({
    message: 'User deleted successfully',
    userId,
  });
}

// Export with appropriate permissions
export const GET = withAuth(getHandler);
export const PATCH = withPermission('edit_users', patchHandler);
export const DELETE = withPermission('delete_users', deleteHandler);
