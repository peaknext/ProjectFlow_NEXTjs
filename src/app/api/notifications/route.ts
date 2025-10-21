/**
 * GET /api/notifications
 * List user's notifications with filtering and pagination
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/api-middleware';
import type { AuthenticatedRequest } from '@/lib/api-middleware';
import { successResponse, handleApiError } from '@/lib/api-response';

/**
 * GET /api/notifications
 * Get user's notifications
 * Query params:
 * - isRead: boolean (filter by read status)
 * - type: NotificationType (filter by type)
 * - limit: number (default 50, max 100)
 * - offset: number (default 0)
 */
async function handler(req: AuthenticatedRequest) {
  const { searchParams } = new URL(req.url);

  const isReadParam = searchParams.get('isRead');
  const type = searchParams.get('type');
  const limit = Math.min(
    parseInt(searchParams.get('limit') || '50', 10),
    100
  );
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  // Build where clause
  const where: any = {
    userId: req.session.userId,
  };

  if (isReadParam !== null) {
    where.isRead = isReadParam === 'true';
  }

  if (type) {
    where.type = type;
  }

  // Get notifications with user details
  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      include: {
        triggeredBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
            profileImageUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    }),
    prisma.notification.count({ where }),
  ]);

  // Fetch task details separately for notifications that have taskId
  const taskIds = notifications
    .filter((n) => n.taskId)
    .map((n) => n.taskId as string);

  const tasks = taskIds.length > 0
    ? await prisma.task.findMany({
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
      })
    : [];

  const taskMap = new Map(tasks.map((t) => [t.id, t]));

  // Transform to match API response format
  const items = notifications.map((notification) => {
    const task = notification.taskId ? taskMap.get(notification.taskId) : null;
    return {
      id: notification.id,
      type: notification.type,
      message: notification.message,
      isRead: notification.isRead,
      taskId: notification.taskId,
      task: task
        ? {
            id: task.id,
            name: task.name,
            project: task.project,
          }
        : null,
      triggeredBy: notification.triggeredBy,
      createdAt: notification.createdAt.toISOString(),
    };
  });

  return successResponse({
    notifications: items,
    total,
    limit,
    offset,
    hasMore: offset + limit < total,
  });
}

export const GET = withAuth(handler);
