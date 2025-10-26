/**
 * GET /api/projects/:projectId/activities
 * Get activity feed for a specific project
 * Shows all task activities within the project
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/api-middleware';
import type { AuthenticatedRequest } from '@/lib/api-middleware';
import { successResponse, errorResponse } from '@/lib/api-response';

async function handler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const { searchParams } = new URL(req.url);

  const limit = Math.min(
    parseInt(searchParams.get('limit') || '50', 10),
    100
  );
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  // Verify project exists
  const project = await prisma.project.findUnique({
    where: { id: projectId, dateDeleted: null },
    select: { id: true, name: true },
  });

  if (!project) {
    return errorResponse('PROJECT_NOT_FOUND', 'Project not found', 404);
  }

  // Get all task IDs in this project
  const tasks = await prisma.task.findMany({
    where: { projectId, deletedAt: null },
    select: { id: true },
  });

  const taskIds = tasks.map((t) => t.id);

  if (taskIds.length === 0) {
    return successResponse({
      activities: [],
      total: 0,
      limit,
      offset,
      hasMore: false,
      project,
    });
  }

  // Get activities for all tasks in project
  const [histories, total] = await Promise.all([
    prisma.history.findMany({
      where: {
        taskId: { in: taskIds },
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            profileImageUrl: true,
          },
        },
        task: {
          select: {
            id: true,
            name: true,
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
    prisma.history.count({
      where: {
        taskId: { in: taskIds },
      },
    }),
  ]);

  // Transform to activity feed format
  const activities = histories.map((history) => ({
    id: history.id,
    description: history.historyText,
    timestamp: history.historyDate.toISOString(),
    user: history.user,
    task: history.task,
  }));

  return successResponse({
    activities,
    total,
    limit,
    offset,
    hasMore: offset + limit < total,
    project,
  });
}

export const GET = withAuth(handler);
