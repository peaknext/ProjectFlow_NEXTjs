/**
 * GET /api/projects/:projectId/progress
 * Calculate project progress percentage and update cache
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/api-middleware';
import type { AuthenticatedRequest } from '@/lib/api-middleware';
import { successResponse, errorResponse } from '@/lib/api-response';
import { checkPermission } from '@/lib/permissions';
import { calculateProgress, updateProjectProgress } from '@/lib/calculate-progress';

async function handler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;

  // Check permission
  const hasAccess = await checkPermission(
    req.session.userId,
    'view_projects',
    { projectId }
  );

  if (!hasAccess) {
    return errorResponse('FORBIDDEN', 'No access to this project', 403);
  }

  // Get project with tasks and statuses
  const project = await prisma.project.findUnique({
    where: { id: projectId, dateDeleted: null },
    include: {
      tasks: {
        where: {
          deletedAt: null,
          parentTaskId: null, // Only main tasks (not subtasks)
        },
        select: {
          difficulty: true,
          closeType: true,
          status: {
            select: {
              order: true,
            },
          },
        },
      },
      statuses: {
        select: {
          order: true,
        },
      },
    },
  });

  if (!project) {
    return errorResponse('PROJECT_NOT_FOUND', 'Project not found', 404);
  }

  // Use shared calculation utility
  const result = calculateProgress(project.tasks, project.statuses);

  // Update cached progress in database
  await updateProjectProgress(projectId, result.progress);

  return successResponse({
    projectId,
    ...result,
    method: 'gas_formula', // Status order × difficulty
    cached: true, // Indicates this value is now cached in DB
  });
}

export const GET = withAuth(handler);
