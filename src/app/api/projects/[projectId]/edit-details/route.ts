/**
 * GET /api/projects/[projectId]/edit-details
 * Fetch project details for editing
 *
 * Returns:
 * - Project name, description (read-only name)
 * - Department, Division, Mission Group names (read-only)
 * - Phases with dates (editable dates)
 * - Statuses with colors (editable colors)
 */

import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { successResponse, errorResponse } from '@/lib/api-response';
import { checkPermission } from '@/lib/permissions';
import { prisma } from '@/lib/db';

async function handler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const userId = req.session.userId;
  const { projectId } = await params;

  // Check permissions (must have edit_projects permission)
  const hasAccess = await checkPermission(userId, 'edit_projects', { projectId });
  if (!hasAccess) {
    return errorResponse('FORBIDDEN', 'No permission to edit this project', 403);
  }

  // Fetch project with phases and statuses
  const project = await prisma.project.findUnique({
    where: { id: projectId, dateDeleted: null },
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
      owner: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
      department: {
        select: {
          name: true,
          division: {
            select: {
              name: true,
              missionGroup: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
      phases: {
        where: { deletedAt: null },
        orderBy: { phaseOrder: 'asc' },
        select: {
          id: true,
          name: true,
          startDate: true,
          endDate: true,
          phaseOrder: true,
        },
      },
      statuses: {
        orderBy: { order: 'asc' },
        select: {
          id: true,
          name: true,
          color: true,
          order: true,
        },
      },
    },
  });

  if (!project) {
    return errorResponse('NOT_FOUND', 'Project not found', 404);
  }

  // Format response
  const response = {
    project: {
      id: project.id,
      name: project.name,
      description: project.description || '',
      createdAt: project.createdAt?.toISOString(),
      creator: project.owner, // owner is the creator
      departmentName: project.department?.name || 'N/A',
      divisionName: project.department?.division?.name || 'N/A',
      missionGroupName: project.department?.division?.missionGroup?.name || 'N/A',
      phases: project.phases.map((phase) => ({
        id: phase.id,
        name: phase.name,
        startDate: phase.startDate ? phase.startDate.toISOString() : null,
        endDate: phase.endDate ? phase.endDate.toISOString() : null,
        phaseOrder: phase.phaseOrder,
      })),
      statuses: project.statuses.map((status) => ({
        id: status.id,
        name: status.name,
        color: status.color,
        order: status.order,
      })),
    },
  };

  return successResponse(response);
}

export const GET = withAuth(handler);
