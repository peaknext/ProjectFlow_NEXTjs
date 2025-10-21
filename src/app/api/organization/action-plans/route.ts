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
  itGoalId: z.string().min(1, 'IT goal ID is required'),
  description: z.string().optional(),
  order: z.number().int().default(0),
});

/**
 * GET /api/organization/action-plans
 * List all action plans
 */
async function getHandler(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const itGoalId = searchParams.get('goalId') || undefined;
  const hospitalMissionId = searchParams.get('missionId') || undefined;
  const includeDeleted = searchParams.get('includeDeleted') === 'true';

  const where: any = includeDeleted ? {} : { deletedAt: null };

  if (itGoalId) {
    where.itGoalId = itGoalId;
  }

  if (hospitalMissionId) {
    where.itGoal = {
      hospitalMissionId: hospitalMissionId,
    };
  }

  const plans = await prisma.actionPlan.findMany({
    where,
    include: {
      itGoal: {
        select: {
          id: true,
          name: true,
          hospitalMission: {
            select: {
              id: true,
              name: true,
              year: true,
            },
          },
        },
      },
      projects: {
        where: { deletedAt: null },
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
      { itGoal: { hospitalMission: { year: 'desc' } } },
      { order: 'asc' },
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

    // Check if IT goal exists
    const goal = await prisma.iTGoal.findUnique({
      where: { id: data.itGoalId },
      include: {
        hospitalMission: {
          select: {
            id: true,
            name: true,
            year: true,
          },
        },
      },
    });

    if (!goal) {
      return errorResponse('GOAL_NOT_FOUND', 'IT goal not found', 404);
    }

    const plan = await prisma.actionPlan.create({
      data: {
        name: data.name,
        itGoalId: data.itGoalId,
        description: data.description || null,
        order: data.order,
      },
      include: {
        itGoal: {
          select: {
            id: true,
            name: true,
            hospitalMission: {
              select: {
                id: true,
                name: true,
                year: true,
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
