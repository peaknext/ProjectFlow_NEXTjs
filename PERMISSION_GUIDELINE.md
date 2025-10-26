# Permission System Guideline

**Version**: 1.0.0
**Last Updated**: 2025-10-26
**Reference**: `src/lib/permissions.ts`

This document provides comprehensive guidelines for implementing and using the permission system in ProjectFlows. It covers both frontend (UI/UX) and backend (API) implementations.

---

## Table of Contents

- [Overview](#overview)
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
| `delete_tasks` | Delete tasks | ADMIN, CHIEF | Hide delete button | Reject DELETE request |
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

- **1.0.0** (2025-10-26): Initial documentation
  - Complete permission list
  - Frontend/Backend implementation guides
  - Context-based permissions
  - Special functions
  - Testing guidelines
