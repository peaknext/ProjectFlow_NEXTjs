import { NextRequest, NextResponse } from "next/server";
import { withAuth, type AuthenticatedRequest } from "@/lib/api-middleware";
import { successResponse, errorResponse } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import { checkPermission, getUserAccessibleScope } from "@/lib/permissions";
import { createRequestTimeline, notifyRequester } from "@/lib/service-request-utils";

/**
 * POST /api/service-requests/:id/approve
 *
 * Approve service request and create linked task
 *
 * Body:
 * - projectId: string (required - selected by approver)
 * - assigneeUserIds?: string[] (optional - can assign during approval)
 * - comment?: string (optional - approval notes)
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
      "You do not have permission to approve requests",
      403
    );
  }

  // Validate projectId is provided
  if (!body.projectId) {
    return errorResponse("INVALID_INPUT", "Project ID is required", 400);
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
      `Cannot approve request with status ${existingRequest.status}`,
      403
    );
  }

  // Validate approver has access to selected project
  const approverScope = await getUserAccessibleScope(userId);
  const project = await prisma.project.findFirst({
    where: {
      id: body.projectId,
      dateDeleted: null,
      departmentId: { in: approverScope.departmentIds },
    },
  });

  if (!project) {
    return errorResponse(
      "FORBIDDEN",
      "Cannot assign to project outside your scope or project not found",
      403
    );
  }

  // Get default "NOT_STARTED" status for the project
  const defaultStatus = await prisma.status.findFirst({
    where: {
      projectId: project.id,
      type: "NOT_STARTED",
    },
    orderBy: {
      order: "asc",
    },
  });

  if (!defaultStatus) {
    return errorResponse(
      "INVALID_STATE",
      "Project does not have a default status",
      500
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

  // Create task (with first assignee if provided)
  const task = await prisma.task.create({
    data: {
      name: `คำร้อง${existingRequest.type} #${existingRequest.requestNumber} - ${existingRequest.subject}`,
      description: `เชื่อมโยงจากคำร้อง: /it-service/requests/${id}\n\nรายละเอียดคำร้อง:\n${existingRequest.description}`,
      priority: 2, // High priority
      projectId: body.projectId,
      statusId: defaultStatus.id,
      creatorUserId: userId,
      assigneeUserId: body.assigneeUserIds?.[0] || null, // First assignee (or null)
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
        },
      },
      status: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  // Create task assignments for ALL assignees (including first one)
  if (body.assigneeUserIds && body.assigneeUserIds.length > 0) {
    await prisma.taskAssignee.createMany({
      data: body.assigneeUserIds.map((assigneeId: string) => ({
        taskId: task.id,
        userId: assigneeId,
        assignedBy: userId,
      })),
    });
  }

  // Update service request
  const approvedRequest = await prisma.serviceRequest.update({
    where: { id },
    data: {
      status: "APPROVED",
      approverId: userId,
      approverName,
      approverJobTitle,
      approvedAt: new Date(),
      taskId: task.id,
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
      task: {
        select: {
          id: true,
          name: true,
          projectId: true,
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  // Create timeline entries
  await createRequestTimeline(
    id,
    "APPROVED",
    `${approverName} อนุมัติคำร้อง${body.comment ? `: ${body.comment}` : ""}`,
    userId,
    approverName
  );

  await createRequestTimeline(
    id,
    "TASK_CREATED",
    `สร้างงาน "${task.name}" ใน Project "${project.name}"`,
    userId,
    approverName
  );

  // Notify requester
  await notifyRequester(
    existingRequest.requesterId,
    existingRequest.requestNumber,
    "APPROVED",
    approverName
  );

  return successResponse({
    serviceRequest: approvedRequest,
    task,
  });
}

export const POST = withAuth(handlePost);
