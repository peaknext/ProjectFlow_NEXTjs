/**
 * GET /api/users/mentions?q=search
 * Search users for @mention autocomplete
 * Returns active users matching search query
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/api-middleware';
import { successResponse } from '@/lib/api-response';

async function handler(req: NextRequest) {
  // Get query parameters
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q') || '';
  const limit = parseInt(searchParams.get('limit') || '10');
  const departmentId = searchParams.get('departmentId') || undefined;

  // Build where clause
  const where: any = {
    userStatus: 'ACTIVE',
    isVerified: true,
    deletedAt: null,
  };

  // Search by name or email
  if (query) {
    where.OR = [
      { fullName: { contains: query, mode: 'insensitive' } },
      { email: { contains: query, mode: 'insensitive' } },
    ];
  }

  // Filter by department if provided
  if (departmentId) {
    where.departmentId = departmentId;
  }

  // Get users
  const users = await prisma.user.findMany({
    where,
    take: limit,
    select: {
      id: true,
      email: true,
      fullName: true,
      profileImageUrl: true,
      role: true,
      jobTitle: true,
      department: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [
      { fullName: 'asc' },
    ],
  });

  // Format for autocomplete
  const mentionableUsers = users.map((user) => ({
    id: user.id,
    email: user.email,
    name: user.fullName,
    avatar: user.profileImageUrl,
    role: user.role,
    jobTitle: user.jobTitle,
    department: user.department?.name || null,
    // Format for display: "John Doe (IT Department)"
    display: user.department
      ? `${user.fullName} (${user.department.name})`
      : user.fullName,
    // Format for mention: "@john.doe"
    mention: `@${user.email.split('@')[0]}`,
  }));

  return successResponse({
    users: mentionableUsers,
    total: users.length,
    query,
  });
}

export const GET = withAuth(handler);
