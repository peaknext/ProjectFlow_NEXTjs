/**
 * POST /api/tasks/:taskId/close
 * Close task (mark as completed or aborted)
 */

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
        assignees: {
          select: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                profileImageUrl: true,
              },
            },
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

    // ✅ BUG FIX #1: Notify ALL assignees (not just the first one)
    // Get all assignees from task_assignees table
    const assignees = await prisma.taskAssignee.findMany({
      where: { taskId },
      select: { userId: true },
    });

    // Create notification message for assignees
    const assigneeNotificationMessage =
      closeType === 'COMPLETED'
        ? `งานของคุณถูกปิดสำเร็จ: ${existingTask.name}`
        : `งานของคุณถูกยกเลิก: ${existingTask.name}`;

    // Prepare notifications for all assignees (except the person who closed the task)
    const assigneeNotifications = assignees
      .filter((a) => a.userId !== req.session.userId)
      .map((a) => ({
        userId: a.userId,
        type: 'TASK_CLOSED' as const,
        message: assigneeNotificationMessage,
        taskId,
        triggeredByUserId: req.session.userId,
      }));

    // Send notifications to all assignees
    if (assigneeNotifications.length > 0) {
      await prisma.notification.createMany({
        data: assigneeNotifications,
      });
    }

    // ✅ BUG FIX #2: Check if creator is assignee using task_assignees table
    // Notify task creator about task closure (avoid duplicate if creator is also assignee)
    const taskCreatorId = existingTask.creatorUserId;
    const creatorIsAssignee = assignees.some((a) => a.userId === taskCreatorId);

    if (
      taskCreatorId &&
      taskCreatorId !== req.session.userId && // Owner is not the one closing
      !creatorIsAssignee // ✅ Fixed: Check from task_assignees (not just assigneeUserId)
    ) {
      const creatorNotificationMessage =
        closeType === 'COMPLETED'
          ? `${req.session.user.fullName} ได้ปิดงาน "${existingTask.name}" ของคุณ (เสร็จสมบูรณ์)`
          : `${req.session.user.fullName} ได้ยกเลิกงาน "${existingTask.name}" ของคุณ${reason ? ` เหตุผล: ${reason}` : ''}`;

      await prisma.notification.create({
        data: {
          userId: taskCreatorId,
          type: 'TASK_CLOSED',
          message: creatorNotificationMessage,
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
