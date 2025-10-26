import { NextRequest } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/lib/api-middleware";
import { successResponse, errorResponse } from "@/lib/api-response";
import { prisma } from "@/lib/db";

/**
 * GET /api/dashboard/activities
 *
 * Returns recent activities (comments + history) for tasks the user is involved with.
 *
 * Scope: Tasks where user is:
 * - Assigned (including cross-department assignments)
 * - Creator
 * - Has commented
 * - In user's primary department
 *
 * This provides a personal activity feed across all user's tasks.
 * Merges and sorts by timestamp DESC, returns latest 30 items.
 *
 * This endpoint is polled every 1 minute by the dashboard.
 *
 * Future extensibility: Can add more activity types (mentions, attachments, etc.)
 */
async function handler(req: AuthenticatedRequest) {
  try {
    const userId = req.session.userId;

    // Get user's department
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        departmentId: true,
      },
    });

    if (!user || !user.departmentId) {
      return errorResponse("NOT_FOUND", "User or department not found", 404);
    }

    // Step 1: Find all tasks user is involved with
    const involvedTasks = await prisma.task.findMany({
      where: {
        OR: [
          // Tasks assigned to user (including cross-department)
          { assignees: { some: { userId } } },
          // Tasks created by user
          { creatorUserId: userId },
          // Tasks user has commented on
          { comments: { some: { commentorUserId: userId, deletedAt: null } } },
          // Tasks in user's department
          { project: { departmentId: user.departmentId } },
        ],
        deletedAt: null,
      },
      select: { id: true },
    });

    const involvedTaskIds = involvedTasks.map((t) => t.id);

    // If user has no involved tasks, return empty
    if (involvedTaskIds.length === 0) {
      return successResponse({ activities: [], count: 0 });
    }

    // Optimized user select (no email for privacy)
    const userSelect = {
      id: true,
      fullName: true,
      profileImageUrl: true,
    };

    // Step 2: Parallel queries for activities from involved tasks
    const [comments, histories] = await Promise.all([
      // Query 1: Comments from involved tasks
      prisma.comment.findMany({
        where: {
          taskId: { in: involvedTaskIds },
          deletedAt: null,
        },
        include: {
          commentor: {
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
        orderBy: { createdAt: "desc" },
        take: 50, // Over-fetch for merging
      }),

      // Query 2: Histories from involved tasks
      prisma.history.findMany({
        where: {
          taskId: { in: involvedTaskIds },
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
        take: 50, // Over-fetch for merging
      }),
    ]);

    // Merge and sort by timestamp
    const activities = [
      // Transform comments
      ...comments.map((c) => ({
        id: `comment-${c.id}`,
        type: "comment" as const,
        timestamp: c.createdAt.toISOString(),
        user: c.commentor,
        content: c.commentText,
        task: {
          id: c.task.id,
          name: c.task.name,
        },
        project: c.task.project,
      })),

      // Transform histories
      ...histories.map((h) => ({
        id: `history-${h.id}`,
        type: "history" as const,
        timestamp: h.historyDate.toISOString(),
        user: h.user,
        content: h.historyText,
        task: {
          id: h.task.id,
          name: h.task.name,
        },
        project: h.task.project,
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 30); // Keep only latest 30

    return successResponse({
      activities,
      count: activities.length,
    });
  } catch (error) {
    console.error("[Activities API] Error:", error);
    return errorResponse(
      "INTERNAL_ERROR",
      `Failed to fetch activities: ${error instanceof Error ? error.message : "Unknown error"}`,
      500
    );
  }
}

export const GET = withAuth(handler);
