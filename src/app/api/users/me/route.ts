/**
 * GET /api/users/me
 * Get current authenticated user
 */

import { NextRequest } from 'next/server';
import { withAuth, type AuthenticatedRequest } from '@/lib/api-middleware';
import { successResponse } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { getRolePermissions } from '@/lib/permissions';
import { formatFullName } from '@/lib/user-utils';

async function handler(req: AuthenticatedRequest) {
  // Get full user data
  const user = await prisma.user.findUnique({
    where: { id: req.session.userId },
    select: {
      id: true,
      email: true,
      titlePrefix: true,
      firstName: true,
      lastName: true,
      fullName: true,
      role: true,
      profileImageUrl: true,
      departmentId: true,
      jobTitleId: true,
      jobLevel: true,
      workLocation: true,
      internalPhone: true,
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

/**
 * PATCH /api/users/me
 * Update current user profile
 */
async function updateHandler(req: AuthenticatedRequest) {
  const userId = req.session.userId;
  const body = await req.json();

  // Allowed fields to update
  const {
    titlePrefix,
    firstName,
    lastName,
    jobTitleId,
    jobLevel,
    workLocation,
    internalPhone,
    profileImageUrl,
  } = body;

  // Validate required fields
  if (firstName !== undefined && !firstName?.trim()) {
    return successResponse({ error: 'First name is required' }, 400);
  }
  if (lastName !== undefined && !lastName?.trim()) {
    return successResponse({ error: 'Last name is required' }, 400);
  }

  // Build update data
  const updateData: any = {};
  if (titlePrefix !== undefined) updateData.titlePrefix = titlePrefix;
  if (firstName !== undefined) updateData.firstName = firstName.trim();
  if (lastName !== undefined) updateData.lastName = lastName.trim();
  if (jobTitleId !== undefined) updateData.jobTitleId = jobTitleId || null;
  if (jobLevel !== undefined) updateData.jobLevel = jobLevel;
  if (workLocation !== undefined) updateData.workLocation = workLocation;
  if (internalPhone !== undefined) updateData.internalPhone = internalPhone;
  if (profileImageUrl !== undefined) updateData.profileImageUrl = profileImageUrl;

  // Auto-generate fullName if name fields are being updated
  if (firstName !== undefined || lastName !== undefined || titlePrefix !== undefined) {
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { titlePrefix: true, firstName: true, lastName: true },
    });

    const newTitlePrefix = titlePrefix !== undefined ? titlePrefix : currentUser?.titlePrefix;
    const newFirstName = firstName !== undefined ? firstName.trim() : currentUser?.firstName;
    const newLastName = lastName !== undefined ? lastName.trim() : currentUser?.lastName;

    if (newFirstName && newLastName) {
      updateData.fullName = formatFullName(newTitlePrefix, newFirstName, newLastName);
    }
  }

  // Update user
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      email: true,
      titlePrefix: true,
      firstName: true,
      lastName: true,
      fullName: true,
      role: true,
      profileImageUrl: true,
      departmentId: true,
      jobTitleId: true,
      jobLevel: true,
      workLocation: true,
      internalPhone: true,
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
      jobTitle: {
        select: {
          id: true,
          jobTitleTh: true,
          jobTitleEn: true,
        },
      },
    },
  });

  return successResponse({ user: updatedUser });
}

export const PATCH = withAuth(updateHandler);
