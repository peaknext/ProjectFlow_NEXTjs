import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth, AuthenticatedRequest } from "@/lib/api-middleware";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getUserAccessibleScope } from "@/lib/permissions";
import { calculateProgress } from "@/lib/calculate-progress";
import { buildFiscalYearFilter } from "@/lib/fiscal-year";

/**
 * GET /api/departments/[departmentId]/tasks
 *
 * Get all tasks in a department, grouped by projects
 *
 * Query Parameters:
 * - view: 'grouped' | 'flat' (default: 'grouped')
 * - status: comma-separated status list
 * - priority: comma-separated priority list (1,2,3,4)
 * - assigneeId: filter by assignee
 * - search: search in task name and description
 * - sortBy: field to sort by
 * - sortDir: 'asc' | 'desc'
 * - includeCompleted: boolean (default: false)
 */
async function handler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ departmentId: string }> }
) {
  try {
    const { departmentId } = await params;
    const { searchParams } = new URL(req.url!);

    // Parse query parameters
    const view = searchParams.get("view") || "grouped";
    const statusFilter = searchParams.get("status")?.split(",");
    const priorityFilter = searchParams
      .get("priority")
      ?.split(",")
      .map(Number);
    const assigneeId = searchParams.get("assigneeId");
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "dueDate";
    const sortDir = (searchParams.get("sortDir") || "asc") as "asc" | "desc";
    const includeCompleted = searchParams.get("includeCompleted") === "true";
    const fiscalYearsParam = searchParams.get('fiscalYears');

    // Parse fiscal years: "2567,2568" → [2567, 2568]
    const fiscalYears = fiscalYearsParam
      ? fiscalYearsParam.split(',').map(Number).filter(n => !isNaN(n))
      : [];

    // 1. Check permissions using scope-based access control (supports additionalRoles)
    const scope = await getUserAccessibleScope(req.session.userId);

    // Verify user has access to this specific department
    if (!scope.isAdmin && !scope.departmentIds.includes(departmentId)) {
      return errorResponse(
        "FORBIDDEN",
        "You do not have permission to view tasks in this department",
        403
      );
    }

    // 2. Build task filters
    const taskWhereClause: any = {
      deletedAt: null,
      ...buildFiscalYearFilter(fiscalYears),
    };

    // Filter by status
    if (statusFilter && statusFilter.length > 0) {
      taskWhereClause.status = {
        name: { in: statusFilter },
      };
    }

    // Filter by priority
    if (priorityFilter && priorityFilter.length > 0) {
      taskWhereClause.priority = { in: priorityFilter };
    }

    // Filter by assignee
    if (assigneeId) {
      taskWhereClause.assignees = {
        some: {
          userId: assigneeId,
        },
      };
    }

    // Filter by search query
    if (search) {
      taskWhereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Filter by completed status
    if (!includeCompleted) {
      taskWhereClause.isClosed = false;
    }

    // OPTIMIZED: Parallelize ALL queries for maximum performance
    // Shared user select (optimized - removed redundant email field)
    const userSelect = {
      id: true,
      fullName: true,
      profileImageUrl: true,
    };

    // Execute all queries in parallel
    const [department, projects, currentUser, departmentUsers] = await Promise.all([
      // Query 1: Get department info
      prisma.department.findUnique({
        where: { id: departmentId },
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
      }),

      // Query 2: Get projects with their tasks
      prisma.project.findMany({
        where: {
          departmentId,
          dateDeleted: null,
        },
        include: {
          tasks: {
            where: taskWhereClause,
            include: {
              assignees: {
                select: {
                  user: {
                    select: userSelect,
                  },
                },
              },
              status: {
                select: {
                  id: true,
                  name: true,
                  color: true,
                  type: true,
                  order: true,
                },
              },
              project: {
                select: {
                  id: true,
                  name: true,
                },
              },
              _count: {
                select: {
                  comments: true,
                  checklists: true,
                  subtasks: true,
                },
              },
              checklists: {
                where: { deletedAt: null },
                select: {
                  id: true,
                  isChecked: true,
                },
              },
            },
            orderBy:
              sortBy === "dueDate"
                ? { dueDate: sortDir }
                : sortBy === "priority"
                ? { priority: sortDir }
                : sortBy === "name"
                ? { name: sortDir }
                : { createdAt: sortDir },
          },
          statuses: {
            select: {
              id: true,
              name: true,
              color: true,
              type: true,
              order: true,
            },
            orderBy: {
              order: "asc",
            },
          },
          owner: {
            select: {
              id: true,
              fullName: true,
              profileImageUrl: true,
            },
          },
        },
        orderBy: {
          name: "asc",
        },
      }),

      // Query 3: Get current user's pinned tasks
      prisma.user.findUnique({
        where: { id: req.session.userId },
        select: { pinnedTasks: true },
      }),

      // Query 4: Get all department users for assignee selector
      prisma.user.findMany({
        where: {
          departmentId,
          deletedAt: null,
        },
        select: userSelect,
        orderBy: {
          fullName: "asc",
        },
      }),
    ]);

    // Validate department exists
    if (!department) {
      return errorResponse("NOT_FOUND", "Department not found", 404);
    }

    const pinnedTaskIds = (currentUser?.pinnedTasks as string[]) || [];

    // 5. Calculate stats and enrich data
    let totalTasks = 0;
    let completedTasks = 0;
    let overdueTasks = 0;
    let dueSoonTasks = 0;

    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const enrichedProjects = projects.map((project) => {
      const projectTasks = project.tasks;

      // Calculate project stats
      const projectStats = {
        totalTasks: projectTasks.length,
        completedTasks: projectTasks.filter((t) => t.isClosed).length,
        overdueTasks: projectTasks.filter(
          (t) => !t.isClosed && t.dueDate && new Date(t.dueDate) < now
        ).length,
        dueSoonTasks: projectTasks.filter(
          (t) =>
            !t.isClosed &&
            t.dueDate &&
            new Date(t.dueDate) >= now &&
            new Date(t.dueDate) <= threeDaysFromNow
        ).length,
      };

      // Update department stats
      totalTasks += projectStats.totalTasks;
      completedTasks += projectStats.completedTasks;
      overdueTasks += projectStats.overdueTasks;
      dueSoonTasks += projectStats.dueSoonTasks;

      // Calculate project progress using GAS formula (status order × difficulty)
      const progressResult = calculateProgress(
        projectTasks.map((t) => ({
          difficulty: t.difficulty,
          closeType: t.closeType,
          status: { order: t.status?.order || 1 },
        })),
        project.statuses.map((s) => ({ order: s.order }))
      );
      const progress = progressResult.progress / 100; // calculateProgress returns 0-100, convert to 0-1

      // Get assigned users (unique)
      const assignedUsersMap = new Map();
      projectTasks.forEach((task) => {
        task.assignees?.forEach((assignee) => {
          assignedUsersMap.set(assignee.user.id, assignee.user);
        });
      });
      const assignedUsers = Array.from(assignedUsersMap.values());

      // Enrich tasks with additional fields
      const enrichedTasks = projectTasks.map((task) => {
        const isOverdue =
          !task.isClosed && task.dueDate && new Date(task.dueDate) < now;
        const isDueSoon =
          !task.isClosed &&
          task.dueDate &&
          new Date(task.dueDate) >= now &&
          new Date(task.dueDate) <= threeDaysFromNow;

        // Calculate checklist progress
        const checklistTotal = task.checklists.length;
        const checklistCompleted = task.checklists.filter(
          (c) => c.isChecked
        ).length;

        // Check if task is pinned
        const isPinned = pinnedTaskIds.includes(task.id);

        // Map assignees for multi-assignee support
        const assignees = task.assignees?.map((a) => a.user) || [];
        const assigneeUserIds = assignees.map((a) => a.id);

        return {
          id: task.id,
          name: task.name,
          description: task.description,
          priority: task.priority,
          difficulty: task.difficulty,
          statusId: task.statusId,
          status: task.status,
          dueDate: task.dueDate?.toISOString(),
          startDate: task.startDate?.toISOString(),
          projectId: task.projectId,
          project: task.project,
          creatorUserId: task.creatorUserId, // IMPORTANT: Required for permission checks
          assignees,
          assigneeUserIds,
          createdAt: task.createdAt.toISOString(),
          updatedAt: task.updatedAt.toISOString(),
          isClosed: task.isClosed,
          closeType: task.closeType,
          isPinned,
          isOverdue,
          isDueSoon,
          commentsCount: task._count.comments,
          checklistProgress: {
            completed: checklistCompleted,
            total: checklistTotal,
          },
          subtasksCount: task._count.subtasks,
        };
      });

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        isActive: project.status === "ACTIVE",
        createdAt: project.createdAt.toISOString(),
        progress,
        stats: projectStats,
        assignedUsers,
        owner: project.owner,
        statuses: project.statuses,
        tasks: enrichedTasks,
      };
    });

    // 7. Calculate department overview stats
    const departmentStats = {
      totalTasks,
      completedTasks,
      overdueTasks,
      dueSoonTasks,
      totalProjects: projects.length,
      activeProjects: projects.filter((p) => p.status === "ACTIVE").length,
      completionRate: totalTasks > 0 ? completedTasks / totalTasks : 0,
    };

    // 8. Return response
    return successResponse({
      department: {
        id: department.id,
        name: department.name,
        division: department.division,
      },
      stats: departmentStats,
      projects: enrichedProjects,
      users: departmentUsers,
    });
  } catch (error) {
    console.error("Error fetching department tasks:", error);
    return errorResponse(
      "INTERNAL_ERROR",
      "Failed to fetch department tasks",
      500
    );
  }
}

export const GET = withAuth(handler);
