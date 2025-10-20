# ProjectFlow Architecture Documentation
> Modern Task Management System - Migration from Google Apps Script to Next.js

**Version:** 1.0
**Last Updated:** 2025-10-20
**Target Stack:** Next.js 14 + PostgreSQL + shadcn/ui

---

## 1. Overview

### 1.1 Project Description

**ProjectFlow** is a comprehensive task and project management system designed for organizations with hierarchical structures (hospitals, government agencies, corporations). The system provides:

- Multi-level task management with project hierarchies
- Role-based permission system (6 levels: ADMIN → CHIEF → LEADER → HEAD → MEMBER → USER)
- Progress tracking with weighted calculations
- Interactive task boards (List, Board, Calendar, Gantt views)
- Task checklists and sub-task management
- Organizational structure management (Mission Groups → Divisions → Departments)
- User dashboards with personal task tracking
- Activity history and notifications
- Batch operations and bulk updates

### 1.2 Migration Context

**Original System:**
- Platform: Google Apps Script (GAS)
- Database: Google Sheets (7+ sheets)
- UI: HTML Service with jQuery
- Deployment: Google Apps Script Web App
- Users: ~50-100 users
- Codebase: ~97 GAS functions, 28+ HTML components

**Target System:**
- Platform: Next.js 14 (App Router)
- Database: PostgreSQL with Prisma ORM
- UI: React + shadcn/ui + Tailwind CSS
- Deployment: render.com
- Expected Users: 100-500+ users
- Feature Parity: 95%+ of original functionality

### 1.3 Migration Timeline

- **Duration:** 18-20 weeks (~5 months)
- **Team Size:** 2 full-stack developers + 1 PM + 1 QA
- **Target Launch:** Week 20
- **Feature Parity:** 99% coverage

---

## 2. Tech Stack

### 2.1 Frontend Stack

```
Core Framework:
├── Next.js 14 (App Router, RSC, Server Actions)
├── React 18 (Client Components where needed)
└── TypeScript 5.0+

UI & Styling:
├── shadcn/ui (Radix UI primitives)
├── Tailwind CSS 3.x
├── Lucide Icons
└── React Beautiful DnD (board view)

State Management:
├── Zustand (client state)
├── TanStack Query v5 (server state, caching)
└── React Hook Form + Zod (form state + validation)

Data Visualization:
├── FullCalendar (calendar view)
├── Recharts (dashboard charts)
└── Custom Gantt component
```

### 2.2 Backend Stack

```
API Layer:
├── Next.js API Routes (App Router)
├── Server Actions (form mutations)
└── RESTful design principles

Database:
├── PostgreSQL 15+ (on render.com)
├── Prisma ORM 5.x (schema, migrations, client)
└── Connection pooling (PgBouncer)

Authentication:
├── Custom session-based auth
├── Bcrypt (password hashing)
├── HTTP-only cookies (session tokens)
└── Middleware-based route protection

File Storage:
├── Cloudinary (profile images, attachments)
└── Local storage (development)
```

### 2.3 DevOps & Tooling

```
Version Control:
├── Git + GitHub
└── GitHub Actions (CI/CD)

Deployment:
├── render.com (Web Service + PostgreSQL)
├── Automatic deploys from main branch
└── Preview environments for PRs

Testing:
├── Jest (unit tests)
├── Playwright (E2E tests)
├── k6 (load testing)
└── TypeScript (compile-time type checking)

Development:
├── ESLint + Prettier (code quality)
├── Husky (pre-commit hooks)
└── VS Code (recommended IDE)
```

### 2.4 Monitoring & Logging

```
Production:
├── render.com built-in logs
├── Error tracking: Sentry (optional)
└── Analytics: Vercel Analytics (optional)

Development:
├── Next.js dev server logs
├── Prisma query logging
└── Console debugging
```

---

## 3. Migration Goals

### 3.1 Primary Goals

1. **Feature Parity (95%+)**
   - All core features from GAS app
   - All critical business logic preserved
   - UI/UX improvements where possible

2. **Performance**
   - Page load < 1s (vs 3-5s in GAS)
   - API response < 200ms (p95)
   - Support 500+ concurrent users

3. **Scalability**
   - No quotas (unlike GAS)
   - Horizontal scaling on render.com
   - Database indexing and optimization

4. **Developer Experience**
   - TypeScript for type safety
   - Modern tooling and workflows
   - Automated testing and CI/CD
   - Clear documentation

5. **User Experience**
   - Modern, responsive UI
   - Smooth interactions and transitions
   - Real-time updates (optional with WebSockets)
   - Offline support (optional Phase 2)

### 3.2 Success Metrics

| Metric | GAS Baseline | Target |
|--------|--------------|--------|
| Page Load Time | 3-5s | <1s |
| API Response Time | 1-3s | <200ms |
| Concurrent Users | 50 | 500+ |
| Test Coverage | 0% | 70%+ |
| TypeScript Coverage | 0% | 100% |
| Mobile Responsive | Partial | Full |

### 3.3 Non-Goals (Deferred to v2)

- Real-time collaboration (WebSockets)
- Full offline support with sync
- Mobile native apps
- Advanced analytics dashboard
- Third-party integrations (Slack, Teams, etc.)

---

## 4. Key Features (from GAS App)

### 4.1 Core Features

**User Management**
- User CRUD operations
- Profile management (name, email, department, role)
- Password management (change password, reset)
- Role assignment (6-level hierarchy)
- Department assignment
- Active/inactive status

**Project Management**
- Project CRUD operations
- Project hierarchy (optional parent projects)
- Custom status workflows per project
- Project-specific permissions
- Project progress calculation
- Project filtering and search

**Task Management**
- Task CRUD operations
- Rich task properties:
  - Title, description, notes
  - Status (customizable per project)
  - Priority, difficulty
  - Due dates, start dates
  - Assignees (multiple)
  - Tags (multiple)
  - Attachments
  - Pinned status
  - Closed/active status
- Task checklists (sub-items with toggle)
- Task history/activity log
- Task comments (optional Phase 2)

**Organizational Structure**
- Mission Groups (top level)
- Divisions (under Mission Groups)
- Departments (under Divisions)
- User-to-Department assignments
- Leadership assignments (Chief, Leader, Head)

**Views & Visualization**
- **List View:** Sortable, filterable table with all tasks
- **Board View:** Kanban-style drag-and-drop by status
- **Calendar View:** FullCalendar with due dates
- **Gantt View:** Timeline visualization
- **Dashboard:** Personal task summary, statistics

