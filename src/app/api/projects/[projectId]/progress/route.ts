/**
 * GET /api/projects/:projectId/progress
 * Calculate project progress percentage
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/api-middleware';
import type { AuthenticatedRequest } from '@/lib/api-middleware';
import { successResponse, errorResponse } from '@/lib/api-response';
import { checkPermission } from '@/lib/permissions';

async function handler(
  req: AuthenticatedRequest,
  { params }: { params: { projectId: string } }
) {
  const { projectId } = params;

  // Check permission
  const hasAccess = await checkPermission(
    req.session.userId,
    'view_projects',
    { projectId }
  );

  if (!hasAccess) {
    return errorResponse('FORBIDDEN', 'No access to this project', 403);
  }

  // Get project with tasks
  const project = await prisma.project.findUnique({
    where: { id: projectId, dateDeleted: null },
    include: {
      tasks: {
        where: { deletedAt: null, parentTaskId: null }, // Only main tasks (not subtasks)
        select: {
          id: true,
          isClosed: true,
          closeType: true,
          difficulty: true,
        },
      },
    },
  });

  if (!project) {
    return errorResponse('PROJECT_NOT_FOUND', 'Project not found', 404);
  }

  const totalTasks = project.tasks.length;

  if (totalTasks === 0) {
    return successResponse({
      projectId,
      progress: 0,
      totalTasks: 0,
      completedTasks: 0,
      method: 'no_tasks',
    });
  }

  // Calculate progress using weighted difficulty
  const hasDifficulty = project.tasks.some((t) => t.difficulty !== null);

  let progress = 0;
  let method = 'simple_count';

  if (hasDifficulty) {
    // Weighted by difficulty
    const totalWeight = project.tasks.reduce(
      (sum, t) => sum + (t.difficulty || 1),
      0
    );
    const completedWeight = project.tasks
      .filter((t) => t.isClosed && t.closeType === 'COMPLETED')
      .reduce((sum, t) => sum + (t.difficulty || 1), 0);

    progress = Math.round((completedWeight / totalWeight) * 100);
    method = 'weighted_difficulty';
  } else {
    // Simple count
    const completedTasks = project.tasks.filter(
      (t) => t.isClosed && t.closeType === 'COMPLETED'
    ).length;
    progress = Math.round((completedTasks / totalTasks) * 100);
    method = 'simple_count';
  }

  const completedTasks = project.tasks.filter(
    (t) => t.isClosed && t.closeType === 'COMPLETED'
  ).length;
  const abortedTasks = project.tasks.filter(
    (t) => t.isClosed && t.closeType === 'ABORTED'
  ).length;
  const openTasks = totalTasks - completedTasks - abortedTasks;

  return successResponse({
    projectId,
    progress,
    totalTasks,
    completedTasks,
    abortedTasks,
    openTasks,
    method,
  });
}

export const GET = withAuth(handler);
