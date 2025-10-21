/**
 * GET /api/projects/:projectId/board
 * Get complete project board data (PERFORMANCE CRITICAL)
 *
 * This endpoint fetches all data needed for the project board in ONE query:
 * - Project details
 * - All statuses
 * - All tasks with assignees, subtasks, comments, checklists
 *
 * This mimics the GAS getProjectBoardData() function
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/api-middleware';
import type { AuthenticatedRequest } from '@/lib/api-middleware';
import { successResponse, errorResponse } from '@/lib/api-response';
import { checkPermission } from '@/lib/permissions';

async function handler(
  req: AuthenticatedRequest,
  { params }: { params: { projectId: string } }
) {
  const { projectId } = params;

  // Check permission
  const hasAccess = await checkPermission(
    req.session.userId,
    'view_projects',
    { projectId }
  );

  if (!hasAccess) {
    return errorResponse('FORBIDDEN', 'No access to this project', 403);
  }

  // Fetch project with ALL related data in ONE query (performance optimization)
  const project = await prisma.project.findUnique({
    where: { id: projectId, dateDeleted: null },
    include: {
      department: {
        select: {
          id: true,
          name: true,
          division: {
            select: {
              id: true,
              name: true,
              missionGroup: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
      owner: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profileImageUrl: true,
        },
      },
      statuses: {
        orderBy: { order: 'asc' },
        select: {
          id: true,
          name: true,
          color: true,
          order: true,
          type: true,
        },
      },
      tasks: {
        where: { deletedAt: null },
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
          subtasks: {
            where: { deletedAt: null },
            select: {
              id: true,
              name: true,
              isClosed: true,
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
          comments: {
            where: { deletedAt: null },
            select: {
              id: true,
            },
          },
          _count: {
            select: {
              comments: true,
            },
          },
        },
        orderBy: [
          { isClosed: 'asc' }, // Open tasks first
          { priority: 'asc' }, // Then by priority
          { createdAt: 'desc' }, // Then newest first
        ],
      },
      phases: {
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          startDate: true,
          endDate: true,
          phaseOrder: true,
        },
        orderBy: { phaseOrder: 'asc' },
      },
    },
  });

  if (!project) {
    return errorResponse('PROJECT_NOT_FOUND', 'Project not found', 404);
  }

  // Transform tasks to include calculated fields
  const transformedTasks = project.tasks.map((task) => ({
    id: task.id,
    name: task.name,
    description: task.description,
    statusId: task.statusId,
    priority: task.priority,
    dueDate: task.dueDate?.toISOString() || null,
    startDate: task.startDate?.toISOString() || null,
    assigneeUserId: task.assigneeUserId,
    assignee: task.assignee,
    status: task.status,
    isClosed: task.isClosed,
    closeType: task.closeType,
    difficulty: task.difficulty,
    parentTaskId: task.parentTaskId,
    creator: task.creator,
    createdAt: task.createdAt.toISOString(),

    // Calculated fields
    subtaskCount: task.subtasks.length,
    subtaskCompletedCount: task.subtasks.filter((s) => s.isClosed).length,
    checklistCount: task.checklists.length,
    checklistCompletedCount: task.checklists.filter((c) => c.isChecked).length,
    commentCount: task._count.comments,

    // Progress percentage
    progress: task.checklists.length > 0
      ? Math.round(
          (task.checklists.filter((c) => c.isChecked).length /
            task.checklists.length) *
            100
        )
      : task.subtasks.length > 0
      ? Math.round(
          (task.subtasks.filter((s) => s.isClosed).length / task.subtasks.length) *
            100
        )
      : task.isClosed
      ? 100
      : 0,
  }));

  // Calculate project statistics
  const stats = {
    totalTasks: transformedTasks.length,
    openTasks: transformedTasks.filter((t) => !t.isClosed).length,
    closedTasks: transformedTasks.filter((t) => t.isClosed).length,
    completedTasks: transformedTasks.filter((t) => t.closeType === 'COMPLETED').length,
    abortedTasks: transformedTasks.filter((t) => t.closeType === 'ABORTED').length,

    tasksByStatus: project.statuses.map((status) => ({
      statusId: status.id,
      statusName: status.name,
      count: transformedTasks.filter((t) => t.statusId === status.id).length,
    })),

    tasksByPriority: [1, 2, 3, 4].map((priority) => ({
      priority,
      count: transformedTasks.filter((t) => t.priority === priority).length,
    })),
  };

  // Response structure matching GAS getProjectBoardData
  return successResponse({
    project: {
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      department: project.department,
      owner: project.owner,
      createdAt: project.createdAt.toISOString(),
    },
    statuses: project.statuses,
    tasks: transformedTasks,
    phases: project.phases.map((phase) => ({
      ...phase,
      startDate: phase.startDate?.toISOString() || null,
      endDate: phase.endDate?.toISOString() || null,
    })),
    stats,
  });
}

export const GET = withAuth(handler);
