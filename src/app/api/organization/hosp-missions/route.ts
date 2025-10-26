/**
 * GET /api/organization/hosp-missions
 * Returns all hospital missions (not deleted)
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/api-middleware';
import { successResponse, errorResponse } from '@/lib/api-response';
import type { AuthenticatedRequest } from '@/lib/api-middleware';

async function handler(req: AuthenticatedRequest) {
  try {
    const hospMissions = await prisma.hospitalMission.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        description: true,
        startYear: true,
        endYear: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return successResponse({ hospMissions });
  } catch (error: any) {
    console.error('[API] Error fetching hospital missions:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch hospital missions', 500);
  }
}

export const GET = withAuth(handler);
