# Business Logic & Core Algorithms Guide
## Critical Business Rules Implementation

**Version:** 1.0
**Date:** 2025-10-20
**Purpose:** Document complex business logic for accurate migration from GAS to Next.js

---

## Table of Contents

1. [Permission System Architecture](#1-permission-system-architecture)
2. [Progress Calculation Algorithm](#2-progress-calculation-algorithm)
3. [Task Lifecycle State Machine](#3-task-lifecycle-state-machine)
4. [History Recording Strategy](#4-history-recording-strategy)
5. [Notification Triggering Logic](#5-notification-triggering-logic)
6. [Sync Queue & Offline Support](#6-sync-queue--offline-support)

---

## 1. Permission System Architecture

### 1.1 Role Hierarchy

```
ADMIN        (Level 6) - Full system access
  └─ CHIEF   (Level 5) - Mission Group Chief
      └─ LEADER   (Level 4) - Division Leader
          └─ HEAD     (Level 3) - Department Head
              └─ MEMBER   (Level 2) - Team Member
                  └─ USER     (Level 1) - Basic User
```

### 1.2 Permission Matrix

```typescript
// lib/permissions/permission-matrix.ts

export const PERMISSION_MATRIX = {
  ADMIN: [
    'view_all',
    'create_all',
    'edit_all',
    'delete_all',
    'manage_users',
    'manage_organization',
    'view_reports',
    'export_data',
  ],

  CHIEF: [
    'view_mission_group',
    'create_projects',
    'edit_mission_group_projects',
    'delete_mission_group_projects',
    'view_tasks',
    'create_tasks',
    'edit_tasks',
    'close_tasks',
    'manage_division_leaders',
    'view_reports',
  ],

  LEADER: [
    'view_division',
    'create_projects',
    'edit_division_projects',
    'delete_division_projects',
    'view_tasks',
    'create_tasks',
    'edit_tasks',
    'close_tasks',
    'manage_department_heads',
    'view_reports',
  ],

  HEAD: [
    'view_department',
    'create_projects',
    'edit_department_projects',
    'view_tasks',
    'create_tasks',
    'edit_tasks',
    'close_tasks',
    'manage_members',
    'view_reports',
  ],

  MEMBER: [
    'view_projects',
    'view_tasks',
    'create_tasks',
    'edit_own_tasks',
    'comment_tasks',
  ],

  USER: [
    'view_projects',
    'view_tasks',
    'comment_tasks',
  ],
} as const;
```

### 1.3 Core Permission Functions

#### 1.3.1 Get Effective Role

```typescript
// lib/permissions/get-effective-role.ts

import { prisma } from '@/lib/db';

export interface PermissionContext {
  departmentId?: string;
  projectId?: string;
  taskId?: string;
}

/**
 * Get user's effective role in a given context
 * User may have different roles in different contexts via additionalRoles field
 */
export async function getEffectiveRole(
  userId: string,
  context?: PermissionContext
): Promise<UserRole> {
  const user = await prisma.user.findUnique({
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

  if (!user) throw new Error('User not found');

  // Check if user is Admin
  if (user.role === 'ADMIN') return 'ADMIN';

  // Check if user is Chief of mission group
  if (user.department?.division?.missionGroup?.chiefUserId === userId) {
    return 'CHIEF';
  }

  // Check if user is Leader of division
  if (user.department?.division?.leaderUserId === userId) {
    return 'LEADER';
  }

  // Check if user is Head of department
  if (user.department?.headUserId === userId) {
    return 'HEAD';
  }

  // Check additionalRoles for context-specific roles
  if (context?.departmentId && user.additionalRoles) {
    const additionalRoles = user.additionalRoles as Record<string, string>;
    const roleInDept = Object.entries(additionalRoles).find(
      ([role, deptId]) => deptId === context.departmentId
    );
    if (roleInDept) {
      return roleInDept[0] as UserRole;
    }
  }

  // Default to user's base role
  return user.role;
}
```

#### 1.3.2 Get Department Hierarchy

```typescript
// lib/permissions/get-hierarchy.ts

export interface DepartmentHierarchy {
  department: Department;
  division: Division;
  missionGroup: MissionGroup;
}

/**
 * Get full organizational hierarchy for a department
 * Used for scope checking
 */
export async function getDepartmentHierarchy(
  departmentId: string
): Promise<DepartmentHierarchy> {
  const department = await prisma.department.findUnique({
    where: { id: departmentId },
    include: {
      division: {
        include: {
          missionGroup: true,
        },
      },
    },
  });

  if (!department) throw new Error('Department not found');

  return {
    department,
    division: department.division,
    missionGroup: department.division.missionGroup,
  };
}
```

#### 1.3.3 Check Scope

```typescript
// lib/permissions/check-scope.ts

type Scope = 'department' | 'division' | 'mission_group';

/**
 * Check if user can access resources in a given scope
 */
export async function isInScope(
  userId: string,
  scope: Scope,
  targetDepartmentId: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
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

  if (!user || !user.department) return false;

  const targetHierarchy = await getDepartmentHierarchy(targetDepartmentId);

  switch (scope) {
    case 'department':
      // Can access only same department
      return user.department.id === targetDepartmentId;

    case 'division':
      // Can access any department in same division
      return user.department.division.id === targetHierarchy.division.id;

    case 'mission_group':
      // Can access any department in same mission group
      return (
        user.department.division.missionGroup.id ===
        targetHierarchy.missionGroup.id
      );

    default:
      return false;
  }
}
```

#### 1.3.4 Check Permission (Main Function)

```typescript
// lib/permissions/check-permission.ts

export interface PermissionCheckContext extends PermissionContext {
  ownerId?: string; // Creator/owner of resource
}

/**
 * Main permission check function
 * Combines role, scope, and ownership checks
 */
export async function checkPermission(
  userId: string,
  permission: string,
  context?: PermissionCheckContext
): Promise<boolean> {
  // 1. Get effective role in context
  const effectiveRole = await getEffectiveRole(userId, context);

  // 2. Check if role has this permission
  const rolePermissions = PERMISSION_MATRIX[effectiveRole] || [];
  if (!rolePermissions.includes(permission)) {
    return false;
  }

  // 3. Check scope if department context provided
  if (context?.departmentId) {
    const scope = getScopeForRole(effectiveRole);
    const inScope = await isInScope(userId, scope, context.departmentId);
    if (!inScope) return false;
  }

  // 4. Check ownership rules
  if (context?.ownerId) {
    return checkOwnershipRules(userId, effectiveRole, permission, context.ownerId);
  }

  return true;
}

/**
 * Get scope level for a role
 */
function getScopeForRole(role: UserRole): Scope {
  switch (role) {
    case 'ADMIN':
      return 'mission_group'; // Full access
    case 'CHIEF':
      return 'mission_group';
    case 'LEADER':
      return 'division';
    case 'HEAD':
      return 'department';
    case 'MEMBER':
    case 'USER':
      return 'department';
  }
}

/**
 * Check ownership-based rules
 */
function checkOwnershipRules(
  userId: string,
  role: UserRole,
  permission: string,
  ownerId: string
): boolean {
  const isOwner = userId === ownerId;

  // Special rules from original code:
  // 1. Can't delete own tasks (others can if authorized)
  if (permission === 'delete_tasks' && isOwner) {
    return false;
  }

  // 2. Can always edit own tasks (if have edit_own_tasks permission)
  if (permission === 'edit_tasks' && isOwner) {
    return true;
  }

  // 3. Members can only edit their own tasks
  if (role === 'MEMBER' && permission === 'edit_tasks' && !isOwner) {
    return false;
  }

  return true;
}
```

#### 1.3.5 Task-Specific Permission Checks

```typescript
// lib/permissions/task-permissions.ts

/**
 * Check if user can view a task
 */
export async function canUserViewTask(
  userId: string,
  task: Task & { project: Project }
): Promise<boolean> {
  // Closed tasks can't be viewed by users without proper role
  if (task.isClosed) {
    const role = await getEffectiveRole(userId, {
      departmentId: task.project.departmentId,
    });
    if (role === 'USER' || role === 'MEMBER') return false;
  }

  return checkPermission(userId, 'view_tasks', {
    departmentId: task.project.departmentId,
  });
}

/**
 * Check if user can edit a task
 */
export async function canUserEditTask(
  userId: string,
  task: Task & { project: Project }
): Promise<boolean> {
  // Can't edit closed tasks
  if (task.isClosed) return false;

  return checkPermission(userId, 'edit_tasks', {
    departmentId: task.project.departmentId,
    ownerId: task.creatorUserId,
  });
}

/**
 * Check if user can delete a task
 */
export async function canUserDeleteTask(
  userId: string,
  task: Task & { project: Project }
): Promise<boolean> {
  // Can't delete closed tasks
  if (task.isClosed) return false;

  return checkPermission(userId, 'delete_tasks', {
    departmentId: task.project.departmentId,
    ownerId: task.creatorUserId,
  });
}

/**
 * Check if user can close a task
 */
export async function canUserCloseTask(
  userId: string,
  task: Task & { project: Project }
): Promise<boolean> {
  // Already closed
  if (task.isClosed) return false;

  // Must have close_tasks permission
  return checkPermission(userId, 'close_tasks', {
    departmentId: task.project.departmentId,
  });
}
```

### 1.4 Middleware Integration

```typescript
// lib/middleware/with-permission.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { checkPermission } from '@/lib/permissions';

type PermissionHandler = (
  req: NextRequest,
  context: any
) => Promise<NextResponse>;

export function withPermission(
  permission: string,
  handler: PermissionHandler
): PermissionHandler {
  return async (req: NextRequest, context: any) => {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED' } },
        { status: 401 }
      );
    }

    // Extract context from request (e.g., departmentId from body or params)
    const permissionContext = extractPermissionContext(req, context);

    const hasPermission = await checkPermission(
      session.userId,
      permission,
      permissionContext
    );

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN' } },
        { status: 403 }
      );
    }

    return handler(req, context);
  };
}
```

---

## 2. Progress Calculation Algorithm

### 2.1 Formula

จากโค้ดเดิม (module.ProgressCalculator.html):

```
Progress% = Σ(statusOrder × difficulty) × 100 / Σ(Smax × difficulty)

Where:
- statusOrder = status.order (0-based)
- difficulty = task.difficulty (1=Easy, 2=Normal, 3=Hard)
- Smax = maximum status order in project
```

### 2.2 Implementation

```typescript
// lib/progress-calculator.ts

export interface ProgressOptions {
  includeClosed?: boolean;
  departmentId?: string;
}

/**
 * Calculate project progress percentage
 * Uses weighted formula: (statusOrder × difficulty) / (maxOrder × difficulty)
 */
export async function calculateProjectProgress(
  projectId: string,
  options: ProgressOptions = {}
): Promise<number> {
  // Get all statuses for the project, ordered
  const statuses = await prisma.status.findMany({
    where: { projectId },
    orderBy: { order: 'asc' },
  });

  if (statuses.length === 0) return 0;

  const maxStatusOrder = Math.max(...statuses.map((s) => s.order));

  // Get all tasks (excluding closed if specified)
  const tasks = await prisma.task.findMany({
    where: {
      projectId,
      isClosed: options.includeClosed ? undefined : false,
    },
    include: {
      status: true,
    },
  });

  if (tasks.length === 0) return 0;

  let totalWeightedProgress = 0;
  let totalMaxWeight = 0;

  for (const task of tasks) {
    const statusOrder = task.status?.order || 0;
    const difficulty = task.difficulty || 2; // Default to Normal

    // Weighted progress for this task
    totalWeightedProgress += statusOrder * difficulty;

    // Maximum possible progress for this task
    totalMaxWeight += maxStatusOrder * difficulty;
  }

  // Avoid division by zero
  if (totalMaxWeight === 0) return 0;

  // Calculate percentage
  const progress = (totalWeightedProgress / totalMaxWeight) * 100;

  return Math.round(progress);
}

/**
 * Calculate progress for multiple projects in batch
 */
export async function calculateMultipleProjectsProgress(
  projectIds: string[]
): Promise<Record<string, number>> {
  const results: Record<string, number> = {};

  await Promise.all(
    projectIds.map(async (projectId) => {
      results[projectId] = await calculateProjectProgress(projectId);
    })
  );

  return results;
}

/**
 * Calculate department-level progress (average of all projects)
 */
export async function calculateDepartmentProgress(
  departmentId: string
): Promise<number> {
  const projects = await prisma.project.findMany({
    where: {
      departmentId,
      status: 'ACTIVE',
      deletedAt: null,
    },
  });

  if (projects.length === 0) return 0;

  const progressValues = await Promise.all(
    projects.map((p) => calculateProjectProgress(p.id))
  );

  const averageProgress =
    progressValues.reduce((sum, val) => sum + val, 0) / progressValues.length;

  return Math.round(averageProgress);
}
```

### 2.3 Example Calculation

```
Project with 3 tasks:

Task 1: Status Order=0, Difficulty=2 (Normal) → Progress: 0 × 2 = 0
Task 2: Status Order=2, Difficulty=1 (Easy)   → Progress: 2 × 1 = 2
Task 3: Status Order=3, Difficulty=3 (Hard)   → Progress: 3 × 3 = 9

Max Status Order = 3

Total Weighted Progress = 0 + 2 + 9 = 11
Total Max Weight = (3×2) + (3×1) + (3×3) = 6 + 3 + 9 = 18

Progress% = (11 / 18) × 100 = 61.11% ≈ 61%
```

---

## 3. Task Lifecycle State Machine

### 3.1 State Diagram

```
┌─────────────┐
│   CREATED   │ (isClosed=false, closeDate=null)
└──────┬──────┘
       │
       │ User updates status
       ▼
┌─────────────┐
│ IN PROGRESS │ (isClosed=false, closeDate=null)
└──────┬──────┘
       │
       │ User clicks "Close Task"
       ▼
┌─────────────┐
│   CLOSING   │ (UI state only - not in DB)
└──────┬──────┘ Shows skeleton: "กำลังปิดงาน..." or "กำลังยกเลิกงาน..."
       │
       │ API call completes
       ▼
┌─────────────┐
│   CLOSED    │ (isClosed=true, closeDate=Date, closeType=COMPLETED|ABORTED)
└─────────────┘ Can't edit, drag, or change status
```

### 3.2 Close Task Logic

```typescript
// lib/task-lifecycle.ts

export type CloseType = 'COMPLETED' | 'ABORTED';

export interface CloseTaskParams {
  taskId: string;
  closeType: CloseType;
  userId: string;
}

/**
 * Close a task
 * Determines close type based on current status type
 */
export async function closeTask({
  taskId,
  closeType,
  userId,
}: CloseTaskParams): Promise<Task> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { status: true, project: true },
  });

  if (!task) throw new Error('Task not found');
  if (task.isClosed) throw new Error('Task already closed');

  // Check permission
  const canClose = await canUserCloseTask(userId, task);
  if (!canClose) throw new Error('Permission denied');

  // Auto-determine close type if not provided
  let finalCloseType = closeType;
  if (!finalCloseType) {
    // If current status type is "DONE", close as COMPLETED
    // Otherwise, close as ABORTED
    finalCloseType = task.status.type === 'DONE' ? 'COMPLETED' : 'ABORTED';
  }

  // Update task
  const closedTask = await prisma.task.update({
    where: { id: taskId },
    data: {
      isClosed: true,
      closeDate: new Date(),
      closeType: finalCloseType,
      userClosedId: userId,
    },
  });

  // Record history
  await prisma.activityLog.create({
    data: {
      userId,
      actionType: 'CLOSE',
      entityType: 'Task',
      entityId: taskId,
      changes: {
        closeType: finalCloseType,
        message:
          finalCloseType === 'COMPLETED'
            ? 'ปิดงานสำเร็จ'
            : 'ยกเลิกงาน',
      },
    },
  });

  // Create notification for assignee
  if (closedTask.assigneeUserId && closedTask.assigneeUserId !== userId) {
    await createTaskClosedNotification(closedTask, userId);
  }

  return closedTask;
}

/**
 * Reopen a closed task
 */
export async function reopenTask(
  taskId: string,
  userId: string
): Promise<Task> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: true },
  });

  if (!task) throw new Error('Task not found');
  if (!task.isClosed) throw new Error('Task is not closed');

  // Check permission (must be HEAD or higher)
  const role = await getEffectiveRole(userId, {
    departmentId: task.project.departmentId,
  });

  if (!['ADMIN', 'CHIEF', 'LEADER', 'HEAD'].includes(role)) {
    throw new Error('Permission denied');
  }

  // Reopen task
  const reopenedTask = await prisma.task.update({
    where: { id: taskId },
    data: {
      isClosed: false,
      closeDate: null,
      closeType: null,
      userClosedId: null,
    },
  });

  // Record history
  await prisma.activityLog.create({
    data: {
      userId,
      actionType: 'REOPEN',
      entityType: 'Task',
      entityId: taskId,
      changes: { message: 'เปิดงานอีกครั้ง' },
    },
  });

  return reopenedTask;
}
```

### 3.3 Closed Task Restrictions

```typescript
// lib/task-lifecycle.ts (continued)

/**
 * Check if task operation is allowed based on lifecycle state
 */
export function isTaskOperationAllowed(
  task: Task,
  operation: 'edit' | 'delete' | 'drag' | 'change_status' | 'add_checklist'
): boolean {
  // Closed tasks can't be modified
  if (task.isClosed) return false;

  return true;
}
```

---

## 4. History Recording Strategy

### 4.1 Activity Log Types

```typescript
// lib/history/activity-types.ts

export type ActivityAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'CLOSE'
  | 'REOPEN'
  | 'ASSIGN'
  | 'COMMENT';

export interface ActivityChanges {
  before?: Record<string, any>;
  after?: Record<string, any>;
  message?: string; // Simple text message for display
}
```

### 4.2 Recording History

```typescript
// lib/history/record-activity.ts

export interface RecordActivityParams {
  userId: string;
  actionType: ActivityAction;
  entityType: string; // 'Task', 'Project', 'ChecklistItem', etc.
  entityId: string;
  changes: ActivityChanges;
}

/**
 * Record activity in history
 */
export async function recordActivity({
  userId,
  actionType,
  entityType,
  entityId,
  changes,
}: RecordActivityParams): Promise<ActivityLog> {
  return prisma.activityLog.create({
    data: {
      userId,
      actionType,
      entityType,
      entityId,
      changes,
    },
  });
}

/**
 * Helper to generate human-readable message from changes
 */
export function generateChangeMessage(
  actionType: ActivityAction,
  entityType: string,
  changes: ActivityChanges
): string {
  switch (actionType) {
    case 'CREATE':
      return `สร้าง${entityType}`;

    case 'UPDATE':
      if (changes.message) return changes.message;

      const changedFields = Object.keys(changes.after || {});
      if (changedFields.length === 0) return 'อัพเดต';

      return `อัพเดต ${changedFields.join(', ')}`;

    case 'DELETE':
      return `ลบ${entityType}`;

    case 'CLOSE':
      return changes.message || 'ปิดงาน';

    case 'REOPEN':
      return 'เปิดงานอีกครั้ง';

    case 'ASSIGN':
      return `มอบหมายให้ ${changes.after?.assigneeName}`;

    case 'COMMENT':
      return 'แสดงความคิดเห็น';

    default:
      return actionType;
  }
}
```

### 4.3 Field-Specific Change Tracking

```typescript
// lib/history/track-changes.ts

const FIELD_LABELS: Record<string, string> = {
  name: 'ชื่องาน',
  description: 'รายละเอียด',
  statusId: 'สถานะ',
  priority: 'ความสำคัญ',
  dueDate: 'กำหนดส่ง',
  assigneeUserId: 'ผู้รับผิดชอบ',
  difficulty: 'ระดับความยาก',
};

/**
 * Track task field changes
 */
export async function trackTaskChanges(
  taskId: string,
  userId: string,
  before: Partial<Task>,
  after: Partial<Task>
): Promise<void> {
  const changes: string[] = [];

  for (const [field, beforeValue] of Object.entries(before)) {
    const afterValue = after[field as keyof Task];

    if (beforeValue !== afterValue) {
      const label = FIELD_LABELS[field] || field;
      changes.push(label);
    }
  }

  if (changes.length === 0) return;

  await recordActivity({
    userId,
    actionType: 'UPDATE',
    entityType: 'Task',
    entityId: taskId,
    changes: {
      before,
      after,
      message: `อัพเดต ${changes.join(', ')}`,
    },
  });
}
```

---

## 5. Notification Triggering Logic

### 5.1 Notification Types

```typescript
// lib/notifications/types.ts

export type NotificationType =
  | 'TASK_ASSIGNED'
  | 'TASK_UPDATED'
  | 'TASK_CLOSED'
  | 'COMMENT_MENTION'
  | 'PROJECT_UPDATED'
  | 'DEADLINE_APPROACHING'
  | 'OVERDUE_TASK'
  | 'SYSTEM_ANNOUNCEMENT';
```

### 5.2 Notification Triggers

```typescript
// lib/notifications/triggers.ts

/**
 * Create notification when task is assigned
 */
export async function createTaskAssignedNotification(
  task: Task & { assignee: User; creator: User }
): Promise<void> {
  if (!task.assigneeUserId || task.assigneeUserId === task.creatorUserId) {
    return; // Don't notify if assigning to self
  }

  await prisma.notification.create({
    data: {
      userId: task.assigneeUserId,
      type: 'TASK_ASSIGNED',
      title: 'มีงานใหม่มอบหมายให้คุณ',
      message: `${task.creator.fullName} มอบหมายงาน "${task.name}" ให้คุณ`,
      link: `/projects/${task.projectId}/tasks/${task.id}`,
    },
  });
}

/**
 * Create notification when user is mentioned in comment
 */
export async function createMentionNotification(
  comment: TaskComment & { user: User },
  mentionedUserIds: string[]
): Promise<void> {
  const notifications = mentionedUserIds
    .filter((userId) => userId !== comment.userId) // Don't notify self
    .map((userId) => ({
      userId,
      type: 'COMMENT_MENTION' as const,
      title: 'คุณถูกกล่าวถึงในความคิดเห็น',
      message: `${comment.user.fullName} กล่าวถึงคุณในความคิดเห็น`,
      link: `/projects/${comment.task.projectId}/tasks/${comment.taskId}`,
    }));

  if (notifications.length > 0) {
    await prisma.notification.createMany({
      data: notifications,
    });
  }
}

/**
 * Create notification when task is closed
 */
export async function createTaskClosedNotification(
  task: Task & { assignee?: User },
  closedByUserId: string
): Promise<void> {
  if (!task.assigneeUserId || task.assigneeUserId === closedByUserId) {
    return;
  }

  const closedByUser = await prisma.user.findUnique({
    where: { id: closedByUserId },
  });

  await prisma.notification.create({
    data: {
      userId: task.assigneeUserId,
      type: 'TASK_CLOSED',
      title: 'งานถูกปิดแล้ว',
      message: `${closedByUser?.fullName} ปิดงาน "${task.name}"`,
      link: `/projects/${task.projectId}/tasks/${task.id}`,
    },
  });
}

/**
 * Create deadline approaching notifications (run as cron job)
 */
export async function createDeadlineNotifications(): Promise<void> {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(23, 59, 59, 999);

  // Find tasks due tomorrow
  const tasks = await prisma.task.findMany({
    where: {
      isClosed: false,
      dueDate: {
        gte: tomorrow,
        lte: tomorrowEnd,
      },
      assigneeUserId: { not: null },
    },
    include: {
      assignee: true,
    },
  });

  const notifications = tasks.map((task) => ({
    userId: task.assigneeUserId!,
    type: 'DEADLINE_APPROACHING' as const,
    title: 'งานใกล้ครบกำหนด',
    message: `งาน "${task.name}" ใกล้ครบกำหนดในวันพรุ่งนี้`,
    link: `/projects/${task.projectId}/tasks/${task.id}`,
  }));

  if (notifications.length > 0) {
    await prisma.notification.createMany({
      data: notifications,
    });
  }
}
```

### 5.3 Mention Detection

```typescript
// lib/notifications/mention-parser.ts

/**
 * Extract mentioned user IDs from comment text
 * Format: @username or @[userId]
 */
export function extractMentionedUserIds(text: string): string[] {
  const mentionRegex = /@\[([a-zA-Z0-9-_]+)\]/g;
  const matches = text.matchAll(mentionRegex);

  const userIds = new Set<string>();
  for (const match of matches) {
    userIds.add(match[1]);
  }

  return Array.from(userIds);
}

/**
 * Get mentionable users (for autocomplete)
 */
export async function getMentionableUsers(
  searchTerm: string,
  limit: number = 10
): Promise<User[]> {
  return prisma.user.findMany({
    where: {
      userStatus: 'ACTIVE',
      OR: [
        { fullName: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      profileImageUrl: true,
    },
    take: limit,
  });
}
```

---

## 6. Sync Queue & Offline Support (OPTIONAL)

### 6.1 Queue Structure

```typescript
// stores/use-sync-queue.ts

export interface QueuedAction {
  id: string;
  type: ActionType;
  payload: any;
  timestamp: number;
  retries: number;
  status: 'pending' | 'processing' | 'failed';
}

export type ActionType =
  | 'CREATE_TASK'
  | 'UPDATE_TASK'
  | 'DELETE_TASK'
  | 'UPDATE_TASK_STATUS'
  | 'ADD_CHECKLIST_ITEM'
  | 'UPDATE_CHECKLIST_ITEM'
  | 'ADD_COMMENT';

interface SyncQueueState {
  queue: QueuedAction[];
  isOnline: boolean;
  isSyncing: boolean;

  enqueue: (action: Omit<QueuedAction, 'id' | 'timestamp' | 'retries' | 'status'>) => void;
  dequeue: (actionId: string) => void;
  sync: () => Promise<void>;
  setOnline: (online: boolean) => void;
}
```

### 6.2 Sync Manager

```typescript
// lib/sync-manager.ts

export class SyncManager {
  private static instance: SyncManager;
  private queue: QueuedAction[] = [];
  private maxRetries = 3;

  static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager();
    }
    return SyncManager.instance;
  }

  /**
   * Initialize sync manager
   * Load persisted queue from localStorage
   */
  async init(): Promise<void> {
    // Load from localStorage
    const stored = localStorage.getItem('sync-queue');
    if (stored) {
      this.queue = JSON.parse(stored);
    }

    // Listen for online/offline events
    window.addEventListener('online', () => this.onOnline());
    window.addEventListener('offline', () => this.onOffline());

    // Start auto-sync interval (every 30 seconds)
    setInterval(() => this.sync(), 30000);

    // Sync immediately if online
    if (navigator.onLine) {
      await this.sync();
    }
  }

  /**
   * Add action to queue
   */
  enqueue(action: Omit<QueuedAction, 'id' | 'timestamp' | 'retries' | 'status'>): void {
    const queuedAction: QueuedAction = {
      ...action,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      retries: 0,
      status: 'pending',
    };

    this.queue.push(queuedAction);
    this.persist();

    // Try to sync immediately if online
    if (navigator.onLine) {
      this.sync();
    }
  }

  /**
   * Process queue
   */
  async sync(): Promise<void> {
    if (!navigator.onLine || this.queue.length === 0) return;

    const pendingActions = this.queue.filter((a) => a.status === 'pending');

    for (const action of pendingActions) {
      try {
        action.status = 'processing';
        await this.executeAction(action);

        // Remove from queue on success
        this.queue = this.queue.filter((a) => a.id !== action.id);
      } catch (error) {
        console.error('Sync failed for action:', action, error);

        action.retries++;
        action.status = action.retries >= this.maxRetries ? 'failed' : 'pending';

        // Remove if max retries exceeded
        if (action.status === 'failed') {
          this.queue = this.queue.filter((a) => a.id !== action.id);
          this.onActionFailed(action, error);
        }
      }
    }

    this.persist();
  }

  /**
   * Execute a single queued action
   */
  private async executeAction(action: QueuedAction): Promise<void> {
    switch (action.type) {
      case 'CREATE_TASK':
        await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action.payload),
        });
        break;

      case 'UPDATE_TASK':
        await fetch(`/api/tasks/${action.payload.taskId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action.payload.updates),
        });
        break;

      // ... other action types

      default:
        console.warn('Unknown action type:', action.type);
    }
  }

  /**
   * Persist queue to localStorage
   */
  private persist(): void {
    localStorage.setItem('sync-queue', JSON.stringify(this.queue));
  }

  /**
   * Handle online event
   */
  private onOnline(): void {
    console.log('Back online, syncing...');
    this.sync();
  }

  /**
   * Handle offline event
   */
  private onOffline(): void {
    console.log('Offline mode activated');
  }

  /**
   * Handle failed action
   */
  private onActionFailed(action: QueuedAction, error: unknown): void {
    console.error('Action failed permanently:', action, error);
    // Could show toast notification to user
  }
}
```

---

## 7. Implementation Checklist

### 7.1 Phase 1: Permissions (Week 1-2) - CRITICAL

- [ ] Implement `getEffectiveRole()`
- [ ] Implement `getDepartmentHierarchy()`
- [ ] Implement `isInScope()`
- [ ] Implement `checkPermission()` main function
- [ ] Implement task-specific permission checks
- [ ] Create permission middleware
- [ ] Write unit tests for permission logic
- [ ] Integration tests with API routes

### 7.2 Phase 2: Progress Calculation (Week 2)

- [ ] Implement `calculateProjectProgress()`
- [ ] Implement `calculateMultipleProjectsProgress()`
- [ ] Implement `calculateDepartmentProgress()`
- [ ] Add caching for performance
- [ ] Write unit tests
- [ ] Integrate with project dashboard

### 7.3 Phase 3: Task Lifecycle (Week 3)

- [ ] Implement `closeTask()`
- [ ] Implement `reopenTask()`
- [ ] Implement `isTaskOperationAllowed()`
- [ ] Add UI skeleton states
- [ ] Write integration tests
- [ ] E2E tests for task closing flow

### 7.4 Phase 4: History & Notifications (Week 4)

- [ ] Implement `recordActivity()`
- [ ] Implement `generateChangeMessage()`
- [ ] Implement `trackTaskChanges()`
- [ ] Implement notification triggers
- [ ] Implement mention detection
- [ ] Setup cron job for deadline notifications
- [ ] Write tests

### 7.5 Phase 5: Offline Support (Week 5) - OPTIONAL

- [ ] Implement `SyncManager`
- [ ] Implement queue persistence
- [ ] Implement online/offline detection
- [ ] Add offline indicator UI
- [ ] Write tests for sync logic
- [ ] Handle edge cases (conflicts, etc.)

---

**Document Status:** ✅ COMPLETE
**Critical for:** Permission checks, Progress display, Task closing
**Next:** Begin implementation following checklist above
