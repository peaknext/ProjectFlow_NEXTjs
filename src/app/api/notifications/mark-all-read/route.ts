/**
 * POST /api/notifications/mark-all-read
 * Mark all user's notifications as read
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/api-middleware';
import type { AuthenticatedRequest } from '@/lib/api-middleware';
import { successResponse, handleApiError } from '@/lib/api-response';

async function handler(req: AuthenticatedRequest) {
  try {
    // Mark all unread notifications as read
    const result = await prisma.notification.updateMany({
      where: {
        userId: req.session.userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return successResponse({
      message: 'All notifications marked as read',
      markedCount: result.count,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export const POST = withAuth(handler);
