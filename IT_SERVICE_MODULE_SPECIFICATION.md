# IT Service Module - Complete Specification Document

**Project**: ProjectFlows - IT Service Request Management Module
**Version**: 1.0.0
**Date**: 2025-10-31
**Status**: Planning & Design Phase

### 📝 Recent Updates (2025-11-01) ⭐ **UPDATED**

**Phase 2 Progress - IT Service Portal UI** (2025-11-01 Session 2)
- ✅ **Task 1: IT Service Layout** - Enhanced with USER role isolation
  - USER role redirect system (login → IT Service, blocked from dashboard)
  - Clean layout for USER (no sidebar) for profile/settings pages
  - Back button and menu item for returning to IT Service portal
  - ITServiceTopBar with ProjectFlows logo and fiscal year filter

- ✅ **Task 2: Sidebar Navigation** - Badge count with role-based scope filtering
  - "IT Service" menu (all roles)
  - "คำร้องขอ" menu (management roles only) with pending count badge
  - Role-based request filtering: USER/MEMBER/HEAD → department, LEADER → division, CHIEF → mission group

- ✅ **Task 3: Portal Page** - COMPLETE
  - ✅ 3 action cards with lucide icons (Database, Code, Wrench)
  - ✅ Request cards list in sidebar (desktop) and below cards (mobile)
  - ✅ Filters UI (type, status, search, myRequests toggle)
  - ✅ Responsive design (mobile: 1 col, tablet: 2 cols, desktop: 3 cols + sidebar)
  - ✅ Request forms (COMPLETE - Phase 2 Task 4)
  - ❌ Document preview (pending - Phase 2 Task 5)

**UI/UX Enhancements**:
- Centered action cards with increased spacing
- Removed unnecessary text (headers, descriptions)
- Simplified filter controls (removed fiscal year section from sidebar)
- Mobile-responsive layout (action cards stack vertically, request list below)
- Touch-friendly card sizing on mobile devices

**Enhancement 1: Queue System** (Previous)
- FIFO (First In First Out) queue calculation by request type
- Real-time queue position display with progress bar
- Estimated wait time based on historical data
- 3 display locations: Portal cards list, Tracking page, Management table

