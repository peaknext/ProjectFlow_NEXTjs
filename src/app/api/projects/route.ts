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

const createProjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().optional(),
  departmentId: z.string().min(1, 'Department ID is required'),
  actionPlanId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'ON_HOLD', 'ARCHIVED']).default('ACTIVE'),
  color: z.string().optional(),
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

  // Build where clause
  const where: any = includeDeleted ? {} : { dateDeleted: null };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (departmentId) {
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

    // Check if department exists
    const department = await prisma.department.findUnique({
      where: { id: data.departmentId },
    });

    if (!department) {
      return errorResponse('DEPARTMENT_NOT_FOUND', 'Department not found', 404);
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

    // Create project
    const project = await prisma.project.create({
      data: {
        name: data.name,
        description: data.description || null,
        departmentId: data.departmentId,
        actionPlanId: data.actionPlanId || null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        status: data.status,
        color: data.color || null,
        ownerUserId: req.session.userId,
        creatorUserId: req.session.userId,
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
      },
    });

    // Create default statuses (Todo, In Progress, Done)
    await prisma.status.createMany({
      data: [
        {
          name: 'Todo',
          color: '#94a3b8',
          order: 1,
          type: 'NOT_STARTED',
          projectId: project.id,
        },
        {
          name: 'In Progress',
          color: '#3b82f6',
          order: 2,
          type: 'IN_PROGRESS',
          projectId: project.id,
        },
        {
          name: 'Done',
          color: '#22c55e',
          order: 3,
          type: 'DONE',
          projectId: project.id,
        },
      ],
    });

    return successResponse(
      {
        project,
        message: 'Project created successfully with default statuses',
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withAuth(getHandler);
export const POST = withPermission('create_projects', postHandler);
