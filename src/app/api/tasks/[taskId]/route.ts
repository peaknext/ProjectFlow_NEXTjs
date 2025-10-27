/**
 * GET /api/tasks/:taskId
 * PATCH /api/tasks/:taskId
 * DELETE /api/tasks/:taskId
 * Single task operations
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
import { canUserViewTask, canUserEditTask, canUserDeleteTask } from '@/lib/permissions';

const updateTaskSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  assigneeUserId: z.string().nullable().optional(), // @deprecated - use assigneeUserIds
  assigneeUserIds: z.array(z.string()).optional(), // New: Support multiple assignees
  statusId: z.string().optional(),
  priority: z.number().int().min(1).max(4).optional(),
  startDate: z.string().nullable().optional(), // Accept both "YYYY-MM-DD" and ISO datetime
  dueDate: z.string().nullable().optional(),   // Accept both "YYYY-MM-DD" and ISO datetime
  difficulty: z.number().int().min(1).max(5).nullable().optional(),
});

/**
 * GET /api/tasks/:taskId
 * Get single task details
 */
async function getHandler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;

  const task = await prisma.task.findUnique({
    where: { id: taskId, deletedAt: null },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          department: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      assignee: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profileImageUrl: true,
          jobTitle: true,
        },
      },
      assignees: {
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              profileImageUrl: true,
              jobTitle: true,
            },
          },
        },
        orderBy: {
          assignedAt: 'asc',
        },
      },
      status: {
        select: {
          id: true,
          name: true,
          color: true,
          type: true,
        },
      },
      creator: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
      closedBy: {
        select: {
          id: true,
          fullName: true,
        },
      },
      parentTask: {
        select: {
          id: true,
          name: true,
        },
      },
      subtasks: {
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          isClosed: true,
          assignee: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      },
      checklists: {
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          isChecked: true,
        },
      },
      _count: {
        select: {
          comments: true,
        },
      },
    },
  });

  if (!task) {
    return errorResponse('TASK_NOT_FOUND', 'Task not found', 404);
  }

  // Check permission to view this task
  const canView = await canUserViewTask(req.session.userId, taskId);
  if (!canView) {
    return errorResponse('FORBIDDEN', 'You do not have permission to view this task', 403);
  }

  // Check if task is pinned by current user
  const currentUser = await prisma.user.findUnique({
    where: { id: req.session.userId },
    select: { pinnedTasks: true },
  });

  const pinnedTaskIds = (currentUser?.pinnedTasks as string[]) || [];
  const isPinned = pinnedTaskIds.includes(taskId);

  // Extract assignee user IDs from assignees relation
  const assigneeUserIds = task.assignees.map(a => a.userId);

  return successResponse({
    task: {
      ...task,
      assigneeUserIds, // Add array of assignee user IDs
      isPinned, // Add isPinned field
      startDate: task.startDate?.toISOString() || null,
      dueDate: task.dueDate?.toISOString() || null,
      closeDate: task.closeDate?.toISOString() || null,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    },
  });
}

/**
 * PATCH /api/tasks/:taskId
 * Update task
 */
