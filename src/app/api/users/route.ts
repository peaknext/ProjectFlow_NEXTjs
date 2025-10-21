/**
 * GET /api/users
 * List all users (with filters and pagination)
 * Requires authentication and 'view_users' permission
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { withPermission } from '@/lib/api-middleware';
import { successResponse } from '@/lib/api-response';

async function handler(req: NextRequest) {
  // Get query parameters
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const search = searchParams.get('search') || '';
  const departmentId = searchParams.get('departmentId') || undefined;
  const role = searchParams.get('role') || undefined;
  const status = searchParams.get('status') || undefined;

  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {
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
      jobTitle: true,
      jobLevel: true,
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

// Export with permission middleware
export const GET = withPermission('view_users', handler);
