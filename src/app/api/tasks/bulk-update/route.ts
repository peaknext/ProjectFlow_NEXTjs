import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth, AuthenticatedRequest } from "@/lib/api-middleware";
import { successResponse, errorResponse } from "@/lib/api-response";
import { checkPermission } from "@/lib/permissions";

/**
 * POST /api/tasks/bulk-update
 *
 * Update multiple tasks at once
 *
 * Request Body:
 * {
 *   taskIds: string[],
 *   updates: {
 *     statusId?: string,
 *     priority?: 1 | 2 | 3 | 4,
 *     assigneeUserIds?: string[],
 *     dueDate?: string,
 *   }
 * }
 */
async function handler(req: AuthenticatedRequest) {
  try {
    const body = await req.json();
    const { taskIds, updates } = body;

    // Validate input
    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return errorResponse("BAD_REQUEST", "taskIds array is required", 400);
    }

    if (!updates || typeof updates !== "object") {
      return errorResponse("BAD_REQUEST", "updates object is required", 400);
    }

    // Limit to 100 tasks at once
    if (taskIds.length > 100) {
      return errorResponse(
        "BAD_REQUEST",
        "Cannot update more than 100 tasks at once",
        400
      );
    }

    // 1. Get all tasks and check permissions
    const tasks = await prisma.task.findMany({
      where: {
        id: { in: taskIds },
        deletedAt: null,
      },
      include: {
        project: true,
      },
    });

    if (tasks.length === 0) {
      return errorResponse("NOT_FOUND", "No tasks found", 404);
    }

    // 2. Check permissions for each task
    const unauthorizedTasks: string[] = [];
    for (const task of tasks) {
      const hasAccess = await checkPermission(
        req.session.userId,
        "edit_tasks",
        {
          projectId: task.projectId,
          taskId: task.id,
        }
      );

      if (!hasAccess) {
        unauthorizedTasks.push(task.id);
      }
    }

    if (unauthorizedTasks.length > 0) {
      return errorResponse(
        "FORBIDDEN",
        `No permission to update ${unauthorizedTasks.length} task(s)`,
        403,
        { unauthorizedTasks }
      );
    }

    // 3. Validate updates
    const updateData: any = {};

    if (updates.statusId) {
      // Verify status exists
      const status = await prisma.status.findUnique({
        where: { id: updates.statusId },
      });
      if (!status) {
        return errorResponse("BAD_REQUEST", "Invalid statusId", 400);
      }
      updateData.statusId = updates.statusId;
    }

    if (updates.priority) {
      if (![1, 2, 3, 4].includes(updates.priority)) {
        return errorResponse(
          "BAD_REQUEST",
          "Priority must be 1, 2, 3, or 4",
          400
        );
      }
      updateData.priority = updates.priority;
    }

    if (updates.assigneeUserIds) {
      // Verify all users exist
      const users = await prisma.user.findMany({
        where: { id: { in: updates.assigneeUserIds } },
      });
      if (users.length !== updates.assigneeUserIds.length) {
        return errorResponse("BAD_REQUEST", "Invalid assigneeUserIds", 400);
      }
      // Note: assigneeUserIds will be handled separately via TaskAssignee table
    }

    if (updates.dueDate) {
      updateData.dueDate = new Date(updates.dueDate);
    }

    // 4. Update all tasks in a transaction
    const updatedTasks = await prisma.$transaction(
      taskIds.map((taskId) =>
        prisma.task.update({
          where: { id: taskId },
          data: {
            ...updateData,
            updatedAt: new Date(),
          },
          include: {
            assignees: {
              include: {
                user: {
                  select: {
                    id: true,
                    fullName: true,
                    profileImageUrl: true,
                  },
                },
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
          },
        })
      )
    );

    // 5. Create history records for each task
    const historyRecords = updatedTasks.map((task) => {
      let historyText = `อัปเดตงานแบบกลุ่ม: `;
      const changes: string[] = [];

      if (updates.statusId) {
        changes.push(`เปลี่ยนสถานะเป็น ${task.status.name}`);
      }
      if (updates.priority) {
        const priorityText = ["ด่วนที่สุด", "สำคัญ", "ปกติ", "ต่ำ"][
          updates.priority - 1
        ];
        changes.push(`เปลี่ยนความสำคัญเป็น ${priorityText}`);
      }
      if (updates.assigneeUserIds) {
        const assigneeNames = task.assignees.map(a => a.user.fullName).join(', ') || "ไม่มี";
        changes.push(`มอบหมายให้ ${assigneeNames}`);
      }
      if (updates.dueDate) {
        changes.push(`เปลี่ยนกำหนดส่ง`);
      }

      historyText += changes.join(", ");

      return prisma.history.create({
        data: {
          taskId: task.id,
          userId: req.session.userId,
          historyText,
        },
      });
    });

    await prisma.$transaction(historyRecords);

    // 6. Return success response
    return successResponse({
      updated: updatedTasks.length,
      failed: taskIds.length - updatedTasks.length,
      tasks: updatedTasks.map((task) => ({
        id: task.id,
        name: task.name,
        status: task.status,
        priority: task.priority,
        assignees: task.assignees.map((ta) => ta.user),
        assigneeUserIds: task.assignees.map((ta) => ta.userId),
        dueDate: task.dueDate?.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error in bulk update:", error);
    return errorResponse("INTERNAL_ERROR", "Failed to update tasks", 500);
  }
}

export const POST = withAuth(handler);