**Advanced Features**
- Checklists within tasks (create, toggle, delete items)
- Batch operations (multi-select, bulk update)
- Pinned tasks (always appear at top)
- Task closing workflow (CLOSING state before CLOSED)
- Progress calculation (weighted by status × difficulty)
- Activity logging (who did what when)
- Notifications (task assigned, status changed, etc.)

### 4.2 Permission System

**Role Hierarchy** (descending power):
```
ADMIN (System Administrator)
  ↓
CHIEF (Mission Group Chief)
  ↓
LEADER (Division Leader)
  ↓
HEAD (Department Head)
  ↓
MEMBER (Department Member)
  ↓
USER (Basic User)
```

**Permission Matrix:**

| Action | USER | MEMBER | HEAD | LEADER | CHIEF | ADMIN |
|--------|------|--------|------|--------|-------|-------|
| View own tasks | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create tasks | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit own tasks | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Delete own tasks | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View department tasks | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit department tasks | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| View division tasks | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Edit division tasks | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| View all tasks | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Manage users | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Manage projects | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| System settings | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

**Context-Based Permissions:**
- Users can be assigned additional roles in specific departments
- Task ownership bypasses some restrictions (own task edits)
- Project-level permissions (project creator has special rights)

### 4.3 Business Logic Highlights

**Progress Calculation Formula:**
```typescript
// Weighted progress based on status order and task difficulty
progress = Σ(statusOrder × difficulty) / Σ(maxStatusOrder × difficulty) × 100

// Example:
// Task 1: Status order 2/4, Difficulty 3 (Hard) → 2×3 = 6
// Task 2: Status order 4/4, Difficulty 1 (Easy) → 4×1 = 4
// Total: (6+4) / (4×3 + 4×1) = 10/16 = 62.5%
```

**Task Lifecycle State Machine:**
```
CREATED → IN_PROGRESS → CLOSING → CLOSED
   ↓                        ↓
   └────── (can reopen) ───┘
```

**Close Types:**
- `COMPLETED` - Task finished successfully (when in DONE status)
- `ABORTED` - Task cancelled/abandoned (when not in DONE status)
- Auto-determined if not specified

---

## 5. Data Models

### 5.1 Prisma Schema Overview

**Entity Relationship Diagram:**
```
MissionGroup
    ↓ 1:N
  Division
    ↓ 1:N
  Department
    ↓ 1:N
   User ←→ Task (M:N via TaskAssignment)
    ↓
ActivityLog, Notification

Project → Status (1:N)
Project → Task (1:N)
Task → ChecklistItem (1:N)
Task → TaskHistory (1:N)
Task → Tag (M:N via TaskTag)
```

### 5.2 Core Models Mapping

**GAS Sheets → Prisma Models**

#### User Model
**GAS Sheet:** `Users` (columns A-K)
```prisma
model User {
  id                String    @id @default(cuid())
  email             String    @unique
  name              String
  password          String    // bcrypt hashed
  role              UserRole  @default(USER)
  departmentId      String?
  isActive          Boolean   @default(true)
  additionalRoles   Json?     // {"LEADER": "dept-id-123"}
  profileImageUrl   String?
  lastLoginAt       DateTime?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  deletedAt         DateTime?

  // Relations
  department        Department?       @relation(fields: [departmentId], references: [id])
  createdTasks      Task[]           @relation("TaskCreator")
  assignedTasks     TaskAssignment[]
  activityLogs      ActivityLog[]
  notifications     Notification[]
  checklistItems    ChecklistItem[]  @relation("ChecklistCreator")
  taskHistories     TaskHistory[]

  @@index([email])
  @@index([departmentId])
  @@map("users")
}

enum UserRole {
  ADMIN
  CHIEF
  LEADER
  HEAD
  MEMBER
  USER
}
```

#### Task Model
**GAS Sheet:** `Tasks` (columns A-U)
```prisma
model Task {
  id                String     @id @default(cuid())
  title             String
  description       String?    @db.Text
  notes             String?    @db.Text
  projectId         String
  statusId          String
  priority          Int        @default(2) // 1-5
  difficulty        Int        @default(2) // 1-5
  dueDate           DateTime?
  startDate         DateTime?
  closeDate         DateTime?
  closeType         CloseType?
  isClosed          Boolean    @default(false)
  isPinned          Boolean    @default(false)
  order             Int        @default(0)
  creatorUserId     String
  userClosedId      String?
  createdAt         DateTime   @default(now())
  updatedAt         DateTime   @updatedAt
  deletedAt         DateTime?

  // Relations
  project           Project         @relation(fields: [projectId], references: [id])
  status            Status          @relation(fields: [statusId], references: [id])
  creator           User            @relation("TaskCreator", fields: [creatorUserId], references: [id])
  userClosed        User?           @relation(fields: [userClosedId], references: [id])
  assignments       TaskAssignment[]
  tags              TaskTag[]
  checklists        ChecklistItem[] @relation("TaskChecklists")
  history           TaskHistory[]

  @@index([projectId])
  @@index([statusId])
  @@index([creatorUserId])
  @@index([dueDate])
  @@map("tasks")
}

enum CloseType {
  COMPLETED
  ABORTED
}
```

#### Project Model
**GAS Sheet:** `Projects` (columns A-H)
```prisma
model Project {
  id              String    @id @default(cuid())
  name            String
  description     String?   @db.Text
  parentProjectId String?
  color           String?
  isActive        Boolean   @default(true)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  deletedAt       DateTime?

  // Relations
  parentProject   Project?  @relation("ProjectHierarchy", fields: [parentProjectId], references: [id])
  childProjects   Project[] @relation("ProjectHierarchy")
  statuses        Status[]
  tasks           Task[]

  @@index([parentProjectId])
  @@map("projects")
}
```

#### Status Model
**GAS Sheet:** `Statuses` (columns A-G)
```prisma
model Status {
  id          String     @id @default(cuid())
  name        String
  type        StatusType @default(IN_PROGRESS)
  color       String?
  order       Int
  projectId   String
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  // Relations
  project     Project    @relation(fields: [projectId], references: [id], onDelete: Cascade)
  tasks       Task[]

  @@index([projectId])
  @@index([order])
  @@map("statuses")
}

enum StatusType {
  TODO
  IN_PROGRESS
  DONE
}
```

#### ChecklistItem Model
**GAS Sheet:** `ChecklistItems` (columns A-H)
```prisma
model ChecklistItem {
  id            String   @id @default(cuid())
  taskId        String
  name          String
  isChecked     Boolean  @default(false)
  order         Int
  creatorUserId String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  deletedAt     DateTime?

  // Relations
  task    Task @relation("TaskChecklists", fields: [taskId], references: [id], onDelete: Cascade)
  creator User @relation("ChecklistCreator", fields: [creatorUserId], references: [id])

  @@index([taskId])
  @@index([creatorUserId])
  @@map("checklist_items")
}
```

