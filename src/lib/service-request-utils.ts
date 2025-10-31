/**
 * IT Service Module - Helper Functions
 *
 * Utilities for service request management including:
 * - Request number generation
 * - Timeline creation
 * - Document HTML rendering
 * - Notification helpers
 */

import { prisma } from "@/lib/db";
import type { ServiceRequestType, RequestStatus } from "@/generated/prisma";

/**
 * Generate unique request number in format: SR-YYYY-NNNNN
 * Example: SR-2025-00001
 */
export async function generateRequestNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const yearPrefix = `SR-${currentYear}-`;

  // Find the highest request number for current year
  const lastRequest = await prisma.serviceRequest.findFirst({
    where: {
      requestNumber: {
        startsWith: yearPrefix,
      },
    },
    orderBy: {
      requestNumber: "desc",
    },
    select: {
      requestNumber: true,
    },
  });

  let nextNumber = 1;
  if (lastRequest) {
    // Extract number from SR-YYYY-NNNNN format
    const lastNumber = parseInt(lastRequest.requestNumber.split("-")[2]);
    nextNumber = lastNumber + 1;
  }

  // Pad with zeros to 5 digits
  const paddedNumber = nextNumber.toString().padStart(5, "0");
  return `${yearPrefix}${paddedNumber}`;
}

/**
 * Create timeline entry for service request
 */
export async function createRequestTimeline(
  serviceRequestId: string,
  action: "SUBMITTED" | "APPROVED" | "REJECTED" | "TASK_CREATED" | "COMPLETED" | "CANCELLED" | "FEEDBACK_SUBMITTED" | "FEEDBACK_UPDATED",
  description: string,
  userId?: string,
  userName?: string
): Promise<void> {
  await prisma.requestTimeline.create({
    data: {
      serviceRequestId,
      action,
      description,
      userId,
      userName,
    },
  });
}

/**
 * Render HTML document for printing service request
 *
 * Generates formatted HTML with Thai government document standards
 */
