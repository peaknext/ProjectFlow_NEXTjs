import { NextRequest, NextResponse } from "next/server";
import { withAuth, type AuthenticatedRequest } from "@/lib/api-middleware";
import { successResponse, errorResponse } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import { checkPermission } from "@/lib/permissions";

/**
 * GET /api/service-requests/feedback/stats
 *
 * Get feedback analytics (SUPER_ADMIN/ADMIN only)
 *
 * Query params:
 * - startDate?: string (ISO date)
 * - endDate?: string (ISO date)
 * - type?: ServiceRequestType (DATA, PROGRAM, IT_ISSUE)
 */
async function handleGet(req: AuthenticatedRequest) {
  const userId = req.session.userId;

  // Check permission (only SUPER_ADMIN/ADMIN)
  const hasPermission = await checkPermission(
    userId,
    "it_service.view_all_requests",
    {}
  );

  if (!hasPermission) {
    return errorResponse(
      "FORBIDDEN",
      "You do not have permission to view feedback analytics",
      403
    );
  }

  const searchParams = new URL(req.url).searchParams;
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const type = searchParams.get("type");

  // Build where clause for requests
  const requestWhere: any = {
    status: "COMPLETED",
    feedback: {
      isNot: null, // Only requests with feedback
    },
  };

  if (startDate) {
    requestWhere.createdAt = {
      ...requestWhere.createdAt,
      gte: new Date(startDate),
    };
  }

  if (endDate) {
    requestWhere.createdAt = {
      ...requestWhere.createdAt,
      lte: new Date(endDate),
    };
  }

  if (type) {
    requestWhere.type = type;
  }

  // Get all feedback with filters
  const feedbackData = await prisma.serviceRequest.findMany({
    where: requestWhere,
    include: {
      feedback: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const feedbacks = feedbackData
    .filter((r) => r.feedback !== null)
    .map((r) => ({
      ...r.feedback!,
      request: {
        id: r.id,
        requestNumber: r.requestNumber,
        type: r.type,
        subject: r.subject,
        requesterName: r.requesterName,
        createdAt: r.createdAt,
      },
    }));

  // Calculate summary statistics
  const totalCount = feedbacks.length;
  const averageRating =
    totalCount > 0
      ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / totalCount
      : 0;
  const lowRatingCount = feedbacks.filter((f) => f.rating <= 3).length;

  // Calculate rating distribution (1-10)
  const ratingDistribution = Array.from({ length: 10 }, (_, i) => {
    const rating = i + 1;
    const count = feedbacks.filter((f) => f.rating === rating).length;
    return {
      rating,
      count,
      percentage: totalCount > 0 ? (count / totalCount) * 100 : 0,
    };
  });

  // Calculate monthly trend (last 12 months)
  const monthlyTrend = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextMonthDate = new Date(
      now.getFullYear(),
      now.getMonth() - i + 1,
      1
    );

    const monthFeedbacks = feedbacks.filter((f) => {
      const feedbackDate = new Date(f.createdAt);
      return feedbackDate >= monthDate && feedbackDate < nextMonthDate;
    });

    const monthAverage =
      monthFeedbacks.length > 0
        ? monthFeedbacks.reduce((sum, f) => sum + f.rating, 0) /
          monthFeedbacks.length
        : 0;

    monthlyTrend.push({
      month: monthDate.toISOString().slice(0, 7), // YYYY-MM
      averageRating: Math.round(monthAverage * 100) / 100,
      count: monthFeedbacks.length,
    });
  }

  // Calculate by-type statistics
  const typeStats = await prisma.serviceRequest.groupBy({
    by: ["type"],
    where: requestWhere,
    _count: {
      id: true,
    },
  });

  const byTypeStats = await Promise.all(
    typeStats.map(async (stat) => {
      const typeFeedbacks = feedbacks.filter(
        (f) => f.request.type === stat.type
      );
      const typeAverage =
        typeFeedbacks.length > 0
          ? typeFeedbacks.reduce((sum, f) => sum + f.rating, 0) /
            typeFeedbacks.length
          : 0;

      return {
        type: stat.type,
        count: typeFeedbacks.length,
        averageRating: Math.round(typeAverage * 100) / 100,
      };
    })
  );

  // Get low-rated requests (rating ≤3)
  const lowRatedRequests = feedbacks
    .filter((f) => f.rating <= 3)
    .slice(0, 20) // Limit to 20
    .map((f) => ({
      id: f.request.id,
      requestNumber: f.request.requestNumber,
      type: f.request.type,
      subject: f.request.subject,
      requesterName: f.request.requesterName,
      rating: f.rating,
      comment: f.comment,
      createdAt: f.request.createdAt,
      feedbackCreatedAt: f.createdAt,
    }));

  return successResponse({
    summary: {
      totalCount,
      averageRating: Math.round(averageRating * 100) / 100,
      lowRatingCount,
    },
    ratingDistribution,
    monthlyTrend,
    byTypeStats,
    lowRatedRequests,
  });
}

export const GET = withAuth(handleGet);
