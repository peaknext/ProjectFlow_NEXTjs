/**
 * GET /api/organization/mission-groups
 * POST /api/organization/mission-groups
 * Mission Groups management
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { withAuth, withPermission } from '@/lib/api-middleware';
import {
  successResponse,
  handleApiError,
} from '@/lib/api-response';

const createMissionGroupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  chiefUserId: z.string().optional(),
});

/**
 * GET /api/organization/mission-groups
 * List all mission groups
 */
async function getHandler(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const includeDeleted = searchParams.get('includeDeleted') === 'true';

  const missionGroups = await prisma.missionGroup.findMany({
    where: includeDeleted ? {} : { deletedAt: null },
    include: {
      chief: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profileImageUrl: true,
        },
      },
      divisions: {
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          divisions: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  return successResponse({
    missionGroups,
    total: missionGroups.length,
  });
}

/**
 * POST /api/organization/mission-groups
 * Create new mission group
 */
async function postHandler(req: NextRequest) {
  try {
    const body = await req.json();
    const data = createMissionGroupSchema.parse(body);

    // Check if chief user exists
    if (data.chiefUserId) {
      const chief = await prisma.user.findUnique({
        where: { id: data.chiefUserId },
      });

      if (!chief) {
        return successResponse(
          { error: 'Chief user not found' },
          404
        );
      }
    }

    // Create mission group
    const missionGroup = await prisma.missionGroup.create({
      data: {
        name: data.name,
        chiefUserId: data.chiefUserId || null,
      },
      include: {
        chief: {
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
        missionGroup,
        message: 'Mission group created successfully',
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withAuth(getHandler);
export const POST = withPermission('manage_departments', postHandler);
