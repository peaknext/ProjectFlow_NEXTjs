/**
 * GET /api/reports/tasks
 * Get tasks data for reports dashboard with filters
 *
 * Query params:
 * - startDate: ISO date string (default: fiscal year start - Oct 1)
 * - endDate: ISO date string (default: today)
 * - missionGroupId?: Filter by mission group (optional)
 * - divisionId?: Filter by division (optional)
 * - departmentId?: Filter by department (optional)
 *
 * Returns:
 * - tasks: Array of tasks with assignees, creator info
 * - statuses: Array of statuses with TYPE field (critical for grouping)
 * - users: Array of users in scope
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/api-middleware';
import type { AuthenticatedRequest } from '@/lib/api-middleware';
import { successResponse, errorResponse } from '@/lib/api-response';
import { getUserAccessibleScope } from '@/lib/permissions';

/**
 * Get fiscal year start date (Thai fiscal year: Oct 1 - Sep 30)
 */
function getFiscalYearStartDate(): Date {
  const today = new Date();
  const currentMonth = today.getMonth(); // 0-indexed (0 = Jan, 9 = Oct)
  const currentYear = today.getFullYear();

  // If before October (month < 9), use previous year's Oct 1
  // If October or later (month >= 9), use current year's Oct 1
  const fiscalStartYear = currentMonth < 9 ? currentYear - 1 : currentYear;

  return new Date(fiscalStartYear, 9, 1); // Month 9 = October (0-indexed)
}

