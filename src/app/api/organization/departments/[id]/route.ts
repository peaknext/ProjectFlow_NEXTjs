/**
 * PATCH /api/organization/departments/:id
 * DELETE /api/organization/departments/:id
 * Department update and delete operations
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { withPermission } from '@/lib/api-middleware';
import {
  successResponse,
  errorResponse,
  handleApiError,
} from '@/lib/api-response';

const updateDepartmentSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  divisionId: z.string().optional(),
  headUserId: z.string().nullable().optional(),
  tel: z.string().nullable().optional(),
});

/**
 * PATCH /api/organization/departments/:id
 * Update department
 */
async function patchHandler(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if department exists
    const existingDepartment = await prisma.department.findUnique({
      where: { id, deletedAt: null },
    });

    if (!existingDepartment) {
      return errorResponse('DEPARTMENT_NOT_FOUND', 'Department not found', 404);
    }

    const body = await req.json();
    const updates = updateDepartmentSchema.parse(body);

    // Check if new division exists (if divisionId is being updated)
    if (updates.divisionId) {
      const division = await prisma.division.findUnique({
        where: { id: updates.divisionId },
      });

      if (!division) {
        return errorResponse('DIVISION_NOT_FOUND', 'Division not found', 404);
      }
    }

    // Check if new head user exists (if headUserId is being updated)
    if (updates.headUserId) {
      const head = await prisma.user.findUnique({
        where: { id: updates.headUserId },
      });

      if (!head) {
        return errorResponse('HEAD_NOT_FOUND', 'Head user not found', 404);
      }
    }

    // Update department
    const department = await prisma.department.update({
      where: { id },
      data: updates,
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

    return successResponse({
      department,
      message: 'Department updated successfully',
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/organization/departments/:id
 * Soft delete department
 */
async function deleteHandler(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  // Check if department exists
  const existingDepartment = await prisma.department.findUnique({
    where: { id, deletedAt: null },
    include: {
      _count: {
        select: {
          users: true,
          projects: true,
        },
      },
    },
  });

  if (!existingDepartment) {
    return errorResponse('DEPARTMENT_NOT_FOUND', 'Department not found', 404);
  }

  // Check if department has users or projects
  if (existingDepartment._count.users > 0) {
    return errorResponse(
      'DEPARTMENT_HAS_USERS',
      `Cannot delete department with ${existingDepartment._count.users} users. Please reassign users first.`,
      400
    );
  }

  if (existingDepartment._count.projects > 0) {
    return errorResponse(
      'DEPARTMENT_HAS_PROJECTS',
      `Cannot delete department with ${existingDepartment._count.projects} projects. Please reassign or archive projects first.`,
      400
    );
  }

  // Soft delete department
  await prisma.department.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return successResponse({
    message: 'Department deleted successfully',
    id,
  });
}

export const PATCH = withPermission('manage_departments', patchHandler);
export const DELETE = withPermission('manage_departments', deleteHandler);
