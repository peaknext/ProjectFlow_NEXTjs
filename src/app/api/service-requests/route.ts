import { NextRequest, NextResponse } from "next/server";
import { withAuth, type AuthenticatedRequest } from "@/lib/api-middleware";
import { successResponse, errorResponse } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import {
  generateRequestNumber,
  createRequestTimeline,
  notifyApprovers,
  getFiscalYear,
} from "@/lib/service-request-utils";
import { generateDocument, type DocumentData } from "@/lib/document-helpers";
import { buildFiscalYearFilter } from "@/lib/fiscal-year";
import { getHospitalName } from "@/lib/system-settings";
import { isAdminOrHigher, hasRoleLevel } from "@/lib/permissions";

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

    if (isAdminOrHigher(role)) {
      // ADMIN, SUPER_ADMIN: See all (no additional filter)
      // No filter applied - can see all requests
    } else if (hasRoleLevel(role, "CHIEF")) {
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
    } else if (hasRoleLevel(role, "LEADER")) {
      // LEADER: See division scope
      if (currentUser.department?.divisionId) {
        where.requester = {
          department: {
            divisionId: currentUser.department.divisionId,
          },
        };
      }
    } else {
      // USER, MEMBER, HEAD: See only department scope
      if (currentUser.departmentId) {
        where.requester = {
          departmentId: currentUser.departmentId,
        };
      }
    }
  }

  // Fetch requests
  const requests = await prisma.serviceRequest.findMany({
    where,
    include: {
      requester: {
        select: {
          id: true,
          titlePrefix: true,
          firstName: true,
          lastName: true,
          email: true,
          profileImageUrl: true,
        },
      },
      approver: {
        select: {
          id: true,
          titlePrefix: true,
          firstName: true,
          lastName: true,
          profileImageUrl: true,
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
  const requesterName = `${requester.titlePrefix}${requester.firstName} ${requester.lastName}`;

  // รวม ตำแหน่ง + ระดับ (เช่น "นายแพทย์" + "ชำนาญการ" = "นายแพทย์ชำนาญการ")
  const jobTitleTh = requester.jobTitle?.jobTitleTh || "";
  const jobLevel = requester.jobLevel || "";
  const requesterJobTitle = (jobTitleTh + jobLevel).trim();

  const requesterDivision = requester.department?.division?.name || "";
  const requesterDepartment = requester.department?.name || "";
  const requesterPhone = requester.internalPhone || undefined;
  const requesterEmail = requester.email;

  // Parse purposes array for DATA/PROGRAM requests
  const purposes = body.purposes ? (Array.isArray(body.purposes) ? body.purposes : [body.purposes]) : undefined;

  // Create request data object for document rendering
  const documentData: DocumentData = {
    requestNumber,
    type: body.type,
    subject: body.subject.trim(),
    description: body.description.trim(),
    urgency: body.urgency || "MEDIUM",
    requesterName,
    requesterJobTitle,
    requesterDivision,
    requesterDepartment,
    requesterPhone,
    requesterEmail,
    hospitalName: await getHospitalName(), // Get from system settings
    createdAt: new Date(),
    purposes,
    otherPurpose: body.otherPurpose || undefined,
    location: body.location || undefined,
  };

  // Render HTML document
  const documentHtml = generateDocument(documentData);

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
      purpose: body.purposes ? body.purposes.join(", ") : null, // Convert array to comma-separated string
      purposeOther: body.otherPurpose || null,
      deadline: null, // Not used by new modals
      issueTime: null, // Not used by new modals
      documentHtml,
      status: "PENDING",
    },
    include: {
      requester: {
        select: {
          id: true,
          titlePrefix: true,
          firstName: true,
          lastName: true,
          email: true,
          profileImageUrl: true,
        },
      },
    },
  });

  // Create timeline entry
  await createRequestTimeline(
    serviceRequest.id,
    "CREATED",
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
