/**
 * GET /api/activities/recent
 * Get recent activities for dashboard view
 * Returns combined feed of user's activities, assigned tasks, and mentions
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/api-middleware';
import type { AuthenticatedRequest } from '@/lib/api-middleware';
import { successResponse } from '@/lib/api-response';

async function handler(req: AuthenticatedRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(
    parseInt(searchParams.get('limit') || '20', 10),
    50
  );

  // Get user's recent activities (tasks they created/updated)
  const userActivities = await prisma.history.findMany({
    where: {
      userId: req.session.userId,
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
    orderBy: {
      historyDate: 'desc',
    },
    take: limit,
  });

  // Get recent notifications
  const recentNotifications = await prisma.notification.findMany({
    where: {
      userId: req.session.userId,
    },
    include: {
      triggeredBy: {
        select: {
          id: true,
          fullName: true,
          profileImageUrl: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  });

  // Fetch task details for notifications with taskId
  const notifTaskIds = recentNotifications
    .filter((n) => n.taskId)
    .map((n) => n.taskId as string);

  const notifTasks = notifTaskIds.length > 0
    ? await prisma.task.findMany({
        where: { id: { in: notifTaskIds } },
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
      })
    : [];

  const notifTaskMap = new Map(notifTasks.map((t) => [t.id, t]));

  // Get recent comments on user's tasks
  const assignedTaskIds = await prisma.task.findMany({
    where: {
      assigneeUserId: req.session.userId,
      deletedAt: null,
    },
    select: { id: true },
  });

  const recentComments = await prisma.comment.findMany({
    where: {
      taskId: { in: assignedTaskIds.map((t) => t.id) },
      commentorUserId: { not: req.session.userId }, // Exclude own comments
      deletedAt: null,
    },
    include: {
      commentor: {
        select: {
          id: true,
          fullName: true,
          profileImageUrl: true,
        },
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
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  });

  // Combine and format all activities
  const activities: any[] = [];

  // Add user activities
  userActivities.forEach((activity) => {
    activities.push({
      type: 'activity',
      id: activity.id,
      description: activity.historyText,
      timestamp: activity.historyDate.toISOString(),
      task: activity.task,
    });
  });

  // Add notifications
  recentNotifications.forEach((notification) => {
    const task = notification.taskId ? notifTaskMap.get(notification.taskId) : null;
    activities.push({
      type: 'notification',
      id: notification.id,
      description: notification.message,
      timestamp: notification.createdAt.toISOString(),
      isRead: notification.isRead,
      triggeredBy: notification.triggeredBy,
      task: task || null,
      notificationType: notification.type,
    });
  });

  // Add recent comments
  recentComments.forEach((comment) => {
    activities.push({
      type: 'comment',
      id: comment.id,
      description: comment.commentText,
      timestamp: comment.createdAt.toISOString(),
      commentor: comment.commentor,
      task: comment.task,
    });
  });

  // Sort all activities by timestamp (newest first)
  activities.sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  // Limit to requested amount
  const limitedActivities = activities.slice(0, limit);

  return successResponse({
    activities: limitedActivities,
    total: limitedActivities.length,
    hasActivities: limitedActivities.length > 0,
  });
}

export const GET = withAuth(handler);