async function handler(req: AuthenticatedRequest) {
  const { searchParams } = new URL(req.url);

  // Parse date filters with default to last 90 days (prevents unbounded queries)
  const startDateParam = searchParams.get('startDate');
  const endDateParam = searchParams.get('endDate');

  let startDate: Date;
  let endDate: Date;

  // OPTIMIZED: Default to last 90 days if dates not provided (prevents unbounded query)
  if (!startDateParam || !endDateParam) {
    endDate = new Date();
    startDate = new Date();
    startDate.setDate(startDate.getDate() - 90); // 90 days ago
  } else {
    startDate = new Date(startDateParam);
    endDate = new Date(endDateParam);
  }

  // Validate date range
  if (startDate > endDate) {
    return errorResponse(
      'INVALID_DATE_RANGE',
      'Start date must be before or equal to end date',
      400
    );
  }

  // Parse organization filters
  const missionGroupId = searchParams.get('missionGroupId');
  const divisionId = searchParams.get('divisionId');
  const departmentId = searchParams.get('departmentId');

  // Get user's accessible scope (for permission checking)
  const userId = req.session.userId;
  const accessibleScope = await getUserAccessibleScope(userId);

  // Build department filter based on permissions and request
  let departmentFilter: any = {
    deletedAt: null,
  };

  // Apply permission-based filtering
  if (accessibleScope.type === 'department') {
    // User can only see specific departments
    departmentFilter.id = { in: accessibleScope.departmentIds };
  } else if (accessibleScope.type === 'division') {
    // User can see entire divisions
    departmentFilter.divisionId = { in: accessibleScope.divisionIds };
  } else if (accessibleScope.type === 'missionGroup') {
    // User can see entire mission groups
    departmentFilter.division = {
      missionGroupId: { in: accessibleScope.missionGroupIds },
    };
  }
  // else: type === 'all' (ADMIN) - no additional filter

  // Apply user-requested filters (if within permission scope)
  if (departmentId) {
    // Check if user has access to this specific department
    const hasAccess = await prisma.department.findFirst({
      where: {
        id: departmentId,
        ...departmentFilter,
      },
    });

    if (!hasAccess) {
      return errorResponse(
        'FORBIDDEN',
        'You do not have access to this department',
        403
      );
    }

    departmentFilter = { id: departmentId, deletedAt: null };
  } else if (divisionId) {
    // Check if user has access to this division
    const division = await prisma.division.findFirst({
      where: {
        id: divisionId,
        deletedAt: null,
      },
      include: {
        departments: {
          where: departmentFilter,
        },
      },
    });

    if (!division || division.departments.length === 0) {
      return errorResponse(
        'FORBIDDEN',
        'You do not have access to this division',
        403
      );
    }

    departmentFilter = {
      divisionId: divisionId,
      deletedAt: null,
    };
  } else if (missionGroupId) {
    // Check if user has access to this mission group
    const missionGroup = await prisma.missionGroup.findFirst({
      where: {
        id: missionGroupId,
        deletedAt: null,
      },
      include: {
        divisions: {
          include: {
            departments: {
              where: departmentFilter,
            },
          },
        },
      },
    });

    // ADMIN users skip permission check (can access all mission groups)
    if (!accessibleScope.isAdmin) {
      const hasAccessibleDepts = missionGroup?.divisions.some(
        (div) => div.departments.length > 0
      );

      if (!missionGroup || !hasAccessibleDepts) {
        return errorResponse(
          'FORBIDDEN',
          'You do not have access to this mission group',
          403
        );
      }
    } else {
      // For ADMIN, just verify mission group exists
      if (!missionGroup) {
        return errorResponse(
          'NOT_FOUND',
          'Mission group not found',
          404
        );
      }
    }

    departmentFilter = {
      division: {
        missionGroupId: missionGroupId,
      },
      deletedAt: null,
    };
  }

  // Fetch departments based on the filter
  // For ADMIN: Apply filter when organization selectors are used
  // For non-ADMIN: Always apply scope-based filter
  let departmentIds: string[] = [];

  // Always fetch departments using departmentFilter
  const departments = await prisma.department.findMany({
    where: departmentFilter,
    select: { id: true },
  });

  departmentIds = departments.map((d) => d.id);

  if (departmentIds.length === 0) {
    // No departments found matching the filter
    return successResponse({
      tasks: [],
      statuses: [],
      users: [],
    });
  }

  // Build task filter
  const taskFilter: any = {
    deletedAt: null,
    project: {
      dateDeleted: null,
    },
    // Exclude aborted tasks (but include null closeType)
    OR: [
      { closeType: null },
      { closeType: 'COMPLETED' },
    ],
  };

  // Apply date range filter (now always present - defaults to 90 days)
  taskFilter.createdAt = {
    gte: startDate,
    lte: endDate,
  };

  // Apply department filter (for both ADMIN and non-ADMIN users)
  // The departmentIds array was already filtered based on organization selectors above
  taskFilter.project.departmentId = { in: departmentIds };


  // OPTIMIZED: Shared user select
  const userSelect = {
    id: true,
    fullName: true,
    profileImageUrl: true, // Needed for table avatars
  };

  // OPTIMIZED: Parallelize tasks + users queries (both depend only on departmentIds)
  const [tasks, users] = await Promise.all([
    // Query 1: Fetch tasks within date range
    prisma.task.findMany({
      where: taskFilter,
      include: {
        // Multi-assignee support
        assignees: {
          select: {
            user: {
              select: userSelect,
            },
          },
        },
        // Legacy single assignee (for backward compatibility)
        assignee: {
          select: userSelect,
        },
        creator: {
          select: userSelect,
        },
        status: {
          select: {
            id: true,
            name: true,
            color: true,
            order: true,
            type: true, // CRITICAL: Must include TYPE for grouping
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            departmentId: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    }),

    // Query 2: Fetch all users in accessible departments (parallel with tasks)
    prisma.user.findMany({
      where: {
        deletedAt: null,
        // Only filter by department if NOT ADMIN
        ...(accessibleScope.isAdmin ? {} : { departmentId: { in: departmentIds } }),
      },
      select: {
        id: true,
        fullName: true,
        profileImageUrl: true,
        departmentId: true,
        role: true,
      },
      orderBy: {
        fullName: 'asc',
      },
    }),
  ]);

  // Get all unique project IDs from tasks (needed for statuses query)
  const projectIds = [...new Set(tasks.map((t) => t.projectId))];

  // Query 3: Fetch ALL statuses in these projects (depends on tasks results)
  // This ensures we see all status types even if no tasks use them yet
  const statuses = await prisma.status.findMany({
    where: {
      projectId: { in: projectIds },
    },
    select: {
      id: true,
      name: true,
      color: true,
      order: true,
      type: true, // CRITICAL for reports grouping
      projectId: true,
    },
    orderBy: [{ projectId: 'asc' }, { order: 'asc' }],
  });

  // Transform tasks to match expected format
  const transformedTasks = tasks.map((task) => {
    // Combine multi-assignee and legacy assignee
    const assigneeUserIds: string[] = [];
    const assigneesList: any[] = [];

    // Add multi-assignees
    if (task.assignees && task.assignees.length > 0) {
      task.assignees.forEach((ta) => {
        assigneeUserIds.push(ta.user.id);
        assigneesList.push(ta.user);
      });
    }

    // Add legacy assignee if exists and not already in list
    if (task.assignee && !assigneeUserIds.includes(task.assignee.id)) {
      assigneeUserIds.push(task.assignee.id);
      assigneesList.push(task.assignee);
    }

    return {
      id: task.id,
      name: task.name,
      projectId: task.projectId,
      departmentId: task.project.departmentId,
      statusId: task.statusId,
      priority: task.priority,
      difficulty: task.difficulty,
      startDate: task.startDate,
      dueDate: task.dueDate,
      dateCreated: task.createdAt,
      closeDate: task.closeDate,
      closeType: task.closeType,
      isClosed: task.isClosed,
      assigneeUserIds: assigneeUserIds,
      assignees: assigneesList,
      creator: task.creator,
      creatorId: task.creator.id,
      parentTaskId: task.parentTaskId,
      status: task.status,
    };
  });

  return successResponse({
    tasks: transformedTasks,
    statuses: statuses,
    users: users,
  });
}

export const GET = withAuth(handler);
