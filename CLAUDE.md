# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Version**: 2.37.0 (2025-11-01)
**Last Major Update**: IT Service Module Session 6 Complete (Menu consolidation, timeline enhancements, bug fixes)

---

## Quick Navigation

- [Project Overview](#project-overview) - Status, tech stack, current priorities
- [Quick Start](#quick-start-for-new-claude-instances) - ⭐ **START HERE** - Critical development rules
- [Next.js 15 Migration Lessons](#nextjs-15-migration-lessons) - ⭐ **MANDATORY READ** - Prevent deployment failures
- [Commands](#commands) - Development, database, testing commands
- [Architecture](#architecture) - Database, API, frontend structure
- [Type Safety Best Practices](#type-safety-best-practices) - ⭐ **100% type-safe patterns** (0/49 `as any` removed)
- [Key Files to Know](#key-files-to-know) - Essential files for backend/frontend work
- [Common Workflows](#common-workflows) - Adding views, endpoints, testing
- [Troubleshooting](#troubleshooting) - Common issues and solutions
- [Documentation Index](#documentation-index) - All project documentation

---

## 🚀 Quick Reference Card

**⚠️ BEFORE YOU CODE:**
1. Read [Critical Development Rules](#critical-development-rules-nextjs-15) ⭐ **MANDATORY**
2. Check [Current Priority](#current-priority) for what to work on
3. Review [Next.js 15 Migration Lessons](#nextjs-15-migration-lessons)

**💻 DEVELOPMENT:**
```bash
PORT=3010 npm run dev          # Start dev server
npm run prisma:generate         # After schema changes (ALWAYS!)
npm run type-check             # Every 30 min during dev
```

**📝 CODE PATTERNS:**
```typescript
import { prisma } from "@/lib/db"              // Prisma import
.update({ data: { deletedAt: new Date() } })  // Soft delete
assigneeUserIds: ["user1", "user2"]            // Multi-assignee

// ⭐ FISCAL YEAR SCOPE - ALWAYS USE GLOBAL FILTER
import { useFiscalYearStore } from "@/stores/use-fiscal-year-store";
const selectedYears = useFiscalYearStore((state) => state.selectedYears);
// Pass to API: params.fiscalYears = selectedYears.join(",")
```

**🛡️ TYPE SAFETY** (NEVER use `as any`):
```typescript
// 1. Type inference with generics
getQueryData<BoardData>(key)

// 2. Type guards for union types
if (isBoardData(data)) { /* use data */ }

// 3. Double cast via unknown (last resort)
(source as unknown as Target)

// 4. Omit pattern for Date conflicts
extends Omit<Type, 'createdAt'>

// 5. Optional vs Nullable (Zod compatible)
field?: string  // NOT: field: string | null
```

**✅ BEFORE COMMIT/PUSH:**
```bash
# Before EVERY commit
git status && npm run type-check    # Check files + types (2-3 min)

# Before EVERY push
npm run build                       # Test production build (catches 80% errors)

# Commit message format (conventional commits)
feat: Add feature    fix: Bug fix    refactor: Improve code    docs: Update docs
```

**📖 Full details below** ⬇️

---

## Project Overview

**DO NOT REVERT ANYTHING IF I DON'T REQUEST**
**DO NOT GIT COMMIT & PUSH ANYTHING IF I DON'T REQUEST**
**DO NOT UPDATE CLAUDE.md IF I DON'T REQUEST**
**NEVER USE ANY EMOJI IN THIS PROJECT EXCEPT IN .MD FILES**

**ProjectFlows** (formerly ProjectFlow) is a comprehensive project and task management system built with Next.js 15 + PostgreSQL. Designed for healthcare organizations with hierarchical role-based access control. Successfully deployed to production on Render (2025-10-27).

**Tech Stack**: Next.js 15 (App Router), TypeScript, PostgreSQL, Prisma ORM, React Query, Zustand, Tailwind CSS, shadcn/ui

**Current Status**:

- Backend: 100% Complete (81+ API endpoints)
- Frontend: ~98% Complete (47/48 major components for Version 1.5)
- **PRODUCTION-READY** - Successfully deployed to Render (2025-10-27) 🚀
- Version 1.5 target: 2025-11-15 (2 weeks remaining)

**Port**: Dev server runs on 3000 or 3010 (may vary due to conflicts)
**Previous GAS Codebase**: Stored in `old_project/` folder for reference

---

### IT Service Module (New Feature - In Progress) ⭐

**Status**: Phase 2 Complete - Portal UI & Navigation Consolidation (100%)

**Purpose**: Internal IT service request system for USER role with approval workflow.

**Key Features**:
- 3 request types: DATA (ขอข้อมูล), PROGRAM (ขอโปรแกรม), IT_ISSUE (แจ้งปัญหา)
- FIFO queue system per request type (with real-time position tracking)
- HTML document generation with Thai formatting (Sarabun 16pt font, Buddhist calendar)
- Approval workflow (HEAD+ can approve by type)
- Automatic task creation upon approval with assignee tracking
- Satisfaction rating system (1-10 stars + comments)
- Timeline with task assignment details (assignees + status)

**Current Implementation** (as of 2025-11-01):
- ✅ Phase 1: Database schema (ServiceRequest, ServiceRequestComment, ServiceRequestTimeline tables)
- ✅ Phase 2: Portal UI + Request submission forms (100% complete) ⭐ **NEW**
  - ✅ Task 1: USER role layout isolation + ITServiceTopBar
  - ✅ Task 2: Sidebar navigation (consolidated to single "IT Service" menu with 3 tabs)
  - ✅ Task 3: Portal landing page (4 action cards, responsive design)
  - ✅ Task 4: Request forms (3 modals with full validation, z-index fixes, custom scrollbar)
  - ✅ Task 5: Document preview (HTML generation, iframe preview modal, print functionality)
  - ✅ Session 6: Menu consolidation + Timeline enhancements + Bug fixes ⭐ **NEW**
- ⏳ Phase 3-6: Request tracking enhancements, Approval workflow, System settings, Testing

**Documentation**:
- Design: `IT_SERVICE_MODULE_SPECIFICATION.md` (2,800+ lines)
- Conflicts: `IT_SERVICE_MODULE_CONFLICT_ANALYSIS.md` (resolved conflicts)
- Settings: `SYSTEM_SETTINGS_DESIGN.md` (System Settings page for SUPER_ADMIN)
- Local setup: `LOCAL_DEVELOPMENT_SETUP.md` (PostgreSQL setup guide)
- Session 2: `IT_SERVICE_SESSION_2_SUMMARY.md` (Portal UI implementation)
- Session 3: `IT_SERVICE_SESSION_3_SUMMARY.md` (Request forms enhancement)
- Session 4: `IT_SERVICE_SESSION_4_SUMMARY.md` (Document preview implementation)
- Session 6: `IT_SERVICE_SESSION_6_COMPLETE.md` (Menu consolidation + Timeline + Bug fixes) ⭐ **NEW**

**Critical Notes**:
- USER role auto-redirects to IT Service portal on login (isolated from main dashboard)
- Non-USER roles access via `/it-service-admin` with 3 tabs (Portal, Manage, My Requests)
- Requires SUPER_ADMIN role for system settings (not yet implemented)
- fiscalYear field must be added to ServiceRequest table
- Follow same type safety patterns as main project (NEVER use `as any`)
- 6 files have hard-coded `role === 'ADMIN'` checks that need role hierarchy refactoring
- **Type Safety Lessons**: Always match Prisma schema field names (e.g., `type` not `statusType`)
- **Modal Pattern**: Use `onOpenChange` prop, not `onClose` for shadcn/ui Dialog components
- **Enum Validation**: Only use values that exist in Prisma schema enums

---

## 🎯 Current Priority

**What to work on next**: IT Service Module Phase 3 (Request Tracking Enhancements)

**Recently Completed** (2025-11-01):
- ✅ **IT Service Session 6 Complete** - Menu consolidation (3-tab navigation), timeline enhancements, bug fixes ⭐ **NEW**
- ✅ **IT Service Phase 2 Complete** - Document preview with HTML generation and print functionality
- ✅ **IT Service Phase 2 Task 4** - Request submission forms (3 request types)
- ✅ **IT Service Phase 2 Tasks 1-3** - Portal UI, sidebar navigation, layout isolation
- ✅ **Mobile Layout Phase 4-8** - Complete mobile implementation (100%)
- ✅ **Division View** - Executive dashboard for LEADER role (100%)

**Current Status**:

- **Mobile Layout**: ✅ **COMPLETE** (8/8 phases, 100%)
  - Phase 1: ✅ Responsive infrastructure at 768px breakpoint
  - Phase 2: ✅ 5-tab bottom nav, My Tasks page, Notifications page, Hamburger menu
  - Phase 3: ✅ Dynamic titles, context actions, animations
  - Phase 4-8: ✅ Task Panel mobile, filters, search, settings
- **Division View**: ✅ **COMPLETE** (Executive dashboard with 4 sections)
- **Version 1.5**: Near completion (49/50 components, 98%)

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

---

## 📋 Version Status & Roadmap

### Version 1.5 (Current) - Target: 2025-11-15

**Status**: 98% Complete (47/48 components)

**Completed**:

- ✅ All core features (Dashboard, Projects, Tasks, Users, Reports)
- ✅ Task closing via action menu (List View) and Task Panel button
- ✅ Bulk actions via List View toolbar (select multiple → bulk update)
- ✅ Production deployment on Render

**Remaining** (1 component):

- ⏳ Date Filter Preset (Today, Yesterday, This Week, This Month, etc.)
- ⏳ File Link Attachments (Google Drive/OneDrive links)

---

### Version 2.0 (Future) - Planned Features

**Advanced Components** (9 components):

- 📅 Date Range Picker (advanced with presets)
- 👥 Multi User Selector (with avatars, department filtering)
- 🏷️ Tag Selector/Manager (create, edit, color picker, autocomplete)
- 🔄 Sort Options Selector (multiple fields, ascending/descending)
- 🔍 Global Search (across tasks/projects/users, keyboard shortcuts)
- 🔔 Notifications Center (enhanced: filter by type, mark all, real-time)
- 📊 Activity Timeline (visual timeline, filter by user/action)
- 📎 File Upload/Manager (drag & drop, preview, delete/download)
- 🔄 Bulk Actions Modal (improved: progress indicator, undo)

**Status**: Planning phase

---

### Cancelled Features

- ❌ Department/Division Selector (not needed)
- ❌ Priority Range Selector (not needed)

---

### IT Service Module (Separate Feature Track)

**Status**: Phase 2 Task 4 Complete (80% of Phase 2)

**Roadmap**:
- ✅ Phase 1: Database Schema (ServiceRequest, Comments, Timeline, Ratings) - COMPLETE
- ⏳ Phase 2: IT Service Portal UI (Tasks 1-5) - 80% Complete
  - ✅ Task 1: IT Service Layout (USER role isolation, ITServiceTopBar)
  - ✅ Task 2: Sidebar Navigation (IT Service menu, คำร้องขอ menu with badges)
  - ✅ Task 3: Portal Landing Page (4 action cards, request list, responsive)
  - ✅ Task 4: Request Forms (3 modals: DATA, PROGRAM, IT_ISSUE, HARDWARE/NETWORK)
  - ⏳ Task 5: Document Preview (PDF/Word preview, template generation, print/download) - **NEXT**
- ⏳ Phase 3: Request Tracking & Timeline (2-3 days)
  - Timeline component with avatar + role + timestamp
  - Comment system with mentions
  - Queue position display
  - Document preview in tracking page
- ⏳ Phase 4: Approval System (3-4 days)
  - Management page for approvers (HEAD+ role)
  - Approve/Reject actions
  - Auto-create task upon approval
  - Notification system integration
- ⏳ Phase 5: System Settings (SUPER_ADMIN) (2 days)
  - Add SUPER_ADMIN role (enum migration + 6 file refactors)
  - System settings page (IT Service toggle, hospital name)
  - Approver assignment UI
- ⏳ Phase 6: Testing & Polish (2-3 days)
  - E2E testing for all workflows
  - Mobile responsive testing
  - Performance optimization
  - Documentation completion

**Total Estimate**: 18-21 days (11-13 days remaining)

**Critical Dependencies**:
- ⚠️ SUPER_ADMIN role implementation (6 files with hard-coded ADMIN checks)
- ⚠️ Role hierarchy refactoring (`hasRoleLevel()` helper function)
- ⚠️ fiscalYear integration (ServiceRequest table + API filtering)

---

### Ideas (No Timeline Yet)

**Advanced Features** (3 ideas):

- 💡 Advanced Inline Editor (rich text, markdown, @mention, attachments)
- 💡 Batch Operations UI (select all, operation toolbar, progress, undo)
- 💡 Keyboard Shortcuts Panel (list all, searchable, customizable)

**Recently Completed** (Last 7 days):

- ✅ **Mobile Layout Phase 4-8 - COMPLETE (2025-10-31)** - Full mobile implementation (Task Panel, filters, search, settings) [See MOBILE_LAYOUT_DESIGN.md]
- ✅ **Division View - COMPLETE (2025-10-31)** - Executive dashboard for LEADER role with 4 sections [See DIVISION_VIEW_DESIGN.md]
- ✅ **Phase 1.1: Remove @ts-nocheck - COMPLETE (2025-10-30)** - [See PHASE_1.1_COMPLETE.md]
- ✅ **P0 Type Safety Refactoring - COMPLETE (2025-10-30)** - Removed all 49 `as any` assertions, 100% type-safe [See P0_TYPE_SAFETY_REFACTORING_COMPLETE.md]
- ✅ **Mobile Layout Additional Features + Turbopack Build Fix (2025-10-29)** - 6 mobile enhancements, Windows build fix [See Changelog v2.33.0]
- ✅ **Mobile Layout Phase 3 - Top Bar Enhancement (2025-10-28)** - Dynamic titles, context actions [See Changelog v2.32.0]
- ✅ **Mobile Layout Phase 2 - Bottom Nav Features (2025-10-28)** - 5-tab navigation system [See Changelog v2.31.0]
- ✅ **Mobile Layout Phase 1 - Foundation (2025-10-28)** - Responsive infrastructure [See Changelog v2.30.0]
- ✅ **Production 403 Forbidden Fix (2025-10-28)** - Fixed CSRF/CORS blocking [See Changelog v2.29.0]
- ✅ **Task Ownership System (2025-10-27)** - Complete implementation [See TASK_OWNERSHIP_SYSTEM.md]
- ✅ **DEPLOYMENT SUCCESS (2025-10-27)** - Live on Render with Next.js 15 [See Changelog v2.23.0]

**For detailed completion history**: See [Changelog](#changelog) section below or individual feature documentation files.

**Known Critical Issues**: None (all resolved as of 2025-10-26)

**Thai Terminology** (Use correct terms):

- ✅ **หน่วยงาน** (Department) - NOT "แผนก"
- ✅ **กลุ่มงาน** (Division) - NOT "กอง"
- ✅ **กลุ่มภารกิจ** (Mission Group)
- ✅ **โปรเจกต์** (Project)

**Organizational Hierarchy**: กลุ่มภารกิจ → กลุ่มงาน → หน่วยงาน → โปรเจกต์

---

## Commands

### Development

```bash
npm run dev              # Start dev server (default port 3000, may run on 3010)
PORT=3010 npm run dev    # Start dev server on specific port (recommended)
npm run build            # Build for production (ALWAYS test locally before deploy!)
npm run type-check       # Check TypeScript errors (FAST - 2-3 min vs 5-10 min on Render)
npm start                # Start production server
npm run lint             # Run ESLint
```

**⭐ CRITICAL: Run `npm run type-check` before every `git push`!** (See [TypeScript Error Prevention](#7-typescript-error-prevention--best-practices-))

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

## Git Workflow

### Branch Strategy

**Current branch**: `refactor/p0-type-safety`
**Main branch**: `master` (for PRs)

**Branch Naming Convention**:
- `feature/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code improvements without behavior change
- `docs/` - Documentation updates

### Commit Message Format

Follow conventional commits:
```bash
feat: Add mobile layout Phase 4
fix: Resolve Task Panel sync issue
refactor: Remove all 'as any' assertions
docs: Update CLAUDE.md with new patterns
```

### Before Every Commit Checklist

- [ ] Run `git status` (check for untracked files)
- [ ] Run `npm run type-check` (0 errors required)
- [ ] Test affected features locally
- [ ] Update CLAUDE.md if architecture changes

### Before Every Push Checklist

- [ ] Run `npm run build` locally
- [ ] Verify all tests pass
- [ ] Review git diff for accidental changes
- [ ] Ensure commit messages are clear

### Platform-Specific Commands

**Windows (CMD)**:
```bash
set PORT=3010 && npm run dev
set BYPASS_AUTH=true
```

**Windows (PowerShell)**:
```bash
$env:PORT=3010; npm run dev
$env:BYPASS_AUTH="true"
```

**Unix/Mac/Git Bash**:
```bash
PORT=3010 npm run dev
export BYPASS_AUTH=true
```

**Killing Process**:
```bash
# Windows
netstat -ano | findstr :3010
taskkill /F /PID <PID>

# Unix/Mac
lsof -ti:3010 | xargs kill -9
```

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

- **Users**: 7-level role hierarchy (SUPER_ADMIN → ADMIN → CHIEF → LEADER → HEAD → MEMBER → USER)
  - ⚠️ **SUPER_ADMIN not yet implemented** - Planned for IT Service Phase 5
  - Requires enum migration + refactoring 6 files with hard-coded `role === 'ADMIN'` checks
  - See `IT_SERVICE_MODULE_CONFLICT_ANALYSIS.md` (lines 27-95) for implementation plan
  - Role hierarchy helper needed: `hasRoleLevel(userRole, requiredRole)` function
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
       queryClient.setQueryData(keys.detail(id), (old: any) => ({
         ...old,
         ...data,
       }));
       return { previousData };
     },
     onError: (error, { id }, context) => {
       if (context?.previousData) {
         queryClient.setQueryData(keys.detail(id), context.previousData);
       }
     },
     onSettled: (response) => {
       queryClient.invalidateQueries({
         queryKey: keys.detail(response.resource.id),
       });
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

4. **Type Safety Best Practices** ⭐ **NEW - 100% Type Safe** (as of 2025-10-30)

   **RULE: NEVER use `as any` - The project is now 100% type-safe (0/49 `as any` assertions remaining)**

   **Strategy 1: Type Inference with Generics**
   ```typescript
   // ❌ BAD - Using 'as any'
   const data = queryClient.getQueryData(key) as any;

   // ✅ GOOD - Let TypeScript infer with generics
   const data = queryClient.getQueryData<BoardData>(key);
   ```

   **Strategy 2: Type Guards for Union Types**
   ```typescript
   // When working with unknown data shapes
   function isBoardData(data: unknown): data is BoardData {
     return (
       typeof data === 'object' &&
       data !== null &&
       'project' in data &&
       'statuses' in data &&
       'tasks' in data
     );
   }

   // Usage
   const data = queryClient.getQueryData(key);
   if (isBoardData(data)) {
     // TypeScript knows data is BoardData here
     console.log(data.project.name);
   }
   ```

   **Strategy 3: Strategic Use of `unknown` for Type Narrowing**
   ```typescript
   // When direct type conversion fails, use double cast pattern
   // This is safer than 'as any' because it forces explicit conversion
   const converted = (sourceValue as unknown as TargetType);

   // Example: Converting between similar but incompatible types
   const task = (taskFromApi as unknown as TaskWithProject);
   ```

   **Strategy 4: Omit Pattern for Interface Extension Conflicts**
   ```typescript
   // When Prisma types have Date but API returns string
   export interface ProjectWithRelations
     extends Omit<Project, 'createdAt' | 'updatedAt'> {
     createdAt?: string;  // Override as string for JSON responses
     updatedAt?: string;
   }

   // When extending with conflicting fields
   export interface UserWithExtras
     extends Omit<User, 'notes' | 'additionalRoles'> {
     notes?: string;  // Override nullable field
     additionalRoles?: string[];
   }
   ```

   **Strategy 5: Optional vs Nullable Fields**
   ```typescript
   // ❌ WRONG - Conflicts with Zod schema using optional
   interface TaskFormData {
     startDate: string | null;
     dueDate: string | null;
   }

   // ✅ CORRECT - Matches Zod schema and defaultValues
   interface TaskFormData {
     startDate?: string;  // Optional field, not nullable
     dueDate?: string;
   }
   ```

   **Strategy 6: React Query Optimistic Update Types**
   ```typescript
   // Proper typing for optimistic updates
   const mutation = useSyncMutation({
     mutationFn: ({ id, data }: { id: string; data: Partial<Task> }) =>
       api.patch(`/api/tasks/${id}`, data),
     onMutate: async ({ id, data }) => {
       await queryClient.cancelQueries({ queryKey: taskKeys.detail(id) });

       // Type-safe cache access
       const previousTask = queryClient.getQueryData<TaskWithRelations>(
         taskKeys.detail(id)
       );

       // Type-safe cache update
       queryClient.setQueryData<TaskWithRelations>(
         taskKeys.detail(id),
         (old) => old ? { ...old, ...data } : undefined
       );

       return { previousTask };
     },
     onError: (error, { id }, context) => {
       if (context?.previousTask) {
         queryClient.setQueryData(taskKeys.detail(id), context.previousTask);
       }
     },
   });
   ```

   **When to Use Each Strategy:**

   | Situation | Strategy | Example |
   |-----------|----------|---------|
   | React Query cache operations | Type Inference (Generics) | `getQueryData<T>(key)` |
   | Unknown API responses | Type Guards | `isValidData(data)` |
   | Incompatible but similar types | Double Cast via `unknown` | `(x as unknown as Y)` |
   | Prisma Date vs API string | Omit Pattern | `extends Omit<T, 'date'>` |
   | Form fields with Zod | Optional vs Nullable | `field?: string` not `\| null` |
   | Library type mismatches | Strategic `as any` + comment | `// @ts-ignore - Library issue` |

   **See P0_TYPE_SAFETY_REFACTORING_COMPLETE.md for 49 real-world examples**

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
- `src/hooks/use-service-requests.ts` - IT Service requests data and mutations ⭐ **NEW**
- `src/hooks/use-system-settings.ts` - System settings (SUPER_ADMIN only) ⭐ **NEW (Planned)**
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

### MCP (Model Context Protocol) Tools

This project has integrated MCP tools for enhanced development workflow.

**Configuration**: See `.mcp.json` for server configurations

#### Available MCP Servers

1. **Next.js DevTools MCP** (`mcp__next-devtools__*`)
   - **Browser automation** - Test pages with real browser rendering
   - **Runtime diagnostics** - Query Next.js dev server for errors, routes, logs
   - **Cache Components** - Enable and verify Cache Components in Next.js 16
   - **Documentation search** - Search Next.js official documentation
   - **Upgrade assistant** - Guide through Next.js 16 upgrade process

   **Useful for**:
   - Testing pages with JavaScript execution (better than curl)
   - Debugging runtime errors from Next.js dev server
   - Searching Next.js docs for latest features
   - Upgrading to Next.js 16 with automated codemods

2. **GitHub MCP** (`mcp__github__*`)
   - **Repository management** - Create repos, fork, create branches
   - **File operations** - Create/update files, push multiple files
   - **Issue and PR management** - Create issues, PRs, reviews, merge
   - **Search** - Search repositories, code, issues, users

   **Useful for**:
   - Creating PRs with proper formatting
   - Managing issues programmatically
   - Bulk file updates in a single commit
   - Searching across repositories

3. **PostgreSQL MCP** (`mcp__postgres__*`)
   - **Database queries** - Execute read-only SQL queries

   **Useful for**:
   - Quick database queries for verification
   - Data inspection without Prisma Studio

**When to use MCP tools**:
- Browser automation: Testing pages with runtime JavaScript (Next.js runtime errors)
- GitHub: Creating PRs, managing issues, bulk file operations
- PostgreSQL: Quick data verification queries

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
     const hasAccess = await checkPermission(userId, "resource.read", {
       resourceId,
     });
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

## Next.js 15 Migration Lessons

**Important lessons learned from deploying to Render with Next.js 15** (2025-10-27):

### 1. **Route Params are Promises**

**Issue**: Next.js 15 changed dynamic route params to be Promise-based.

**Old (Next.js 14):**

```typescript
async function handler(
  req: AuthenticatedRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params; // Direct access
}
```

**New (Next.js 15):**

```typescript
async function handler(
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; // Must await
}
```

**Why it matters:**

- Dev mode (`npm run dev`) works with old pattern due to compatibility layer
- Production build (`npm run build`) fails with type error
- Must update all dynamic route handlers: `[id]`, `[projectId]`, `[taskId]`, etc.

---

### 2. **Middleware Type Compatibility**

**Issue**: Middleware return types must be compatible with Next.js 15 route handler signature.

**Problem:**

```typescript
// ❌ This causes type error in build
export function withAuth<T>(handler: ApiHandler<T>): ApiHandler<T> {
  // ApiHandler expects AuthenticatedRequest
}
```

**Solution:**

```typescript
// ✅ Return NextRouteHandler for Next.js compatibility
type NextRouteHandler<T> = (
  req: NextRequest,
  context: T
) => Promise<NextResponse> | NextResponse;

export function withAuth<T>(handler: ApiHandler<T>): NextRouteHandler<T> {
  // Accept NextRequest, cast to AuthenticatedRequest internally
}
```

**Why it matters:**

- Next.js expects handlers to accept `NextRequest` not custom extended types
- Middleware must cast internally, not in the type signature
- Affects all middleware: `withAuth`, `withPermission`, `withRole`, `apiHandler`

---

### 3. **Build Tools Must Be in dependencies**

**Issue**: Packages used during build must be in `dependencies`, not `devDependencies`.

**Problem packages:**

```json
{
  "devDependencies": {
    "autoprefixer": "^10.4.21", // ❌ Build needs this
    "postcss": "^8.5.6", // ❌ Build needs this
    "tailwindcss": "^3.4.18", // ❌ Build needs this
    "@tanstack/react-query-devtools": "^5.90.2" // ❌ Imported in code
  }
}
```

**Solution:**
Move to `dependencies` so Render installs them during production build.

**Why it matters:**

- Render may use `npm ci --production` or skip devDependencies
- PostCSS processing requires autoprefixer during build
- Any package imported in code (even with `if (dev)` check) must be available at build time

---

### 4. **Git Tracking is Critical**

**Issue**: Files not tracked by Git won't exist in deployment.

**Common mistake:**

```bash
# Create new files locally
touch src/hooks/use-workspace.ts
touch src/components/ui/progress.tsx

# Work with them in dev mode ✅
# But forget to git add ❌

git push  # Files NOT pushed!
```

**Result:** Render build fails with "Module not found" errors.

**Solution:**

```bash
# Always check untracked files before push
git status

# Add ALL new files
git add src/

# Verify before commit
git status
```

**Why it matters:**

- Local dev works because files exist locally
- Render clones from Git - if file not in Git, it doesn't exist
- 39 files were missing in this project's first deployment attempt

---

### 5. **Dev Mode vs Build Mode**

**Issue**: Development and production builds behave very differently.

**Development (`npm run dev`):**

- ✅ Lenient type checking
- ✅ Type warnings shown but don't block
- ✅ JIT compilation (only compile pages you visit)
- ✅ Compatibility mode for Next.js 15 features
- ⚡ Fast (~2s startup)

**Production (`npm run build`):**

- ❌ Strict type checking (TypeScript compiler runs on ALL files)
- ❌ Type errors BLOCK build entirely
- ❌ AOT compilation (compile everything)
- ❌ No compatibility mode - must follow Next.js 15 exactly
- 🐌 Slow (~3-5 minutes)

**Best practice:**

```bash
# Test production build locally BEFORE deploying
npm run build

# If build passes locally, it should pass on Render
```

**Why it matters:**

- 4 out of 5 deployment errors were caught by running `npm run build` locally
- Dev mode hides type errors that will fail in production
- Always test build before pushing to deployment

---

### 6. **useSearchParams Requires Suspense Boundary**

**Issue**: Client components using `useSearchParams()` must be wrapped in Suspense boundary.

**Error:**

```
Error occurred prerendering page "/verify-email"
useSearchParams() should be wrapped in a suspense boundary at page "/reset-password"
```

**❌ Wrong approach:**

```typescript
"use client";
export const dynamic = "force-dynamic"; // Doesn't work with 'use client'

export default function Page() {
  const searchParams = useSearchParams(); // ❌ Error at build time
  // ...
}
```

**✅ Correct pattern:**

```typescript
'use client';
import { Suspense } from 'react';

function PageContent() {
  const searchParams = useSearchParams(); // ✅ Inside Suspense
  // ... component logic
}

export default function Page() {
  return (
    <Suspense fallback={<LoadingUI />}>
      <PageContent />
    </Suspense>
  );
}
```

**Why it matters:**

- Next.js 15 tries to pre-render pages at build time
- `useSearchParams()` needs runtime URL data (not available at build)
- Suspense boundary tells Next.js to render this part dynamically at request time
- Without Suspense: build fails with prerender error
- Applies to: verify-email, reset-password, any page using URL params

**Files affected in this project:**

- `src/app/(auth)/verify-email/page.tsx`
- `src/app/(auth)/reset-password/page.tsx`

---

### 7. **TypeScript Error Prevention & Best Practices** ⭐ **CRITICAL**

**Lessons from fixing 156 type errors in Session 4:**

#### **Strategy 1: Local Type Checking BEFORE Deploy**

**Problem:** Each deployment cycle = 5-10 minutes on Render. 156 errors × 5 min = 780 minutes wasted!

**Solution:**

```bash
# Add to package.json scripts
"type-check": "tsc --noEmit --skipLibCheck"

# Run BEFORE every git push
npm run type-check

# Count errors
npm run type-check 2>&1 | grep "error TS" | wc -l
```

**Benefit:** Catch errors in 2-3 minutes locally instead of 5-10 minutes on Render.

---

#### **Strategy 2: Hybrid Approach for Large Refactors**

When facing massive type errors (100+), use this phased approach:

**Phase 1: Temporary Relaxation**

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": false, // Disable temporarily
    "noImplicitAny": false,
    "strictNullChecks": false
  }
}
```

**Phase 2: Deploy & Verify Runtime**

- Push to production with relaxed types
- Verify app works functionally
- Ensures no runtime errors hiding behind type errors

**Phase 3-5: Incremental Fixes**

- Fix largest files first (use `grep "error TS" | sort | uniq -c`)
- Fix by pattern (function signatures, API routes, components)
- Target 20-30% reduction per phase

**Phase 6: Re-enable Strict Mode**

- Turn `strict: true` back on
- Fix any new errors with proper types
- Merge to main

**Benefits:**

- Unblocks deployment quickly
- Allows parallel work (deploy + fix types)
- Reduces risk of breaking changes
- 156 errors → 0 in 1 session using this method

---

#### **Strategy 3: Common Type Fixes Pattern**

**1. Function Signature Mismatches**

```typescript
// ❌ Problem: Arguments mismatch
openTaskPanel(taskId, projectId); // Function expects 1 arg, got 2

// ✅ Solution: Check function signature
const openTaskPanel = useUIStore((state) => state.openTaskPanel);
// Signature: openTaskPanel: (taskId: string) => void

// Fix:
openTaskPanel(taskId); // ✅ Correct
```

**2. Type Assertions for Complex Types**

```typescript
// ❌ Problem: Property doesn't exist on type
task.project?.name(
  // Error: Property 'project' does not exist on type 'Task'

  // ✅ Quick fix (when relation exists at runtime):
  task as any
).project?.name; // Cast to any

// ✅ Better fix (update interface):
interface Task {
  // ... existing fields
  project?: {
    // Add optional relation
    id: string;
    name: string;
  };
}
```

**3. API Response Type Conflicts**

```typescript
// ❌ Problem: Union type without guard
if (!response.data.success) {
  throw new Error(response.data.error?.message); // Property 'error' doesn't exist
}

// ✅ Solution: Type cast for error case
if (!response.data.success) {
  throw new Error((response.data as any).error?.message || "Request failed");
}
```

**4. Prisma Type Mismatches**

```typescript
// ❌ Problem: Generated Prisma types don't match schema
await prisma.notification.createMany({
  data: notifications, // Type error: incompatible fields
});

// ✅ Solution 1: ts-ignore (for schema issues)
// @ts-ignore - Prisma generated type mismatch
await prisma.notification.createMany({
  data: notifications,
});

// ✅ Solution 2: ts-nocheck entire file (for API routes with many Prisma calls)
// @ts-nocheck - Prisma type issues
import { prisma } from "@/lib/db";
// ... rest of file
```

**5. React Hook Form Types**

```typescript
// ❌ Problem: Zod resolver type mismatch
resolver: zodResolver(schema)  // Type error

// ✅ Solution: Cast resolver
resolver: (zodResolver as any)(schema)

// Or cast control:
<Controller
  control={control as any}
  // ...
/>
```

**6. Enum Value Mismatches**

```typescript
// ❌ Problem: Enum value not in accepted set
statusType: "ABORTED"; // Type '"ABORTED"' not assignable to type '"NOT_STARTED" | "IN_PROGRESS" | "DONE" | "CANCELED"'

// ✅ Solution 1: Cast entire array
const statuses = data.map((s) => ({
  statusType: s.statusType,
})) as any;

// ✅ Solution 2: Update type definition
type StatusType =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "DONE"
  | "CANCELED"
  | "ABORTED";
```

---

#### **Strategy 4: Files Modified Pattern (from 156→0 errors fix)**

**Categorize errors by file type:**

| Category   | Files     | Strategy                               |
| ---------- | --------- | -------------------------------------- |
| API Routes | ~15 files | Use `// @ts-nocheck` for Prisma issues |
| Components | ~14 files | Type casts, fix signatures             |
| Hooks      | ~3 files  | Fix query keys, type definitions       |
| Types      | ~2 files  | Add missing fields to interfaces       |
| Config     | 1 file    | Adjust tsconfig strictness             |

**Example commands:**

```bash
# Count errors by file
npm run type-check 2>&1 | grep "error TS" | cut -d'(' -f1 | sort | uniq -c | sort -rn

# Find files with most errors
npm run type-check 2>&1 | grep "^src/" | cut -d':' -f1 | sort | uniq -c | sort -rn | head -10
```

---

#### **Strategy 5: When to Use Each Fix**

| Type Error             | Quick Fix                 | Proper Fix             | Use When                 |
| ---------------------- | ------------------------- | ---------------------- | ------------------------ |
| Property doesn't exist | `(obj as any).prop`       | Add to interface       | Runtime relation exists  |
| Function args mismatch | Check signature, fix call | Update function        | Wrong arguments passed   |
| Prisma type issues     | `@ts-nocheck` file        | Wait for Prisma update | Schema generation bug    |
| React Hook Form        | `as any` cast             | Use proper generics    | Complex form types       |
| Enum mismatch          | `as any` cast             | Update type definition | Missing enum value       |
| API response           | `(data as any).field`     | Type guard             | Union type without guard |

---

#### **Strategy 6: Prevention Checklist**

**Before writing new code:**

- ✅ Import types from centralized location (`@/hooks/use-*.ts`, `@/types/*.ts`)
- ✅ Use existing interfaces instead of creating duplicates
- ✅ Check function signatures with Cmd+Click (VS Code)
- ✅ Enable TypeScript errors in editor (don't ignore red squiggles)

**During development:**

- ✅ Fix type errors as you go (don't accumulate)
- ✅ Run `npm run type-check` every 30 minutes
- ✅ Commit only when type-check passes

**Before deployment:**

- ✅ Run `npm run build` locally (catches all type + runtime errors)
- ✅ Run `npm run type-check` (faster than full build)
- ✅ Check `git status` for untracked files
- ✅ Review changed files for accidental type casts

---

### Quick Checklist for Next.js 15 Deployment

Before deploying to Render, verify:

- [ ] All route params use `Promise<{}>` type and `await params`
- [ ] Middleware returns `NextRouteHandler` type (not `ApiHandler`)
- [ ] `useSearchParams()` wrapped in `<Suspense>` boundary
- [ ] Build tools in `dependencies` (autoprefixer, postcss, tailwindcss)
- [ ] Runtime packages in `dependencies` (@tanstack/react-query-devtools)
- [ ] Run `git status` to check for untracked files
- [ ] Run `npm run type-check` to catch type errors (156 errors = 780 min wasted!)
- [ ] Run `npm run build` locally to catch all errors
- [ ] All new files are committed: `git add src/` then `git push`
- [ ] Review `tsconfig.json` - strict mode enabled? (disable temporarily for large refactors)

---

## Troubleshooting

### Critical Development Rule Violations ⭐ **MOST COMMON**

1. **Accumulating type errors instead of fixing immediately** ⭐ **#1 ISSUE**
   - Symptom: Build fails on Render with 100+ type errors (5-10 min per error!)
   - Fix: Fix type errors AS YOU CODE. Run `npm run type-check` every 30 min
   - Impact: 156 errors = 780 minutes wasted on Render feedback loop
   - See: [Critical Development Rules - Rule 1](#rule-1-never-accumulate-type-errors)

2. **Not wrapping useSearchParams() in Suspense boundary**
   - Symptom: Build fails with "useSearchParams() should be wrapped in a suspense boundary"
   - Fix: Wrap component using `useSearchParams()` in `<Suspense>` (see Rule 2)

3. **Using direct params access instead of Promise pattern**
   - Symptom: TypeScript error in production build (works in dev mode)
   - Fix: Use `{ params }: { params: Promise<{ id: string }> }` and `await params`

4. **Not checking git status before push (missing files)**
   - Symptom: Build fails with "Module not found" errors
   - Fix: Always run `git status` before push, add untracked files with `git add src/`
   - Impact: 39 files were missing in first deployment!

5. **Not running type-check before FINAL commit**
   - Symptom: Build fails on Render with type errors
   - Fix: Run `npm run type-check` before FINAL commit (2-3 min locally vs. 5-10 min on Render)

6. **Not running build test before FINAL push**
   - Symptom: Production build fails (dev mode was lenient)
   - Fix: Run `npm run build` before FINAL push (catches 80% of deployment errors)

### Build & Deployment Issues

**Server Won't Start** - `Error: listen EADDRINUSE :::3000`
```bash
# Option 1: Use different port
PORT=3010 npm run dev  # Unix/Mac
set PORT=3010 && npm run dev  # Windows CMD

# Option 2: Kill process
netstat -ano | findstr :3010  # Windows - Find PID
taskkill /F /PID <PID>        # Windows - Kill
lsof -ti:3010 | xargs kill -9 # Unix/Mac - Kill
```

**Webpack/Build Cache Errors** - `TypeError: __webpack_modules__[moduleId] is not a function`
```bash
# 1. Kill dev server
# 2. Delete cache
rm -rf .next  # Unix/Mac/Git Bash
rd /s /q .next  # Windows CMD

# 3. Restart
PORT=3010 npm run dev
```

**Windows Build Error (EPERM)** - `Error: EPERM: operation not permitted, scandir`
```bash
# Solution: Use Turbopack
"build": "npx prisma generate && next build --turbo"
npm run build  # Builds in ~6s
```

**Production 403 Forbidden (CSRF/CORS)** - All POST/PATCH/DELETE fail with 403
```typescript
// Fix: Add production domains to allowedOrigins
// src/lib/csrf.ts (line ~112)
// src/middleware.ts (line ~72)
const allowedOrigins = [
  "https://projectflows.app",
  "https://projectflows.onrender.com",
  // ...
];
```

### Development Issues

**Prisma Client Errors** - `Cannot find module '@prisma/client'`
```bash
npm run prisma:generate  # Regenerate client

# If fails:
rm -rf src/generated/prisma
npm run prisma:generate
```

**Authentication Issues** - `401 Unauthorized` on all requests
```bash
# Use bypass mode for development
# Add to .env: BYPASS_AUTH=true

# Or re-login to get fresh token
curl -X POST http://localhost:3010/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hospital.test","password":"SecurePass123!"}'
```

**Hot Reload Not Working**
```bash
# 1. Hard refresh browser (Ctrl+Shift+R)
# 2. Clear Next.js cache
rm -rf .next
npm run dev

# 3. If WSL, check file watchers
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

**React Hooks Order Errors** - `Rendered more hooks than during the previous render`
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
**Fix**: Always call hooks in the same order on every render.

### Database Issues

**Database Connection Issues** - `Can't reach database server`
```bash
# 1. Check DATABASE_URL in .env
# 2. Test connection
npm run prisma:studio

# 3. Push schema if empty
npm run prisma:push

# 4. Seed with test data
npx prisma db execute --file ./prisma/seed.sql --schema ./prisma/schema.prisma
```

### Common Code Mistakes

**Forgetting `npm run prisma:generate` after schema changes**
- Symptom: TypeScript errors about missing Prisma types
- Fix: Always run `npm run prisma:generate` after editing `schema.prisma`

**Using hard deletes instead of soft deletes**
- Symptom: Data permanently deleted
- Fix: Use `prisma.model.update({ data: { deletedAt: new Date() } })` NOT `.delete()`

**Not using optimistic updates for interactive UI**
- Symptom: UI feels slow
- Fix: Read `OPTIMISTIC_UPDATE_PATTERN.md` and use `useSyncMutation`

**Importing Prisma from wrong location**
- Symptom: `PrismaClient is not a constructor` error
- Fix: Use `import { prisma } from "@/lib/db"` NOT `from "@prisma/client"`

**Deploying with BYPASS_AUTH enabled**
- Symptom: No authentication (CRITICAL SECURITY ISSUE)
- Fix: Always set `BYPASS_AUTH=false` in production

---

## Quick Start for New Claude Instances

### ⚠️ Critical Information

**PROJECT STATUS**:

- ✅ Backend: 100% Complete (81+ API endpoints)
- ✅ Frontend: 98% Complete (47/48 major components for Version 1.5)
- ✅ **PRODUCTION-READY** - Successfully deployed to Render (2025-10-27)
- 🎯 Version 1.5 target: 2025-11-15 (2 weeks remaining)
- 📦 Version 2.0 planning phase (9 advanced components)

**KNOWN CRITICAL BUGS**: None (all resolved as of 2025-10-27)

**DEPLOYMENT STATUS**: Live on Render with Next.js 15

---

### 🚨 Critical Development Rules (Next.js 15)

**⭐ MANDATORY - Read this section first! These rules prevent deployment failures.**

**Phase 1: Write Code Correctly First (Rules 1-3)**

#### Rule 1: Never Accumulate Type Errors

```bash
# Fix type errors AS YOU WRITE CODE
# Run type-check every 30 minutes during development
npm run type-check

# DO NOT let errors pile up - 156 errors = 780 minutes wasted!
# Fix errors immediately when they appear in your editor
```

**Why this matters:**

- Catching errors early = easier to fix (context is fresh)
- Accumulated errors = hard to debug (lost context)
- Dev mode hides errors that WILL fail in production build

#### Rule 2: useSearchParams() MUST Be Wrapped in Suspense

```typescript
// ❌ WRONG - Build fails with prerender error
'use client';
export default function Page() {
  const searchParams = useSearchParams();
  // ...
}

// ✅ CORRECT - Wrap in Suspense boundary
'use client';
import { Suspense } from 'react';

function PageContent() {
  const searchParams = useSearchParams();
  // ...
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PageContent />
    </Suspense>
  );
}
```

**Why this matters:**

- Next.js 15 tries to pre-render pages at build time
- `useSearchParams()` needs runtime URL data (not available at build)
- Without Suspense: Build fails with prerender error

#### Rule 3: Route Params MUST Use Promise Pattern (Next.js 15)

```typescript
// ❌ WRONG - Works in dev, FAILS in production build
async function handler(req: Request, { params }: { params: { id: string } }) {
  const { id } = params;
}

// ✅ CORRECT - Next.js 15 requires Promise
async function handler(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; // Must await!
}
```

**Why this matters:**

- Next.js 15 changed params to Promise-based
- Dev mode works with old pattern (compatibility layer)
- Production build FAILS with type error

---

**Phase 2: Before FINAL Commit/Push (Rules 4-6)**

#### Rule 4: ALWAYS Check Git Status Before Pushing

```bash
# Step 1: Check ALL files (untracked + modified)
git status

# Step 2: Search for feature-related modified files
git diff --name-only | grep -i <feature-name>
# Example: git diff --name-only | grep -i division

# Step 3: Review each modified file
git diff <file-path>
# Example: git diff src/components/navigation/breadcrumb.tsx

# Step 4: Add ALL relevant files
git add src/app/(dashboard)/division/
git add src/components/navigation/breadcrumb.tsx  # Don't forget modified files!
git add DIVISION_VIEW_DESIGN.md

# Step 5: Verify before commit
git status
```

**Why this matters:**

- Files not in Git = don't exist in deployment
- **Modified files can be as important as new files** (e.g., breadcrumb navigation)
- Local dev works because files exist locally
- Render clones from Git - missing files = build failure
- grep helps find related files you might forget

**Common Mistake:**
- ❌ Only adding new files (`git add src/app/...`)
- ✅ Also checking modified files with grep (`git diff --name-only | grep feature`)

#### Rule 5: ALWAYS Type-Check Before FINAL Committing

```bash
# Run BEFORE FINAL git commit
npm run type-check

# If errors found, fix ALL before committing
# Local type-check = 2-3 minutes
# Render feedback loop = 5-10 minutes per error!
```

**Why this matters:**

- Catches type errors locally in 2-3 minutes
- vs. 5-10 minutes per error on Render
- 156 errors × 5 min = 780 minutes saved!

#### Rule 6: ALWAYS Test Build Locally Before FINAL Pushing

```bash
# Run BEFORE FINAL git push
npm run build

# Dev mode (npm run dev) is LENIENT - Production build is STRICT
# 4/5 deployment errors caught by local build testing
```

**Why this matters:**

- Dev mode hides errors that production build catches
- Local build test = 3-5 minutes
- Render build failure = wasted deployment time
- Catches 80% of deployment errors locally

---

**💡 See [Next.js 15 Migration Lessons](#nextjs-15-migration-lessons) for detailed explanations**

---

### First Steps (5 minutes)

1. **Read "Critical Development Rules" above** ⭐ **MANDATORY**
2. **Check "Current Priority"** section for what to work on
3. **Review "Key Files to Know"** for essential files
4. **Read [Next.js 15 Migration Lessons](#nextjs-15-migration-lessons)** for deployment best practices

---

### What You're Being Asked To Do

**If implementing a new feature**:

1. Check if design exists in documentation files (see Documentation Index)
2. Follow "Common Workflows" patterns
3. Use optimistic updates for interactive UI (see OPTIMISTIC_UPDATE_PATTERN.md)
4. Reference existing views for consistency
5. **Run `npm run type-check` after completing feature**
6. **Run `npm run build` before committing**
7. Check recently completed features for similar patterns

**If fixing a bug**:

1. Check "Troubleshooting" section first
2. Look for recent `*_BUG_FIX*.md` or `*_COMPLETE.md` files
3. Use `git log --oneline --since="7 days ago"` to see recent changes
4. Check if issue is webpack cache-related (see Troubleshooting)
5. **Run `npm run type-check` to identify type errors**
6. Read related context `.md` files

**If debugging an issue**:

1. Check recent .md files in project root (sorted by date in git status)
2. Review `*_COMPLETE.md` files for implementation details
3. Check `*_BUG_FIX*.md` files for known issues and solutions
4. Use git blame to identify recent changes to problematic files
5. Check CLAUDE.md version number for context (currently v2.23.0)
6. Clear Next.js cache if experiencing module resolution errors (`rm -rf .next`)
7. **Run `npm run type-check` to check for type errors**

**If adding an API endpoint**:

1. Follow API endpoint pattern in "Common Workflows"
2. **Use Promise-based params**: `{ params }: { params: Promise<{ id: string }> }`
3. **Await params**: `const { id } = await params;`
4. Use `withAuth()` middleware for authentication
5. Check permissions with `checkPermission()` or `canManageTargetUser()`
6. Use soft deletes (update with deletedAt, never .delete())
7. Return data using successResponse() / errorResponse()
8. Add TypeScript types to src/types/
9. Create corresponding React Query hook in src/hooks/
10. **Run `npm run type-check` after implementation**

**If working on IT Service Module**:

1. Check `IT_SERVICE_MODULE_SPECIFICATION.md` for detailed spec (2,800+ lines)
2. Check `IT_SERVICE_MODULE_CONFLICT_ANALYSIS.md` for resolved conflicts
3. Check session summaries: `IT_SERVICE_SESSION_2_SUMMARY.md`, `IT_SERVICE_SESSION_3_SUMMARY.md`
4. Follow same patterns: type safety (NO `as any`), optimistic updates, Next.js 15 compliance
5. Add fiscalYear field to ServiceRequest table (use `buildFiscalYearFilter` helper)
6. Test with local PostgreSQL database (see `LOCAL_DEVELOPMENT_SETUP.md`)
7. SUPER_ADMIN role implementation required before Phase 5 (System Settings)
8. 6 files need role hierarchy refactoring (replace hard-coded `role === 'ADMIN'` checks)
9. USER role must be isolated to IT Service portal (no access to main dashboard)
10. Request forms must follow consistent modal structure (see Session 3 summary)

**If asked about the codebase**:

1. Check CLAUDE.md (this file) for overview and current status
2. Check `PROJECT_STATUS.md` for detailed progress (may be outdated)
3. Check documentation files (see "Documentation Index" below)
4. Read Prisma schema for database structure
5. Check migration_plan/ for migration context (migration complete but docs useful)

---

### Key Things to Remember

**Phase 1: Write Code Correctly First**

1. ⭐ **Never accumulate type errors** - Fix as you code, run `npm run type-check` every 30 min
2. ⭐ **useSearchParams() needs Suspense** - Wrap in `<Suspense>` boundary (NOT direct use)
3. ⭐ **Route params are Promises in Next.js 15** - Must use `Promise<{ id }>` and `await params`

**Phase 2: Before FINAL Commit/Push** 4. ⭐ **Git tracking** - Always `git status` before push to check untracked files 5. ⭐ **Type-check before FINAL commit** - Run `npm run type-check` (2-3 min locally) 6. ⭐ **Build test before FINAL push** - Run `npm run build` (catches 80% of errors)

**Project-Specific Patterns**
7. ⭐ **FISCAL YEAR SCOPE** - ALWAYS use `useFiscalYearStore` for global fiscal year filter (see [Fiscal Year Scope](#fiscal-year-scope--critical---always-use))
8. **Production-ready** - Deployed on Render (2025-10-27)
9. **Port 3010** - Dev server runs here (not 3000)
10. **BYPASS_AUTH=true** - Use in `.env` for local testing only
11. **Always run `npm run prisma:generate`** after schema changes
12. **Type Safety** - NEVER use `as any` - see [Type Safety Best Practices](#type-safety-best-practices) for 6 strategies
13. **Optimistic updates everywhere** - See `OPTIMISTIC_UPDATE_PATTERN.md`
14. **Thai terminology matters** - Use correct terms (หน่วยงาน not แผนก)
15. **Soft deletes only** - Never use `.delete()`, use `update({ data: { deletedAt: new Date() } })`
16. **Multi-assignee system** - Use `assigneeUserIds` array, not singular `assigneeUserId`
17. **Use `prisma.history`** NOT `prisma.activityLog`

---

### Most Important Files

**Backend**:

- `src/lib/auth.ts` - Session management
- `src/lib/permissions.ts` - RBAC system (621 lines)
- `src/lib/api-middleware.ts` - withAuth() wrapper

**Frontend**:

- `src/hooks/use-*.ts` - React Query hooks (13+ files)
- `src/stores/use-*-store.ts` - Zustand stores
- `OPTIMISTIC_UPDATE_PATTERN.md` - UI update pattern ⭐ **MUST READ**

**Documentation**:

- `CLAUDE.md` (this file) - Primary reference
- [Next.js 15 Migration Lessons](#nextjs-15-migration-lessons) - Deployment best practices ⭐ **MUST READ**
- [Type Safety Best Practices](#type-safety-best-practices) - 100% type-safe patterns ⭐ **MUST READ**
- `P0_TYPE_SAFETY_REFACTORING_COMPLETE.md` - Complete refactoring report (49 `as any` removed)
- `PERMISSION_GUIDELINE.md` - Security & permissions
- `migration_plan/` - Migration context (complete, but useful reference)

**Configuration**:

- `prisma/schema.prisma` - Database schema (21 tables)
- `tsconfig.json` - TypeScript config (strict mode enabled)
- `.env` - Environment variables

---

### When In Doubt

1. **Run `npm run type-check`** - Catches type errors in 2-3 minutes locally
2. **Run `npm run build`** - Test production build before pushing
3. Look for existing patterns (81+ API endpoints, multiple complete views)
4. Read the relevant `.md` file (excellent documentation)
5. Read [Next.js 15 Migration Lessons](#nextjs-15-migration-lessons) section
6. Check [Troubleshooting](#troubleshooting) for common issues
7. Ask the user (better to clarify than assume)

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

### Fiscal Year Scope ⭐ **CRITICAL - ALWAYS USE**

**The entire application uses a global fiscal year filter. You MUST use it in all data fetching hooks.**

**Why it matters:**
- Users can select 1-5 fiscal years from the navbar filter (e.g., 2568, 2567, 2566)
- All tasks, projects, and reports are scoped by these selected years
- If you don't use it, you'll show data from ALL years (wrong!)

**How to use:**

```typescript
// In React Query hooks (use-*.ts)
import { useFiscalYearStore } from "@/stores/use-fiscal-year-store";

export function useYourDataHook(id: string, filters: YourFilters) {
  // 1. Read selected years from global store
  const selectedYears = useFiscalYearStore((state) => state.selectedYears);

  return useQuery({
    // 2. Include in query key (for cache invalidation)
    queryKey: yourKeys.list(id, filters, selectedYears),
    // 3. Pass to fetch function
    queryFn: () => fetchYourData(id, filters, selectedYears),
  });
}

// In fetch functions
async function fetchYourData(
  id: string,
  filters: YourFilters,
  fiscalYears: number[]
) {
  const params: Record<string, string> = {};

  // 4. Add fiscalYears to API params
  if (fiscalYears && fiscalYears.length > 0) {
    params.fiscalYears = fiscalYears.join(",");
  }

  // ... rest of params
  return await api.get(`/api/your-endpoint`, { params });
}
```

**In API routes:**
```typescript
// API automatically receives fiscalYears and filters with buildFiscalYearFilter
import { buildFiscalYearFilter } from "@/lib/fiscal-year";

const taskWhereClause = {
  deletedAt: null,
  ...buildFiscalYearFilter(fiscalYears), // Filters tasks by fiscal year
};
```

**Examples of correct usage:**
- ✅ `use-dashboard.ts` - Uses fiscal year scope
- ✅ `use-department-tasks.ts` - Uses fiscal year scope
- ✅ `use-division-overview.ts` - Uses fiscal year scope
- ✅ `use-projects.ts` - Uses fiscal year scope
- ✅ `use-reports.ts` - Uses fiscal year scope

**DO NOT:**
- ❌ Create your own fiscal year filter in toolbars (use global navbar filter)
- ❌ Forget to include `fiscalYears` in query keys (cache won't invalidate correctly)
- ❌ Forget to pass `fiscalYears` to API (you'll get unfiltered data)

**Location:**
- Global filter component: `src/components/filters/fiscal-year-filter.tsx`
- Global store: `src/stores/use-fiscal-year-store.ts`
- Helper functions: `src/lib/fiscal-year.ts`

### SUPER_ADMIN Role Implementation Required ⚠️ **CRITICAL**

**Status**: Not yet implemented (planned for IT Service Phase 5)

**Problem**: 6 files have hard-coded `role === 'ADMIN'` checks that will exclude SUPER_ADMIN:
- `src/components/navigation/breadcrumb.tsx`
- `src/app/api/dashboard/route.ts`
- `src/lib/permissions.ts`
- `src/components/users/user-row.tsx`
- `src/components/users/users-view.tsx`
- `src/components/users/users-table.tsx`

**Why this matters**:
- If SUPER_ADMIN role is added without refactoring these files
- SUPER_ADMIN users will NOT have access to features that check `role === 'ADMIN'`
- This creates a lower-privileged "super admin" (incorrect!)

**Required Solution**: Implement role hierarchy system:
```typescript
// src/lib/permissions.ts
const ROLE_HIERARCHY = {
  SUPER_ADMIN: 7,
  ADMIN: 6,
  CHIEF: 5,
  LEADER: 4,
  HEAD: 3,
  MEMBER: 2,
  USER: 1,
};

export function hasRoleLevel(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

// Usage: Replace all `role === 'ADMIN'` with:
if (hasRoleLevel(user.role, 'ADMIN')) {
  // Allow ADMIN and SUPER_ADMIN
}
```

**Migration Checklist**:
- [ ] Add SUPER_ADMIN to UserRole enum (Prisma schema migration)
- [ ] Create `hasRoleLevel()` helper function
- [ ] Refactor 6 files to use role hierarchy
- [ ] Add SUPER_ADMIN permissions to ROLE_PERMISSIONS
- [ ] Test all ADMIN features work for SUPER_ADMIN
- [ ] Update permission system documentation

**See**: `IT_SERVICE_MODULE_CONFLICT_ANALYSIS.md` (lines 27-95) for detailed implementation plan.

**Effort**: 4-6 hours (schema migration + 6 file refactors + testing)

### Historical Context

This project was migrated from Google Apps Script (GAS) to Next.js 15 + PostgreSQL. **Migration is now complete (2025-10-27)**.

**Preserved naming conventions for backward compatibility:**

- Field names like `dateDeleted` (inconsistent with newer `deletedAt` pattern)
- Priority levels 1-4 (1 = Urgent, 2 = High, 3 = Normal, 4 = Low)
- Thai language UI text and terminology
- Organizational hierarchy structure (กลุ่มภารกิจ → กลุ่มงาน → หน่วยงาน)

**Why these conventions matter:**

- Don't try to "fix" field names to be consistent - database schema uses legacy names
- Don't change priority numbering - business logic depends on 1-4 scale
- Always use Thai terms in UI (หน่วยงาน not แผนก)

---

## Migration Documentation (Historical Reference)

**⚠️ NOTE: Migration is complete as of 2025-10-27. This section is for historical context only.**

The `old_project/` folder and `migration_plan/` folder are archived for reference but **should not be used for implementation guidance**. Use CLAUDE.md and other current documentation instead.

### Migration Summary

**What was migrated:**

- ✅ **Backend**: Google Apps Script → Next.js 15 API Routes (81+ endpoints)
- ✅ **Frontend**: HTML Service → React 18 + Next.js 15 App Router
- ✅ **Database**: Google Sheets → PostgreSQL + Prisma ORM
- ✅ **Auth**: Google OAuth → Session-based Bearer tokens
- ✅ **State Management**: Manual caching → React Query + Zustand
- ✅ **Deployment**: Google Apps Script → Render (Production)

**Key modernizations:**

- REST API architecture (vs. GAS server functions)
- PostgreSQL with Prisma (vs. Google Sheets as database)
- TypeScript with full type safety (vs. JavaScript)
- React Query for server state (vs. manual caching)
- Optimistic UI updates (vs. full page reloads)
- Session-based authentication (vs. Google OAuth only)

### Migration Documentation Files

**⚠️ These files are HISTORICAL REFERENCES ONLY - Do not follow for new development:**

- `migration_plan/00_MIGRATION_OVERVIEW.md` - High-level migration strategy
- `migration_plan/01_DATABASE_MIGRATION.md` - Database schema mapping
- `migration_plan/02_API_MIGRATION.md` - API endpoint mapping
- `migration_plan/03_FRONTEND_MIGRATION.md` - Frontend component mapping
- `migration_plan/04_DEPLOYMENT_GUIDE.md` - Deployment approach
- `migration_plan/05_ROLLOUT_PLAN.md` - Rollout strategy
- `migration_plan/06_BUSINESS_LOGIC_GUIDE.md` - Business logic notes

### old_project/ Folder

**⚠️ DO NOT USE for implementation patterns!**

Contains original GAS codebase (`.gs` files) for historical reference only. Useful for:

- Understanding original business requirements
- Verifying calculation formulas
- Checking Thai text translations

**DO NOT use for:**

- Code patterns (use Next.js 15 patterns in CLAUDE.md instead)
- API structure (completely redesigned)
- Database queries (now using Prisma)
- UI components (now using React + shadcn/ui)

---

## Documentation Index

### Main Documentation

- `README.md` - Project overview and quick start
- `CLAUDE.md` - This file ⭐ **PRIMARY REFERENCE**
- `PROJECT_STATUS.md` - Detailed status (⚠️ May be outdated - check CLAUDE.md for current status)

### Frontend Development

- `P0_TYPE_SAFETY_REFACTORING_COMPLETE.md` - Complete type safety refactoring report (removed 49 `as any`, 6 strategies, 12 files) ⭐ **NEW - MUST READ**
- `OPTIMISTIC_UPDATE_PATTERN.md` - Standard pattern for UI updates (600+ lines) ⭐ **MUST READ**
- `CROSS_DEPARTMENT_TASK_IDENTIFICATION_COMPLETE.md` - Cross-department task badges in Dashboard + Task Panel ⭐ **NEW**
- `DASHBOARD_UI_UX_REFINEMENT_COMPLETE.md` - Dashboard refinements summary (14 changes)
- `SYNC_ANIMATION_SYSTEM.md` - Sync footer animation
- `TASK_PANEL_V1.0_COMPLETE.md` - Task panel completion summary
- `PROJECT_MANAGEMENT_IMPLEMENTATION_SUMMARY.md` - Project management
- `CREATE_TASK_MODAL_IMPLEMENTATION_COMPLETE.md` - Create task modal
- `USER_MANAGEMENT_PERMISSIONS_COMPLETE.md` - User permissions guide
- `FULLNAME_SPLIT_MIGRATION_CONTEXT.md` - User name field migration (442 lines)
- `WORKSPACE_NAVIGATION_REDESIGN.md` - Workspace navigation

### Backend & API

- `TASK_OWNERSHIP_SYSTEM.md` - Complete task ownership implementation (delete permissions, assignment control, widget separation, 7 notification types) ⭐ **NEW - CRITICAL**
- `AUTHENTICATION_IMPLEMENTATION_COMPLETE.md` - Auth system summary
- `PASSWORD_RESET_IMPLEMENTATION.md` - Password reset flow
- `EMAIL_SETUP_GUIDE.md` - Email configuration
- `PERMISSION_GUIDELINE.md` - Comprehensive permission system guide (23+ permissions, v1.3.0 with task owner permissions) ⭐ **IMPORTANT**
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

- `DIVISION_VIEW_DESIGN.md` - Division View executive dashboard (completed) ⭐ **NEW**
- `DIVISION_VIEW_DESIGN_CONSISTENCY.md` - Division View design refinements ⭐ **NEW**
- `MOBILE_LAYOUT_DESIGN.md` - Mobile responsive design (8 phases, 100% complete)
- `NEXT_GOAL_DEPARTMENT_TASKS.md` - Department tasks (completed)
- `DEPARTMENT_TASKS_VIEW_DESIGN.md` - Department tasks design
- `DEPARTMENT_TASKS_GANTT_CHART_DESIGN.md` - Gantt chart plan (future)
- `DEPARTMENT_TASKS_CUSTOM_GROUPING_DESIGN.md` - Custom grouping (future)
- `EDIT_PROJECT_MODAL_IMPLEMENTATION_PLAN.md` - Edit project modal design

### IT Service Module (New Feature) ⭐

- `IT_SERVICE_MODULE_SPECIFICATION.md` - Complete module specification (2,800+ lines) ⭐ **IMPORTANT**
- `IT_SERVICE_MODULE_CONFLICT_ANALYSIS.md` - Conflict analysis and resolutions ⭐ **IMPORTANT**
- `SYSTEM_SETTINGS_DESIGN.md` - System Settings page design (SUPER_ADMIN only)
- `LOCAL_DEVELOPMENT_SETUP.md` - PostgreSQL local development setup guide
- `IT_SERVICE_SESSION_2_SUMMARY.md` - Session 2: Portal UI implementation (Tasks 1-3)
- `IT_SERVICE_SESSION_3_SUMMARY.md` - Session 3: Request forms enhancement (Task 4)

### Recent Refactoring Plans (2025-10-30)

- `REFACTORING_PLAN_2025-10-30.md` - Comprehensive refactoring roadmap (106K+ LOC analysis) ⭐ **NEW**
- `PHASE_1.1_COMPLETE.md` - @ts-nocheck removal complete (14 files fixed) ⭐ **NEW**
- `PHASE_1.1_REMOVE_TS_NOCHECK_PLAN.md` - Planning document for Phase 1.1
- `PHASE_2_ASSIGNEE_MIGRATION_PLAN.md` - Assignee field migration plan ⭐ **NEW**

### Fiscal Year Implementation (Complete)

- `FISCAL_YEAR_FILTER_IMPLEMENTATION.md` - Global fiscal year filter
- `FISCAL_YEAR_PHASE2_COMPLETE.md` - Reports integration
- `FISCAL_YEAR_PHASE3_COMPLETE.md` - Department tasks integration
- `FISCAL_YEAR_PHASE4_COMPLETE.md` - Dashboard integration
- `FISCAL_YEAR_PHASE5_COMPLETE.md` - Projects list integration
- `FISCAL_YEAR_MOBILE_SUPPORT_COMPLETE.md` - Mobile menu support
- `FISCAL_YEAR_MY_TASKS_CHECKLIST_COMPLETE.md` - My Tasks/Checklist support

### Recent Bug Fixes & Improvements (2025-10-24 to 2025-10-30)

- `DATA_LEAKAGE_SECURITY_FIX.md` - Critical security fix for session isolation (React Query cache clearing on login) ⭐ **NEW - CRITICAL**
- `CROSS_DEPARTMENT_TASK_IDENTIFICATION_COMPLETE.md` - Department badges in Dashboard widgets, personal activity feed ⭐ **NEW**
- `PROGRESS_2025-10-26_SESSION2.md` - Modal UX improvements, permission fixes, Thai fullName format ⭐ **NEW**
- `PROJECT_BOARD_PERFORMANCE_COMPLETE.md` - Project Board API optimization (25% faster) - Phase 4 FINAL
- `REPORTS_PERFORMANCE_COMPLETE.md` - Reports API optimization (55% faster) - Phase 3
- `DEPARTMENT_TASKS_PERFORMANCE_COMPLETE.md` - Department Tasks API (65% faster) - Phase 2
- `DASHBOARD_PERFORMANCE_IMPROVEMENTS_COMPLETE.md` - Dashboard API optimization (72% faster) - Phase 1
- `APP_WIDE_PERFORMANCE_OPTIMIZATION_PLAN.md` - Complete roadmap (62 endpoints)
- `DASHBOARD_PERFORMANCE_ANALYSIS.md` - Performance analysis & recommendations
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
- Sidebar menu items ("บุคลากร", "โปรเจกต์") hidden for MEMBER/USER

---

**End of CLAUDE.md v2.37.0** (2025-11-01)

## Changelog

### v2.37.0 (2025-11-01) - IT Service Session 6: Menu Consolidation & Bug Fixes

**Major changes:**

- ✅ Consolidated IT Service navigation into single menu with 3 tabs
- ✅ Enhanced timeline with task assignment details (assignees + status)
- ✅ Fixed 4 critical bugs (request detail page, modal props, type errors, double card border)
- ✅ Removed COMMENT_ADDED from timeline (kept notification only)
- ✅ Fixed all TypeScript type errors (12 errors → 0 errors)
- ✅ Production build successful (73 pages, 8.2s)

**Menu Consolidation** (3-Tab Navigation):

Created unified IT Service admin page for non-USER roles:
1. **IT Service Portal** - Action cards for creating requests (portal-content.tsx)
2. **จัดการคำร้อง** - Manage all requests table with filters (manage-requests-content.tsx)
3. **คำร้องของฉัน** - My requests table view (my-requests-content.tsx)

**Architecture Change:**
- USER role: `/it-service` (portal page, unchanged)
- Non-USER roles: `/it-service-admin` (3 tabs with pending badge on tab 2)
- Removed "คำร้องขอ" menu from sidebar
- Moved pending badge to "IT Service" menu

**Timeline Enhancement:**

Created RequestTimeline component with task assignment display:
- Shows task status name for TASK_CREATED events
- Displays assignees with avatars and formatted names
- Blue info box for visual distinction
- API includes task.status and task.assignees relations

**Bug Fixes:**

1. **Request Detail Page Type Error** - Fixed Prisma schema field name mismatch (`type` vs `statusType`)
2. **Modal Props Error** - Fixed `onOpenChange is not a function` by using correct prop name
3. **Comment Type Mismatch** - Updated to use name parts instead of fullName
4. **Invalid Enum Values** - Removed HARDWARE/NETWORK from components (not in enum)
5. **Double Card Border** - Removed extra wrapper divs in timeline section
6. **Notification Inconsistency** - USER role now uses NotificationBell component

**Files Created (5):**

- src/app/(dashboard)/it-service-admin/page.tsx (118 lines)
- src/components/it-service/portal-content.tsx (108 lines)
- src/components/it-service/manage-requests-content.tsx (317 lines)
- src/components/it-service/my-requests-content.tsx (277 lines)
- src/components/it-service/request-timeline.tsx (260 lines)

**Files Modified (7):**

- src/components/layout/sidebar.tsx
- src/app/api/service-requests/[id]/route.ts
- src/app/api/service-requests/[id]/comments/route.ts
- src/hooks/use-service-requests.ts
- src/components/it-service/it-service-top-bar.tsx
- IT_SERVICE_SESSION_6_COMPLETE.md (new)
- CLAUDE.md (updated to v2.37.0)

**Type Safety Lessons Learned:**

1. Always match Prisma schema field names exactly (e.g., `type` not `statusType`)
2. Use `onOpenChange` prop for shadcn/ui Dialog components, not `onClose`
3. Only use enum values that exist in Prisma schema (validate against generated types)
4. Fix type errors immediately - don't let them accumulate
5. Run `npm run type-check` and `npm run build` before final commit

**Testing Results:**
- Type-check: ✅ 0 errors (fixed 12 errors)
- Production build: ✅ 73 pages compiled in 8.2s
- All features working correctly

**Commits:**
- 7f141f9: Menu consolidation, bug fixes, timeline enhancement
- [Pending]: Type error fixes

**Next**: Phase 3 - Request Tracking Enhancements

---

### v2.36.0 (2025-11-01) - IT Service Module Phase 2 Complete - Document Preview

**Major changes:**

- ✅ Completed Phase 2 Task 5: Document Preview functionality
- ✅ Created `src/lib/document-helpers.ts` (684 lines) - HTML document generation engine
  - Thai Buddhist calendar date formatting (+543 years)
  - Three template generators (DATA/PROGRAM, HARDWARE/NETWORK, IT_ISSUE)
  - Sarabun 16pt font from Google Fonts
  - A4 page size with 2.5cm margins
  - Print-optimized CSS with `@media print` rules
- ✅ Created `src/components/it-service/document-preview-modal.tsx` (112 lines)
  - iframe-based document rendering for CSS isolation
  - Print button with browser print dialog integration
  - Responsive full-screen modal (90vh height)
- ✅ Integrated preview into all 3 request modals:
  - data-request-modal.tsx (DATA/PROGRAM requests)
  - hardware-network-modal.tsx (HARDWARE/NETWORK requests)
  - it-issue-modal.tsx (IT_ISSUE requests)
- ✅ Form validation before preview (async `form.trigger()`)
- ✅ Auto-filled requester information from authenticated user
- ✅ Preview button with Eye icon in all modals
- ✅ Type-check passed (0 errors)

**Technical Implementation:**

- Document generation uses `DocumentData` interface with 15+ fields
- Templates follow Thai government document format
- Purpose checkboxes formatted with ☑/☐ symbols
- Temporary request number in preview (SR-YYYY-XXXXX)
- Hospital name currently hardcoded (TODO: system settings integration)
- Print functionality via `iframe.contentWindow.print()`

**Phase 2 Status**: ✅ **100% COMPLETE** (5/5 tasks)

1. ✅ USER role layout isolation
2. ✅ Sidebar navigation
3. ✅ Portal landing page
4. ✅ Request submission forms
5. ✅ Document preview ⭐ **NEW**

**Files Created:**

- src/lib/document-helpers.ts (684 lines)
- src/components/it-service/document-preview-modal.tsx (112 lines)
- IT_SERVICE_SESSION_4_SUMMARY.md (complete implementation summary)

**Files Modified:**

- src/components/it-service/data-request-modal.tsx
- src/components/it-service/hardware-network-modal.tsx
- src/components/it-service/it-issue-modal.tsx
- CLAUDE.md (updated to v2.36.0)

**Next**: Phase 3 - Request Tracking & Timeline (2-3 days estimated)

---

### v2.35.0 (2025-11-01) - IT Service Module Phase 2 Tasks 1-4 Complete

**Major changes:**

- ✅ Implemented IT Service Module Phase 2 (Portal UI) - 80% Complete
- ✅ USER role isolation with clean layout (no sidebar, ITServiceTopBar only)
- ✅ 4 action cards (DATA, PROGRAM, IT_ISSUE, HARDWARE/NETWORK requests)
- ✅ 3 request submission modals with comprehensive validation
- ✅ Purpose checkboxes for DATA/PROGRAM requests
- ✅ Dropdown z-index fix (z-[300] prevents modal overlap)
- ✅ Custom scrollbar styling (thin, right-aligned, hover effect)
- ✅ White backgrounds on all inputs (light mode)
- ✅ Responsive design (mobile: 1 col, tablet: 2 cols, desktop: 4 cols)
- ✅ Updated CLAUDE.md with IT Service documentation

**Phase 2 Tasks Completed:**
1. ✅ **Task 1: IT Service Layout** - USER role redirect, ITServiceTopBar, clean layout
2. ✅ **Task 2: Sidebar Navigation** - "IT Service" menu, "คำร้องขอ" menu with badges
3. ✅ **Task 3: Portal Landing Page** - 4 action cards, request list, responsive
4. ✅ **Task 4: Request Forms** - 3 modals with validation, z-index fixes, custom scrollbar

**UI/UX Enhancements:**
- Centered action cards with increased spacing
- Removed unnecessary text (headers, descriptions)
- Simplified filter controls
- Mobile-responsive layout
- Touch-friendly card sizing
- Professional lucide icons (Database, Network, Wrench, Search)

**Files:**
- Created: ~15 files (portal page, modals, components)
- Modified: 8 files (layout, breadcrumb, checklist widget, navbar)
- Updated: 6 docs (CLAUDE.md, IT Service spec, conflict analysis, system settings, session summaries)

**Next:** Phase 2 Task 5 - Document Preview (PDF/Word preview, template generation, print/download)

**Documentation:**
- Added IT Service Module section to CLAUDE.md
- Added IT Service roadmap to Version Status
- Added IT Service documentation to Documentation Index
- Updated Current Priority to Phase 2 Task 5
- Added SUPER_ADMIN role warning in Architecture section

**Branch**: `refactor/p0-type-safety` (or current working branch)

---

### v2.34.0 (2025-10-30) - P0 Type Safety Refactoring Complete

**Major changes:**

- ✅ Removed all 49 `as any` type assertions (100% reduction)
- ✅ Fixed 17 build errors in components and hooks
- ✅ Achieved 100% type safety in all React Query hooks
- ✅ Type-check passed (0 errors)
- ✅ Production build successful (63 pages)
- ✅ Successfully deployed to production
- ✅ Added comprehensive Type Safety Best Practices section to CLAUDE.md

**Refactoring Phases Completed:**

1. **use-tasks.ts** - Removed 13 `as any` assertions, added proper type inference for React Query mutations
2. **use-projects.ts** - Removed 4 `as any` assertions, fixed ProjectWithRelations type inference
3. **use-dashboard.ts** - Removed 17 `as any` assertions, created DashboardData interface with nested types
4. **use-department-tasks.ts** - Removed 10 `as any` assertions, added ProjectGroup interface
5. **use-reports.ts** - Removed 5 `as any` assertions, created ReportsData interface
6. **Build Testing** - Fixed 17 type errors in 11 files (components, library utils, type definitions)

**Technical Strategies Documented:**

1. Type Inference with Generics (`getQueryData<T>`)
2. Type Guards for Union Types (`data is BoardData`)
3. Strategic Use of `unknown` for Type Narrowing (double cast pattern)
4. Omit Pattern for Interface Extension Conflicts
5. Optional vs Nullable Fields (Zod schema compatibility)
6. React Query Optimistic Update Types

**Impact:**

- Better developer experience with improved autocomplete and IntelliSense
- Type errors caught at compile-time instead of runtime
- Easier and safer code refactoring
- Zero runtime errors in production
- No performance degradation

**Files Modified:**

- 5 React Query hooks (use-tasks, use-projects, use-dashboard, use-department-tasks, use-reports)
- 9 Components (department/tasks page, task-row, modals, task-panel, views)
- 1 Library utility (use-sync-mutation)
- 1 Type definition file (prisma-extended)
- 2 Documentation files (CLAUDE.md, P0_TYPE_SAFETY_REFACTORING_COMPLETE.md)

**Total**: 12 files changed, +170 insertions, -29 deletions

**Documentation:**

- Added "Type Safety Best Practices" section with 6 strategies and examples
- Added link in Quick Navigation
- Updated Quick Reference Card with type safety rule
- Added P0_TYPE_SAFETY_REFACTORING_COMPLETE.md to Documentation Index
- Updated version and last major update header

**Branch**: `refactor/p0-type-safety`
**Commit**: `2d2617c`

**Next Steps:**

- Document type patterns in centralized guide (in progress)
- Create type definition consolidation plan
- Review and improve Prisma schema types
- Consider enabling stricter TypeScript settings (strictNullChecks, etc.)

### v2.33.0 (2025-10-29) - Mobile Layout Additional Features + Turbopack Build Fix

**Major changes:**

- ✅ Implemented 6 mobile navigation enhancements
- ✅ Fixed critical Windows build error with Turbopack
- ✅ Created Calendar page with synced task list
- ✅ Implemented swipe navigation between 4 main pages
- ✅ Reorganized bottom/top navigation buttons
- ✅ Added Workspace menu animations
- ✅ Made modal buttons mobile-friendly
- ✅ Type-check passed (0 errors)
- ✅ Production build successful (62 pages)

**Features Implemented:**

1. **Calendar Page** - Dedicated page with DashboardCalendarWidget at top and task list below, month state synced
2. **Swipe Navigation** - SwipeablePages component with framer-motion for horizontal swipes between งานของฉัน ⟷ เช็คลิสต์ ⟷ ปฏิทิน ⟷ แจ้งเตือน (50px threshold, velocity detection, desktop unaffected)
3. **Navigation Reorganization** - Calendar moved to bottom nav position 4, Activities moved to top nav with X button for router.back()
4. **Workspace Animation** - Collapse/expand with ChevronDown rotation, height/opacity transitions (0.2s ease-out), default expanded
5. **Controlled Calendar Component** - DashboardCalendarWidget now controlled with currentMonth/onMonthChange props
6. **Mobile-Friendly Modals** - "สร้างโปรเจกต์" and "สร้างงาน" buttons full-width on mobile (w-full md:w-auto)

**Build Fix:**

- **Windows EPERM Error** - Resolved "operation not permitted, scandir Application Data" by switching to Turbopack
- Updated `package.json` build script: `"build": "npx prisma generate && next build --turbo"`
- Turbopack build succeeds in ~6 seconds vs webpack failure
- Added troubleshooting guide for Windows build errors

**Files:**

- Created: 5 files (activities/page.tsx, calendar/page.tsx, checklist/page.tsx, projects/[projectId]/mobile/page.tsx, swipeable-pages.tsx)
- Modified: 8 files (package.json, dashboard-calendar-widget.tsx, bottom-navigation.tsx, mobile-top-bar.tsx, mobile-menu.tsx, create-project-modal.tsx, create-task-modal.tsx, my-tasks/notifications pages)
- Updated: 1 doc (CLAUDE.md - added Windows Build Error troubleshooting)

**Next:** Mobile Layout Phase 4 - Task Panel Mobile (full-screen on mobile devices)

### v2.32.0 (2025-10-28) - Mobile Layout Phase 3 Complete

**Major changes:**

- ✅ Completed Phase 3 of mobile layout implementation (3/8 phases, 37.5% complete)
- ✅ Enhanced mobile-top-bar.tsx with dynamic titles and context actions (~100+ lines)
- ✅ Dynamic page titles for 10+ routes (Dashboard, My Tasks, Notifications, Users, Reports, Settings, Profile, Department Tasks, Project views)
- ✅ Context-specific action buttons (Search, Filter, View switcher) per page
- ✅ Improved back button logic (6 main pages with hamburger, secondary pages with back)
- ✅ Added animations and transitions (backdrop blur, slide-in, button press, opacity)
- ✅ Type-check passed (0 errors)
- ✅ Updated MOBILE_LAYOUT_DESIGN.md (Phase 3 status, progress 37.5%)
- ✅ Updated Current Priority to Phase 4 (Task Panel Mobile)

**Features Implemented:**

- Dynamic titles for all main routes
- Context-aware action buttons with touch-friendly tap targets
- Smooth animations: backdrop blur, slide-in, active:scale-95, fade transitions
- Back button logic expansion for 6 main pages
- Search button state management (modal in future phase)

**Commit**: 8628624

**Files Modified:**

- Modified: 1 file (mobile-top-bar.tsx)
- Updated: 2 docs (MOBILE_LAYOUT_DESIGN.md, CLAUDE.md)

**Next:** Phase 4 - Task Panel Mobile (full-screen on mobile devices)

### v2.31.0 (2025-10-28) - Mobile Layout Phase 2 Complete

**Major changes:**

- ✅ Completed Phase 2 of mobile layout implementation (2/8 phases, 25% complete)
- ✅ Created 3 new pages/components (~700 lines total):
  - `/my-tasks` page (201 lines) - Personal task management with 2 tabs
  - `/notifications` page (199 lines) - Dedicated notifications center
  - `mobile-menu.tsx` (280 lines) - Full-featured hamburger drawer
- ✅ Integrated mobile menu in both bottom nav and top bar
- ✅ Fixed 4 TypeScript type errors (myTasks property, disabled properties, Separator import, useProjects params)
- ✅ Type-check passed (0 errors)
- ✅ Updated MOBILE_LAYOUT_DESIGN.md (removed merged phases 4-6, renumbered to 8 phases)
- ✅ Updated Current Priority to Phase 3 (Mobile Top Bar Enhancement)

**Features Implemented:**

- My Tasks Page: Shows "งานที่ได้รับ" (Assigned) and "งานที่สร้าง" (Created) in separate tabs
- Notifications Page: "ทั้งหมด" (All) and "ยังไม่ได้อ่าน" (Unread) tabs with badge counts
- Hamburger Menu: User profile, workspace selector, nav links, dark mode toggle, logout
- Touch-friendly cards with click to open Task Panel
- Permission-based navigation link visibility

**Commit**: e7070ab

**Files Modified:**

- Created: 4 files (my-tasks/page.tsx, notifications/page.tsx, mobile-menu.tsx, separator.tsx)
- Modified: 4 files (bottom-navigation.tsx, mobile-top-bar.tsx, package.json, package-lock.json)
- Updated: 2 docs (MOBILE_LAYOUT_DESIGN.md, CLAUDE.md)

**Next:** Phase 3 - Mobile Top Bar Enhancement (dynamic titles, context-specific actions)

### v2.30.0 (2025-10-28) - Mobile Layout Phase 1 Complete

**Major changes:**

- ✅ Implemented responsive layout infrastructure with Hybrid Approach
- ✅ Created 5 new components (587 lines):
  - use-media-query.ts hook (163 lines)
  - mobile-layout.tsx (67 lines)
  - desktop-layout.tsx (61 lines)
  - bottom-navigation.tsx (202 lines)
  - mobile-top-bar.tsx (94 lines)
- ✅ Updated (dashboard)/layout.tsx to responsive wrapper (39 lines)
- ✅ Layout switches at 768px breakpoint
- ✅ Created MOBILE_LAYOUT_DESIGN.md (620+ lines) with wireframes and 11-phase roadmap
- ✅ Type-check passed (0 errors)

**Commit**: bd21b24

**Next:** Phase 2 - Bottom Navigation Features (My Tasks, Notifications, Hamburger Menu)

### v2.29.0 (2025-10-28) - Production 403 Forbidden Fix

**Major changes:**

- ✅ Fixed critical production bug where all POST/PATCH/DELETE requests were blocked with 403 Forbidden
- ✅ Root cause: CSRF/CORS protection configs had incorrect production domains
- ✅ Updated `allowedOrigins` in csrf.ts and middleware.ts to include:
  - `https://projectflows.app` (custom domain)
  - `https://projectflows.onrender.com` (Render default - fixed typo from render.com)
- ✅ All production CRUD operations now working correctly
- ✅ Added troubleshooting guide for production 403 errors

**Commits:**

- 8961bbf: Initial fix - added projectflows.app domain
- 3959bb7: Typo correction - render.com → onrender.com

**Impact:**
Unblocked all state-changing operations in production (create/edit/delete tasks, projects, users). CSRF/CORS protection remains fully active with correct domain whitelist.

**Files Modified:**

- src/lib/csrf.ts (updated allowedOrigins)
- src/middleware.ts (updated allowedOrigins)
- CLAUDE.md (added troubleshooting entry, updated version)

**Lesson Learned:**
After implementing security features like CSRF/CORS protection, always verify production domains are correctly whitelisted. Test all CRUD operations on staging/production before releasing. Custom domains and Render default domains must both be included.

### v2.28.0 (2025-10-28) - Department Tasks View Assignee Selector Sync Fix

**Major changes:**

- ✅ Fixed critical cache invalidation bug in Department Tasks View
- ✅ Task Panel assignee changes now sync to all views (List, Board, Calendar, Department Tasks, Dashboard)
- ✅ Added `departmentTasksKeys.all` invalidation to `useUpdateTask` in use-tasks.ts
- ✅ Added comprehensive cache invalidation to 3 department mutations in use-department-tasks.ts
- ✅ Documented lesson: Different views use different query caches - must invalidate ALL relevant caches

**Lesson Learned:**
When mutations don't sync between views, check which query cache each view uses:

- List/Board/Calendar Views → `projectKeys.board`
- Department Tasks View → `departmentTasksKeys.list`
- Dashboard Widgets → `dashboardKeys.all`
- Task Panel → `taskKeys.detail`

Mutation hooks must invalidate ALL relevant caches, not just the one used by the current view.

**Files Modified:**

- src/hooks/use-tasks.ts (added departmentTasksKeys.all invalidation)
- src/hooks/use-department-tasks.ts (added taskKeys/projectKeys/dashboardKeys invalidation)

### v2.27.0 (2025-10-28) - Dashboard Checklist Sync + Profile Settings UX

**Major changes:**

- ✅ Fixed Dashboard Checklist Widget not syncing with Task Panel checklist mutations
- ✅ Fixed Profile Settings page autocomplete issues and name splitting logic
- ✅ All dashboard widgets now update instantly when checklist items change

### v2.26.0 (2025-10-28) - Assignee Selector Bug Fixes + Refresh Fix + Checklist Widget

**Major changes:**

- ✅ Fixed Task Panel assignee selector showing incorrect values after save
- ✅ Fixed inline editor assignee selector not updating optimistically
- ✅ Fixed refresh button making dashboard content disappear
- ✅ Fixed checklist widget showing empty (missing created tasks)

### v2.25.0 (2025-10-27) - Critical Development Rules Reorganization

**Major changes:**

- ✅ Reorganized 6 Critical Development Rules into 2 phases for clarity
- ✅ **Phase 1: Write Code Correctly First** (Rules 1-3)
  - Rule 1: Never Accumulate Type Errors (moved from Rule 6)
  - Rule 2: useSearchParams() MUST Be Wrapped in Suspense (moved from Rule 4)
  - Rule 3: Route Params MUST Use Promise Pattern (kept as Rule 3)
- ✅ **Phase 2: Before FINAL Commit/Push** (Rules 4-6)
  - Rule 4: ALWAYS Check Git Status Before Pushing (moved from Rule 5)
  - Rule 5: ALWAYS Type-Check Before FINAL Committing (moved from Rule 1, added "FINAL")
  - Rule 6: ALWAYS Test Build Locally Before FINAL Pushing (moved from Rule 2, added "FINAL")
- ✅ Added "Why this matters" explanations to each rule
- ✅ Updated Quick Reference Card to reflect new phase structure
- ✅ Updated "Key Things to Remember" with phase groupings

**Rationale:**

- Phase 1 focuses on prevention during development (write correct code from the start)
- Phase 2 focuses on validation before deployment (catch errors before pushing)
- "FINAL" keyword emphasizes these are the last checkpoints before commit/push
- Clearer mental model: Fix errors early → Write correct code → Validate before deploy

### v2.24.0 (2025-10-27) - Quick Start & Critical Development Rules Update

**Major changes:**

- ✅ Completely rewrote "Quick Start for New Claude Instances" section
- ✅ Added new "Critical Development Rules (Next.js 15)" with 6 mandatory rules
- ✅ Updated project status to Production-Ready (deployed on Render)
- ✅ Marked migration as complete - old_project/ and migration_plan/ now historical reference only
- ✅ Enhanced Quick Reference Card with Next.js 15 critical rules
- ✅ Reordered Quick Navigation to prioritize Quick Start and Next.js 15 lessons
- ✅ Updated all references to emphasize type-check and build testing before deployment

**Key additions:**

- 6 Critical Development Rules to prevent deployment failures
- Mandatory type-check and build testing before commit/push
- Promise-based route params pattern examples
- useSearchParams() Suspense boundary requirement
- Emphasis on Git tracking to avoid missing files

**Purpose:**
Establish Next.js 15 Migration Lessons as the foundational coding standard for all future development to minimize Build failed errors during deployment.

### v2.23.0 (2025-10-27) - TypeScript Error Prevention & Deployment Success

**Major changes:**

- ✅ Successfully deployed to production on Render
- ✅ Fixed 156 TypeScript errors (100% reduction)
- ✅ Added comprehensive TypeScript Error Prevention strategies
- ✅ Documented 6 strategies for preventing and fixing type errors
- ✅ Added hybrid approach for large refactors

### v2.22.0 (2025-10-27) - Next.js 15 Migration Complete

**Major changes:**

- ✅ Completed Next.js 15 migration lessons documentation
- ✅ Fixed middleware types for Next.js 15 compatibility
- ✅ Updated 16 API routes to Promise-based params
- ✅ Added 39 missing files to Git
- ✅ Moved build tools to dependencies