#### Department/Division/MissionGroup Models
**GAS Sheet:** `Departments`, `Divisions`, `MissionGroups`
```prisma
model MissionGroup {
  id           String     @id @default(cuid())
  name         String
  chiefUserId  String?
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  divisions    Division[]

  @@map("mission_groups")
}

model Division {
  id             String       @id @default(cuid())
  name           String
  missionGroupId String
  leaderUserId   String?
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  missionGroup   MissionGroup @relation(fields: [missionGroupId], references: [id])
  departments    Department[]

  @@index([missionGroupId])
  @@map("divisions")
}

model Department {
  id          String    @id @default(cuid())
  name        String
  divisionId  String
  headUserId  String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  division    Division  @relation(fields: [divisionId], references: [id])
  users       User[]

  @@index([divisionId])
  @@map("departments")
}
```

#### Supporting Models

**TaskAssignment** (M:N between User and Task)
```prisma
model TaskAssignment {
  id         String   @id @default(cuid())
  taskId     String
  userId     String
  assignedAt DateTime @default(now())

  task       Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([taskId, userId])
  @@index([taskId])
  @@index([userId])
  @@map("task_assignments")
}
```

**Tag** (M:N with Task)
```prisma
model Tag {
  id        String    @id @default(cuid())
  name      String    @unique
  color     String?
  createdAt DateTime  @default(now())

  tasks     TaskTag[]

  @@map("tags")
}

model TaskTag {
  taskId String
  tagId  String

  task   Task @relation(fields: [taskId], references: [id], onDelete: Cascade)
  tag    Tag  @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([taskId, tagId])
  @@index([taskId])
  @@index([tagId])
  @@map("task_tags")
}
```

**ActivityLog** (History tracking)
```prisma
model ActivityLog {
  id         String   @id @default(cuid())
  userId     String
  actionType String   // CREATE, UPDATE, DELETE, CLOSE, REOPEN, ASSIGN, etc.
  entityType String   // Task, Project, User, etc.
  entityId   String
  changes    Json?    // { before: {...}, after: {...} }
  createdAt  DateTime @default(now())

  user       User     @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([entityType, entityId])
  @@index([createdAt])
  @@map("activity_logs")
}
```

**Notification**
```prisma
model Notification {
  id        String   @id @default(cuid())
  userId    String
  type      String   // TASK_ASSIGNED, STATUS_CHANGED, DUE_SOON, etc.
  title     String
  message   String?
  entityId  String?  // Related task/project ID
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, isRead])
  @@index([createdAt])
  @@map("notifications")
}
```

### 5.3 Optional Models (Phase 2)

**Phase, HospitalMission, ITGoal, ActionPlan**
- Already included in schema for future use
- Can be implemented in v2 if needed
- Low priority features

---

## 6. API Endpoints

### 6.1 API Architecture

**Design Principles:**
- RESTful conventions
- Consistent response format
- Centralized error handling
- Permission checks on all mutations
- Input validation with Zod
- Activity logging on changes

**Response Format:**
```typescript
// Success
{
  success: true,
  data: { ... }
}

// Error
{
  success: false,
  error: {
    code: 'ERROR_CODE',
    message: 'Human-readable message',
    details?: { field: 'error detail' }
  }
}
```

### 6.2 GAS Functions → Next.js Routes Mapping

**Total Endpoints:** 65 (mapped from 97+ GAS functions)

#### Authentication APIs (7 endpoints)

**GAS Functions:** `doLogin`, `doLogout`, `getUserSession`, `changePassword`, `resetPassword`

```typescript
// POST /api/auth/login
// Body: { email, password }
// Returns: { user, sessionToken }

// POST /api/auth/logout
// Clears session cookie

// GET /api/auth/session
// Returns: { user } or null

// POST /api/auth/change-password
// Body: { oldPassword, newPassword }

// POST /api/auth/request-reset
// Body: { email }

// POST /api/auth/reset-password
// Body: { token, newPassword }

// POST /api/auth/refresh
// Refreshes session token
```

#### User APIs (8 endpoints)

**GAS Functions:** `getUsers`, `getUserById`, `createUser`, `updateUser`, `deleteUser`, `searchUsers`, `getUserDashboard`, `updateUserProfile`

```typescript
// GET /api/users
// Query: ?search=&role=&departmentId=&isActive=
// Returns: { users: User[] }

// GET /api/users/:id
// Returns: { user: User }

// POST /api/users
// Body: { email, name, password, role, departmentId }
// Permission: ADMIN only

// PATCH /api/users/:id
// Body: Partial<User>
// Permission: ADMIN or self (limited fields)

// DELETE /api/users/:id
// Permission: ADMIN only

// GET /api/users/search?q=
// Returns: { users: User[] }

// GET /api/users/:id/dashboard
// Returns: { stats, recentTasks, upcomingTasks }

// PATCH /api/users/:id/profile
// Body: { name, profileImageUrl }
// Permission: Self only
```

#### Project APIs (7 endpoints)

**GAS Functions:** `getProjects`, `getProjectById`, `createProject`, `updateProject`, `deleteProject`, `getProjectProgress`, `getProjectStatuses`

```typescript
// GET /api/projects
// Returns: { projects: Project[] }

// GET /api/projects/:id
// Returns: { project: Project }

// POST /api/projects
// Body: { name, description, parentProjectId?, color? }
// Permission: CHIEF, ADMIN

// PATCH /api/projects/:id
// Body: Partial<Project>
// Permission: CHIEF, ADMIN

// DELETE /api/projects/:id
// Permission: ADMIN only

// GET /api/projects/:id/progress
// Returns: { progress: number, breakdown: {...} }

// GET /api/projects/:id/statuses
// Returns: { statuses: Status[] }
```

#### Task APIs (12 endpoints)

**GAS Functions:** `getTasks`, `getTaskById`, `createTask`, `updateTask`, `deleteTask`, `closeTask`, `reopenTask`, `updateTaskStatus`, `pinTask`, `unpinTask`, `assignTask`, `unassignTask`

```typescript
// GET /api/tasks
// Query: ?projectId=&statusId=&assignedTo=&createdBy=&isClosed=&isPinned=
// Returns: { tasks: Task[] }

// GET /api/tasks/:id
// Returns: { task: Task }

// POST /api/tasks
// Body: { title, projectId, statusId, description?, dueDate?, assignedUserIds?, ... }

// PATCH /api/tasks/:id
// Body: Partial<Task>

// DELETE /api/tasks/:id
// Permission: Creator or department HEAD+

// POST /api/tasks/:id/close
// Body: { closeType?: 'COMPLETED' | 'ABORTED' }

// POST /api/tasks/:id/reopen

// PATCH /api/tasks/:id/status
// Body: { statusId: string }

// POST /api/tasks/:id/pin

// DELETE /api/tasks/:id/pin

// POST /api/tasks/:id/assign
// Body: { userIds: string[] }

// DELETE /api/tasks/:id/assign
// Body: { userIds: string[] }
```

