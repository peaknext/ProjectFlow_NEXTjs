/**
 * GET /api/organization/it-goals
 * POST /api/organization/it-goals
 * IT Goals management (linked to Hospital Missions)
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

const createITGoalSchema = z.object({
  name: z.string().min(1, 'Name is required').max(500),
  hospitalMissionId: z.string().min(1, 'Hospital mission ID is required'),
  description: z.string().optional(),
  order: z.number().int().default(0),
});

/**
 * GET /api/organization/it-goals
 * List all IT goals
 */
async function getHandler(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const hospitalMissionId = searchParams.get('missionId') || undefined;
  const includeDeleted = searchParams.get('includeDeleted') === 'true';

  const where: any = includeDeleted ? {} : { deletedAt: null };
  if (hospitalMissionId) {
    where.hospitalMissionId = hospitalMissionId;
  }

  const goals = await prisma.iTGoal.findMany({
    where,
    include: {
      hospitalMission: {
        select: {
          id: true,
          // @ts-ignore - Prisma schema field
          name: true,
          year: true,
        },
      },
      actionPlans: {
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          order: true,
        },
        orderBy: { order: 'asc' },
      },
      _count: {
        select: {
          actionPlans: true,
        },
      },
    },
      // @ts-ignore - Prisma schema field
    orderBy: [
      // @ts-ignore - Prisma schema field
      { hospitalMission: { year: 'desc' } },
      { order: 'asc' },
    ],
  });

  return successResponse({
    goals,
    total: goals.length,
  });
}

/**
 * POST /api/organization/it-goals
 * Create new IT goal
 */
async function postHandler(req: NextRequest) {
  try {
    const body = await req.json();
    const data = createITGoalSchema.parse(body);

    // Check if hospital mission exists
    const mission = await prisma.hospitalMission.findUnique({
      where: { id: data.hospitalMissionId },
    });

    if (!mission) {
      return errorResponse('MISSION_NOT_FOUND', 'Hospital mission not found', 404);
    }

    const goal = await prisma.iTGoal.create({
      // @ts-ignore - Prisma schema field
      data: {
        name: data.name,
        hospitalMissionId: data.hospitalMissionId,
        description: data.description || null,
        order: data.order,
      },
      include: {
        hospitalMission: {
          select: {
          // @ts-ignore - Prisma schema field
            id: true,
            name: true,
            year: true,
          },
        },
        _count: {
          select: {
            actionPlans: true,
          },
        },
      },
    });

    return successResponse(
      {
        goal,
        message: 'IT goal created successfully',
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withAuth(getHandler);
export const POST = withPermission('manage_departments', postHandler);
