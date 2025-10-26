# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Version**: 2.15.0 (2025-10-26)
**Last Major Update**: Profile Settings page implementation with password change functionality

---

## Quick Navigation

- [Project Overview](#project-overview) - Status, tech stack, current priorities
- [Commands](#commands) - Development, database, testing commands
- [Architecture](#architecture) - Database, API, frontend structure
- [Key Files to Know](#key-files-to-know) - Essential files for backend/frontend work
- [Common Workflows](#common-workflows) - Adding views, endpoints, testing
- [Troubleshooting](#troubleshooting) - Common issues and solutions
- [Quick Start](#quick-start-for-new-claude-instances) - Onboarding guide
- [Documentation Index](#documentation-index) - All project documentation

---

## 🚀 Quick Reference Card

**Running the app**: `PORT=3010 npm run dev` (Windows: `set PORT=3010 && npm run dev`)
**After schema changes**: `npm run prisma:generate` (ALWAYS!)
**Import Prisma**: `import { prisma } from "@/lib/db"` (NOT from @prisma/client)
**Soft deletes**: `update({ data: { deletedAt: new Date() } })` (NEVER use .delete())
**Multi-assignee**: Use `assigneeUserIds` array (NOT `assigneeUserId`)
**History table**: Use `prisma.history` (NOT `prisma.activityLog`)
**Setup .env**: Copy `.env.example` to `.env` and edit with your values

---

## Project Overview

**DO NOT REVERT ANYTHING IF I DON'T REQUEST**
**Never use any emoji in this project except in .md files**

**ProjectFlows** (formerly ProjectFlow) is a comprehensive project and task management system migrated from Google Apps Script to Next.js 15 + PostgreSQL. Designed for healthcare organizations with hierarchical role-based access control.

**Tech Stack**: Next.js 15 (App Router), TypeScript, PostgreSQL, Prisma ORM, React Query, Zustand, Tailwind CSS, shadcn/ui

**Current Status**:
- Backend: 100% Complete (81+ API endpoints)
- Frontend: ~70% Complete (45+/55+ major components)
- **NOT PRODUCTION-READY** - Active development, testing phase
- Estimated completion: 2025-12-05 (5 weeks remaining)

**Port**: Dev server runs on 3000 or 3010 (may vary due to conflicts)
**Previous GAS Codebase**: Stored in `old_project/` folder for reference

---

## 🎯 Current Priority

**What to work on next**: Additional modals and selectors

**Current Task**: Continue implementing remaining UI components

**Dashboard Implementation Status**: ✅ **COMPLETE WITH UI/UX REFINEMENT** (7/7 widgets)
- ✅ Stats Cards (4 cards) - permission-based, animated numbers
- ✅ Overdue Tasks Alert - red theme, assignee avatars top-right, 5 tasks max
- ✅ Pinned Tasks Widget - amber theme, assignee avatars top-right, expand/collapse
- ✅ My Tasks Widget - filter tabs in header, hide closed tasks switch (localStorage), infinite scroll
- ✅ Dashboard Calendar - tooltip on hover, legend right-aligned, Thai month/year
- ✅ Recent Activities - avatar + activity text, show 10 with expand
- ✅ My Checklist Widget - progress bar in header, task name as tooltip on hover

**UI/UX Refinements Completed** (2025-10-26):
- Consistent padding (pl-6/pl-8) across all task list widgets
- Assignee avatars repositioned to top-right with overlap style
- **Profile images**: All avatars now display real profile photos from `profileImageUrl`
- Amber color scheme for pinned tasks (matches department tasks view)
- Filter tabs moved to header for better space utilization
- Hide closed tasks switch with localStorage persistence
- Calendar legend and progress bar right-aligned
- Task names hidden, shown as tooltips to reduce clutter
- Hover effects on Recent Activities widget rows
- Fixed React Hooks order errors
- Fixed sidebar active state (Tasks vs Projects menu)

**Next Phase**: Comprehensive testing and documentation

**Remaining Components (~18)**:
- Additional Modals (2: Close Task, Bulk Actions)
- Selectors (9 types: various pickers and multi-selects)
- Advanced Features (7: global search, inline editor, batch operations UI)

**Recently Completed** (Last 7 days):
- ✅ **Profile Settings Page (2025-10-26)** - Complete user profile management with password change, avatar selection (16 presets), form validation, dirty checking, unsaved changes warning
- ✅ **Permission System Bug Fixes (2025-10-26)** - Fixed multi-assignee support & creatorUserId field mismatch, MEMBER can now edit own tasks
- ✅ **Dashboard Optimistic UI (2025-10-26)** - All widgets now have instant response (0ms), fixed query key mismatch
- ✅ **Date Validation Fixes (2025-10-26)** - Fixed 400 errors in task/project/phase creation with dates (4 API routes)
- ✅ **Task Panel Save Button (2025-10-26)** - Fixed disabled Save button issue using useCallback pattern
- ✅ **Project Progress Backfill (2025-10-26)** - Populated progress values for all 19 projects
- ✅ **Phase 4: Project Board API Optimization (2025-10-26)** - 3 parallel queries, 25% faster
- ✅ **Phase 3: Reports API Optimization (2025-10-26)** - 55% faster (3 parallel queries)
- ✅ **Phase 2: Department Tasks API Optimization (2025-10-26)** - 65% faster (4 parallel queries)
- ✅ **Phase 1: Dashboard API Optimization (2025-10-26)** - 72% faster (11 parallel queries)

**Known Critical Issues**: None (all resolved as of 2025-10-26)

**Thai Terminology** (Use correct terms):
- ✅ **หน่วยงาน** (Department) - NOT "แผนก"
- ✅ **กลุ่มงาน** (Division) - NOT "กอง"
- ✅ **กลุ่มภารกิจ** (Mission Group)
- ✅ **โปรเจค** (Project)

**Organizational Hierarchy**: กลุ่มภารกิจ → กลุ่มงาน → หน่วยงาน → โปรเจค

---

## Commands

### Development

```bash
npm run dev              # Start dev server (default port 3000, may run on 3010)
PORT=3010 npm run dev    # Start dev server on specific port (recommended)
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

**Test Environment**:
- Dev server must be running on port 3010
- Database must be seeded with test data from `prisma/seed.sql`
- Test credentials: `admin@hospital.test` / `SecurePass123!`
- For development: Set `BYPASS_AUTH=true` in `.env` to skip authentication
- Use `BYPASS_USER_ID=admin001` for ADMIN role, `user001` for LEADER role

---

## Architecture

### Database Schema (21 Tables)

The database uses Prisma ORM with PostgreSQL. **Key architectural decisions**:

1. **Soft Deletes**: All major entities use `deletedAt` or `dateDeleted` fields instead of hard deletes
2. **Hierarchical Organization**: MissionGroup → Division → Department → Users
3. **Custom Prisma Output**: Generated client is in `src/generated/prisma` (not default location)
4. **JSON Fields**: Used for flexible data (e.g., `pinnedTasks`, `additionalRoles`, `mentions`)

**Import Prisma Client**:
```typescript
import { prisma } from "@/lib/db";
```

**Core Schema Patterns**:
- **Users**: 6-level role hierarchy (ADMIN → CHIEF → LEADER → HEAD → MEMBER → USER)
- **Projects**: Belong to departments, have custom workflow statuses
- **Tasks**: Support subtasks, checklists, comments with @mentions, priority 1-4
- **Task Assignees**: ⭐ **IMPORTANT: Multi-assignee system** via `task_assignees` table
  - Use `assigneeUserIds` array in mutations/queries (NOT singular `assigneeUserId`)
  - Many-to-many relationship - tasks can have multiple assignees
  - See `MULTI_ASSIGNEE_IMPLEMENTATION.md` for details
- **Sessions**: Bearer token authentication with 7-day expiry
- **Notifications**: Real-time system with typed events
- **History**: Task activity logging (use `prisma.history` NOT `prisma.activityLog`)

**Full schema**: See `prisma/schema.prisma`

### API Routes (78+ Endpoints)

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

**Critical Performance Endpoints**:
- `/api/projects/[projectId]/board` - Single-query board view (no N+1 queries)
- `/api/batch` - Batch operations (up to 100 operations)
- `/api/projects/progress/batch` - Batch progress calculation (up to 50 projects)

**Authentication**:
- All routes require Bearer token: `Authorization: Bearer {sessionToken}`
- Use `withAuth()` middleware to attach `req.session` object
- For testing: Set `BYPASS_AUTH=true` in `.env`

**Permission System**:
- Use `checkPermission(userId, permission, context)` for access control
- Permissions cascade through organizational hierarchy
- See `src/lib/permissions.ts` (621 lines, 11 functions)

### Frontend Architecture

**State Management Strategy**:

1. **Server State (React Query)**: All server data via `@tanstack/react-query`
   - Organized hierarchically (see `src/hooks/use-*.ts`)
   - Stale time: 2-5 minutes depending on data type
   - **Single source of truth**: Never duplicate server data in local state

2. **Client State (Zustand)**: UI-only state
   - `useAppStore`: Current view, project selection
   - `useUIStore`: Modals, panels, task selection
   - `useSyncStore`: Sync animation state

3. **URL State (Next.js Router)**: Route parameters and search params

**Key Frontend Patterns**:

1. **Optimistic Updates** (Standard Pattern - See `OPTIMISTIC_UPDATE_PATTERN.md`):

   ```typescript
   import { useSyncMutation } from "@/lib/use-sync-mutation";

   const mutation = useSyncMutation({
     mutationFn: ({ id, data }) => api.patch(`/api/resource/${id}`, data),
     onMutate: async ({ id, data }) => {
       await queryClient.cancelQueries({ queryKey: keys.detail(id) });
       const previousData = queryClient.getQueryData(keys.detail(id));
       queryClient.setQueryData(keys.detail(id), (old: any) => ({ ...old, ...data }));
       return { previousData };
     },
     onError: (error, { id }, context) => {
       if (context?.previousData) {
         queryClient.setQueryData(keys.detail(id), context.previousData);
       }
     },
     onSettled: (response) => {
       queryClient.invalidateQueries({ queryKey: keys.detail(response.resource.id) });
     },
   });
   ```

   **Use this pattern for ALL interactive UI updates**.

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
   // - Bearer token from localStorage
   // - JSON parsing
   // - Extracting .data from { success: true, data: {...} }
   const data = await api.get<{ resource: Resource }>("/api/resource");
   ```

**Component Organization**:
```
src/
├── app/
│   ├── (dashboard)/              # Protected routes with dashboard layout
│   │   ├── dashboard/page.tsx    # Dashboard (partial - widgets remaining)
│   │   ├── projects/             # Project management
│   │   ├── users/                # User management
│   │   ├── reports/              # Reports dashboard
│   │   └── department/tasks/     # Department tasks view
│   ├── (auth)/                   # Auth pages (login, register, etc.)
│   └── api/                      # API routes (78+ endpoints)
├── components/
│   ├── layout/                   # Navbar, Sidebar, Toolbars, Footer
│   ├── navigation/               # Workspace, Breadcrumb
│   ├── projects/                 # Project management components
│   ├── users/                    # User management components
│   ├── reports/                  # Reports components
│   ├── views/                    # Board, Calendar, List views
│   ├── task-panel/               # Task detail panel
│   └── ui/                       # shadcn/ui components
├── hooks/                        # React Query hooks
├── stores/                       # Zustand stores
├── lib/                          # Utilities
└── types/                        # TypeScript types
```

**Theme System**:
- Uses `next-themes` with `ThemeProvider`
- Access: `const { theme, setTheme } = useTheme();`
- Dark mode colors in `src/lib/calendar-colors.ts`

---

## Key Files to Know

### Backend

- `src/lib/auth.ts` - Session management, password hashing (SHA256+salt), token generation
- `src/lib/permissions.ts` - **Complete permission system (621 lines)** - 11 functions for RBAC, additionalRoles support
- `src/lib/api-middleware.ts` - `withAuth()`, `withPermission()`, `withRole()` wrappers
- `src/lib/api-response.ts` - Standard response format and error handling
- `src/lib/db.ts` - Prisma client singleton

### Frontend

- `src/lib/api-client.ts` - Axios-based API client with Bearer token injection
- `src/lib/use-sync-mutation.ts` - Custom React Query mutation hook with sync animation
- `src/hooks/use-projects.ts` - Project data fetching and mutations
- `src/hooks/use-tasks.ts` - Task data fetching and mutations (13 mutations)
- `src/hooks/use-workspace.ts` - Workspace hierarchy data fetching
- `src/hooks/use-reports.ts` - Reports analytics data and statistics
- `src/hooks/use-dashboard.ts` - Dashboard widgets data and checklist mutations
- `src/hooks/use-users.ts` - User management CRUD operations
- `src/hooks/use-organization.ts` - Organization hierarchy fetching
- `src/hooks/use-notifications.ts` - Notification center data
- `src/hooks/use-department-tasks.ts` - Department-wide task view data
- `src/hooks/use-projects-list.ts` - Projects list with filters and pagination
- `src/stores/use-sync-store.ts` - Sync animation control
- `src/stores/use-ui-store.ts` - Modals and panels control
- `src/stores/use-navigation-store.ts` - Navigation state management

### Configuration

- `prisma/schema.prisma` - Database schema (21 tables)
- `next.config.js` - Custom Prisma client path alias
- `.env` - Environment variables (see below)

### Environment Variables

```bash
# Copy from example file and edit with your values:
# cp .env.example .env

# ===== REQUIRED =====
DATABASE_URL="postgresql://user:password@host:port/database?schema=public"

# ===== OPTIONAL - Development Only =====
BYPASS_AUTH=true              # Skip token validation but fetch REAL user from DB
BYPASS_USER_ID=admin001       # User ID to fetch (user must exist in DB, default: user001)
BYPASS_EMAIL=true             # Show email links in console instead of sending
PORT=3010                     # Dev server port

# ===== OPTIONAL - Production Email (Resend API) =====
RESEND_API_KEY="re_..."              # Resend API key
RESEND_FROM_EMAIL="noreply@..."      # Sender email
NEXT_PUBLIC_APP_URL="http://localhost:3010"  # Base URL for links
```

**⚠️ PRODUCTION WARNING**:
- **CRITICAL**: Ensure `BYPASS_AUTH=false` and `BYPASS_EMAIL=false` in production
- Never commit real API keys or credentials to version control
- Use environment variable management service (Vercel, Railway, etc.)

---

## Common Workflows

### Adding a New View (Board/Calendar/List Pattern)

1. **Create page component** (`src/app/(dashboard)/[route]/page.tsx`):
   ```typescript
   export default function NewViewPage() {
     return <NewViewComponent />;
   }
   ```

2. **Create view component** (`src/components/views/new-view/index.tsx`):
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

3. **Implement optimistic updates** (see `OPTIMISTIC_UPDATE_PATTERN.md`)

4. **Add loading/error states**:
   ```typescript
   if (isLoading) return <LoadingSkeleton />;
   if (error) return <ErrorState error={error} />;
   if (!data) return <EmptyState />;
   ```

**Reference**: Board View, Calendar View, List View

### Adding a New API Endpoint

1. **Create route file** (`src/app/api/[resource]/route.ts`):
   ```typescript
   import { withAuth } from "@/lib/api-middleware";
   import { successResponse, errorResponse } from "@/lib/api-response";
   import { checkPermission } from "@/lib/permissions";
   import { prisma } from "@/lib/db";

   async function handler(req: AuthenticatedRequest) {
     const userId = req.session.userId;

     // Check permissions
     const hasAccess = await checkPermission(userId, "resource.read", { resourceId });
     if (!hasAccess) return errorResponse("FORBIDDEN", "No access", 403);

     // Perform database operation
     const data = await prisma.resource.findUnique({ where: { id } });
     if (!data) return errorResponse("NOT_FOUND", "Not found", 404);

     return successResponse(data);
   }

   export const GET = withAuth(handler);
   ```

2. **Add TypeScript types** (`src/types/index.ts`)

3. **Create React Query hook** (`src/hooks/use-resource.ts`)

**Reference**: Existing API routes in `src/app/api/`

### Working with Task Closing

Tasks can be closed with two types: `COMPLETED` or `ABORTED`.

**API Endpoint**: `POST /api/tasks/:taskId/close`

**Request Body**:
```typescript
// Close as completed
{
  "type": "COMPLETED",  // Task finished successfully
  "reason": null        // Optional for COMPLETED
}

// Close as aborted
{
  "type": "ABORTED",    // Task cancelled/abandoned
  "reason": "Reason for cancellation"  // Required for ABORTED
}
```

**Frontend Usage**:
```typescript
import { useCloseTask } from "@/hooks/use-tasks";

const closeTaskMutation = useCloseTask(projectId);

// Close task as completed
closeTaskMutation.mutate({
  taskId: "task001",
  type: "COMPLETED",
});

// Close task as aborted (requires reason)
closeTaskMutation.mutate({
  taskId: "task002",
  type: "ABORTED",
  reason: "Requirements changed - no longer needed",
});
```

**Database Changes**:
- Sets `task.isClosed = true`
- Sets `task.closeType` to "COMPLETED" or "ABORTED"
- Sets `task.closedAt` to current timestamp
- Sets `task.closedBy` to current user ID
- Creates history entry with type "TASK_CLOSED"

**UI Behavior**:
- Closed tasks are filtered from default views (unless "Show Closed" enabled)
- Closed tasks show with strikethrough in List View
- Close button is disabled for already-closed tasks
- Only task creator, assignees, or ADMIN can close tasks

**Note**: Close Task Modal is not yet implemented - currently using mutation directly.

### Testing Changes Locally

```bash
# 1. Start dev server
PORT=3010 npm run dev

# 2. Test with BYPASS_AUTH (development only)
# Add to .env: BYPASS_AUTH=true
curl http://localhost:3010/api/endpoint

# 3. Check database state
npm run prisma:studio

# 4. Run automated tests
npm test
```

### Common Test Scenarios

**Test User Creation (ADMIN only)**:
```bash
curl -X POST http://localhost:3010/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "titlePrefix": "นาย",
    "firstName": "ทดสอบ",
    "lastName": "ระบบ",
    "password": "SecurePass123!",
    "role": "MEMBER",
    "departmentId": "DEPT-058"
  }'
```

**Test Multi-Assignee Update**:
```bash
curl -X PATCH http://localhost:3010/api/tasks/task001 \
  -H "Content-Type: application/json" \
  -d '{"assigneeUserIds":["user001","user002","user003"]}'
```

**Test Task Closing (Completed)**:
```bash
curl -X POST http://localhost:3010/api/tasks/task001/close \
  -H "Content-Type: application/json" \
  -d '{"type":"COMPLETED"}'
```

**Test Task Closing (Aborted)**:
```bash
curl -X POST http://localhost:3010/api/tasks/task002/close \
  -H "Content-Type: application/json" \
  -d '{"type":"ABORTED","reason":"Requirements changed"}'
```

**Test Project Board Performance**:
```bash
# Should return < 200ms with all tasks, statuses, and assignees
curl -s -w "\nTime: %{time_total}s\n" \
  http://localhost:3010/api/projects/proj001/board
```

**Test Batch Operations**:
```bash
curl -X POST http://localhost:3010/api/batch \
  -H "Content-Type: application/json" \
  -d '{
    "operations": [
      {"type":"UPDATE_TASK","taskId":"task001","data":{"priority":1}},
      {"type":"UPDATE_TASK","taskId":"task002","data":{"priority":1}},
      {"type":"ASSIGN_TASK","taskId":"task003","assigneeUserIds":["user001"]}
    ]
  }'
```

**Test Department Tasks (Role-based)**:
```bash
# LEADER sees division scope, HEAD sees department scope
curl http://localhost:3010/api/departments/DEPT-058/tasks?view=grouped
```

---

## Troubleshooting

### Top 5 Common Mistakes

1. **Forgetting `npm run prisma:generate` after schema changes**
   - Symptom: TypeScript errors about missing Prisma types
   - Fix: Always run `npm run prisma:generate` after editing `schema.prisma`

2. **Using hard deletes instead of soft deletes**
   - Symptom: Data permanently deleted
   - Fix: Use `prisma.model.update({ data: { deletedAt: new Date() } })` NOT `.delete()`

3. **Not using optimistic updates for interactive UI**
   - Symptom: UI feels slow
   - Fix: Read `OPTIMISTIC_UPDATE_PATTERN.md` and use `useSyncMutation`

4. **Importing Prisma from wrong location**
   - Symptom: `PrismaClient is not a constructor` error
   - Fix: Use `import { prisma } from "@/lib/db"` NOT `from "@prisma/client"`

5. **Deploying with BYPASS_AUTH enabled**
   - Symptom: No authentication (CRITICAL SECURITY ISSUE)
   - Fix: Always set `BYPASS_AUTH=false` in production

### Server Won't Start

**Symptom**: `Error: listen EADDRINUSE :::3000`

**Solution**:
```bash
# Option 1: Use different port
PORT=3010 npm run dev  # Unix/Mac
set PORT=3010 && npm run dev  # Windows CMD
$env:PORT=3010; npm run dev  # Windows PowerShell

# Option 2: Find and kill process (Windows)
netstat -ano | findstr :<PORT>  # Find PID
taskkill /F /PID <PID>  # Kill process

# Option 3: Kill process (Unix/Mac)
lsof -ti:3010 | xargs kill -9
```

### Prisma Client Errors

**Symptom**: `Cannot find module '@prisma/client'`

**Solution**:
```bash
# Regenerate Prisma client
npm run prisma:generate

# If still fails, delete and regenerate
rm -rf src/generated/prisma
npm run prisma:generate
```

### Authentication Issues

**Symptom**: `401 Unauthorized` on all requests

**Solution**:
```bash
# Use bypass mode for development
# Add to .env: BYPASS_AUTH=true

# Or re-login to get fresh token
curl -X POST http://localhost:3010/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hospital.test","password":"SecurePass123!"}'
```

### Database Connection Issues

**Symptom**: `Can't reach database server`

**Solution**:
```bash
# 1. Check DATABASE_URL in .env
# 2. Test connection
npm run prisma:studio

# 3. Push schema if empty
npm run prisma:push

# 4. Seed with test data
npx prisma db execute --file ./prisma/seed.sql --schema ./prisma/schema.prisma
```

### Hot Reload Not Working

**Solution**:
```bash
# 1. Hard refresh browser (Ctrl+Shift+R)

# 2. Clear Next.js cache
rm -rf .next
npm run dev

# 3. If WSL, check file watchers
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### React Hooks Order Errors

**Symptom**: `Rendered more hooks than during the previous render` or hooks order errors

**Solution**:
```typescript
// ❌ WRONG - Conditional hook call
if (condition) {
  const data = useQuery(...);
}

// ✅ CORRECT - Call hook unconditionally
const data = useQuery(...);
if (condition && data) {
  // Use data
}
```

**Common causes**:
- Calling hooks inside conditions
- Calling hooks inside loops
- Calling hooks after early returns
- Changing the order of hook calls between renders

**Fix**: Always call hooks in the same order on every render. Move conditions inside the hook or use the hook's built-in options.

### Webpack/Build Cache Errors

**Symptom**:
- `TypeError: __webpack_modules__[moduleId] is not a function`
- `timeout of 30000ms exceeded` when navigating to pages
- `ENOENT: no such file or directory, open '.next/routes-manifest.json'`
- React Client Manifest errors

**Solution**:
```bash
# 1. Kill the dev server
# Windows:
taskkill /F /PID <PID>

# Unix/Mac:
kill -9 <PID>

# 2. Delete .next cache completely
rm -rf .next  # Unix/Mac/Git Bash
rd /s /q .next  # Windows CMD

# 3. Restart dev server
PORT=3010 npm run dev
```

**Root Cause**: Next.js webpack cache corruption, often happens after:
- Multiple rapid code changes
- Interrupted builds
- File system issues
- Module resolution errors

**Prevention**: If you make significant changes to multiple files, consider clearing cache before restart.

---

## Quick Start for New Claude Instances

### ⚠️ Critical Information

**PROJECT STATUS**:
- ✅ Backend: 100% Complete (78+ API endpoints)
- 🔄 Frontend: ~68% Complete (44+/55+ components)
- ❌ **NOT READY FOR DEPLOYMENT** - Active development
- 🎯 Estimated completion: 2025-12-05 (5 weeks remaining)

**KNOWN CRITICAL BUGS**: None (all resolved as of 2025-10-26)

### First Steps (5 minutes)

1. **Read this Quick Start section** (you're doing it now!)
2. **Check "Current Priority"** section for what to work on
3. **Review "Key Files to Know"** for essential files

### What You're Being Asked To Do

**If implementing a new feature**:
1. Check if design exists in documentation files (see Documentation Index)
2. Follow "Common Workflows" patterns
3. Use optimistic updates for interactive UI (see OPTIMISTIC_UPDATE_PATTERN.md)
4. Reference existing views for consistency
5. Check recently completed features for similar patterns

**If fixing a bug**:
1. Check "Troubleshooting" section first
2. Look for recent `*_BUG_FIX*.md` or `*_COMPLETE.md` files
3. Use `git log --oneline --since="7 days ago"` to see recent changes
4. Check if issue is webpack cache-related (see Troubleshooting)
5. Read related context `.md` files

**If debugging an issue**:
1. Check recent .md files in project root (sorted by date in git status)
2. Review `*_COMPLETE.md` files for implementation details
3. Check `*_BUG_FIX*.md` files for known issues and solutions
4. Use git blame to identify recent changes to problematic files
5. Check CLAUDE.md version number for context (currently v2.14.0)
6. Clear Next.js cache if experiencing module resolution errors

**If adding an API endpoint**:
1. Follow API endpoint pattern in "Common Workflows"
2. Use `withAuth()` middleware for authentication
3. Check permissions with `checkPermission()` or `canManageTargetUser()`
4. Use soft deletes (update with deletedAt, never .delete())
5. Return data using successResponse() / errorResponse()
6. Add TypeScript types to src/types/
7. Create corresponding React Query hook in src/hooks/

**If asked about the codebase**:
1. Check CLAUDE.md (this file) for overview and current status
2. Check `PROJECT_STATUS.md` for detailed progress (may be outdated)
3. Check documentation files (see "Documentation Index" below)
4. Read Prisma schema for database structure
5. Look at `old_project/` for business logic reference (not implementation)

### Key Things to Remember

1. **NOT production-ready** - Frontend ~68% complete
2. **Port 3010** - Dev server runs here (not 3000)
3. **BYPASS_AUTH=true** - Use in `.env` for testing
4. **Always run `npm run prisma:generate`** after schema changes
5. **Optimistic updates everywhere** - See `OPTIMISTIC_UPDATE_PATTERN.md`
6. **Thai terminology matters** - Use correct terms (หน่วยงาน not แผนก)
7. **Soft deletes only** - Never use `.delete()`
8. **Multi-assignee system** - Use `assigneeUserIds` array, not singular `assigneeUserId`
9. **Navigation components** - Breadcrumb and workspace navigation (2025-10-23)
10. **Use `prisma.history`** NOT `prisma.activityLog`

### Most Important Files

**Backend**: `src/lib/auth.ts`, `src/lib/permissions.ts`, `src/lib/api-middleware.ts`
**Frontend**: `src/hooks/use-*.ts`, `src/stores/use-*-store.ts`, `OPTIMISTIC_UPDATE_PATTERN.md`
**Understanding**: `PROJECT_STATUS.md`, `migration_plan/`, Prisma schema

### When In Doubt

1. Look for existing patterns (78 API endpoints, multiple complete views)
2. Read the relevant `.md` file (excellent documentation)
3. Check GAS implementation (`old_project/` folder)
4. Ask the user (better to clarify than assume)

---

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

The Prisma client is generated to a custom location:

```bash
npm run prisma:generate  # Always run after schema changes
```

### Date Handling

- **Database**: Store as `DateTime` (Prisma type)
- **API Response**: Return as ISO string `.toISOString()`
- **API Input**: Accept ISO strings, parse with `new Date()`
- **Display**: Use `date-fns` for formatting (Thai locale supported)

### Migration Context

This project migrated from Google Apps Script. Preserved for backward compatibility:
- Field names like `dateDeleted` (inconsistent with `deletedAt`)
- Priority levels 1-4 (1 = Urgent, 2 = High, 3 = Normal, 4 = Low)
- Color schemes matching GAS implementation
- Thai language UI text

---

## Migration from Google Apps Script

This project is a complete rewrite from Google Apps Script (GAS) to Next.js. The `old_project/` folder contains the original codebase and documentation for reference.

### What's in old_project/

- **Original GAS codebase**: `.gs` files with legacy implementation
- **GAS-specific documentation**: Architecture, cache systems, deployment guides
- **UI screenshots**: For visual consistency reference
- **Business logic documentation**: Detailed explanations of complex features

### When to Reference old_project/

**DO reference when**:
- Understanding business logic for features not yet documented in Next.js version
- Comparing UI/UX for visual consistency
- Clarifying requirements or expected behavior
- Finding original color schemes, Thai text, or formatting rules
- Understanding complex calculations or algorithms

**DON'T reference when**:
- Looking for implementation patterns (use Next.js best practices instead)
- Finding API structure (completely redesigned as REST)
- Understanding database schema (completely redesigned with Prisma)

### Key Migration Decisions

**Preserved from GAS:**
- Field naming conventions (e.g., `dateDeleted`, `dateCreated`)
- Priority levels 1-4 (1=Urgent, 2=High, 3=Normal, 4=Low)
- Thai language UI text and terminology
- Color schemes for priorities, statuses, and themes
- Business logic and calculation formulas
- Organizational hierarchy structure

**Modernized in Next.js:**
- REST API architecture (vs. GAS server functions)
- PostgreSQL with Prisma (vs. Google Sheets)
- TypeScript with full type safety (vs. JavaScript)
- React Query for state management (vs. manual caching)
- Optimistic UI updates (vs. full page reloads)
- Session-based authentication (vs. Google OAuth only)

### Migration Progress

See `migration_plan/` folder for detailed migration documentation:
- `00_MIGRATION_OVERVIEW.md` - High-level migration strategy
- `01_DATABASE_MIGRATION.md` - Database schema migration
- `02_API_MIGRATION.md` - API endpoints migration (✅ Complete)
- `03_FRONTEND_MIGRATION.md` - Frontend migration (🔄 ~68% complete)
- `04_DEPLOYMENT_GUIDE.md` - Deployment strategy
- `06_BUSINESS_LOGIC_GUIDE.md` - Business logic migration

---

## Documentation Index

### Main Documentation
- `README.md` - Project overview and quick start
- `CLAUDE.md` - This file ⭐ **PRIMARY REFERENCE**
- `PROJECT_STATUS.md` - Detailed status (⚠️ May be outdated - check CLAUDE.md for current status)

### Frontend Development
- `OPTIMISTIC_UPDATE_PATTERN.md` - Standard pattern for UI updates (600+ lines) ⭐ **MUST READ**
- `DASHBOARD_UI_UX_REFINEMENT_COMPLETE.md` - Dashboard refinements summary (14 changes) ⭐ **NEW**
- `SYNC_ANIMATION_SYSTEM.md` - Sync footer animation
- `TASK_PANEL_V1.0_COMPLETE.md` - Task panel completion summary
- `PROJECT_MANAGEMENT_IMPLEMENTATION_SUMMARY.md` - Project management
- `CREATE_TASK_MODAL_IMPLEMENTATION_COMPLETE.md` - Create task modal
- `USER_MANAGEMENT_PERMISSIONS_COMPLETE.md` - User permissions guide
- `FULLNAME_SPLIT_MIGRATION_CONTEXT.md` - User name field migration (442 lines)
- `WORKSPACE_NAVIGATION_REDESIGN.md` - Workspace navigation

### Backend & API
- `AUTHENTICATION_IMPLEMENTATION_COMPLETE.md` - Auth system summary
- `PASSWORD_RESET_IMPLEMENTATION.md` - Password reset flow
- `EMAIL_SETUP_GUIDE.md` - Email configuration
- `PERMISSION_GUIDELINE.md` - Comprehensive permission system guide (23+ permissions) ⭐ **IMPORTANT**
- `MULTI_ASSIGNEE_IMPLEMENTATION.md` - Multi-assignee system ⭐ **IMPORTANT**
- `ACTIVITYLOG_TO_HISTORY_MIGRATION.md` - History table migration context
- `HYBRID_PROGRESS_CALCULATION.md` - Progress calculation algorithm
- `NOTIFICATION_SYSTEM_IMPLEMENTATION.md` - Notification system details

### Testing & Security
- `DASHBOARD_TESTING_PLAN.md` - User Dashboard comprehensive test plan (110+ test cases) ⭐ **NEW**
- `TESTING_COMPLETE_2025-10-24.md` - Permission system test report (1,200+ lines)
- `PERMISSION_SYSTEM_REVIEW_2025-10-24.md` - Security audit
- `TESTING_SUMMARY.md` - Overall testing status
- `SECURITY_REVIEW_2025-10-24.md` - Security review findings
- `TEST_RESULTS_2025-10-24.md` - Detailed test execution results
- `tests/api/phase*-test.md` - API test documentation (6 phases)

### Migration Plans
- `migration_plan/01_DATABASE_MIGRATION.md` - Database schema
- `migration_plan/02_API_MIGRATION.md` - API endpoints
- `migration_plan/03_FRONTEND_MIGRATION_COMPLETE.md` - Frontend components
- `migration_plan/05_ROLLOUT_PLAN.md` - Deployment strategy

### Feature Planning & Design
- `NEXT_GOAL_DEPARTMENT_TASKS.md` - Department tasks (completed)
- `DEPARTMENT_TASKS_VIEW_DESIGN.md` - Department tasks design
- `DEPARTMENT_TASKS_GANTT_CHART_DESIGN.md` - Gantt chart plan (future)
- `DEPARTMENT_TASKS_CUSTOM_GROUPING_DESIGN.md` - Custom grouping (future)
- `EDIT_PROJECT_MODAL_IMPLEMENTATION_PLAN.md` - Edit project modal design

### Recent Bug Fixes & Improvements (2025-10-24 to 2025-10-26)
- `PROJECT_BOARD_PERFORMANCE_COMPLETE.md` - Project Board API optimization (25% faster) - Phase 4 FINAL ⭐ **NEW**
- `REPORTS_PERFORMANCE_COMPLETE.md` - Reports API optimization (55% faster) - Phase 3 ⭐ **NEW**
- `DEPARTMENT_TASKS_PERFORMANCE_COMPLETE.md` - Department Tasks API (65% faster) - Phase 2 ⭐ **NEW**
- `DASHBOARD_PERFORMANCE_IMPROVEMENTS_COMPLETE.md` - Dashboard API optimization (72% faster) - Phase 1 ⭐ **NEW**
- `APP_WIDE_PERFORMANCE_OPTIMIZATION_PLAN.md` - Complete roadmap (62 endpoints) ⭐ **NEW**
- `DASHBOARD_PERFORMANCE_ANALYSIS.md` - Performance analysis & recommendations ⭐ **NEW**
- `REPORTS_DASHBOARD_BUG_FIXES_2025-10-26.md` - Reports fixes (8 bugs resolved)
- `NOTIFICATION_BUG_FIX.md` - Notification system fixes
- `DELETE_CONFIRMATION_IMPLEMENTATION_COMPLETE.md` - Delete confirmation modal
- `PRIORITY_1_IMPLEMENTATION_COMPLETE.md` - Priority 1 features completion
- `PRIORITY_2_3_IMPLEMENTATION_COMPLETE.md` - Priority 2-3 features completion

---

## Performance Considerations

### API Performance (All Critical Endpoints Optimized) ✅

**Optimization Status**: All 4 phases complete (2025-10-26)
- ✅ Phase 1: Dashboard API - 72% faster (11 parallel queries)
- ✅ Phase 2: Department Tasks API - 65% faster (4 parallel queries)
- ✅ Phase 3: Reports API - 55% faster (3 parallel queries)
- ✅ Phase 4: Project Board API - 25% faster (3 parallel queries)

**Average Improvement**: ~50% faster across critical endpoints

1. **Project Board Endpoint** - ✅ **OPTIMIZED** (Phase 4)
   - Parallelized 3 queries (currentUser + project + departmentUsers)
   - Removed redundant email fields
   - Response time: ~1s dev (expected ~400-450ms in production)

2. **Batch Operations** - Use `/api/batch` for bulk updates
   - Supports up to 100 operations
   - 6-10x faster than individual requests

3. **React Query Stale Time** - Set appropriately:
   - User data: 5 minutes (rarely changes)
   - Task data: 2 minutes (moderate change)
   - Notifications: 1 minute (frequent updates)

4. **Optimistic Updates** - ALL interactive UI uses optimistic updates
   - Task drag-and-drop: < 50ms response
   - Form changes: instant visual update
   - Automatic rollback on error

---

## Seeding the Database

```bash
# Option 1: SQL seed file (recommended)
npx prisma db execute --file ./prisma/seed.sql --schema ./prisma/schema.prisma

# Option 2: Manual via Prisma Studio
npm run prisma:studio
```

**Note**: TypeScript seed script (`prisma/seed.ts`) exists but may have issues. Use SQL file.

---

## Deployment Checklist

**Backend**: ✅ 100% Complete
- [x] 78+ API endpoints implemented and tested
- [x] Database schema complete (21 tables)
- [x] Authentication & authorization
- [x] Permission system with 6 roles + additionalRoles

**Frontend**: 🔄 ~68% Complete
- [x] Core infrastructure (Layout, Theme, Auth)
- [x] 3 Project views (Board, Calendar, List)
- [x] Task detail panel
- [x] Project Management (full CRUD)
- [x] User Management (full CRUD)
- [x] Department Tasks View
- [x] Reports Dashboard
- [x] User Dashboard (7 widgets + 4 stat cards) ✅ NEW
- [ ] Additional modals (2 remaining)
- [ ] Selectors (9 remaining)
- [ ] Advanced features (6 remaining)

**Critical Bugs**: ✅ All resolved

**Deployment Infrastructure**: ❌ Not ready
- [ ] Production database setup
- [ ] Environment variables configured
- [ ] CI/CD pipeline
- [ ] Monitoring & logging
- [ ] Backup strategy
- [ ] SSL/TLS certificates
- [ ] Rate limiting
- [ ] Security audit

**⚠️ ESTIMATE TO PRODUCTION-READY**: 5-6 weeks

---

## Additional Important Patterns

### Reports Dashboard

**Location**: `src/app/(dashboard)/reports/page.tsx`

**Features**:
- 5 interactive charts (Chart.js with dark mode support)
- Organization filters (2-layer permission: ADMIN sees all, others see scope)
- Date range filtering (7d/30d/90d/custom)
- Export functionality (CSV/Excel via react-csv)
- Real-time data from API endpoints

**Key Components**:
- `src/components/reports/task-completion-chart.tsx` - Completion rate over time
- `src/components/reports/task-priority-chart.tsx` - Priority distribution
- `src/components/reports/task-status-chart.tsx` - Status breakdown
- `src/components/reports/organization-filter.tsx` - Mission/Division/Dept selector

**Data Fetching**:
```typescript
import { useReports } from "@/hooks/use-reports";

const { data, isLoading } = useReports({
  startDate: "2025-10-01",
  endDate: "2025-10-31",
  missionGroupId: "MISSION-2024-001",
  divisionId: "DIV-037",
  departmentId: null, // null = all departments in division
});
```

**Permission Logic**:
- ADMIN/CHIEF: Can filter by any Mission Group, Division, or Department
- LEADER: Can only see their Division
- HEAD: Can only see their Department
- MEMBER/USER: No access to Reports page

### User Management

**Location**: `src/app/(dashboard)/users/page.tsx`

**Features**:
- User list with search, filter, and pagination
- Create/Edit/Delete users (ADMIN only)
- Status toggle (Active/Suspended) for management roles
- Role-based permissions (see USER_MANAGEMENT_PERMISSIONS_COMPLETE.md)

**Key Components**:
- `src/components/users/users-view.tsx` - Main container with access control
- `src/components/users/users-table.tsx` - Table with conditional Actions column
- `src/components/users/user-row.tsx` - Row with permission checks
- `src/components/modals/create-user-modal.tsx` - User creation (ADMIN only)
- `src/components/modals/edit-user-modal.tsx` - User editing (ADMIN only)

**Permission Matrix**:
- ADMIN: Full CRUD on all non-ADMIN users
- HEAD/LEADER/CHIEF: View + Status toggle for users in scope
- MEMBER/USER: No access (page shows "Access Denied")

**Important**:
- Users are scoped by organizational hierarchy
- ADMIN cannot edit/delete other ADMIN users
- Actions column hidden for non-ADMIN roles
- Sidebar menu items ("บุคลากร", "โปรเจค") hidden for MEMBER/USER

---

**End of CLAUDE.md v2.14.0**
