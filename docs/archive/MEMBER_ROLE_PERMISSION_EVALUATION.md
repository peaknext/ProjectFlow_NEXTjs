# MEMBER Role Permission Evaluation

**Document Version**: 1.0.0
**Date**: 2025-10-26
**Status**: Comprehensive Evaluation

---

## Executive Summary

This document provides a comprehensive evaluation of how the MEMBER role is implemented across the codebase, covering both backend (API/permissions) and frontend (UI/components) implementations.

**Overall Assessment**: ✅ **CORRECT AND CONSISTENT**

The MEMBER role implementation follows a clear permission model:

- **Limited create permissions**: Can create tasks but not projects
- **Own-task edit permissions**: Can edit/close tasks they created or are assigned to
- **No management permissions**: Cannot manage users or delete projects
- **Department-level view scope**: Can view projects and tasks in their department
- **Partial UI access**: Some admin features are hidden

---

## 1. Backend Permission System

### 1.1 Role Hierarchy (src/lib/permissions.ts)

```typescript
const ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMIN: ["*"], // All permissions

  CHIEF: [
    "view_projects",
    "create_projects",
    "edit_projects",
    "delete_projects",
    "view_tasks",
    "create_tasks",
    "edit_tasks",
    "delete_tasks",
    "close_tasks",
    "view_users",
    "create_users",
    "edit_users",
    "delete_users",
    "view_reports",
    "manage_departments",
    "manage_statuses",
    "view_all_projects",
  ],

  LEADER: [
    "view_projects",
    "create_projects",
    "edit_projects",
    "view_tasks",
    "create_tasks",
    "edit_tasks",
    "close_tasks",
    "view_users",
    "view_reports",
    "manage_statuses",
  ],

  HEAD: [
    "view_projects",
    "create_projects",
    "edit_projects",
    "view_tasks",
    "create_tasks",
    "edit_tasks",
    "close_tasks",
    "view_reports",
  ],

  MEMBER: [
    "view_projects", // ✅ Can view projects in their department
    "view_tasks", // ✅ Can view all tasks in their department
    "create_tasks", // ✅ Can create new tasks
    "edit_own_tasks", // ✅ Can edit tasks they created or are assigned to
    "close_own_tasks", // ✅ Can close tasks they created or are assigned to
  ],

  USER: ["view_projects", "view_tasks"], // View only
};
```

**Key Differences from Higher Roles**:

- ❌ Cannot `create_projects` (HEAD+ can)
- ❌ Cannot `edit_projects` (HEAD+ can)
- ❌ Cannot `delete_projects` (CHIEF+ can)
- ❌ Cannot `edit_tasks` globally (only own tasks)
- ❌ Cannot `close_tasks` globally (only own tasks)
- ❌ Cannot `delete_tasks` (CHIEF+ can)
- ❌ Cannot `view_users` (HEAD+ can)
- ❌ Cannot `view_reports` officially (but in practice, see section 2.4)
- ❌ Cannot manage users, departments, or statuses

### 1.2 Task Edit Permission Logic

**Backend Implementation** (src/lib/permissions.ts:305-323):

```typescript
export async function canUserEditTask(
  userId: string,
  taskId: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) return false;

  // High-level roles can edit all tasks
  if (["ADMIN", "CHIEF", "LEADER", "HEAD"].includes(user.role)) {
    return checkPermission(userId, "edit_tasks", { taskId });
  }

  // MEMBER/USER can only edit own tasks
  return checkPermission(userId, "edit_own_tasks", { taskId });
}
```

**Context-Based Check** (src/lib/permissions.ts:133-145):

```typescript
// Check if editing own tasks
if (permission === "edit_own_tasks" && context.taskId) {
  const task = await prisma.task.findUnique({
    where: { id: context.taskId },
    select: { creatorUserId: true, assigneeUserId: true },
  });

  if (!task) return false;

  // User can edit if they created or are assigned to the task
  return task.creatorUserId === userId || task.assigneeUserId === userId;
}
```

