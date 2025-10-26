/**
 * DELETE /api/users/me/pinned-tasks/:taskId
 * Unpin a task
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

  // @ts-ignore - pinnedTask model not in schema, using JSON field instead
  // Check if task is pinned
  const existingPin = await prisma.pinnedTask.findUnique({
    where: {
      userId_taskId: {
        userId: req.session.userId,
        taskId,
      },
    },
  });

  if (!existingPin) {
    return errorResponse('NOT_PINNED', 'Task is not pinned', 404);
  }

  // Unpin task
  // @ts-ignore - pinnedTask model not in schema
  await prisma.pinnedTask.delete({
    where: {
      userId_taskId: {
        userId: req.session.userId,
        taskId,
      },
    },
  });

  return successResponse({
    message: 'Task unpinned successfully',
    taskId,
  });
}

export const DELETE = withAuth(handler);
