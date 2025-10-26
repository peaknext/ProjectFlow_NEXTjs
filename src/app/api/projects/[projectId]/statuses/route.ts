/**
 * GET /api/projects/:projectId/statuses
 * POST /api/projects/:projectId/statuses
 * Project statuses management
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

const createStatusSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid hex color'),
  type: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'DONE']),
  order: z.number().int().optional(),
});

/**
 * GET /api/projects/:projectId/statuses
 * List all statuses for project
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

  const statuses = await prisma.status.findMany({
    where: { projectId },
    include: {
      _count: {
        select: {
          tasks: { where: { deletedAt: null } },
        },
      },
    },
    orderBy: { order: 'asc' },
  });

  return successResponse({
    statuses,
    total: statuses.length,
  });
}

/**
 * POST /api/projects/:projectId/statuses
 * Create new custom status
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
      'manage_statuses',
      { projectId }
    );

    if (!hasAccess) {
      return errorResponse('FORBIDDEN', 'No permission to manage statuses', 403);
    }

    const body = await req.json();
    const data = createStatusSchema.parse(body);

    // Check for duplicate status name in project
    const existingStatus = await prisma.status.findFirst({
      where: {
        projectId,
        name: data.name,
      },
    });

    if (existingStatus) {
      return errorResponse(
        'STATUS_EXISTS',
        `Status with name "${data.name}" already exists in this project`,
        400
      );
    }

    // Get max order
    const maxOrderStatus = await prisma.status.findFirst({
      where: { projectId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const order = data.order ?? (maxOrderStatus?.order ?? 0) + 1;

    // Create status
    const status = await prisma.status.create({
      data: {
        name: data.name,
        color: data.color,
        type: data.type,
        order,
        projectId,
      },
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    return successResponse(
      {
        status,
        message: 'Status created successfully',
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);
