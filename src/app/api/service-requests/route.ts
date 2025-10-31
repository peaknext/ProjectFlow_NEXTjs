import { NextRequest, NextResponse } from "next/server";
import { withAuth, type AuthenticatedRequest } from "@/lib/api-middleware";
import { successResponse, errorResponse } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import {
  generateRequestNumber,
  createRequestTimeline,
  renderDocumentHtml,
  notifyApprovers,
  getFiscalYear,
} from "@/lib/service-request-utils";
import { buildFiscalYearFilter } from "@/lib/fiscal-year";

/**
 * GET /api/service-requests
 *
 * List service requests with filters
 *
 * Query params:
 * - type: ServiceRequestType (DATA, PROGRAM, IT_ISSUE)
 * - status: RequestStatus (PENDING, APPROVED, REJECTED, etc.)
 * - fiscalYears: string (comma-separated years, e.g., "2568,2567")
 * - search: string (search in subject, description, requestNumber)
 * - myRequests: boolean (only show current user's requests)
 */
async function handleGet(req: AuthenticatedRequest) {
  const userId = req.session.userId;
  const searchParams = new URL(req.url).searchParams;

  // Parse filters
  const type = searchParams.get("type") as "DATA" | "PROGRAM" | "IT_ISSUE" | null;
  const status = searchParams.get("status");
  const fiscalYearsParam = searchParams.get("fiscalYears");
  const search = searchParams.get("search");
  const myRequests = searchParams.get("myRequests") === "true";

  // Get current user with organization info for scope filtering
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      department: {
        include: {
          division: {
            include: {
              missionGroup: true,
            },
          },
        },
      },
    },
  });

  if (!currentUser) {
    return errorResponse("NOT_FOUND", "User not found", 404);
  }

  // Build where clause
  const where: any = {};

  if (type) {
    where.type = type;
  }

  if (status) {
    where.status = status;
  }

  // Fiscal year filter
  if (fiscalYearsParam) {
    const fiscalYears = fiscalYearsParam.split(",").map((y) => parseInt(y));
    if (fiscalYears.length > 0) {
      where.fiscalYear = { in: fiscalYears };
    }
  }

  // Search filter
  if (search) {
    where.OR = [
      { requestNumber: { contains: search, mode: "insensitive" } },
      { subject: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  // My requests filter
  if (myRequests) {
    where.requesterId = userId;
  } else {
    // Scope filter by role (only when NOT filtering by "my requests")
    const role = currentUser.role;

    if (role === "USER" || role === "MEMBER" || role === "HEAD") {
      // USER, MEMBER, HEAD: See only department scope
      if (currentUser.departmentId) {
        where.requester = {
          departmentId: currentUser.departmentId,
        };
      }
    } else if (role === "LEADER") {
      // LEADER: See division scope
      if (currentUser.department?.divisionId) {
        where.requester = {
          department: {
            divisionId: currentUser.department.divisionId,
          },
        };
      }
    } else if (role === "CHIEF") {
      // CHIEF: See mission group scope
      if (currentUser.department?.division?.missionGroupId) {
        where.requester = {
          department: {
            division: {
              missionGroupId: currentUser.department.division.missionGroupId,
            },
          },
        };
      }
    }
    // ADMIN, SUPER_ADMIN: See all (no additional filter)
  }

  // Fetch requests
  const requests = await prisma.serviceRequest.findMany({
    where,
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
      task: {
        select: {
          id: true,
          name: true,
          statusId: true,
          isClosed: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return successResponse({ requests });
}

/**
 * POST /api/service-requests
 *
 * Create new service request
 *
 * Body:
 * - type: ServiceRequestType (DATA, PROGRAM, IT_ISSUE)
 * - subject: string
 * - description: string
 * - purpose?: string (for DATA/PROGRAM)
 * - purposeOther?: string (for DATA/PROGRAM)
 * - deadline?: number (for DATA/PROGRAM, in days)
 * - issueTime?: string (for IT_ISSUE, ISO date)
 */
async function handlePost(req: AuthenticatedRequest) {
  const userId = req.session.userId;
  const body = await req.json();

  // Validate required fields
  if (!body.type || !["DATA", "PROGRAM", "IT_ISSUE"].includes(body.type)) {
    return errorResponse("INVALID_INPUT", "Invalid request type", 400);
  }

  if (!body.subject || body.subject.trim().length === 0) {
    return errorResponse("INVALID_INPUT", "Subject is required", 400);
  }

  if (!body.description || body.description.trim().length === 0) {
    return errorResponse("INVALID_INPUT", "Description is required", 400);
  }

  // Get requester info
  const requester = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      department: {
        include: {
          division: true,
        },
      },
      jobTitle: true,
    },
  });

  if (!requester) {
    return errorResponse("NOT_FOUND", "User not found", 404);
  }

  // Generate request number
  const requestNumber = await generateRequestNumber();

  // Get fiscal year from current date
  const fiscalYear = getFiscalYear(new Date());

  // Prepare requester snapshot
  const requesterName = requester.fullName || `${requester.firstName} ${requester.lastName}`;
  const requesterJobTitle = requester.jobTitle?.jobTitleTh || null;
  const requesterDivision = requester.department?.division?.name || null;
  const requesterPhone = requester.internalPhone || null;
  const requesterEmail = requester.email;

  // Parse issueTime if provided
  const issueTime = body.issueTime ? new Date(body.issueTime) : null;

  // Create request data object for document rendering
  const requestData = {
    requestNumber,
    type: body.type,
    requesterName,
    requesterJobTitle,
    requesterDivision,
    requesterPhone,
    requesterEmail,
    subject: body.subject.trim(),
    description: body.description.trim(),
    purpose: body.purpose || null,
    purposeOther: body.purposeOther || null,
    deadline: body.deadline || null,
    issueTime,
    createdAt: new Date(),
  };

  // Render HTML document
  const documentHtml = renderDocumentHtml(requestData);

  // Create service request
  const serviceRequest = await prisma.serviceRequest.create({
    data: {
      requestNumber,
      type: body.type,
      fiscalYear,
      requesterId: userId,
      requesterName,
      requesterJobTitle,
      requesterDivision,
      requesterPhone,
      requesterEmail,
      subject: body.subject.trim(),
      description: body.description.trim(),
      purpose: body.purpose || null,
      purposeOther: body.purposeOther || null,
      deadline: body.deadline || null,
      issueTime,
      documentHtml,
      status: "PENDING",
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

  // Create timeline entry
  await createRequestTimeline(
    serviceRequest.id,
    "SUBMITTED",
    `${requesterName} ส่งคำร้องเข้าสู่ระบบ`,
    userId,
    requesterName
  );

  // Notify approvers about new request
  await notifyApprovers(
    serviceRequest.id,
    requestNumber,
    body.type,
    body.subject,
    requesterName
  );

  return successResponse({ serviceRequest }, 201);
}

export const GET = withAuth(handleGet);
export const POST = withAuth(handlePost);
