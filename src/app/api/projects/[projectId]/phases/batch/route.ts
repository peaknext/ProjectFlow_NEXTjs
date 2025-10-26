// @ts-nocheck - Prisma type issues
/**
 * POST /api/projects/:projectId/phases/batch
 * Batch create phases (for initial project setup)
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

const batchCreatePhaseSchema = z.object({
  phases: z.array(
    z.object({
      name: z.string().min(1).max(255),
      description: z.string().optional(),
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Expected YYYY-MM-DD').optional(),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Expected YYYY-MM-DD').optional(),
      phaseOrder: z.number().int(),
    })
  ).min(1, 'At least one phase is required'),
});

async function handler(
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
    const { phases } = batchCreatePhaseSchema.parse(body);

    // Create phases in transaction
    const createdPhases = await prisma.$transaction(
      phases.map((phase) =>
        prisma.phase.create({
          data: {
            name: phase.name,
            description: phase.description || null,
            startDate: phase.startDate ? new Date(phase.startDate) : null,
            endDate: phase.endDate ? new Date(phase.endDate) : null,
            phaseOrder: phase.phaseOrder,
            projectId,
          },
        })
      )
    );

    return successResponse(
      {
        phases: createdPhases.map((phase) => ({
          ...phase,
          startDate: phase.startDate?.toISOString() || null,
          endDate: phase.endDate?.toISOString() || null,
        })),
        total: createdPhases.length,
        message: `${createdPhases.length} phases created successfully`,
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export const POST = withAuth(handler);