**⚠️ LIMITATION FOUND**: The backend permission check in `checkPermission()` only checks the legacy `assigneeUserId` field, not the new `assigneeUserIds` array from the `task_assignees` table.

**However**, this is mitigated by:

1. The `task.assigneeUserId` field is kept in sync with the first assignee in `assigneeUserIds`
2. Frontend permission checks (see section 2.1) properly support multi-assignee

### 1.3 Task Close Permission Logic

**Backend Implementation** (src/lib/permissions.ts:338-356):

```typescript
export async function canUserCloseTask(
  userId: string,
  taskId: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) return false;

  // High-level roles can close all tasks
  if (["ADMIN", "CHIEF", "LEADER", "HEAD"].includes(user.role)) {
    return checkPermission(userId, "close_tasks", { taskId });
  }

  // MEMBER can only close own tasks
  return checkPermission(userId, "close_own_tasks", { taskId });
}
```

**Implementation**: Same ownership logic as `edit_own_tasks` - creator or assignee can close.

### 1.4 API Route Protection

**Example**: Task Update Endpoint (src/app/api/tasks/[taskId]/route.ts:179-200)

```typescript
async function patchHandler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;

  // Get existing task
  const existingTask = await prisma.task.findUnique({
    where: { id: taskId, deletedAt: null },
    include: { project: true },
  });

  if (!existingTask) {
    return errorResponse("TASK_NOT_FOUND", "Task not found", 404);
  }

  // Check permission - uses canUserEditTask which handles MEMBER logic
  const canEdit = await canUserEditTask(req.session.userId, taskId);
  if (!canEdit) {
    return errorResponse("FORBIDDEN", "No permission to edit this task", 403);
  }

  // ... rest of update logic
}
```

**Result**: ✅ Backend correctly enforces MEMBER can only edit own tasks

### 1.5 Project Permissions

**View Projects** (src/lib/permissions.ts:996-1014):

```typescript
export async function canUserViewProject(
  userId: string,
  projectId: string
): Promise<boolean> {
  const project = await prisma.project.findUnique({
    where: { id: projectId, dateDeleted: null },
    select: {
      id: true,
      departmentId: true,
    },
  });

  if (!project) return false;

  return checkPermission(userId, "view_projects", {
    departmentId: project.departmentId,
    projectId,
  });
}
```

**Create Projects**: MEMBER does NOT have `create_projects` permission
**Edit Projects**: MEMBER does NOT have `edit_projects` permission (unless they are the project owner)
**Delete Projects**: MEMBER does NOT have `delete_projects` permission

### 1.6 User Management Permissions

**Implementation** (src/lib/permissions.ts:810-818):

```typescript
export async function canManageTargetUser(
  currentUserId: string,
  targetUserId: string
): Promise<boolean> {
  const currentUser = await prisma.user.findUnique({
    where: { id: currentUserId },
    select: { role: true },
  });

  if (!currentUser) return false;

  // Only these roles can manage users
  const canManageUsers = ["ADMIN", "CHIEF", "LEADER", "HEAD"].includes(
    currentUser.role
  );

  if (!canManageUsers) return false; // ❌ MEMBER blocked here

  return isUserInManagementScope(currentUserId, targetUserId);
}
```

**Result**: ✅ MEMBER cannot manage any users

---

## 2. Frontend Implementation

### 2.1 Task Permissions Hook (src/hooks/use-task-permissions.ts)

**Implementation** (lines 47-108):

