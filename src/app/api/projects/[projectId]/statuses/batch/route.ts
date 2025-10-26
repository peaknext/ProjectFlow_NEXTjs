/**
 * POST /api/projects/:projectId/statuses/batch
 * Batch create statuses (for initial project setup)
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

const batchCreateStatusSchema = z.object({
  statuses: z.array(
    z.object({
      name: z.string().min(1).max(100),
      color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      type: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'DONE']),
      order: z.number().int(),
    })
  ).min(1, 'At least one status is required'),
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
      'manage_statuses',
      { projectId }
    );

    if (!hasAccess) {
      return errorResponse('FORBIDDEN', 'No permission to manage statuses', 403);
    }

    const body = await req.json();
    const { statuses } = batchCreateStatusSchema.parse(body);

    // Create statuses in transaction
    const createdStatuses = await prisma.$transaction(
      statuses.map((status) =>
        prisma.status.create({
          data: {
            name: status.name,
            color: status.color,
            type: status.type,
            order: status.order,
            projectId,
          },
        })
      )
    );

    return successResponse(
      {
        statuses: createdStatuses,
        total: createdStatuses.length,
        message: `${createdStatuses.length} statuses created successfully`,
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export const POST = withAuth(handler);
