/**
 * GET /api/organization/hospital-missions/:id
 * PATCH /api/organization/hospital-missions/:id
 * DELETE /api/organization/hospital-missions/:id
 * Hospital Mission detail operations
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { withAuth, withPermission } from '@/lib/api-middleware';
import {
  successResponse,
  errorResponse,
  handleApiError,
} from '@/lib/api-response';

const updateHospitalMissionSchema = z.object({
  name: z.string().min(1).max(500).optional(),
  description: z.string().nullable().optional(),
  year: z.number().int().min(2000).max(2100).optional(),
  order: z.number().int().optional(),
});

/**
 * GET /api/organization/hospital-missions/:id
 * Get hospital mission with all related IT goals and action plans
 */
async function getHandler(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const mission = await prisma.hospitalMission.findUnique({
    where: { id, deletedAt: null },
    include: {
      itGoals: {
        where: { deletedAt: null },
        include: {
          actionPlans: {
            where: { deletedAt: null },
            include: {
              projects: {
                where: { deletedAt: null },
                select: {
                  id: true,
                  name: true,
                  status: true,
                },
              },
              _count: {
                select: {
                  projects: true,
                },
              },
            },
            orderBy: { order: 'asc' },
          },
          _count: {
            select: {
              actionPlans: true,
            },
          },
        },
        orderBy: { order: 'asc' },
      },
      _count: {
        select: {
          itGoals: true,
        },
      },
    },
  });

  if (!mission) {
    return errorResponse('MISSION_NOT_FOUND', 'Hospital mission not found', 404);
  }

  return successResponse({ mission });
}

/**
 * PATCH /api/organization/hospital-missions/:id
 * Update hospital mission
 */
async function patchHandler(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const existingMission = await prisma.hospitalMission.findUnique({
      where: { id, deletedAt: null },
    });

    if (!existingMission) {
      return errorResponse('MISSION_NOT_FOUND', 'Hospital mission not found', 404);
    }

    const body = await req.json();
    const updates = updateHospitalMissionSchema.parse(body);

    const mission = await prisma.hospitalMission.update({
      where: { id },
      data: updates,
      include: {
        _count: {
          select: {
            itGoals: true,
          },
        },
      },
    });

    return successResponse({
      mission,
      message: 'Hospital mission updated successfully',
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/organization/hospital-missions/:id
 * Soft delete hospital mission
 */
async function deleteHandler(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const existingMission = await prisma.hospitalMission.findUnique({
    where: { id, deletedAt: null },
    include: {
      _count: {
        select: {
          itGoals: true,
        },
      },
    },
  });

  if (!existingMission) {
    return errorResponse('MISSION_NOT_FOUND', 'Hospital mission not found', 404);
  }

  // Check if mission has IT goals
  if (existingMission._count.itGoals > 0) {
    return errorResponse(
      'MISSION_HAS_GOALS',
      `Cannot delete mission with ${existingMission._count.itGoals} IT goals. Please delete or reassign goals first.`,
      400
    );
  }

  // Soft delete
  await prisma.hospitalMission.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return successResponse({
    message: 'Hospital mission deleted successfully',
    id,
  });
}

export const GET = withAuth(getHandler);
export const PATCH = withPermission('manage_departments', patchHandler);
export const DELETE = withPermission('manage_departments', deleteHandler);