#### Checklist APIs (4 endpoints)

**GAS Functions:** `getChecklistItems`, `createChecklistItem`, `updateChecklistItem`, `deleteChecklistItem`, `toggleChecklistItem`

```typescript
// GET /api/tasks/:taskId/checklists
// Returns: { items: ChecklistItem[] }

// POST /api/tasks/:taskId/checklists
// Body: { name: string, order?: number }

// PATCH /api/checklists/:id
// Body: { name?, isChecked?, order? }

// DELETE /api/checklists/:id
```

#### Status APIs (5 endpoints)

**GAS Functions:** `getStatuses`, `createStatus`, `updateStatus`, `deleteStatus`, `reorderStatuses`

```typescript
// GET /api/statuses?projectId=
// Returns: { statuses: Status[] }

// POST /api/statuses
// Body: { name, type, projectId, color?, order? }
// Permission: CHIEF, ADMIN

// PATCH /api/statuses/:id
// Body: Partial<Status>

// DELETE /api/statuses/:id

// POST /api/statuses/reorder
// Body: { statusId: string, newOrder: number }[]
```

#### Department/Organization APIs (6 endpoints)

**GAS Functions:** `getDepartments`, `getDivisions`, `getMissionGroups`, `createDepartment`, `updateDepartment`, etc.

```typescript
// GET /api/departments
// Returns: { departments: Department[] }

// GET /api/divisions
// Returns: { divisions: Division[] }

// GET /api/mission-groups
// Returns: { missionGroups: MissionGroup[] }

// POST /api/departments
// POST /api/divisions
// POST /api/mission-groups
// Permission: ADMIN only
```

#### Permission APIs (3 endpoints)

**GAS Functions:** `checkPermission`, `getUserPermissions`, `getRolePermissions`

```typescript
// POST /api/permissions/check
// Body: { permission: string, context?: { projectId?, departmentId?, ownerId? } }
// Returns: { hasPermission: boolean }

// GET /api/permissions/user/:userId
// Returns: { permissions: string[], effectiveRole: UserRole }

// GET /api/permissions/role/:role
// Returns: { permissions: string[] }
```

#### Batch Operations APIs (2 endpoints)

**GAS Functions:** `batchUpdateTasks`, `batchDeleteTasks`, `batchUpdateChecklistItems`

```typescript
// POST /api/batch
// Body: {
//   operations: [
//     { type: 'UPDATE_TASK_FIELD', taskId, field, value },
//     { type: 'UPDATE_TASK_STATUS', taskId, statusId },
//     { type: 'UPDATE_CHECKLIST_STATUS', itemId, isChecked },
//     { type: 'ADD_CHECKLIST_ITEM', taskId, name },
//   ]
// }
// Returns: { results: { success: boolean, id: string, error?: string }[] }

// POST /api/batch/delete
// Body: { taskIds: string[] }
// Permission: Check per task
```

#### Activity & Notification APIs (5 endpoints)

**GAS Functions:** `getActivityLogs`, `getNotifications`, `markNotificationRead`, `createNotification`

```typescript
// GET /api/activity?entityType=&entityId=&userId=&limit=50
// Returns: { logs: ActivityLog[] }

// GET /api/notifications?isRead=
// Returns: { notifications: Notification[] }

// PATCH /api/notifications/:id/read

// POST /api/notifications/read-all

// POST /api/notifications (internal use)
```

#### Tag APIs (4 endpoints)

**GAS Functions:** `getTags`, `createTag`, `addTagToTask`, `removeTagFromTask`

```typescript
// GET /api/tags
// Returns: { tags: Tag[] }

// POST /api/tags
// Body: { name: string, color?: string }

// POST /api/tasks/:taskId/tags
// Body: { tagIds: string[] }

// DELETE /api/tasks/:taskId/tags
// Body: { tagIds: string[] }
```

#### Pinned Tasks API (2 endpoints)

```typescript
// GET /api/pinned-tasks
// Returns: { tasks: Task[] }

// POST /api/tasks/:id/pin-toggle
// Toggles pin status
```

### 6.3 Server Actions (for Forms)

Used alongside API routes for form mutations:

```typescript
// src/app/actions/tasks.ts
export async function createTaskAction(formData: FormData)
export async function updateTaskAction(taskId: string, formData: FormData)
export async function deleteTaskAction(taskId: string)

// src/app/actions/auth.ts
export async function loginAction(formData: FormData)
export async function logoutAction()

// Benefits:
// - Progressive enhancement
// - Automatic revalidation
// - Better UX with useFormStatus
```

---

## 7. UI Components Mapping

### 7.1 GAS HTML Components → React Components

**Total Components:** 28 core + 6 feature enhancements = 34

#### Layout Components

**GAS:** `component.header.html`, `component.sidebar.html`, `component.footer.html`

```
Next.js Structure:
└── src/app/
    ├── layout.tsx (root layout)
    └── (authenticated)/
        ├── layout.tsx (auth layout with sidebar)
        └── components/
            ├── app-header.tsx
            ├── app-sidebar.tsx
            └── app-footer.tsx

shadcn/ui components:
- Sheet (mobile sidebar)
- Avatar + DropdownMenu (user menu)
- NavigationMenu (main nav)
```

#### Task Management Components

**GAS:** `module.taskPanel.html`, `module.taskForm.html`, `module.taskList.html`, `component.taskCard.html`

```
Next.js Structure:
└── src/components/
    ├── panels/
    │   └── task-panel/
    │       ├── index.tsx (Sheet/Dialog container)
    │       ├── task-details.tsx
    │       ├── task-form.tsx
    │       ├── checklist-section.tsx ⭐
    │       ├── assignment-section.tsx
    │       ├── history-section.tsx
    │       └── actions-section.tsx
    ├── forms/
    │   └── task-form/
    │       ├── index.tsx (React Hook Form + Zod)
    │       ├── basic-fields.tsx
    │       ├── advanced-fields.tsx
    │       └── assignment-field.tsx
    └── views/
        ├── list-view/
        │   ├── index.tsx (TanStack Table)
        │   ├── task-table.tsx
        │   ├── task-row.tsx
        │   └── filters.tsx
        └── board-view/
            ├── index.tsx (React Beautiful DnD)
            ├── board-column.tsx
            ├── task-card.tsx
            └── task-card-skeleton.tsx ⭐

shadcn/ui components:
- Dialog/Sheet (task panel)
- Form + Input/Textarea/Select (task form)
- Table (list view)
- Card (task cards)
- Checkbox (checklists) ⭐
- Skeleton (loading states) ⭐
- Badge (tags, status)
- Button (actions)
```

