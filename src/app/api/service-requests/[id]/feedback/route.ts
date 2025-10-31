import { NextRequest, NextResponse } from "next/server";
import { withAuth, type AuthenticatedRequest } from "@/lib/api-middleware";
import { successResponse, errorResponse } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import { createRequestTimeline } from "@/lib/service-request-utils";

/**
 * GET /api/service-requests/:id/feedback
 *
 * Get feedback for a service request
 */
async function handleGet(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Check if request exists
  const request = await prisma.serviceRequest.findUnique({
    where: { id },
    include: {
      feedback: true,
    },
  });

  if (!request) {
    return errorResponse("NOT_FOUND", "Service request not found", 404);
  }

  return successResponse({ feedback: request.feedback });
}

/**
 * POST /api/service-requests/:id/feedback
 *
 * Submit or update feedback for a service request
 *
 * Body:
 * - rating: number (1-10, required)
 * - comment?: string (optional)
 */
async function handlePost(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = req.session.userId;
  const body = await req.json();

  // Validate rating
  if (!body.rating || body.rating < 1 || body.rating > 10) {
    return errorResponse(
      "INVALID_INPUT",
      "Rating must be between 1 and 10",
      400
    );
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
      feedback: true, // ✅ FIXED: Include feedback relation
    },
  });

  if (!existingRequest) {
    return errorResponse("NOT_FOUND", "Service request not found", 404);
  }

  // Only requester can submit feedback
  if (existingRequest.requesterId !== userId) {
    return errorResponse(
      "FORBIDDEN",
      "Only the requester can submit feedback",
      403
    );
  }

  // Only completed requests can receive feedback
  if (existingRequest.status !== "COMPLETED") {
    return errorResponse(
      "FORBIDDEN",
      "Feedback can only be submitted for completed requests",
      403
    );
  }

  // Upsert feedback (create if not exists, update if exists)
  const feedback = await prisma.serviceRequestFeedback.upsert({
    where: { serviceRequestId: id },
    create: {
      serviceRequestId: id,
      rating: body.rating,
      comment: body.comment?.trim() || null,
    },
    update: {
      rating: body.rating,
      comment: body.comment?.trim() || null,
    },
  });

  // Create timeline entry
  const isEdit = existingRequest.feedback !== null;
  await createRequestTimeline(
    id,
    isEdit ? "FEEDBACK_UPDATED" : "FEEDBACK_SUBMITTED",
    `${existingRequest.requester.fullName} ให้คะแนนความพึงพอใจ ${body.rating}/10`,
    userId,
    existingRequest.requester.fullName
  );

  // Notify SUPER_ADMIN/ADMIN if rating is low (≤3)
  if (body.rating <= 3) {
    // Get all SUPER_ADMIN and ADMIN users
    const admins = await prisma.user.findMany({
      where: {
        role: { in: ["SUPER_ADMIN", "ADMIN"] },
      },
      select: {
        id: true,
      },
    });

    // Create notifications for all admins
    await prisma.notification.createMany({
      data: admins.map((admin) => ({
        userId: admin.id,
        type: "SERVICE_REQUEST_LOW_RATING",
        message: `คำร้อง ${existingRequest.requestNumber} ได้รับคะแนนความพึงพอใจต่ำ (${body.rating}/10) - กรุณาตรวจสอบ`,
      })),
    });
  }

  return successResponse({ feedback }, isEdit ? 200 : 201);
}

export const GET = withAuth(handleGet);
export const POST = withAuth(handlePost);
