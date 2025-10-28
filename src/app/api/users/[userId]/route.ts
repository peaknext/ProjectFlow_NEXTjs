// @ts-nocheck - Zod type issues
/**
 * GET /api/users/:userId
 * PATCH /api/users/:userId
 * DELETE /api/users/:userId
 * User management endpoints
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import {
  successResponse,
  errorResponse,
  handleApiError,
} from '@/lib/api-response';
import { hashPassword, generateSecureToken } from '@/lib/auth';
import { canManageTargetUser } from '@/lib/permissions';
import { formatFullName } from '@/lib/user-utils';

const updateUserSchema = z.object({
  fullName: z.string().min(1).optional(),
  titlePrefix: z.string().nullable().optional(), // Added for name parts
  firstName: z.string().min(1).optional(), // Added for name parts
  lastName: z.string().min(1).optional(), // Added for name parts
  departmentId: z.string().nullable().optional(),
  role: z
    .enum(['ADMIN', 'CHIEF', 'LEADER', 'HEAD', 'MEMBER', 'USER'])
    .optional(),
  profileImageUrl: z.string().url().nullable().optional(),
  jobTitleId: z.string().nullable().optional(),
  jobLevel: z.string().nullable().optional(),
  workLocation: z.string().nullable().optional(),
  internalPhone: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  additionalRoles: z.record(z.string()).nullable().optional(),
  password: z.string().min(8).optional(), // Allow password change
});

/**
 * GET /api/users/:userId
 * Get single user details
 */
async function getHandler(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;

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
      jobTitleId: true,
      jobTitle: {
        select: {
          id: true,
          jobTitleTh: true,
          jobTitleEn: true,
        },
      },
      jobLevel: true,
      workLocation: true,
      internalPhone: true,
      notes: true,
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
 * Requires management scope permission
 */
async function patchHandler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const currentUserId = req.session.userId;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
    });

    if (!existingUser) {
      return errorResponse('USER_NOT_FOUND', 'User not found', 404);
    }

    // Check if current user can manage target user (scope-based permission)
    const canManage = await canManageTargetUser(currentUserId, userId);
    if (!canManage) {
      return errorResponse(
        'FORBIDDEN',
        'You do not have permission to edit this user',
        403
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const updates = updateUserSchema.parse(body);

    // Prepare update data
    const updateData: any = {};

    // Name parts (new - supports individual field updates)
    if (updates.titlePrefix !== undefined) updateData.titlePrefix = updates.titlePrefix;
    if (updates.firstName !== undefined) updateData.firstName = updates.firstName;
    if (updates.lastName !== undefined) updateData.lastName = updates.lastName;

    // Auto-generate fullName if name parts are provided
    if (updates.firstName || updates.lastName) {
      const titlePrefix = updates.titlePrefix !== undefined ? updates.titlePrefix : existingUser.titlePrefix;
      const firstName = updates.firstName || existingUser.firstName;
      const lastName = updates.lastName || existingUser.lastName;

      updateData.fullName = formatFullName(titlePrefix, firstName, lastName);
    }

    if (updates.fullName !== undefined) updateData.fullName = updates.fullName;
    if (updates.departmentId !== undefined)
      updateData.departmentId = updates.departmentId;
    if (updates.role !== undefined) updateData.role = updates.role;
    if (updates.profileImageUrl !== undefined)
      updateData.profileImageUrl = updates.profileImageUrl;
    if (updates.jobTitleId !== undefined) updateData.jobTitleId = updates.jobTitleId;
    if (updates.jobLevel !== undefined) updateData.jobLevel = updates.jobLevel;
    if (updates.workLocation !== undefined) updateData.workLocation = updates.workLocation;
    if (updates.internalPhone !== undefined) updateData.internalPhone = updates.internalPhone;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.additionalRoles !== undefined)
      updateData.additionalRoles = updates.additionalRoles;

    // Handle password change
    if (updates.password) {
      // Security: VULN-001 Fix - using bcrypt instead of SHA256
      updateData.salt = ''; // Legacy field - not used with bcrypt
      updateData.passwordHash = await hashPassword(updates.password);
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
        jobTitleId: true,
        jobTitle: {
          select: {
            id: true,
            jobTitleTh: true,
            jobTitleEn: true,
          },
        },
        jobLevel: true,
        workLocation: true,
        internalPhone: true,
        notes: true,
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
 * Requires management scope permission
 */
async function deleteHandler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const currentUserId = req.session.userId;

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id: userId, deletedAt: null },
  });

  if (!existingUser) {
    return errorResponse('USER_NOT_FOUND', 'User not found', 404);
  }

  // Check if current user can manage target user (scope-based permission)
  const canManage = await canManageTargetUser(currentUserId, userId);
  if (!canManage) {
    return errorResponse(
      'FORBIDDEN',
      'You do not have permission to delete this user',
      403
    );
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

// Export with authentication (permission checks done in handlers)
export const GET = withAuth(getHandler);
export const PATCH = withAuth(patchHandler);
export const DELETE = withAuth(deleteHandler);
