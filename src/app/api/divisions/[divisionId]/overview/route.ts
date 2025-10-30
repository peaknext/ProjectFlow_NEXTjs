import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth, AuthenticatedRequest } from "@/lib/api-middleware";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getUserAccessibleScope } from "@/lib/permissions";
import { calculateProgress } from "@/lib/calculate-progress";
import { buildFiscalYearFilter } from "@/lib/fiscal-year";

/**
 * GET /api/divisions/[divisionId]/overview
 *
 * Division-level overview for executives (LEADER role)
 * Returns aggregated statistics, department comparisons, chart data, and critical tasks
 *
 * Query Parameters:
 * - startDate: ISO date (optional)
 * - endDate: ISO date (optional)
 * - fiscalYears: comma-separated years (optional)
 * - includeCompleted: boolean (default: false)
 */
async function handler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ divisionId: string }> }
) {
  try {
    const { divisionId } = await params;
    const { searchParams } = new URL(req.url!);

    // Parse query parameters
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const fiscalYearsParam = searchParams.get("fiscalYears");
    const includeCompleted = searchParams.get("includeCompleted") === "true";

    // Parse fiscal years
    const fiscalYears = fiscalYearsParam
      ? fiscalYearsParam.split(",").map(Number).filter((n) => !isNaN(n))
      : [];

    console.log("[Division Overview API] fiscalYearsParam:", fiscalYearsParam);
    console.log("[Division Overview API] fiscalYears parsed:", fiscalYears);

    // 1. Check permissions using scope-based access control
    const scope = await getUserAccessibleScope(req.session.userId);

    // Verify user has access to this specific division
    if (!scope.isAdmin && !scope.divisionIds.includes(divisionId)) {
      return errorResponse(
        "FORBIDDEN",
        "You do not have permission to view this division",
        403
      );
    }

    // 2. Build date filter
    const dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // 3. Build task filters
    const fiscalYearFilter = buildFiscalYearFilter(fiscalYears);
    console.log("[Division Overview API] fiscalYearFilter:", JSON.stringify(fiscalYearFilter, null, 2));

    const taskWhereClause: any = {
      deletedAt: null,
      ...fiscalYearFilter,
      ...dateFilter,
    };

    console.log("[Division Overview API] taskWhereClause:", JSON.stringify(taskWhereClause, null, 2));

    if (!includeCompleted) {
      taskWhereClause.isClosed = false;
    }

    // 3.1. Build project filter (projects with at least 1 task matching fiscal year)
    const projectWhereClause: any = {
      dateDeleted: null,
    };

    // Only show projects that have tasks matching the fiscal year filter
    if (fiscalYears && fiscalYears.length > 0) {
      projectWhereClause.tasks = {
        some: fiscalYearFilter, // At least 1 task in fiscal year
      };
    }

    console.log("[Division Overview API] projectWhereClause:", JSON.stringify(projectWhereClause, null, 2));

    // Shared user select (optimized)
    const userSelect = {
      id: true,
      fullName: true,
      profileImageUrl: true,
    };

    // 4. Execute ALL queries in parallel for maximum performance
    const [division, departments, currentUser] = await Promise.all([
      // Query 1: Get division info
      prisma.division.findUnique({
        where: { id: divisionId },
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
      }),

      // Query 2: Get all departments with their projects and tasks
      prisma.department.findMany({
        where: {
          divisionId,
          deletedAt: null,
        },
        include: {
          projects: {
            where: projectWhereClause,
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
                },
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
            },
          },
          users: {
            where: {
              deletedAt: null,
            },
            select: userSelect,
            orderBy: {
              fullName: "asc",
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
    ]);

    // Validate division exists
    if (!division) {
      return errorResponse("NOT_FOUND", "Division not found", 404);
    }

    const pinnedTaskIds = (currentUser?.pinnedTasks as string[]) || [];

    // 5. Calculate division-level stats
    let totalProjects = 0;
    let activeProjects = 0;
    let totalTasks = 0;
    let completedTasks = 0;
    let abortedTasks = 0;
    let overdueTasks = 0;
    let dueSoonTasks = 0;
    let inProgressTasks = 0;
    let unassignedTasks = 0;

    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    // Arrays for collecting data
    const allTasks: any[] = [];
    const urgentTasks: any[] = [];
    const overdueTasksList: any[] = [];
    const dueSoonTasksList: any[] = [];
    const unassignedTasksList: any[] = [];

    // Priority distribution
    const priorityDistribution = {
      priority1: 0,
      priority2: 0,
      priority3: 0,
      priority4: 0,
    };

    // 6. Process each department
    const departmentSummaries = departments.map((dept) => {
      const deptProjects = dept.projects;
      const deptTasks = deptProjects.flatMap((p) => p.tasks);

      // Count tasks excluding ABORTED
      const deptAbortedTasks = deptTasks.filter(
        (t) => t.isClosed && t.closeType === "ABORTED"
      ).length;
      const totalTasksExcludingAborted = deptTasks.length - deptAbortedTasks;

      // Department stats
      const deptStats = {
        total: deptTasks.length,
        inProgress: deptTasks.filter(
          (t) =>
            !t.isClosed &&
            t.status?.type !== "NOT_STARTED" &&
            t.status?.type !== "DONE"
        ).length,
        completed: deptTasks.filter(
          (t) => t.isClosed && t.closeType === "COMPLETED"
        ).length,
        overdue: deptTasks.filter(
          (t) =>
            !t.isClosed &&
            t.status?.type !== "DONE" &&
            t.dueDate &&
            new Date(t.dueDate) < now
        ).length,
        dueSoon: deptTasks.filter(
          (t) =>
            !t.isClosed &&
            t.dueDate &&
            new Date(t.dueDate) >= now &&
            new Date(t.dueDate) <= threeDaysFromNow
        ).length,
      };

      // Calculate completion rate (excluding ABORTED tasks)
      const completionRate =
        totalTasksExcludingAborted > 0
          ? (deptStats.completed / totalTasksExcludingAborted) * 100
          : 0;

      // Calculate average project progress
      const projectProgresses = deptProjects.map((project) => {
        const progressResult = calculateProgress(
          project.tasks.map((t) => ({
            difficulty: t.difficulty,
            closeType: t.closeType,
            status: { order: t.status?.order || 1 },
          })),
          project.statuses.map((s) => ({ order: s.order }))
        );
        return progressResult.progress / 100; // Convert to 0-1
      });

      const avgProjectProgress =
        projectProgresses.length > 0
          ? projectProgresses.reduce((sum, p) => sum + p, 0) /
            projectProgresses.length
          : 0;

      // Update division totals
      totalProjects += deptProjects.length;
      activeProjects += deptProjects.filter((p) => p.status === "ACTIVE")
        .length;
      totalTasks += deptStats.total;
      completedTasks += deptStats.completed;
      abortedTasks += deptAbortedTasks;
      overdueTasks += deptStats.overdue;
      dueSoonTasks += deptStats.dueSoon;
      inProgressTasks += deptStats.inProgress;

      // Collect tasks for charts and critical sections
      deptTasks.forEach((task) => {
        const enrichedTask = {
          id: task.id,
          name: task.name,
          priority: task.priority,
          statusId: task.statusId,
          status: task.status,
          dueDate: task.dueDate?.toISOString(),
          projectId: task.projectId,
          isClosed: task.isClosed,
          isPinned: pinnedTaskIds.includes(task.id),
          assignees: task.assignees?.map((a) => a.user) || [],
          assigneeUserIds:
            task.assignees?.map((a) => a.user.id) || [],
          departmentId: dept.id,
          departmentName: dept.name,
        };

        allTasks.push(enrichedTask);

        // Collect priority distribution
        if (task.priority === 1) priorityDistribution.priority1++;
        else if (task.priority === 2) priorityDistribution.priority2++;
        else if (task.priority === 3) priorityDistribution.priority3++;
        else if (task.priority === 4) priorityDistribution.priority4++;

        // Collect critical tasks
        if (!task.isClosed) {
          if (task.priority === 1) {
            urgentTasks.push(enrichedTask);
          }
          if (task.dueDate && new Date(task.dueDate) < now) {
            overdueTasksList.push(enrichedTask);
          }
          if (
            task.dueDate &&
            new Date(task.dueDate) >= now &&
            new Date(task.dueDate) <= threeDaysFromNow
          ) {
            dueSoonTasksList.push(enrichedTask);
          }
          if (
            !task.assignees ||
            task.assignees.length === 0
          ) {
            unassignedTasks++;
            unassignedTasksList.push(enrichedTask);
          }
        }
      });

      return {
        id: dept.id,
        name: dept.name,
        projectCount: {
          active: deptProjects.filter((p) => p.status === "ACTIVE").length,
          total: deptProjects.length,
        },
        taskStats: deptStats,
        completionRate: Math.round(completionRate),
        progress: Math.round(avgProjectProgress * 100),
        personnelCount: dept.users.length,
        topPersonnel: dept.users.slice(0, 3),
        riskLevel:
          totalTasksExcludingAborted > 0 &&
          deptStats.overdue / totalTasksExcludingAborted > 0.2
            ? ("high" as const)
            : totalTasksExcludingAborted > 0 &&
              deptStats.overdue / totalTasksExcludingAborted > 0.1
            ? ("medium" as const)
            : ("low" as const),
      };
    });

    // 7. Calculate division stats
    const totalTasksExcludingAborted = totalTasks - abortedTasks;
    const divisionStats = {
      totalDepartments: departments.length,
      activeDepartments: departments.filter(
        (d) => d.projects.some((p) => p.status === "ACTIVE")
      ).length,
      totalProjects,
      activeProjects,
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      dueSoonTasks,
      unassignedTasks,
      avgCompletionRate:
        totalTasksExcludingAborted > 0
          ? (completedTasks / totalTasksExcludingAborted) * 100
          : 0,
      trend: {
        direction: "stable" as const,
        value: 0,
      },
    };

    // 8. Prepare chart data

    // Workload distribution (top 10 departments by task count)
    const workloadData = departmentSummaries
      .map((dept) => ({
        departmentName: dept.name,
        taskCount: dept.taskStats.total,
        completionRate: dept.completionRate,
      }))
      .sort((a, b) => b.taskCount - a.taskCount)
      .slice(0, 10);

    // Status distribution by department
    const statusDistribution = departmentSummaries.map((dept) => ({
      departmentName: dept.name,
      notStarted:
        dept.taskStats.total -
        dept.taskStats.inProgress -
        dept.taskStats.completed,
      inProgress: dept.taskStats.inProgress,
      done: dept.taskStats.completed,
      overdue: dept.taskStats.overdue,
    }));

    // 9. Return response
    return successResponse({
      division: {
        id: division.id,
        name: division.name,
        missionGroup: division.missionGroup,
      },
      stats: divisionStats,
      departments: departmentSummaries,
      charts: {
        workloadDistribution: workloadData,
        priorityDistribution,
        statusDistribution,
      },
      criticalTasks: {
        overdue: overdueTasksList.slice(0, 20),
        urgent: urgentTasks.slice(0, 20),
        dueSoon: dueSoonTasksList.slice(0, 20),
        unassigned: unassignedTasksList.slice(0, 20),
      },
    });
  } catch (error) {
    console.error("Error fetching division overview:", error);
    return errorResponse(
      "INTERNAL_ERROR",
      "Failed to fetch division overview",
      500
    );
  }
}

export const GET = withAuth(handler);
