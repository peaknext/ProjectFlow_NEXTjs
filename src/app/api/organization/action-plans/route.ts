// @ts-nocheck - Prisma type issues
/**
 * GET /api/organization/action-plans
 * POST /api/organization/action-plans
 * Action Plans management (linked to IT Goals)
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

const createActionPlanSchema = z.object({
  name: z.string().min(1, 'Name is required').max(500),
  hospMissionId: z.string().min(1, 'Hospital mission ID is required'),
  itGoalIds: z.array(z.string()).optional(),
  description: z.string().optional(),
  order: z.number().int().default(0),
});

/**
 * GET /api/organization/action-plans
 * List all action plans
 */
async function getHandler(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const hospitalMissionId = searchParams.get('missionId') || undefined;
  const includeDeleted = searchParams.get('includeDeleted') === 'true';

  const where: any = includeDeleted ? {} : { deletedAt: null };

  if (hospitalMissionId) {
    where.hospMissionId = hospitalMissionId;
  }

  const plans = await prisma.actionPlan.findMany({
    where,
    include: {
      hospitalMission: {
        select: {
          id: true,
          name: true,
          startYear: true,
          endYear: true,
        },
      },
      projects: {
        where: { dateDeleted: null },
        select: {
          id: true,
          name: true,
          status: true,
          department: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      _count: {
        select: {
          projects: true,
        },
      },
    },
    orderBy: [
      { name: 'asc' },
    ],
  });

  return successResponse({
    plans,
    total: plans.length,
  });
}

/**
 * POST /api/organization/action-plans
 * Create new action plan
 */
async function postHandler(req: NextRequest) {
  try {
    const body = await req.json();
    const data = createActionPlanSchema.parse(body);

    // Check if hospital mission exists
    const mission = await prisma.hospitalMission.findUnique({
      where: { id: data.hospMissionId },
    });

    if (!mission) {
      return errorResponse('MISSION_NOT_FOUND', 'Hospital mission not found', 404);
    }

    const plan = await prisma.actionPlan.create({
      data: {
        name: data.name,
        hospMissionId: data.hospMissionId,
        itGoalIds: data.itGoalIds || null,
        description: data.description || null,
        order: data.order,
      },
      include: {
        hospitalMission: {
          select: {
            id: true,
            name: true,
            startYear: true,
            endYear: true,
          },
        },
        _count: {
          select: {
            projects: true,
          },
        },
      },
    });

    return successResponse(
      {
        plan,
        message: 'Action plan created successfully',
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withAuth(getHandler);
export const POST = withPermission('manage_departments', postHandler);
