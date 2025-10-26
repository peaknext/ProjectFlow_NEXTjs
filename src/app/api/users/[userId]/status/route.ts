/**
 * PATCH /api/users/:userId/status
 * Update user status (ACTIVE, SUSPENDED, INACTIVE)
 * Requires management scope permission
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import {
  successResponse,
  errorResponse,
  handleApiError,
} from '@/lib/api-response';
import { canManageTargetUser } from '@/lib/permissions';

const updateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'INACTIVE'], {
    required_error: 'Status is required',
  }),
  reason: z.string().optional(), // Optional reason for status change
});

async function handler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const currentUserId = req.session.userId;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        email: true,
        fullName: true,
        userStatus: true,
      },
    });

    if (!existingUser) {
      return errorResponse('USER_NOT_FOUND', 'User not found', 404);
    }

    // Check if current user can manage target user (scope-based permission)
    const canManage = await canManageTargetUser(currentUserId, userId);
    if (!canManage) {
      return errorResponse(
        'FORBIDDEN',
        'You do not have permission to change this user\'s status',
        403
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const { status, reason } = updateStatusSchema.parse(body);

    // Update user status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        userStatus: status,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        userStatus: true,
        updatedAt: true,
      },
    });

    // If suspended or inactive, invalidate all sessions
    if (status === 'SUSPENDED' || status === 'INACTIVE') {
      await prisma.session.deleteMany({
        where: { userId },
      });
    }

    // TODO: Log activity (Note: User status changes don't have associated taskId)
    // This would require a separate UserHistory table or different logging approach
    // await prisma.history.create({
    //   data: {
    //     userId: req.session.userId,
    //     taskId: '???', // No taskId for user status changes
    //     historyText: `Updated user status to ${status}`,
    //       before: { status: existingUser.userStatus },
    //       after: { status },
    //       reason,
    //     },
    //   },
    // });

    return successResponse({
      user: updatedUser,
      message: `User status updated to ${status}`,
      sessionsInvalidated: status !== 'ACTIVE',
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export const PATCH = withAuth(handler);
