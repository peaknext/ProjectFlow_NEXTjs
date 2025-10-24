/**
 * GET /api/users
 * List all users (with filters and pagination)
 * Requires authentication and returns only users in management scope
 *
 * Scope filtering based on role:
 * - ADMIN: All non-admin users
 * - CHIEF: Users in their mission group(s)
 * - LEADER: Users in their division(s)
 * - HEAD: Users in their department(s)
 * - MEMBER/USER: None (returns empty list)
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { successResponse } from '@/lib/api-response';
import { getUserManageableUserIds } from '@/lib/permissions';

async function handler(req: AuthenticatedRequest) {
  const userId = req.session.userId;

  // Get query parameters
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const search = searchParams.get('search') || '';
  const departmentId = searchParams.get('departmentId') || undefined;
  const role = searchParams.get('role') || undefined;
  const status = searchParams.get('status') || undefined;

  const skip = (page - 1) * limit;

  // Get list of users that current user can manage (scope-based filtering)
  const manageableUserIds = await getUserManageableUserIds(userId);

  // If user cannot manage anyone, return empty list
  if (manageableUserIds.length === 0) {
    return successResponse({
      users: [],
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
    });
  }

  // Build where clause with scope filter
  const where: any = {
    id: { in: manageableUserIds }, // ✅ Critical: Only show manageable users
    deletedAt: null, // Exclude soft-deleted users
  };

  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { fullName: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (departmentId) {
    where.departmentId = departmentId;
  }

  if (role) {
    where.role = role;
  }

  if (status) {
    where.userStatus = status;
  }

  // Get total count
  const total = await prisma.user.count({ where });

  // Get users
  const users = await prisma.user.findMany({
    where,
    skip,
    take: limit,
    select: {
      id: true,
      email: true,
      titlePrefix: true, // For edit modal
      firstName: true, // For edit modal
      lastName: true, // For edit modal
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
      workLocation: true, // For edit modal
      internalPhone: true, // For edit modal
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return successResponse({
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  });
}

// Export with authentication middleware (scope filtering done in handler)
export const GET = withAuth(handler);
