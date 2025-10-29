import { NextRequest } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/lib/api-middleware";
import { successResponse, errorResponse } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import { getUserAccessibleScope } from "@/lib/permissions";
import { buildFiscalYearFilter } from "@/lib/fiscal-year";

/**
 * GET /api/dashboard
 *
 * Returns dashboard data for the current user based on their role:
 * - ADMIN/CHIEF: System-wide or mission group data
 * - LEADER: Division-level data
 * - HEAD: Department-level data
 * - MEMBER/USER: Personal tasks only
 *
 * Query params (separate pagination for each widget):
 * - myCreatedTasksLimit: Number of created tasks to return (default: 10)
 * - myCreatedTasksOffset: Pagination offset for created tasks (default: 0)
 * - assignedToMeTasksLimit: Number of assigned tasks to return (default: 10)
 * - assignedToMeTasksOffset: Pagination offset for assigned tasks (default: 0)
 */
async function handler(req: AuthenticatedRequest) {
  try {
    const userId = req.session.userId;
    const { searchParams } = new URL(req.url);

    // Separate pagination for each widget
    const myCreatedTasksLimit = parseInt(searchParams.get("myCreatedTasksLimit") || "10");
    const myCreatedTasksOffset = parseInt(searchParams.get("myCreatedTasksOffset") || "0");
    const assignedToMeTasksLimit = parseInt(searchParams.get("assignedToMeTasksLimit") || "10");
    const assignedToMeTasksOffset = parseInt(searchParams.get("assignedToMeTasksOffset") || "0");

    // Fiscal year filter
    const fiscalYearsParam = searchParams.get('fiscalYears');
    const fiscalYears = fiscalYearsParam
      ? fiscalYearsParam.split(',').map(Number).filter(n => !isNaN(n))
      : [];
    const fiscalYearFilter = buildFiscalYearFilter(fiscalYears);

    // Get user details with role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        departmentId: true,
        department: {
          select: {
            divisionId: true,
            division: {
              select: {
                missionGroupId: true,
              },
            },
          },
        },
        pinnedTasks: true,
      },
    });

    if (!user) {
      return errorResponse("NOT_FOUND", "User not found", 404);
    }

    // Get accessible scope based on role
    let scope;
    try {
      scope = await getUserAccessibleScope(userId);
    } catch (scopeError) {
      console.error('[Dashboard API] getUserAccessibleScope error:', scopeError);
      return errorResponse('INTERNAL_ERROR', 'Failed to get user scope', 500);
    }

    // Get current date for "this week" calculation
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    // Date range for calendar tasks (±1 month)
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(now.getMonth() - 1);
    const oneMonthFromNow = new Date(now);
    oneMonthFromNow.setMonth(now.getMonth() + 1);

    // Base task query filter based on role
    let taskWhereClause: any = {
      deletedAt: null,
      ...fiscalYearFilter,
    };

    if (user.role === "ADMIN" || user.role === "CHIEF") {
      // ADMIN/CHIEF: All tasks in accessible scope
      if (scope.missionGroupIds.length > 0) {
        taskWhereClause.project = {
          department: {
            division: {
              missionGroupId: { in: scope.missionGroupIds },
            },
          },
        };
      }
    } else if (user.role === "LEADER") {
      // LEADER: Tasks in their divisions
      if (scope.divisionIds.length > 0) {
        taskWhereClause.project = {
          department: {
            divisionId: { in: scope.divisionIds },
          },
        };
      } else {
      }
    } else if (user.role === "HEAD") {
      // HEAD: Tasks in their department
      taskWhereClause.project = {
        departmentId: user.departmentId,
      };
    } else {
      // MEMBER/USER: Only assigned tasks
      taskWhereClause.assignees = {
        some: { userId },
      };
    }

    // OPTIMIZED: Parallelize ALL queries for maximum performance

    // Shared user select for all task queries (optimized - removed redundant fields)
    const userSelect = {
      id: true,
      fullName: true,
      profileImageUrl: true,
    };

    // Shared project select for all task queries (includes department for cross-department task identification)
    const projectSelect = {
      id: true,
      name: true,
      department: {
        select: {
          id: true,
          name: true,
        },
      },
    };

    // Pinned task IDs for conditional query
    const pinnedTaskIds = (user.pinnedTasks as string[]) || [];

    // Execute all queries in parallel for optimal performance
    const [
      totalTasks,
      completedTasks,
      overdueCount,
      thisWeekTasks,
      overdueTasks,
      pinnedTasks,
      myCreatedTasksData,
      myCreatedTasksTotal,
      assignedToMeTasksData,
      assignedToMeTasksTotal,
      calendarTasks,
      recentActivities,
      myChecklists,
    ] = await Promise.all([
      // 1. STATS - Total tasks
      prisma.task.count({ where: taskWhereClause }),

      // 2. STATS - Completed tasks (isClosed = true, closeType = COMPLETED)
      prisma.task.count({
        where: {
          ...taskWhereClause,
          isClosed: true,
          closeType: "COMPLETED",
        },
      }),

      // 3. STATS - Overdue tasks count (dueDate < now, not closed)
      prisma.task.count({
        where: {
          ...taskWhereClause,
          isClosed: false,
          dueDate: { lt: now },
        },
      }),

      // 4. STATS - This week tasks (dueDate within this week)
      prisma.task.count({
        where: {
          ...taskWhereClause,
          isClosed: false,
          dueDate: {
            gte: startOfWeek,
            lt: endOfWeek,
          },
        },
      }),

      // 5. OVERDUE TASKS - Get overdue tasks with details (top 5)
      prisma.task.findMany({
        where: {
          assignees: {
            some: { userId },
          },
          isClosed: false,
          dueDate: { lt: now },
          deletedAt: null,
        },
        include: {
          assignees: {
            include: {
              user: {
                select: userSelect,
              },
            },
          },
          project: {
            select: projectSelect,
          },
          status: {
            select: {
              id: true,
              name: true,
              color: true,
              type: true,
            },
          },
        },
        orderBy: { dueDate: "asc" },
        take: 5,
      }),

      // 6. PINNED TASKS - Get pinned tasks
      pinnedTaskIds.length > 0
        ? prisma.task.findMany({
            where: {
              id: { in: pinnedTaskIds },
              deletedAt: null,
            },
            include: {
              assignees: {
                include: {
                  user: {
                    select: userSelect,
                  },
                },
              },
              project: {
                select: projectSelect,
              },
              status: {
                select: {
                  id: true,
                  name: true,
                  color: true,
                  type: true,
                },
              },
            },
            orderBy: { updatedAt: "desc" },
          })
        : Promise.resolve([]),

      // 7. MY CREATED TASKS - Get tasks user created with pagination
      prisma.task.findMany({
        where: {
          creatorUserId: userId,
          deletedAt: null,
          ...fiscalYearFilter,
        },
        include: {
          assignees: {
            include: {
              user: {
                select: userSelect,
              },
            },
          },
          project: {
            select: projectSelect,
          },
          status: {
            select: {
              id: true,
              name: true,
              color: true,
              type: true,
            },
          },
        },
        orderBy: [{ dueDate: "asc" }, { priority: "asc" }],
        skip: myCreatedTasksOffset,
        take: myCreatedTasksLimit,
      }),

      // 8. MY CREATED TASKS - Count total for pagination
      prisma.task.count({
        where: {
          creatorUserId: userId,
          deletedAt: null,
          ...fiscalYearFilter,
        },
      }),

      // 9. ASSIGNED TO ME TASKS - Get tasks assigned to user (exclude tasks they created)
      prisma.task.findMany({
        where: {
          assignees: {
            some: { userId },
          },
          creatorUserId: { not: userId }, // Exclude tasks user created
          deletedAt: null,
          ...fiscalYearFilter,
        },
        include: {
          assignees: {
            include: {
              user: {
                select: userSelect,
              },
            },
          },
          project: {
            select: projectSelect,
          },
          status: {
            select: {
              id: true,
              name: true,
              color: true,
              type: true,
            },
          },
        },
        orderBy: [{ dueDate: "asc" }, { priority: "asc" }],
        skip: assignedToMeTasksOffset,
        take: assignedToMeTasksLimit,
      }),

      // 10. ASSIGNED TO ME TASKS - Count total for pagination (exclude tasks user created)
      prisma.task.count({
        where: {
          assignees: {
            some: { userId },
          },
          creatorUserId: { not: userId }, // Exclude tasks user created
          deletedAt: null,
          ...fiscalYearFilter,
        },
      }),

      // 11. CALENDAR TASKS - Get tasks with due dates (OPTIMIZED: date range + limit)
      prisma.task.findMany({
        where: {
          assignees: {
            some: { userId },
          },
          dueDate: {
            gte: oneMonthAgo,
            lte: oneMonthFromNow,
          },
          deletedAt: null,
        },
        include: {
          assignees: {
            include: {
              user: {
                select: userSelect,
              },
            },
          },
          project: {
            select: projectSelect,
          },
          status: {
            select: {
              id: true,
              name: true,
              color: true,
              type: true,
            },
          },
        },
        orderBy: { dueDate: "asc" },
        take: 100, // Safety limit
      }),

      // 12. RECENT ACTIVITIES - Get recent activities from team
      prisma.history.findMany({
        where: {
          task: {
            project: {
              departmentId: user.departmentId,
            },
            deletedAt: null,
          },
        },
        include: {
          user: {
            select: userSelect,
          },
          task: {
            select: {
              id: true,
              name: true,
              project: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { historyDate: "desc" },
        take: 5,
      }),

      // 13. MY CHECKLISTS - Get checklists from assigned tasks OR created tasks
      prisma.checklist.findMany({
        where: {
          deletedAt: null, // Filter out deleted checklist items
          task: {
            OR: [
              {
                // Tasks where user is assigned
                assignees: {
                  some: { userId },
                },
              },
              {
                // Tasks created by user
                creatorUserId: userId,
              },
            ],
            deletedAt: null,
            ...fiscalYearFilter,
          },
        },
        include: {
          task: {
            select: {
              id: true,
              name: true,
              project: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdDate: "asc" },
        take: 10,
      }),
    ]);

    const myCreatedTasksHasMore = myCreatedTasksOffset + myCreatedTasksLimit < myCreatedTasksTotal;
    const assignedToMeTasksHasMore = assignedToMeTasksOffset + assignedToMeTasksLimit < assignedToMeTasksTotal;

    // Group checklists by task
    const checklistsByTask = myChecklists.reduce((acc, checklist) => {
      const taskId = checklist.taskId;
      if (!acc[taskId]) {
        acc[taskId] = {
          taskId: checklist.task.id,
          taskName: checklist.task.name,
          projectName: checklist.task.project.name,
          items: [],
        };
      }
      acc[taskId].items.push({
        id: checklist.id,
        name: checklist.name,
        isChecked: checklist.isChecked,
      });
      return acc;
    }, {} as Record<string, any>);

    const myChecklistsGrouped = Object.values(checklistsByTask);

    // Return dashboard data
    return successResponse({
      stats: {
        totalTasks,
        completedTasks,
        overdueTasks: overdueCount,
        thisWeekTasks,
      },
      overdueTasks,
      pinnedTasks,
      myCreatedTasks: {
        tasks: myCreatedTasksData,
        total: myCreatedTasksTotal,
        hasMore: myCreatedTasksHasMore,
      },
      assignedToMeTasks: {
        tasks: assignedToMeTasksData,
        total: assignedToMeTasksTotal,
        hasMore: assignedToMeTasksHasMore,
      },
      calendarTasks,
      recentActivities,
      myChecklists: myChecklistsGrouped,
    });
  } catch (error) {
    console.error("[Dashboard API] Error fetching dashboard data:", error);
    console.error("[Dashboard API] Error stack:", error instanceof Error ? error.stack : 'No stack trace');
    return errorResponse(
      "INTERNAL_ERROR",
      `Failed to fetch dashboard data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500
    );
  }
}

export const GET = withAuth(handler);