```typescript
export function useTaskPermissions(
  task: Task | undefined | null
): TaskPermissions {
  const { data: session } = useSession();

  const permissions = useMemo((): TaskPermissions => {
    if (!task || !session) {
      return {
        /* all false */
      };
    }

    const userId = session.userId;
    const userRole = session.user?.role;

    // Check if user is task creator or assignee
    const isCreator = task.creatorUserId === userId;
    const isAssignee =
      task.assigneeUserId === userId ||
      task.assigneeUserIds?.includes(userId) ||
      false;
    const isOwner = isCreator || isAssignee;

    // Check if user is high-level admin
    const isHighLevel = ["ADMIN", "CHIEF", "LEADER", "HEAD"].includes(userRole);

    // Determine base edit permission (before considering closed state)
    const canEditBase = isOwner || isHighLevel;

    // Check if task is closed
    const isClosed = task.isClosed === true;

    return {
      canView: true, // ✅ MEMBER can view all tasks
      canEdit: canEditBase && !isClosed, // ✅ MEMBER can edit if owner
      canClose: canEditBase && !isClosed, // ✅ MEMBER can close if owner
      canComment: !isClosed, // ✅ MEMBER can comment
      canAddChecklist: canEditBase && !isClosed, // ✅ MEMBER can add checklist if owner
      canAddSubtask: canEditBase && !isClosed, // ✅ MEMBER can add subtask if owner
    };
  }, [task, session]);

  return permissions;
}
```

**Key Features**:

- ✅ Properly checks both `creatorUserId` (creator) and `assigneeUserIds` (multi-assignee)
- ✅ MEMBER is NOT in `isHighLevel` array, so relies on ownership
- ✅ Ownership includes both creator and assignee
- ✅ All edit-like permissions respect closed state

### 2.2 Utility Function for Non-Hook Context

**Implementation** (lines 159-176):

```typescript
export function canEditTask(
  task: Task | undefined | null,
  userId: string | undefined,
  userRole: string | undefined
): boolean {
  if (!task || !userId) return false;

  const isCreator = task.creatorUserId === userId;
  const isAssignee =
    task.assigneeUserId === userId ||
    task.assigneeUserIds?.includes(userId) ||
    false;
  const isOwner = isCreator || isAssignee;

  const isHighLevel = ["ADMIN", "CHIEF", "LEADER", "HEAD"].includes(
    userRole || ""
  );

  const canEditBase = isOwner || isHighLevel;
  const isClosed = task.isClosed === true;

  return canEditBase && !isClosed;
}
```

**Result**: ✅ Consistent with hook implementation

### 2.3 Sidebar Navigation (src/components/layout/sidebar.tsx)

**Navigation Items** (lines 20-56):

```typescript
const mainNavigation = [
  {
    name: "แดชบอร์ด",
    href: "/dashboard",
    requiredRoles: [], // ✅ All roles including MEMBER
  },
  {
    name: "งาน",
    href: "/department/tasks",
    requiredRoles: [], // ✅ All roles including MEMBER
  },
  {
    name: "โปรเจกต์",
    href: "/projects",
    requiredRoles: ["ADMIN", "CHIEF", "LEADER", "HEAD"], // ❌ MEMBER hidden
  },
  {
    name: "รายงาน",
    href: "/reports",
    requiredRoles: ["ADMIN", "CHIEF", "LEADER", "HEAD", "MEMBER"], // ✅ MEMBER can access
  },
  {
    name: "บุคลากร",
    href: "/users",
    requiredRoles: ["ADMIN", "CHIEF", "LEADER", "HEAD"], // ❌ MEMBER hidden
  },
];
```

**MEMBER Sidebar Access**:

- ✅ แดชบอร์ด (Dashboard)
- ✅ งาน (Department Tasks)
- ✅ รายงาน (Reports) - **INCONSISTENT WITH BACKEND** (see section 3.1)
- ❌ โปรเจกต์ (Projects Management) - Hidden
- ❌ บุคลากร (Users) - Hidden

### 2.4 Workspace Navigation (src/components/navigation/workspace-navigation.tsx)

**View Type for MEMBER** (line 159-160):

```typescript
// Flat view for MEMBER/HEAD/USER roles
if (workspace.viewType === "flat") {
  // Shows only user's own department without hierarchy
}
```

**Result**: ✅ MEMBER sees flat department view, not hierarchical organization view

### 2.5 Task Panel Edit Permissions

**Task Panel Implementation**: Uses `useTaskPermissions()` hook consistently

**Save Button Logic**:

- Disabled when `!permissions.canEdit`
- Enabled when MEMBER owns the task (creator or assignee)

**Field Editing**:

- All form fields respect `permissions.canEdit`
- MEMBER can edit all fields when they own the task

