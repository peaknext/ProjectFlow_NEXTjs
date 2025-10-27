/**
 * POST /api/tasks/:taskId/close
 * Close task (mark as completed or aborted)
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
import { canUserCloseTask } from '@/lib/permissions';

const closeTaskSchema = z.object({
  type: z.enum(['COMPLETED', 'ABORTED']),
  reason: z.string().optional(),
});

async function handler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;

    // Get existing task
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId, deletedAt: null },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!existingTask) {
      return errorResponse('TASK_NOT_FOUND', 'Task not found', 404);
    }

    // Check if already closed
    if (existingTask.isClosed) {
      return errorResponse(
        'TASK_ALREADY_CLOSED',
        `Task is already closed as ${existingTask.closeType}`,
        400
      );
    }

    // Check permission
    const canClose = await canUserCloseTask(req.session.userId, taskId);
    if (!canClose) {
      return errorResponse('FORBIDDEN', 'No permission to close this task', 403);
    }

    const body = await req.json();
    const { type: closeType, reason } = closeTaskSchema.parse(body);

    // Close task
    const closedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        isClosed: true,
        closeType,
        closeDate: new Date(),
        userClosedId: req.session.userId,
      },
      include: {
        assignee: {
          select: {
            id: true,
            fullName: true,
          },
        },
        closedBy: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    // Log history
    const historyText = closeType === 'COMPLETED'
      ? `ปิดงาน "${existingTask.name}"`
      : `ยกเลิกงาน "${existingTask.name}"`;

    await prisma.history.create({
      data: {
        taskId,
        userId: req.session.userId,
        historyText,
      },
    });

    // Notify assignee if different from closer
    if (
      existingTask.assigneeUserId &&
      existingTask.assigneeUserId !== req.session.userId
    ) {
      const notificationMessage =
        closeType === 'COMPLETED'
          ? `งานของคุณถูกปิดสำเร็จ: ${existingTask.name}`
          : `งานของคุณถูกยกเลิก: ${existingTask.name}`;

      await prisma.notification.create({
        data: {
          userId: existingTask.assigneeUserId,
          type: 'TASK_CLOSED',
          message: notificationMessage,
          triggeredByUserId: req.session.userId,
        },
      });
    }

    // ✅ TASK OWNER NOTIFICATION: Notify task creator about task closure
    const taskCreatorId = existingTask.creatorUserId;
    if (
      taskCreatorId &&
      taskCreatorId !== req.session.userId && // Owner is not the one closing
      taskCreatorId !== existingTask.assigneeUserId // Owner is not the assignee (avoid duplicate)
    ) {
      const notificationMessage =
        closeType === 'COMPLETED'
          ? `${req.session.user.fullName} ได้ปิดงาน "${existingTask.name}" ของคุณ (เสร็จสมบูรณ์)`
          : `${req.session.user.fullName} ได้ยกเลิกงาน "${existingTask.name}" ของคุณ${reason ? ` เหตุผล: ${reason}` : ''}`;

      await prisma.notification.create({
        data: {
          userId: taskCreatorId,
          type: 'TASK_CLOSED',
          message: notificationMessage,
          taskId,
          triggeredByUserId: req.session.userId,
        },
      });
    }

    return successResponse({
      task: {
        ...closedTask,
        closeDate: closedTask.closeDate?.toISOString(),
        createdAt: closedTask.createdAt.toISOString(),
      },
      message: `Task closed as ${closeType}`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export const POST = withAuth(handler);
