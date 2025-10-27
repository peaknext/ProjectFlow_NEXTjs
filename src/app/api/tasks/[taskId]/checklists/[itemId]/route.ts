/**
 * PATCH /api/tasks/:taskId/checklists/:itemId
 * DELETE /api/tasks/:taskId/checklists/:itemId
 * Individual checklist item operations (HIGH PRIORITY)
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

const updateChecklistSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  isChecked: z.boolean().optional(),
});

/**
 * PATCH /api/tasks/:taskId/checklists/:itemId
 * Update checklist item
 */
async function patchHandler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ taskId: string; itemId: string }> }
) {
  try {
    const { taskId, itemId } = await params;

    // Check if checklist item exists
    const existingItem = await prisma.checklist.findUnique({
      where: { id: itemId, deletedAt: null },
      select: {
        id: true,
        taskId: true,
        name: true,
        isChecked: true,
      },
    });

    // Get task name and creator for history and notification
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { name: true, creatorUserId: true },
    });

    if (!existingItem) {
      return errorResponse('ITEM_NOT_FOUND', 'Checklist item not found', 404);
    }

    // Verify item belongs to the task
    if (existingItem.taskId !== taskId) {
      return errorResponse('INVALID_TASK', 'Item does not belong to this task', 400);
    }

    // Check permission
    const canEdit = await canUserEditTask(req.session.userId, taskId);
    if (!canEdit) {
      return errorResponse('FORBIDDEN', 'No permission to edit this task', 403);
    }

    const body = await req.json();
    const updates = updateChecklistSchema.parse(body);

    // Prepare update data
    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.isChecked !== undefined) updateData.isChecked = updates.isChecked;

    // Update item
    const item = await prisma.checklist.update({
      where: { id: itemId },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    // Log history for changes
    if (updates.name !== undefined && updates.name !== existingItem.name) {
      await prisma.history.create({
        data: {
          taskId,
          userId: req.session.userId,
          historyText: `แก้ไข "${existingItem.name}" เป็น "${updates.name}" ในรายการสิ่งที่ต้องทำ ของงาน "${task?.name}"`,
        },
      });

      // ✅ TASK OWNER NOTIFICATION: Notify about checklist name change
      if (task?.creatorUserId && task.creatorUserId !== req.session.userId) {
        await prisma.notification.create({
          data: {
            userId: task.creatorUserId,
            type: 'TASK_UPDATED',
            message: `${req.session.user.fullName} แก้ไขรายการ "${existingItem.name}" ในงาน "${task.name}" ของคุณ`,
            taskId,
            triggeredByUserId: req.session.userId,
          },
        });
      }
    }

    // Log checkbox toggle
    if (updates.isChecked !== undefined && updates.isChecked !== existingItem.isChecked) {
      const action = updates.isChecked ? 'ทำเครื่องหมาย' : 'ยกเลิกการทำเครื่องหมาย';
      await prisma.history.create({
        data: {
          taskId,
          userId: req.session.userId,
          historyText: `${action} "${existingItem.name}" ในรายการสิ่งที่ต้องทำ ของงาน "${task?.name}"`,
        },
      });

      // ✅ TASK OWNER NOTIFICATION: Notify about checklist checkbox toggle
      if (task?.creatorUserId && task.creatorUserId !== req.session.userId) {
        const actionText = updates.isChecked ? 'ทำเครื่องหมาย' : 'ยกเลิกการทำเครื่องหมาย';
        await prisma.notification.create({
          data: {
            userId: task.creatorUserId,
            type: 'TASK_UPDATED',
            message: `${req.session.user.fullName} ${actionText} "${existingItem.name}" ในงาน "${task.name}" ของคุณ`,
            taskId,
            triggeredByUserId: req.session.userId,
          },
        });
      }
    }

    return successResponse({
      item: {
        ...item,
        createdAt: item.createdDate.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      },
      message: 'Checklist item updated successfully',
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/tasks/:taskId/checklists/:itemId
 * Soft delete checklist item
 */
async function deleteHandler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ taskId: string; itemId: string }> }
) {
  const { taskId, itemId } = await params;

  // Check if checklist item exists
  const existingItem = await prisma.checklist.findUnique({
    where: { id: itemId, deletedAt: null },
    select: {
      id: true,
      taskId: true,
      name: true,
    },
  });

  // Get task name and creator for history and notification
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { name: true, creatorUserId: true },
  });

  if (!existingItem) {
    return errorResponse('ITEM_NOT_FOUND', 'Checklist item not found', 404);
  }

  // Verify item belongs to the task
  if (existingItem.taskId !== taskId) {
    return errorResponse('INVALID_TASK', 'Item does not belong to this task', 400);
  }

  // Check permission
  const canEdit = await canUserEditTask(req.session.userId, taskId);
  if (!canEdit) {
    return errorResponse('FORBIDDEN', 'No permission to edit this task', 403);
  }

  // Soft delete item
  await prisma.checklist.update({
    where: { id: itemId },
    data: { deletedAt: new Date() },
  });

  // Log history
  await prisma.history.create({
    data: {
      taskId,
      userId: req.session.userId,
      historyText: `ลบ "${existingItem.name}" จากรายการสิ่งที่ต้องทำ ของงาน "${task?.name}"`,
    },
  });

  // ✅ TASK OWNER NOTIFICATION: Notify task creator about checklist deletion
  if (task?.creatorUserId && task.creatorUserId !== req.session.userId) {
    await prisma.notification.create({
      data: {
        userId: task.creatorUserId,
        type: 'TASK_UPDATED',
        message: `${req.session.user.fullName} ลบรายการ "${existingItem.name}" จากงาน "${task.name}" ของคุณ`,
        taskId,
        triggeredByUserId: req.session.userId,
      },
    });
  }

  return successResponse({
    message: 'Checklist item deleted successfully',
    itemId,
  });
}

export const PATCH = withAuth(patchHandler);
export const DELETE = withAuth(deleteHandler);