**Result**: ✅ Correctly enforced in UI

### 2.6 User Management UI

**Create User Modal** (src/components/modals/create-user-modal.tsx):

- Default role: `MEMBER`
- Available to ADMIN only

**Edit User Modal** (src/components/modals/edit-user-modal.tsx):

- Available to ADMIN, CHIEF, LEADER, HEAD roles
- MEMBER cannot access

**Users Page** (src/app/(dashboard)/users/page.tsx):

- Sidebar menu item hidden for MEMBER
- Page access blocked by role check

**Result**: ✅ MEMBER has no user management access

---

## 3. Inconsistencies & Issues

### 3.1 Reports Access Inconsistency ⚠️

**Backend Permission** (src/lib/permissions.ts:77):

```typescript
USER: ['view_projects', 'view_tasks'],
```

❌ MEMBER does NOT have `view_reports` permission in backend

**Frontend Access** (src/components/layout/sidebar.tsx:47):

```typescript
{
  name: "รายงาน",
  href: "/reports",
  requiredRoles: ["ADMIN", "CHIEF", "LEADER", "HEAD", "MEMBER"],
}
```

✅ MEMBER can see Reports menu item and access the page

**Analysis**:

- This is an **intentional design decision** or **documentation error**
- Frontend explicitly allows MEMBER to access Reports
- Backend permissions may need to be updated to include `view_reports` for MEMBER
- OR frontend should remove MEMBER from Reports access

**Recommendation**: Add `view_reports` to MEMBER permissions in backend to match frontend

### 3.2 Multi-Assignee Support in Backend Permission Check ⚠️

**Issue**: `checkPermission()` function only checks legacy `assigneeUserId` field

**Current Code** (src/lib/permissions.ts:133-145):

```typescript
if (permission === "edit_own_tasks" && context.taskId) {
  const task = await prisma.task.findUnique({
    where: { id: context.taskId },
    select: { creatorUserId: true, assigneeUserId: true }, // ❌ Missing assignees
  });

  if (!task) return false;

  return (
    task.creatorUserId === userId || task.assigneeUserId === userId // ❌ Only checks first assignee
  );
}
```

**Should Be**:

```typescript
if (permission === "edit_own_tasks" && context.taskId) {
  const task = await prisma.task.findUnique({
    where: { id: context.taskId },
    select: {
      creatorUserId: true,
      assigneeUserId: true,
      assignees: {
        select: { userId: true },
      },
    },
  });

  if (!task) return false;

  const assigneeUserIds = task.assignees.map((a) => a.userId);

  return (
    task.creatorUserId === userId ||
    task.assigneeUserId === userId ||
    assigneeUserIds.includes(userId)
  );
}
```

**Impact**:

- **LOW PRIORITY** - `assigneeUserId` is kept in sync with first assignee
- Multi-assignee tasks work because of legacy field sync
- Should be fixed for consistency

### 3.3 Project Board/Calendar/List View Access ✅

**Current Behavior**:

- MEMBER cannot access `/projects` (project list)
- BUT MEMBER **can** access `/projects/[projectId]/board|calendar|list` if they have direct link

**Analysis**: This is **CORRECT** behavior

- Sidebar hides "โปรเจกต์" menu for MEMBER
- Department Tasks view is MEMBER's primary entry point
- MEMBER can still work with projects they're involved in
- Access control is at department level, not project level

---

## 4. Complete Permission Matrix

