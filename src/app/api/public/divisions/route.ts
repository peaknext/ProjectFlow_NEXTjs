/**
 * GET /api/public/divisions
 * Public endpoint to list divisions (for registration)
 * No authentication required
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, handleApiError } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  try {
    const divisions = await prisma.division.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        missionGroupId: true,
      },
      orderBy: { name: 'asc' },
    });

    return successResponse({
      divisions,
      total: divisions.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
