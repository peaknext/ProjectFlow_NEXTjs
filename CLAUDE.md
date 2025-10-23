# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**DO NOT REVERT ANYTHING IF I DON'T REQUEST**
**ProjectFlows** (formerly ProjectFlow) is a comprehensive project and task management system migrated from Google Apps Script to Next.js 15 + PostgreSQL. It's designed for healthcare organizations with hierarchical role-based access control and real-time collaboration features.

**Current Status**: Phase 2 Complete (API 100%), Phase 3 In Progress (Frontend ~50%)
**Tech Stack**: Next.js 15 (App Router), TypeScript, PostgreSQL, Prisma ORM, React Query, Zustand, Tailwind CSS, shadcn/ui
**Previous GAS Project Codebase**: Stored in old_project folder for reference
**Port**: Dev server typically runs on port 3010 (default 3000 often conflicts)
**Last Updated**: 2025-10-23

⚠️ **DEPLOYMENT STATUS**: **NOT PRODUCTION-READY** - Active development in progress (Frontend ~50% complete, estimated completion: 2025-12-15)

---

## 🎯 Next Steps

### Immediate Priorities

1. **Department Tasks View** - Next major feature (MVP: 8-12 days)
   - Department-level task management with project grouping
   - Advanced filtering, sorting, bulk actions
   - Optional: Custom grouping (7-9 days), Gantt chart (11-16 days)
   - See `NEXT_GOAL_DEPARTMENT_TASKS.md` for complete design

2. **Create Task Modal** - Critical blocker for complete user flow
   - Modal form with validation (Zod)
   - Form fields (name, description, priority, assignee, dates)
   - Integration with Board/Calendar/List views
   - Estimated: 1-2 days

3. **User Management Pages** - Admin functionality
   - User list, search, filter, CRUD operations
   - Estimated: 3-5 days

### ⚠️ Important: Thai Terminology

**Use correct Thai terms in UI:**

- ✅ **หน่วยงาน** (Department) - NOT "แผนก"
- ✅ **กลุ่มงาน** (Division) - NOT "กอง"
- ✅ **กลุ่มภารกิจ** (Mission Group)
- ✅ **โปรเจค** (Project)

**Organizational Hierarchy**: กลุ่มภารกิจ → กลุ่มงาน → หน่วยงาน → โปรเจค

---

**Recent Completions (2025-10-23):**
✅ **Authentication Complete**: All authentication pages implemented with email verification and password reset flow via Resend API. See `AUTHENTICATION_IMPLEMENTATION_COMPLETE.md` for details.
✅ **Password Reset Complete**: Full password reset flow with popover validation, strength meter, and real-time matching. See `PASSWORD_RESET_IMPLEMENTATION.md` for details.
✅ **Multi-Assignee System**: Tasks now support multiple assignees via `task_assignees` many-to-many table. API accepts `assigneeUserIds` array. Backward compatible with legacy `assigneeUserId` field. See `MULTI_ASSIGNEE_IMPLEMENTATION.md` for details.
✅ **Workspace API Complete**: Role-based hierarchical navigation API with **additionalRoles support**. See `src/app/api/workspace/route.ts` and `WORKSPACE_API_ADDITIONAL_ROLES_ISSUE.md` for details.
✅ **Breadcrumb Navigation Complete**: Multi-level interactive breadcrumb with popover selectors for navigation. See "Navigation Components" section below.
✅ **Workspace Navigation Complete**: Collapsible cards design with text wrapping and direct department navigation. See `WORKSPACE_NAVIGATION_REDESIGN.md` for details.
✅ **Department Tasks View Complete**: Full department-level task management with optimistic updates, project grouping, pinned tasks section, and consistent UI sizing (h-8 for all selectors). See "Department Tasks View" section below.
✅ **ADMIN Role Authentication Fix**: BYPASS_AUTH mode now fetches real user data from database. Use `BYPASS_USER_ID=admin001` for ADMIN testing. Created admin001 user via script.
✅ **Department Navigation Fix**: Department tasks view now uses URL query parameter (`?departmentId=`) for navigation. Breadcrumb and project selector update correctly when navigating between departments.
✅ **CreateTaskModal Project Selector Fix**: Modal now receives pre-filtered projects from parent component (simple pass-through pattern). Projects match breadcrumb selector.

## Commands

### Development

```bash
npm run dev              # Start dev server (default port 3000, may run on 3010)
PORT=3010 npm run dev    # Start dev server on specific port (recommended for testing)
npm run build            # Build for production
npm start                # Start production server
npm run lint             # Run ESLint
```

### Database

```bash
npm run prisma:generate  # Generate Prisma Client (REQUIRED after schema changes)
npm run prisma:push      # Push schema to database
npm run prisma:studio    # Open Prisma Studio (database GUI)
npm run prisma:reset     # Reset database (force push)
npm run seed             # Seed database with test data
```

### Testing

```bash
npm test                           # Run automated API test suite
node tests/api/test-runner.js      # Run API tests directly
```

**Test Environment:**

- Dev server must be running on port 3010
- Database must be seeded with test data from `prisma/seed.sql`
- Test credentials: `admin@hospital.test` / `SecurePass123!`
- For development: Set `BYPASS_AUTH=true` in `.env` to skip authentication
- Use `BYPASS_USER_ID=admin001` to test as ADMIN role, or `BYPASS_USER_ID=user001` for LEADER role (default: user001)

### Migration

```bash
npm run migrate          # Migrate data from old system (if needed)
```

## Architecture

### Database Schema (21 Tables)

The database uses Prisma ORM with PostgreSQL. **Key architectural decisions:**

1. **Soft Deletes**: All major entities use `deletedAt` or `dateDeleted` fields instead of hard deletes
2. **Hierarchical Organization**: MissionGroup → Division → Department → Users
3. **Custom Prisma Output**: Generated client is in `src/generated/prisma` (not default location)
4. **JSON Fields**: Used for flexible data (e.g., `pinnedTasks`, `additionalRoles`, `mentions`)

**Import Prisma Client:**

```typescript
import { prisma } from "@/lib/db";
```

**Additional API Endpoints:**

Beyond the original 71 documented endpoints, these have been added:

- **GET /api/workspace** - Returns workspace structure based on user role + additionalRoles
- **GET /api/departments/[departmentId]/tasks** - Returns all tasks in a department with project grouping
- **POST /api/tasks/bulk-update** - Batch update multiple tasks at once