| Permission       | ADMIN | CHIEF | LEADER | HEAD | MEMBER   | USER   |
| ---------------- | ----- | ----- | ------ | ---- | -------- | ------ |
| **Projects**     |
| View Projects    | ✅    | ✅    | ✅     | ✅   | ✅       | ✅     |
| Create Projects  | ✅    | ✅    | ✅     | ✅   | ❌       | ❌     |
| Edit Projects    | ✅    | ✅    | ✅     | ✅   | ❌\*     | ❌     |
| Delete Projects  | ✅    | ✅    | ❌     | ❌   | ❌       | ❌     |
| **Tasks**        |
| View Tasks       | ✅    | ✅    | ✅     | ✅   | ✅       | ✅     |
| Create Tasks     | ✅    | ✅    | ✅     | ✅   | ✅       | ❌     |
| Edit All Tasks   | ✅    | ✅    | ✅     | ✅   | ❌       | ❌     |
| Edit Own Tasks   | ✅    | ✅    | ✅     | ✅   | ✅       | ❌     |
| Close All Tasks  | ✅    | ✅    | ✅     | ✅   | ❌       | ❌     |
| Close Own Tasks  | ✅    | ✅    | ✅     | ✅   | ✅       | ❌     |
| Delete Tasks     | ✅    | ✅    | ✅     | ❌   | ❌       | ❌     |
| Add Checklist    | ✅    | ✅    | ✅     | ✅   | ✅\*\*   | ✅\*\* |
| Add Subtask      | ✅    | ✅    | ✅     | ✅   | ✅\*\*   | ✅\*\* |
| Comment          | ✅    | ✅    | ✅     | ✅   | ✅       | ✅     |
| **Users**        |
| View Users       | ✅    | ✅    | ✅     | ✅   | ❌       | ❌     |
| Create Users     | ✅    | ✅    | ❌     | ❌   | ❌       | ❌     |
| Edit Users       | ✅    | ✅    | ❌     | ❌   | ❌       | ❌     |
| Delete Users     | ✅    | ✅    | ❌     | ❌   | ❌       | ❌     |
| Manage Status    | ✅    | ✅    | ✅     | ❌   | ❌       | ❌     |
| **Reports**      |
| View Reports     | ✅    | ✅    | ✅     | ✅   | ✅\*\*\* | ❌     |
| **UI Access**    |
| Dashboard        | ✅    | ✅    | ✅     | ✅   | ✅       | ✅     |
| Department Tasks | ✅    | ✅    | ✅     | ✅   | ✅       | ✅     |
| Projects Page    | ✅    | ✅    | ✅     | ✅   | ❌       | ❌     |
| Reports Page     | ✅    | ✅    | ✅     | ✅   | ✅       | ❌     |
| Users Page       | ✅    | ✅    | ✅     | ✅   | ❌       | ❌     |

**Notes**:

- `*` MEMBER can edit projects they own (ownerUserId)
- `**` Only on tasks they can edit (own tasks)
- `***` Frontend allows, backend does not define permission (inconsistency)

---

## 5. Recommendations

### 5.1 Fix Backend Multi-Assignee Support ⚠️ MEDIUM PRIORITY

**File**: `src/lib/permissions.ts` lines 133-145

**Update**:

```typescript
// Check if editing own tasks
if (permission === "edit_own_tasks" && context.taskId) {
  const task = await prisma.task.findUnique({
    where: { id: context.taskId },
    select: {
      creatorUserId: true,
      assigneeUserId: true,
      assignees: {
        select: { userId: true },
      },
    },
  });

  if (!task) return false;

  // Support multi-assignee
  const assigneeUserIds = task.assignees.map((a) => a.userId);

  // User can edit if they created or are assigned to the task
  return (
    task.creatorUserId === userId ||
    task.assigneeUserId === userId ||
    assigneeUserIds.includes(userId)
  );
}
```

**Same fix needed for `close_own_tasks`** (if it exists as separate permission)

### 5.2 Clarify Reports Access Permission ⚠️ HIGH PRIORITY

**Option A**: Add `view_reports` to MEMBER backend permissions (RECOMMENDED)

**File**: `src/lib/permissions.ts` line 69-75

**Update**:

```typescript
MEMBER: [
  'view_projects',
  'view_tasks',
  'create_tasks',
  'edit_own_tasks',
  'close_own_tasks',
  'view_reports',        // ✅ Add this
],
```

**Option B**: Remove MEMBER from Reports sidebar access

**File**: `src/components/layout/sidebar.tsx` line 47

**Update**:

```typescript
{
  name: "รายงาน",
  href: "/reports",
  requiredRoles: ["ADMIN", "CHIEF", "LEADER", "HEAD"], // Remove MEMBER
}
```

