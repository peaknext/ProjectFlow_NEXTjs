/**
 * POST /api/projects/progress/batch
 * Batch calculate progress for multiple projects (PERFORMANCE OPTIMIZATION)
 * Useful for dashboard views showing multiple projects
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/api-middleware';
import type { AuthenticatedRequest } from '@/lib/api-middleware';
import { successResponse, handleApiError } from '@/lib/api-response';
import { calculateProgress } from '@/lib/calculate-progress';

const batchProgressSchema = z.object({
  projectIds: z.array(z.string()).min(1).max(50), // Limit to 50 projects per batch
});

interface ProjectProgress {
  projectId: string;
  projectName: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  notStartedTasks: number;
  progressPercentage: number;
  totalSubtasks: number;
  completedSubtasks: number;
  totalChecklists: number;
  completedChecklists: number;
  overallProgress: number; // Weighted progress including subtasks and checklists
}

/**
 * Calculate comprehensive progress for a project
 */
async function calculateProjectProgress(
  projectId: string,
  tx: any
): Promise<ProjectProgress | null> {
  // Get project with all tasks and statuses
  const project = await tx.project.findUnique({
    where: { id: projectId, dateDeleted: null },
    select: {
      id: true,
      name: true,
      tasks: {
        where: { deletedAt: null, parentTaskId: null }, // Only main tasks
        select: {
          id: true,
          difficulty: true,
          closeType: true,
          statusId: true,
          status: {
            select: {
              order: true,
              type: true,
            },
          },
          subtasks: {
            where: { deletedAt: null },
            select: {
              id: true,
              isClosed: true,
            },
          },
          checklists: {
            where: { deletedAt: null },
            select: {
              id: true,
              isChecked: true,
            },
          },
        },
      },
      statuses: {
        select: {
          order: true,
        },
      },
    },
  });

  if (!project) {
    return null;
  }

  // Use shared calculation utility
  const progressResult = calculateProgress(project.tasks, project.statuses);

  // Count tasks by status type for additional stats
  const validTasks = project.tasks.filter((t) => t.closeType !== 'ABORTED');

  const inProgressTasks = validTasks.filter(
    (t) => !t.closeType && t.status?.type === 'IN_PROGRESS'
  ).length;

  const notStartedTasks = validTasks.filter(
    (t) => !t.closeType && t.status?.type === 'NOT_STARTED'
  ).length;

  // Count subtasks (from valid tasks only)
  const allSubtasks = validTasks.flatMap((t) => t.subtasks);
  const totalSubtasks = allSubtasks.length;
  const completedSubtasks = allSubtasks.filter((s) => s.isClosed).length;

  // Count checklists (from valid tasks only)
  const allChecklists = validTasks.flatMap((t) => t.checklists);
  const totalChecklists = allChecklists.length;
  const completedChecklists = allChecklists.filter((c) => c.isChecked).length;

  // Calculate weighted overall progress
  // Use GAS formula progress as base (60%), add subtasks (20%) and checklists (20%)
  const taskProgress = progressResult.progress * 0.6; // Use GAS formula result
  const subtaskProgress =
    totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 20 : 0;
  const checklistProgress =
    totalChecklists > 0 ? (completedChecklists / totalChecklists) * 20 : 0;

  const overallProgress = Math.round(
    taskProgress + subtaskProgress + checklistProgress
  );

  return {
    projectId: project.id,
    projectName: project.name,
    totalTasks: progressResult.totalTasks,
    completedTasks: progressResult.completedTasks,
    inProgressTasks,
    notStartedTasks,
    progressPercentage: progressResult.progress,
    totalSubtasks,
    completedSubtasks,
    totalChecklists,
    completedChecklists,
    overallProgress,
  };
}

/**
 * POST /api/projects/progress/batch
 * Calculate progress for multiple projects in one request
 * Optimized for dashboard views
 */
async function handler(req: AuthenticatedRequest) {
  try {
    const body = await req.json();
    const { projectIds } = batchProgressSchema.parse(body);

    // Calculate progress for all projects in parallel
    const progressResults = await prisma.$transaction(async (tx) => {
      const promises = projectIds.map((projectId) =>
        calculateProjectProgress(projectId, tx)
      );
      return Promise.all(promises);
    });

    // Filter out null results (projects not found)
    const validResults = progressResults.filter(
      (result): result is ProjectProgress => result !== null
    );

    // Calculate aggregate statistics
    const totalProjects = validResults.length;
    const totalTasksAcrossProjects = validResults.reduce(
      (sum, p) => sum + p.totalTasks,
      0
    );
    const totalCompletedTasksAcrossProjects = validResults.reduce(
      (sum, p) => sum + p.completedTasks,
      0
    );
    const averageProgress =
      totalProjects > 0
        ? Math.round(
            validResults.reduce((sum, p) => sum + p.overallProgress, 0) /
              totalProjects
          )
        : 0;

    return successResponse({
      projects: validResults,
      summary: {
        totalProjects,
        totalTasks: totalTasksAcrossProjects,
        totalCompletedTasks: totalCompletedTasksAcrossProjects,
        averageProgress,
      },
      notFound: projectIds.length - validResults.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export const POST = withAuth(handler);