#### View Components

**GAS:** `page.listView.html`, `page.boardView.html`, `page.calendarView.html`, `page.ganttView.html`

```
Next.js Structure:
└── src/app/(authenticated)/
    ├── tasks/
    │   ├── page.tsx (default: list view)
    │   ├── list/page.tsx
    │   ├── board/page.tsx
    │   ├── calendar/page.tsx
    │   └── gantt/page.tsx
    └── components/
        └── views/
            ├── list-view/ (as above)
            ├── board-view/ (as above)
            ├── calendar-view/
            │   ├── index.tsx (FullCalendar wrapper)
            │   ├── task-event.tsx
            │   └── event-modal.tsx
            └── gantt-view/
                ├── index.tsx (custom or library)
                ├── gantt-chart.tsx
                └── task-bar.tsx

External libraries:
- @fullcalendar/react (calendar)
- @fullcalendar/daygrid
- Custom Gantt or react-gantt-chart
```

#### Dashboard Components

**GAS:** `page.dashboard.html`, `component.statCard.html`, `component.taskSummary.html`

```
Next.js Structure:
└── src/app/(authenticated)/
    └── dashboard/
        ├── page.tsx
        └── components/
            ├── stat-cards.tsx
            ├── task-summary.tsx
            ├── upcoming-tasks.tsx
            ├── activity-feed.tsx
            └── progress-chart.tsx (Recharts)

shadcn/ui components:
- Card (stat cards)
- Progress (progress bars)
- ScrollArea (activity feed)
- Chart wrapper (for Recharts)
```

#### User Management Components

**GAS:** `page.users.html`, `module.userForm.html`, `component.userCard.html`

```
Next.js Structure:
└── src/app/(authenticated)/
    └── admin/
        └── users/
            ├── page.tsx (user list)
            ├── [id]/page.tsx (user detail)
            └── components/
                ├── user-table.tsx
                ├── user-form.tsx
                ├── user-card.tsx
                └── role-badge.tsx

shadcn/ui components:
- Table (user list)
- Dialog (user form)
- Select (role selection)
- Badge (role indicator)
```

#### Project Management Components

**GAS:** `page.projects.html`, `module.projectForm.html`, `component.projectCard.html`

```
Next.js Structure:
└── src/app/(authenticated)/
    └── projects/
        ├── page.tsx (project list)
        ├── [id]/page.tsx (project detail)
        └── components/
            ├── project-grid.tsx
            ├── project-card.tsx
            ├── project-form.tsx
            └── status-manager.tsx

shadcn/ui components:
- Card (project cards)
- Dialog (project form)
- Input (color picker)
- Sortable (status reordering)
```

### 7.2 New Feature Components

**Not in GAS, added for better UX:**

```typescript
// 1. Checklist Section ⭐
// src/components/panels/task-panel/checklist-section.tsx
// - Progress bar showing completion percentage
// - Checkbox toggles with optimistic updates
// - Add/delete checklist items inline
// - Drag-to-reorder (optional)

// 2. Skeleton Loading States ⭐
// src/components/views/board-view/task-card-skeleton.tsx
// - Shown during task closing/reopening
// - Smooth transitions, better perceived performance
// - Custom messages ("กำลังปิดงาน...", "กำลังยกเลิกงาน...")

// 3. Pinned Tasks Indicator ⭐
// src/components/views/task-card.tsx
// - Pin icon badge on task cards
// - Always sorted to top in list view
// - Visual distinction (subtle highlight)

// 4. Offline Indicator (Optional Phase 2)
// src/components/layout/offline-indicator.tsx
// - Banner when offline
// - Shows sync status

// 5. Dark Mode Support (Optional)
// - Tailwind dark: classes
// - Theme toggle in header
// - Persisted in localStorage

// 6. Notifications Dropdown
// src/components/layout/notifications-dropdown.tsx
// - Bell icon with unread count badge
// - Dropdown with notification list
// - Mark as read, clear all
```

### 7.3 shadcn/ui Components Used

**Full list of shadcn components to install:**

```bash
npx shadcn-ui@latest add \
  accordion alert avatar badge button calendar card checkbox \
  dialog dropdown-menu form input label popover progress \
  scroll-area select separator sheet skeleton table tabs \
  textarea toast toggle tooltip
```

### 7.4 Custom Hooks

```typescript
// Data fetching hooks (TanStack Query)
export function useTasks(filters?: TaskFilters)
export function useTask(taskId: string)
export function useProjects()
export function useProject(projectId: string)
export function useUsers()
export function useCurrentUser()

// Mutation hooks
export function useCreateTask()
export function useUpdateTask()
export function useDeleteTask()
export function useCloseTask()
export function useReopenTask()

// Feature hooks
export function useChecklists(taskId: string)
export function usePermissions()
export function useNotifications()
export function useActivityLog(entityType, entityId)

// UI hooks
export function useTaskPanel() // Open/close task panel
export function useViewMode() // Switch between list/board/calendar/gantt
export function useFilters() // Manage filter state
```

---

## 8. Authentication

### 8.1 Authentication Flow

**Strategy:** Session-based authentication with HTTP-only cookies

```
┌─────────────┐         ┌──────────────┐         ┌──────────────┐
│   Browser   │         │  Next.js API │         │  PostgreSQL  │
└──────┬──────┘         └───────┬──────┘         └───────┬──────┘
       │                        │                        │
       │  POST /api/auth/login  │                        │
       │  { email, password }   │                        │
       ├───────────────────────>│                        │
       │                        │  Query user by email   │
       │                        ├───────────────────────>│
       │                        │<───────────────────────┤
       │                        │  Compare password hash │
       │                        │  (bcrypt.compare)      │
       │                        │                        │
       │                        │  Generate session ID   │
       │                        │  Store in sessions DB  │
       │                        │                        │
       │   Set-Cookie: session  │                        │
       │<───────────────────────┤                        │
       │   { success, user }    │                        │
       │                        │                        │
       │  GET /api/tasks        │                        │
       │  Cookie: session       │                        │
       ├───────────────────────>│                        │
       │                        │  Validate session      │
       │                        │  Extract userId        │
       │                        │                        │
       │                        │  Query tasks           │
       │                        ├───────────────────────>│
       │   { tasks }            │<───────────────────────┤
       │<───────────────────────┤                        │
```

### 8.2 Implementation Details

