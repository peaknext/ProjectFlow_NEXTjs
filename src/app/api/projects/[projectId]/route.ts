/**
 * GET /api/projects/:projectId
 * PATCH /api/projects/:projectId
 * DELETE /api/projects/:projectId
 * Single project operations
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { withAuth, withPermission } from '@/lib/api-middleware';
import type { AuthenticatedRequest } from '@/lib/api-middleware';
import {
  successResponse,
  errorResponse,
  handleApiError,
} from '@/lib/api-response';
import { checkPermission } from '@/lib/permissions';

const updateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  departmentId: z.string().optional(),
  actionPlanId: z.string().nullable().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Expected YYYY-MM-DD').nullable().optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Expected YYYY-MM-DD').nullable().optional(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'ON_HOLD', 'ARCHIVED']).optional(),
  color: z.string().nullable().optional(),
  ownerUserId: z.string().optional(),
  // Edit Project Modal fields
  phases: z.array(
    z.object({
      id: z.string(),
      startDate: z.string().nullable(),
      endDate: z.string().nullable(),
    })
  ).optional(),
  statuses: z.array(
    z.object({
      id: z.string(),
      color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
    })
  ).optional(),
});

/**
 * GET /api/projects/:projectId
 * Get single project details
 */
async function getHandler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;

  // Check permission
  const hasAccess = await checkPermission(
    req.session.userId,
    'view_projects',
    { projectId }
  );

  if (!hasAccess) {
    return errorResponse('FORBIDDEN', 'No access to this project', 403);
  }

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
          projects: {
            where: { dateDeleted: null },
            select: {
              id: true,
              name: true,
              status: true,
            },
            orderBy: { name: 'asc' },
          },
        },
      },
      owner: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profileImageUrl: true,
          jobTitle: true,
        },
      },
      actionPlan: {
        select: {
          id: true,
          name: true,
          hospitalMission: {
            select: {
              id: true,
              name: true,
              startYear: true,
              endYear: true,
            },
          },
        },
      },
      _count: {
        select: {
          tasks: true,
          statuses: true,
          phases: true,
        },
      },
    },
  });

  if (!project) {
    return errorResponse('PROJECT_NOT_FOUND', 'Project not found', 404);
  }

  return successResponse({ project });
}

/**
 * PATCH /api/projects/:projectId
 * Update project
 */
async function patchHandler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId, dateDeleted: null },
    });

    if (!existingProject) {
      return errorResponse('PROJECT_NOT_FOUND', 'Project not found', 404);
    }

    // Check permission
    const hasAccess = await checkPermission(
      req.session.userId,
      'edit_projects',
      { projectId }
    );

    if (!hasAccess) {
      return errorResponse('FORBIDDEN', 'No permission to edit this project', 403);
    }

    const body = await req.json();
    const updates = updateProjectSchema.parse(body);

    // Prepare update data
    const updateData: any = {};

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.departmentId !== undefined) updateData.departmentId = updates.departmentId;
    if (updates.actionPlanId !== undefined) updateData.actionPlanId = updates.actionPlanId;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.color !== undefined) updateData.color = updates.color;
    if (updates.ownerUserId !== undefined) updateData.ownerUserId = updates.ownerUserId;

    if (updates.startDate !== undefined) {
      updateData.startDate = updates.startDate ? new Date(updates.startDate) : null;
    }
    if (updates.endDate !== undefined) {
      updateData.endDate = updates.endDate ? new Date(updates.endDate) : null;
    }

    // Update project
    const project = await prisma.project.update({
      where: { id: projectId },
      data: updateData,
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    // Update phases (dates only)
    if (updates.phases && Array.isArray(updates.phases)) {
      for (const phaseUpdate of updates.phases) {
        await prisma.phase.update({
          where: { id: phaseUpdate.id },
          data: {
            startDate: phaseUpdate.startDate ? new Date(phaseUpdate.startDate) : null,
            endDate: phaseUpdate.endDate ? new Date(phaseUpdate.endDate) : null,
          },
        });
      }
    }

    // Update statuses (colors only)
    if (updates.statuses && Array.isArray(updates.statuses)) {
      for (const statusUpdate of updates.statuses) {
        await prisma.status.update({
          where: { id: statusUpdate.id },
          data: {
            color: statusUpdate.color,
          },
        });
      }
    }

    // Note: History model is designed for tasks only (requires taskId)
    // Project history tracking will be implemented separately if needed

    return successResponse({
      project,
      message: 'Project updated successfully',
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/projects/:projectId
 * Soft delete project
 */
async function deleteHandler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;

  // Check if project exists
  const existingProject = await prisma.project.findUnique({
    where: { id: projectId, dateDeleted: null },
    include: {
      _count: {
        select: {
          tasks: { where: { deletedAt: null } },
        },
      },
    },
  });

  if (!existingProject) {
    return errorResponse('PROJECT_NOT_FOUND', 'Project not found', 404);
  }

  // Check permission
  const hasAccess = await checkPermission(
    req.session.userId,
    'delete_projects',
    { projectId }
  );

  if (!hasAccess) {
    return errorResponse('FORBIDDEN', 'No permission to delete this project', 403);
  }

  // Warn if project has tasks
  if (existingProject._count.tasks > 0) {
    return errorResponse(
      'PROJECT_HAS_TASKS',
      `Project has ${existingProject._count.tasks} active tasks. Please archive or delete tasks first.`,
      400
    );
  }

  // Soft delete project
  await prisma.project.update({
    where: { id: projectId },
    data: { deletedAt: new Date() },
  });

  return successResponse({
    message: 'Project deleted successfully',
    projectId,
  });
}

export const GET = withAuth(getHandler);
export const PATCH = withAuth(patchHandler);
export const DELETE = withAuth(deleteHandler);
