/**
 * GET /api/projects/:projectId/phases
 * POST /api/projects/:projectId/phases
 * Project phases management
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

const createPhaseSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Expected YYYY-MM-DD').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Expected YYYY-MM-DD').optional(),
  phaseOrder: z.number().int().optional(),
});

/**
 * GET /api/projects/:projectId/phases
 * List all phases for project
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

  const phases = await prisma.phase.findMany({
    where: { projectId, deletedAt: null },
    orderBy: { phaseOrder: 'asc' },
  });

  return successResponse({
    phases: phases.map((phase) => ({
      ...phase,
      startDate: phase.startDate?.toISOString() || null,
      endDate: phase.endDate?.toISOString() || null,
    })),
    total: phases.length,
  });
}

/**
 * POST /api/projects/:projectId/phases
 * Create new phase
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
      return errorResponse('PROJECT_NOT_FOUND', 'Project not found', 404);
    }

    // Check permission
    const hasAccess = await checkPermission(
      req.session.userId,
      'edit_projects',
      { projectId }
    );

    if (!hasAccess) {
      return errorResponse('FORBIDDEN', 'No permission to manage phases', 403);
    }

    const body = await req.json();
    const data = createPhaseSchema.parse(body);

    // Get max phaseOrder if not specified
    const maxOrderPhase = await prisma.phase.findFirst({
      where: { projectId },
      orderBy: { phaseOrder: 'desc' },
      select: { phaseOrder: true },
    });

    const phaseOrder = data.phaseOrder ?? (maxOrderPhase?.phaseOrder ?? 0) + 1;

    // Create phase
    const phase = await prisma.phase.create({
      data: {
        name: data.name,
        description: data.description || null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        phaseOrder,
        projectId,
      },
    });

    return successResponse(
      {
        phase: {
          ...phase,
          startDate: phase.startDate?.toISOString() || null,
          endDate: phase.endDate?.toISOString() || null,
        },
        message: 'Phase created successfully',
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);
