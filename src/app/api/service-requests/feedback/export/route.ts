import { NextRequest, NextResponse } from "next/server";
import { withAuth, type AuthenticatedRequest } from "@/lib/api-middleware";
import { errorResponse } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import { checkPermission } from "@/lib/permissions";

/**
 * GET /api/service-requests/feedback/export
 *
 * Export feedback data as CSV (SUPER_ADMIN/ADMIN only)
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
      "You do not have permission to export feedback data",
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
      requester: {
        select: {
          fullName: true,
          department: {
            select: {
              name: true,
              division: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Generate CSV content
  const csvHeaders = [
    "Request Number",
    "Type",
    "Subject",
    "Requester",
    "Department",
    "Division",
    "Rating",
    "Comment",
    "Request Created",
    "Feedback Submitted",
  ];

  const csvRows = feedbackData
    .filter((r) => r.feedback !== null)
    .map((r) => {
      const typeLabels = {
        DATA: "ขอข้อมูล",
        PROGRAM: "ขอพัฒนาโปรแกรม",
        IT_ISSUE: "แจ้งปัญหา IT",
      };

      return [
        r.requestNumber,
        typeLabels[r.type],
        r.subject,
        r.requester.fullName,
        r.requester.department?.name || "-",
        r.requester.department?.division?.name || "-",
        r.feedback!.rating.toString(),
        r.feedback!.comment?.replace(/"/g, '""') || "-", // Escape quotes
        new Date(r.createdAt).toISOString(),
        new Date(r.feedback!.createdAt).toISOString(),
      ];
    });

  // Build CSV string
  const csvContent = [
    csvHeaders.map((h) => `"${h}"`).join(","),
    ...csvRows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  // Add BOM for Excel UTF-8 support
  const bom = "\uFEFF";
  const csvWithBom = bom + csvContent;

  // Return CSV file
  return new NextResponse(csvWithBom, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="feedback-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}

export const GET = withAuth(handleGet);
