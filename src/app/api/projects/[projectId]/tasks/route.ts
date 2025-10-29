/**
 * GET /api/projects/:projectId/tasks
 * POST /api/projects/:projectId/tasks
 * Tasks management (scoped to project)
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
import { checkPermission } from '@/lib/permissions';
import { buildFiscalYearFilter } from '@/lib/fiscal-year';

const createTaskSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().optional().nullable(),
  assigneeUserId: z.string().optional().nullable(), // Legacy single assignee
  assigneeUserIds: z.array(z.string()).optional().nullable(), // New multi-assignee support
  statusId: z.string().min(1, 'Status ID is required'),
  priority: z.number().int().min(1).max(4).default(3),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Expected YYYY-MM-DD').optional().nullable(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Expected YYYY-MM-DD').optional().nullable(),
  difficulty: z.number().int().min(1).max(5).optional().nullable(),
  parentTaskId: z.string().optional().nullable(),
});

/**
 * GET /api/projects/:projectId/tasks
 * List all tasks in project
 */
async function getHandler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const { searchParams } = new URL(req.url);

  const statusId = searchParams.get('statusId') || undefined;
  const assigneeUserId = searchParams.get('assigneeUserId') || undefined;
  const isClosed = searchParams.get('isClosed');
  const parentTaskId = searchParams.get('parentTaskId') || undefined;
  const fiscalYearsParam = searchParams.get('fiscalYears');

  // Parse fiscal years: "2567,2568" → [2567, 2568]
  const fiscalYears = fiscalYearsParam
    ? fiscalYearsParam.split(',').map(Number).filter(n => !isNaN(n))
    : [];

  // Check permission
  const hasAccess = await checkPermission(
    req.session.userId,
    'view_tasks',
    { projectId }
  );

  if (!hasAccess) {
    return errorResponse('FORBIDDEN', 'No access to this project', 403);
  }

  // Build where clause
  const where: any = {
    projectId,
    deletedAt: null,
    ...buildFiscalYearFilter(fiscalYears),
  };

  if (statusId) where.statusId = statusId;
  if (assigneeUserId) where.assigneeUserId = assigneeUserId;
  if (isClosed !== null) where.isClosed = isClosed === 'true';
  if (parentTaskId) where.parentTaskId = parentTaskId;

  const tasks = await prisma.task.findMany({
    where,
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
          type: true,
        },
      },
      creator: {
        select: {
          id: true,
          fullName: true,
        },
      },
      _count: {
        select: {
          subtasks: true,
          comments: true,
          checklists: true,
        },
      },
    },
    orderBy: [
      { isClosed: 'asc' },
      { priority: 'asc' },
      { createdAt: 'desc' },
    ],
  });

  return successResponse({
    tasks: tasks.map((task) => ({
      ...task,
      startDate: task.startDate?.toISOString() || null,
      dueDate: task.dueDate?.toISOString() || null,
      createdAt: task.createdAt.toISOString(),
    })),
    total: tasks.length,
  });
}

/**
 * POST /api/projects/:projectId/tasks
 * Create new task
 */
async function postHandler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;


    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId, dateDeleted: null },
    });

    if (!project) {
      console.error('[POST /api/projects/:projectId/tasks] Project not found:', projectId);
      return errorResponse('PROJECT_NOT_FOUND', 'Project not found', 404);
    }


    // Check permission
    const hasAccess = await checkPermission(
      req.session.userId,
      'create_tasks',
      { projectId }
    );

    if (!hasAccess) {
      console.error('[POST /api/projects/:projectId/tasks] No permission for user:', req.session.userId);
      return errorResponse('FORBIDDEN', 'No permission to create tasks', 403);
    }


    const body = await req.json();

    const data = createTaskSchema.parse(body);

    // Determine assignees: use array if provided, otherwise fallback to single assignee
    const assigneeUserIds = data.assigneeUserIds && data.assigneeUserIds.length > 0
      ? data.assigneeUserIds
      : (data.assigneeUserId ? [data.assigneeUserId] : []);

    // For backward compatibility: store first assignee in legacy assigneeUserId field
    const assigneeUserId = assigneeUserIds[0] || null;

    // Validate status belongs to project
    const status = await prisma.status.findUnique({
      where: { id: data.statusId },
    });

    if (!status || status.projectId !== projectId) {
      return errorResponse('INVALID_STATUS', 'Status does not belong to this project', 400);
    }

    // Validate all assignees exist
    if (assigneeUserIds.length > 0) {
      const assignees = await prisma.user.findMany({
        where: { id: { in: assigneeUserIds } },
      });

      if (assignees.length !== assigneeUserIds.length) {
        return errorResponse('USER_NOT_FOUND', 'One or more assignee users not found', 404);
      }
    }

    // Validate parent task exists and belongs to same project
    if (data.parentTaskId) {
      const parentTask = await prisma.task.findUnique({
        where: { id: data.parentTaskId },
      });

      if (!parentTask || parentTask.projectId !== projectId) {
        return errorResponse('INVALID_PARENT_TASK', 'Parent task not found or does not belong to this project', 400);
      }
    }

    // Create task with assignees in a transaction

    const task = await prisma.$transaction(async (tx) => {
      // Create task
      const newTask = await tx.task.create({
        data: {
          name: data.name,
          description: data.description || null,
          projectId,
          assigneeUserId: assigneeUserId, // Legacy field (stores first assignee)
          statusId: data.statusId,
          priority: data.priority,
          startDate: data.startDate ? new Date(data.startDate) : null,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          difficulty: data.difficulty || null,
          parentTaskId: data.parentTaskId || null,
          creatorUserId: req.session.userId,
        },
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

      // Create task_assignees records for all assignees
      if (assigneeUserIds.length > 0) {
        await tx.taskAssignee.createMany({
          data: assigneeUserIds.map((userId) => ({
            taskId: newTask.id,
            userId: userId,
            assignedBy: req.session.userId,
          })),
        });
      }

      // Create history log
      await tx.history.create({
        data: {
          taskId: newTask.id,
          userId: req.session.userId,
          historyText: `สร้างงาน "${newTask.name}"`,
        },
      });

      // Send notifications to all assignees (except creator)
      const notificationData = assigneeUserIds
        .filter((userId) => userId !== req.session.userId)
        .map((userId) => ({
          userId: userId,
          type: 'TASK_ASSIGNED' as const,
          message: `คุณได้รับมอบหมายงาน: ${newTask.name}`,
          taskId: newTask.id,
          triggeredByUserId: req.session.userId,
        }));

      if (notificationData.length > 0) {
        await tx.notification.createMany({
          data: notificationData,
        });
      }

      // Fetch assignees array for response
      const taskAssignees = await tx.taskAssignee.findMany({
        where: { taskId: newTask.id },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              profileImageUrl: true,
            },
          },
        },
      });

      return {
        ...newTask,
        assignees: taskAssignees.map((ta) => ta.user),
        assigneeUserIds: taskAssignees.map((ta) => ta.userId),
      };
    });

    return successResponse(
      {
        task: {
          ...task,
          startDate: task.startDate?.toISOString() || null,
          dueDate: task.dueDate?.toISOString() || null,
          createdAt: task.createdAt.toISOString(),
        },
        message: 'Task created successfully',
      },
      201
    );
  } catch (error) {
    console.error('[POST /api/projects/:projectId/tasks] Error occurred:', error);
    if (error instanceof Error) {
      console.error('[POST /api/projects/:projectId/tasks] Error message:', error.message);
      console.error('[POST /api/projects/:projectId/tasks] Error stack:', error.stack);
    }
    return handleApiError(error);
  }
}

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);
