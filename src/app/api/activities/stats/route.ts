// @ts-nocheck - Prisma type issues
/**
 * GET /api/activities/stats
 * Get activity statistics for analytics and reporting
 * Returns aggregated activity data by time period, user, project, etc.
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth, withPermission } from '@/lib/api-middleware';
import type { AuthenticatedRequest } from '@/lib/api-middleware';
import { successResponse } from '@/lib/api-response';

async function handler(req: AuthenticatedRequest) {
  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') || '7d'; // 7d, 30d, 90d
  const projectId = searchParams.get('projectId');
  const userId = searchParams.get('userId');

  // Calculate date range
  const now = new Date();
  const daysAgo = parseInt(period) || 7;
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - daysAgo);

  // Build where clause
  const where: any = {
    historyDate: {
      gte: startDate,
    },
  };

  if (userId) {
    where.userId = userId;
  }

  if (projectId) {
    // Get task IDs for project
    const tasks = await prisma.task.findMany({
      where: { projectId, deletedAt: null },
      select: { id: true },
    });
    where.taskId = { in: tasks.map((t) => t.id) };
  }

  // Get activity counts
  const [
    totalActivities,
    activitiesByUser,
    recentActivities,
    taskActivities,
  ] = await Promise.all([
    // Total activity count
    prisma.history.count({ where }),

    // Group by user
    prisma.history.groupBy({
      by: ['userId'],
      where,
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    }),

    // Recent activity timeline (group by day)
    prisma.history.findMany({
      where,
      select: {
        historyDate: true,
      },
      orderBy: {
        historyDate: 'desc',
      },
    }),

    // Activity by task (top tasks)
    prisma.history.groupBy({
      by: ['taskId'],
      where,
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    }),
  ]);

  // Get user details for top active users
  const userIds = activitiesByUser.map((a) => a.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      fullName: true,
      profileImageUrl: true,
      role: true,
    },
  });

  const userMap = new Map(users.map((u) => [u.id, u]));

  // Get task details for top tasks
  const taskIds = taskActivities.map((a) => a.taskId);
  const tasks = await prisma.task.findMany({
    where: { id: { in: taskIds } },
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
  });

  const taskMap = new Map(tasks.map((t) => [t.id, t]));

  // Format top users
  const topUsers = activitiesByUser.map((activity) => ({
    user: userMap.get(activity.userId),
    activityCount: activity._count.id,
  }));

  // Format top tasks
  const topTasks = taskActivities.map((activity) => ({
    task: taskMap.get(activity.taskId),
    activityCount: activity._count.id,
  }));

  // Calculate daily activity counts
  const dailyActivityMap = new Map<string, number>();
  recentActivities.forEach((activity) => {
    const dateKey = activity.historyDate.toISOString().split('T')[0];
    dailyActivityMap.set(
      dateKey,
      (dailyActivityMap.get(dateKey) || 0) + 1
    );
  });

  const dailyActivities = Array.from(dailyActivityMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Get additional stats
  const [totalComments, totalNotifications] = await Promise.all([
    prisma.comment.count({
      where: {
        createdAt: { gte: startDate },
        deletedAt: null,
      },
    }),
    prisma.notification.count({
      where: {
        createdAt: { gte: startDate },
      },
    }),
  ]);

  return successResponse({
    period: `${daysAgo}d`,
    startDate: startDate.toISOString(),
    endDate: now.toISOString(),
    stats: {
      totalActivities,
      totalComments,
      totalNotifications,
      averageActivitiesPerDay: (totalActivities / daysAgo).toFixed(2),
    },
    topUsers,
    topTasks,
    dailyActivities,
  });
}

// Require view_analytics permission
export const GET = withAuth(withPermission(handler, 'view_analytics'));
