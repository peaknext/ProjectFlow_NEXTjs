# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ProjectFlow** is a comprehensive project and task management system migrated from Google Apps Script to Next.js 15 + PostgreSQL. It's designed for healthcare organizations with hierarchical role-based access control and real-time collaboration features.

**Current Status**: Phase 2 Complete (API 100%), Phase 3 In Progress (Frontend ~30-35%)
**Tech Stack**: Next.js 15 (App Router), TypeScript, PostgreSQL, Prisma ORM, React Query, Zustand, Tailwind CSS, shadcn/ui
**Previous GAS Project Codebase**: Stored in old_project folder for reference
**Port**: Dev server typically runs on port 3010 (not default 3000)

⚠️ **CRITICAL BLOCKER**: Authentication frontend pages (login, register, email verification, password reset) are NOT implemented. Only API endpoints exist. See `AUTHENTICATION_FRONTEND_MISSING.md` for complete details and implementation plan.

## Commands

### Development

```bash
npm run dev              # Start dev server (default port 3000, may run on 3010)
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
- For development: Set `BYPASS_AUTH=true` in `.env` to skip authentication (auto-creates session for user001)

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

**Core Schema Patterns:**

- **Users**: 6-level role hierarchy (ADMIN → CHIEF → LEADER → HEAD → MEMBER → USER)
- **Projects**: Belong to departments, have custom workflow statuses
- **Tasks**: Support subtasks, checklists, comments with @mentions, priority 1-4
- **Sessions**: Bearer token authentication with 7-day expiry
- **Notifications**: Real-time system with typed events

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

**Current Implementation Status:**

- ✅ Layout System (Navbar, Sidebar, Footer)
- ✅ Theme System (Light/Dark mode)
- ✅ Board View (Kanban with drag-and-drop)
- ✅ Calendar View (FullCalendar v6)
- ✅ List View (Table with sorting/filtering)
- ✅ Task Detail Panel (Full CRUD with 11 optimistic mutations)
- ⚠️ Dashboard Page (Layout only, mock data)
- ❌ Authentication Pages (NOT IMPLEMENTED - see AUTHENTICATION_FRONTEND_MISSING.md)
- ❌ Create Task Modal (NOT IMPLEMENTED)
- ❌ User Management Pages
- ❌ Reports/Analytics

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
   │   └── (auth)/                   # ❌ NOT IMPLEMENTED (login, register, etc.)
   ├── components/
   │   ├── layout/                   # Navbar, Sidebar, ProjectToolbar, Footer
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
- **Calendar View**: FullCalendar v6 with Thai locale and priority-based colors
- **List View**: Table with sorting (6 fields), filtering (5 filters), bulk actions
- **Task Panel**: Slide-out panel with 3 tabs (Details, Comments, History) and 11 optimistic mutations
- All views share the same `ProjectToolbar` component and use optimistic updates

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
- `src/stores/use-sync-store.ts`: Controls sync animation in footer
- `src/stores/use-ui-store.ts`: Controls task panel and modals

**Configuration:**

- `prisma/schema.prisma`: Database schema (21 tables)
- `next.config.js`: Custom Prisma client path alias
- `.env`: Database URL and environment variables (BYPASS_AUTH for testing)

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
2. **Check port 3010** - Dev server may not run on default port 3000
3. **Use soft deletes** - Never use `.delete()`, always use `.update()` with `deletedAt`/`dateDeleted`
4. **Import Prisma correctly** - Always use `import { prisma } from "@/lib/db"` (not from @prisma/client)
5. **Optimistic updates everywhere** - All interactive UI must use the optimistic update pattern (see OPTIMISTIC_UPDATE_PATTERN.md)

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
- `AUTHENTICATION_FRONTEND_MISSING.md`: Critical blocker documentation

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

## Migration from Google Apps Script

When implementing features, reference the original GAS implementation to maintain consistency:

- Color schemes (especially priority colors)
- Permission logic and role hierarchy
- Business logic for progress calculation
- Notification types and triggers
- Thai language text and formatting

See `migration_plan/` directory for detailed migration documentation.
