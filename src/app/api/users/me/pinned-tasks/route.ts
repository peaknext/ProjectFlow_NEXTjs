/**
 * GET /api/users/me/pinned-tasks
 * POST /api/users/me/pinned-tasks
 * DELETE /api/users/me/pinned-tasks
 * User's pinned tasks management (stored as JSON array in User.pinnedTasks)
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/api-middleware';
import type { AuthenticatedRequest } from '@/lib/api-middleware';
import {
  successResponse,
  errorResponse,
  handleApiError,
} from '@/lib/api-response';

const pinTaskSchema = z.object({
  taskId: z.string().min(1, 'Task ID is required'),
});

const unpinTaskSchema = z.object({
  taskId: z.string().min(1, 'Task ID is required'),
});

/**
 * GET /api/users/me/pinned-tasks
 * List all pinned tasks for current user
 */
async function getHandler(req: AuthenticatedRequest) {
  // Get current user with pinnedTasks
  const user = await prisma.user.findUnique({
    where: { id: req.session.userId },
    select: { pinnedTasks: true },
  });

  if (!user) {
    return errorResponse('USER_NOT_FOUND', 'User not found', 404);
  }

  // Parse pinnedTasks JSON (should be array of task IDs)
  const pinnedTaskIds = (user.pinnedTasks as string[]) || [];

  if (pinnedTaskIds.length === 0) {
    return successResponse({
      tasks: [],
      total: 0,
    });
  }

  // Fetch task details for all pinned tasks
  const tasks = await prisma.task.findMany({
    where: {
      id: { in: pinnedTaskIds },
      deletedAt: null,
    },
    include: {
      status: {
        select: {
          id: true,
          name: true,
          color: true,
          type: true,
        },
      },
      assignee: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profileImageUrl: true,
        },
      },
      project: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          comments: { where: { deletedAt: null } },
          checklists: { where: { deletedAt: null } },
          subtasks: { where: { deletedAt: null } },
        },
      },
    },
  });

  // Transform to include task details
  const tasksWithCounts = tasks.map((task) => ({
    id: task.id,
    name: task.name,
    description: task.description,
    priority: task.priority,
    dueDate: task.dueDate?.toISOString() || null,
    isClosed: task.isClosed,
    closeType: task.closeType,
    status: task.status,
    assignee: task.assignee,
    project: task.project,
    commentCount: task._count.comments,
    checklistCount: task._count.checklists,
    subtaskCount: task._count.subtasks,
  }));

  return successResponse({
    tasks: tasksWithCounts,
    total: tasksWithCounts.length,
  });
}

/**
 * POST /api/users/me/pinned-tasks
 * Pin a task for quick access
 */
async function postHandler(req: AuthenticatedRequest) {
  try {
    const body = await req.json();
    const data = pinTaskSchema.parse(body);

    // Check if task exists
    const task = await prisma.task.findUnique({
      where: { id: data.taskId, deletedAt: null },
      select: {
        id: true,
        name: true,
        projectId: true,
      },
    });

    if (!task) {
      return errorResponse('TASK_NOT_FOUND', 'Task not found', 404);
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
      select: { pinnedTasks: true },
    });

    if (!user) {
      return errorResponse('USER_NOT_FOUND', 'User not found', 404);
    }

    // Parse current pinnedTasks
    const pinnedTaskIds = (user.pinnedTasks as string[]) || [];

    // Check if already pinned
    if (pinnedTaskIds.includes(data.taskId)) {
      return errorResponse('ALREADY_PINNED', 'Task is already pinned', 400);
    }

    // Add task to pinned list
    const updatedPinnedTasks = [...pinnedTaskIds, data.taskId];

    // Update user
    await prisma.user.update({
      where: { id: req.session.userId },
      data: {
        pinnedTasks: updatedPinnedTasks as any,
      },
    });

    return successResponse(
      {
        message: 'Task pinned successfully',
        taskId: data.taskId,
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/users/me/pinned-tasks
 * Unpin a task
 */
async function deleteHandler(req: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return errorResponse('TASK_ID_REQUIRED', 'Task ID is required', 400);
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
      select: { pinnedTasks: true },
    });

    if (!user) {
      return errorResponse('USER_NOT_FOUND', 'User not found', 404);
    }

    // Parse current pinnedTasks
    const pinnedTaskIds = (user.pinnedTasks as string[]) || [];

    // Check if task is pinned
    if (!pinnedTaskIds.includes(taskId)) {
      return errorResponse('NOT_PINNED', 'Task is not pinned', 400);
    }

    // Remove task from pinned list
    const updatedPinnedTasks = pinnedTaskIds.filter((id) => id !== taskId);

    // Update user
    await prisma.user.update({
      where: { id: req.session.userId },
      data: {
        pinnedTasks: updatedPinnedTasks as any,
      },
    });

    return successResponse({
      message: 'Task unpinned successfully',
      taskId,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);
export const DELETE = withAuth(deleteHandler);