export function renderDocumentHtml(request: {
  requestNumber: string;
  type: ServiceRequestType;
  requesterName: string;
  requesterJobTitle?: string | null;
  requesterDivision?: string | null;
  requesterPhone?: string | null;
  requesterEmail: string;
  subject: string;
  description: string;
  purpose?: string | null;
  purposeOther?: string | null;
  deadline?: number | null;
  issueTime?: Date | null;
  createdAt: Date;
}): string {
  const typeLabel = {
    DATA: "คำร้องขอข้อมูล",
    PROGRAM: "คำร้องพัฒนาโปรแกรม",
    IT_ISSUE: "แจ้งปัญหา IT",
  }[request.type];

  const dateStr = new Date(request.createdAt).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const issueTimeStr = request.issueTime
    ? new Date(request.issueTime).toLocaleString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${typeLabel} ${request.requestNumber}</title>
  <style>
    @media print {
      @page { margin: 2cm; }
      body { margin: 0; }
    }

    body {
      font-family: 'Sarabun', 'TH SarabunPSK', sans-serif;
      font-size: 16pt;
      line-height: 1.6;
      color: #000;
      background: #fff;
      max-width: 21cm;
      margin: 0 auto;
      padding: 1cm;
    }

    .header {
      text-align: center;
      margin-bottom: 1.5cm;
      border-bottom: 2px solid #000;
      padding-bottom: 0.5cm;
    }

    .header h1 {
      font-size: 20pt;
      font-weight: bold;
      margin: 0 0 0.3cm 0;
    }

    .request-number {
      font-size: 14pt;
      color: #666;
      margin: 0.2cm 0;
    }

    .section {
      margin-bottom: 1cm;
    }

    .section-title {
      font-weight: bold;
      font-size: 18pt;
      margin-bottom: 0.3cm;
      border-bottom: 1px solid #333;
      padding-bottom: 0.1cm;
    }

    .field {
      margin-bottom: 0.3cm;
    }

    .field-label {
      font-weight: bold;
      display: inline-block;
      width: 5cm;
    }

    .field-value {
      display: inline;
    }

    .description-box {
      border: 1px solid #333;
      padding: 0.5cm;
      min-height: 3cm;
      margin-top: 0.3cm;
      white-space: pre-wrap;
    }

    .footer {
      margin-top: 2cm;
      border-top: 1px solid #000;
      padding-top: 0.5cm;
      font-size: 14pt;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${typeLabel}</h1>
    <div class="request-number">เลขที่: ${request.requestNumber}</div>
    <div class="request-number">วันที่ส่งคำร้อง: ${dateStr}</div>
  </div>

  <div class="section">
    <div class="section-title">ข้อมูลผู้ส่งคำร้อง</div>
    <div class="field">
      <span class="field-label">ชื่อ-นามสกุล:</span>
      <span class="field-value">${request.requesterName}</span>
    </div>
    ${request.requesterJobTitle ? `
    <div class="field">
      <span class="field-label">ตำแหน่ง:</span>
      <span class="field-value">${request.requesterJobTitle}</span>
    </div>
    ` : ""}
    ${request.requesterDivision ? `
    <div class="field">
      <span class="field-label">หน่วยงาน:</span>
      <span class="field-value">${request.requesterDivision}</span>
    </div>
    ` : ""}
    ${request.requesterPhone ? `
    <div class="field">
      <span class="field-label">เบอร์โทรศัพท์:</span>
      <span class="field-value">${request.requesterPhone}</span>
    </div>
    ` : ""}
    <div class="field">
      <span class="field-label">อีเมล:</span>
      <span class="field-value">${request.requesterEmail}</span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">รายละเอียดคำร้อง</div>
    <div class="field">
      <span class="field-label">เรื่อง:</span>
      <span class="field-value">${request.subject}</span>
    </div>
    ${request.purpose ? `
    <div class="field">
      <span class="field-label">วัตถุประสงค์:</span>
      <span class="field-value">${request.purpose}</span>
    </div>
    ` : ""}
    ${request.purposeOther ? `
    <div class="field">
      <span class="field-label">วัตถุประสงค์อื่นๆ:</span>
      <span class="field-value">${request.purposeOther}</span>
    </div>
    ` : ""}
    ${request.deadline ? `
    <div class="field">
      <span class="field-label">กำหนดส่งมอบ:</span>
      <span class="field-value">${request.deadline} วัน</span>
    </div>
    ` : ""}
    ${issueTimeStr ? `
    <div class="field">
      <span class="field-label">เวลาที่พบปัญหา:</span>
      <span class="field-value">${issueTimeStr}</span>
    </div>
    ` : ""}
    <div class="field">
      <span class="field-label">รายละเอียด:</span>
      <div class="description-box">${request.description}</div>
    </div>
  </div>

  <div class="footer">
    เอกสารนี้สร้างโดยระบบ ProjectFlows<br>
    วันที่พิมพ์: ${new Date().toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })}
  </div>
