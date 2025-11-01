import { NextRequest, NextResponse } from "next/server";
import { withAuth, type AuthenticatedRequest } from "@/lib/api-middleware";
import { successResponse, errorResponse } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import { notifyCommentAdded } from "@/lib/service-request-utils";

/**
 * GET /api/service-requests/:id/comments
 *
 * Get all comments for a service request
 */
async function handleGet(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Check if request exists
  const request = await prisma.serviceRequest.findUnique({
    where: { id },
  });

  if (!request) {
    return errorResponse("NOT_FOUND", "Service request not found", 404);
  }

  // Get comments
  const comments = await prisma.requestComment.findMany({
    where: {
      serviceRequestId: id,
      deletedAt: null,
    },
    include: {
      commentor: {
        select: {
          id: true,
          titlePrefix: true,
          firstName: true,
          lastName: true,
          profileImageUrl: true,
          jobTitle: {
            select: {
              jobTitleTh: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return successResponse({ comments });
}

/**
 * POST /api/service-requests/:id/comments
 *
 * Add comment to service request
 *
 * Body:
 * - commentText: string (required)
 */
async function handlePost(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = req.session.userId;
  const body = await req.json();

  // Validate comment text
  if (!body.commentText || body.commentText.trim().length === 0) {
    return errorResponse("INVALID_INPUT", "Comment text is required", 400);
  }

  // Check if request exists and get current user
  const [request, currentUser] = await Promise.all([
    prisma.serviceRequest.findUnique({
      where: { id },
      select: {
        id: true,
        requestNumber: true,
        requesterId: true,
        approverId: true,
      },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        titlePrefix: true,
        firstName: true,
        lastName: true,
      },
    }),
  ]);

  if (!request) {
    return errorResponse("NOT_FOUND", "Service request not found", 404);
  }

  if (!currentUser) {
    return errorResponse("NOT_FOUND", "User not found", 404);
  }

  // Create comment
  const comment = await prisma.requestComment.create({
    data: {
      serviceRequestId: id,
      commentorUserId: userId,
      commentText: body.commentText.trim(),
    },
    include: {
      commentor: {
        select: {
          id: true,
          titlePrefix: true,
          firstName: true,
          lastName: true,
          profileImageUrl: true,
          jobTitle: {
            select: {
              jobTitleTh: true,
            },
          },
        },
      },
    },
  });

  // Notify requester and approver (if they are not the commenter)
  // Note: Timeline entry removed - only send notification
  const fullName = `${currentUser.titlePrefix}${currentUser.firstName} ${currentUser.lastName}`;
  await notifyCommentAdded(
    id,
    request.requestNumber,
    fullName,
    userId,
    request.requesterId,
    request.approverId
  );

  return successResponse({ comment }, 201);
}

export const GET = withAuth(handleGet);
export const POST = withAuth(handlePost);