**Current Total: 74 API endpoints** (71 original + 3 new)

**⚠️ Known Issues:**

1. **Workspace API - Additional Roles Support** (Priority: 🔴 **CRITICAL HIGH**)
   - **Issue**: Users with `additionalRoles` field only see data from their primary role
   - **Impact**: Multi-role users (e.g., Chief in MG A + Member in MG B) cannot access all authorized data
   - **Severity**: **BLOCKS multi-role user functionality** - affects ~20-30% of users in typical healthcare org
   - **Status**: Implementation plan documented, ready to fix (~2-3 hours)
   - **Details**: See `WORKSPACE_API_ADDITIONAL_ROLES_ISSUE.md`
   - **Fix Required**: Implement `getUserAccessibleScope()` function from GAS system
   - **⚠️ MUST FIX before deployment**

**Core Schema Patterns:**

- **Users**: 6-level role hierarchy (ADMIN → CHIEF → LEADER → HEAD → MEMBER → USER)
- **Projects**: Belong to departments, have custom workflow statuses
- **Tasks**: Support subtasks, checklists, comments with @mentions, priority 1-4
- **Task Assignees**: Many-to-many relationship (tasks can have multiple assignees) via `task_assignees` table
- **Sessions**: Bearer token authentication with 7-day expiry
- **Notifications**: Real-time system with typed events
- **History**: Task activity logging (NOT ActivityLog - use `prisma.history`)

### API Routes (71 Endpoints)

All API routes follow a **consistent pattern** using middleware wrappers:

```typescript
import { withAuth } from '@/lib/api-middleware';
import { successResponse, errorResponse } from '@/lib/api-response';
import { checkPermission } from '@/lib/permissions';

async function handler(req: AuthenticatedRequest, { params }: { params: ParamsType }) {
  // 1. Check permissions
  const hasAccess = await checkPermission(req.session.userId, 'permission_name', { context });
  if (!hasAccess) return errorResponse('FORBIDDEN', 'No access', 403);

  // 2. Perform database operations
  const data = await prisma.model.findUnique({ where: { ... } });
  if (!data) return errorResponse('NOT_FOUND', 'Resource not found', 404);

  // 3. Return success response
  return successResponse(data);
}

export const GET = withAuth(handler);
```

**Critical Performance Endpoints:**

- **`/api/projects/[projectId]/board`**: Single-query board view (no N+1 queries) - used by Board, Calendar, and List views
- **`/api/batch`**: Batch operations endpoint (up to 100 operations)
- **`/api/projects/progress/batch`**: Batch progress calculation (up to 50 projects)

**Authentication:**

- All routes (except auth endpoints) require Bearer token: `Authorization: Bearer {sessionToken}`
- Use `withAuth()` middleware to automatically attach `req.session` object
- For testing: Set `BYPASS_AUTH=true` in `.env` to use mock session (auto-creates session for user001)

**Permission System:**

- Use `checkPermission(userId, permission, context)` for granular access control
- Context includes: `projectId`, `taskId`, `departmentId`, `targetUserId`
- Permissions cascade through organizational hierarchy (CHIEF can access entire Mission Group)

### Frontend Architecture

**Current Implementation Status: (~50% Complete)**

**✅ Complete (15 major components):**

**Core Infrastructure (3):**

- ✅ Layout System (Navbar, Sidebar, Footer with sync animation)
- ✅ Theme System (Light/Dark mode with next-themes)
- ✅ Session Management (AuthGuard, token storage, auto-redirect)

**Authentication Pages (5):** ✅ **COMPLETE 2025-10-23**

- ✅ Login Page (with "Remember Me" and validation)
- ✅ Registration Page (with password strength indicator)
- ✅ Email Verification Page (auto-verify + resend option)
- ✅ Forgot Password Page (request reset link)
- ✅ Reset Password Page (with popover validation, strength meter, real-time matching)

**Project Views (3):**

- ✅ Board View (Kanban with drag-and-drop)
- ✅ Calendar View (FullCalendar v6)
- ✅ List View (Table with sorting/filtering)

**Advanced Features (7):**

- ✅ Task Detail Panel (Full CRUD with 11 optimistic mutations)
- ✅ Workspace API (Hierarchical navigation by role)
- ✅ Workspace Navigation (Collapsible cards with icons, text wrapping, direct department navigation)
- ✅ Interactive Breadcrumb Navigation (Popover selectors for all hierarchy levels) ✨ **NEW 2025-10-23**
- ✅ Navigation Store (Zustand store for breadcrumb state management) ✨ **NEW 2025-10-23**
- ✅ Department Toolbar (Breadcrumb + Create Task button) ✨ **NEW 2025-10-23**
- ✅ Project Toolbar (Reusable toolbar for project views)

**⚠️ Partially Complete:**

- ⚠️ Dashboard Page (Layout only, mock data)
- ⚠️ Create Task Modal (Component structure complete, needs integration testing)

**❌ Not Yet Implemented (~37+ components):**

- ❌ User Management Pages
- ❌ Reports/Analytics
- ❌ Dashboard Widgets
- ❌ Management Pages
- ❌ Modals & Dialogs (7 remaining)
- ❌ Selectors (9 types)
- ❌ Advanced Features (10+ features)

**State Management Strategy:**

1. **Server State (React Query)**: All server data managed via `@tanstack/react-query`
   - Query keys are organized hierarchically (see `src/hooks/use-*.ts`)
   - Stale time: 2-5 minutes depending on data type
   - **Single source of truth**: Never duplicate server data in local state

2. **Client State (Zustand)**: UI-only state
   - `useAppStore`: Current view, project selection
   - `useUIStore`: Modals, panels, task selection
   - `useSyncStore`: Sync animation state

3. **URL State (Next.js Router)**: Route parameters and search params

**Key Frontend Patterns:**