**Password Security:**
```typescript
// src/lib/auth/password.ts
import bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

**Session Management:**
```typescript
// src/lib/auth/session.ts
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function createSession(userId: string) {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(JWT_SECRET);

  cookies().set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION / 1000,
    path: '/',
  });

  return token;
}

export async function getSession(): Promise<{ userId: string } | null> {
  const token = cookies().get('session')?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return { userId: payload.userId as string };
  } catch {
    return null;
  }
}

export async function clearSession() {
  cookies().delete('session');
}
```

**Route Protection (Middleware):**
```typescript
// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';

const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  // Check authentication
  const session = await getSession();
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|api/auth|static|favicon.ico).*)'],
};
```

**Permission Checks:**
```typescript
// src/lib/permissions/check.ts
export async function checkPermission(
  userId: string,
  permission: string,
  context?: PermissionContext
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      department: {
        include: {
          division: {
            include: { missionGroup: true },
          },
        },
      },
    },
  });

  if (!user) return false;

  // Get effective role (may be elevated in specific contexts)
  const effectiveRole = await getEffectiveRole(userId, context);

  // Check permission matrix
  const permissions = ROLE_PERMISSIONS[effectiveRole];
  if (!permissions.includes(permission)) return false;

  // Additional context-based checks
  if (context) {
    // Check ownership
    if (context.ownerId === userId) return true;

    // Check department scope
    if (permission.includes('department')) {
      return user.departmentId === context.departmentId;
    }

    // Check division scope
    if (permission.includes('division')) {
      return user.department?.divisionId === context.divisionId;
    }
  }

  return true;
}
```

### 8.3 Authorization Patterns

**API Route Protection:**
```typescript
// src/app/api/tasks/route.ts
import { withAuth } from '@/lib/auth/middleware';

export const GET = withAuth(async (req, { session }) => {
  const tasks = await prisma.task.findMany({
    where: {
      // Filter based on user permissions
      ...getTaskFiltersForUser(session.userId),
    },
  });

  return NextResponse.json({ success: true, data: { tasks } });
});
```

**Component-Level Protection:**
```typescript
// src/components/tasks/delete-button.tsx
export function DeleteTaskButton({ task }: { task: Task }) {
  const { user } = useCurrentUser();
  const canDelete = usePermission('delete_tasks', {
    projectId: task.projectId,
    ownerId: task.creatorUserId,
  });

  if (!canDelete) return null;

  return <Button onClick={handleDelete}>Delete</Button>;
}
```

---

## 9. Deployment Strategy

### 9.1 Hosting Architecture

```
┌──────────────────────────────────────────────────────┐
│                    render.com                        │
│                                                      │
│  ┌────────────────┐         ┌──────────────────┐    │
│  │  Web Service   │────────>│  PostgreSQL DB   │    │
│  │                │         │                  │    │
│  │  - Next.js App │         │  - Version 15+   │    │
│  │  - Auto-deploy │         │  - Daily backups │    │
│  │  - Auto-scale  │         │  - Connection    │    │
│  │                │         │    pooling       │    │
│  └────────────────┘         └──────────────────┘    │
│         │                                            │
│         │ (Optional)                                 │
│         v                                            │
│  ┌────────────────┐                                 │
│  │  Redis Cache   │                                 │
│  │  (Optional)    │                                 │
│  └────────────────┘                                 │
└──────────────────────────────────────────────────────┘
         │
         v
┌──────────────────┐
│   Cloudinary     │  (Image CDN)
└──────────────────┘
```

### 9.2 render.com Configuration

**Web Service (render.yaml):**
```yaml
services:
  - type: web
    name: projectflow
    runtime: node
    plan: starter  # $7/month (can upgrade to standard $25/month)
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: projectflow-db
          property: connectionString
      - key: JWT_SECRET
        generateValue: true
      - key: NEXT_PUBLIC_APP_URL
        value: https://projectflow.onrender.com
    healthCheckPath: /api/health
    autoDeploy: true

databases:
  - name: projectflow-db
    databaseName: projectflow
    plan: starter  # $7/month (can upgrade to standard $20/month)
    postgresMajorVersion: 15
```

**Environment Variables:**
```bash
# Database
DATABASE_URL=postgresql://user:pass@host/dbname

# Auth
JWT_SECRET=<auto-generated-secret>
BCRYPT_ROUNDS=10

# App
NEXT_PUBLIC_APP_URL=https://projectflow.onrender.com
NODE_ENV=production

# Cloudinary (optional)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Email (optional, for password reset)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
```

### 9.3 CI/CD Pipeline (GitHub Actions)

**.github/workflows/deploy.yml:**
```yaml
name: Deploy to render.com

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm test
      - run: npm run build

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Trigger render.com deploy
        run: |
          curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK_URL }}
```

### 9.4 Database Migrations

**Prisma Migration Strategy:**
```bash
# Development
npm run prisma:migrate:dev

# Production (automatic on deploy)
npm run prisma:migrate:deploy

# Seed initial data
npm run prisma:seed
```

**package.json scripts:**
```json
{
  "scripts": {
    "prisma:generate": "prisma generate",
    "prisma:migrate:dev": "prisma migrate dev",
    "prisma:migrate:deploy": "prisma migrate deploy",
    "prisma:seed": "tsx prisma/seed.ts",
    "postinstall": "prisma generate",
    "build": "prisma migrate deploy && next build"
  }
}
```

### 9.5 Monitoring & Logging

**Health Check Endpoint:**
```typescript
// src/app/api/health/route.ts
export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error.message,
      },
      { status: 503 }
    );
  }
}
```

**Logging Strategy:**
```typescript
// src/lib/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV === 'development'
      ? { target: 'pino-pretty' }
      : undefined,
});

// Usage
logger.info({ userId, taskId }, 'Task created');
logger.error({ error, userId }, 'Failed to create task');
```

### 9.6 Backup Strategy

**Automated Backups:**
- render.com PostgreSQL includes daily automated backups (7-day retention on Starter plan)
- Manual backups before major migrations: `pg_dump > backup.sql`
- Store critical backups in external storage (S3, Google Drive)

**Data Export Scripts:**
```bash
# Export all data to JSON (for migration verification)
npm run export:data

# Restore from backup
npm run import:data -- --file=backup.json
```

---

## 10. Testing Strategy

### 10.1 Testing Pyramid

```
        ┌──────────┐
        │   E2E    │  (10%) - Critical user flows
        │ Playwright│
        └──────────┘
      ┌──────────────┐
      │ Integration  │  (20%) - API routes, DB queries
      │     Jest     │
      └──────────────┘
   ┌────────────────────┐
   │    Unit Tests      │  (70%) - Business logic, utils
   │       Jest         │
   └────────────────────┘
