/**
 * PATCH /api/notifications/:id/read
 * DELETE /api/notifications/:id
 * Individual notification operations
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/api-middleware';
import type { AuthenticatedRequest } from '@/lib/api-middleware';
import {
  successResponse,
  errorResponse,
  handleApiError,
} from '@/lib/api-response';

/**
 * PATCH /api/notifications/:id
 * Mark notification as read
 */
async function patchHandler(
  req: AuthenticatedRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if notification exists and belongs to user
    const notification = await prisma.notification.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        isRead: true,
      },
    });

    if (!notification) {
      return errorResponse(
        'NOTIFICATION_NOT_FOUND',
        'Notification not found',
        404
      );
    }

    if (notification.userId !== req.session.userId) {
      return errorResponse(
        'FORBIDDEN',
        'Cannot access this notification',
        403
      );
    }

    // Mark as read
    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
      include: {
        triggeredBy: {
          select: {
            id: true,
            fullName: true,
            profileImageUrl: true,
          },
        },
      },
    });

    return successResponse({
      notification: {
        ...updated,
        createdAt: updated.createdAt.toISOString(),
      },
      message: 'Notification marked as read',
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/notifications/:id
 * Delete notification
 */
async function deleteHandler(
  req: AuthenticatedRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  // Check if notification exists and belongs to user
  const notification = await prisma.notification.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
    },
  });

  if (!notification) {
    return errorResponse('NOTIFICATION_NOT_FOUND', 'Notification not found', 404);
  }

  if (notification.userId !== req.session.userId) {
    return errorResponse('FORBIDDEN', 'Cannot delete this notification', 403);
  }

  // Delete notification
  await prisma.notification.delete({
    where: { id },
  });

  return successResponse({
    message: 'Notification deleted successfully',
    notificationId: id,
  });
}

export const PATCH = withAuth(patchHandler);
export const DELETE = withAuth(deleteHandler);
