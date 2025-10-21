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
  // Get project with all tasks
  const project = await tx.project.findUnique({
    where: { id: projectId, dateDeleted: null },
    select: {
      id: true,
      name: true,
      tasks: {
        where: { deletedAt: null },
        select: {
          id: true,
          isClosed: true,
          closeType: true,
          statusId: true,
          status: {
            select: {
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
    },
  });

  if (!project) {
    return null;
  }

  const tasks = project.tasks;
  const totalTasks = tasks.length;

  // Count tasks by status type
  const completedTasks = tasks.filter(
    (t) => t.isClosed && t.closeType === 'COMPLETED'
  ).length;

  const inProgressTasks = tasks.filter(
    (t) => !t.isClosed && t.status?.type === 'IN_PROGRESS'
  ).length;

  const notStartedTasks = tasks.filter(
    (t) => !t.isClosed && t.status?.type === 'NOT_STARTED'
  ).length;

  // Calculate basic progress
  const progressPercentage =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Count subtasks
  const allSubtasks = tasks.flatMap((t) => t.subtasks);
  const totalSubtasks = allSubtasks.length;
  const completedSubtasks = allSubtasks.filter((s) => s.isClosed).length;

  // Count checklists
  const allChecklists = tasks.flatMap((t) => t.checklists);
  const totalChecklists = allChecklists.length;
  const completedChecklists = allChecklists.filter((c) => c.isChecked).length;

  // Calculate weighted overall progress
  // Tasks: 60%, Subtasks: 20%, Checklists: 20%
  const taskProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 60 : 0;
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
    totalTasks,
    completedTasks,
    inProgressTasks,
    notStartedTasks,
    progressPercentage,
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
