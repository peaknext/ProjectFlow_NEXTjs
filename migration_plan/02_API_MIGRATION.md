# API Migration Guide
## Google Apps Script → Next.js API Routes

**Version:** 1.0
**Date:** 2025-10-20

---

## Table of Contents

1. [API Endpoints Inventory](#api-endpoints-inventory)
2. [Next.js API Architecture](#nextjs-api-architecture)
3. [Endpoint Migration Map](#endpoint-migration-map)
4. [Authentication Middleware](#authentication-middleware)
5. [Error Handling Strategy](#error-handling-strategy)

---

## 1. API Endpoints Inventory

### Current GAS Functions (Code.gs)

**Authentication:**
- `doGet()` - Serve HTML/handle password reset links
- `validateLogin(email, password)` - User login
- `createUser(...)` - User registration
- `verifyEmail(token)` - Email verification
- `requestPasswordReset(email)` - Request password reset

**Session Management:**
- `getValidatedSession(token)` - Validate user session
- `logoutUser(token)` - End session

**User Management:**
- `getAllUsers(token)` - Get all users
- `updateUser(token, userId, updates)` - Update user profile
- `deleteUser(token, userId)` - Delete user
- `getUserAllPermissions(token, email)` - Get user permissions

**Organization:**
- `getOrganizationData(token)` - Get mission groups, divisions, departments
- `createDepartment(token, data)` - Create department
- `updateDepartment(token, id, data)` - Update department
- `deleteDepartment(token, id)` - Delete department

**Projects:**
- `getAllProjects(token)` - Get all projects
- `getProjectBoardData(projectId, token)` - Get project data (tasks, statuses)
- `createProject(token, data)` - Create project
- `updateProject(token, projectId, data)` - Update project
- `deleteProject(token, projectId)` - Delete project

**Tasks:**
- `createTask(token, data)` - Create task
- `updateTask(token, taskId, updates)` - Update task
- `deleteTask(token, taskId)` - Delete task
- `closeTask(token, taskId, closeType)` - Close task
- `updateTaskStatus(token, taskId, newStatusId)` - Update task status
- `getUserPinnedTasks(token)` - Get user pinned tasks
- `togglePinTask(token, taskId)` - Pin/unpin task

**Statuses:**
- `getProjectStatuses(projectId, token)` - Get project statuses
- `createStatus(token, data)` - Create custom status
- `updateStatus(token, statusId, data)` - Update status
- `deleteStatus(token, statusId)` - Delete status

**Comments & History:**
- `addComment(token, taskId, text)` - Add task comment
- `getTaskHistory(taskId)` - Get task history

**Dashboard:**
- `getUserDashboardData(token)` - Get user dashboard data
- `getReportsDashboardData(token, filters)` - Get reports data

**Total (Original Plan):** ~30 main functions

---

### **UPDATED API Inventory (After Code Analysis - 2025-10-20)**

จากการวิเคราะห์โค้ดเดิมพบว่ามี API endpoints เพิ่มเติมที่ต้อง migrate:

**Authentication & Email Verification (เพิ่ม 3 endpoints):**
- `sendVerificationEmail(email, token)` - Send verification email
- `verifyUserToken(token)` - Verify email token
- `sendPasswordResetEmail(email, token)` - Send password reset email

**Permissions System (เพิ่ม 9 endpoints - Critical):**
- `getRolePermissions(roleName)` - Get permissions for role
- `getEffectiveRole(user, context)` - Get user's effective role in context
- `getDepartmentHierarchy(departmentId)` - Get org hierarchy for scoping
- `isInScope(user, scope, context)` - Check if user can access resource
- `checkPermission(user, permissionKey, context)` - Verify specific permission
- `canUserViewTask(user, task)` - Check view permission
- `canUserEditTask(user, task)` - Check edit permission
- `canUserDeleteTask(user, task)` - Check delete permission
- `canUserCloseTask(user, task)` - Check close permission

**Checklists (เพิ่ม 3 endpoints - High Priority):**
- `addChecklistItem({ taskId, name, token })` - Create checklist item
- `updateChecklistItemAndRecordHistory({ itemId, isChecked, token })` - Toggle checklist
- `deleteChecklistItem({ itemId, token })` - Delete checklist item

**Pinned Tasks (เพิ่ม 1 endpoint):**
- `updatePinnedTasks({ taskId, action, token })` - Pin/unpin task (unified endpoint)

**Phases (เพิ่ม 3 endpoints):**
- `createPhase({ phaseData, token })` - Create project phase
- `createPhasesBatch({ projectId, phasesData, token })` - Batch create phases
- `createStatusesBatch({ projectId, statusesData, token })` - Batch create statuses

**Organization Planning (เพิ่ม 3 endpoints):**
- `getHospMissions()` - Get hospital missions
- `getITGoals(missionId)` - Get IT goals for mission
- `getActionPlans(goalId)` - Get action plans for goal

**Batch Operations (เพิ่ม 1 endpoint - Performance Critical):**
- `handleBatchUpdates(request)` - Batch update handler
  - Supports: UPDATE_TASK_FIELD, UPDATE_TASK_STATUS, UPDATE_CHECKLIST_STATUS, ADD_CHECKLIST_ITEM

**Progress & Analytics (เพิ่ม 2 endpoints):**
- `calculateProjectProgress(projectId)` - Calculate project progress %
- `calculateMultipleProjectsProgress(projectIds)` - Batch progress calculation

**Dashboard & Activities (เพิ่ม 2 endpoints):**
- `getUserRecentActivities(userEmail, limit)` - Get user activity log
- `getUserRecentComments(userEmail, limit)` - Get user recent comments

**User Management (เพิ่ม 1 endpoint):**
- `updateUserStatus({ userId, status, token })` - Update user status (Active/Suspended)

**Notifications (เพิ่ม 3 endpoints):**
- `getNotifications(token)` - Get user notifications
- `markNotificationsAsRead({ notificationIds, token })` - Mark notifications as read
- `getUnreadNotificationCount(token)` - Get unread count

**Mentions (เพิ่ม 1 endpoint):**
- `getMentionableUsers({ searchTerm, token })` - Get users for @mentions autocomplete

**TOTAL:** ~30 (original) + **35 (new)** = **65 API endpoints**

---

## 2. Next.js API Architecture

### 2.1 API Route Structure

```
src/app/api/
├── auth/
│   ├── login/route.ts                   # POST /api/auth/login
│   ├── logout/route.ts                  # POST /api/auth/logout
│   ├── register/route.ts                # POST /api/auth/register
│   ├── verify-email/route.ts            # GET /api/auth/verify-email?token=
│   ├── send-verification/route.ts       # POST /api/auth/send-verification (NEW)
│   ├── reset-password/route.ts          # POST /api/auth/reset-password
│   └── request-reset/route.ts           # POST /api/auth/request-reset (NEW)
│
├── users/
│   ├── route.ts                         # GET /api/users, POST /api/users
│   ├── [userId]/route.ts                # GET, PATCH, DELETE /api/users/:userId
│   ├── [userId]/permissions/route.ts    # GET /api/users/:userId/permissions
│   ├── [userId]/status/route.ts         # PATCH /api/users/:userId/status (NEW)
│   ├── me/route.ts                      # GET /api/users/me (current user)
│   ├── me/activities/route.ts           # GET /api/users/me/activities (NEW)
│   ├── me/comments/route.ts             # GET /api/users/me/comments (NEW)
│   ├── me/pinned-tasks/route.ts         # GET, POST /api/users/me/pinned-tasks (NEW)
│   ├── me/pinned-tasks/[taskId]/route.ts # DELETE /api/users/me/pinned-tasks/:taskId (NEW)
│   └── mentions/route.ts                # GET /api/users/mentions?q=search (NEW)
│
├── permissions/
│   ├── check/route.ts                   # POST /api/permissions/check (NEW)
│   ├── roles/[role]/route.ts            # GET /api/permissions/roles/:role (NEW)
│   └── hierarchy/[deptId]/route.ts      # GET /api/permissions/hierarchy/:deptId (NEW)
│
├── organization/
│   ├── route.ts                         # GET /api/organization (all data)
│   ├── mission-groups/route.ts          # GET, POST
│   ├── divisions/route.ts               # GET, POST
│   ├── departments/route.ts             # GET, POST
│   │   └── [id]/route.ts                # PATCH, DELETE
│   ├── hospital-missions/route.ts       # GET, POST (NEW)
│   │   └── [id]/route.ts                # GET, PATCH, DELETE (NEW)
│   ├── it-goals/route.ts                # GET, POST (NEW)
│   │   └── [id]/route.ts                # GET, PATCH, DELETE (NEW)
│   └── action-plans/route.ts            # GET, POST (NEW)
│       └── [id]/route.ts                # GET, PATCH, DELETE (NEW)
│
├── projects/
│   ├── route.ts                         # GET /api/projects, POST /api/projects
│   ├── [projectId]/route.ts             # GET, PATCH, DELETE /api/projects/:id
│   ├── [projectId]/board/route.ts       # GET /api/projects/:id/board (full data)
│   ├── [projectId]/progress/route.ts    # GET /api/projects/:id/progress (NEW)
│   ├── [projectId]/statuses/route.ts    # GET, POST
│   │   ├── batch/route.ts               # POST /api/projects/:id/statuses/batch (NEW)
│   │   └── [statusId]/route.ts          # PATCH, DELETE
│   ├── [projectId]/phases/route.ts      # GET, POST /api/projects/:id/phases (NEW)
│   │   ├── batch/route.ts               # POST /api/projects/:id/phases/batch (NEW)
│   │   └── [phaseId]/route.ts           # GET, PATCH, DELETE (NEW)
│   └── [projectId]/tasks/route.ts       # GET, POST (scoped to project)
│
├── tasks/
│   ├── [taskId]/route.ts                # GET, PATCH, DELETE /api/tasks/:id
│   ├── [taskId]/close/route.ts          # POST /api/tasks/:id/close
│   ├── [taskId]/comments/route.ts       # GET, POST /api/tasks/:id/comments
│   ├── [taskId]/history/route.ts        # GET /api/tasks/:id/history
│   ├── [taskId]/checklists/route.ts     # GET, POST /api/tasks/:id/checklists (NEW)
│   │   └── [itemId]/route.ts            # PATCH, DELETE /api/tasks/:id/checklists/:itemId (NEW)
│   └── pinned/route.ts                  # GET /api/tasks/pinned
│       └── [taskId]/route.ts            # POST, DELETE /api/tasks/pinned/:id
│
├── notifications/
│   ├── route.ts                         # GET /api/notifications (NEW)
│   ├── read/route.ts                    # POST /api/notifications/read (NEW)
│   └── unread-count/route.ts            # GET /api/notifications/unread-count (NEW)
│
├── batch/
│   └── route.ts                         # POST /api/batch (NEW)
│                                        # Batch operations handler
│
└── dashboard/
    ├── user/route.ts                    # GET /api/dashboard/user
    └── reports/route.ts                 # GET /api/dashboard/reports
```

### 2.2 RESTful API Design Principles

**HTTP Methods:**
- `GET` - Retrieve resource(s)
- `POST` - Create new resource
- `PATCH` - Partially update resource
- `PUT` - Replace entire resource
- `DELETE` - Delete resource

**Response Format:**
```typescript
// Success response
{
  success: true,
  data: { ... }
}

// Error response
{
  success: false,
  error: {
    code: "VALIDATION_ERROR",
    message: "Invalid email format",
    field: "email" // Optional
  }
}
```

**Status Codes:**
- `200 OK` - Successful GET/PATCH/DELETE
- `201 Created` - Successful POST
- `400 Bad Request` - Validation errors
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Authenticated but not authorized
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## 3. Endpoint Migration Map

### 3.1 Authentication Endpoints

#### Login
```typescript
// GAS: validateLogin(email, password)
// Next.js: POST /api/auth/login

// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createSession } from '@/lib/auth';
import { verifyPassword } from '@/lib/crypto';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = loginSchema.parse(body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { department: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } },
        { status: 401 }
      );
    }

    // Verify password (using same salt + hash as GAS)
    const isValid = await verifyPassword(password, user.salt, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } },
        { status: 401 }
      );
    }

    // Check user status
    if (user.userStatus !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: { code: 'USER_SUSPENDED', message: 'Account suspended' } },
        { status: 403 }
      );
    }

    // Create session
    const session = await createSession(user.id);

    // Return user data + session token
    return NextResponse.json({
      success: true,
      data: {
        sessionToken: session.sessionToken,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          profileImageUrl: user.profileImageUrl,
          departmentId: user.departmentId,
          permissions: await getUserPermissions(user.id, user.role),
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: error.errors } },
        { status: 400 }
      );
    }
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Login failed' } },
      { status: 500 }
    );
  }
}
```

### 3.2 Task Management Endpoints

#### Get Project Board Data (Full Prefetch)
```typescript
// GAS: getProjectBoardData(projectId, token)
// Next.js: GET /api/projects/[projectId]/board

// src/app/api/projects/[projectId]/board/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { checkPermission } from '@/lib/permissions';

export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    // Authenticate
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const { projectId } = params;

    // Check permission
    const hasAccess = await checkPermission(session.userId, 'view_projects', projectId);
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'No access to this project' } },
        { status: 403 }
      );
    }

    // Fetch project with all related data (similar to GAS getProjectBoardData)
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        department: {
          include: {
            division: {
              include: { missionGroup: true },
            },
          },
        },
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true,
            profileImageUrl: true,
          },
        },
        statuses: {
          orderBy: { order: 'asc' },
        },
        tasks: {
          where: { deletedAt: null },
          include: {
            assignee: {
              select: {
                id: true,
                fullName: true,
                profileImageUrl: true,
              },
            },
            status: true,
            creator: {
              select: {
                id: true,
                fullName: true,
              },
            },
            subtasks: {
              select: { id: true, isClosed: true },
            },
            comments: {
              select: { id: true },
            },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } },
        { status: 404 }
      );
    }

    // Transform to match GAS response structure (for easy frontend migration)
    const response = {
      success: true,
      data: {
        project: {
          id: project.id,
          name: project.name,
          description: project.description,
          color: project.color,
          status: project.status,
          department: {
            id: project.department.id,
            name: project.department.name,
            division: {
              id: project.department.division.id,
              name: project.department.division.name,
              missionGroup: {
                id: project.department.division.missionGroup.id,
                name: project.department.division.missionGroup.name,
              },
            },
          },
          owner: project.owner,
        },
        statuses: project.statuses,
        tasks: project.tasks.map(task => ({
          id: task.id,
          name: task.name,
          description: task.description,
          statusId: task.statusId,
          priority: task.priority,
          dueDate: task.dueDate?.toISOString(),
          assigneeUserId: task.assigneeUserId,
          assignee: task.assignee,
          isClosed: task.isClosed,
          closeType: task.closeType,
          difficulty: task.difficulty,
          subtaskCount: task.subtasks.length,
          subtaskCompletedCount: task.subtasks.filter(s => s.isClosed).length,
          commentCount: task.comments.length,
          createdAt: task.createdAt.toISOString(),
        })),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Get project board data error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch project data' } },
      { status: 500 }
    );
  }
}
```

#### Create Task
```typescript
// GAS: createTask(token, data)
// Next.js: POST /api/projects/[projectId]/tasks

// src/app/api/projects/[projectId]/tasks/route.ts
import { z } from 'zod';

const createTaskSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  assigneeUserId: z.string().optional(),
  statusId: z.string(),
  priority: z.number().int().min(1).max(4).default(3),
  startDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional(),
  difficulty: z.number().int().min(1).max(5).optional(),
  parentTaskId: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED' } },
        { status: 401 }
      );
    }

    const { projectId } = params;

    // Check permission
    const hasAccess = await checkPermission(session.userId, 'create_tasks', projectId);
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN' } },
        { status: 403 }
      );
    }

    const body = await req.json();
    const data = createTaskSchema.parse(body);

    // Create task
    const task = await prisma.task.create({
      data: {
        name: data.name,
        description: data.description,
        projectId: projectId,
        assigneeUserId: data.assigneeUserId,
        statusId: data.statusId,
        priority: data.priority,
        startDate: data.startDate ? new Date(data.startDate) : null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        difficulty: data.difficulty,
        parentTaskId: data.parentTaskId,
        creatorUserId: session.userId,
      },
      include: {
        assignee: {
          select: {
            id: true,
            fullName: true,
            profileImageUrl: true,
          },
        },
        status: true,
      },
    });

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId: session.userId,
        actionType: 'CREATE',
        entityType: 'Task',
        entityId: task.id,
        changes: { created: task },
      },
    });

    // Send notification to assignee (if assigned)
    if (data.assigneeUserId && data.assigneeUserId !== session.userId) {
      await prisma.notification.create({
        data: {
          userId: data.assigneeUserId,
          type: 'TASK_ASSIGNED',
          title: 'งานใหม่ถูกมอบหมาย',
          message: `คุณได้รับมอบหมายงาน: ${task.name}`,
          link: `/projects/${projectId}?task=${task.id}`,
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        data: { task },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: error.errors } },
        { status: 400 }
      );
    }
    console.error('Create task error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}
```

### 3.3 Update Task (PATCH)
```typescript
// GAS: updateTask(token, taskId, updates)
// Next.js: PATCH /api/tasks/[taskId]

// src/app/api/tasks/[taskId]/route.ts

const updateTaskSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  assigneeUserId: z.string().nullable().optional(),
  statusId: z.string().optional(),
  priority: z.number().int().min(1).max(4).optional(),
  startDate: z.string().datetime().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  difficulty: z.number().int().min(1).max(5).nullable().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 });
    }

    const { taskId } = params;

    // Get existing task
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true },
    });

    if (!existingTask) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND' } }, { status: 404 });
    }

    // Check permission
    const hasAccess = await checkPermission(session.userId, 'edit_tasks', existingTask.projectId);
    if (!hasAccess) {
      return NextResponse.json({ success: false, error: { code: 'FORBIDDEN' } }, { status: 403 });
    }

    const body = await req.json();
    const updates = updateTaskSchema.parse(body);

    // Track changes for activity log
    const changes = {
      before: { ...existingTask },
      after: { ...existingTask, ...updates },
    };

    // Update task
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...updates,
        startDate: updates.startDate ? new Date(updates.startDate) : undefined,
        dueDate: updates.dueDate ? new Date(updates.dueDate) : undefined,
      },
      include: {
        assignee: { select: { id: true, fullName: true, profileImageUrl: true } },
        status: true,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.userId,
        actionType: 'UPDATE',
        entityType: 'Task',
        entityId: taskId,
        changes: changes,
      },
    });

    // Notify assignee if changed
    if (updates.assigneeUserId && updates.assigneeUserId !== existingTask.assigneeUserId) {
      await prisma.notification.create({
        data: {
          userId: updates.assigneeUserId,
          type: 'TASK_ASSIGNED',
          title: 'งานถูกมอบหมายให้คุณ',
          message: `คุณได้รับมอบหมายงาน: ${updatedTask.name}`,
          link: `/projects/${existingTask.projectId}?task=${taskId}`,
        },
      });
    }

    return NextResponse.json({ success: true, data: { task: updatedTask } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: error.errors } },
        { status: 400 }
      );
    }
    console.error('Update task error:', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR' } }, { status: 500 });
  }
}
```

---

## 4. Authentication Middleware

### 4.1 Session Validation Middleware

```typescript
// src/lib/auth.ts

import { NextRequest } from 'next/server';
import { prisma } from './db';

export interface Session {
  userId: string;
  sessionToken: string;
  user?: any;
}

export async function getSession(req: NextRequest): Promise<Session | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const sessionToken = authHeader.substring(7);

  try {
    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
            departmentId: true,
            userStatus: true,
          },
        },
      },
    });

    if (!session) {
      return null;
    }

    // Check if expired
    if (session.expiresAt < new Date()) {
      // Delete expired session
      await prisma.session.delete({ where: { id: session.id } });
      return null;
    }

    // Check user status
    if (session.user.userStatus !== 'ACTIVE') {
      return null;
    }

    return {
      userId: session.userId,
      sessionToken: session.sessionToken,
      user: session.user,
    };
  } catch (error) {
    console.error('Get session error:', error);
    return null;
  }
}

export async function createSession(userId: string): Promise<{ sessionToken: string; expiresAt: Date }> {
  const sessionToken = generateSecureToken(); // Implement crypto.randomBytes
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await prisma.session.create({
    data: {
      sessionToken,
      userId,
      expiresAt,
    },
  });

  return { sessionToken, expiresAt };
}

export async function deleteSession(sessionToken: string): Promise<void> {
  await prisma.session.deleteMany({ where: { sessionToken } });
}
```

### 4.2 Permission Check Utility

```typescript
// src/lib/permissions.ts

import { prisma } from './db';

export async function checkPermission(
  userId: string,
  permission: string,
  resourceId?: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      departmentId: true,
      additionalRoles: true,
    },
  });

  if (!user) return false;

  // Get permissions for user's role
  const permissions = await getUserPermissions(userId, user.role);

  if (!permissions.includes(permission)) {
    return false;
  }

  // Additional checks based on resource (e.g., department-level access)
  if (resourceId) {
    // Implement resource-level permission checks
    // e.g., check if user's department matches project's department
  }

  return true;
}

export async function getUserPermissions(userId: string, role: string): Promise<string[]> {
  // Same permission mapping as GAS
  const rolePermissions: Record<string, string[]> = {
    ADMIN: ['*'], // All permissions
    CHIEF: [
      'view_projects',
      'create_projects',
      'edit_projects',
      'delete_projects',
      'view_tasks',
      'create_tasks',
      'edit_tasks',
      'delete_tasks',
      'close_tasks',
      'view_users',
      'create_users',
      'edit_users',
      'view_reports',
      // ... all permissions
    ],
    LEADER: [
      'view_projects',
      'create_projects',
      'edit_projects',
      'view_tasks',
      'create_tasks',
      'edit_tasks',
      'close_tasks',
      'view_users',
      'view_reports',
    ],
    HEAD: [
      'view_projects',
      'create_projects',
      'edit_projects',
      'view_tasks',
      'create_tasks',
      'edit_tasks',
      'close_tasks',
      'view_reports',
    ],
    MEMBER: ['view_projects', 'view_tasks', 'create_tasks', 'edit_own_tasks'],
    USER: ['view_projects', 'view_tasks'],
  };

  return rolePermissions[role] || [];
}
```

---

## 5. Error Handling Strategy

### 5.1 Global Error Handler

```typescript
// src/lib/error-handler.ts

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: error.errors,
        },
      },
      { status: 400 }
    );
  }

  // Log unexpected errors
  console.error('Unexpected error:', error);

  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    },
    { status: 500 }
  );
}
```

### 5.2 API Route Wrapper

```typescript
// src/lib/api-wrapper.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from './auth';
import { handleApiError } from './error-handler';

type ApiHandler = (req: NextRequest, context: any) => Promise<NextResponse>;

export function withAuth(handler: ApiHandler): ApiHandler {
  return async (req: NextRequest, context: any) => {
    try {
      const session = await getSession(req);
      if (!session) {
        return NextResponse.json(
          { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
          { status: 401 }
        );
      }

      // Attach session to request for handler to use
      (req as any).session = session;

      return await handler(req, context);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

// Usage:
export const GET = withAuth(async (req: NextRequest) => {
  const session = (req as any).session;
  // Handler logic here
});
```

---

## 6. NEW API Endpoints Implementation (Added 2025-10-20)

### 6.1 Permissions API (CRITICAL)

#### POST /api/permissions/check

```typescript
// src/app/api/permissions/check/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { checkPermission } from '@/lib/permissions';
import { z } from 'zod';

const checkPermissionSchema = z.object({
  permission: z.string(),
  context: z.object({
    departmentId: z.string().optional(),
    projectId: z.string().optional(),
    taskId: z.string().optional(),
    ownerId: z.string().optional(),
  }).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED' } },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { permission, context } = checkPermissionSchema.parse(body);

    const hasPermission = await checkPermission(
      session.userId,
      permission,
      context
    );

    return NextResponse.json({
      success: true,
      data: { hasPermission },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
```

#### GET /api/permissions/roles/:role

```typescript
// src/app/api/permissions/roles/[role]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getUserPermissions } from '@/lib/permissions';

export async function GET(
  req: NextRequest,
  { params }: { params: { role: string } }
) {
  try {
    const { role } = params;

    const permissions = await getUserPermissions('', role);

    return NextResponse.json({
      success: true,
      data: { role, permissions },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### 6.2 Checklists API (HIGH PRIORITY)

#### POST /api/tasks/:taskId/checklists

```typescript
// src/app/api/tasks/[taskId]/checklists/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { checkPermission } from '@/lib/permissions';
import { z } from 'zod';

const createChecklistSchema = z.object({
  name: z.string().min(1).max(255),
  order: z.number().int().default(0),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED' } },
        { status: 401 }
      );
    }

    const { taskId } = params;

    // Get task to check permissions
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }

    // Check edit permission
    const canEdit = await checkPermission(
      session.userId,
      'edit_tasks',
      { projectId: task.projectId, ownerId: task.creatorUserId }
    );

    if (!canEdit) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN' } },
        { status: 403 }
      );
    }

    const body = await req.json();
    const data = createChecklistSchema.parse(body);

    // Create checklist item
    const checklistItem = await prisma.checklistItem.create({
      data: {
        taskId: taskId,
        name: data.name,
        order: data.order,
        creatorUserId: session.userId,
      },
    });

    // Record history
    await prisma.activityLog.create({
      data: {
        userId: session.userId,
        actionType: 'CREATE',
        entityType: 'ChecklistItem',
        entityId: checklistItem.id,
        changes: { created: checklistItem },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: { checklistItem },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED' } },
        { status: 401 }
      );
    }

    const { taskId } = params;

    const items = await prisma.checklistItem.findMany({
      where: {
        taskId: taskId,
        deletedAt: null,
      },
      orderBy: { order: 'asc' },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            profileImageUrl: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: { items },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
```

#### PATCH /api/tasks/:taskId/checklists/:itemId

```typescript
// src/app/api/tasks/[taskId]/checklists/[itemId]/route.ts

const updateChecklistSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  isChecked: z.boolean().optional(),
  order: z.number().int().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { taskId: string; itemId: string } }
) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED' } },
        { status: 401 }
      );
    }

    const { taskId, itemId } = params;

    // Get existing item
    const existingItem = await prisma.checklistItem.findUnique({
      where: { id: itemId },
      include: { task: { include: { project: true } } },
    });

    if (!existingItem || existingItem.taskId !== taskId) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }

    // Check permission
    const canEdit = await checkPermission(
      session.userId,
      'edit_tasks',
      { projectId: existingItem.task.projectId }
    );

    if (!canEdit) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN' } },
        { status: 403 }
      );
    }

    const body = await req.json();
    const updates = updateChecklistSchema.parse(body);

    // Update item
    const updatedItem = await prisma.checklistItem.update({
      where: { id: itemId },
      data: updates,
    });

    // Record history if checked/unchecked
    if (updates.isChecked !== undefined) {
      await prisma.activityLog.create({
        data: {
          userId: session.userId,
          actionType: 'UPDATE',
          entityType: 'ChecklistItem',
          entityId: itemId,
          changes: {
            before: { isChecked: existingItem.isChecked },
            after: { isChecked: updates.isChecked },
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: { checklistItem: updatedItem },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { taskId: string; itemId: string } }
) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED' } },
        { status: 401 }
      );
    }

    const { taskId, itemId } = params;

    // Get existing item
    const existingItem = await prisma.checklistItem.findUnique({
      where: { id: itemId },
      include: { task: { include: { project: true } } },
    });

    if (!existingItem || existingItem.taskId !== taskId) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }

    // Check permission
    const canEdit = await checkPermission(
      session.userId,
      'edit_tasks',
      { projectId: existingItem.task.projectId }
    );

    if (!canEdit) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN' } },
        { status: 403 }
      );
    }

    // Soft delete
    await prisma.checklistItem.update({
      where: { id: itemId },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      data: { deleted: true },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### 6.3 Batch Operations API (PERFORMANCE CRITICAL)

#### POST /api/batch

```typescript
// src/app/api/batch/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const batchOperationSchema = z.object({
  operations: z.array(
    z.discriminatedUnion('type', [
      z.object({
        type: z.literal('UPDATE_TASK_FIELD'),
        taskId: z.string(),
        field: z.string(),
        value: z.any(),
      }),
      z.object({
        type: z.literal('UPDATE_TASK_STATUS'),
        taskId: z.string(),
        statusId: z.string(),
      }),
      z.object({
        type: z.literal('UPDATE_CHECKLIST_STATUS'),
        itemId: z.string(),
        isChecked: z.boolean(),
      }),
      z.object({
        type: z.literal('ADD_CHECKLIST_ITEM'),
        taskId: z.string(),
        name: z.string(),
      }),
    ])
  ),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED' } },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { operations } = batchOperationSchema.parse(body);

    const results = [];

    // Process operations in transaction
    await prisma.$transaction(async (tx) => {
      for (const op of operations) {
        try {
          let result;

          switch (op.type) {
            case 'UPDATE_TASK_FIELD':
              result = await tx.task.update({
                where: { id: op.taskId },
                data: { [op.field]: op.value },
              });
              break;

            case 'UPDATE_TASK_STATUS':
              result = await tx.task.update({
                where: { id: op.taskId },
                data: { statusId: op.statusId },
              });
              break;

            case 'UPDATE_CHECKLIST_STATUS':
              result = await tx.checklistItem.update({
                where: { id: op.itemId },
                data: { isChecked: op.isChecked },
              });
              break;

            case 'ADD_CHECKLIST_ITEM':
              result = await tx.checklistItem.create({
                data: {
                  taskId: op.taskId,
                  name: op.name,
                  order: 0,
                  creatorUserId: session.userId,
                },
              });
              break;
          }

          results.push({
            success: true,
            operation: op.type,
            data: result,
          });
        } catch (error) {
          results.push({
            success: false,
            operation: op.type,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        results,
        total: operations.length,
        succeeded: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### 6.4 Pinned Tasks API

#### POST /api/users/me/pinned-tasks

```typescript
// src/app/api/users/me/pinned-tasks/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const pinTaskSchema = z.object({
  taskId: z.string(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED' } },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { pinnedTasks: true },
    });

    const pinnedTaskIds = (user?.pinnedTasks as string[]) || [];

    // Fetch pinned tasks
    const tasks = await prisma.task.findMany({
      where: {
        id: { in: pinnedTaskIds },
        deletedAt: null,
      },
      include: {
        project: { select: { id: true, name: true, color: true } },
        status: true,
        assignee: {
          select: { id: true, fullName: true, profileImageUrl: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: { tasks },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED' } },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { taskId } = pinTaskSchema.parse(body);

    // Get current pinned tasks
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { pinnedTasks: true },
    });

    const pinnedTasks = (user?.pinnedTasks as string[]) || [];

    // Add taskId if not already pinned
    if (!pinnedTasks.includes(taskId)) {
      pinnedTasks.push(taskId);

      await prisma.user.update({
        where: { id: session.userId },
        data: { pinnedTasks: pinnedTasks },
      });
    }

    return NextResponse.json({
      success: true,
      data: { pinned: true, taskId },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
```

#### DELETE /api/users/me/pinned-tasks/:taskId

```typescript
// src/app/api/users/me/pinned-tasks/[taskId]/route.ts

export async function DELETE(
  req: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED' } },
        { status: 401 }
      );
    }

    const { taskId } = params;

    // Get current pinned tasks
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { pinnedTasks: true },
    });

    const pinnedTasks = (user?.pinnedTasks as string[]) || [];

    // Remove taskId
    const updatedPinnedTasks = pinnedTasks.filter((id) => id !== taskId);

    await prisma.user.update({
      where: { id: session.userId },
      data: { pinnedTasks: updatedPinnedTasks },
    });

    return NextResponse.json({
      success: true,
      data: { unpinned: true, taskId },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### 6.5 Progress Calculation API

#### GET /api/projects/:projectId/progress

```typescript
// src/app/api/projects/[projectId]/progress/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { calculateProjectProgress } from '@/lib/progress-calculator';

export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED' } },
        { status: 401 }
      );
    }

    const { projectId } = params;

    const progress = await calculateProjectProgress(projectId);

    return NextResponse.json({
      success: true,
      data: { projectId, progress },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### 6.6 Notifications API

#### GET /api/notifications

```typescript
// src/app/api/notifications/route.ts

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED' } },
        { status: 401 }
      );
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      data: { notifications },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
```

#### POST /api/notifications/read

```typescript
// src/app/api/notifications/read/route.ts

const markReadSchema = z.object({
  notificationIds: z.array(z.string()),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED' } },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { notificationIds } = markReadSchema.parse(body);

    await prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId: session.userId,
      },
      data: { isRead: true },
    });

    return NextResponse.json({
      success: true,
      data: { marked: notificationIds.length },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
```

---

## 7. Testing Strategy

### 6.1 API Testing with Jest

```typescript
// tests/api/tasks.test.ts

import { POST } from '@/app/api/projects/[projectId]/tasks/route';
import { createMockRequest } from '@/tests/utils';

describe('POST /api/projects/:projectId/tasks', () => {
  it('should create a task with valid data', async () => {
    const req = createMockRequest({
      method: 'POST',
      body: {
        name: 'Test Task',
        statusId: 'status-123',
        priority: 3,
      },
      headers: {
        authorization: 'Bearer valid-token',
      },
    });

    const res = await POST(req, { params: { projectId: 'project-123' } });
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.task.name).toBe('Test Task');
  });

  it('should return 401 without auth', async () => {
    const req = createMockRequest({
      method: 'POST',
      body: { name: 'Test Task' },
    });

    const res = await POST(req, { params: { projectId: 'project-123' } });

    expect(res.status).toBe(401);
  });
});
```

---

## 8. Migration Checklist (UPDATED 2025-10-20)

### Phase 1: Core APIs (Week 1-2)
- [ ] Authentication endpoints (login, logout, register)
- [ ] Email verification (send, verify)
- [ ] Password reset (request, reset)
- [ ] Session management
- [ ] User profile endpoints
- [ ] **Permission system (NEW - CRITICAL)**
  - [ ] POST /api/permissions/check
  - [ ] GET /api/permissions/roles/:role
  - [ ] GET /api/permissions/hierarchy/:deptId

### Phase 2: Organization & Data APIs (Week 3)
- [ ] Organization structure endpoints
  - [ ] Mission groups, Divisions, Departments (existing)
  - [ ] **Hospital Missions API (NEW)**
  - [ ] **IT Goals API (NEW)**
  - [ ] **Action Plans API (NEW)**
- [ ] Project CRUD endpoints
- [ ] **Project progress calculation (NEW)**
- [ ] Status management endpoints
- [ ] **Phases API (NEW)**
  - [ ] POST /api/projects/:id/phases
  - [ ] POST /api/projects/:id/phases/batch

### Phase 3: Task Management APIs (Week 4)
- [ ] Task CRUD endpoints
- [ ] Task close endpoint
- [ ] Comments API
- [ ] Task history API
- [ ] **Checklists API (NEW - HIGH PRIORITY)**
  - [ ] POST /api/tasks/:id/checklists
  - [ ] PATCH /api/tasks/:id/checklists/:itemId
  - [ ] DELETE /api/tasks/:id/checklists/:itemId

### Phase 4: User Experience APIs (Week 5)
- [ ] **Pinned tasks API (NEW)**
  - [ ] GET /api/users/me/pinned-tasks
  - [ ] POST /api/users/me/pinned-tasks
  - [ ] DELETE /api/users/me/pinned-tasks/:taskId
- [ ] **Notifications API (NEW)**
  - [ ] GET /api/notifications
  - [ ] POST /api/notifications/read
  - [ ] GET /api/notifications/unread-count
- [ ] **User activities & comments API (NEW)**
  - [ ] GET /api/users/me/activities
  - [ ] GET /api/users/me/comments
- [ ] Dashboard data APIs
- [ ] Reports API
- [ ] **Mentions autocomplete API (NEW)**
  - [ ] GET /api/users/mentions?q=search

### Phase 5: Performance & Advanced Features (Week 6)
- [ ] **Batch operations API (NEW - PERFORMANCE)**
  - [ ] POST /api/batch
  - [ ] Support UPDATE_TASK_FIELD, UPDATE_TASK_STATUS, UPDATE_CHECKLIST_STATUS, ADD_CHECKLIST_ITEM
- [ ] **Batch status creation (NEW)**
  - [ ] POST /api/projects/:id/statuses/batch

### Phase 6: Testing & Documentation (Week 7)
- [ ] Unit tests for all endpoints
- [ ] Integration tests (focus on permissions & checklists)
- [ ] Load testing (especially batch operations)
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Postman collection

---

**SUMMARY OF CHANGES:**
- **Original plan:** ~30 endpoints
- **Updated plan:** ~65 endpoints (+35 new)
- **Critical additions:** Permissions (9), Checklists (3), Batch (1)
- **High priority additions:** Pinned Tasks, Notifications, Phases
- **Estimated additional time:** +1 week

---

**Document Status:** ✅ UPDATED (2025-10-20)
**Next:** [03_FRONTEND_MIGRATION.md](./03_FRONTEND_MIGRATION.md)
