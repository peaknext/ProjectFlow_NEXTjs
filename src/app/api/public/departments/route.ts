/**
 * GET /api/public/departments
 * Public endpoint to list departments (for registration)
 * No authentication required
 * Supports filtering by divisionId via query parameter
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, handleApiError } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const divisionId = searchParams.get('divisionId') || undefined;

    const where: any = { deletedAt: null };
    if (divisionId) {
      where.divisionId = divisionId;
    }

    const departments = await prisma.department.findMany({
      where,
      select: {
        id: true,
        name: true,
        divisionId: true,
      },
      orderBy: { name: 'asc' },
    });

    return successResponse({
      departments,
      total: departments.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
