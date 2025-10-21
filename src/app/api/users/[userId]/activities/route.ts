/**
 * GET /api/users/:userId/activities
 * Get activity feed for a specific user
 * Shows all activities performed by the user
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/api-middleware';
import type { AuthenticatedRequest } from '@/lib/api-middleware';
import { successResponse, errorResponse } from '@/lib/api-response';

async function handler(
  req: AuthenticatedRequest,
  { params }: { params: { userId: string } }
) {
  const { userId } = params;
  const { searchParams } = new URL(req.url);

  const limit = Math.min(
    parseInt(searchParams.get('limit') || '50', 10),
    100
  );
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  // Verify user exists
  const user = await prisma.user.findUnique({
    where: { id: userId, deletedAt: null },
    select: {
      id: true,
      fullName: true,
      email: true,
      profileImageUrl: true,
      role: true,
    },
  });

  if (!user) {
    return errorResponse('USER_NOT_FOUND', 'User not found', 404);
  }

  // Get user's activity history
  const [histories, total] = await Promise.all([
    prisma.history.findMany({
      where: {
        userId,
      },
      include: {
        task: {
          select: {
            id: true,
            name: true,
            projectId: true,
            project: {
              select: {
                id: true,
                name: true,
              },
            },
            status: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
      },
      orderBy: {
        historyDate: 'desc',
      },
      take: limit,
      skip: offset,
    }),
    prisma.history.count({ where: { userId } }),
  ]);

  // Transform to activity feed format
  const activities = histories.map((history) => ({
    id: history.id,
    description: history.historyText,
    timestamp: history.historyDate.toISOString(),
    task: history.task,
  }));

  return successResponse({
    activities,
    total,
    limit,
    offset,
    hasMore: offset + limit < total,
    user,
  });
}

export const GET = withAuth(handler);