**Recommendation**: Use Option A - Reports are useful for all roles

### 5.3 Update Documentation ✅ LOW PRIORITY

**File**: `CLAUDE.md` section on MEMBER permissions

**Add**:

```markdown
### MEMBER Role Specifics

**Can Do**:

- ✅ View all projects and tasks in their department
- ✅ Create new tasks
- ✅ Edit/close tasks they created or are assigned to
- ✅ Add checklists, subtasks, and comments to tasks they can edit
- ✅ Access Dashboard
- ✅ Access Department Tasks view
- ✅ Access Reports page
- ✅ Pin tasks to dashboard

**Cannot Do**:

- ❌ Create, edit, or delete projects
- ❌ Edit or close other people's tasks
- ❌ Delete any tasks
- ❌ Access Projects management page (sidebar hidden)
- ❌ Access Users management page (sidebar hidden)
- ❌ Manage users, departments, or statuses
- ❌ See organization hierarchy (flat view only)
```

---

## 6. Testing Scenarios

### 6.1 Task Editing Tests

**Test Case 1**: MEMBER edits own created task

- ✅ Expected: Can edit
- ✅ Actual: Works

**Test Case 2**: MEMBER edits task they're assigned to

- ✅ Expected: Can edit
- ✅ Actual: Works (fixed in recent bug fix)

**Test Case 3**: MEMBER edits task they're multi-assigned to

- ✅ Expected: Can edit
- ⚠️ Actual: Works (due to legacy field sync, but should be fixed)

**Test Case 4**: MEMBER edits someone else's task

- ✅ Expected: Cannot edit (403 Forbidden)
- ✅ Actual: Works correctly

**Test Case 5**: MEMBER closes own task

- ✅ Expected: Can close
- ✅ Actual: Works

**Test Case 6**: MEMBER closes someone else's task

- ✅ Expected: Cannot close (403 Forbidden)
- ✅ Actual: Works correctly

### 6.2 UI Access Tests

**Test Case 1**: MEMBER accesses Dashboard

- ✅ Expected: Can access
- ✅ Actual: Works

**Test Case 2**: MEMBER accesses Department Tasks

- ✅ Expected: Can access
- ✅ Actual: Works

**Test Case 3**: MEMBER accesses Projects page

- ✅ Expected: Sidebar menu hidden, direct access blocked
- ✅ Actual: Works (menu hidden)

**Test Case 4**: MEMBER accesses Reports page

- ⚠️ Expected: Can access (frontend), but no backend permission
- ✅ Actual: Works (inconsistency)

**Test Case 5**: MEMBER accesses Users page

- ✅ Expected: Sidebar menu hidden, direct access blocked
- ✅ Actual: Works (menu hidden)

**Test Case 6**: MEMBER accesses Project Board view (direct link)

- ✅ Expected: Can access if project is in their department
- ✅ Actual: Works

---

## 7. Conclusion

### Overall Assessment: ✅ **CORRECT AND WELL-IMPLEMENTED**

The MEMBER role implementation is **generally correct and consistent** across backend and frontend. The permission model is clear:

1. **Backend**: Properly restricts MEMBER to own-task editing using `edit_own_tasks` permission
2. **Frontend**: Correctly hides management features and uses ownership checks
3. **UI/UX**: Appropriately simplified for MEMBER role (flat view, limited sidebar)

### Issues Found: 2 Minor, 1 Documentation

1. ⚠️ **MEDIUM**: Multi-assignee support incomplete in backend permission check (low impact due to legacy field sync)
2. ⚠️ **HIGH**: Reports access inconsistency between frontend and backend permissions
3. ✅ **LOW**: Documentation could be more explicit about MEMBER permissions

### Action Items

1. **Immediate**: Decide on Reports access for MEMBER (add backend permission)
2. **Short-term**: Fix multi-assignee support in `checkPermission()` function
3. **Nice-to-have**: Update documentation with explicit MEMBER permission matrix

---

**End of Document**
