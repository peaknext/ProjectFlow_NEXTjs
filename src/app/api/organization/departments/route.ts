/**
 * GET /api/organization/departments
 * POST /api/organization/departments
 * Departments management
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

const createDepartmentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  divisionId: z.string().min(1, 'Division ID is required'),
  headUserId: z.string().optional(),
  tel: z.string().optional(),
});

/**
 * GET /api/organization/departments
 * List all departments
 */
async function getHandler(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const divisionId = searchParams.get('divisionId') || undefined;
  const missionGroupId = searchParams.get('missionGroupId') || undefined;
  const includeDeleted = searchParams.get('includeDeleted') === 'true';

  const where: any = includeDeleted ? {} : { deletedAt: null };

  if (divisionId) {
    where.divisionId = divisionId;
  }

  if (missionGroupId) {
    where.division = {
      missionGroupId: missionGroupId,
    };
  }

  const departments = await prisma.department.findMany({
    where,
    include: {
      division: {
        select: {
          id: true,
          name: true,
          missionGroup: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      head: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profileImageUrl: true,
        },
      },
      _count: {
        select: {
          users: true,
          projects: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  return successResponse({
    departments,
    total: departments.length,
  });
}

/**
 * POST /api/organization/departments
 * Create new department
 */
async function postHandler(req: NextRequest) {
  try {
    const body = await req.json();
    const data = createDepartmentSchema.parse(body);

    // Check if division exists
    const division = await prisma.division.findUnique({
      where: { id: data.divisionId },
      include: {
        missionGroup: true,
      },
    });

    if (!division) {
      return errorResponse('DIVISION_NOT_FOUND', 'Division not found', 404);
    }

    // Check if head user exists
    if (data.headUserId) {
      const head = await prisma.user.findUnique({
        where: { id: data.headUserId },
      });

      if (!head) {
        return errorResponse('HEAD_NOT_FOUND', 'Head user not found', 404);
      }
    }

    // Create department
    const department = await prisma.department.create({
      data: {
        name: data.name,
        divisionId: data.divisionId,
        headUserId: data.headUserId || null,
        tel: data.tel || null,
      },
      include: {
        division: {
          select: {
            id: true,
            name: true,
            missionGroup: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        head: {
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
        department,
        message: 'Department created successfully',
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withAuth(getHandler);
export const POST = withPermission('manage_departments', postHandler);
