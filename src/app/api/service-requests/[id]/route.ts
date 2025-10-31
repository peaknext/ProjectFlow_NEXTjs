import { NextRequest, NextResponse } from "next/server";
import { withAuth, type AuthenticatedRequest } from "@/lib/api-middleware";
import { successResponse, errorResponse } from "@/lib/api-response";
import { prisma } from "@/lib/db";

/**
 * GET /api/service-requests/:id
 *
 * Get service request details with related data
 */
async function handleGet(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const serviceRequest = await prisma.serviceRequest.findUnique({
    where: { id },
    include: {
      requester: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profileImageUrl: true,
          departmentId: true,
          department: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      approver: {
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
          statusId: true,
          isClosed: true,
          priority: true,
          dueDate: true,
          projectId: true,
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      timeline: {
        orderBy: {
          createdAt: "desc",
        },
      },
      comments: {
        where: {
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
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!serviceRequest) {
    return errorResponse("NOT_FOUND", "Service request not found", 404);
  }

  return successResponse({ serviceRequest });
}

/**
 * PATCH /api/service-requests/:id
 *
 * Update service request (requester can update pending requests)
 *
 * Body:
 * - subject?: string
 * - description?: string
 * - purpose?: string
 * - purposeOther?: string
 * - deadline?: number
 * - issueTime?: string
 */
async function handlePatch(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = req.session.userId;
  const body = await req.json();

  // Get existing request
  const existingRequest = await prisma.serviceRequest.findUnique({
    where: { id },
  });

  if (!existingRequest) {
    return errorResponse("NOT_FOUND", "Service request not found", 404);
  }

  // Only requester can update, and only if status is PENDING
  if (existingRequest.requesterId !== userId) {
    return errorResponse(
      "FORBIDDEN",
      "Only the requester can update this request",
      403
    );
  }

  if (existingRequest.status !== "PENDING") {
    return errorResponse(
      "FORBIDDEN",
      "Cannot update request after it has been processed",
      403
    );
  }

  // Update request
  const updatedRequest = await prisma.serviceRequest.update({
    where: { id },
    data: {
      subject: body.subject?.trim() || undefined,
      description: body.description?.trim() || undefined,
      purpose: body.purpose || undefined,
      purposeOther: body.purposeOther || undefined,
      deadline: body.deadline || undefined,
      issueTime: body.issueTime ? new Date(body.issueTime) : undefined,
    },
    include: {
      requester: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  return successResponse({ serviceRequest: updatedRequest });
}

/**
 * DELETE /api/service-requests/:id
 *
 * Cancel/delete service request (soft delete)
 * Only requester can cancel, and only if status is PENDING
 */
async function handleDelete(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = req.session.userId;

  // Get existing request
  const existingRequest = await prisma.serviceRequest.findUnique({
    where: { id },
  });

  if (!existingRequest) {
    return errorResponse("NOT_FOUND", "Service request not found", 404);
  }

  // Only requester can cancel, and only if status is PENDING
  if (existingRequest.requesterId !== userId) {
    return errorResponse(
      "FORBIDDEN",
      "Only the requester can cancel this request",
      403
    );
  }

  if (existingRequest.status !== "PENDING") {
    return errorResponse(
      "FORBIDDEN",
      "Cannot cancel request after it has been processed",
      403
    );
  }

  // Update status to CANCELLED
  const cancelledRequest = await prisma.serviceRequest.update({
    where: { id },
    data: {
      status: "CANCELLED",
    },
  });

  // Create timeline entry
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { fullName: true },
  });

  await prisma.requestTimeline.create({
    data: {
      serviceRequestId: id,
      action: "CANCELLED",
      description: `${user?.fullName} ยกเลิกคำร้อง`,
      userId,
      userName: user?.fullName || undefined,
    },
  });

  return successResponse({ serviceRequest: cancelledRequest });
}

export const GET = withAuth(handleGet);
export const PATCH = withAuth(handlePatch);
export const DELETE = withAuth(handleDelete);
