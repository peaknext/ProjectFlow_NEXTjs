# Permission System Guideline

**Version**: 1.3.0
**Last Updated**: 2025-10-27
**Reference**: `src/lib/permissions.ts`

This document provides comprehensive guidelines for implementing and using the permission system in ProjectFlows. It covers both frontend (UI/UX) and backend (API) implementations.

---

## Table of Contents

- [Overview](#overview)
- [Multi-Layer Security Strategy](#multi-layer-security-strategy)
- [Role Hierarchy](#role-hierarchy)
- [Permission List](#permission-list)
- [Frontend Implementation](#frontend-implementation)
- [Backend Implementation](#backend-implementation)
- [Context-Based Permissions](#context-based-permissions)
- [Special Permission Functions](#special-permission-functions)
- [Common Patterns](#common-patterns)
- [Testing Permissions](#testing-permissions)

---

## Overview

**Permission System Type**: Role-Based Access Control (RBAC) with 6-level hierarchy

**Key Concepts**:
- **Primary Role**: User's main role (ADMIN, CHIEF, LEADER, HEAD, MEMBER, USER)
- **Additional Roles**: User can have additional roles in other departments
- **Scope**: Hierarchical access based on Mission Group → Division → Department
- **Context**: Permissions can be context-specific (e.g., project owner, task assignee)

**Import Statement**:
```typescript
import {
  checkPermission,
  getRolePermissions,
  canUserEditTask,
  canUserEditProject,
  canManageTargetUser,
  getUserAccessibleScope
} from '@/lib/permissions';
```

---

## Multi-Layer Security Strategy

**Philosophy**: Defense in Depth - Multi-layer protection strategy where each layer provides an additional barrier against unauthorized access.

```
┌─────────────────────────────────────────────────────────┐
│  Layer 1: UI/UX (Disabled/Hide)                         │
│  Purpose: User Experience + First Line of Defense       │
│  Security Weight: 30% (UX-focused)                      │
├─────────────────────────────────────────────────────────┤
│  Layer 2: Frontend Function Guards                      │
│  Purpose: Additional Client-side Prevention              │
│  Security Weight: 20% (Nice-to-have)                    │
├─────────────────────────────────────────────────────────┤
│  Layer 3: Backend Validation (THE KING 👑)              │
│  Purpose: Authoritative Security Enforcement            │
│  Security Weight: 50% (Critical - MUST HAVE)            │
└─────────────────────────────────────────────────────────┘
```

### Layer 1: Frontend UI/UX

#### 1.1 Disabled vs Hide Decision Matrix

**When to use each approach:**

| Scenario | Approach | Rationale | Example |
|----------|----------|-----------|---------|
| User should know feature exists | **disabled** | Communicate availability but lack of permission | Delete button (disabled) with tooltip "Requires ADMIN role" |
| User should NOT know feature exists | **hide** | Reduce confusion and prevent social engineering | "User Management" menu hidden for MEMBER role |
| Feature temporarily unavailable | **disabled** | Show it exists but can't be used right now | "Close Task" button disabled when task is already closed |
| Read-only data display | **disabled** | Show data but prevent modification | Input fields in task panel for USER role |

#### 1.2 UI Implementation Patterns

**Pattern 1: Disabled with Feedback**
```typescript
// ✅ GOOD - Disabled with clear tooltip
import { Tooltip } from '@/components/ui/tooltip';

<Tooltip content={getPermissionMessage(task, session)}>
  <Button disabled={!canUserEditTask(task)}>
    ปิดงาน
  </Button>
</Tooltip>

// Helper function
function getPermissionMessage(task, session) {
  if (!session) return 'กรุณาเข้าสู่ระบบ';
  if (task.isClosed) return 'ไม่สามารถแก้ไขงานที่ปิดแล้ว';
  if (!canEditTask(task, session.userId, session.user.role)) {
    return 'คุณไม่มีสิทธิ์แก้ไขงานนี้ (ต้องเป็นผู้สร้างหรือผู้รับผิดชอบ)';
  }
  return '';
}
```

**Pattern 2: Conditional Rendering (Hide)**
```typescript
// ✅ GOOD - Hide completely
{canUserEditTask(task) && (
  <DropdownMenuItem onClick={handleDelete}>
    <Trash2 className="mr-2 h-4 w-4" />
    ลบ
  </DropdownMenuItem>
)}

// ❌ BAD - Shows disabled item without explanation
<DropdownMenuItem disabled={!canUserEditTask(task)}>
  ลบ
</DropdownMenuItem>
```

**Pattern 3: Progressive Disclosure**
```typescript
// Level 1: Hide menu item completely
{hasPermission('view_users') && (
  <MenuItem>บุคลากร</MenuItem>
)}

// Level 2: Show but disable with explanation
{hasPermission('view_users') ? (
  <MenuItem onClick={goToUsers}>บุคลากร</MenuItem>
) : (
  <MenuItem
    disabled
    title="ต้องการสิทธิ์ HEAD ขึ้นไป"
  >
    บุคลากร
  </MenuItem>
)}
```

**Pattern 4: Visual Feedback**
```typescript
<Button
  disabled={!canClose}
  className={cn(
    'transition-opacity',
    !canClose && 'cursor-not-allowed opacity-50'
  )}
  title={
    !canClose
      ? "คุณไม่สามารถปิดงานนี้ได้ (ต้องเป็นผู้สร้างหรือผู้รับผิดชอบ)"
      : "ปิดงาน"
  }
>
  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  ปิดงาน
</Button>
```

#### 1.3 Inline Editor Permissions

**ALL inline editors MUST check permissions:**

```typescript
// Task Name
<TableCell onClick={() => canUserEditTask(task) && startEdit()}>

// Priority
<Select disabled={!canUserEditTask(task)}>

// Status
<Select disabled={!canUserEditTask(task)}>

// Assignee
<AssigneePopover disabled={!canUserEditTask(task)}>

// Due Date
<DateInput disabled={!canUserEditTask(task)}>
```

---

### Layer 2: Frontend Function Guards

**Purpose**: Prevent API calls from reaching the server if permission check fails on client-side.

**When to implement**:
- ✅ Critical actions: Delete, Close, Assign
- ✅ Bulk operations
- ⚠️ Simple updates: Optional (backend already validates)

#### 2.1 Early Return Pattern

```typescript
// ✅ GOOD - Guard clause before API call
const handleCloseTask = async () => {
  // Guard clause - check permission first
  if (!canUserEditTask(task)) {
    toast.error('คุณไม่มีสิทธิ์ปิดงานนี้');

    // Optional: Log security event
    console.warn('[Security] Unauthorized close attempt', {
      userId: session?.userId,
      taskId: task.id,
      taskCreator: task.creatorUserId,
      taskAssignees: task.assigneeUserIds,
    });

    return; // Stop here - do NOT call API
  }

  // Only call API if permission check passes
  try {
    await closeTaskMutation.mutateAsync({
      taskId: task.id,
      closeType
    });
    toast.success('ปิดงานสำเร็จ');
  } catch (error) {
    toast.error('เกิดข้อผิดพลาด: ' + error.message);
  }
};
```

#### 2.2 React Query Mutation with Guard

```typescript
// src/hooks/use-tasks.ts
export function useCloseTask() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, closeType }) => {
      // Get task from cache
      const task = queryClient.getQueryData(['task', taskId]);

      // Guard clause - validate permission
      if (task && !canEditTask(task, session?.userId, session?.user?.role)) {
        throw new Error('คุณไม่มีสิทธิ์ปิดงานนี้');
      }

      // Call API
      return api.post(`/api/tasks/${taskId}/close`, { type: closeType });
    },
    onError: (error) => {
      toast.error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
    },
  });
}
```

#### 2.3 Bulk Operations Guard

```typescript
const handleBulkDelete = async () => {
  const selectedTasksList = Array.from(selectedTasks).map(id =>
    tasks.find(t => t.id === id)
  );

  // Filter tasks - keep only those user can delete
  const deletableTasks = selectedTasksList.filter(task =>
    canUserEditTask(task)
  );

  const undeletableTasks = selectedTasksList.length - deletableTasks.length;

  if (undeletableTasks > 0) {
    toast.warning(
      `ไม่สามารถลบได้ ${undeletableTasks} รายการ (ไม่มีสิทธิ์)`
    );
  }

  if (deletableTasks.length === 0) {
    toast.error('คุณไม่มีสิทธิ์ลบงานที่เลือกไว้');
    return;
  }

  // Proceed with deletion
  if (!confirm(`ต้องการลบงาน ${deletableTasks.length} รายการ?`)) return;

  for (const task of deletableTasks) {
    await deleteTaskMutation.mutateAsync(task.id);
  }
};
```

---

### Layer 3: Backend Validation (THE KING 👑)

**Principle**: Backend is the **Single Source of Truth** for all security decisions.

#### 3.1 Standard API Route Pattern

```typescript
// src/app/api/tasks/[taskId]/close/route.ts
import { withAuth } from '@/lib/api-middleware';
import { canUserCloseTask } from '@/lib/permissions';
import { successResponse, errorResponse } from '@/lib/api-response';

async function handler(
  req: AuthenticatedRequest,
  { params }: { params: { taskId: string } }
) {
  const userId = req.session.userId;
  const { taskId } = params;

  // 1. Fetch resource
  const task = await prisma.task.findUnique({
    where: { id: taskId, deletedAt: null },
  });

  if (!task) {
    return errorResponse('NOT_FOUND', 'Task not found', 404);
  }

  // 2. Check already closed
  if (task.isClosed) {
    return errorResponse(
      'TASK_ALREADY_CLOSED',
      `Task is already closed as ${task.closeType}`,
      400
    );
  }

  // 3. Validate permission (CRITICAL!)
  const canClose = await canUserCloseTask(userId, taskId);

  if (!canClose) {
    // Log security event
    await logSecurityEvent({
      type: 'UNAUTHORIZED_ACCESS_ATTEMPT',
      userId,
      action: 'CLOSE_TASK',
      resource: 'task',
      resourceId: taskId,
      ipAddress: req.headers['x-forwarded-for'] || req.ip,
      userAgent: req.headers['user-agent'],
    });

    return errorResponse(
      'FORBIDDEN',
      'You do not have permission to close this task',
      403
    );
  }

  // 4. Perform action (only after all validations pass)
  const body = await req.json();
  const { type: closeType } = closeTaskSchema.parse(body);

  const closedTask = await prisma.task.update({
    where: { id: taskId },
    data: {
      isClosed: true,
      closeType,
      closeDate: new Date(),
      userClosedId: userId,
    },
  });

  // 5. Log success
  await prisma.history.create({
    data: {
      taskId,
      userId,
      historyText: `${closeType === 'COMPLETED' ? 'ปิดงาน' : 'ยกเลิกงาน'} "${task.name}"`,
    },
  });

  return successResponse({ task: closedTask });
}

export const POST = withAuth(handler);
```

#### 3.2 Security Logging (Recommended)

Create audit trail for security events:

```typescript
// src/lib/security-logger.ts
interface SecurityEvent {
  type: 'UNAUTHORIZED_ACCESS_ATTEMPT' | 'PERMISSION_DENIED' | 'SUSPICIOUS_ACTIVITY';
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export async function logSecurityEvent(event: SecurityEvent) {
  // 1. Log to database
  await prisma.securityLog.create({
    data: {
      ...event,
      timestamp: new Date(),
    },
  });

  // 2. Log to console (for development)
  console.warn('[SECURITY]', {
    type: event.type,
    userId: event.userId,
    action: event.action,
    resource: `${event.resource}:${event.resourceId}`,
  });

  // 3. Send to monitoring service (production)
  // if (process.env.NODE_ENV === 'production') {
  //   await sendToSentry(event);
  //   await sendToDataDog(event);
  // }

  // 4. Alert if critical
  if (event.type === 'SUSPICIOUS_ACTIVITY') {
    // Send alert to admin
    await sendAlertEmail({
      to: 'security@hospital.test',
      subject: 'Security Alert: Suspicious Activity Detected',
      body: JSON.stringify(event, null, 2),
    });
  }
}
```

#### 3.3 Database Schema for Security Logs

```prisma
// prisma/schema.prisma
model SecurityLog {
  id         String   @id @default(cuid())
  type       String   // UNAUTHORIZED_ACCESS_ATTEMPT, etc.
  userId     String
  action     String   // CLOSE_TASK, DELETE_USER, etc.
  resource   String   // task, user, project
  resourceId String
  reason     String?
  ipAddress  String?
  userAgent  String?
  timestamp  DateTime @default(now())

  user User @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([timestamp])
  @@index([type])
  @@map("security_logs")
}
```

---

### Best Practice Checklist

Use this checklist when implementing permission-protected features:

#### **Backend (CRITICAL - MUST HAVE)**
- [ ] ✅ Validate permission using `checkPermission()` or specialized function
- [ ] ✅ Return 403 Forbidden for unauthorized access
- [ ] ✅ Validate resource exists (return 404 if not found)
- [ ] ✅ Validate resource state (e.g., not already closed)
- [ ] ✅ Use `withAuth()` middleware to ensure user is authenticated
- [ ] ⚠️ Log security events for unauthorized attempts (recommended)
- [ ] ⚠️ Add rate limiting for sensitive endpoints (optional)

#### **Frontend UI (HIGH PRIORITY - SHOULD HAVE)**
- [ ] ✅ Hide OR disable UI elements based on permission
- [ ] ✅ Show clear feedback (tooltip, message) explaining why action is disabled
- [ ] ✅ Use consistent disabled/hidden pattern across the app
- [ ] ✅ Disable inline editors for unauthorized tasks
- [ ] ✅ Use visual indicators (opacity, cursor) for disabled state
- [ ] ⚠️ Show alternative actions when primary action is disabled (optional)

#### **Frontend Function (MEDIUM PRIORITY - NICE TO HAVE)**
- [ ] ⚠️ Add guard clause for critical actions (Delete, Close, Assign)
- [ ] ⚠️ Show toast error message when guard fails
- [ ] ⚠️ Log to console for debugging (optional)
- [ ] ❌ Skip for simple updates (backend validates anyway)

---

### Priority Matrix

| Layer | Security Impact | UX Impact | Maintenance Cost | Verdict |
|-------|----------------|-----------|------------------|---------|
| **Backend Validation** | 🔴 Critical (100%) | N/A | ⭐⭐⭐⭐⭐ Easy | **MUST HAVE** |
| **Frontend UI** | 🟡 Medium (30%) | 🟢 High | ⭐⭐⭐⭐ Easy | **SHOULD HAVE** |
| **Frontend Function** | 🔵 Low (20%) | 🟡 Medium | ⭐⭐⭐ Medium | **NICE TO HAVE** |

**Recommended Approach**:
1. Start with **Backend + UI** (provides 80% of value)
2. Add **Frontend Guards** only for critical actions (Delete, Close, Bulk Ops)
3. Don't over-engineer - balance security with maintainability

---

### Trade-offs Analysis

#### **Option A: Backend Only**
**Pros**: Simple, easy to maintain, 100% secure
**Cons**: Poor UX (users can attempt actions that will fail)
**Verdict**: ❌ Not recommended (poor UX)

#### **Option B: Backend + UI (RECOMMENDED)**
**Pros**: Good UX, secure, maintainable
**Cons**: Requires UI updates when permissions change
**Verdict**: ✅ **Best balance** for most features

#### **Option C: Backend + UI + Function Guards**
**Pros**: Maximum protection, best UX
**Cons**: More code to maintain, potential redundancy
**Verdict**: ⚠️ Use for critical features only

---

### Implementation Strategy for New Features

**Step 1: Plan Permission Requirements**
```markdown
Feature: Close Task
Permissions Required:
- Role: MEMBER (close_own_tasks), HEAD+ (close_tasks)
- Context: Must be creator OR assignee (for MEMBER)
- State: Task must not be already closed
```

**Step 2: Implement Backend First (THE KING)**
```typescript
// 1. Add permission check
const canClose = await canUserCloseTask(userId, taskId);
if (!canClose) return errorResponse('FORBIDDEN', ..., 403);

// 2. Validate state
if (task.isClosed) return errorResponse('ALREADY_CLOSED', ..., 400);

// 3. Perform action
await prisma.task.update({ ... });
```

**Step 3: Add Frontend UI Protection**
```typescript
// 1. Check permission
const canClose = canUserEditTask(task);

// 2. Disable/Hide UI
<Button disabled={!canClose} title={getReasonMessage()}>
  ปิดงาน
</Button>
```

**Step 4: (Optional) Add Frontend Function Guard**
```typescript
// Only for critical actions
const handleClose = () => {
  if (!canUserEditTask(task)) {
    toast.error('ไม่มีสิทธิ์');
    return;
  }
  // Proceed with API call
};
```

---

## Role Hierarchy

### 1. ADMIN (ผู้ดูแลระบบ)
**Permission Count**: All (*)
**Scope**: Entire organization
**Special Rules**:
- Can view all users (including other admins)
- Cannot edit/delete other admin users
- Can manage all projects and tasks
- Can access all reports

### 2. CHIEF (ผู้บริหารระดับสูง)
**Permission Count**: 14 permissions
**Scope**: Mission Group level
**Permissions**:
- `view_projects`, `create_projects`, `edit_projects`, `delete_projects`
- `view_tasks`, `create_tasks`, `edit_tasks`, `delete_tasks`, `close_tasks`
- `view_users`, `create_users`, `edit_users`, `delete_users`
- `view_reports`, `manage_departments`, `manage_statuses`, `view_all_projects`

**Access Scope**:
- Can manage all departments in their Mission Group
- Can manage users in their Mission Group (except other CHIEFs/ADMINs)

### 3. LEADER (หัวหน้ากลุ่มงาน)
**Permission Count**: 10 permissions
**Scope**: Division level
**Permissions**:
- `view_projects`, `create_projects`, `edit_projects`
- `view_tasks`, `create_tasks`, `edit_tasks`, `close_tasks`
- `view_users`, `view_reports`, `manage_statuses`

**Access Scope**:
- Can manage all departments in their Division
- Can manage users in their Division (except CHIEFs/ADMINs)

### 4. HEAD (หัวหน้าหน่วยงาน)
**Permission Count**: 7 permissions
**Scope**: Department level
**Permissions**:
- `view_projects`, `create_projects`, `edit_projects`
- `view_tasks`, `create_tasks`, `edit_tasks`, `close_tasks`
- `view_reports`

**Access Scope**:
- Can manage their own Department only
- Can manage users in their Department (except CHIEFs/LEADERs/ADMINs)

### 5. MEMBER (สมาชิก)
**Permission Count**: 5 permissions
**Scope**: Department level (limited)
**Permissions**:
- `view_projects`, `view_tasks`, `create_tasks`
- `edit_own_tasks`, `close_own_tasks`

**Special Rules**:
- Can only edit/close tasks they created or are assigned to
- Cannot manage other users
- Cannot create projects

### 6. USER (ผู้ใช้ทั่วไป)
**Permission Count**: 2 permissions
**Scope**: View-only
**Permissions**:
- `view_projects`, `view_tasks`

**Special Rules**:
- Read-only access
- Cannot create, edit, or delete anything
- Can view projects they're involved in

---

## Permission List

### Project Permissions

| Permission | Description | Roles | Frontend | Backend |
|------------|-------------|-------|----------|---------|
| `view_projects` | View project details | ALL | Hide project cards/links if false | Filter projects in API |
| `create_projects` | Create new projects | ADMIN, CHIEF, LEADER, HEAD | Hide "New Project" button | Reject POST request |
| `edit_projects` | Edit project info | ADMIN, CHIEF, LEADER, HEAD | Disable edit fields | Reject PATCH request |
| `delete_projects` | Delete projects | ADMIN, CHIEF | Hide delete button | Reject DELETE request |
| `view_all_projects` | View all org projects | ADMIN, CHIEF | Show org-wide filter | Return all projects |

### Task Permissions

| Permission | Description | Roles | Frontend | Backend |
|------------|-------------|-------|----------|---------|
| `view_tasks` | View task details | ALL | Hide task cards if false | Filter tasks in API |
| `create_tasks` | Create new tasks | ADMIN, CHIEF, LEADER, HEAD, MEMBER | Hide "New Task" button | Reject POST request |
| `edit_tasks` | Edit all tasks | ADMIN, CHIEF, LEADER, HEAD | Enable task editing | Allow PATCH request |
| `edit_own_tasks` | Edit own tasks only | MEMBER | Enable if creator/assignee | Check ownership |
| `delete_tasks` | Delete tasks | ADMIN, CHIEF, LEADER, HEAD | Hide delete button | Reject DELETE request with scope check |
| `delete_own_tasks` | Delete own tasks only | MEMBER | Show delete button if creator/assignee | Check ownership |
| `close_tasks` | Close all tasks | ADMIN, CHIEF, LEADER, HEAD | Show close button | Allow close request |
| `close_own_tasks` | Close own tasks only | MEMBER | Show if creator/assignee | Check ownership |

### User Management Permissions

| Permission | Description | Roles | Frontend | Backend |
|------------|-------------|-------|----------|---------|
| `view_users` | View user list | ADMIN, CHIEF, LEADER | Show users page | Return user list |
| `create_users` | Create new users | ADMIN, CHIEF | Show "Add User" button | Allow POST request |
| `edit_users` | Edit user info | ADMIN, CHIEF | Show edit button | Allow PATCH request |
| `delete_users` | Delete users | ADMIN, CHIEF | Show delete button | Allow DELETE request |

### System Permissions

| Permission | Description | Roles | Frontend | Backend |
|------------|-------------|-------|----------|---------|
| `view_reports` | View reports | ADMIN, CHIEF, LEADER, HEAD | Show reports menu | Return report data |
| `manage_departments` | Manage departments | ADMIN, CHIEF | Show dept settings | Allow dept CRUD |
| `manage_statuses` | Manage workflows | ADMIN, CHIEF, LEADER | Show status editor | Allow status CRUD |

---

## Frontend Implementation

### 1. Component-Level Permission Checks

**Pattern**: Check permissions before rendering UI elements

```typescript
import { useAuth } from '@/hooks/use-auth';

export function ProjectToolbar() {
  const { user } = useAuth();
  const permissions = user?.permissions || [];

  const canCreateProject = permissions.includes('create_projects');
  const canEditProject = permissions.includes('edit_projects');
  const canDeleteProject = permissions.includes('delete_projects');

  return (
    <div className="toolbar">
      {canCreateProject && (
        <Button onClick={handleCreate}>New Project</Button>
      )}
      {canEditProject && (
        <Button onClick={handleEdit}>Edit</Button>
      )}
      {canDeleteProject && (
        <Button onClick={handleDelete}>Delete</Button>
      )}
    </div>
  );
}
```

### 2. Route-Level Protection

**Pattern**: Redirect unauthorized users

```typescript
'use client';

import { useAuth } from '@/hooks/use-auth';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function UsersPage() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const canViewUsers = user.permissions?.includes('view_users');
    if (!canViewUsers) {
      redirect('/dashboard');
    }
  }, [user]);

  return <UsersView />;
}
```

### 3. Conditional Menu Items

**Pattern**: Hide menu items based on permissions

```typescript
export function Sidebar() {
  const { user } = useAuth();
  const permissions = user?.permissions || [];

  const menuItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      show: true,
    },
    {
      label: 'Projects',
      href: '/projects',
      show: permissions.includes('view_projects'),
    },
    {
      label: 'Users',
      href: '/users',
      show: permissions.includes('view_users'),
    },
    {
      label: 'Reports',
      href: '/reports',
      show: permissions.includes('view_reports'),
    },
  ].filter(item => item.show);

  return (
    <nav>
      {menuItems.map(item => (
        <Link key={item.href} href={item.href}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
```

### 4. Form Field Disabling

**Pattern**: Disable fields based on permissions

```typescript
export function TaskForm({ taskId }: { taskId?: string }) {
  const { user } = useAuth();
  const { data: task } = useTask(taskId);

  const canEdit = useMemo(() => {
    if (!user || !task) return false;

    // Admin/Chief/Leader/Head can edit all tasks
    if (['ADMIN', 'CHIEF', 'LEADER', 'HEAD'].includes(user.role)) {
      return true;
    }

    // Member can edit own tasks
    if (user.role === 'MEMBER') {
      return task.creatorUserId === user.id ||
             task.assigneeUserIds?.includes(user.id);
    }

    return false;
  }, [user, task]);

  return (
    <form>
      <Input
        name="name"
        defaultValue={task?.name}
        disabled={!canEdit}
      />
      <Select
        name="priority"
        disabled={!canEdit}
      >
        {/* options */}
      </Select>
    </form>
  );
}
```

### 5. Action Button States

**Pattern**: Show/hide/disable action buttons

```typescript
export function TaskCard({ task }: { task: Task }) {
  const { user } = useAuth();
  const closeTaskMutation = useCloseTask(task.projectId);

  const canClose = useMemo(() => {
    if (!user) return false;

    // High-level roles can close all tasks
    if (['ADMIN', 'CHIEF', 'LEADER', 'HEAD'].includes(user.role)) {
      return true;
    }

    // Member can close own tasks
    if (user.role === 'MEMBER') {
      return task.creatorUserId === user.id ||
             task.assigneeUserIds?.includes(user.id);
    }

    return false;
  }, [user, task]);

  return (
    <Card>
      <CardContent>{task.name}</CardContent>
      <CardFooter>
        {canClose && !task.isClosed && (
          <Button
            onClick={() => closeTaskMutation.mutate({
              taskId: task.id,
              type: 'COMPLETED'
            })}
          >
            Close Task
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
```

---

## Backend Implementation

### 1. API Route Protection

**Pattern**: Use `checkPermission()` at route level

```typescript
import { withAuth } from '@/lib/api-middleware';
import { checkPermission } from '@/lib/permissions';
import { successResponse, errorResponse } from '@/lib/api-response';

async function handler(req: AuthenticatedRequest) {
  const userId = req.session.userId;

  // Check permission
  const hasPermission = await checkPermission(userId, 'create_projects');

  if (!hasPermission) {
    return errorResponse('FORBIDDEN', 'Insufficient permissions', 403);
  }

  // Proceed with operation
  const project = await prisma.project.create({
    data: {
      ...req.body,
      ownerUserId: userId,
    },
  });

  return successResponse({ project });
}

export const POST = withAuth(handler);
```

### 2. Context-Based Permission Checks

**Pattern**: Check permission with context (projectId, taskId, etc.)

```typescript
async function updateTaskHandler(
  req: AuthenticatedRequest,
  { params }: { params: { taskId: string } }
) {
  const userId = req.session.userId;
  const { taskId } = params;

  // Check if user can edit this specific task
  const canEdit = await canUserEditTask(userId, taskId);

  if (!canEdit) {
    return errorResponse('FORBIDDEN', 'Cannot edit this task', 403);
  }

  // Update task
  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data: await req.json(),
  });

  return successResponse({ task: updatedTask });
}

export const PATCH = withAuth(updateTaskHandler);
```

### 3. Scope-Based Filtering

**Pattern**: Filter data based on user's accessible scope

```typescript
async function handler(req: AuthenticatedRequest) {
  const userId = req.session.userId;

  // Get user's accessible scope
  const scope = await getUserAccessibleScope(userId);

  // Filter projects based on scope
  const projects = await prisma.project.findMany({
    where: {
      departmentId: { in: scope.departmentIds },
      dateDeleted: null,
    },
    include: {
      department: true,
      owner: {
        select: { id: true, fullName: true },
      },
    },
  });

  return successResponse({ projects });
}

export const GET = withAuth(handler);
```

### 4. User Management Permissions

**Pattern**: Use `canManageTargetUser()` for user operations

```typescript
async function updateUserHandler(
  req: AuthenticatedRequest,
  { params }: { params: { userId: string } }
) {
  const currentUserId = req.session.userId;
  const { userId: targetUserId } = params;

  // Check if current user can manage target user
  const canManage = await canManageTargetUser(currentUserId, targetUserId);

  if (!canManage) {
    return errorResponse(
      'FORBIDDEN',
      'Cannot manage this user',
      403
    );
  }

  // Proceed with update
  const updatedUser = await prisma.user.update({
    where: { id: targetUserId },
    data: await req.json(),
  });

  return successResponse({ user: updatedUser });
}

export const PATCH = withAuth(updateUserHandler);
```

### 5. Project Owner Override

**Pattern**: Allow project owner full access regardless of role

```typescript
async function editProjectHandler(
  req: AuthenticatedRequest,
  { params }: { params: { projectId: string } }
) {
  const userId = req.session.userId;
  const { projectId } = params;

  // Get project
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerUserId: true, departmentId: true },
  });

  if (!project) {
    return errorResponse('NOT_FOUND', 'Project not found', 404);
  }

  // Check permission (owner or role-based)
  const canEdit =
    project.ownerUserId === userId || // Owner override
    await canUserEditProject(userId, projectId); // Role-based

  if (!canEdit) {
    return errorResponse('FORBIDDEN', 'Cannot edit this project', 403);
  }

  // Update project
  const updated = await prisma.project.update({
    where: { id: projectId },
    data: await req.json(),
  });

  return successResponse({ project: updated });
}

export const PATCH = withAuth(editProjectHandler);
```

---

## Context-Based Permissions

### Task Ownership Context

**Rule**: MEMBER can only edit/close tasks they created or are assigned to

**Backend Check**:
```typescript
// In checkPermission() function
if (permission === 'edit_own_tasks' && context.taskId) {
  const task = await prisma.task.findUnique({
    where: { id: context.taskId },
    select: {
      creatorUserId: true,
      assigneeUserIds: true // Multi-assignee support
    },
  });

  if (!task) return false;

  // User can edit if they created or are assigned
  return task.creatorUserId === userId ||
         task.assigneeUserIds?.includes(userId);
}
```

**Frontend Check**:
```typescript
const canEditTask = useMemo(() => {
  if (!user || !task) return false;

  // High-level roles can edit all
  if (['ADMIN', 'CHIEF', 'LEADER', 'HEAD'].includes(user.role)) {
    return true;
  }

  // Member can edit own tasks
  if (user.role === 'MEMBER') {
    return task.creatorUserId === user.id ||
           task.assigneeUserIds?.includes(user.id);
  }

  return false;
}, [user, task]);
```

### Project Ownership Context

**Rule**: Project owner has full edit access regardless of role

**Backend Check**:
```typescript
const project = await prisma.project.findUnique({
  where: { id: projectId },
  select: { ownerUserId: true, departmentId: true },
});

// Owner always has access
if (project.ownerUserId === userId) {
  return true;
}

// Otherwise check role-based permission
return checkPermission(userId, 'edit_projects', {
  departmentId: project.departmentId
});
```

### Department Scope Context

**Rule**: Users can only access resources in their scope (MG/Div/Dept)

**Backend Check**:
```typescript
// Get user's accessible departments
const scope = await getUserAccessibleScope(userId);

// Filter resources
const resources = await prisma.resource.findMany({
  where: {
    departmentId: { in: scope.departmentIds }
  }
});
```

---

## Special Permission Functions

### 1. `getUserAccessibleScope(userId)`

**Purpose**: Get all Mission Groups, Divisions, and Departments accessible to user

**Returns**:
```typescript
{
  isAdmin: boolean;
  missionGroupIds: string[];
  divisionIds: string[];
  departmentIds: string[];
}
```

**Usage**:
```typescript
const scope = await getUserAccessibleScope(userId);

// Use in queries
const projects = await prisma.project.findMany({
  where: {
    departmentId: { in: scope.departmentIds }
  }
});
```

**Frontend Usage**:
```typescript
// In Reports page - filter departments
const { data: scope } = useQuery({
  queryKey: ['user-scope'],
  queryFn: () => api.get('/api/user/scope')
});

// Only show departments in scope
const departments = allDepartments.filter(d =>
  scope.departmentIds.includes(d.id)
);
```

### 2. `canManageTargetUser(currentUserId, targetUserId)`

**Purpose**: Check if current user can manage (edit/delete) target user

**Rules**:
- ADMIN can manage all non-ADMIN users
- CHIEF can manage users in their Mission Group
- LEADER can manage users in their Division
- HEAD can manage users in their Department
- Cannot manage self
- Cannot manage users with higher role

**Usage**:
```typescript
// In user edit API
const canManage = await canManageTargetUser(
  req.session.userId,
  targetUserId
);

if (!canManage) {
  return errorResponse('FORBIDDEN', 'Cannot manage this user', 403);
}
```

### 3. `canUserEditTask(userId, taskId)`

**Purpose**: Comprehensive task edit permission check

**Logic**:
- High-level roles (ADMIN/CHIEF/LEADER/HEAD): Can edit all tasks
- MEMBER: Can edit tasks they created or are assigned to
- USER: Cannot edit

**Usage**:
```typescript
const canEdit = await canUserEditTask(userId, taskId);
if (!canEdit) {
  return errorResponse('FORBIDDEN', 'Cannot edit task', 403);
}
```

### 4. `canUserEditProject(userId, projectId)`

**Purpose**: Comprehensive project edit permission check

**Logic**:
- Project owner: Always can edit
- ADMIN: Can edit all projects
- CHIEF: Can edit projects in their Mission Group
- LEADER: Can edit projects in their Division
- HEAD: Can edit projects in their Department
- MEMBER/USER: Cannot edit (unless owner)

**Usage**:
```typescript
const canEdit = await canUserEditProject(userId, projectId);
if (!canEdit) {
  return errorResponse('FORBIDDEN', 'Cannot edit project', 403);
}
```

### 5. `isUserInManagementScope(managerId, targetUserId)`

**Purpose**: Check if target user is within manager's scope

**Usage**: Internal helper for `canManageTargetUser()`

---

## Common Patterns

### Pattern 1: Hide UI Element If No Permission

```typescript
{permissions.includes('create_projects') && (
  <Button onClick={handleCreate}>New Project</Button>
)}
```

### Pattern 2: Disable Field If No Permission

```typescript
<Input
  disabled={!permissions.includes('edit_projects')}
/>
```

### Pattern 3: Redirect If No Permission

```typescript
useEffect(() => {
  if (user && !user.permissions?.includes('view_users')) {
    redirect('/dashboard');
  }
}, [user]);
```

### Pattern 4: Filter Data By Scope

```typescript
// Backend
const scope = await getUserAccessibleScope(userId);
const projects = await prisma.project.findMany({
  where: { departmentId: { in: scope.departmentIds } }
});
```

### Pattern 5: Owner Override

```typescript
const canEdit =
  resource.ownerUserId === userId ||
  await checkPermission(userId, 'edit_resource');
```

### Pattern 6: Multi-Level Permission Check

```typescript
// Check general permission first
if (!permissions.includes('edit_tasks')) {
  return false;
}

// Then check specific context
const task = await getTask(taskId);
return task.assigneeUserIds.includes(userId);
```

---

## Important Security Notes

### Critical Permission Checks

**⚠️ SECURITY ALERT**: Always implement context-based permission checks for `*_own_*` permissions.

**Bug Fixed (2025-10-26)**: MEMBER users could close other people's tasks due to missing context check in `checkPermission()`.

**Affected Permissions**:
- `edit_own_tasks` - MEMBER can only edit tasks they created or are assigned to
- `close_own_tasks` - MEMBER can only close tasks they created or are assigned to

**Implementation**:
```typescript
// ✅ CORRECT - Backend implementation in checkPermission()
if (permission === 'close_own_tasks' && context.taskId) {
  const task = await prisma.task.findUnique({
    where: { id: context.taskId },
    select: {
      creatorUserId: true,
      assigneeUserId: true,
      assignees: { select: { userId: true } }
    },
  });

  if (!task) return false;

  // Check if user is creator or assignee (support multi-assignee)
  const isAssignee = task.assigneeUserId === userId ||
                     task.assignees.some(a => a.userId === userId);

  return task.creatorUserId === userId || isAssignee;
}
```

### Permission Verification Checklist

When implementing any permission-protected feature:

1. ✅ **Frontend Check**: Hide/disable UI elements based on permissions
   ```typescript
   const permissions = useTaskPermissions(task);
   if (!permissions.canClose) return null; // Don't show button
   ```

2. ✅ **Backend Check**: ALWAYS verify permissions in API route
   ```typescript
   const canClose = await canUserCloseTask(req.session.userId, taskId);
   if (!canClose) return errorResponse('FORBIDDEN', 'No permission', 403);
   ```

3. ✅ **Context Validation**: For `*_own_*` permissions, check ownership
   ```typescript
   // Must check if user is creator OR assignee
   const isOwner = task.creatorUserId === userId || isAssignee;
   ```

4. ✅ **Multi-Assignee Support**: Check both legacy and new assignee fields
   ```typescript
   const isAssignee = task.assigneeUserId === userId ||
                      task.assignees.some(a => a.userId === userId);
   ```

### Common Security Pitfalls

❌ **DON'T**: Rely only on frontend permission checks
```typescript
// BAD - User can bypass this via API
if (permissions.canClose) {
  await closeTask(taskId); // No backend validation!
}
```

❌ **DON'T**: Forget to check context for `*_own_*` permissions
```typescript
// BAD - MEMBER would be able to edit ANY task
if (permissions.includes('edit_own_tasks')) {
  return true; // Missing ownership check!
}
```

❌ **DON'T**: Use only `assigneeUserId` (legacy field)
```typescript
// BAD - Misses multi-assignee support
const isAssignee = task.assigneeUserId === userId;
```

✅ **DO**: Always validate on both frontend and backend
```typescript
// GOOD - Defense in depth
// Frontend:
if (!permissions.canClose) return null;

// Backend:
const canClose = await canUserCloseTask(userId, taskId);
if (!canClose) return errorResponse('FORBIDDEN', ...);
```

### Testing Security Fixes

After implementing permission checks, use the test script:

```bash
node test-close-task-permission.js
```

This tests:
- MEMBER can close own task (creator) ✅
- MEMBER can close assigned task ✅
- MEMBER CANNOT close other's task ❌ (should return 403)
- HEAD can close any task in department ✅

---

## Testing Permissions

### Frontend Testing

**Test Users**:
- `admin@hospital.test` - ADMIN role
- `chief@hospital.test` - CHIEF role
- `leader@hospital.test` - LEADER role
- `head@hospital.test` - HEAD role
- `member@hospital.test` - MEMBER role

**Test Cases**:
1. Login as each role
2. Check visible menu items
3. Check visible buttons
4. Check disabled fields
5. Attempt unauthorized actions

### Backend Testing

**Test Script Example**:
```bash
# Test as MEMBER - should fail
curl -X DELETE http://localhost:3010/api/projects/proj001 \
  -H "Authorization: Bearer {member_token}"

# Test as CHIEF - should succeed
curl -X DELETE http://localhost:3010/api/projects/proj001 \
  -H "Authorization: Bearer {chief_token}"
```

**Test Cases**:
1. Test each endpoint with each role
2. Test context-based permissions (owner, assignee)
3. Test scope boundaries (MG/Div/Dept)
4. Test additional roles
5. Test self-management prevention

---

## Quick Reference

### Permission Hierarchy (Most → Least Privileged)

```
ADMIN (*)
  ↓
CHIEF (14 permissions)
  ↓
LEADER (10 permissions)
  ↓
HEAD (7 permissions)
  ↓
MEMBER (5 permissions)
  ↓
USER (2 permissions)
```

### Scope Hierarchy (Widest → Narrowest)

```
ADMIN → Entire Organization
  ↓
CHIEF → Mission Group
  ↓
LEADER → Division
  ↓
HEAD → Department
  ↓
MEMBER/USER → Own Department (limited)
```

### Key Functions Quick Reference

| Function | Purpose | Returns |
|----------|---------|---------|
| `getRolePermissions(role)` | Get all permissions for role | `string[]` |
| `checkPermission(userId, permission, context?)` | Check single permission | `boolean` |
| `getUserAccessibleScope(userId)` | Get accessible MG/Div/Dept IDs | `AccessibleScope` |
| `canManageTargetUser(managerId, targetId)` | Check user management permission | `boolean` |
| `canUserEditTask(userId, taskId)` | Check task edit permission | `boolean` |
| `canUserEditProject(userId, projectId)` | Check project edit permission | `boolean` |

---

## Version History

- **1.3.0** (2025-10-27): Task Owner Delete Permission
  - Added `delete_own_tasks` permission to MEMBER role
  - Task creators and assignees can now delete their own tasks
  - Updated `canUserDeleteTask` function to check role-specific permissions
  - Updated permission matrix table

- **1.2.0** (2025-10-27): Delete Task Permission Fix
  - Added `delete_tasks` permission to LEADER and HEAD roles
  - Added scope verification for delete_tasks (checks division/department access)
  - Updated permission matrix table

- **1.1.0** (2025-10-26): Multi-Layer Security Strategy
  - Added Defense in Depth philosophy
  - Added comprehensive frontend/backend patterns
  - Added context-based permission examples

- **1.0.0** (2025-10-26): Initial documentation
  - Complete permission list
  - Frontend/Backend implementation guides
  - Context-based permissions
  - Special functions
  - Testing guidelines
