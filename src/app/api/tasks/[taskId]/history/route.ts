/**
 * GET /api/tasks/:taskId/history
 * Get task activity history (audit trail)
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/api-middleware';
import type { AuthenticatedRequest } from '@/lib/api-middleware';
import { successResponse, errorResponse } from '@/lib/api-response';

async function handler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '50');

  // Check if task exists
  const task = await prisma.task.findUnique({
    where: { id: taskId, deletedAt: null },
    select: { id: true, name: true },
  });

  if (!task) {
    return errorResponse('TASK_NOT_FOUND', 'Task not found', 404);
  }

  // Get activity logs for this task (using History model)
  const activities = await prisma.history.findMany({
    where: {
      taskId: taskId,
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
    },
    orderBy: {
      historyDate: 'desc',
    },
    take: limit,
  });

  // Transform activities into human-readable format
  const history = activities.map((activity) => {
    return {
      id: activity.id,
      description: activity.historyText,
      user: activity.user,
      createdAt: activity.historyDate.toISOString(),
    };
  });

  return successResponse({
    task: {
      id: task.id,
      name: task.name,
    },
    history,
    total: history.length,
  });
}

export const GET = withAuth(handler);
