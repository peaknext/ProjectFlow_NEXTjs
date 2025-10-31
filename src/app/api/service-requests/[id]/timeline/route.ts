import { NextRequest, NextResponse } from "next/server";
import { withAuth, type AuthenticatedRequest } from "@/lib/api-middleware";
import { successResponse, errorResponse } from "@/lib/api-response";
import { prisma } from "@/lib/db";

/**
 * GET /api/service-requests/:id/timeline
 *
 * Get timeline (activity history) for a service request
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

  // Get timeline
  const timeline = await prisma.requestTimeline.findMany({
    where: {
      serviceRequestId: id,
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          profileImageUrl: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return successResponse({ timeline });
}

export const GET = withAuth(handleGet);
