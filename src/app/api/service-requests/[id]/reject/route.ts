import { NextRequest, NextResponse } from "next/server";
import { withAuth, type AuthenticatedRequest } from "@/lib/api-middleware";
import { successResponse, errorResponse } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import { checkPermission } from "@/lib/permissions";
import { createRequestTimeline, notifyRequester } from "@/lib/service-request-utils";

/**
 * POST /api/service-requests/:id/reject
 *
 * Reject service request with reason
 *
 * Body:
 * - reason: string (required - rejection reason)
 */
async function handlePost(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = req.session.userId;
  const body = await req.json();

  // Validate approver has permission
  const hasPermission = await checkPermission(
    userId,
    "it_service.approve_requests",
    {}
  );

  if (!hasPermission) {
    return errorResponse(
      "FORBIDDEN",
      "You do not have permission to reject requests",
      403
    );
  }

  // Validate reason is provided
  if (!body.reason || body.reason.trim().length === 0) {
    return errorResponse("INVALID_INPUT", "Rejection reason is required", 400);
  }

  // Get existing request
  const existingRequest = await prisma.serviceRequest.findUnique({
    where: { id },
    include: {
      requester: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
  });

  if (!existingRequest) {
    return errorResponse("NOT_FOUND", "Service request not found", 404);
  }

  // Check if already processed
  if (existingRequest.status !== "PENDING") {
    return errorResponse(
      "FORBIDDEN",
      `Cannot reject request with status ${existingRequest.status}`,
      403
    );
  }

  // Get approver info
  const approver = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      jobTitle: true,
    },
  });

  if (!approver) {
    return errorResponse("NOT_FOUND", "Approver not found", 404);
  }

  const approverName = approver.fullName || `${approver.firstName} ${approver.lastName}`;
  const approverJobTitle = approver.jobTitle?.jobTitleTh || null;

  // Update service request
  const rejectedRequest = await prisma.serviceRequest.update({
    where: { id },
    data: {
      status: "REJECTED",
      approverId: userId,
      approverName,
      approverJobTitle,
      approvedAt: new Date(), // Store rejection time in approvedAt field
    },
    include: {
      requester: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
      approver: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
  });

  // Create timeline entry
  await createRequestTimeline(
    id,
    "REJECTED",
    `${approverName} ไม่อนุมัติคำร้อง: ${body.reason.trim()}`,
    userId,
    approverName
  );

  // Notify requester
  await notifyRequester(
    existingRequest.requesterId,
    existingRequest.requestNumber,
    "REJECTED",
    approverName,
    body.reason.trim()
  );

  return successResponse({ serviceRequest: rejectedRequest });
}

export const POST = withAuth(handlePost);
