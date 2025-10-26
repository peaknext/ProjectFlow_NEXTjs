/**
 * POST /api/batch
 * Batch operations endpoint (PERFORMANCE CRITICAL)
 * Supports multiple operation types in a single transaction
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

// Operation schemas
const updateTaskFieldSchema = z.object({
  type: z.literal('UPDATE_TASK_FIELD'),
  taskId: z.string(),
  field: z.enum(['name', 'description', 'priority', 'difficulty', 'dueDate', 'startDate']),
  value: z.any(),
});

const updateTaskStatusSchema = z.object({
  type: z.literal('UPDATE_TASK_STATUS'),
  taskId: z.string(),
  statusId: z.string(),
});

const updateChecklistStatusSchema = z.object({
  type: z.literal('UPDATE_CHECKLIST_STATUS'),
  itemId: z.string(),
  isChecked: z.boolean(),
});

const addChecklistItemSchema = z.object({
  type: z.literal('ADD_CHECKLIST_ITEM'),
  taskId: z.string(),
  name: z.string().min(1).max(255),
  order: z.number().int().optional(),
});

const updateTaskAssigneeSchema = z.object({
  type: z.literal('UPDATE_TASK_ASSIGNEE'),
  taskId: z.string(),
  assigneeUserId: z.string().nullable(),
});

const batchOperationSchema = z.object({
  operations: z.array(
    z.discriminatedUnion('type', [
      updateTaskFieldSchema,
      updateTaskStatusSchema,
      updateChecklistStatusSchema,
      addChecklistItemSchema,
      updateTaskAssigneeSchema,
    ])
  ).min(1).max(100), // Limit to 100 operations per batch
});

type BatchOperation = z.infer<typeof batchOperationSchema>['operations'][number];

/**
 * POST /api/batch
 * Execute multiple operations in a single transaction
 *
 * Supported operations:
 * - UPDATE_TASK_FIELD: Update task fields (name, description, priority, etc.)
 * - UPDATE_TASK_STATUS: Change task status
 * - UPDATE_TASK_ASSIGNEE: Change task assignee
 * - UPDATE_CHECKLIST_STATUS: Toggle checklist item
 * - ADD_CHECKLIST_ITEM: Add new checklist item
 */
