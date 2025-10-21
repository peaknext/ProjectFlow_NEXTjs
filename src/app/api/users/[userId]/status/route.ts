/**
 * PATCH /api/users/:userId/status
 * Update user status (ACTIVE, SUSPENDED, INACTIVE)
 * Requires 'edit_users' permission
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { withPermission } from '@/lib/api-middleware';
import {
  successResponse,
  errorResponse,
  handleApiError,
} from '@/lib/api-response';

const updateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'INACTIVE'], {
    required_error: 'Status is required',
  }),
  reason: z.string().optional(), // Optional reason for status change
});

async function handler(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

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

    // TODO: Log activity
    // await prisma.activityLog.create({
    //   data: {
    //     userId: req.session.userId,
    //     actionType: 'UPDATE',
    //     entityType: 'User',
    //     entityId: userId,
    //     changes: {
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

export const PATCH = withPermission('edit_users', handler);
