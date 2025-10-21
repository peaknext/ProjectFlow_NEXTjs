/**
 * GET /api/organization/divisions
 * POST /api/organization/divisions
 * Divisions management
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

const createDivisionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  missionGroupId: z.string().min(1, 'Mission group ID is required'),
  leaderUserId: z.string().optional(),
});

/**
 * GET /api/organization/divisions
 * List all divisions
 */
async function getHandler(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const missionGroupId = searchParams.get('missionGroupId') || undefined;
  const includeDeleted = searchParams.get('includeDeleted') === 'true';

  const where: any = includeDeleted ? {} : { deletedAt: null };
  if (missionGroupId) {
    where.missionGroupId = missionGroupId;
  }

  const divisions = await prisma.division.findMany({
    where,
    include: {
      missionGroup: {
        select: {
          id: true,
          name: true,
        },
      },
      leader: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profileImageUrl: true,
        },
      },
      departments: {
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          departments: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  return successResponse({
    divisions,
    total: divisions.length,
  });
}

/**
 * POST /api/organization/divisions
 * Create new division
 */
async function postHandler(req: NextRequest) {
  try {
    const body = await req.json();
    const data = createDivisionSchema.parse(body);

    // Check if mission group exists
    const missionGroup = await prisma.missionGroup.findUnique({
      where: { id: data.missionGroupId },
    });

    if (!missionGroup) {
      return errorResponse('MISSION_GROUP_NOT_FOUND', 'Mission group not found', 404);
    }

    // Check if leader user exists
    if (data.leaderUserId) {
      const leader = await prisma.user.findUnique({
        where: { id: data.leaderUserId },
      });

      if (!leader) {
        return errorResponse('LEADER_NOT_FOUND', 'Leader user not found', 404);
      }
    }

    // Create division
    const division = await prisma.division.create({
      data: {
        name: data.name,
        missionGroupId: data.missionGroupId,
        leaderUserId: data.leaderUserId || null,
      },
      include: {
        missionGroup: {
          select: {
            id: true,
            name: true,
          },
        },
        leader: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return successResponse(
      {
        division,
        message: 'Division created successfully',
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withAuth(getHandler);
export const POST = withPermission('manage_departments', postHandler);
