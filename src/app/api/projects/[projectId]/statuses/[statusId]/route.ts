/**
 * PATCH /api/projects/:projectId/statuses/:statusId
 * DELETE /api/projects/:projectId/statuses/:statusId
 * Status update and delete operations
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

const updateStatusSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  type: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'DONE']).optional(),
  order: z.number().int().optional(),
});

/**
 * PATCH /api/projects/:projectId/statuses/:statusId
 * Update status
 */
async function patchHandler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ projectId: string; statusId: string }> }
) {
  try {
    const { projectId, statusId } = await params;

    // Check if status exists
    const existingStatus = await prisma.status.findUnique({
      where: { id: statusId },
    });

    if (!existingStatus || existingStatus.projectId !== projectId) {
      return errorResponse('STATUS_NOT_FOUND', 'Status not found', 404);
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
    const updates = updateStatusSchema.parse(body);

    // Check for duplicate name if name is being updated
    if (updates.name && updates.name !== existingStatus.name) {
      const duplicate = await prisma.status.findFirst({
        where: {
          projectId,
          name: updates.name,
          id: { not: statusId },
        },
      });

      if (duplicate) {
        return errorResponse(
          'STATUS_EXISTS',
          `Status with name "${updates.name}" already exists`,
          400
        );
      }
    }

    // Update status
    const status = await prisma.status.update({
      where: { id: statusId },
      data: updates,
      include: {
        _count: {
          select: {
            tasks: { where: { deletedAt: null } },
          },
        },
      },
    });

    return successResponse({
      status,
      message: 'Status updated successfully',
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/projects/:projectId/statuses/:statusId
 * Delete status (soft delete)
 */
async function deleteHandler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ projectId: string; statusId: string }> }
) {
  const { projectId, statusId } = await params;

  // Check if status exists
  const existingStatus = await prisma.status.findUnique({
    where: { id: statusId },
    include: {
      _count: {
        select: {
          tasks: { where: { deletedAt: null } },
        },
      },
    },
  });

  if (!existingStatus || existingStatus.projectId !== projectId) {
    return errorResponse('STATUS_NOT_FOUND', 'Status not found', 404);
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

  // Check if status has tasks
  if (existingStatus._count.tasks > 0) {
    return errorResponse(
      'STATUS_HAS_TASKS',
      `Cannot delete status with ${existingStatus._count.tasks} tasks. Please reassign tasks first.`,
      400
    );
  }

  // Soft delete
  await prisma.status.update({
    where: { id: statusId },
    data: { deletedAt: new Date() },
  });

  return successResponse({
    message: 'Status deleted successfully',
    statusId,
  });
}

export const PATCH = withAuth(patchHandler);
export const DELETE = withAuth(deleteHandler);
