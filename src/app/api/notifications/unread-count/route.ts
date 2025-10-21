/**
 * GET /api/notifications/unread-count
 * Get count of unread notifications (for badge display)
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/api-middleware';
import type { AuthenticatedRequest } from '@/lib/api-middleware';
import { successResponse } from '@/lib/api-response';

async function handler(req: AuthenticatedRequest) {
  // Count unread notifications
  const count = await prisma.notification.count({
    where: {
      userId: req.session.userId,
      isRead: false,
    },
  });

  return successResponse({
    unreadCount: count,
  });
}

export const GET = withAuth(handler);
