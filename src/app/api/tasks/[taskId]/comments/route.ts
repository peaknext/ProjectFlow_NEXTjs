// @ts-nocheck - Prisma type issues
/**
 * GET /api/tasks/:taskId/comments
 * POST /api/tasks/:taskId/comments
 * Task comments management
 *
 * Security:
 * - VULN-009 Fix: Input sanitization to prevent XSS
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
import { sanitizeHtml } from '@/lib/sanitize';

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

    // Sanitize comment content to prevent XSS
    // Security: VULN-009 Fix - Remove dangerous HTML/scripts
    const sanitizedContent = sanitizeHtml(content);

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        taskId,
        commentorUserId: req.session.userId,
        commentText: sanitizedContent,
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
    const commentPreview = sanitizedContent.length > 50 ? sanitizedContent.substring(0, 50) + '...' : sanitizedContent;
    await prisma.history.create({
      data: {
        taskId,
        userId: req.session.userId,
        historyText: `แสดงความคิดเห็นในงาน "${task.name}" : ${commentPreview}`,
      },
    });

    // Create notifications for mentioned users
    if (mentionedUserIds.length > 0) {
      const currentUserFullName = req.session.user.fullName;

      // Fetch mentioned users to validate they exist
      const mentionedUsers = await prisma.user.findMany({
        where: { id: { in: mentionedUserIds } },
        select: { id: true },
      });

      const validUserIds = mentionedUsers.map(u => u.id);

      // Create notification for each mentioned user (except self)
      const notificationData = validUserIds
        .filter(userId => userId !== req.session.userId) // Don't notify self
        .map(userId => ({
          userId,
          type: 'COMMENT_MENTION',
          message: `${currentUserFullName} ได้แท็กคุณในความคิดเห็น`,
          taskId,
          triggeredByUserId: req.session.userId,
        }));

      if (notificationData.length > 0) {
        await prisma.notification.createMany({
          data: notificationData,
        });
      }
    }

    // ✅ TASK OWNER NOTIFICATION: Notify task creator about all comments (not just mentions)
    const taskCreatorId = task.creatorUserId;
    if (
      taskCreatorId &&
      taskCreatorId !== req.session.userId && // Owner is not the one commenting
      !mentionedUserIds.includes(taskCreatorId) // Owner is not already mentioned (avoid duplicate)
    ) {
      await prisma.notification.create({
        data: {
          userId: taskCreatorId,
          type: 'COMMENT_MENTION',
          message: `${req.session.user.fullName} แสดงความคิดเห็นในงาน "${task.name}" ของคุณ`,
          taskId,
          triggeredByUserId: req.session.userId,
        },
      });
    }

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
