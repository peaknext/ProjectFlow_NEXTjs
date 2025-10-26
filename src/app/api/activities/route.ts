// @ts-nocheck - Prisma type issues
/**
 * GET /api/activities
 * Get system-wide activity feed (admin/management view)
 * Shows recent activities across all projects and users
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth, withPermission } from '@/lib/api-middleware';
import type { AuthenticatedRequest } from '@/lib/api-middleware';
import { successResponse } from '@/lib/api-response';

async function handler(req: AuthenticatedRequest) {
  const { searchParams } = new URL(req.url);

  const limit = Math.min(
    parseInt(searchParams.get('limit') || '50', 10),
    100
  );
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const entityType = searchParams.get('entityType'); // Task, Project, etc.
  const actionType = searchParams.get('actionType'); // CREATE, UPDATE, DELETE

  // Build where clause
  const where: any = {};

  if (entityType) {
    where.historyText = {
      contains: entityType,
    };
  }

  // Note: Using History model which tracks task changes
  // For full activity tracking, consider adding ActivityLog model to schema
  const [histories, total] = await Promise.all([
    prisma.history.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            profileImageUrl: true,
            role: true,
          },
        },
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
          },
        },
      },
      orderBy: {
        historyDate: 'desc',
      },
      take: limit,
      skip: offset,
    }),
    prisma.history.count({ where }),
  ]);

  // Transform to activity feed format
  const activities = histories.map((history) => ({
    id: history.id,
    description: history.historyText,
    timestamp: history.historyDate.toISOString(),
    user: history.user,
    task: history.task
      ? {
          id: history.task.id,
          name: history.task.name,
          project: history.task.project,
        }
      : null,
  }));

  return successResponse({
    activities,
    total,
    limit,
    offset,
    hasMore: offset + limit < total,
  });
}

// Require view_activities permission
export const GET = withAuth(withPermission(handler, 'view_activities'));