async function patchHandler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;

    // Get existing task
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId, deletedAt: null },
      include: { project: true },
    });

    if (!existingTask) {
      return errorResponse('TASK_NOT_FOUND', 'Task not found', 404);
    }

    // Check permission
    const canEdit = await canUserEditTask(req.session.userId, taskId);
    if (!canEdit) {
      return errorResponse('FORBIDDEN', 'No permission to edit this task', 403);
    }

    const body = await req.json();
    const updates = updateTaskSchema.parse(body);

    // Track changes for activity log
    const changes: any = {
      before: {},
      after: {},
    };

    // Build update data and track changes
    const updateData: any = {};

    if (updates.name !== undefined) {
      updateData.name = updates.name;
      changes.before.name = existingTask.name;
      changes.after.name = updates.name;
    }

    if (updates.description !== undefined) {
      updateData.description = updates.description;
      changes.before.description = existingTask.description;
      changes.after.description = updates.description;
    }

    // Handle assignee updates (support both old single and new multi-assignee)
    if (updates.assigneeUserIds !== undefined || updates.assigneeUserId !== undefined) {
      // ✅ SECURITY: Check assignment permission
      const currentUser = await prisma.user.findUnique({
        where: { id: req.session.userId },
        select: { role: true },
      });

      const isCreator = existingTask.creatorUserId === req.session.userId;
      const isManagement = currentUser && ['ADMIN', 'CHIEF', 'LEADER', 'HEAD'].includes(currentUser.role);

      const currentAssignees = await prisma.taskAssignee.findMany({
        where: { taskId },
        select: { userId: true },
      });
      const isCurrentAssignee = existingTask.assigneeUserId === req.session.userId ||
        currentAssignees.some(a => a.userId === req.session.userId);

      // Only creator, management, or current assignee can assign/re-assign
      if (!isCreator && !isManagement && !isCurrentAssignee) {
        return errorResponse(
          'FORBIDDEN',
          'Only task creator, management roles, or current assignees can assign this task',
          403
        );
      }
    }

    // Handle assignee updates (support both old single and new multi-assignee)
    if (updates.assigneeUserIds !== undefined) {
      // New multi-assignee approach
      const currentAssignees = await prisma.taskAssignee.findMany({
        where: { taskId },
        select: { userId: true },
      });
      const currentAssigneeIds = currentAssignees.map(a => a.userId);

      changes.before.assigneeUserIds = currentAssigneeIds;
      changes.after.assigneeUserIds = updates.assigneeUserIds;

      // Calculate additions and removals
      const toAdd = updates.assigneeUserIds.filter(id => !currentAssigneeIds.includes(id));
      const toRemove = currentAssigneeIds.filter(id => !updates.assigneeUserIds.includes(id));

      // Remove old assignments
      if (toRemove.length > 0) {
        await prisma.taskAssignee.deleteMany({
          where: {
            taskId,
            userId: { in: toRemove },
          },
        });
      }

      // Add new assignments
      if (toAdd.length > 0) {
        await prisma.taskAssignee.createMany({
          data: toAdd.map(userId => ({
            taskId,
            userId,
            assignedBy: req.session.userId,
          })),
        });
      }

      // Update legacy assigneeUserId field (use first assignee for backward compatibility)
      updateData.assigneeUserId = updates.assigneeUserIds.length > 0 ? updates.assigneeUserIds[0] : null;
    } else if (updates.assigneeUserId !== undefined) {
      // Legacy single-assignee approach (backward compatibility)
      updateData.assigneeUserId = updates.assigneeUserId;
      changes.before.assigneeUserId = existingTask.assigneeUserId;
      changes.after.assigneeUserId = updates.assigneeUserId;

      // Sync with new TaskAssignee table
      await prisma.taskAssignee.deleteMany({ where: { taskId } });
      if (updates.assigneeUserId) {
        await prisma.taskAssignee.create({
          data: {
            taskId,
            userId: updates.assigneeUserId,
            assignedBy: req.session.userId,
          },
        });
      }
    }

    if (updates.statusId !== undefined) {
      // Validate status belongs to same project
      const status = await prisma.status.findUnique({
        where: { id: updates.statusId },
      });

      if (!status || status.projectId !== existingTask.projectId) {
        return errorResponse('INVALID_STATUS', 'Status does not belong to this project', 400);
      }

      updateData.statusId = updates.statusId;
      changes.before.statusId = existingTask.statusId;
      changes.after.statusId = updates.statusId;
    }

    if (updates.priority !== undefined) {
      updateData.priority = updates.priority;
      changes.before.priority = existingTask.priority;
      changes.after.priority = updates.priority;
    }

    if (updates.difficulty !== undefined) {
      updateData.difficulty = updates.difficulty;
      changes.before.difficulty = existingTask.difficulty;
      changes.after.difficulty = updates.difficulty;
    }

    if (updates.startDate !== undefined) {
      updateData.startDate = updates.startDate ? new Date(updates.startDate) : null;
      changes.before.startDate = existingTask.startDate;
      changes.after.startDate = updateData.startDate;
    }

    if (updates.dueDate !== undefined) {
      updateData.dueDate = updates.dueDate ? new Date(updates.dueDate) : null;
      changes.before.dueDate = existingTask.dueDate;
      changes.after.dueDate = updateData.dueDate;
    }

    // Update task
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        assignee: {
          select: {
            id: true,
            fullName: true,
            email: true,
            profileImageUrl: true,
          },
        },
        status: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    // Log history for changes
    const historyEntries: Array<{ taskId: string; userId: string; historyText: string }> = [];

    // Task name changed
    if (updates.name && changes.before.name !== changes.after.name) {
      historyEntries.push({
        taskId,
        userId: req.session.userId,
        historyText: `แก้ไขชื่องาน "${changes.before.name}" เป็น "${changes.after.name}"`,
      });
    }

    // Description changed
    if (updates.description !== undefined && changes.before.description !== changes.after.description) {
      historyEntries.push({
        taskId,
        userId: req.session.userId,
        historyText: `แก้ไขรายละเอียดงาน "${updatedTask.name}"`,
      });
    }

    // Status changed
    if (updates.statusId && changes.before.statusId !== changes.after.statusId) {
      const statusBefore = await prisma.status.findUnique({
        where: { id: changes.before.statusId },
        select: { name: true },
      });
      const statusAfter = await prisma.status.findUnique({
        where: { id: changes.after.statusId },
        select: { name: true },
      });

      historyEntries.push({
        taskId,
        userId: req.session.userId,
        historyText: `เปลี่ยนสถานะงาน "${updatedTask.name}" จาก "${statusBefore?.name}" เป็น "${statusAfter?.name}"`,
      });
    }

    // Assignee changed (multi-assignee support)
    if (updates.assigneeUserIds !== undefined && changes.before.assigneeUserIds && changes.after.assigneeUserIds) {
      const beforeIds = changes.before.assigneeUserIds;
      const afterIds = changes.after.assigneeUserIds;

      const added = afterIds.filter((id: string) => !beforeIds.includes(id));
      const removed = beforeIds.filter((id: string) => !afterIds.includes(id));

      // Log additions
      if (added.length > 0) {
        const addedUsers = await prisma.user.findMany({
          where: { id: { in: added } },
          select: { fullName: true },
        });
        const names = addedUsers.map(u => u.fullName).join(', ');
        historyEntries.push({
          taskId,
          userId: req.session.userId,
          historyText: `มอบหมายงาน "${updatedTask.name}" ให้กับ ${names}`,
        });

        // Create notifications for newly assigned users
        const currentUserFullName = req.session.user.fullName;
        const notificationData = added
          .filter((userId: string) => userId !== req.session.userId) // Don't notify self
          .map((userId: string) => ({
            userId,
            type: 'TASK_ASSIGNED',
            message: `${currentUserFullName} ได้มอบหมายงาน "${updatedTask.name}" ให้กับคุณ`,
            taskId,
            triggeredByUserId: req.session.userId,
          }));

        // ✅ TASK OWNER NOTIFICATION: Notify task creator about assignment
        const taskCreatorId = existingTask.creatorUserId;
        if (
          taskCreatorId &&
          taskCreatorId !== req.session.userId && // Owner is not the one assigning
          !added.includes(taskCreatorId) // Owner is not in the newly assigned list (avoid duplicate)
        ) {
          const assigneeNames = await prisma.user.findMany({
            where: { id: { in: added } },
            select: { fullName: true },
          });
          const names = assigneeNames.map(u => u.fullName).join(', ');
          notificationData.push({
            userId: taskCreatorId,
            type: 'TASK_ASSIGNED',
            message: `${currentUserFullName} ได้มอบหมายงาน "${updatedTask.name}" ของคุณให้กับ ${names}`,
            taskId,
            triggeredByUserId: req.session.userId,
          });
        }

        if (notificationData.length > 0) {
          await prisma.notification.createMany({
            data: notificationData,
          });
        }
      }

      // Log removals
      if (removed.length > 0) {
        const removedUsers = await prisma.user.findMany({
          where: { id: { in: removed } },
          select: { fullName: true },
        });
        const names = removedUsers.map(u => u.fullName).join(', ');
        historyEntries.push({
          taskId,
          userId: req.session.userId,
          historyText: `ยกเลิกการมอบหมายงาน "${updatedTask.name}" ของ ${names}`,
        });
      }
    } else if (updates.assigneeUserId !== undefined && changes.before.assigneeUserId !== changes.after.assigneeUserId) {
      // Legacy single-assignee logging (backward compatibility)
      const assigneeBefore = changes.before.assigneeUserId
        ? await prisma.user.findUnique({
            where: { id: changes.before.assigneeUserId },
            select: { fullName: true },
          })
        : null;
      const assigneeAfter = changes.after.assigneeUserId
        ? await prisma.user.findUnique({
            where: { id: changes.after.assigneeUserId },
            select: { fullName: true },
          })
        : null;

      if (!assigneeBefore && assigneeAfter) {
        historyEntries.push({
          taskId,
          userId: req.session.userId,
          historyText: `มอบหมายงาน "${updatedTask.name}" ให้กับ ${assigneeAfter.fullName}`,
        });

        // Create notification for newly assigned user (legacy single-assignee)
        if (changes.after.assigneeUserId && changes.after.assigneeUserId !== req.session.userId) {
          await prisma.notification.create({
            data: {
              userId: changes.after.assigneeUserId,
              type: 'TASK_ASSIGNED',
              message: `${req.session.user.fullName} ได้มอบหมายงาน "${updatedTask.name}" ให้กับคุณ`,
              taskId,
              triggeredByUserId: req.session.userId,
            },
          });
        }

        // ✅ TASK OWNER NOTIFICATION: Notify task creator about assignment (legacy)
        const taskCreatorId = existingTask.creatorUserId;
        if (
          taskCreatorId &&
          taskCreatorId !== req.session.userId && // Owner is not the one assigning
          taskCreatorId !== changes.after.assigneeUserId // Owner is not the newly assigned user (avoid duplicate)
        ) {
          await prisma.notification.create({
            data: {
              userId: taskCreatorId,
              type: 'TASK_ASSIGNED',
              message: `${req.session.user.fullName} ได้มอบหมายงาน "${updatedTask.name}" ของคุณให้กับ ${assigneeAfter?.fullName}`,
              taskId,
              triggeredByUserId: req.session.userId,
            },
          });
        }
      } else if (assigneeBefore && !assigneeAfter) {
        historyEntries.push({
          taskId,
          userId: req.session.userId,
          historyText: `ยกเลิกการมอบหมายงาน "${updatedTask.name}" ให้กับ ${assigneeBefore.fullName}`,
        });
      } else if (assigneeBefore && assigneeAfter) {
        historyEntries.push({
          taskId,
          userId: req.session.userId,
          historyText: `ยกเลิกการมอบหมายงาน "${updatedTask.name}" ให้กับ ${assigneeBefore.fullName} และมอบหมายให้กับ ${assigneeAfter.fullName}`,
        });

        // Create notification for newly assigned user (reassignment case)
        if (changes.after.assigneeUserId && changes.after.assigneeUserId !== req.session.userId) {
          await prisma.notification.create({
            data: {
              userId: changes.after.assigneeUserId,
              type: 'TASK_ASSIGNED',
              message: `${req.session.user.fullName} ได้มอบหมายงาน "${updatedTask.name}" ให้กับคุณ`,
              taskId,
              triggeredByUserId: req.session.userId,
            },
          });
        }

        // ✅ TASK OWNER NOTIFICATION: Notify task creator about reassignment (legacy)
        const taskCreatorId = existingTask.creatorUserId;
        if (
          taskCreatorId &&
          taskCreatorId !== req.session.userId && // Owner is not the one reassigning
          taskCreatorId !== changes.after.assigneeUserId // Owner is not the newly assigned user (avoid duplicate)
        ) {
          await prisma.notification.create({
            data: {
              userId: taskCreatorId,
              type: 'TASK_ASSIGNED',
              message: `${req.session.user.fullName} ได้มอบหมายงาน "${updatedTask.name}" ของคุณให้กับ ${assigneeAfter?.fullName}`,
              taskId,
              triggeredByUserId: req.session.userId,
            },
          });
        }
      }
    }

    // Priority changed
    if (updates.priority !== undefined && changes.before.priority !== changes.after.priority) {
      const priorityLabels: Record<number, string> = {
        1: 'ด่วนที่สุด',
        2: 'ด่วน',
        3: 'ปานกลาง',
        4: 'ไม่ด่วน',
      };
      historyEntries.push({
        taskId,
        userId: req.session.userId,
        historyText: `เปลี่ยนความเร่งด่วนของงาน "${updatedTask.name}" เป็น ${priorityLabels[changes.after.priority]}`,
      });
    }

    // Difficulty changed
    if (updates.difficulty !== undefined && changes.before.difficulty !== changes.after.difficulty) {
      const difficultyLabels: Record<number, string> = {
        1: 'ง่าย',
        2: 'ปานกลาง',
        3: 'ยาก',
        4: 'ยากมาก',
      };
      historyEntries.push({
        taskId,
        userId: req.session.userId,
        historyText: `เปลี่ยนระดับความยากของงาน "${updatedTask.name}" เป็น ${difficultyLabels[changes.after.difficulty!]}`,
      });
    }

    // Start date changed
    if (updates.startDate !== undefined) {
      const dateBefore = changes.before.startDate;
      const dateAfter = changes.after.startDate;

      if (!dateBefore && dateAfter) {
        const formattedDate = new Date(dateAfter).toLocaleDateString('th-TH', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        historyEntries.push({
          taskId,
          userId: req.session.userId,
          historyText: `เปลี่ยนวันเริ่มต้นของงาน "${updatedTask.name}" เป็น ${formattedDate}`,
        });
      } else if (dateBefore && !dateAfter) {
        historyEntries.push({
          taskId,
          userId: req.session.userId,
          historyText: `ลบวันเริ่มต้นของงาน "${updatedTask.name}"`,
        });
      } else if (dateBefore && dateAfter && new Date(dateBefore).getTime() !== new Date(dateAfter).getTime()) {
        const formattedDate = new Date(dateAfter).toLocaleDateString('th-TH', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        historyEntries.push({
          taskId,
          userId: req.session.userId,
          historyText: `เปลี่ยนวันเริ่มต้นของงาน "${updatedTask.name}" เป็น ${formattedDate}`,
        });
      }
    }

    // Due date changed
    if (updates.dueDate !== undefined) {
      const dateBefore = changes.before.dueDate;
      const dateAfter = changes.after.dueDate;

      if (!dateBefore && dateAfter) {
        const formattedDate = new Date(dateAfter).toLocaleDateString('th-TH', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        historyEntries.push({
          taskId,
          userId: req.session.userId,
          historyText: `เปลี่ยนวันครบกำหนดของงาน "${updatedTask.name}" เป็น ${formattedDate}`,
        });
      } else if (dateBefore && !dateAfter) {
        historyEntries.push({
          taskId,
          userId: req.session.userId,
          historyText: `ลบวันครบกำหนดของงาน "${updatedTask.name}"`,
        });
      } else if (dateBefore && dateAfter && new Date(dateBefore).getTime() !== new Date(dateAfter).getTime()) {
        const formattedDate = new Date(dateAfter).toLocaleDateString('th-TH', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        historyEntries.push({
          taskId,
          userId: req.session.userId,
          historyText: `เปลี่ยนวันครบกำหนดของงาน "${updatedTask.name}" เป็น ${formattedDate}`,
        });
      }
    }

    // Bulk create all history entries
    if (historyEntries.length > 0) {
      await prisma.history.createMany({
        data: historyEntries,
      });
    }

    // NOTE: Notification creation for task assignment is handled in the assignee tracking section above
    // (lines 406-422 for multi-assignee, lines 462-470 and 487-495 for legacy single-assignee)
    // Removed duplicate notification creation to fix bug where users received 2 notifications:
    // 1. "ชื่อผู้ใช้ ได้มอบหมายงาน ... ให้กับคุณ" (from history logging section)
    // 2. "คุณได้รับมอบหมายงาน: ..." (from this section - now removed)

    // ✅ TASK OWNER NOTIFICATION: Notify task creator about non-assignment updates
    const taskCreatorId = existingTask.creatorUserId;
    const hasNonAssignmentChanges =
      updates.name !== undefined ||
      updates.description !== undefined ||
      updates.statusId !== undefined ||
      updates.priority !== undefined ||
      updates.difficulty !== undefined ||
      updates.startDate !== undefined ||
      updates.dueDate !== undefined;

    if (
      taskCreatorId &&
      taskCreatorId !== req.session.userId && // Owner is not the one updating
      hasNonAssignmentChanges // Only for non-assignment changes (assignment has its own notification)
    ) {
      await prisma.notification.create({
        data: {
          userId: taskCreatorId,
          type: 'TASK_UPDATED',
          message: `${req.session.user.fullName} ได้อัปเดตงาน "${updatedTask.name}" ของคุณ`,
          taskId,
          triggeredByUserId: req.session.userId,
        },
      });
    }

    return successResponse({
      task: {
        ...updatedTask,
        startDate: updatedTask.startDate?.toISOString() || null,
        dueDate: updatedTask.dueDate?.toISOString() || null,
      },
      message: 'Task updated successfully',
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/tasks/:taskId
 * Soft delete task
 */
async function deleteHandler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;

  // Get existing task
  const existingTask = await prisma.task.findUnique({
    where: { id: taskId, deletedAt: null },
    include: {
      _count: {
        select: {
          subtasks: { where: { deletedAt: null } },
        },
      },
    },
  });

  if (!existingTask) {
    return errorResponse('TASK_NOT_FOUND', 'Task not found', 404);
  }

  // Check permission
  const canDelete = await canUserDeleteTask(req.session.userId, taskId);
  if (!canDelete) {
    return errorResponse('FORBIDDEN', 'No permission to delete this task', 403);
  }

  // Warn if task has subtasks
  if (existingTask._count.subtasks > 0) {
    return errorResponse(
      'TASK_HAS_SUBTASKS',
      `Task has ${existingTask._count.subtasks} subtasks. Please delete or reassign subtasks first.`,
      400
    );
  }

  // Soft delete
  await prisma.task.update({
    where: { id: taskId },
    data: { deletedAt: new Date() },
  });

  // Log history
  await prisma.history.create({
    data: {
      taskId,
      userId: req.session.userId,
      historyText: `ลบงาน: ${existingTask.name}`,
    },
  });

  return successResponse({
    message: 'Task deleted successfully',
    taskId,
  });
}

export const GET = withAuth(getHandler);
export const PATCH = withAuth(patchHandler);
export const DELETE = withAuth(deleteHandler);
