/**
 * GET /api/tasks/:taskId/checklists
 * POST /api/tasks/:taskId/checklists
 * Task checklists management (HIGH PRIORITY)
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
import { canUserEditTask } from '@/lib/permissions';

const createChecklistSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
});

/**
 * GET /api/tasks/:taskId/checklists
 * List all checklist items for task
 */
async function getHandler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;

  // Check if task exists
  const task = await prisma.task.findUnique({
    where: { id: taskId, deletedAt: null },
    select: { id: true },
  });

  if (!task) {
    return errorResponse('TASK_NOT_FOUND', 'Task not found', 404);
  }

  const items = await prisma.checklist.findMany({
    where: {
      taskId,
      deletedAt: null,
    },
    include: {
      creator: {
        select: {
          id: true,
          fullName: true,
          profileImageUrl: true,
        },
      },
    },
    orderBy: { createdDate: 'asc' },
  });

  return successResponse({
    items: items.map((item) => ({
      ...item,
      createdAt: item.createdDate.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    })),
    total: items.length,
    completed: items.filter((i) => i.isChecked).length,
  });
}

/**
 * POST /api/tasks/:taskId/checklists
 * Create new checklist item
 */
async function postHandler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;

    // Check if task exists
    const task = await prisma.task.findUnique({
      where: { id: taskId, deletedAt: null },
      select: { id: true, name: true, projectId: true },
    });

    if (!task) {
      return errorResponse('TASK_NOT_FOUND', 'Task not found', 404);
    }

    // Check permission
    const canEdit = await canUserEditTask(req.session.userId, taskId);
    if (!canEdit) {
      return errorResponse('FORBIDDEN', 'No permission to edit this task', 403);
    }

    const body = await req.json();
    const data = createChecklistSchema.parse(body);

    // Create checklist item
    const item = await prisma.checklist.create({
      data: {
        taskId,
        name: data.name,
        creatorUserId: req.session.userId,
        isChecked: false,
      },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    // Log history
    await prisma.history.create({
      data: {
        taskId,
        userId: req.session.userId,
        historyText: `เพิ่ม "${data.name}" ในรายการสิ่งที่ต้องทำ ของงาน "${task.name}"`,
      },
    });

    return successResponse(
      {
        item: {
          ...item,
          createdAt: item.createdDate.toISOString(),
        },
        message: 'Checklist item added successfully',
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);
