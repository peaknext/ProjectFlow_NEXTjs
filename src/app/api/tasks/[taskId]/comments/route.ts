/**
 * GET /api/tasks/:taskId/comments
 * POST /api/tasks/:taskId/comments
 * Task comments management
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/api-middleware';
import type { AuthenticatedRequest } from '@/lib/api-middleware';
import {
  successResponse,
  errorResponse,
  handleApiError,
} from '@/lib/api-response';

const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required'),
  mentionedUserIds: z.array(z.string()).optional(),
});

/**
 * GET /api/tasks/:taskId/comments
 * List all comments for task
 */
async function getHandler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;

  // Check if task exists
  const task = await prisma.task.findUnique({
    where: { id: taskId, deletedAt: null },
    select: { id: true },
  });

  if (!task) {
    return errorResponse('TASK_NOT_FOUND', 'Task not found', 404);
  }

  const comments = await prisma.comment.findMany({
    where: {
      taskId,
      deletedAt: null,
    },
    include: {
      commentor: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profileImageUrl: true,
          jobTitle: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return successResponse({
    comments: comments.map((comment) => ({
      id: comment.id,
      taskId: comment.taskId,
      text: comment.commentText,
      user: comment.commentor,
      mentions: comment.mentions,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
    })),
    total: comments.length,
  });
}

/**
 * POST /api/tasks/:taskId/comments
 * Add new comment
 */
async function postHandler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;

    // Check if task exists
    const task = await prisma.task.findUnique({
      where: { id: taskId, deletedAt: null },
      select: {
        id: true,
        name: true,
        projectId: true,
        assigneeUserId: true,
        creatorUserId: true,
      },
    });

    if (!task) {
      return errorResponse('TASK_NOT_FOUND', 'Task not found', 404);
    }

    const body = await req.json();
    const { content, mentionedUserIds = [] } = createCommentSchema.parse(body);

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        taskId,
        commentorUserId: req.session.userId,
        commentText: content,
        mentions: mentionedUserIds.length > 0 ? mentionedUserIds : null,
      },
      include: {
        commentor: {
          select: {
            id: true,
            fullName: true,
            email: true,
            profileImageUrl: true,
          },
        },
      },
    });

    // Log history
    const commentPreview = content.length > 50 ? content.substring(0, 50) + '...' : content;
    await prisma.history.create({
      data: {
        taskId,
        userId: req.session.userId,
        historyText: `แสดงความคิดเห็นในงาน "${task.name}" : ${commentPreview}`,
      },
    });

    // Notify mentioned users (if any)
    // TODO: Implement notification system
    // if (mentionedUserIds.length > 0) {
    //   await prisma.notification.createMany({
    //     data: mentionedUserIds.map(userId => ({
    //       userId,
    //       type: 'MENTIONED_IN_COMMENT',
    //       title: 'คุณถูกกล่าวถึงในความคิดเห็น',
    //       message: `${comment.commentor.fullName} กล่าวถึงคุณในงาน: ${task.name}`,
    //       link: `/projects/${task.projectId}?task=${taskId}`,
    //       triggeredByUserId: req.session.userId,
    //     })),
    //   },
    // });

    // TODO: Implement notification system when Notification model is configured
    // Create notifications for mentioned users
    // if (mentionedUserIds.length > 0) {
    //   for (const userId of mentionedUserIds) {
    //     if (userId !== req.session.userId) {
    //       await prisma.notification.create({
    //         data: {
    //           userId,
    //           type: 'COMMENT_MENTION',
    //           title: 'คุณถูกกล่าวถึงในความคิดเห็น',
    //           message: `${req.session.user.fullName} กล่าวถึงคุณในงาน: ${task.name}`,
    //           link: `/projects/${task.projectId}?task=${taskId}`,
    //         },
    //       });
    //     }
    //   }
    // }

    return successResponse(
      {
        comment: {
          id: comment.id,
          taskId: comment.taskId,
          text: comment.commentText,
          user: comment.commentor,
          mentions: comment.mentions,
          createdAt: comment.createdAt.toISOString(),
        },
        message: 'Comment added successfully',
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);