```

### 10.2 Unit Testing

**Framework:** Jest + Testing Library

```typescript
// src/lib/permissions/__tests__/check.test.ts
import { checkPermission } from '../check';
import { prisma } from '@/lib/prisma';

describe('Permission System', () => {
  it('should allow ADMIN to do anything', async () => {
    const hasPermission = await checkPermission(
      adminUserId,
      'delete_users'
    );
    expect(hasPermission).toBe(true);
  });

  it('should deny USER from deleting tasks', async () => {
    const hasPermission = await checkPermission(
      basicUserId,
      'delete_tasks'
    );
    expect(hasPermission).toBe(false);
  });

  it('should allow task owner to edit their task', async () => {
    const hasPermission = await checkPermission(
      userId,
      'edit_tasks',
      { ownerId: userId }
    );
    expect(hasPermission).toBe(true);
  });
});
```

**Progress Calculation Tests:**
```typescript
// src/lib/business-logic/__tests__/progress.test.ts
import { calculateProjectProgress } from '../progress';

describe('Progress Calculation', () => {
  it('should calculate weighted progress correctly', async () => {
    const progress = await calculateProjectProgress(projectId);
    expect(progress).toBe(62); // Based on test data
  });

  it('should return 0 for projects with no tasks', async () => {
    const progress = await calculateProjectProgress(emptyProjectId);
    expect(progress).toBe(0);
  });
});
```

### 10.3 Integration Testing

**API Route Testing:**
```typescript
// src/app/api/tasks/__tests__/route.test.ts
import { GET, POST } from '../route';
import { createMocks } from 'node-mocks-http';

describe('GET /api/tasks', () => {
  it('should return tasks for authenticated user', async () => {
    const { req } = createMocks({
      method: 'GET',
      headers: { cookie: `session=${validSessionToken}` },
    });

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.tasks).toBeInstanceOf(Array);
  });

  it('should return 401 for unauthenticated request', async () => {
    const { req } = createMocks({ method: 'GET' });
    const response = await GET(req);
    expect(response.status).toBe(401);
  });
});

describe('POST /api/tasks', () => {
  it('should create task with valid data', async () => {
    const { req } = createMocks({
      method: 'POST',
      headers: { cookie: `session=${validSessionToken}` },
      body: {
        title: 'New Task',
        projectId: validProjectId,
        statusId: validStatusId,
      },
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.task.title).toBe('New Task');
  });

  it('should validate required fields', async () => {
    const { req } = createMocks({
      method: 'POST',
      headers: { cookie: `session=${validSessionToken}` },
      body: { title: 'Missing projectId' },
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
  });
});
```

### 10.4 End-to-End Testing

**Framework:** Playwright

```typescript
// e2e/task-management.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Task Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should create a new task', async ({ page }) => {
    await page.goto('/tasks');
    await page.click('button:has-text("New Task")');

    await page.fill('[name="title"]', 'E2E Test Task');
    await page.selectOption('[name="projectId"]', { label: 'Test Project' });
    await page.selectOption('[name="statusId"]', { label: 'To Do' });
    await page.click('button:has-text("Create")');

    await expect(page.locator('text=E2E Test Task')).toBeVisible();
  });

  test('should close a task', async ({ page }) => {
    await page.goto('/tasks');
    await page.click('text=E2E Test Task');

    await page.click('button:has-text("Close Task")');
    await page.click('button:has-text("Confirm")');

    await expect(page.locator('[data-status="closed"]')).toBeVisible();
  });

  test('should add checklist items', async ({ page }) => {
    await page.goto('/tasks');
    await page.click('text=E2E Test Task');

    await page.fill('[placeholder="Add checklist item"]', 'Test item 1');
    await page.press('[placeholder="Add checklist item"]', 'Enter');

    await expect(page.locator('text=Test item 1')).toBeVisible();

    // Toggle checkbox
    await page.click('input[type="checkbox"]:near(text=Test item 1)');
    await expect(
      page.locator('text=Test item 1').locator('..')
    ).toHaveClass(/line-through/);
  });
});
```

### 10.5 Load Testing

**Framework:** k6

```javascript
// load-tests/api.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'], // 95% of requests < 200ms
    http_req_failed: ['rate<0.01'],   // <1% errors
  },
};

