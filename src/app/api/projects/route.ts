/**
 * GET /api/projects
 * POST /api/projects
 * Projects management
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { withAuth, withPermission } from '@/lib/api-middleware';
import type { AuthenticatedRequest } from '@/lib/api-middleware';
import {
  successResponse,
  errorResponse,
  handleApiError,
} from '@/lib/api-response';
import { getUserAccessibleScope } from '@/lib/permissions';

const createProjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().optional(),
  departmentId: z.string().min(1, 'Department ID is required'),
  hospMissionId: z.string().nullish(),
  actionPlanId: z.string().nullish(),
  phases: z.array(z.object({
    name: z.string(),
    phaseOrder: z.number(),
    startDate: z.string().nullable().optional(),
    endDate: z.string().nullable().optional(),
  })).optional(),
  // Status Type สำหรับแสดงความก้าวหน้าของงาน (ไม่ใช่การปิดงาน)
  // ⚠️ IMPORTANT: ใช้เฉพาะ NOT_STARTED, IN_PROGRESS, DONE
  // ❌ ห้ามใช้ ABORTED, COMPLETED, CANCELED - ค่าเหล่านี้เป็น CloseType ไม่ใช่ StatusType
  // @see TASK_CLOSING_LOGIC.md, prisma/schema.prisma (StatusType enum)
  statuses: z.array(z.object({
    name: z.string(),
    color: z.string(),
    order: z.number(),
    statusType: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'DONE']),
  })).optional(),
});

/**
 * GET /api/projects
 * List all projects with filters
 */
async function getHandler(req: AuthenticatedRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const search = searchParams.get('search') || '';
  const departmentId = searchParams.get('departmentId') || undefined;
  const status = searchParams.get('status') || undefined;
  const actionPlanId = searchParams.get('actionPlanId') || undefined;
  const includeDeleted = searchParams.get('includeDeleted') === 'true';
  const includeDetails = searchParams.get('includeDetails') === 'true';

  const skip = (page - 1) * limit;

  // Get user's accessible scope (respects primary role + additionalRoles)
  const scope = await getUserAccessibleScope(req.session.userId);

  // Build where clause
  const where: any = includeDeleted ? {} : { dateDeleted: null };

  // Filter by accessible departments (critical security check)
  // Only show projects in departments the user has access to
  if (!scope.isAdmin) {
    where.departmentId = { in: scope.departmentIds };
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (departmentId) {
    // If user provides departmentId, ensure it's in their accessible scope
    if (!scope.isAdmin && !scope.departmentIds.includes(departmentId)) {
      // User requested a department they don't have access to - return empty results
      return successResponse({
        projects: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      });
    }
    where.departmentId = departmentId;
  }

  if (status) {
    where.status = status;
  }

  if (actionPlanId) {
    where.actionPlanId = actionPlanId;
  }

  // Get total count
  const total = await prisma.project.count({ where });

  // Get projects
  const projects = await prisma.project.findMany({
    where,
    skip,
    take: limit,
    include: {
      department: {
        select: {
          id: true,
          name: true,
          divisionId: true,
          division: {
            select: {
              id: true,
              name: true,
              missionGroupId: true,
              missionGroup: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
      owner: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profileImageUrl: true,
        },
      },
      actionPlan: {
        select: {
          id: true,
          name: true,
          itGoalIds: true,
          hospitalMission: {
            select: {
              id: true,
              name: true,
              startYear: true,
              endYear: true,
            },
          },
        },
      },
      _count: {
        select: {
          tasks: true,
          statuses: true,
          phases: true,
        },
      },
      // Include full details if requested (for project management page)
      ...(includeDetails && {
        tasks: {
          select: {
            id: true,
            isClosed: true,
            statusId: true,
            status: {
              select: {
                type: true,
              },
            },
          },
        },
        statuses: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        phases: {
          select: {
            id: true,
            name: true,
            phaseOrder: true,
            startDate: true,
            endDate: true,
          },
          orderBy: {
            phaseOrder: 'asc' as const,
          },
        },
      }),
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return successResponse({
    projects,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  });
}

/**
 * POST /api/projects
 * Create new project
 */
async function postHandler(req: AuthenticatedRequest) {
  try {
    const body = await req.json();
    const data = createProjectSchema.parse(body);

    // Check user's accessible scope
    const scope = await getUserAccessibleScope(req.session.userId);

    // Check if department exists
    const department = await prisma.department.findUnique({
      where: { id: data.departmentId },
    });

    if (!department) {
      return errorResponse('DEPARTMENT_NOT_FOUND', 'Department not found', 404);
    }

    // Verify user has access to this department
    if (!scope.isAdmin && !scope.departmentIds.includes(data.departmentId)) {
      return errorResponse(
        'FORBIDDEN',
        'You do not have permission to create projects in this department',
        403
      );
    }

    // Check if action plan exists (if provided)
    if (data.actionPlanId) {
      const actionPlan = await prisma.actionPlan.findUnique({
        where: { id: data.actionPlanId },
      });

      if (!actionPlan) {
        return errorResponse('ACTION_PLAN_NOT_FOUND', 'Action plan not found', 404);
      }
    }

    // Create project with phases and statuses
    const project = await prisma.project.create({
      data: {
        name: data.name,
        description: data.description || null,
        departmentId: data.departmentId,
        actionPlanId: data.actionPlanId || null,
        status: 'ACTIVE',
        ownerUserId: req.session.userId,
        // Create phases if provided
        phases: data.phases && data.phases.length > 0 ? {
          create: data.phases.map((phase: any) => ({
            name: phase.name,
            phaseOrder: phase.phaseOrder,
            startDate: phase.startDate ? new Date(phase.startDate) : null,
            endDate: phase.endDate ? new Date(phase.endDate) : null,
          })),
        } : undefined,
        // Create statuses if provided
        statuses: data.statuses && data.statuses.length > 0 ? {
          create: data.statuses.map((status: any) => ({
            name: status.name,
            color: status.color,
            order: status.order,
            type: status.statusType,
          })),
        } : undefined,
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            division: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        actionPlan: {
          select: {
            id: true,
            name: true,
          },
        },
        phases: {
          orderBy: {
            phaseOrder: 'asc',
          },
        },
        statuses: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    return successResponse(
      {
        project,
        message: 'Project created successfully',
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withAuth(getHandler);
export const POST = withPermission('create_projects', postHandler);