1. **Optimistic Updates** (Standard Pattern - See `OPTIMISTIC_UPDATE_PATTERN.md`):

   ```typescript
   import { useSyncMutation } from "@/lib/use-sync-mutation";

   const mutation = useSyncMutation({
     mutationFn: ({ id, data }) => api.patch(`/api/resource/${id}`, data),
     onMutate: async ({ id, data }) => {
       // Cancel outgoing refetches
       await queryClient.cancelQueries({ queryKey: keys.detail(id) });

       // Save previous data
       const previousData = queryClient.getQueryData(keys.detail(id));

       // Update cache immediately (instant UI update)
       queryClient.setQueryData(keys.detail(id), (old: any) => ({
         ...old,
         ...data,
       }));

       return { previousData };
     },
     onError: (error, { id }, context) => {
       // Rollback on error
       if (context?.previousData) {
         queryClient.setQueryData(keys.detail(id), context.previousData);
       }
     },
     onSettled: (response) => {
       // Sync with server
       if (response?.resource) {
         queryClient.invalidateQueries({
           queryKey: keys.detail(response.resource.id),
         });
       }
     },
   });
   ```

   **Use this pattern for ALL interactive UI updates** (drag-and-drop, toggle actions, form submissions).

2. **Query Keys Pattern**:

   ```typescript
   export const resourceKeys = {
     all: ["resources"] as const,
     lists: () => [...resourceKeys.all, "list"] as const,
     list: (filters: any) => [...resourceKeys.lists(), filters] as const,
     details: () => [...resourceKeys.all, "detail"] as const,
     detail: (id: string) => [...resourceKeys.details(), id] as const,
   };
   ```

3. **API Client** (`src/lib/api-client.ts`):

   ```typescript
   import { api } from "@/lib/api-client";

   // Automatically handles:
   // - Adding Bearer token from localStorage
   // - Parsing JSON responses
   // - Extracting .data field from { success: true, data: {...} }
   const data = await api.get<{ resource: Resource }>("/api/resource");
   ```

4. **Component Organization**:
   ```
   src/
   ├── app/
   │   ├── (dashboard)/              # Protected routes with dashboard layout
   │   │   ├── dashboard/page.tsx    # Dashboard (mock data)
   │   │   └── projects/[projectId]/ # Project views
   │   │       ├── board/page.tsx    # Kanban board
   │   │       ├── calendar/page.tsx # Calendar view
   │   │       └── list/page.tsx     # List/table view
   │   ├── (auth)/                   # Authentication pages (login, register, verify-email, etc.)
   │   └── api/                      # API routes (71 endpoints)
   ├── components/
   │   ├── layout/                   # Navbar, Sidebar, ProjectToolbar, Footer
   │   ├── navigation/               # WorkspaceNavigation, Breadcrumb (NEW 2025-10-23)
   │   ├── views/                    # BoardView, CalendarView, ListView
   │   ├── task-panel/               # TaskPanel component (v1.0 complete)
   │   ├── common/                   # Reusable components (TaskCard, UserAvatar)
   │   └── ui/                       # shadcn/ui components
   ├── hooks/                        # React Query hooks (use-projects.ts, use-tasks.ts)
   ├── stores/                       # Zustand stores (app, ui, sync)
   ├── lib/                          # Utilities (api-client, auth, permissions, etc.)
   └── types/                        # TypeScript types
   ```

**Theme System:**

- Uses `next-themes` with `ThemeProvider`
- Access theme: `const { theme, setTheme } = useTheme();`
- Dark mode colors defined in `src/lib/calendar-colors.ts` for calendar view

**View Components:**

- **Board View**: Kanban board with drag-and-drop (uses `@hello-pangea/dnd`)
- **Calendar View**: FullCalendar v6 with Thai locale, priority-based colors, always-visible grid (no empty state)
- **List View**: Table with sorting (6 fields), filtering (5 filters), bulk actions
- **Task Panel**: Slide-out panel with 3 tabs (Details, Comments, History) and 11 optimistic mutations
- All views share the same `ProjectToolbar` and `TaskFilterBar` components with optimistic updates

**Shared Filter System:** ✨ **NEW 2025-10-23**

- **TaskFilterBar**: Unified filter component across Board, Calendar, and List views
  - **Features**: Search, Status filter, Priority filter, Assignee filter, Hide closed tasks switch
  - **Persistence**: Hide closed tasks setting persists in localStorage across sessions
  - **Filter Logic**: Centralized `filterTasks()` function in `src/components/views/common/filter-tasks.ts`
  - **State Management**: `usePersistedFilters()` hook manages filter state with localStorage
  - **Storage Key**: `projectflow_task_filters` (only `hideClosed` persists, other filters reset on refresh)
  - **Files**:
    - `src/components/views/common/task-filter-bar.tsx` - Filter bar UI component
    - `src/components/views/common/filter-tasks.ts` - Filtering logic and helpers
    - `src/hooks/use-persisted-filters.ts` - localStorage persistence hook

**Navigation Components:** ✨ **UPDATED 2025-10-23**

- **WorkspaceNavigation**: Collapsible cards with icons for hierarchical navigation
  - **Design**: Replaces old tree view with modern card-based UI
  - **Hierarchy**: Mission Group (🎯) → Division (💼) → Department (🏢) → Project (📁)
  - **Features**: Badge counters, direct department navigation, smooth animations
  - **Text Handling**: Multi-line wrapping (no truncation) using `break-words` + proper flex layout
  - **Views**: Hierarchical (ADMIN/CHIEF/LEADER) and flat (MEMBER/HEAD/USER)
  - **File**: `src/components/navigation/workspace-navigation.tsx` (360 lines)

- **Breadcrumb**: Interactive multi-level breadcrumb with popover selectors
  - **Displays**: Full path from Mission Group → Division → Department → Project
  - **Interactive Navigation**: ChevronRight (`>`) buttons open popovers for:
    - After Mission Group → Select Division
    - After Division → Select Department
    - After Department → Select Project
  - **Features**:
    - Clickable breadcrumb items for navigation back to parent levels
    - Search functionality in all popover selectors
    - Auto-populates from workspace data and navigation store
    - Clean UI (text-only, no icons or status badges in popover)
  - **Integration**: Uses `useNavigationStore` and `useWorkspace` hook
  - **Files**:
    - `src/components/navigation/breadcrumb.tsx` (340+ lines)
    - `src/components/layout/department-toolbar.tsx` (passes workspace + projects)
    - `src/components/layout/project-toolbar.tsx` (passes workspace + projects)

**Department Tasks View:** ✨ **COMPLETE 2025-10-23**

