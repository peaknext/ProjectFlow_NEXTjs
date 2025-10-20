/**
 * GET /api/tasks
 * Get all tasks (with filters and pagination)
 */

import { NextRequest } from 'next/server';
import { withAuth, type AuthenticatedRequest } from '@/lib/api-middleware';
import { successResponse } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { checkPermission } from '@/lib/permissions';

async function handler(req: AuthenticatedRequest) {
  const { searchParams } = new URL(req.url);

  // Get query parameters
  const projectId = searchParams.get('projectId');
  const status = searchParams.get('status');
  const assigneeId = searchParams.get('assigneeId');
  const priority = searchParams.get('priority');
  const isClosed = searchParams.get('isClosed');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  // Build where clause
  const where: any = {
    deletedAt: null,
  };

  if (projectId) {
    // Check if user has access to project
    const hasAccess = await checkPermission(req.session.userId, 'view_tasks', {
      projectId,
    });

    if (!hasAccess) {
      return successResponse({ tasks: [], total: 0 }, 403);
    }

    where.projectId = projectId;
  }

  if (status) {
    where.statusId = status;
  }

  if (assigneeId) {
    where.assigneeUserId = assigneeId;
  }

  if (priority) {
    where.priority = parseInt(priority);
  }

  if (isClosed !== null) {
    where.isClosed = isClosed === 'true';
  }

  // Get tasks
  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: {
        assignee: {
          select: {
            id: true,
            fullName: true,
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
        project: {
          select: {
            id: true,
            name: true,
            color: true,
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
            comments: true,
            subtasks: true,
            checklists: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    }),
    prisma.task.count({ where }),
  ]);

  // Transform response
  const transformedTasks = tasks.map((task) => ({
    ...task,
    commentCount: task._count.comments,
    subtaskCount: task._count.subtasks,
    checklistCount: task._count.checklists,
    _count: undefined,
  }));

  return successResponse({
    tasks: transformedTasks,
    total,
    limit,
    offset,
  });
}

export const GET = withAuth(handler);
