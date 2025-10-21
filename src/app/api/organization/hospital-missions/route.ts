/**
 * GET /api/organization/hospital-missions
 * POST /api/organization/hospital-missions
 * Hospital Missions management (strategic planning)
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { withAuth, withPermission } from '@/lib/api-middleware';
import {
  successResponse,
  handleApiError,
} from '@/lib/api-response';

const createHospitalMissionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(500),
  description: z.string().optional(),
  year: z.number().int().min(2000).max(2100).optional(),
  order: z.number().int().default(0),
});

/**
 * GET /api/organization/hospital-missions
 * List all hospital missions
 */
async function getHandler(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year = searchParams.get('year');
  const includeDeleted = searchParams.get('includeDeleted') === 'true';

  const where: any = includeDeleted ? {} : { deletedAt: null };
  if (year) {
    where.year = parseInt(year);
  }

  const missions = await prisma.hospitalMission.findMany({
    where,
    include: {
      itGoals: {
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
          itGoals: true,
        },
      },
    },
    orderBy: [{ year: 'desc' }, { order: 'asc' }],
  });

  return successResponse({
    missions,
    total: missions.length,
  });
}

/**
 * POST /api/organization/hospital-missions
 * Create new hospital mission
 */
async function postHandler(req: NextRequest) {
  try {
    const body = await req.json();
    const data = createHospitalMissionSchema.parse(body);

    const mission = await prisma.hospitalMission.create({
      data: {
        name: data.name,
        description: data.description || null,
        year: data.year || new Date().getFullYear(),
        order: data.order,
      },
      include: {
        _count: {
          select: {
            itGoals: true,
          },
        },
      },
    });

    return successResponse(
      {
        mission,
        message: 'Hospital mission created successfully',
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withAuth(getHandler);
export const POST = withPermission('manage_departments', postHandler);