- **DepartmentToolbar**: Toolbar component for department tasks view
  - **Layout**: Breadcrumb + Title + Create Task Button
  - **Data Loading**: Uses `useWorkspace()` hook to fetch hierarchical data
  - **Projects Extraction**: Flattens workspace hierarchy to get all projects for breadcrumb selector
  - **Project Pass-through**: Filters projects by current department and passes to both Breadcrumb and CreateTaskButton (simple pattern)
  - **File**: `src/components/layout/department-toolbar.tsx`

- **Department Tasks View**: Full department-level task management interface
  - **Route**: `/department/tasks?departmentId=DEPT-XXX` (uses URL query parameter)
  - **Status**: ✅ Complete with optimistic updates and project grouping
  - **Features**:
    - Interactive breadcrumb navigation (Mission Group > Division > Department > Project)
    - URL-based navigation (`?departmentId=`) for proper state management
    - Project grouping with expandable cards (collapsible sections)
    - Pinned tasks section at top
    - Task filtering and sorting (6 fields)
    - Bulk actions support
    - Task counts and statistics per project
    - Consistent UI sizing (h-8 for all selectors)
    - Optimistic updates for all interactions
    - All projects shown (empty projects collapsed by default, not hidden)
  - **Data Source**:
    - Uses `useDepartmentTasks()` hook
    - API: `GET /api/departments/[departmentId]/tasks` (includes missionGroup data)
  - **Navigation Store Population**: Auto-populates breadcrumb with department hierarchy
  - **CreateTaskModal Integration**: Modal receives pre-filtered projects from DepartmentToolbar (matches breadcrumb projects)
  - **Files**:
    - `src/app/(dashboard)/department/tasks/page.tsx` - Main page (reads departmentId from URL)
    - `src/components/views/department-tasks/` - View components
    - `src/components/layout/department-toolbar.tsx` - Toolbar with project filtering
    - `src/hooks/use-department-tasks.ts` - Data fetching hook

### Key Files to Know

**Backend:**

- `src/lib/auth.ts`: Session management, password hashing (SHA256+salt), token generation
- `src/lib/permissions.ts`: Role-based access control (6 roles, hierarchical permissions)
- `src/lib/api-middleware.ts`: `withAuth()`, `withPermission()`, `withRole()` wrappers
- `src/lib/api-response.ts`: Standard response format and error handling
- `src/lib/db.ts`: Prisma client singleton

**Frontend:**

- `src/lib/api-client.ts`: Axios-based API client with Bearer token injection
- `src/lib/use-sync-mutation.ts`: Custom React Query mutation hook with sync animation
- `src/hooks/use-projects.ts`: Project data fetching and mutations
- `src/hooks/use-tasks.ts`: Task data fetching and mutations (11 mutations)
- `src/hooks/use-workspace.ts`: Workspace hierarchy data fetching (hierarchical/flat views)
- `src/hooks/use-persisted-filters.ts`: Filter state persistence with localStorage ✨ **NEW**
- `src/stores/use-sync-store.ts`: Controls sync animation in footer
- `src/stores/use-ui-store.ts`: Controls task panel and modals
- `src/stores/use-navigation-store.ts`: Navigation state management (breadcrumb population) ✨ **NEW**
- `src/components/navigation/workspace-navigation.tsx`: Workspace navigation with collapsible cards ✨ **NEW**
- `src/components/navigation/breadcrumb.tsx`: Multi-level breadcrumb with project selector ✨ **NEW**
- `src/components/views/common/task-filter-bar.tsx`: Shared filter bar component ✨ **NEW**
- `src/components/views/common/filter-tasks.ts`: Centralized filtering logic ✨ **NEW**

**Configuration:**

- `prisma/schema.prisma`: Database schema (21 tables)
- `next.config.js`: Custom Prisma client path alias
- `.env`: Database URL and environment variables (see below)

**Environment Variables (.env):**

```bash
# ===== REQUIRED =====
DATABASE_URL="postgresql://user:password@host:port/database?schema=public"
# Example: "postgresql://postgres:password@localhost:5432/projectflow?schema=public"
# For render.com: "postgresql://username:password@hostname.region.render.com:5432/database_name"

# ===== OPTIONAL - Development Only =====
BYPASS_AUTH=true              # Skip authentication (fetches real user from database)
BYPASS_USER_ID=admin001       # User ID for BYPASS_AUTH mode (default: user001 if not set)
                              # Use admin001 for ADMIN role testing, user001 for LEADER role
BYPASS_EMAIL=true             # Show email links in console instead of sending real emails
PORT=3010                     # Dev server port (default: 3000, but 3010 recommended to avoid conflicts)

# ===== OPTIONAL - Production Email (Resend API) =====
RESEND_API_KEY="re_..."              # Resend API key for email verification and password reset
RESEND_FROM_EMAIL="noreply@..."      # Sender email address (must be verified domain)
NEXT_PUBLIC_APP_URL="http://localhost:3010"  # Base URL for email links (change for production)
```

### Password Reset Flow ✅ **COMPLETE 2025-10-23**

**Complete implementation with 2 pages + email system:**

1. **Forgot Password Page** (`/forgot-password`):
   - User enters email address
   - Form validation (email format)
   - System generates reset token (64-char hex, expires in 1 hour)
   - Sends email with reset link (or shows in console if `BYPASS_EMAIL=true`)
   - Success state with instructions
   - Resend option available
   - Link back to login page