</body>
</html>
  `.trim();
}

/**
 * Notify approver(s) about new pending request
 */
export async function notifyApprovers(
  requestId: string,
  requestNumber: string,
  requestType: ServiceRequestType,
  subject: string,
  requesterName: string
): Promise<void> {
  // Get all users with approval permission (HEAD and above in their scope)
  const approvers = await prisma.user.findMany({
    where: {
      role: {
        in: ["SUPER_ADMIN", "ADMIN", "CHIEF", "LEADER", "HEAD"],
      },
      userStatus: "ACTIVE",
    },
    select: {
      id: true,
    },
  });

  const typeLabel = {
    DATA: "คำร้องขอข้อมูล",
    PROGRAM: "คำร้องพัฒนาโปรแกรม",
    IT_ISSUE: "แจ้งปัญหา IT",
  }[requestType];

  // Send notification to all approvers
  await prisma.notification.createMany({
    data: approvers.map((approver) => ({
      userId: approver.id,
      type: "SERVICE_REQUEST_SUBMITTED", // ✅ FIXED: Use correct type
      message: `${requesterName} ส่ง${typeLabel} ${requestNumber}: ${subject}`,
    })),
  });
}

/**
 * Notify requester about request status change
 */
export async function notifyRequester(
  requesterId: string,
  requestNumber: string,
  status: "APPROVED" | "REJECTED" | "COMPLETED" | "CANCELLED",
  approverName?: string,
  reason?: string
): Promise<void> {
  const statusMessages = {
    APPROVED: {
      type: "SERVICE_REQUEST_APPROVED",
      title: `คำร้อง ${requestNumber} ได้รับการอนุมัติ`,
      message: `${approverName} อนุมัติคำร้องของคุณแล้ว`,
    },
    REJECTED: {
      type: "SERVICE_REQUEST_REJECTED",
      title: `คำร้อง ${requestNumber} ไม่อนุมัติ`,
      message: `${approverName} ไม่อนุมัติคำร้องของคุณ${reason ? `: ${reason}` : ""}`,
    },
    COMPLETED: {
      type: "SERVICE_REQUEST_COMPLETED",
      title: `คำร้อง ${requestNumber} เสร็จสิ้น`,
      message: `งานจากคำร้องของคุณดำเนินการเสร็จสิ้นแล้ว`,
    },
    CANCELLED: {
      type: "SERVICE_REQUEST_CANCELLED",
      title: `คำร้อง ${requestNumber} ถูกยกเลิก`,
      message: `คำร้องของคุณถูกยกเลิก${reason ? `: ${reason}` : ""}`,
    },
  } as const;

  const { type, title, message } = statusMessages[status];

  await prisma.notification.create({
    data: {
      userId: requesterId,
      type, // ✅ FIXED: Use correct type from statusMessages
      message: `${title} - ${message}`,
    },
  });
}

/**
 * Calculate current queue position for pending requests
 * Groups by request type (DATA, PROGRAM, IT_ISSUE)
 */
export async function calculateQueuePosition(
  requestId: string,
  requestType: ServiceRequestType
): Promise<number> {
  // Get all pending requests of same type, ordered by creation date
  const pendingRequests = await prisma.serviceRequest.findMany({
    where: {
      type: requestType,
      status: "PENDING",
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
    },
  });

  // Find position in queue (1-indexed)
  const position = pendingRequests.findIndex((r) => r.id === requestId) + 1;
  return position || 0; // Return 0 if not found
}

/**
 * Notify requester or approver when new comment is added
 */
export async function notifyCommentAdded(
  serviceRequestId: string,
  requestNumber: string,
  commenterName: string,
  commenterId: string,
  requesterId: string,
  approverId?: string | null
): Promise<void> {
  // Notify requester if commenter is not the requester
  if (commenterId !== requesterId) {
    await prisma.notification.create({
      data: {
        userId: requesterId,
        type: "SERVICE_REQUEST_COMMENT_ADDED",
        message: `${commenterName} แสดงความคิดเห็นในคำร้อง ${requestNumber}`,
      },
    });
  }

  // Notify approver if exists and commenter is not the approver
  if (approverId && commenterId !== approverId) {
    await prisma.notification.create({
      data: {
        userId: approverId,
        type: "SERVICE_REQUEST_COMMENT_ADDED",
        message: `${commenterName} แสดงความคิดเห็นในคำร้อง ${requestNumber}`,
      },
    });
  }
}

/**
 * Get fiscal year from date
 * Thai fiscal year starts Oct 1 and ends Sep 30
 * Example: Oct 1, 2024 → Fiscal Year 2568 (2024 + 543 + 1)
 */
export function getFiscalYear(date: Date): number {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed (0 = Jan, 9 = Oct)

  // If Oct-Dec (months 9-11), use next year
  const fiscalYear = month >= 9 ? year + 1 : year;

  // Convert to Buddhist Era (+ 543)
  return fiscalYear + 543;
}