export default function () {
  const BASE_URL = 'https://projectflow.onrender.com';

  // Login
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, {
    email: 'test@example.com',
    password: 'password',
  });

  check(loginRes, {
    'login successful': (r) => r.status === 200,
  });

  const sessionToken = loginRes.cookies.session[0].value;

  // Get tasks
  const tasksRes = http.get(`${BASE_URL}/api/tasks`, {
    headers: { Cookie: `session=${sessionToken}` },
  });

  check(tasksRes, {
    'tasks loaded': (r) => r.status === 200,
    'response time OK': (r) => r.timings.duration < 200,
  });

  sleep(1);
}
```

### 10.6 Test Coverage Goals

| Category | Target Coverage |
|----------|----------------|
| Business Logic | 90%+ |
| API Routes | 80%+ |
| Utils/Helpers | 85%+ |
| Components | 60%+ |
| **Overall** | **70%+** |

**Run Coverage:**
```bash
npm run test:coverage
```

---

## 11. Code Organization

### 11.1 Project Structure

```
ProjectFlow_NEXTjs/
├── .claude/                      # Claude Code context files
│   └── context/
│       └── architecture.md       # This file
├── .github/
│   └── workflows/
│       └── deploy.yml            # CI/CD pipeline
├── prisma/
│   ├── schema.prisma             # Database schema
│   ├── migrations/               # Migration history
│   └── seed.ts                   # Seed data script
├── public/                       # Static assets
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (authenticated)/      # Protected routes
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/
│   │   │   ├── tasks/
│   │   │   ├── projects/
│   │   │   └── admin/
│   │   ├── (public)/             # Public routes
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── api/                  # API routes
│   │   │   ├── auth/
│   │   │   ├── tasks/
│   │   │   ├── projects/
│   │   │   └── users/
│   │   ├── actions/              # Server Actions
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/               # React components
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── forms/                # Form components
│   │   ├── panels/               # Panel/Dialog components
│   │   ├── views/                # View components
│   │   └── layout/               # Layout components
│   ├── lib/                      # Utilities & core logic
│   │   ├── auth/                 # Authentication
│   │   ├── permissions/          # Permission system
│   │   ├── business-logic/       # Business logic
│   │   ├── prisma.ts             # Prisma client
│   │   ├── utils.ts              # Utility functions
│   │   └── validations.ts        # Zod schemas
│   ├── hooks/                    # Custom React hooks
│   ├── stores/                   # Zustand stores
│   └── types/                    # TypeScript types
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── old_project/                  # Original GAS codebase (reference)
├── migration_plan/               # Migration documentation
├── .env.local                    # Local environment variables
├── .env.production               # Production environment variables
├── next.config.js                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json
```

### 11.2 Naming Conventions

**Files:**
- Components: `kebab-case.tsx` (e.g., `task-card.tsx`)
- Utils: `kebab-case.ts` (e.g., `date-utils.ts`)
- Types: `kebab-case.ts` or `index.ts` (e.g., `types/task.ts`)
- Tests: `*.test.ts` or `*.spec.ts`

**Components:**
- PascalCase for component names (e.g., `TaskCard`)
- Prefixed with domain when needed (e.g., `TaskPanel`, `UserCard`)

**Functions:**
- camelCase for functions (e.g., `calculateProgress`)
- Descriptive action verbs (e.g., `createTask`, `getUserById`)

**Constants:**
- UPPER_SNAKE_CASE for true constants (e.g., `MAX_FILE_SIZE`)
- PascalCase for enums (e.g., `UserRole.ADMIN`)

---

## 12. Migration Checklist

### Phase 0: Preparation (Week 1-2)
- [ ] Setup render.com account
- [ ] Create GitHub repository
- [ ] Initialize Next.js project
- [ ] Install dependencies (shadcn/ui, Prisma, etc.)
- [ ] Setup Prisma schema
- [ ] Create render.yaml config

### Phase 1: Database Migration (Week 3-4)
- [ ] Run Prisma migrations on render.com
- [ ] Export data from Google Sheets
- [ ] Transform and import data
- [ ] Verify data integrity
- [ ] Setup database backups

### Phase 2: API Migration (Week 5-7)
- [ ] Implement authentication APIs
- [ ] Implement user APIs
- [ ] Implement project APIs
- [ ] Implement task APIs
- [ ] Implement permissions system
- [ ] Implement checklist APIs
- [ ] Implement batch operations APIs

### Phase 3: Core UI (Week 8-9)
- [ ] Setup layout (header, sidebar, footer)
- [ ] Implement login/logout
- [ ] Implement dashboard
- [ ] Setup routing

### Phase 4: Task Management (Week 10-13)
- [ ] Implement list view
- [ ] Implement board view (drag-and-drop)
- [ ] Implement task panel
- [ ] Implement task form
- [ ] Implement checklists
- [ ] Implement calendar view
- [ ] Implement Gantt view (optional)

### Phase 5: Advanced Features (Week 14-15)
- [ ] Implement user management
- [ ] Implement project management
- [ ] Implement notifications
- [ ] Implement activity logs
- [ ] Implement search & filters

### Phase 6: Testing & Optimization (Week 16-18)
- [ ] Write unit tests (70%+ coverage)
- [ ] Write integration tests
- [ ] Write E2E tests
- [ ] Run load tests
- [ ] Performance optimization
- [ ] Fix bugs

### Phase 7: Rollout & Launch (Week 19-20)
- [ ] Beta testing (10-20 users)
- [ ] Gather feedback
- [ ] Final fixes
- [ ] User training
- [ ] Production launch
- [ ] Monitor & support

---

## 13. Key Decisions & Rationale

### 13.1 Why Next.js?
- **Full-stack framework** - API routes + frontend in one codebase
- **App Router** - Modern React with Server Components
- **Performance** - Built-in optimizations (image, fonts, code splitting)
- **Deployment** - Easy deployment on render.com
- **Ecosystem** - Rich ecosystem, great documentation

### 13.2 Why PostgreSQL?
- **Relational data** - Tasks, users, projects have clear relationships
- **ACID compliance** - Data integrity is critical
- **Scalability** - Can handle 100k+ tasks easily
- **Prisma support** - Excellent ORM with type safety
- **Cost-effective** - $7/month on render.com

### 13.3 Why Session-based Auth (not JWT)?
- **Security** - HTTP-only cookies prevent XSS attacks
- **Simpler** - No need for token refresh logic
- **Revocable** - Can invalidate sessions server-side
- **Suitable for web app** - No mobile app requirement

### 13.4 Why shadcn/ui?
- **Customizable** - Copy components, own the code
- **Accessible** - Built on Radix UI primitives
- **TypeScript** - Full type safety
- **Tailwind** - Consistent with our styling choice
- **No lock-in** - Not a dependency, just code

### 13.5 Why TanStack Query?
- **Server state management** - Perfect for API data
- **Caching** - Reduces unnecessary API calls
- **Optimistic updates** - Better UX
- **Devtools** - Easy debugging
- **Type-safe** - Works well with TypeScript

---

## 14. Future Enhancements (v2)

**Deferred Features:**
- Real-time collaboration (WebSockets, multiplayer editing)
- Full offline support with service workers & sync queue
- Mobile native apps (React Native or Flutter)
- Advanced analytics dashboard (charts, reports, exports)
- Third-party integrations (Slack, Microsoft Teams, Google Calendar)
- File attachments on tasks (currently just URLs)
- Task comments & discussions
- Email notifications (currently in-app only)
- Two-factor authentication (2FA)
- SSO/OAuth (Google, Microsoft)

**Technical Debt to Address:**
- Implement comprehensive error boundaries
- Add performance monitoring (Sentry, New Relic)
- Implement full i18n (currently Thai/English mixed)
- Add automated database backups to S3
- Implement rate limiting on API routes
- Add API versioning (/api/v1, /api/v2)

---

## 15. References

**Documentation:**
- Migration Plan: `/migration_plan/README.md`
- Database Schema: `/migration_plan/01_DATABASE_MIGRATION.md`
- API Endpoints: `/migration_plan/02_API_MIGRATION.md`
- Frontend Components: `/migration_plan/03_FRONTEND_MIGRATION.md`
- Business Logic: `/migration_plan/06_BUSINESS_LOGIC_GUIDE.md`
- Deployment Guide: `/migration_plan/04_DEPLOYMENT_GUIDE.md`
- Rollout Plan: `/migration_plan/05_ROLLOUT_PLAN.md`

**Original GAS Codebase:**
- Main Backend: `/old_project/Code.gs`
- HTML Components: `/old_project/component.*.html`
- Modules: `/old_project/module.*.html`

**Tech Stack Docs:**
- Next.js: https://nextjs.org/docs
- Prisma: https://www.prisma.io/docs
- shadcn/ui: https://ui.shadcn.com
- Tailwind CSS: https://tailwindcss.com/docs
- TanStack Query: https://tanstack.com/query/latest
- Zustand: https://zustand-demo.pmnd.rs

---

**Last Updated:** 2025-10-20
**Maintained By:** ProjectFlow Team
**For Questions:** Refer to migration_plan/ documents or contact Technical Lead