2. **Reset Password Page** (`/reset-password?token=...`):
   - **Token Validation:** Checks token validity and expiry on mount
   - **Three States:**
     - ❌ **Invalid Token:** Shows error with "Request new link" button
     - 📝 **Valid Token:** Shows password reset form
     - ✅ **Success:** Shows success message with auto-redirect to login

   - **Password Form Features:**
     - **Popover Validation** (shows on focus, position: right):
       - ✓ อย่างน้อย 8 ตัวอักษร
       - ✓ มีตัวพิมพ์เล็กและใหญ่ (a-Z)
       - ✓ มีตัวเลขอย่างน้อย 1 ตัว (0-9)
       - ✓ มีอักขระพิเศษอย่างน้อย 1 ตัว (!@#$)
     - **Password Strength Meter** (4 levels with colors):
       - 🔴 อ่อนแอ (25%) - Red
       - 🟠 พอใช้ (50%) - Orange
       - 🟡 ดี (75%) - Yellow
       - 🟢 ปลอดภัย (100%) - Green
     - **Real-time Password Matching:**
       - ✅ Green checkmark when passwords match
       - ❌ Red cross when passwords don't match
       - Text indicator below confirm field
     - **Form Validation:** Zod schema with all password requirements

   - **UX Features:**
     - Dark mode support
     - Smooth animations (popover, strength bar)
     - Loading states during submission
     - Clear error messages
     - Auto-redirect after 3 seconds on success

3. **Email System:**
   - **Development Mode** (`BYPASS_EMAIL=true`):
     - Shows reset link in console with formatted output
     - No actual email sent (for testing)
   - **Production Mode:**
     - Sends HTML email via Resend API
     - Beautiful template with reset button
     - 1-hour expiry notice
     - Thai language content

**Files:**

- `src/app/(auth)/forgot-password/page.tsx` - Forgot password page (NEW)
- `src/app/(auth)/reset-password/page.tsx` - Reset password page (REDESIGNED)
- `src/app/api/auth/request-reset/route.ts` - Request reset API (UPDATED)
- `src/app/api/auth/reset-password/route.ts` - Reset password API (existing)
- `src/lib/email.ts` - Email functions with BYPASS_EMAIL mode (UPDATED)

**API Endpoints:**

- `POST /api/auth/request-reset` - Request password reset (send email)
- `POST /api/auth/reset-password` - Reset password with token

**Security Features:**

- Token stored in database (not hashed, but expires)
- Token expires after 1 hour
- All existing sessions invalidated after password reset
- Token can only be used once (cleared after use)
- Password requirements enforced (client + server)

**Documentation:**

- `PASSWORD_RESET_IMPLEMENTATION.md` - Complete implementation guide
- `EMAIL_SETUP_GUIDE.md` - Email configuration and troubleshooting

### Error Handling

**API Errors:**

```typescript
// Throw errors that will be caught by handleApiError()
throw new ApiError("CUSTOM_CODE", "Error message", 400, { details });

// Or use predefined responses
return ErrorResponses.unauthorized();
return ErrorResponses.forbidden();
return ErrorResponses.notFound("Resource name");
return ErrorResponses.badRequest("Message");
```

**Client Errors:**

```typescript
// React Query automatically catches errors
// Display errors in UI with appropriate messages
mutation.mutate(data, {
  onError: (error) => {
    console.error("Operation failed:", error);
    // TODO: Show error toast/alert to user (toast component not yet implemented)
  },
});
```

### Testing

**API Testing:**

- Test suite in `tests/api/test-runner.js` (Node.js)
- Test documentation in `tests/api/phase*-test.md` (6 phases)
- Test data seeded via `prisma/seed.sql`
- Current status: 20/26 tests passing (76.9%)

**Test Credentials:**

```
Email: admin@hospital.test
Password: SecurePass123!
User ID: user001
```

**Running Tests:**

1. Ensure dev server is running on port 3010
2. Database must be seeded with test data
3. Run: `npm test`

## Important Notes

### Soft Delete Pattern

Never use `.delete()` - always use `.update()` with `deletedAt` or `dateDeleted`:

```typescript
// ❌ WRONG
await prisma.task.delete({ where: { id } });

// ✅ CORRECT
await prisma.task.update({
  where: { id },
  data: { deletedAt: new Date() },
});
```

### Prisma Client Location

The Prisma client is generated to a custom location. After schema changes:

```bash
npm run prisma:generate  # Always run this after schema changes
```

### Date Handling

- **Database**: Store as `DateTime` (Prisma type)
- **API Response**: Return as ISO string `.toISOString()`
- **API Input**: Accept ISO strings, parse with `new Date()`
- **Display**: Use `date-fns` for formatting (Thai locale supported)

### Common Pitfalls

1. **Always run `npm run prisma:generate` after schema changes** - The custom Prisma client location means you must regenerate
2. **Check port 3010** - Dev server may not run on default port 3000 (conflict with other apps)
3. **Use soft deletes** - Never use `.delete()`, always use `.update()` with `deletedAt`/`dateDeleted`
4. **Import Prisma correctly** - Always use `import { prisma } from "@/lib/db"` (not from @prisma/client)
5. **Optimistic updates everywhere** - All interactive UI must use the optimistic update pattern (see OPTIMISTIC_UPDATE_PATTERN.md)
6. **Navigation state management** - Use `useNavigationStore` for breadcrumb state (don't rely on URL only)
7. **BYPASS_AUTH for testing** - Set `BYPASS_AUTH=true` in `.env` to skip authentication during development
8. **Use `prisma.history` NOT `prisma.activityLog`** - The model is called `History` in the schema, not `ActivityLog`
9. **Multi-assignee system** - Use `assigneeUserIds` array in API calls, not singular `assigneeUserId` (legacy field kept for backward compatibility but avoid using it for new code)

## 🔧 Common Workflows

### Adding a New View (Board/Calendar/List Pattern)

When adding a new view component, follow this established pattern:

1. **Create the page component** (`src/app/(dashboard)/[route]/page.tsx`):

   ```typescript
   // Minimal page that renders view component
   export default function NewViewPage() {
     return <NewViewComponent />;
   }
   ```

2. **Create the view component** (`src/components/views/new-view/new-view.tsx`):

   ```typescript
   import { useProject } from "@/hooks/use-projects";
   import { useTasks } from "@/hooks/use-tasks";

   export function NewView() {
     const { data: project } = useProject(projectId);
     const { data: tasks } = useTasks(projectId);

     return (
       <div className="h-full flex flex-col">
         <ProjectToolbar /> {/* Reuse existing toolbar */}
         {/* Your view implementation */}
       </div>
     );
   }
   ```

3. **Implement optimistic updates** for all interactions:

   ```typescript
   import { useSyncMutation } from "@/lib/use-sync-mutation";

   const updateMutation = useSyncMutation({
     mutationFn: ({ id, data }) => api.patch(`/api/tasks/${id}`, data),
     onMutate: async ({ id, data }) => {
       // Cancel outgoing refetches
       await queryClient.cancelQueries({ queryKey: taskKeys.detail(id) });

       // Save previous data for rollback
       const previousData = queryClient.getQueryData(taskKeys.detail(id));

       // Optimistically update cache
       queryClient.setQueryData(taskKeys.detail(id), (old: any) => ({
         ...old,
         ...data,
       }));

       return { previousData };
     },
     onError: (error, { id }, context) => {
       // Rollback on error
       if (context?.previousData) {
         queryClient.setQueryData(taskKeys.detail(id), context.previousData);
       }
     },
     onSettled: () => {
       // Refetch to ensure consistency
       queryClient.invalidateQueries({ queryKey: taskKeys.all });
     },
   });
   ```

4. **Add loading and error states**:
   ```typescript
   if (isLoading) return <LoadingSkeleton />;
   if (error) return <ErrorState error={error} />;
   if (!data) return <EmptyState />;
   ```

**Reference implementations**: Board View, Calendar View, List View

---

### Adding a New API Endpoint

All API endpoints follow the same pattern using middleware:

1. **Create route file** (`src/app/api/[resource]/route.ts`):

   ```typescript
   import { withAuth } from "@/lib/api-middleware";
   import { successResponse, errorResponse } from "@/lib/api-response";
   import { checkPermission } from "@/lib/permissions";
   import { prisma } from "@/lib/db";

   async function handler(req: AuthenticatedRequest) {
     const userId = req.session.userId;

     // 1. Check permissions
     const hasAccess = await checkPermission(userId, "resource.read", {
       resourceId: req.params.id,
     });
     if (!hasAccess) {
       return errorResponse("FORBIDDEN", "No access to resource", 403);
     }

     // 2. Perform database operation
     const data = await prisma.resource.findUnique({
       where: { id: req.params.id },
     });

     if (!data) {
       return errorResponse("NOT_FOUND", "Resource not found", 404);
     }

     // 3. Return success response
     return successResponse(data);
   }

   export const GET = withAuth(handler);
   ```

2. **Add TypeScript types** (`src/types/index.ts`):

   ```typescript
   export interface Resource {
     id: string;
     name: string;
     // ... other fields
   }
   ```

3. **Create React Query hook** (`src/hooks/use-resource.ts`):

   ```typescript
   import { useQuery } from "@tanstack/react-query";
   import { api } from "@/lib/api-client";

   export const resourceKeys = {
     all: ["resources"] as const,
     detail: (id: string) => [...resourceKeys.all, "detail", id] as const,
   };

   export function useResource(id: string) {
     return useQuery({
       queryKey: resourceKeys.detail(id),
       queryFn: async () => {
         const response = await api.get(`/api/resources/${id}`);
         return response.data.resource;
       },
       enabled: !!id,
     });
   }
   ```

**Reference**: Existing API routes in `src/app/api/`

---

### Testing Changes Locally

1. **Start development server**:

   ```bash
   PORT=3010 npm run dev
   ```

2. **Test API endpoints** (use test credentials):

   ```bash
   # Login first to get session token
   curl -X POST http://localhost:3010/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@hospital.test","password":"SecurePass123!"}'

   # Use token for authenticated requests
   curl http://localhost:3010/api/endpoint \
     -H "Authorization: Bearer {token}"
   ```

3. **Test with BYPASS_AUTH** (development only):

   ```bash
   # Add to .env
   BYPASS_AUTH=true

   # Now all API requests auto-authenticate as user001
   curl http://localhost:3010/api/endpoint
   ```

4. **Check database state**:

   ```bash
   npm run prisma:studio
   ```

5. **Run automated tests**:
   ```bash
   npm test
   ```

---

### Troubleshooting Common Issues

#### Server Won't Start

**Symptom**: `Error: listen EADDRINUSE :::3000`

**Solution**:

```bash
# Option 1: Use different port
PORT=3010 npm run dev

# Option 2: Kill process on port 3000 (Windows)
taskkill /F /PID <PID>

# Option 3: Kill process on port 3000 (Unix)
kill -9 <PID>
```

---

#### Prisma Client Errors

**Symptom**: `Cannot find module '@prisma/client'` or `PrismaClient is not a constructor`

**Solution**:

```bash
# Regenerate Prisma client (REQUIRED after schema changes)
npm run prisma:generate

# If still fails, delete and regenerate
rm -rf src/generated/prisma
npm run prisma:generate
```

---

#### Authentication Issues

**Symptom**: `401 Unauthorized` on all API requests

**Solution**:

```bash
# Option 1: Use bypass mode for development
# Add to .env:
BYPASS_AUTH=true

# Option 2: Check session token
# Make sure you're sending the token:
# Authorization: Bearer {sessionToken}

# Option 3: Re-login to get fresh token
curl -X POST http://localhost:3010/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hospital.test","password":"SecurePass123!"}'
```

---

#### Database Connection Issues

**Symptom**: `Can't reach database server` or `Connection timeout`

**Solution**:

```bash
# 1. Check DATABASE_URL in .env
# Should be: postgresql://user:password@host:port/database

# 2. Test database connection
npm run prisma:studio

# 3. Push schema if database is empty
npm run prisma:push

# 4. Seed database with test data
npx prisma db execute --file ./prisma/seed.sql --schema ./prisma/schema.prisma
```

---

#### Hot Reload Not Working

**Symptom**: Changes don't appear in browser after editing files

**Solution**:

```bash
# 1. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)

# 2. Clear Next.js cache and restart
rm -rf .next
npm run dev

# 3. If using WSL, check file watchers limit
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

---

#### Type Errors After Prisma Schema Changes

**Symptom**: TypeScript errors about missing/wrong types

**Solution**:

```bash
# Always regenerate Prisma client after schema changes
npm run prisma:generate

# Restart TypeScript server in VS Code
# Cmd+Shift+P > "TypeScript: Restart TS Server"
```

---

### Quick Reference: Environment Variables

```bash
# Required
DATABASE_URL="postgresql://user:password@host:port/database"

# Development shortcuts
BYPASS_AUTH=true              # Skip authentication (auto user001 session)
BYPASS_EMAIL=true             # Show email links in console
PORT=3010                     # Dev server port

# Production (email)
RESEND_API_KEY="re_..."      # Resend API key
RESEND_FROM_EMAIL="noreply@example.com"
NEXT_PUBLIC_APP_URL="http://localhost:3010"
```

### Migration Context

This project is migrating from Google Apps Script. Some naming conventions and patterns are preserved for backward compatibility:

- Field names like `dateDeleted` (instead of `deletedAt`) in some models (inconsistent usage)
- Priority levels 1-4 (1 = Urgent, 2 = High, 3 = Normal, 4 = Low)
- Color schemes matching the original GAS implementation
- Thai language UI text

### Performance Considerations

1. **Project Board Endpoint**: Critical path - must load in < 200ms
   - Uses single query with all includes
   - Returns calculated fields to avoid client-side computation

2. **Batch Operations**: Use `/api/batch` endpoint for bulk updates
   - Supports up to 100 operations
   - 6-10x faster than individual requests

3. **React Query Stale Time**: Set appropriately per data type
   - User data: 5 minutes (rarely changes)
   - Task data: 2 minutes (moderate change)
   - Notifications: 1 minute (frequent updates)

4. **Optimistic Updates**: ALL interactive UI uses optimistic updates for instant feedback
   - Task drag-and-drop: < 50ms response time
   - Form field changes: instant visual update
   - Automatic rollback on error

### Seeding the Database

To seed the database with test data:

```bash
# Option 1: SQL seed file (recommended)
npx prisma db execute --file ./prisma/seed.sql --schema ./prisma/schema.prisma

# Option 2: Manual via Prisma Studio
npm run prisma:studio
# Then manually create test data
```

**Note:** The TypeScript seed script (`prisma/seed.ts`) exists but may have compilation issues. Use SQL seed file for now.

## Documentation

Comprehensive documentation is available:

**Main Documentation:**

- `README.md`: Project overview and quick start
- `PROJECT_STATUS.md`: Current progress and detailed status (MUST READ for current state)
- `AUTHENTICATION_IMPLEMENTATION_COMPLETE.md`: Authentication system complete summary
- `PASSWORD_RESET_IMPLEMENTATION.md`: Password reset flow implementation guide
- `EMAIL_SETUP_GUIDE.md`: Email configuration and troubleshooting guide

**Frontend Development:**

- `OPTIMISTIC_UPDATE_PATTERN.md`: Standard pattern for UI updates (600+ lines, MUST READ)
- `SYNC_ANIMATION_SYSTEM.md`: Sync footer animation system
- `PROGRESS_PHASE2.1_BOARD_VIEW.md`: Board view implementation details
- `PROGRESS_PHASE2.2_CALENDAR_VIEW.md`: Calendar view implementation details
- `PROGRESS_PHASE2.3_LIST_VIEW.md`: List view implementation details
- `TASK_PANEL_V1.0_COMPLETE.md`: Task panel completion summary
- `TASK_PANEL_DEVELOPMENT_PLAN.md`: Original development plan
- `TASK_PANEL_PROGRESS_PHASE1-3.md`: Development progress tracking
- `TASK_PANEL_INTEGRATION_COMPLETE.md`: Integration details
- `TASK_PANEL_TESTING_GUIDE.md`: Testing guide

**Migration Plans:**

- `migration_plan/01_DATABASE_MIGRATION.md`: Database schema and migration
- `migration_plan/02_API_MIGRATION.md`: API endpoints and implementation
- `migration_plan/03_FRONTEND_MIGRATION_COMPLETE.md`: Full frontend component breakdown
- `migration_plan/05_ROLLOUT_PLAN.md`: Deployment and rollout strategy

**API Testing:**

- `tests/api/phase1-test.md`: Authentication & User APIs
- `tests/api/phase2-test.md`: Organization Structure APIs
- `tests/api/phase3-test.md`: Projects & Statuses APIs
- `tests/api/phase4-test.md`: Task Management APIs
- `tests/api/phase5-test.md`: Notifications & Activities APIs
- `tests/api/phase6-test.md`: Batch Operations & Optimization
- `TESTING_SUMMARY.md`: Overall testing status

**Future Features (Planning):**

- `NEXT_GOAL_DEPARTMENT_TASKS.md`: Next implementation goal (Department Tasks View)
- `DEPARTMENT_TASKS_VIEW_DESIGN.md`: Department tasks view design
- `DEPARTMENT_TASKS_GANTT_CHART_DESIGN.md`: Gantt chart implementation plan
- `DEPARTMENT_TASKS_CUSTOM_GROUPING_DESIGN.md`: Custom task grouping design
- `DEPARTMENT_TASKS_DEPENDENCIES.md`: Task dependencies implementation

## Migration from Google Apps Script

When implementing features, reference the original GAS implementation to maintain consistency:

- Color schemes (especially priority colors)
- Permission logic and role hierarchy
- Business logic for progress calculation
- Notification types and triggers
- Thai language text and formatting

See `migration_plan/` directory for detailed migration documentation.

---

## 🚀 Quick Start for New Claude Instances

If you're a new Claude instance working on this project, start here:

### ⚠️ Critical Information First

**PROJECT STATUS:**

- ✅ Backend: 100% Complete (74 API endpoints, database, auth)
- 🔄 Frontend: ~50% Complete (15/50+ components done)
- ❌ **NOT READY FOR DEPLOYMENT** - Still in active development
- 🎯 Estimated completion: 2025-12-15 (8 weeks remaining)

**KNOWN CRITICAL BUGS:**

- 🔴 **Workspace API Additional Roles** - Multi-role users can't access all authorized data (see line 129)
- ⚠️ Must fix before deployment

### First, Understand the Context (5 minutes)

1. **Read this section** (you're doing it now!)
2. **Check "Next Steps"** section above for current priorities
3. **Review "Known Issues"** section for bugs to avoid

### Then, Check What You're Being Asked To Do

**If asked to implement a new feature:**

1. Check if design exists in `NEXT_GOAL_DEPARTMENT_TASKS.md` or other design docs
2. Follow the "Common Workflows" section patterns
3. Use optimistic updates for all interactive UI
4. Reference existing views (Board/Calendar/List) for consistency

**If asked to fix a bug:**

1. Check "Known Issues" section - it might already be documented
2. Check "Troubleshooting Common Issues" for quick fixes
3. Read related `.md` files for context (e.g., `WORKSPACE_API_ADDITIONAL_ROLES_ISSUE.md`)

**If asked to add an API endpoint:**

1. Follow the API endpoint pattern in "Common Workflows"
2. Use `withAuth()` middleware
3. Check permissions with `checkPermission()`
4. Return standardized responses (`successResponse()`, `errorResponse()`)

**If asked about the codebase:**

1. Check `PROJECT_STATUS.md` for current progress
2. Check documentation files listed in "Documentation" section
3. Read the Prisma schema (`prisma/schema.prisma`) for database structure

### Key Things to Remember

1. **⚠️ NOT production-ready** - Frontend ~50% complete, don't attempt deployment
2. **🔴 Critical bug exists** - Workspace API Additional Roles must be fixed first
3. **Port 3010** - Dev server runs here (not 3000)
4. **BYPASS_AUTH=true** - Use this in `.env` for quick testing
5. **Always run `npm run prisma:generate`** after schema changes
6. **Optimistic updates everywhere** - See `OPTIMISTIC_UPDATE_PATTERN.md`
7. **Thai terminology matters** - Use correct terms (หน่วยงาน not แผนก)
8. **Soft deletes only** - Never use `.delete()`, use `.update()` with `deletedAt`
9. **Navigation components are NEW** - Breadcrumb and workspace navigation added on 2025-10-23
10. **Department Tasks is COMPLETE** - Full implementation with optimistic updates (completed 2025-10-23)
11. **Multi-assignee system** - Tasks support multiple assignees via `task_assignees` table (breaking change from single assignee)

### Most Important Files to Know

**For Backend Work:**

- `src/lib/auth.ts` - Authentication
- `src/lib/permissions.ts` - Authorization
- `src/lib/api-middleware.ts` - Middleware
- `src/app/api/*/route.ts` - API endpoints

**For Frontend Work:**

- `src/hooks/use-*.ts` - React Query hooks
- `src/stores/use-*-store.ts` - Zustand stores
- `src/components/views/*` - View components
- `OPTIMISTIC_UPDATE_PATTERN.md` - Critical pattern to follow

**For Understanding the Project:**

- `PROJECT_STATUS.md` - Current progress
- `NEXT_GOAL_DEPARTMENT_TASKS.md` - Next major feature
- `migration_plan/` - Architecture decisions

### When In Doubt

1. **Look for existing patterns** - We have 74 API endpoints and 3 complete project views
2. **Read the relevant `.md` file** - We have excellent documentation
3. **Check GAS implementation** - `old_project/` folder has original code
4. **Ask the user** - Better to clarify than assume

---

## 📝 Recent Changes (Changelog)

### 2025-10-23 (Latest - Part 4) ✨ **NEW**

- ✅ **ADMIN Role Authentication Fix** - BYPASS_AUTH now fetches real user data from database
  - Modified `src/lib/api-middleware.ts` to use `BYPASS_USER_ID` env variable
  - Created admin001 user via `scripts/create-admin-user.ts`
  - ADMIN users can now access all 9 Mission Groups and 72 Departments
- ✅ **Department Navigation Fix** - Department tasks view uses URL query parameter
  - Page reads `departmentId` from `?departmentId=DEPT-XXX` query param
  - Breadcrumb and workspace navigation update correctly when navigating between departments
  - Navigation state no longer tied to user's primary department
- ✅ **Project Display Fix** - All projects now visible (not hidden when empty)
  - Removed hiding logic from department tasks view
  - Empty projects collapse by default (can be expanded)
  - Shows empty state message: "ไม่มีงานที่ตรงกับตัวกรอง"
- ✅ **CreateTaskModal Project Selector Fix** - Simple pass-through pattern
  - DepartmentToolbar filters projects by department
  - Passes filtered projects to both Breadcrumb AND CreateTaskButton
  - Modal uses pre-filtered projects (matches breadcrumb)
  - Removed complex cache fallback logic

### 2025-10-23 (Part 3)

- ✅ **Calendar View Improvements** - Removed empty state, calendar always visible
- ✅ **FullCalendar Styling** - Rounded corners, muted button colors, shadcn/ui design system integration
- ✅ **AssigneePopover Size Variants** - Added size prop (sm/md/lg) for consistent UI sizing
- ✅ **Create Task Modal Fixes** - Fixed duplicate status label and excessive padding
- ✅ **Shared Filter System** - Unified TaskFilterBar across Board, Calendar, and List views
- ✅ **Filter Persistence** - Hide closed tasks switch persists in localStorage via usePersistedFilters hook

### 2025-10-23 (Part 2)

- ✅ **Multi-Assignee System Complete** - Tasks now support multiple assignees (breaking change fixed!)
  - Added `task_assignees` table (many-to-many relationship)
  - Updated API endpoints to accept `assigneeUserIds` array
  - Backward compatible with legacy `assigneeUserId` field
  - Frontend already supported it - no changes needed!
  - See `MULTI_ASSIGNEE_IMPLEMENTATION.md` for full details

### 2025-10-23 (Part 1)

- ✅ Added interactive breadcrumb navigation with popover selectors
- ✅ Completed workspace navigation with collapsible cards design
- ✅ Created navigation store (Zustand) for breadcrumb state management
- ✅ Added department toolbar component
- ⚠️ Started department tasks page (basic structure only)
- ✅ Updated API count to 74 endpoints (added workspace, department tasks, bulk update)

### 2025-10-22

- ✅ Completed authentication system (5 pages)
- ✅ Completed password reset flow with popover validation
- ✅ Added email system with BYPASS_EMAIL mode
- ✅ Completed task detail panel v1.0

### 2025-10-21

- ✅ Completed Phase 2: API Migration (71 endpoints)
- ✅ Completed all 3 project views (Board, Calendar, List)
- ✅ Established optimistic update pattern

---

## ⚠️ DEPLOYMENT CHECKLIST (Before Production)

**Backend (100% Complete):** ✅

- [x] 74 API endpoints implemented and tested
- [x] Database schema complete (21 tables)
- [x] Authentication & authorization system
- [x] Permission system with 6 roles

**Frontend (~50% Complete):** 🔄

- [x] Core infrastructure (Layout, Theme, Auth)
- [x] 3 Project views (Board, Calendar, List)
- [x] Task detail panel
- [ ] Create Task Modal ⚠️ **BLOCKER**
- [ ] User Management pages
- [ ] Dashboard widgets (8 remaining)
- [ ] 37+ additional components

**Critical Bugs:** 🔴

- [ ] **Workspace API Additional Roles** - MUST FIX before deployment
- [ ] Test remaining 6 failed API tests (76.9% → 100%)

**Deployment Infrastructure:** ❌

- [ ] Production database setup
- [ ] Environment variables configured
- [ ] CI/CD pipeline
- [ ] Monitoring & logging
- [ ] Backup strategy
- [ ] SSL/TLS certificates
- [ ] Rate limiting
- [ ] Security audit

**⚠️ ESTIMATE TO PRODUCTION-READY:** 8-10 weeks minimum

---