**Enhancement 2: Satisfaction Rating System** (Previous)
- 1-10 star rating system for completed requests
- Optional comment field for suggestions (max 1000 chars)
- Analytics dashboard with rating distribution, trends, and export

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Requirements Analysis](#requirements-analysis)
3. [Database Schema Design](#database-schema-design)
4. [API Endpoints Specification](#api-endpoints-specification)
5. [UI/UX Design](#uiux-design)
6. [Component Structure](#component-structure)
7. [Permission System](#permission-system)
8. [Document Templates](#document-templates)
9. [Implementation Phases](#implementation-phases)
10. [Testing Strategy](#testing-strategy)

---

## Executive Summary

### Overview

IT Service Module เป็นระบบจัดการคำร้องขอบริการด้านเทคโนโลยีสารสนเทศ ออกแบบมาสำหรับผู้ใช้งาน Role USER ให้สามารถส่งคำร้องขอ ติดตามสถานะ และพิมพ์เอกสารตามมาตรฐานราชการไทยได้อย่างง่ายดาย

### Key Features

✅ **SUPER_ADMIN Role** - Role ใหม่เพื่อจัดการระบบ
✅ **IT Service Portal** - หน้าเริ่มต้นสำหรับ USER role พร้อม 3 main actions
✅ **2 Request Types** - ขอข้อมูล/โปรแกรม และ แจ้งปัญหา IT
✅ **Document Generation** - เอกสารตามมาตรฐานราชการไทย (Sarabun 16pt)
✅ **Timeline Tracking** - ติดตามสถานะแบบ real-time
✅ **Approval Workflow** - ระบบอนุมัติ 3 ประเภท
✅ **Task Integration** - สร้าง task จาก request อัตโนมัติ
✅ **Responsive Design** - รองรับทั้ง desktop และ mobile
✅ **Sidebar Navigation** - ⭐ **NEW**: เมนู "IT Service" และ "คำร้องขอ" ใน sidebar
✅ **Queue System** - ⭐ **NEW**: แสดงลำดับคิวและเวลารอโดยประมาณ
✅ **Satisfaction Rating** - ⭐ **NEW**: ประเมินความพึงพอใจ 1-10 ดาว พร้อม analytics

### Target Users

| Role | Access Level | Description |
|------|-------------|-------------|
| **SUPER_ADMIN** | Full Control | จัดการทั้งระบบ + เปิด/ปิด module |
| **Approvers** | Approve Requests | อนุมัติคำร้อง 3 ประเภท (HEAD+ role) |
| **USER** | Submit & Track | ส่งคำร้อง + ติดตามสถานะ |

---

## Requirements Analysis

### Functional Requirements

#### FR-1: SUPER_ADMIN Role Management
- **FR-1.1**: สร้าง SUPER_ADMIN role ใหม่ในระบบ
- **FR-1.2**: SUPER_ADMIN มีสิทธิ์เหมือน ADMIN ทุกประการ
- **FR-1.3**: SUPER_ADMIN สามารถเปิด/ปิด IT Service module
- **FR-1.4**: SUPER_ADMIN สามารถกำหนดผู้อนุมัติแต่ละประเภท
- **FR-1.5**: SUPER_ADMIN สามารถตั้งค่าชื่อโรงพยาบาล

#### FR-2: IT Service Portal (USER)
- **FR-2.1**: USER login แล้วเข้าหน้า IT Service Portal โดยอัตโนมัติ
- **FR-2.2**: แสดง 3 main actions: "ขอข้อมูล/โปรแกรม", "แจ้งปัญหา IT", "ติดตามงาน"
- **FR-2.3**: แสดง Request Cards ด้านขวา (list ของ request ที่เคยสร้าง)
- **FR-2.4**: กรอง request cards ตาม: ประเภท, วัน, เดือน, ปี
- **FR-2.5**: คลิก card เปิดไปที่หน้าติดตามงานของ request นั้น

#### FR-3: Request Submission
- **FR-3.1**: Form "ขอข้อมูล/โปรแกรม" มีฟิลด์ตามแม่แบบ
- **FR-3.2**: Form "แจ้งปัญหา IT" มีฟิลด์ตามแม่แบบ
- **FR-3.3**: Auto-fill ข้อมูลผู้ใช้จาก users table
- **FR-3.4**: สร้างเอกสารตามมาตรฐานราชการไทย (Sarabun 16pt)
- **FR-3.5**: Preview เอกสารก่อน submit
- **FR-3.6**: Generate Request ID อัตโนมัติ

#### FR-4: Document Management
- **FR-4.1**: แสดง preview เอกสารในหน้าติดตามงาน
- **FR-4.2**: Print เอกสารได้โดยตรง (browser print)
- **FR-4.3**: เอกสารมีหมายเลขใบงาน (auto-generate)
- **FR-4.4**: รองรับ font Sarabun size 16pt
- **FR-4.5**: จัดรูปแบบตามระเบียบราชการ (กันหน้า-หลัง, ย่อหน้า)

#### FR-5: Request Tracking
- **FR-5.1**: แสดง Timeline สถานะงาน
- **FR-5.2**: แสดง profile avatar + ชื่อ-สกุล + ตำแหน่ง ของผู้ดำเนินการ
- **FR-5.3**: User สามารถเพิ่ม comment ใน timeline
- **FR-5.4**: Real-time updates เมื่อสถานะเปลี่ยน

#### FR-6: Approval Workflow
- **FR-6.1**: 3 ประเภทสิทธิ์อนุมัติ: ข้อมูล, โปรแกรม, ปัญหา IT
- **FR-6.2**: ผู้อนุมัติต้องมี role HEAD ขึ้นไป
- **FR-6.3**: ผู้อนุมัติมี sidebar menu "คำร้องขอ"
- **FR-6.4**: หน้า "จัดการคำร้องขอ" แสดง pending requests
- **FR-6.5**: อนุมัติ → auto-create task ผูกกับ request

#### FR-7: Task Integration
- **FR-7.1**: สร้าง task อัตโนมัติเมื่ออนุมัติ request
- **FR-7.2**: Task ผูกกับ request (foreign key)
- **FR-7.3**: Task สามารถ assign ผู้รับผิดชอบได้
- **FR-7.4**: Update task status → update timeline
- **FR-7.5**: Close task → complete request

### Non-Functional Requirements

#### NFR-1: Performance
- **NFR-1.1**: หน้า IT Service Portal โหลดภายใน 1.5 วินาที
- **NFR-1.2**: Document preview แสดงภายใน 0.5 วินาที
- **NFR-1.3**: Timeline updates real-time ภายใน 2 วินาที
- **NFR-1.4**: รองรับ concurrent requests อย่างน้อย 50 requests/second

#### NFR-2: Security
- **NFR-2.1**: ใช้ authentication system ที่มีอยู่ (session-based)
- **NFR-2.2**: Permission checks ทุก API endpoint
- **NFR-2.3**: USER เห็นเฉพาะ requests ของตัวเอง
- **NFR-2.4**: Approvers เห็นเฉพาะ requests ในขอบเขตสิทธิ์

#### NFR-3: Usability
- **NFR-3.1**: ฟอร์มกรอกง่าย ไม่เกิน 5 นาที
- **NFR-3.2**: ภาษาไทยทั้งหมด (consistent terminology)
- **NFR-3.3**: Mobile-responsive (breakpoint 768px)
- **NFR-3.4**: Accessibility WCAG 2.1 Level AA

#### NFR-4: Scalability
- **NFR-4.1**: รองรับ 10,000+ requests ใน database
- **NFR-4.2**: Pagination สำหรับ request lists
- **NFR-4.3**: Infinite scroll ใน timeline
- **NFR-4.4**: Lazy loading สำหรับ document preview

---

## Database Schema Design

### Schema Changes Overview

จะเพิ่ม **7 tables** ใหม่ + แก้ไข **1 enum** ในระบบ

**Tables**:
1. UserRole enum - แก้ไข (เพิ่ม SUPER_ADMIN)
2. ServiceRequest - คำร้องขอบริการ (หลัก)
3. RequestTimeline - ประวัติการดำเนินการ
4. RequestComment - ความคิดเห็น
5. RequestApprover - ผู้มีสิทธิ์อนุมัติ
6. SystemSettings - การตั้งค่าระบบ
7. **ServiceRequestFeedback** ⭐ **NEW** - ประเมินความพึงพอใจ

### 1. Enum: UserRole (แก้ไข)

```prisma
enum UserRole {
  SUPER_ADMIN  // ⭐ NEW - Highest privilege
  ADMIN
  CHIEF
  LEADER
  HEAD
  MEMBER
  USER
}
```

**เหตุผล**: SUPER_ADMIN เป็น role ใหม่สูงสุด สามารถจัดการทั้งระบบ + เปิด/ปิด modules

---

### 2. Table: ServiceRequest (หลัก)

```prisma
model ServiceRequest {
  id                String              @id @default(cuid())
  requestNumber     String              @unique // เลขที่ใบงาน (auto-generate: SR-2025-00001)
  type              ServiceRequestType  // DATA, PROGRAM, IT_ISSUE
  fiscalYear        Int                 // ปีงบประมาณ (2568, 2569, etc.) - CRITICAL for filtering

  // ผู้ส่งคำร้อง (จาก users table)
  requesterId       String
  requesterName     String              // Snapshot: titlePrefix + firstName + lastName
  requesterJobTitle String?             // Snapshot: jobTitle
  requesterDivision String?             // Snapshot: division name
  requesterPhone    String?             // Snapshot: internalPhone
  requesterEmail    String              // Snapshot: email

  // เนื้อหาคำร้อง
  subject           String              // เรื่อง
  description       String              // รายละเอียด
  purpose           String?             // วัตถุประสงค์ (DATA/PROGRAM only)
  purposeOther      String?             // วัตถุประสงค์อื่นๆ (DATA/PROGRAM only)
  deadline          Int?                // จำนวนวัน (DATA/PROGRAM only)
  issueTime         DateTime?           // เวลาที่พบปัญหา (IT_ISSUE only)

  // ผู้อนุมัติ
  approverId        String?
  approverName      String?             // Snapshot when approved
  approverJobTitle  String?             // Snapshot when approved
  approvedAt        DateTime?

  // สถานะ
  status            RequestStatus       @default(PENDING)

  // เอกสาร
  documentHtml      String              @db.Text // HTML content สำหรับ print

  // Task ที่เชื่อมโยง
  taskId            String?             @unique

  // Timestamps
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt

  // Relations
  requester         User                @relation("RequestRequester", fields: [requesterId], references: [id])
  approver          User?               @relation("RequestApprover", fields: [approverId], references: [id])
  task              Task?               @relation("RequestTask", fields: [taskId], references: [id])
  timeline          RequestTimeline[]
  comments          RequestComment[]
  feedback          ServiceRequestFeedback?  // ⭐ NEW: One-to-one feedback

  @@index([requesterId])
  @@index([approverId])
  @@index([status])
  @@index([type])
  @@index([createdAt])
  @@map("service_requests")
}

enum ServiceRequestType {
  DATA        // ขอข้อมูล
  PROGRAM     // ขอโปรแกรม
  IT_ISSUE    // แจ้งปัญหา IT
}

enum RequestStatus {
  PENDING         // รอการอนุมัติ
  APPROVED        // อนุมัติแล้ว
  REJECTED        // ปฏิเสธ
  IN_PROGRESS     // กำลังดำเนินการ
  COMPLETED       // เสร็จสิ้น
  CANCELLED       // ยกเลิก
}
```

**Design Decisions**:
- ✅ **Snapshot Pattern**: เก็บข้อมูล requester/approver เป็น snapshot ป้องกันข้อมูลเปลี่ยนภายหลัง
- ✅ **Conditional Fields**: ฟิลด์บางอย่างใช้เฉพาะประเภทคำร้องบางประเภท (nullable)
- ✅ **Document HTML**: เก็บ HTML ไว้สำหรับ print (regenerate ได้เสมอ)
- ✅ **Unique taskId**: 1 request = 1 task maximum

---

### 3. Table: RequestTimeline (ประวัติ)

```prisma
model RequestTimeline {
  id           String              @id @default(cuid())
  requestId    String
  type         RequestTimelineType

  // ผู้ดำเนินการ (optional - บางเหตุการณ์ไม่มี actor)
  actorId      String?
  actorName    String?             // Snapshot: fullName
  actorJobTitle String?            // Snapshot: jobTitle
  actorAvatar  String?             // Snapshot: profileImageUrl

  // รายละเอียด
  description  String              // คำอธิบายเหตุการณ์
  metadata     Json?               // ข้อมูลเพิ่มเติม (oldStatus, newStatus, etc.)

  createdAt    DateTime            @default(now())

  // Relations
  request      ServiceRequest      @relation(fields: [requestId], references: [id], onDelete: Cascade)
  actor        User?               @relation("TimelineActor", fields: [actorId], references: [id])

  @@index([requestId])
  @@index([createdAt])
  @@map("request_timeline")
}

enum RequestTimelineType {
  CREATED           // คำร้องถูกสร้าง
  VIEWED            // ผู้อนุมัติเปิดอ่าน
  APPROVED          // อนุมัติ
  REJECTED          // ปฏิเสธ
  TASK_CREATED      // สร้าง task แล้ว
  TASK_ASSIGNED     // มอบหมายงาน
  TASK_UPDATED      // อัพเดตสถานะงาน
  COMMENTED         // แสดงความคิดเห็น
  COMPLETED         // เสร็จสิ้น
  CANCELLED         // ยกเลิก
}
```

**Design Decisions**:
- ✅ **Event Sourcing Pattern**: เก็บทุก event ที่เกิดขึ้น
- ✅ **Actor Snapshot**: เก็บข้อมูลผู้ดำเนินการเป็น snapshot
- ✅ **Flexible Metadata**: ใช้ JSON เก็บข้อมูลเพิ่มเติมแต่ละ event type

---

### 4. Table: RequestComment (ความคิดเห็น)

```prisma
model RequestComment {
  id          String         @id @default(cuid())
  requestId   String
  userId      String
  content     String         @db.Text
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  // Relations
  request     ServiceRequest @relation(fields: [requestId], references: [id], onDelete: Cascade)
  user        User           @relation("RequestComments", fields: [userId], references: [id])

  @@index([requestId])
  @@index([userId])
  @@index([createdAt])
  @@map("request_comments")
}
```

**Design Decisions**:
- ✅ **Simple Structure**: คล้าย task comments
- ✅ **Cascade Delete**: ลบ request → ลบ comments ทั้งหมด

---

### 5. Table: RequestApprover (ผู้มีสิทธิ์อนุมัติ)

```prisma
model RequestApprover {
  id              String              @id @default(cuid())
  userId          String
  approvalType    ApprovalType        // DATA, PROGRAM, IT_ISSUE
  isActive        Boolean             @default(true)
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt

  // Relations
  user            User                @relation("UserRequestApprovers", fields: [userId], references: [id])

  @@unique([userId, approvalType])  // 1 user สามารถมี 1 approval type เดียวกันได้แค่ครั้งเดียว
  @@index([userId])
  @@index([approvalType])
  @@index([isActive])
  @@map("request_approvers")
}

enum ApprovalType {
  DATA        // อนุมัติการขอข้อมูล
  PROGRAM     // อนุมัติการขอโปรแกรม
  IT_ISSUE    // อนุมัติการแจ้งปัญหา IT
}
```

**Design Decisions**:
- ✅ **Granular Permissions**: แยกสิทธิ์อนุมัติ 3 ประเภท
- ✅ **Unique Constraint**: 1 user ไม่ซ้ำ approval type
- ✅ **Soft Disable**: ใช้ isActive แทน delete

---

### 6. Table: SystemSettings (การตั้งค่าระบบ)

```prisma
model SystemSettings {
  id            String    @id @default(cuid())
  key           String    @unique
  value         String    @db.Text
  description   String?
  updatedBy     String?
  updatedAt     DateTime  @updatedAt

  // Relations
  updater       User?     @relation("SystemSettingsUpdater", fields: [updatedBy], references: [id])

  @@index([key])
  @@map("system_settings")
}

// Default settings to seed:
// - "IT_SERVICE_ENABLED": "true" | "false"
// - "HOSPITAL_NAME": "โรงพยาบาลชัยภูมิ" (example)
```

**Design Decisions**:
- ✅ **Key-Value Store**: ยืดหยุ่น เพิ่ม settings ได้ง่าย
- ✅ **Audit Trail**: เก็บว่าใครแก้ล่าสุด

---

### 7. Table: ServiceRequestFeedback (ประเมินความพึงพอใจ) ⭐ **NEW**

```prisma
model ServiceRequestFeedback {
  id                String         @id @default(cuid())
  serviceRequestId  String         @unique  // One feedback per request
  rating            Int            // ระดับความพึงพอใจ 1-10 ดาว
  comment           String?        @db.Text // ข้อเสนอแนะเพิ่มเติม (optional)
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt

  // Relations
  serviceRequest    ServiceRequest @relation(fields: [serviceRequestId], references: [id], onDelete: Cascade)

  @@index([serviceRequestId])
  @@index([rating])
  @@index([createdAt])
  @@map("service_request_feedback")
}
```

**Design Decisions**:
- ✅ **One feedback per request**: ใช้ `@unique` constraint บน serviceRequestId
- ✅ **Editable**: Requester สามารถแก้ไขความคิดเห็นได้ (updatedAt จะ track)
- ✅ **Rating 1-10**: ตรงกับมาตรฐานการประเมินราชการไทย (10 คะแนนเต็ม)
- ✅ **Optional comment**: ข้อเสนอแนะไม่บังคับ
- ✅ **Analytics-ready**: มี indexes สำหรับ query rating trends

**Validation Rules**:
```typescript
interface FeedbackValidation {
  rating: number;       // Required, min: 1, max: 10
  comment?: string;     // Optional, max: 1000 characters
}
```

**Business Rules**:
1. ✅ Requester สามารถให้ feedback ได้เฉพาะเมื่อ `status = COMPLETED`
2. ✅ Requester สามารถแก้ไข feedback ได้ตลอดเวลา
3. ✅ เฉพาะ SUPER_ADMIN/ADMIN เท่านั้นที่เห็น feedback ของ request อื่น
4. ✅ Feedback rating ≤ 3 ดาว จะส่ง notification ถึง SUPER_ADMIN/ADMIN
5. ✅ ไม่สามารถให้ feedback ซ้ำได้ (enforce by @unique constraint)

**Notification Trigger**:
```typescript
// เมื่อ rating ≤ 3 ดาว (low satisfaction)
if (feedback.rating <= 3) {
  notifySuperAdmins(
    "SERVICE_REQUEST_LOW_RATING",
    `คำร้อง ${requestNumber} ได้รับการประเมิน ${rating} ดาว - กรุณาตรวจสอบ`,
    `/it-service/feedback?requestId=${requestId}`
  );
}
```

---

### Relations Summary

**User Relations** (เพิ่มใน users table):
```prisma
model User {
  // ... existing fields

  // ⭐ NEW: IT Service Relations
  serviceRequests       ServiceRequest[]    @relation("RequestRequester")
  approvedRequests      ServiceRequest[]    @relation("RequestApprover")
  requestApprovers      RequestApprover[]   @relation("UserRequestApprovers")
  requestComments       RequestComment[]    @relation("RequestComments")
  requestTimeline       RequestTimeline[]   @relation("TimelineActor")
  systemSettingsUpdates SystemSettings[]    @relation("SystemSettingsUpdater")
}
```

**Task Relations** (เพิ่มใน tasks table):
```prisma
model Task {
  // ... existing fields

  // ⭐ NEW: Service Request link
  serviceRequest  ServiceRequest?  @relation("RequestTask")
}
```

---

### Database Indexes Strategy

**High Priority Indexes** (ใช้บ่อย):
- ✅ `service_requests.requesterId` - filter by user
- ✅ `service_requests.status` - filter by status
- ✅ `service_requests.type` - filter by type
- ✅ `service_requests.createdAt` - sort by date
- ✅ `request_timeline.requestId` - fetch timeline
- ✅ `request_approvers.userId + approvalType` - check permissions

**Composite Indexes** (พิจารณาเพิ่มถ้า performance ไม่ดี):
- `service_requests(status, createdAt)` - pending requests sorted by date
- `service_requests(requesterId, status)` - user's requests by status

---

## API Endpoints Specification

### Base Path
```
/api/service-requests
```

### Authentication
ทุก endpoint ต้องใช้ `withAuth()` middleware และ Bearer token

---

### Endpoint List (16 endpoints)

#### 1. System Settings

**GET /api/system-settings**
- **Purpose**: ดึงการตั้งค่าระบบ
- **Auth**: SUPER_ADMIN only
- **Response**:
```typescript
{
  success: true,
  data: {
    IT_SERVICE_ENABLED: boolean,
    HOSPITAL_NAME: string
  }
}
```

**PATCH /api/system-settings**
- **Purpose**: แก้ไขการตั้งค่าระบบ
- **Auth**: SUPER_ADMIN only
- **Body**:
```typescript
{
  IT_SERVICE_ENABLED?: boolean,
  HOSPITAL_NAME?: string
}
```

---

#### 2. Request Approvers Management

**GET /api/service-requests/approvers**
- **Purpose**: ดึงรายชื่อผู้มีสิทธิ์อนุมัติทั้งหมด
- **Auth**: SUPER_ADMIN only
- **Response**:
```typescript
{
  success: true,
  data: {
    approvers: Array<{
      id: string,
      user: {
        id: string,
        fullName: string,
        jobTitle: string,
        email: string
      },
      approvalType: "DATA" | "PROGRAM" | "IT_ISSUE",
      isActive: boolean
    }>
  }
}
```

**POST /api/service-requests/approvers**
- **Purpose**: เพิ่มผู้มีสิทธิ์อนุมัติ
- **Auth**: SUPER_ADMIN only
- **Body**:
```typescript
{
  userId: string,
  approvalType: "DATA" | "PROGRAM" | "IT_ISSUE"
}
```

**DELETE /api/service-requests/approvers/:id**
- **Purpose**: ลบผู้มีสิทธิ์อนุมัติ
- **Auth**: SUPER_ADMIN only

---

#### 3. Request Submission (USER)

**POST /api/service-requests**
- **Purpose**: สร้างคำร้องใหม่
- **Auth**: Authenticated users
- **Body**:
```typescript
{
  type: "DATA" | "PROGRAM" | "IT_ISSUE",
  subject: string,
  description: string,
  purpose?: string,           // DATA/PROGRAM only
  purposeOther?: string,      // DATA/PROGRAM only
  deadline?: number,          // DATA/PROGRAM only
  issueTime?: string,         // IT_ISSUE only (ISO datetime)
}
```
- **Response**:
```typescript
{
  success: true,
  data: {
    request: {
      id: string,
      requestNumber: string,
      type: string,
      status: string,
      documentHtml: string,
      createdAt: string
    }
  }
}
```
- **Logic**:
  1. Validate input ด้วย Zod
  2. Auto-generate requestNumber (SR-YYYY-NNNNN)
  3. Snapshot requester data จาก users table
  4. Generate document HTML ตามแม่แบบ
  5. Create request
  6. Create timeline entry (CREATED)
  7. Send notification ไปยัง approvers

---

#### 4. Request Listing

**GET /api/service-requests**
- **Purpose**: ดึงรายการคำร้อง
- **Auth**:
  - USER: เห็นเฉพาะของตัวเอง
  - Approvers: เห็น requests ตาม approval type
  - ADMIN/SUPER_ADMIN: เห็นทั้งหมด
- **Query Params**:
```typescript
{
  type?: "DATA" | "PROGRAM" | "IT_ISSUE",
  status?: "PENDING" | "APPROVED" | ...,
  startDate?: string,  // ISO date
  endDate?: string,    // ISO date
  page?: number,       // default: 1
  limit?: number       // default: 20
}
```
- **Response**:
```typescript
{
  success: true,
  data: {
    requests: Array<{
      id: string,
      requestNumber: string,
      type: string,
      subject: string,
      status: string,
      requesterName: string,
      createdAt: string
    }>,
    pagination: {
      total: number,
      page: number,
      limit: number,
      totalPages: number
    }
  }
}
```

**GET /api/service-requests/:id**
- **Purpose**: ดูรายละเอียดคำร้อง
- **Auth**:
  - Requester ของ request นั้น
  - Approver ที่มีสิทธิ์
  - ADMIN/SUPER_ADMIN
- **Response**:
```typescript
{
  success: true,
  data: {
    request: {
      id: string,
      requestNumber: string,
      type: string,
      subject: string,
      description: string,
      purpose?: string,
      deadline?: number,
      issueTime?: string,
      status: string,
      documentHtml: string,
      requesterName: string,
      requesterJobTitle: string,
      requesterDivision: string,
      requesterPhone: string,
      requesterEmail: string,
      approverName?: string,
      approverJobTitle?: string,
      approvedAt?: string,
      taskId?: string,
      createdAt: string,
      updatedAt: string
    }
  }
}
```
- **Logic**:
  1. Check permission
  2. Fetch request with relations
  3. Create timeline entry (VIEWED) if approver opens

---

#### 5. Request Approval (Approvers)

**POST /api/service-requests/:id/approve**
- **Purpose**: อนุมัติคำร้อง
- **Auth**: Approvers with matching approval type
- **Response**:
```typescript
{
  success: true,
  data: {
    request: { ... },
    task: {
      id: string,
      name: string,
      projectId: string
    }
  }
}
```
- **Logic**:
  1. Check approver permission
  2. Update request status = APPROVED
  3. Snapshot approver data
  4. Create Task automatically:
     - Name: คำร้อง[type] #[requestNumber] - [subject]
     - Description: Link to request + รายละเอียด
     - Priority: 2 (High)
     - StatusId: Default project status
  5. Link task to request
  6. Create timeline entries (APPROVED, TASK_CREATED)
  7. Send notification to requester

**POST /api/service-requests/:id/reject**
- **Purpose**: ปฏิเสธคำร้อง
- **Auth**: Approvers with matching approval type
- **Body**:
```typescript
{
  reason: string
}
```
- **Logic**:
  1. Check approver permission
  2. Update request status = REJECTED
  3. Create timeline entry (REJECTED) with reason
  4. Send notification to requester

---

#### 6. Timeline & Comments

**GET /api/service-requests/:id/timeline**
- **Purpose**: ดึง timeline ของคำร้อง
- **Auth**: Requester, Approver, ADMIN
- **Response**:
```typescript
{
  success: true,
  data: {
    timeline: Array<{
      id: string,
      type: string,
      description: string,
      actorName?: string,
      actorJobTitle?: string,
      actorAvatar?: string,
      metadata?: any,
      createdAt: string
    }>
  }
}
```

**POST /api/service-requests/:id/comments**
- **Purpose**: เพิ่ม comment ใน request
- **Auth**: Requester, Task assignees, Approver
- **Body**:
```typescript
{
  content: string
}
```
- **Logic**:
  1. Create comment
  2. Create timeline entry (COMMENTED)
  3. Send notification ตามกรณี

**GET /api/service-requests/:id/comments**
- **Purpose**: ดึง comments ของคำร้อง
- **Auth**: Same as timeline
- **Response**:
```typescript
{
  success: true,
  data: {
    comments: Array<{
      id: string,
      content: string,
      user: {
        fullName: string,
        jobTitle: string,
        profileImageUrl: string
      },
      createdAt: string
    }>
  }
}
```

---

#### 7. Queue System

**GET /api/service-requests/:id/queue**
- **Purpose**: ดูสถานะคิวของคำร้อง (USER เห็นลำดับคิวของตัวเอง)
- **Auth**:
  - Requester ของ request นั้น
  - Approver ที่มีสิทธิ์
  - ADMIN/SUPER_ADMIN
- **Response**:
```typescript
{
  success: true,
  data: {
    queuePosition: number,     // ลำดับคิวปัจจุบัน (เช่น 3)
    totalInQueue: number,      // จำนวนคิวทั้งหมด (เช่น 8)
    approverName: string,      // ชื่อผู้อนุมัติ
    estimatedWaitTime: string, // เวลารอโดยประมาณ (เช่น "1-2 วัน")
    status: string             // สถานะปัจจุบัน
  }
}
```
- **Logic**:
  1. Filter requests ตาม type (DATA, PROGRAM, IT_ISSUE)
  2. Filter เฉพาะ status = PENDING
  3. Sort ตาม createdAt ASC (FIFO - First In First Out)
  4. หา position ของ request นี้ใน queue
  5. คำนวณ estimatedWaitTime จากค่าเฉลี่ย historical data
  6. ถ้า lastKnownQueuePosition เปลี่ยน → create timeline entry (QUEUE_UPDATED)

---

#### 8. Task Integration

**PATCH /api/tasks/:taskId**
- **Extension**: เมื่อ task ที่มี serviceRequest link ถูก update
- **Logic เพิ่มเติม**:
  1. ถ้า update status → create timeline entry (TASK_UPDATED)
  2. ถ้า close task → update request status = COMPLETED
  3. ถ้า assign user → create timeline entry (TASK_ASSIGNED)

---

#### 9. Feedback System (ประเมินความพึงพอใจ) ⭐ **NEW**

**POST /api/service-requests/:id/feedback**
- **Purpose**: ส่งหรือแก้ไขความคิดเห็นประเมินความพึงพอใจ
- **Auth**: Requester only
- **Validation**:
  - Request must have `status = COMPLETED`
  - Only requester can submit feedback
  - Rating: 1-10 (required)
  - Comment: max 1000 characters (optional)
- **Request Body**:
  ```typescript
  {
    rating: number;     // 1-10 stars
    comment?: string;   // Optional feedback text
  }
  ```
- **Response**:
  ```typescript
  {
    success: true,
    data: {
      feedback: {
        id: string,
        serviceRequestId: string,
        rating: number,
        comment: string | null,
        createdAt: string,
        updatedAt: string
      }
    }
  }
  ```
- **Business Logic**:
  1. Upsert feedback (create if not exists, update if exists)
  2. If rating ≤ 3: notify SUPER_ADMIN/ADMIN
  3. Create timeline entry: "FEEDBACK_SUBMITTED"
  4. Return feedback data

**GET /api/service-requests/:id/feedback**
- **Purpose**: ดึงข้อมูล feedback ของ request
- **Auth**: Requester, Approver, ADMIN, SUPER_ADMIN
- **Response**:
  ```typescript
  {
    success: true,
    data: {
      feedback: ServiceRequestFeedback | null
    }
  }
  ```
- **Business Logic**:
  - Return null if no feedback yet
  - Check permission: only requester, approvers, or admins

**GET /api/service-requests/feedback/stats**
- **Purpose**: สถิติ feedback สำหรับ SUPER_ADMIN Dashboard
- **Auth**: SUPER_ADMIN, ADMIN only
- **Query Params**:
  ```typescript
  {
    type?: "DATA" | "PROGRAM" | "IT_ISSUE";  // Filter by request type
    startDate?: string;   // ISO date
    endDate?: string;     // ISO date
    departmentId?: string;  // Filter by department
  }
  ```
- **Response**:
  ```typescript
  {
    success: true,
    data: {
      stats: {
        totalFeedbacks: number,
        averageRating: number,  // Overall average (0-10)
        ratingDistribution: {
          1: number,  // Count of 1-star ratings
          2: number,
          // ... up to 10
        },
        byType: {
          DATA: { count: number, avgRating: number },
          PROGRAM: { count: number, avgRating: number },
          IT_ISSUE: { count: number, avgRating: number }
        },
        trend: [
          { month: string, avgRating: number, count: number }
        ],
        lowRatings: [  // Feedbacks with rating ≤ 3
          {
            requestId: string,
            requestNumber: string,
            rating: number,
            comment: string,
            createdAt: string
          }
        ]
      }
    }
  }
  ```
- **Business Logic**:
  1. Apply filters (type, date range, department)
  2. Calculate average rating
  3. Group by rating (1-10)
  4. Calculate trend (monthly aggregation)
  5. Find low-rated requests (rating ≤ 3)

**GET /api/service-requests/feedback/export**
- **Purpose**: Export feedback data as CSV
- **Auth**: SUPER_ADMIN, ADMIN only
- **Query Params**: Same as stats endpoint
- **Response**: CSV file download
- **CSV Columns**:
  - Request Number
  - Request Type
  - Requester Name
  - Department
  - Rating (1-10)
  - Comment
  - Feedback Date
  - Completion Date

---

### API Response Standards

ทุก endpoint ต้องใช้ `successResponse()` และ `errorResponse()` helper:

```typescript
// Success
{
  success: true,
  data: { ... },
  message?: string
}

// Error
{
  success: false,
  error: {
    code: "ERROR_CODE",
    message: "Human-readable message"
  }
}
```

### Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `UNAUTHORIZED` | 401 | ไม่ได้ล็อกอิน |
| `FORBIDDEN` | 403 | ไม่มีสิทธิ์เข้าถึง |
| `NOT_FOUND` | 404 | ไม่พบข้อมูล |
| `INVALID_INPUT` | 400 | ข้อมูล input ไม่ถูกต้อง |
| `MODULE_DISABLED` | 403 | IT Service module ถูกปิดใช้งาน |
| `APPROVER_REQUIRED` | 403 | ต้องเป็น approver เท่านั้น |

---

## UI/UX Design

### Design Principles

✅ **Consistency** - ใช้ design system เดียวกับแอพหลัก (shadcn/ui)
✅ **Simplicity** - USER สามารถใช้งานได้โดยไม่ต้องอบรม
✅ **Responsiveness** - รองรับ desktop (>= 768px) และ mobile (< 768px)
✅ **Thai-first** - ภาษาไทยทั้งหมด ตาม terminology ที่กำหนด
✅ **Accessibility** - WCAG 2.1 Level AA compliant

---

### Navigation Strategy

#### Sidebar Menu Integration

**เพิ่ม Menu Item ใหม่**: "IT Service" (ใช้ภาษาอังกฤษตรงๆ ตามที่ร้องขอ)

```typescript
// src/components/layout/sidebar.tsx - mainNavigation array
const mainNavigation = [
  {
    name: "แดชบอร์ด",
    href: "/dashboard",
    icon: LayoutDashboard,
    enabled: true,
    requiredRoles: [],
  },
  {
    name: "งาน",
    href: "/department/tasks",
    icon: CheckSquare,
    enabled: true,
    requiredRoles: [],
  },
  {
    name: "โปรเจกต์",
    href: "/projects",
    icon: FolderKanban,
    enabled: true,
    requiredRoles: ["ADMIN", "CHIEF", "LEADER", "HEAD"],
  },
  // ⭐ NEW - IT Service Menu
  {
    name: "IT Service",
    href: "/it-service",
    icon: Headphones, // or HelpCircle, Server, Zap (lucide-react)
    enabled: true,
    requiredRoles: [], // All roles can access
  },
  {
    name: "คำร้องขอ",
    href: "/it-service/manage",
    icon: FileText,
    enabled: true,
    requiredRoles: ["ADMIN", "CHIEF", "LEADER", "HEAD"], // Approvers only
    badge: "dynamic", // Show pending count
  },
  {
    name: "รายงาน",
    href: "/reports",
    icon: BarChart3,
    enabled: true,
    requiredRoles: ["ADMIN", "CHIEF", "LEADER", "HEAD", "MEMBER"],
  },
  {
    name: "บุคลากร",
    href: "/users",
    icon: Users,
    enabled: true,
    requiredRoles: ["ADMIN", "CHIEF", "LEADER", "HEAD"],
  },
];
```

**Menu Behavior by Role**:

| Role | Sees "IT Service"? | Sees "คำร้องขอ"? | Destination |
|------|-------------------|------------------|-------------|
| **USER** | ✅ Yes | ❌ No | `/it-service` (Portal) |
| **MEMBER** | ✅ Yes | ❌ No | `/it-service` (Portal) |
| **HEAD+** | ✅ Yes | ✅ Yes (with badge) | `/it-service` (Portal) |
| **Approver** | ✅ Yes | ✅ Yes (with badge) | `/it-service` (Portal) |
| **ADMIN/SUPER_ADMIN** | ✅ Yes | ✅ Yes (with badge) | `/it-service` (Portal) |

**Badge Logic for "คำร้องขอ"**:
```typescript
// Fetch pending count
const { data } = useRequestsPendingCount();
// Show badge: (3) or (12+) if > 99

<Badge variant="destructive">{count > 99 ? '99+' : count}</Badge>
```

---

### Layout Architecture

#### Layout A: IT Service Portal (for USER role - auto-redirect)

```
┌─────────────────────────────────────────────────────────┐
│ IT Service Top Bar                                      │
│ [IT Service Logo] ... [Notifications] [User Dropdown]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Main Content Area                                       │
│ (No Sidebar - Clean Interface for USER)                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**When Used**:
- USER role logs in → auto-redirect to `/it-service`
- USER clicks "IT Service" menu → clean portal page
- No sidebar = focused experience

---

#### Layout B: Dashboard Layout (for non-USER roles)

```
┌────────────────────────────────────────────────────────────┐
│ Dashboard Top Bar (Regular)                                │
├──────────────┬─────────────────────────────────────────────┤
│              │                                             │
│  Sidebar     │  /it-service page content                  │
│  (with       │  (Portal view OR Management view)          │
│  "IT Service"│                                             │
│  highlighted)│                                             │
│              │                                             │
└──────────────┴─────────────────────────────────────────────┘
```

**When Used**:
- MEMBER/HEAD/LEADER/ADMIN/SUPER_ADMIN clicks "IT Service" menu
- Uses regular dashboard layout with sidebar
- Keeps navigation accessible

**Implementation**:
```typescript
// src/app/(dashboard)/it-service/layout.tsx (NEW)
export default function ITServiceLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  // USER role gets clean layout
  if (user?.role === 'USER') {
    return <ITServiceCleanLayout>{children}</ITServiceCleanLayout>;
  }

  // Other roles get regular dashboard layout
  return <>{children}</>;
}
```

**Key Differences**:
- ❌ **USER**: No Sidebar - Clean minimalist interface
- ✅ **Non-USER**: Regular Sidebar - Full navigation available
- ✅ **Custom Top Bar** (USER only) - Logo "IT Service" แทน "ProjectFlows"
- ✅ **Auto-redirect** (USER only) - Login → IT Service Portal

---

### Page Designs

### Queue System Design

#### Overview

ระบบคิวแสดงตำแหน่งคำร้องของ USER ในลำดับการอนุมัติ ช่วยให้ USER มองเห็นว่าคำร้องของตนอยู่ในลำดับที่เท่าไร และต้องรออีกกี่คำร้องก่อนถึงตา

#### Queue Calculation Logic

**สูตรคำนวณ**:
```typescript
Queue Position = COUNT(requests WHERE:
  - status = PENDING
  - type = same_type (DATA/PROGRAM/IT_ISSUE)
  - createdAt < current_request.createdAt
) + 1

Example:
- Request A (DATA): createdAt 10:00 → Queue: 1
- Request B (DATA): createdAt 10:05 → Queue: 2
- Request C (PROGRAM): createdAt 10:10 → Queue: 1 (different type)
- Request D (DATA): createdAt 10:15 → Queue: 3
```

**Key Points**:
- ✅ แยกคิวตาม request type (DATA, PROGRAM, IT_ISSUE)
- ✅ เรียงตามลำดับเวลาที่สร้าง (FIFO - First In First Out)
- ✅ เฉพาะ PENDING status เท่านั้น
- ✅ Update real-time เมื่อมี request ใหม่หรือถูกอนุมัติ

#### API Endpoint

**GET /api/service-requests/:id/queue**
- **Purpose**: ดึงข้อมูลตำแหน่งคิว
- **Auth**: Requester, Approver, ADMIN
- **Response**:
```typescript
{
  success: true,
  data: {
    queuePosition: number,        // ตำแหน่งคิว (1, 2, 3, ...)
    totalInQueue: number,         // จำนวนคำร้องรอทั้งหมด (same type)
    estimatedWaitTime: string?,   // (Optional) ประมาณเวลารอ "1-2 วัน"
    approverName: string?,        // ชื่อผู้อนุมัติ
    status: "PENDING" | "APPROVED" | ...
  }
}

// Example Response:
{
  success: true,
  data: {
    queuePosition: 3,
    totalInQueue: 8,
    estimatedWaitTime: "1-2 วัน",
    approverName: "นาย บุญมี ดี",
    status: "PENDING"
  }
}
```

#### Queue Display in UI

**Location 1: Request Card (Portal Page)**
```typescript
<RequestCard>
  <div className="flex justify-between items-center">
    <div>
      <h3>SR-2025-00123</h3>
      <p className="text-sm text-muted-foreground">
        ขอข้อมูลสถิติผู้ป่วย
      </p>
    </div>
    <div className="text-right">
      {status === 'PENDING' && (
        <Badge variant="warning" className="gap-1">
          <Clock className="h-3 w-3" />
          คิวที่ {queuePosition} / {totalInQueue}
        </Badge>
      )}
      {status === 'APPROVED' && (
        <Badge variant="success">✅ อนุมัติแล้ว</Badge>
      )}
    </div>
  </div>
</RequestCard>
```

**Visual Example**:
```
┌──────────────────────────────────────┐
│ SR-2025-00123                [คิวที่ 3/8] │
│ ขอข้อมูลสถิติผู้ป่วย            🟡 รออนุมัติ │
│ สร้างเมื่อ: 31/10/25 10:15              │
└──────────────────────────────────────┘
```

---

**Location 2: Tracking Page (Top Section)**
```
┌────────────────────────────────────────────────────────┐
│  ← Back to Portal        ติดตามคำร้อง SR-2025-00123   │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ⏱️ สถานะคิว                                          │
│  ┌──────────────────────────────────────────────────┐ │
│  │  📊 คำร้องของคุณอยู่ในลำดับที่ 3                  │ │
│  │  👥 รออนุมัติจาก: นาย บุญมี ดี                   │ │
│  │  ⏰ ประมาณเวลารอ: 1-2 วันทำการ                   │ │
│  │  📈 จำนวนคำร้องรอทั้งหมด: 8 คำร้อง               │ │
│  │                                                  │ │
│  │  Queue Progress:                                 │ │
│  │  [████████░░░░░░░░░░░░] 3/8 (37.5%)             │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
└────────────────────────────────────────────────────────┘
```

**Component Structure**:
```typescript
// src/components/it-service/queue-status-card.tsx
interface QueueStatusProps {
  queuePosition: number;
  totalInQueue: number;
  approverName?: string;
  estimatedWaitTime?: string;
  status: RequestStatus;
}

export function QueueStatusCard({
  queuePosition,
  totalInQueue,
  approverName,
  estimatedWaitTime,
  status
}: QueueStatusProps) {
  if (status !== 'PENDING') return null;

  const progress = ((queuePosition - 1) / totalInQueue) * 100;

  return (
    <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-yellow-600" />
          สถานะคิว
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">ลำดับคิวของคุณ</p>
            <p className="text-3xl font-bold text-yellow-600">
              {queuePosition} / {totalInQueue}
            </p>
          </div>
          {approverName && (
            <div>
              <p className="text-sm text-muted-foreground">รออนุมัติจาก</p>
              <p className="text-sm font-medium">{approverName}</p>
            </div>
          )}
        </div>

        {estimatedWaitTime && (
          <div>
            <p className="text-sm text-muted-foreground">ประมาณเวลารอ</p>
            <p className="text-sm font-medium">{estimatedWaitTime}</p>
          </div>
        )}

        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span>ความคืบหน้า</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            มี {queuePosition - 1} คำร้องข้างหน้าคุณ
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

**Location 3: Timeline Entry (Auto-update)**

เมื่อตำแหน่งคิวเปลี่ยน → สร้าง timeline entry อัตโนมัติ:

```
31/10/25 10:15 : 📝 คำร้องขอหมายเลข SR-2025-00123 ถูกบันทึกในระบบ
                 ลำดับคิวปัจจุบัน: 5 / 12
    ↓
31/10/25 10:30 : ⬆️ ลำดับคิวเปลี่ยนเป็น: 4 / 11
                 (มี 1 คำร้องได้รับการอนุมัติ)
    ↓
31/10/25 10:45 : ⬆️ ลำดับคิวเปลี่ยนเป็น: 3 / 10
    ↓
31/10/25 11:00 : ⬆️ ลำดับคิวเปลี่ยนเป็น: 2 / 9
```

**Timeline Entry Type**:
```typescript
// Add to RequestTimelineType enum
enum RequestTimelineType {
  CREATED,
  VIEWED,
  APPROVED,
  REJECTED,
  TASK_CREATED,
  TASK_ASSIGNED,
  TASK_UPDATED,
  COMMENTED,
  COMPLETED,
  CANCELLED,
  QUEUE_UPDATED,  // ⭐ NEW - Queue position changed
}
```

**Auto-create Logic**:
```typescript
// When any PENDING request of same type is approved/rejected
async function updateQueuePositions(approvalType: 'DATA' | 'PROGRAM' | 'IT_ISSUE') {
  // Get all pending requests of this type
  const pendingRequests = await prisma.serviceRequest.findMany({
    where: {
      type: approvalType,
      status: 'PENDING'
    },
    orderBy: { createdAt: 'asc' }
  });

  // Create timeline entry for each if position changed
  for (const [index, request] of pendingRequests.entries()) {
    const newPosition = index + 1;
    const oldPosition = request.lastKnownQueuePosition; // Store in DB

    if (oldPosition && oldPosition !== newPosition) {
      // Position changed - create timeline entry
      await prisma.requestTimeline.create({
        data: {
          requestId: request.id,
          type: 'QUEUE_UPDATED',
          description: `ลำดับคิวเปลี่ยนเป็น: ${newPosition} / ${pendingRequests.length}`,
          metadata: {
            oldPosition,
            newPosition,
            totalInQueue: pendingRequests.length
          }
        }
      });

      // Update last known position
      await prisma.serviceRequest.update({
        where: { id: request.id },
        data: { lastKnownQueuePosition: newPosition }
      });
    }
  }
}
```

#### Database Schema Addition

เพิ่มฟิลด์ใน `ServiceRequest` table:

```prisma
model ServiceRequest {
  // ... existing fields

  // ⭐ NEW - Queue tracking
  lastKnownQueuePosition Int?  // เก็บตำแหน่งคิวล่าสุดเพื่อ detect changes

  // ... relations
}
```

#### Estimated Wait Time Calculation (Optional - Advanced)

```typescript
// Calculate based on historical data
async function calculateEstimatedWaitTime(
  requestType: 'DATA' | 'PROGRAM' | 'IT_ISSUE',
  queuePosition: number
): Promise<string | null> {
  // Get average approval time for last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const approvedRequests = await prisma.serviceRequest.findMany({
    where: {
      type: requestType,
      status: 'APPROVED',
      approvedAt: { gte: thirtyDaysAgo }
    },
    select: {
      createdAt: true,
      approvedAt: true
    }
  });

  if (approvedRequests.length === 0) return null;

  // Calculate average time from creation to approval (in hours)
  const totalHours = approvedRequests.reduce((sum, req) => {
    const diffMs = req.approvedAt!.getTime() - req.createdAt.getTime();
    return sum + diffMs / (1000 * 60 * 60);
  }, 0);

  const avgHoursPerRequest = totalHours / approvedRequests.length;

  // Estimate wait time = avgHours * queuePosition
  const estimatedHours = avgHoursPerRequest * queuePosition;

  // Convert to human-readable
  if (estimatedHours < 4) return "ภายในวันนี้";
  if (estimatedHours < 24) return "ภายใน 1 วัน";
  if (estimatedHours < 48) return "1-2 วันทำการ";
  if (estimatedHours < 120) return "2-5 วันทำการ";
  return "มากกว่า 5 วันทำการ";
}
```

#### Queue System Benefits

✅ **Transparency** - USER เห็นตำแหน่งคิวของตนเอง
✅ **Expectation Management** - ประมาณเวลารอได้
✅ **Fairness** - FIFO principle ยุติธรรม
✅ **Real-time Updates** - Timeline แจ้งเมื่อคิวเปลี่ยน
✅ **Motivation** - เห็นความคืบหน้าจาก progress bar

---

#### 1. IT Service Portal (หน้าแรกสำหรับ USER)

**URL**: `/it-service`

**Layout**:
```
┌────────────────────────────────────────────────────────────────────┐
│                      IT Service Top Bar                            │
├─────────────────────────────────────┬──────────────────────────────┤
│                                     │                              │
│  🎯 Actions Section (Left)          │  📋 My Requests (Right)     │
│                                     │                              │
│  ┌────────────────────────┐         │  ┌──────────────────────┐  │
│  │  📊 ขอข้อมูล/โปรแกรม    │         │  │  Filters            │  │
│  │  [Large Icon]          │         │  │  [Type] [Date]      │  │
│  │  Request data/programs │         │  └──────────────────────┘  │
│  └────────────────────────┘         │                              │
│                                     │  ┌──────────────────────┐  │
│  ┌────────────────────────┐         │  │ SR-2025-00001       │  │
│  │  🛠️ แจ้งปัญหา IT        │         │  │ ขอข้อมูล...         │  │
│  │  [Large Icon]          │         │  │ [Status] [Date]     │  │
│  │  Report IT issues      │         │  └──────────────────────┘  │
│  └────────────────────────┘         │                              │
│                                     │  ┌──────────────────────┐  │
│  ┌────────────────────────┐         │  │ SR-2025-00002       │  │
│  │  🔍 ติดตามงาน           │         │  │ แจ้งปัญหา...         │  │
│  │  [Large Icon]          │         │  │ [Status] [Date]     │  │
│  │  Track your requests   │         │  └──────────────────────┘  │
│  └────────────────────────┘         │                              │
│                                     │  [View All →]                │
│                                     │                              │
└─────────────────────────────────────┴──────────────────────────────┘
```

**Components**:
- **Action Cards** (Left): 3 cards ขนาดใหญ่ สะดุดตา
  - เปลี่ยน icon + สีเมื่อ hover
  - คลิกเปิด modal ฟอร์มหรือไปหน้าติดตามงาน

- **Request Cards** (Right): แสดง 5 requests ล่าสุด
  - Card มี: Request number, Type badge, Subject, Status badge, Date
  - Infinite scroll / pagination สำหรับดู request เก่า
  - Filters: Type (All/Data/Program/Issue), Date range picker

**Responsive (Mobile < 768px)**:
```
┌──────────────────────────┐
│  IT Service Top Bar      │
├──────────────────────────┤
│                          │
│  🎯 Actions (Stacked)    │
│  ┌────────────────────┐  │
│  │ 📊 ขอข้อมูล/โปรแกรม │  │
│  └────────────────────┘  │
│  ┌────────────────────┐  │
│  │ 🛠️ แจ้งปัญหา IT     │  │
│  └────────────────────┘  │
│  ┌────────────────────┐  │
│  │ 🔍 ติดตามงาน        │  │
│  └────────────────────┘  │
│                          │
│  📋 My Requests          │
│  [Filters]               │
│  ┌────────────────────┐  │
│  │ SR-2025-00001      │  │
│  │ [Details]          │  │
│  └────────────────────┘  │
│  [More requests...]      │
│                          │
└──────────────────────────┘
```

---

#### 2. Request Form Modal

**Trigger**: คลิก "ขอข้อมูล/โปรแกรม" หรือ "แจ้งปัญหา IT"

**Design Pattern**: Modal (shadcn Dialog) ขนาด Large

**Form Layout - ขอข้อมูล/โปรแกรม**:
```
┌─────────────────────────────────────────────────────┐
│  ขอข้อมูล/โปรแกรม                           [X]    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ข้อมูลผู้ขอ (Auto-filled - Read-only)             │
│  ┌─────────────────────────────────────────────┐   │
│  │ ชื่อ-สกุล: นาย สมชาย ใจดี                  │   │
│  │ ตำแหน่ง: นักวิชาการคอมพิวเตอร์             │   │
│  │ สังกัด: กลุ่มงานเทคโนโลยีสารสนเทศ          │   │
│  │ โทรศัพท์: 1234                             │   │
│  │ Email: somchai@hospital.test               │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  รายละเอียดคำร้อง *                                │
│  ┌─────────────────────────────────────────────┐   │
│  │ [เรื่อง - Text Input]                      │   │
│  │                                             │   │
│  │ [รายละเอียด - Textarea 4 rows]             │   │
│  │                                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  วัตถุประสงค์การขอ *                               │
│  ┌─────────────────────────────────────────────┐   │
│  │ ☐ ผู้บริหาร  ☐ ศึกษาต่อ                    │   │
│  │ ☐ เพิ่มสมรรถนะบุคลากร                      │   │
│  │ ☐ อื่นๆ [Text Input if checked]            │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ความต้องการให้แล้วเสร็จภายใน *                    │
│  ┌───────┐  วัน                                   │
│  │ [   ] │  (ตัวเลข)                              │
│  └───────┘                                         │
│                                                     │
│  ┌──────────────────┐  ┌──────────────┐            │
│  │ Preview Document │  │    Submit    │            │
│  └──────────────────┘  └──────────────┘            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Form Layout - แจ้งปัญหา IT**:
```
┌─────────────────────────────────────────────────────┐
│  แจ้งปัญหา IT                                 [X]   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ข้อมูลผู้แจ้ง (Auto-filled - Read-only)           │
│  [...same as above...]                              │
│                                                     │
│  รายละเอียดปัญหา *                                 │
│  ┌─────────────────────────────────────────────┐   │
│  │ [เรื่อง - Text Input]                      │   │
│  │                                             │   │
│  │ [รายละเอียดปัญหา - Textarea 6 rows]        │   │
│  │                                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  เวลาที่พบปัญหา *                                  │
│  ┌─────────────────────────────────────────────┐   │
│  │ [DateTime Picker]                           │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌──────────────────┐  ┌──────────────┐            │
│  │ Preview Document │  │    Submit    │            │
│  └──────────────────┘  └──────────────┘            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Validation**:
- Required fields: เรื่อง, รายละเอียด, วัตถุประสงค์ (DATA/PROGRAM), deadline (DATA/PROGRAM), เวลา (IT_ISSUE)
- Real-time validation ด้วย React Hook Form + Zod
- แสดง error message ใต้ฟิลด์ที่ invalid

**Preview Document**:
- เมื่อคลิก "Preview Document" เปิด modal ใหม่แสดงเอกสารฉบับสมบูรณ์
- ใช้ component `DocumentPreview` (เดียวกับหน้าติดตามงาน)

---

#### 3. Document Preview Modal

**Trigger**: คลิก "Preview Document" ใน form หรือใน tracking page

**Design**:
```
┌────────────────────────────────────────────────────────┐
│  เอกสารคำร้อง                                    [X]  │
├────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────┐ │
│  │  ┌────────────────────────────────────────────┐ │ │
│  │  │  [Document Content in Thai Official Style] │ │ │
│  │  │                                            │ │ │
│  │  │  เลขที่ใบงาน SR-2025-00001                │ │ │
│  │  │                                            │ │ │
│  │  │  เรื่อง ขอโปรแกรมและข้อมูลสารสนเทศ        │ │ │
│  │  │                                            │ │ │
│  │  │      วันที่ 31 ตุลาคม 2568                │ │ │
│  │  │  เรียน หัวหน้ากลุ่มภารกิจสุขภาพดิจิทัล    │ │ │
│  │  │                                            │ │ │
│  │  │  หนังสือฉบับนี้ ข้าพเจ้า นาย สมชาย ใจดี  │ │ │
│  │  │  ตำแหน่ง นักวิชาการคอมพิวเตอร์...         │ │ │
│  │  │  ...                                       │ │ │
│  │  └────────────────────────────────────────────┘ │ │
│  │  [Scroll for more content]                     │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  ┌───────────────┐  ┌───────────────┐                │
│  │  🖨️ Print     │  │    Close      │                │
│  └───────────────┘  └───────────────┘                │
│                                                        │
└────────────────────────────────────────────────────────┘
```

**Document Styling** (CSS):
```css
@media print {
  /* Show only document content when printing */
  body * { visibility: hidden; }
  .document-print-area, .document-print-area * {
    visibility: visible;
  }
  .document-print-area {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    font-family: 'Sarabun', sans-serif;
    font-size: 16pt;
    line-height: 1.6;
    page-break-inside: avoid;
  }
}
```

**Font**: Sarabun 16pt (ต้อง import Google Fonts หรือ self-host)

---

#### 4. Request Tracking Page

**URL**: `/it-service/requests/:id`

**Layout**:
```
┌────────────────────────────────────────────────────────────────┐
│  IT Service Top Bar                                            │
├────────────────────────────────────────────────────────────────┤
│  ← Back to Portal        ติดตามคำร้อง SR-2025-00001           │
├─────────────────────────────────────┬──────────────────────────┤
│                                     │                          │
│  📄 Document Preview (Left)         │  🕐 Timeline (Right)     │
│                                     │                          │
│  ┌───────────────────────────────┐  │  Status: [Badge]         │
│  │  [Document Mini Preview]     │  │                          │
│  │  เลขที่ใบงาน SR-2025-00001   │  │  ┌────────────────────┐ │
│  │  เรื่อง ขอโปรแกรม...         │  │  │ 31/10/25 10:30    │ │
│  │  ...                         │  │  │ 📝 คำร้องถูกสร้าง  │ │
│  └───────────────────────────────┘  │  └────────────────────┘ │
│                                     │          ↓               │
│  ┌───────────────┐                  │  ┌────────────────────┐ │
│  │  🖨️ Print    │                  │  │ 31/10/25 10:45    │ │
│  └───────────────┘                  │  │ 👤 นาย บุญมี ดี  │ │
│                                     │  │ เปิดอ่านคำร้อง     │ │
│                                     │  └────────────────────┘ │
│                                     │          ↓               │
│                                     │  ┌────────────────────┐ │
│                                     │  │ 31/10/25 11:00    │ │
│                                     │  │ ✅ นาย บุญมี ดี  │ │
│                                     │  │ อนุมัติคำร้อง      │ │
│                                     │  └────────────────────┘ │
│                                     │          ↓               │
│                                     │  ┌────────────────────┐ │
│                                     │  │ 31/10/25 11:05    │ │
│                                     │  │ 📌 Task #T-001    │ │
│                                     │  │ มอบหมายให้ นาย... │ │
│                                     │  └────────────────────┘ │
│                                     │          ↓               │
│                                     │  [View More ↓]          │
│                                     │                          │
│                                     │  💬 Add Comment          │
│                                     │  ┌────────────────────┐ │
│                                     │  │ [Text Input]       │ │
│                                     │  │ [Send Button]      │ │
│                                     │  └────────────────────┘ │
│                                     │                          │
└─────────────────────────────────────┴──────────────────────────┘
```

**Timeline Item Component**:
```typescript
<TimelineItem>
  <Avatar src={actorAvatar} />
  <div>
    <div className="flex items-center gap-2">
      <span className="font-semibold">{actorName}</span>
      {actorJobTitle && <span className="text-muted-foreground">({actorJobTitle})</span>}
    </div>
    <div className="text-sm">{description}</div>
    <div className="text-xs text-muted-foreground">{formatDateTime(createdAt)}</div>
  </div>
</TimelineItem>
```

**Status Badges**:
- PENDING: 🟡 Yellow
- APPROVED: 🟢 Green
- REJECTED: 🔴 Red
- IN_PROGRESS: 🔵 Blue
- COMPLETED: ✅ Green with checkmark
- CANCELLED: ⚫ Gray

**Responsive (Mobile)**:
- Document preview พับได้ (accordion)
- Timeline แสดงเต็มหน้าจอ
- Comment section ติดอยู่ด้านล่าง (sticky)

---

#### 5. Request Management Page (สำหรับ Approvers)

**URL**: `/it-service/manage`

**Access**: Approvers only (sidebar menu "คำร้องขอ")

**Layout**:
```
┌────────────────────────────────────────────────────────────────┐
│  Dashboard Top Bar (Regular)                                   │
│  [Sidebar with "คำร้องขอ" highlighted]                         │
├────────────────────────────────────────────────────────────────┤
│  จัดการคำร้องขอ                                                │
│                                                                │
│  Filters:  [Type ▼] [Status ▼] [Date Range]  [Search]         │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Request List Table                                      │ │
│  ├──────┬──────────┬─────────────┬────────┬────────┬────────┤ │
│  │ No.  │ Number   │ Subject     │ Type   │ Status │ Action │ │
│  ├──────┼──────────┼─────────────┼────────┼────────┼────────┤ │
│  │  1   │ SR-001   │ ขอข้อมูล... │ DATA   │ PEND.  │ [View] │ │
│  │  2   │ SR-002   │ แจ้งปัญหา.. │ ISSUE  │ PEND.  │ [View] │ │
│  │  3   │ SR-003   │ ขอโปรแกรม..│ PROG.  │ APPROV.│ [View] │ │
│  │ ...  │ ...      │ ...         │ ...    │ ...    │ ...    │ │
│  └──────┴──────────┴─────────────┴────────┴────────┴────────┘ │
│                                                                │
│  Pagination: [← Previous] Page 1 of 5 [Next →]                │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**Click [View]** → เปิด Request Detail Modal:
```
┌────────────────────────────────────────────────────────┐
│  Request Details                                 [X]  │
├────────────────────────────────────────────────────────┤
│  [Document Preview]                                    │
│  ...                                                   │
│                                                        │
│  ┌──────────────────┐  ┌──────────────────┐           │
│  │  ✅ Approve      │  │  ❌ Reject       │           │
│  └──────────────────┘  └──────────────────┘           │
│                                                        │
│  Note: หลังอนุมัติระบบจะสร้าง Task อัตโนมัติ และ      │
│        เปิด Create Task Panel ให้คุณกำหนดผู้รับผิดชอบ │
│                                                        │
└────────────────────────────────────────────────────────┘
```

**After Approve** → Auto-open Task Panel (existing component):
- Pre-fill task details from request
- Allow assigning to responsible users
- Task automatically linked to request

---

#### 6. Feedback Form (ประเมินความพึงพอใจ) ⭐ **NEW**

**Trigger**: เมื่อ requester เปิดดู request ที่ status = COMPLETED และยังไม่มี feedback

**Layout - Feedback Modal**:
```
┌────────────────────────────────────────────────────┐
│  ประเมินความพึงพอใจ                          [X]  │
├────────────────────────────────────────────────────┤
│                                                    │
│  โปรดให้คะแนนความพึงพอใจในการให้บริการของเรา      │
│                                                    │
│  คำร้อง: SR-2025-00123 - ขอข้อมูลสถิติผู้ป่วย     │
│  สถานะ: เสร็จสิ้น ✓                                │
│                                                    │
│  ความพึงพอใจโดยรวม: *                              │
│  ┌────────────────────────────────────────────┐   │
│  │  ☆ ☆ ☆ ☆ ☆ ☆ ☆ ☆ ☆ ☆  (hover to select)   │   │
│  │  1  2  3  4  5  6  7  8  9  10            │   │
│  │          [Selected: 8 ดาว]                │   │
│  └────────────────────────────────────────────┘   │
│                                                    │
│  ข้อเสนอแนะเพิ่มเติม (ถ้ามี):                      │
│  ┌────────────────────────────────────────────┐   │
│  │                                            │   │
│  │  [Textarea - max 1000 characters]          │   │
│  │                                            │   │
│  │                                            │   │
│  └────────────────────────────────────────────┘   │
│                                                    │
│  ┌──────────────────────┐  ┌──────────────────┐   │
│  │  ส่งความคิดเห็น      │  │  ข้ามไปก่อน      │   │
│  └──────────────────────┘  └──────────────────┘   │
│                                                    │
└────────────────────────────────────────────────────┘
```

**Interactive Star Rating**:
- Hover: แสดงจำนวนดาว (1-10) ที่กำลังชี้
- Click: เลือกดาวที่ต้องการ
- Selected: ดาวที่เลือกจะเป็นสีเหลืองทอง (⭐)
- Unselected: ดาวที่ไม่เลือกจะเป็นสีเทา (☆)

**After Submit**:
```
┌────────────────────────────────────────────────────┐
│  ขอบคุณสำหรับความคิดเห็น!                    [X]  │
├────────────────────────────────────────────────────┤
│                                                    │
│  ✓  เราได้รับความคิดเห็นของคุณแล้ว                │
│                                                    │
│  คะแนนของคุณ: ⭐⭐⭐⭐⭐⭐⭐⭐ (8/10)                  │
│                                                    │
│  ความคิดเห็นของคุณจะช่วยให้เราปรับปรุง             │
│  การให้บริการให้ดียิ่งขึ้น                          │
│                                                    │
│  ┌──────────────────────┐                         │
│  │  แก้ไขความคิดเห็น     │   ← เปลี่ยนเป็นปุ่มนี้   │
│  └──────────────────────┘                         │
│                                                    │
└────────────────────────────────────────────────────┘
```

**Edit Feedback (ถ้ามี feedback แล้ว)**:
- แสดงความคิดเห็นเดิมใน form
- สามารถแก้ไข rating และ comment ได้
- ปุ่ม "อัปเดตความคิดเห็น"

**Feedback Display on Request Detail**:
```
┌────────────────────────────────────────────────────┐
│  Request Details: SR-2025-00123              [X]   │
├────────────────────────────────────────────────────┤
│  ... request info ...                              │
│                                                    │
│  ═══════════════════════════════════════════════   │
│                                                    │
│  📊 ความคิดเห็นจากผู้ขอ:                           │
│  ⭐⭐⭐⭐⭐⭐⭐⭐ (8/10)                                 │
│  "บริการรวดเร็ว ข้อมูลครบถ้วน ขอบคุณครับ"          │
│  ให้ความคิดเห็นเมื่อ: 25 ต.ค. 2568 14:30          │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

#### 7. Feedback Analytics Dashboard (SUPER_ADMIN) ⭐ **NEW**

**URL**: `/it-service/feedback` (เฉพาะ SUPER_ADMIN/ADMIN)

**Layout**:
```
┌──────────────────────────────────────────────────────────────┐
│  Dashboard Top Bar (Regular)                                 │
│  [Sidebar with "IT Service" > "วิเคราะห์ความพึงพอใจ" hl.]    │
├──────────────────────────────────────────────────────────────┤
│  วิเคราะห์ความพึงพอใจการให้บริการ                            │
│                                                              │
│  Filters:  [Type ▼] [Date Range] [Department ▼]             │
│                                                              │
│  ┌─────────────────┬─────────────────┬────────────────────┐ │
│  │ ค่าเฉลี่ย         │ จำนวนความคิดเห็น │ ความพึงพอใจต่ำ   │ │
│  │                 │                 │                    │ │
│  │    8.4/10       │      245        │        12          │ │
│  │   ⭐⭐⭐⭐⭐⭐⭐⭐     │   feedback      │   (rating ≤ 3)     │ │
│  └─────────────────┴─────────────────┴────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  📊 Rating Distribution                                │ │
│  │                                                        │ │
│  │  10 ⭐ ████████████████████ 45 (18.4%)                 │ │
│  │   9 ⭐ █████████████████ 38 (15.5%)                    │ │
│  │   8 ⭐ ████████████████████████ 52 (21.2%)             │ │
│  │   7 ⭐ ████████████ 28 (11.4%)                         │ │
│  │   6 ⭐ ███████ 18 (7.3%)                               │ │
│  │   5 ⭐ ██████ 15 (6.1%)                                │ │
│  │   4 ⭐ ██████ 14 (5.7%)                                │ │
│  │   3 ⭐ ████ 10 (4.1%)   ← Low ratings                  │ │
│  │   2 ⭐ █ 2 (0.8%)                                      │ │
│  │   1 ⭐ █ 1 (0.4%)                                      │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  📈 Trend (Monthly Average)                            │ │
│  │                                                        │ │
│  │  10 ⭐                         •                        │ │
│  │   9 ⭐               •    •         •                   │ │
│  │   8 ⭐        •                                         │ │
│  │   7 ⭐   •                                              │ │
│  │   6 ⭐                                                  │ │
│  │        ม.ค. ก.พ. มี.ค. เม.ย. พ.ค. มิ.ย.              │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  📊 Average Rating by Type                             │ │
│  │                                                        │ │
│  │  คำร้องขอข้อมูล (DATA):      8.6 ⭐  (120 feedback)    │ │
│  │  คำร้องพัฒนาโปรแกรม (PROGRAM): 8.1 ⭐  (85 feedback)   │ │
│  │  แจ้งปัญหา IT (IT_ISSUE):    8.5 ⭐  (40 feedback)     │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  ⚠️ Low-Rated Requests (Rating ≤ 3)                    │ │
│  ├────┬──────────┬────┬──────────────────────┬──────────┤ │
│  │ No │ Number   │ ⭐ │ Comment              │ Date     │ │
│  ├────┼──────────┼────┼──────────────────────┼──────────┤ │
│  │ 1  │ SR-00245 │ 2  │ ช้าเกินไป รอนาน...   │ 15 ต.ค. │ │
│  │ 2  │ SR-00312 │ 3  │ ข้อมูลไม่ครบถ้วน      │ 20 ต.ค. │ │
│  │... │ ...      │... │ ...                  │ ...      │ │
│  └────┴──────────┴────┴──────────────────────┴──────────┘ │
│                                                              │
│  ┌──────────────────────┐                                   │
│  │  📥 Export CSV       │                                   │
│  └──────────────────────┘                                   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Key Features**:
1. **Summary Cards**: ค่าเฉลี่ย, จำนวน, ความพึงพอใจต่ำ
2. **Rating Distribution**: แท่งกราฟแสดงจำนวน feedback แต่ละระดับ
3. **Trend Chart**: กราฟเส้นแสดงค่าเฉลี่ยรายเดือน
4. **By Type Stats**: ค่าเฉลี่ยแยกตามประเภทคำร้อง
5. **Low-Rated Table**: รายการ feedback ที่ได้คะแนนต่ำ (≤ 3)
6. **Export**: ปุ่ม Export CSV สำหรับวิเคราะห์เพิ่มเติม

---

### Color Scheme

ใช้ theme สีเดียวกับ ProjectFlows:

| Element | Color | Usage |
|---------|-------|-------|
| Primary | Blue-600 | Buttons, Links, Active states |
| Success | Green-600 | Approved, Completed |
| Warning | Yellow-600 | Pending |
| Danger | Red-600 | Rejected, Cancelled |
| Info | Blue-500 | In Progress |
| Muted | Gray-500 | Secondary text |

**Status Colors**:
```typescript
const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  APPROVED: 'bg-green-100 text-green-800 border-green-200',
  REJECTED: 'bg-red-100 text-red-800 border-red-200',
  IN_PROGRESS: 'bg-blue-100 text-blue-800 border-blue-200',
  COMPLETED: 'bg-green-100 text-green-800 border-green-200',
  CANCELLED: 'bg-gray-100 text-gray-800 border-gray-200'
};
```

---

## Component Structure

### New Components (22 components) ⭐ **UPDATED**

```
src/
├── components/
│   ├── it-service/
│   │   ├── it-service-portal.tsx          # Main portal page
│   │   ├── action-card.tsx                # Large action button cards
│   │   ├── request-card.tsx               # Request item card (with queue badge)
│   │   ├── request-list-filters.tsx       # Filter controls
│   │   ├── request-form-modal.tsx         # Form submission modal
│   │   ├── data-request-form.tsx          # Data/Program form
│   │   ├── it-issue-form.tsx              # IT Issue form
│   │   ├── document-preview-modal.tsx     # Document preview
│   │   ├── document-template.tsx          # HTML document generator
│   │   ├── request-tracking-page.tsx      # Tracking page (with queue)
│   │   ├── queue-status-card.tsx          # ⭐ NEW - Queue display card
│   │   ├── request-timeline.tsx           # Timeline component
│   │   ├── timeline-item.tsx              # Single timeline entry
│   │   ├── request-comment-box.tsx        # Comment input
│   │   ├── request-management-page.tsx    # Approver management
│   │   ├── request-table.tsx              # Request list table
│   │   ├── request-detail-modal.tsx       # Detail + Approve/Reject
│   │   ├── approval-actions.tsx           # Approve/Reject buttons
│   │   ├── feedback-modal.tsx             # ⭐ NEW - Satisfaction rating modal
│   │   ├── star-rating.tsx                # ⭐ NEW - Interactive star selector
│   │   └── feedback-analytics-page.tsx    # ⭐ NEW - Analytics dashboard
│   └── layout/
│       ├── it-service-top-bar.tsx         # Custom top bar (USER only)
│       └── it-service-layout.tsx          # ⭐ NEW - Conditional layout wrapper
```

### Component Details

#### 1. IT Service Top Bar

```typescript
// src/components/layout/it-service-top-bar.tsx
export function ITServiceTopBar() {
  return (
    <header className="border-b bg-background">
      <div className="flex h-16 items-center px-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Logo size="sm" />
          <h1 className="text-xl font-semibold">IT Service</h1>
        </div>

        <div className="ml-auto flex items-center gap-4">
          <NotificationButton />
          <UserDropdown />
        </div>
      </div>
    </header>
  );
}
```

#### 2. Action Card Component

```typescript
// src/components/it-service/action-card.tsx
interface ActionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: 'blue' | 'green' | 'purple';
  onClick: () => void;
}

export function ActionCard({ icon, title, description, color, onClick }: ActionCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-lg border p-8",
        "hover:shadow-lg transition-all duration-300",
        "bg-gradient-to-br from-white to-gray-50",
        "dark:from-gray-900 dark:to-gray-800"
      )}
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <div className={cn(
          "text-6xl transition-transform group-hover:scale-110",
          colorClasses[color]
        )}>
          {icon}
        </div>
        <h3 className="text-2xl font-semibold">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </button>
  );
}
```

#### 3. Request Timeline Component

```typescript
// src/components/it-service/request-timeline.tsx
interface TimelineEntry {
  id: string;
  type: string;
  description: string;
  actorName?: string;
  actorJobTitle?: string;
  actorAvatar?: string;
  metadata?: any;
  createdAt: string;
}

export function RequestTimeline({ requestId }: { requestId: string }) {
  const { data, isLoading } = useRequestTimeline(requestId);

  return (
    <div className="space-y-4">
      {data?.timeline.map((entry, index) => (
        <TimelineItem
          key={entry.id}
          entry={entry}
          isLast={index === data.timeline.length - 1}
        />
      ))}
    </div>
  );
}
```

#### 4. Document Template Component

```typescript
// src/components/it-service/document-template.tsx
interface DocumentData {
  requestNumber: string;
  type: 'DATA' | 'PROGRAM' | 'IT_ISSUE';
  // ... other fields
}

export function generateDocumentHtml(data: DocumentData): string {
  const template = data.type === 'IT_ISSUE'
    ? generateITIssueTemplate(data)
    : generateDataProgramTemplate(data);

  return `
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap">
      <style>
        body {
          font-family: 'Sarabun', sans-serif;
          font-size: 16pt;
          line-height: 1.6;
          margin: 2cm;
          text-align: justify;
        }
        .text-center { text-align: center; }
        .indent { text-indent: 2.5cm; }
        /* ... more styles ... */
      </style>
    </head>
    <body>
      ${template}
    </body>
    </html>
  `;
}
```

---

## Permission System

### New Permissions

เพิ่มเข้าไปใน `src/lib/permissions.ts`:

```typescript
const ROLE_PERMISSIONS = {
  SUPER_ADMIN: ['*'], // ⭐ NEW - All permissions

  ADMIN: [
    // ... existing permissions
    'manage_service_requests',    // ⭐ NEW - View all requests
  ],

  // ... other roles remain same

  USER: [
    'view_projects',
    'view_tasks',
    'create_service_request',     // ⭐ NEW
    'view_own_requests',          // ⭐ NEW
    'comment_own_requests',       // ⭐ NEW
  ]
};

// ⭐ NEW: Check if user is approver
export async function isRequestApprover(
  userId: string,
  requestType: 'DATA' | 'PROGRAM' | 'IT_ISSUE'
): Promise<boolean> {
  const approver = await prisma.requestApprover.findUnique({
    where: {
      userId_approvalType: {
        userId,
        approvalType: requestType
      }
    }
  });

  return approver?.isActive ?? false;
}
```

### Permission Checks

| Action | Who Can Do | Check Method |
|--------|-----------|--------------|
| Enable/Disable Module | SUPER_ADMIN | `role === 'SUPER_ADMIN'` |
| Manage Approvers | SUPER_ADMIN | `role === 'SUPER_ADMIN'` |
| Submit Request | Anyone logged in | `authenticated` |
| View Own Requests | Request owner | `request.requesterId === userId` |
| View All Requests | ADMIN, SUPER_ADMIN | `checkPermission('manage_service_requests')` |
| Approve Request | Assigned approvers | `isRequestApprover(userId, requestType)` |
| View Request | Owner, Approver, ADMIN | Combined check |
| Comment Request | Owner, Task assignees, Approver | Combined check |

---

## Document Templates

### Template 1: Data/Program Request

```html
<div class="document-print-area">
  <div style="text-align: right;">
    เลขที่ใบงาน {requestNumber}
  </div>

  <h2 class="text-center" style="margin-top: 2cm;">
    เรื่อง ขอโปรแกรมและข้อมูลสารสนเทศ
  </h2>

  <div style="text-align: right; margin-top: 2cm;">
    วันที่ {day} เดือน {month} ปี พ.ศ. {buddhistYear}
  </div>

  <div style="margin-top: 1cm;">
    เรียน หัวหน้ากลุ่มภารกิจสุขภาพดิจิทัล
  </div>

  <p class="indent" style="margin-top: 1cm;">
    หนังสือฉบับนี้ ข้าพเจ้า {requesterName} ตำแหน่ง {requesterJobTitle}
    สังกัดกลุ่มงาน{requesterDivision} {hospitalName}
    โทร. {requesterPhone} E-mail {requesterEmail}
    เรื่อง {subject}
  </p>

  <p style="margin-top: 0.5cm;">
    <strong>วัตถุประสงค์การขอ</strong>
  </p>
  <p style="margin-left: 2cm;">
    {purposeCheckboxes}
  </p>

  <p style="margin-top: 0.5cm;">
    <strong>ความต้องการให้แล้วเสร็จภายใน</strong> {deadline} วัน
  </p>

  <div style="margin-top: 2cm; text-align: center;">
    <p>ลงชื่อ {requesterName} ผู้แจ้ง</p>
    <p>ตำแหน่ง {requesterJobTitle}</p>
  </div>

  <div style="margin-top: 2cm; text-align: center;">
    <p>ลงชื่อ {approverName || '........................'} ผู้รับเรื่องและอนุมัติ</p>
    <p>ตำแหน่ง {approverJobTitle || '........................'}</p>
  </div>
</div>
```

### Template 2: IT Issue Report

```html
<div class="document-print-area">
  <div style="text-align: right;">
    เลขที่ใบงาน {requestNumber}
  </div>

  <h2 class="text-center" style="margin-top: 2cm;">
    เรื่อง แจ้งปัญหาเทคโนโลยีสารสนเทศ
  </h2>

  <div style="text-align: right; margin-top: 2cm;">
    วันที่ {day} เดือน {month} ปี พ.ศ. {buddhistYear}
  </div>

  <div style="margin-top: 1cm;">
    เรียน หัวหน้ากลุ่มภารกิจสุขภาพดิจิทัล
  </div>

  <p class="indent" style="margin-top: 1cm;">
    หนังสือฉบับนี้ ข้าพเจ้า {requesterName} ตำแหน่ง {requesterJobTitle}
    สังกัดกลุ่มงาน{requesterDivision} {hospitalName}
    โทร. {requesterPhone} E-mail {requesterEmail}
    ขอแจ้งปัญหาด้านเทคโนโลยีสารสนเทศเรื่อง {subject}
    รายละเอียด {description}
    เวลาที่พบปัญหา {issueTime}
  </p>

  <div style="margin-top: 2cm; text-align: center;">
    <p>ลงชื่อ {requesterName} ผู้แจ้ง</p>
    <p>ตำแหน่ง {requesterJobTitle}</p>
  </div>

  <div style="margin-top: 2cm; text-align: center;">
    <p>ลงชื่อ {approverName || '........................'} ผู้รับเรื่องและอนุมัติ</p>
    <p>ตำแหน่ง {approverJobTitle || '........................'}</p>
  </div>
</div>
```

### Template Helpers

```typescript
// src/lib/document-helpers.ts

export function formatDateThai(date: Date): {
  day: string;
  month: string;
  year: string;
  buddhistYear: string;
} {
  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  return {
    day: date.getDate().toString(),
    month: thaiMonths[date.getMonth()],
    year: date.getFullYear().toString(),
    buddhistYear: (date.getFullYear() + 543).toString()
  };
}

export function generateRequestNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const sequence = generateSequenceNumber(); // Auto-increment logic

  return `SR-${year}-${sequence.toString().padStart(5, '0')}`;
}
```

---

## Implementation Phases

### Phase 1: Database & Backend Foundation (3-4 days)

**Goal**: สร้าง database schema และ basic API endpoints

**Tasks**:
1. ✅ Update Prisma schema
   - Add SUPER_ADMIN to UserRole enum
   - Create 5 new tables
   - Add relations to User and Task
   - Generate migration

2. ✅ Create seed data
   - System settings (IT_SERVICE_ENABLED, HOSPITAL_NAME)
   - Sample approvers (at least 3 users)

3. ✅ Implement API endpoints
   - System settings (GET, PATCH)
   - Approvers management (GET, POST, DELETE)
   - Request submission (POST)
   - Request listing (GET with filters)
   - Request detail (GET)

4. ✅ Add permissions
   - Update `src/lib/permissions.ts`
   - Add `isRequestApprover()` helper

**Deliverables**:
- ✅ Prisma schema updated
- ✅ 5 API endpoints working
- ✅ Permission system integrated

---

### Phase 2: IT Service Portal UI (3-4 days) ⏳ **IN PROGRESS**

**Goal**: สร้างหน้า IT Service Portal สำหรับ USER และ navigation integration

**Status**: 60% Complete (Tasks 1-2 done, Task 3 in progress)

**Tasks**:
1. ✅ **Create IT Service Layout** - COMPLETE (2025-11-01)
   - ✅ Custom top bar component (ITServiceTopBar)
   - ✅ Conditional layout wrapper (USER → clean, others → sidebar)
   - ✅ USER role redirect system (login → IT Service, blocked from dashboard)
   - ✅ Clean layout for profile/settings pages (no sidebar for USER)
   - ✅ Back button and menu integration for navigation
   - ✅ Fiscal year filter in top bar

2. ✅ **Sidebar Menu Integration** - COMPLETE (2025-11-01)
   - ✅ "IT Service" menu item (all roles)
   - ✅ "คำร้องขอ" menu item (HEAD+ roles only)
   - ✅ Badge count with role-based scope filtering
     - USER/MEMBER/HEAD: department scope
     - LEADER: division scope
     - CHIEF: mission group scope
     - ADMIN/SUPER_ADMIN: all requests

3. ⏳ **Build Portal Page** - IN PROGRESS (2025-11-01)
   - ✅ 3 action cards with lucide icons (Database, Code, Wrench)
   - ✅ Centered layout with responsive grid (1/2/3 columns)
   - ✅ Request cards list (sidebar on desktop, below on mobile)
   - ✅ Filters UI (type, status, search, myRequests toggle)
   - ✅ Role-based scope filtering in API
   - ✅ Responsive design (mobile/tablet/desktop)
   - ❌ Modal integration (pending Task 4)

4. ✅ **Implement Request Forms** - COMPLETE (2025-11-01 Session 3)
   - ✅ Zod validation schemas (service-request.ts)
     - `dataRequestFormSchema` with type, subject, description, urgency
     - `itIssueRequestFormSchema` with subject, description, urgency, location
     - Helper objects: urgencyLabels, urgencyColors, requestTypeLabels
   - ✅ Data/Program form modal (data-request-modal.tsx)
     - Radio button type selector (DATA/PROGRAM) with icons
     - Dynamic placeholders based on selected type
     - React Hook Form + Zod validation
     - Auto-filled user information (read-only display)
     - Success state with request number
     - Auto-redirect to tracking page after 2s
     - Query invalidation for request list refresh
   - ✅ IT Issue form modal (it-issue-modal.tsx)
     - Subject, description, urgency fields
     - Optional location field
     - Same success flow as Data/Program modal
   - ✅ API integration (/api/service-requests POST)
   - ✅ Type-check passed (0 errors)

5. ❌ **Document Preview** - PENDING
   - Generate HTML from template
   - Preview modal
   - Print functionality

**Deliverables**:
- ✅ Portal page UI complete and responsive
- ✅ Sidebar navigation integrated with badge counts
- ✅ Forms implementation complete (Task 4)
- ⏳ Document preview (next task - Task 5)

**Next Steps**:
1. ~~Implement request submission forms (Data/Program, IT Issue)~~ ✅ DONE
2. ~~Add form validation and auto-fill logic~~ ✅ DONE
3. Create document preview modal with print support (Task 5)

---

### Phase 3: Request Tracking & Timeline (3-4 days)

**Goal**: สร้างระบบติดตามสถานะ, timeline, และ queue system

**Tasks**:
1. ✅ Implement Timeline API
   - Timeline fetching endpoint
   - Comment endpoints (GET, POST)

2. ✅ Implement Queue System
   - Queue position calculation API (GET /api/service-requests/:id/queue)
   - FIFO queue logic by request type
   - Auto-update lastKnownQueuePosition in database
   - Create QUEUE_UPDATED timeline entries

3. ✅ Build Tracking Page
   - Document preview (left)
   - Timeline (right)
   - Queue status card (if PENDING)
   - Comment box
   - Responsive layout

4. ✅ Create Timeline Components
   - Timeline item component
   - Status badges
   - Actor avatars
   - Date formatting (Thai)

5. ✅ Create Queue Components
   - QueueStatusCard component
   - Progress bar showing position
   - Estimated wait time display

6. ✅ Real-time Updates
   - Auto-refresh timeline (polling or WebSocket)
   - Auto-refresh queue position
   - Optimistic UI updates

**Deliverables**:
- ✅ Tracking page complete
- ✅ Timeline showing all events
- ✅ Queue system functional (3 display locations)
- ✅ Comments working

---

### Phase 4: Approval Workflow (3-4 days)

**Goal**: สร้างระบบอนุมัติและเชื่อม task

**Tasks**:
1. ✅ Implement Approval APIs
   - Approve endpoint
   - Reject endpoint
   - Auto-create task logic

2. ✅ Build Management Page
   - Request table for approvers
   - Filters and search
   - Pagination
   - Queue position column (display queue number)

3. ✅ Create Approval UI
   - Request detail modal
   - Approve/Reject buttons
   - Integration with Task Panel

4. ✅ Task Integration
   - Update task mutations to create timeline entries
   - Link task panel to request
   - Update request status when task closes

**Deliverables**:
- ✅ Approval workflow complete
- ✅ Tasks auto-created from requests
- ✅ Management page functional

---

### Phase 4.5: Feedback System (1-2 days) ⭐ **NEW**

**Goal**: สร้างระบบประเมินความพึงพอใจสำหรับคำร้องที่เสร็จสิ้น

**Tasks**:
1. ✅ Feedback Backend
   - Add ServiceRequestFeedback model to schema
   - Implement 4 API endpoints
   - Add low-rating notification trigger
   - Add analytics calculation logic
   - Add CSV export functionality

2. ✅ Feedback UI Components
   - Star rating component (1-10 stars)
   - Feedback modal with comment textarea
   - Success confirmation screen
   - Edit feedback functionality
   - Display feedback on request detail

3. ✅ Analytics Dashboard
   - Summary cards (average, count, low ratings)
   - Rating distribution bar chart
   - Monthly trend line chart
   - By-type statistics
   - Low-rated requests table
   - CSV export button

**Deliverables**:
- ✅ Users can rate completed requests
- ✅ SUPER_ADMIN/ADMIN can view analytics
- ✅ Low ratings (≤3) trigger notifications
- ✅ Export feedback data to CSV

---

### Phase 5: SUPER_ADMIN Features (2 days)

**Goal**: สร้างหน้าจัดการระบบสำหรับ SUPER_ADMIN

**Tasks**:
1. ✅ System Settings Page (`/system-settings`) ⭐ **UPDATED DESIGN**
   - Add "ตั้งค่าระบบ" menu in user dropdown (SUPER_ADMIN only)
   - Section 1: IT Service Module toggle (enable/disable)
   - Section 2: Hospital name setting (for documents)
   - Section 3: Link to Approvers Management (future)
   - Section 4: Placeholder for future settings
   - Permission guard: redirect non-SUPER_ADMIN
   - Use existing `Config` table (key-value pairs)

2. ✅ System Settings API
   - GET /api/system-settings (fetch all settings)
   - PATCH /api/system-settings (update settings)
   - Helper functions: `getSystemSetting()`, `isITServiceEnabled()`, `getHospitalName()`
   - Permission check: SUPER_ADMIN only

3. ✅ Integration
   - Update USER redirect logic to check `it_service_enabled` config
   - Update document generation to use `hospital_name` config
   - Cache strategy with React Query (5 min stale time)

4. ✅ Approvers Management UI (Future - separate page)
   - List all approvers with type badges
   - Add/Remove approver
   - Enable/Disable approver
   - Note: This will be on `/system-settings/approvers`

**Deliverables**:
- ✅ SUPER_ADMIN can manage system via user dropdown menu
- ✅ Settings saved to Config table
- ✅ IT Service can be enabled/disabled dynamically
- ✅ Hospital name appears in all new documents

**Reference**: See SYSTEM_SETTINGS_DESIGN.md for complete specification

---

### Phase 6: Testing & Polish (2-3 days)

**Goal**: ทดสอบและปรับปรุง UX

**Tasks**:
1. ✅ Comprehensive Testing
   - All user flows (USER, Approver, SUPER_ADMIN)
   - Permission checks
   - Edge cases (empty states, errors)

2. ✅ UI/UX Refinements
   - Loading states
   - Error messages
   - Empty states
   - Animations

3. ✅ Mobile Responsiveness
   - Test on mobile devices
   - Adjust layouts for < 768px
   - Touch-friendly buttons

4. ✅ Performance Optimization
   - Query optimization
   - Lazy loading
   - Caching strategy

5. ✅ Documentation
   - User guide (Thai)
   - Admin guide
   - API documentation

**Deliverables**:
- ✅ All features tested
- ✅ Mobile-responsive
- ✅ Documentation complete

---

### Timeline Summary ⭐ **UPDATED**

| Phase | Duration | Cumulative Days |
|-------|----------|-----------------|
| Phase 1: Database & Backend | 3-4 days | 4 days |
| Phase 2: Portal UI + Navigation | 3-4 days | 8 days |
| Phase 3: Tracking, Timeline & Queue System | 3-4 days | 12 days |
| Phase 4: Approval Workflow | 3-4 days | 16 days |
| **Phase 4.5: Feedback System** ⭐ **NEW** | **1-2 days** | **18 days** |
| Phase 5: SUPER_ADMIN Features | 2 days | 20 days |
| Phase 6: Testing & Polish | 2-3 days | 23 days |

**Total Estimated Time**: 20-23 working days (4-4.5 weeks) ⭐ **UPDATED**

**Note**:
- Queue system adds +1 day to Phase 3 for implementation and testing
- Feedback system adds +1-2 days after approval workflow completion

---

## Testing Strategy

### Unit Tests

**Backend**:
- ✅ Request number generation (unique, sequential)
- ✅ Document template generation (correct Thai formatting)
- ✅ Permission checks (approver, owner, admin)
- ✅ Timeline entry creation

**Frontend**:
- ✅ Form validation (required fields, formats)
- ✅ Document preview rendering
- ✅ Timeline rendering
- ✅ Status badge display

### Integration Tests

**API Endpoints**:
```bash
# Request submission flow
POST /api/service-requests → 201 Created
GET /api/service-requests → 200 OK (list)
GET /api/service-requests/:id → 200 OK (detail)

# Approval flow
POST /api/service-requests/:id/approve → 200 OK
# Verify: task created, timeline updated, status = APPROVED

# Permission checks
POST /api/service-requests/:id/approve (non-approver) → 403 Forbidden
GET /api/service-requests/:id (non-owner) → 403 Forbidden
```

### E2E Tests (Manual)

**USER Flow**:
1. ✅ Login as USER → redirected to IT Service Portal
2. ✅ Click "ขอข้อมูล/โปรแกรม" → form opens
3. ✅ Fill form → preview document → submit
4. ✅ See request in "My Requests" cards
5. ✅ Click card → tracking page opens
6. ✅ Add comment → appears in timeline
7. ✅ Print document → formatted correctly

**Approver Flow**:
1. ✅ Login as Approver → see "คำร้องขอ" in sidebar
2. ✅ Open management page → see pending requests
3. ✅ Click request → detail modal opens
4. ✅ Approve → task created, Task Panel opens
5. ✅ Assign task → timeline updated
6. ✅ Verify requester sees update in timeline

**SUPER_ADMIN Flow**:
1. ✅ Login as SUPER_ADMIN → access settings
2. ✅ Toggle IT Service module → verify USER redirect
3. ✅ Add approver → verify user can approve
4. ✅ Change hospital name → verify in documents

### Performance Tests

**Targets**:
- ✅ Portal page load: < 1.5s
- ✅ Request submission: < 2s
- ✅ Document preview: < 0.5s
- ✅ Timeline load (50 entries): < 1s
- ✅ API response time: < 200ms (95th percentile)

**Load Tests**:
- 100 concurrent users submitting requests
- 1000 requests in database with pagination
- 500 timeline entries with infinite scroll

---

## Security Considerations

### Authentication & Authorization

✅ **Session-based auth** - ใช้ระบบ authentication ที่มีอยู่
✅ **Permission checks** - ทุก API endpoint ต้อง check permissions
✅ **Row-level security** - USER เห็นเฉพาะ requests ของตัวเอง
✅ **Role-based access** - SUPER_ADMIN, Approvers, USER แยกสิทธิ์ชัดเจน

### Input Validation

✅ **Zod schemas** - Validate ทุก input จาก forms
✅ **SQL injection prevention** - ใช้ Prisma (parameterized queries)
✅ **XSS prevention** - Sanitize HTML output ก่อน render
✅ **File upload** - (future) Validate file types, size limits

### Data Privacy

✅ **User data snapshot** - เก็บข้อมูล requester/approver เป็น snapshot
✅ **Audit trail** - Timeline เก็บทุก action พร้อม actor
✅ **Soft deletes** - ไม่ hard delete requests (เก็บ audit trail)

---

## Future Enhancements (Version 2.0)

### Advanced Features

1. **File Attachments**
   - แนบไฟล์ใน request (PDF, images)
   - Preview ไฟล์ในหน้าติดตามงาน
   - Download ไฟล์

2. **Email Notifications**
   - ส่ง email เมื่อมี request ใหม่ (to approvers)
   - ส่ง email เมื่อ status เปลี่ยน (to requester)
   - ส่ง email เมื่อมี comment ใหม่

3. **Request Templates**
   - บันทึก request ที่ใช้บ่อยเป็น template
   - คลิกเลือก template → auto-fill form

4. **Analytics Dashboard**
   - สถิติ requests ตาม type, status, department
   - Average response time
   - Top requesters/approvers
   - Charts and graphs

5. **Mobile App**
   - React Native app สำหรับ mobile
   - Push notifications
   - Offline mode

6. **API for External Systems**
   - REST API สำหรับระบบภายนอก
   - Webhook notifications
   - API key authentication

---

## Appendix

### A. Thai Terminology

| English | Thai | Notes |
|---------|------|-------|
| IT Service | บริการระบบสารสนเทศ | ชื่อ module |
| Data/Program | ข้อมูล/โปรแกรม | ประเภท request |
| IT Issue | ปัญหา IT | ประเภท request |
| Request Number | เลขที่ใบงาน | SR-YYYY-NNNNN |
| Tracking | ติดตามงาน | หน้าติดตามสถานะ |
| Timeline | ประวัติการดำเนินการ | Timeline events |
| Approver | ผู้อนุมัติ | Role ที่มีสิทธิ์อนุมัติ |
| Hospital | โรงพยาบาล | Configurable setting |

### B. Database Naming Conventions

- **Table names**: snake_case (e.g., `service_requests`)
- **Column names**: camelCase (e.g., `requesterId`)
- **Enum names**: PascalCase (e.g., `ServiceRequestType`)
- **Enum values**: UPPER_SNAKE_CASE (e.g., `IT_ISSUE`)

### C. API Naming Conventions

- **Endpoints**: kebab-case (e.g., `/api/service-requests`)
- **Query params**: camelCase (e.g., `?startDate=...`)
- **Response fields**: camelCase (e.g., `requestNumber`)

### D. Component Naming Conventions

- **Components**: PascalCase (e.g., `RequestCard`)
- **Files**: kebab-case (e.g., `request-card.tsx`)
- **Folders**: kebab-case (e.g., `it-service/`)

---

## Change Log

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-10-31 | Initial specification document |

---

## References

- **CLAUDE.md** - ProjectFlows architecture guide
- **PERMISSION_GUIDELINE.md** - Permission system documentation
- **OPTIMISTIC_UPDATE_PATTERN.md** - UI update patterns
- **Prisma Schema** - Database structure
- **shadcn/ui** - Component library

---

**Status**: ✅ Ready for Implementation
**Estimated Effort**: 17-20 working days (3-4 weeks)
**Priority**: High
**Complexity**: Medium-High

---

**End of Specification Document**