async function handler(req: AuthenticatedRequest) {
  try {
    const body = await req.json();
    const { operations } = batchOperationSchema.parse(body);

    const results: any[] = [];
    const errors: any[] = [];

    // Process all operations in a transaction
    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < operations.length; i++) {
        const op = operations[i];

        try {
          let result: any = null;
          let historyLog: any = null;

          switch (op.type) {
            case 'UPDATE_TASK_FIELD': {
              // Check permission
              const canEdit = await canUserEditTask(req.session.userId, op.taskId);
              if (!canEdit) {
                throw new Error('No permission to edit this task');
              }

              // Get old value for activity log
              const oldTask = await tx.task.findUnique({
                where: { id: op.taskId, deletedAt: null },
                select: { [op.field]: true },
              });

              if (!oldTask) {
                throw new Error('Task not found');
              }

              // Update field
              result = await tx.task.update({
                where: { id: op.taskId },
                data: { [op.field]: op.value },
              });

              // Log activity
              historyLog = await tx.history.create({
                data: {
                  taskId: op.taskId,
                  userId: req.session.userId,
                  historyText: `อัพเดต ${op.field} จาก "${oldTask[op.field]}" เป็น "${op.value}"`,
                },
              });

              break;
            }

            case 'UPDATE_TASK_STATUS': {
              // Check permission
              const canEdit = await canUserEditTask(req.session.userId, op.taskId);
              if (!canEdit) {
                throw new Error('No permission to edit this task');
              }

              // Verify status exists
              const status = await tx.status.findUnique({
                where: { id: op.statusId, deletedAt: null },
                select: { name: true },
              });

              if (!status) {
                throw new Error('Status not found');
              }

              // Update status
              result = await tx.task.update({
                where: { id: op.taskId },
                data: { statusId: op.statusId },
              });

              // Log activity
              historyLog = await tx.history.create({
                data: {
                  taskId: op.taskId,
                  userId: req.session.userId,
                  historyText: `เปลี่ยนสถานะเป็น "${status.name}"`,
                },
              });

              break;
            }

            case 'UPDATE_TASK_ASSIGNEE': {
              // Check permission
              const canEdit = await canUserEditTask(req.session.userId, op.taskId);
              if (!canEdit) {
                throw new Error('No permission to edit this task');
              }

              // Verify assignee exists if provided
              if (op.assigneeUserId) {
                const assignee = await tx.user.findUnique({
                  where: { id: op.assigneeUserId, deletedAt: null },
                  select: { fullName: true },
                });

                if (!assignee) {
                  throw new Error('Assignee not found');
                }
              }

              // Update assignee
              result = await tx.task.update({
                where: { id: op.taskId },
                data: { assigneeUserId: op.assigneeUserId },
              });

              // Create notification if assignee changed
              if (op.assigneeUserId) {
                await tx.notification.create({
                  data: {
                    userId: op.assigneeUserId,
                    triggeredByUserId: req.session.userId,
                    type: 'TASK_ASSIGNED',
                    message: `คุณได้รับมอบหมายงาน: ${result.name}`,
                    taskId: op.taskId,
                  },
                });
              }

              // Log activity
              historyLog = await tx.history.create({
                data: {
                  taskId: op.taskId,
                  userId: req.session.userId,
                  historyText: op.assigneeUserId
                    ? 'เปลี่ยนผู้รับผิดชอบ'
                    : 'ลบผู้รับผิดชอบออก',
                },
              });

              break;
            }

            case 'UPDATE_CHECKLIST_STATUS': {
              // Get checklist item to find task
              const item = await tx.checklist.findUnique({
                where: { id: op.itemId, deletedAt: null },
                select: { taskId: true },
              });

              if (!item) {
                throw new Error('Checklist item not found');
              }

              // Check permission
              const canEdit = await canUserEditTask(req.session.userId, item.taskId);
              if (!canEdit) {
                throw new Error('No permission to edit this task');
              }

              // Update checklist status
              result = await tx.checklist.update({
                where: { id: op.itemId },
                data: { isChecked: op.isChecked },
              });

              // Log activity
              historyLog = await tx.history.create({
                data: {
                  taskId: item.taskId,
                  userId: req.session.userId,
                  historyText: op.isChecked
                    ? `เช็ครายการ: ${result.name}`
                    : `ยกเลิกการเช็ครายการ: ${result.name}`,
                },
              });

              break;
            }

            case 'ADD_CHECKLIST_ITEM': {
              // Check permission
              const canEdit = await canUserEditTask(req.session.userId, op.taskId);
              if (!canEdit) {
                throw new Error('No permission to edit this task');
              }

              // Get max order if not specified
              let order = op.order;
              if (order === undefined) {
                const maxOrderItem = await tx.checklist.findFirst({
                  where: { taskId: op.taskId, deletedAt: null },
                  orderBy: { createdDate: 'desc' },
                  select: { createdDate: true },
                });
                // Simple auto-increment based on count
                const count = await tx.checklist.count({
                  where: { taskId: op.taskId, deletedAt: null },
                });
                order = count + 1;
              }

              // Create checklist item
              result = await tx.checklist.create({
                data: {
                  taskId: op.taskId,
                  name: op.name,
                  creatorUserId: req.session.userId,
                  isChecked: false,
                },
              });

              // Log activity
              historyLog = await tx.history.create({
                data: {
                  taskId: op.taskId,
                  userId: req.session.userId,
                  historyText: `เพิ่มรายการ: ${op.name}`,
                },
              });

              break;
            }
          }

          results.push({
            index: i,
            success: true,
            operation: op.type,
            data: result,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';

          errors.push({
            index: i,
            success: false,
            operation: op.type,
            error: errorMessage,
          });

          // Continue processing other operations instead of failing entire batch
          results.push({
            index: i,
            success: false,
            operation: op.type,
            error: errorMessage,
          });
        }
      }
    });

    const successCount = results.filter((r) => r.success).length;
    const errorCount = errors.length;

    return successResponse({
      results,
      summary: {
        total: operations.length,
        successful: successCount,
        failed: errorCount,
      },
      message: `Processed ${operations.length} operations: ${successCount} successful, ${errorCount} failed`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export const POST = withAuth(handler);
