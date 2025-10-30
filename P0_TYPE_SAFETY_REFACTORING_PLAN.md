# P0 Type Safety Refactoring Plan

**Created**: 2025-10-30
**Priority**: P0 (Critical)
**Estimated Time**: 2-3 days
**Status**: In Progress (Phase 3.1 Complete)
**Last Updated**: 2025-10-30 (commit: c4c2c01)

## 📈 Progress Tracker

| Phase | Status | Files Changed | Lines Added | as any Removed |
|-------|--------|---------------|-------------|----------------|
| Phase 1: Analysis | ✅ Complete | 0 | 0 | 0 |
| Phase 2: Type Definitions | ✅ Complete | 3 files created | 1,000+ | 0 |
| Phase 3.1: api-client.ts | ✅ Complete | 1 file | -6 as any | **6/49** |
| Phase 3.2: use-tasks.ts | ⏳ Pending | - | - | - |
| Phase 3.3: use-sync-mutation.ts | ⏳ Pending | - | - | - |
| Phase 3.4: task-panel | ⏳ Pending | - | - | - |
| Phase 4: High Priority | ⏳ Pending | - | - | - |
| Phase 5: Medium Priority | ⏳ Pending | - | - | - |
| Phase 6: Testing | ⏳ Pending | - | - | - |

**Overall Progress**: 6/49 as any removed (**12% complete**)

---

## 📊 Executive Summary

**Problem**: TypeScript type safety is compromised by excessive use of type assertions and suppressions.

**Statistics**:
- 49× `as any` type assertions
- 33× `@ts-ignore` / `@ts-nocheck` suppressions
- 9× `@deprecated` legacy code

**Impact**:
- Runtime bugs hiding behind type bypasses
- Maintenance difficulty
- Loss of TypeScript benefits (autocomplete, refactoring safety)

**Goal**: Achieve 100% type safety with zero `as any` and minimal `@ts-ignore` (only for legitimate Prisma/library issues)

---

## 🎯 Phase 1: Analysis & Categorization (Day 1 Morning)

### 1.1 Categorize 'as any' by Severity

**🔴 Critical (Must Fix) - 23 occurrences**

| Location | Issue | Fix Strategy |
|----------|-------|--------------|
| `src/lib/api-client.ts` (6 occurrences) | `(response.data as any).error?.message` | Create `ApiErrorResponse` interface |
| `src/hooks/use-tasks.ts` (4 occurrences) | `const boardData = value as any` | Type `QueryClient.getQueryData` return |
| `src/lib/use-sync-mutation.ts` (6 occurrences) | `(onMutate as any)`, `(context as any)` | Use proper generics for mutation options |
| `src/components/task-panel/details-tab/index.tsx` (3 occurrences) | `zodResolver as any`, `control as any` | Fix react-hook-form types |
| `src/components/common/task-row.tsx` | `(task as any).project?.name` | Add `project` to Task interface |
| `src/components/modals/create-task-modal.tsx` (2 occurrences) | Workspace & cache data | Type workspace query properly |

**🟠 High (Should Fix) - 16 occurrences**

| Location | Issue | Fix Strategy |
|----------|-------|--------------|
| `src/components/modals/edit-project-modal.tsx` (8 occurrences) | `(project as any).creator`, `.createdAt` | Add creator/timestamps to Project interface |
| `src/components/modals/edit-user-modal.tsx` | `(user as any).notes` | Add notes field to User type |
| `src/app/api/users/me/pinned-tasks/route.ts` (2 occurrences) | `pinnedTasks as any` | Type JSON field properly |
| `src/components/modals/create-project-modal.tsx` | Status transformation | Type status properly |
| `src/components/users/users-view.tsx` | Stats casting | Create proper return type |
| `src/hooks/use-notifications.ts` | Previous notifications | Type query data |
| `src/hooks/use-users.ts` | User status update | Fix status enum type |

**🟡 Medium (Nice to Fix) - 10 occurrences**

| Location | Issue | Fix Strategy |
|----------|-------|--------------|
| `src/components/reports/reports-charts.tsx` (2 occurrences) | Chart.js font weight | Cast to proper Chart.js type |
| `src/components/views/calendar-view/index.tsx` | Event handler type | Use FullCalendar types |
| `src/app/(dashboard)/department/tasks/page.tsx` | Projects prop | Fix prop type |
| `src/components/views/board-view/index.tsx` | Tasks prop | Fix prop type |
| `src/app/test-fiscal-year/page.tsx` | Test data | Use proper array type |
| `src/app/(auth)/login/page.tsx` | Error handling | Type error properly |
| `src/hooks/use-project-progress.ts` | Query state check | Use React Query types |

---

### 1.2 Categorize '@ts-ignore' by Type

**📁 Prisma Schema Issues (Legitimate) - 24 occurrences**

Files with `@ts-nocheck` due to Prisma type generation issues:
1. `src/app/api/activities/route.ts`
2. `src/app/api/activities/stats/route.ts`
3. `src/app/api/auth/session/route.ts`
4. `src/app/api/batch/route.ts`
5. `src/app/api/dashboard/activities/route.ts`
6. `src/app/api/organization/action-plans/route.ts`
7. `src/app/api/organization/hospital-missions/route.ts` (+ 13 inline ignores)
8. `src/app/api/organization/hospital-missions/[id]/route.ts`
9. `src/app/api/organization/it-goals/route.ts` (+ 10 inline ignores)
10. `src/app/api/projects/[projectId]/phases/batch/route.ts`
11. `src/app/api/projects/[projectId]/phases/route.ts`
12. `src/app/api/projects/[projectId]/statuses/[statusId]/route.ts`
13. `src/app/api/tasks/[taskId]/comments/route.ts`
14. `src/app/api/users/[userId]/route.ts`

**Strategy**: Keep `@ts-nocheck` for now, but add comment explaining why:
```typescript
// @ts-nocheck
// Prisma generated types don't match schema for custom fields (hospMission, itGoal, etc.)
// TODO: Update Prisma schema to include all fields or create proper type overlays
```

**🔧 Fixable Issues - 9 occurrences**

| Location | Issue | Fix Strategy |
|----------|-------|--------------|
| `src/app/api/users/me/pinned-tasks/[taskId]/route.ts` (2 occurrences) | `pinnedTask` JSON field | Create type for JSON structure |
| `src/components/ui/status-slider.tsx` | CSS custom properties | Type CSS properties properly |

---

## 🛠️ Phase 2: Create Type Definitions (Day 1 Afternoon)

### 2.1 API Response Types

Create `src/types/api-responses.ts`:

```typescript
/**
 * Standard API response types
 */

// Error response structure
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// Success response structure
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
}

// Union type for all responses
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// Type guard for error responses
export function isApiError(response: ApiResponse): response is ApiErrorResponse {
  return response.success === false;
}

// Workspace API response
export interface WorkspaceData {
  user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    departmentId: string | null;
    profileImageUrl: string | null;
  };
  departments: Array<{
    id: string;
    name: string;
    projects: Array<{
      id: string;
      name: string;
      status: string;
    }>;
  }>;
}

// Board data response
export interface BoardData {
  project: Project;
  statuses: Status[];
  tasks: Task[];
  departmentUsers: User[];
}
```

---

### 2.2 Extended Prisma Types

Create `src/types/prisma-extended.ts`:

```typescript
/**
 * Extended Prisma types with relations and computed fields
 */
import type { Task, Project, User } from '@/generated/prisma';

// Task with all possible relations
export interface TaskWithRelations extends Task {
  project?: {
    id: string;
    name: string;
    departmentId: string;
    department?: {
      id: string;
      name: string;
    };
  };
  assignees?: Array<{
    id: string;
    fullName: string;
    email: string;
    profileImageUrl: string | null;
  }>;
  status?: {
    id: string;
    name: string;
    color: string;
  };
  creator?: {
    id: string;
    fullName: string;
    profileImageUrl: string | null;
  };
  closedBy?: {
    id: string;
    fullName: string;
  };
  _count?: {
    subtasks: number;
    comments: number;
    checklists: number;
  };
  isPinned?: boolean;
}

// Project with relations
export interface ProjectWithRelations extends Project {
  creator?: {
    id: string;
    fullName: string;
    profileImageUrl: string | null;
  };
  department?: {
    id: string;
    name: string;
    division?: {
      id: string;
      name: string;
    };
  };
  owner?: {
    id: string;
    fullName: string;
  };
  statuses?: Status[];
  _count?: {
    tasks: number;
  };
}

// User with notes field (custom field)
export interface UserWithNotes extends User {
  notes?: string;
}

// Pinned tasks JSON structure
export interface PinnedTasksJson {
  tasks: Array<{
    taskId: string;
    pinnedAt: string;
  }>;
}
```

---

### 2.3 React Hook Form Types

Create `src/types/form-types.ts`:

```typescript
/**
 * React Hook Form type helpers
 */
import type { Control, UseFormHandleSubmit } from 'react-hook-form';
import type { z } from 'zod';

// Generic form control type
export type FormControl<T extends z.ZodType> = Control<z.infer<T>>;

// Generic form submit handler
export type FormSubmitHandler<T extends z.ZodType> = UseFormHandleSubmit<z.infer<T>>;

// Task form data
export interface TaskFormData {
  name: string;
  description: string;
  statusId: string;
  priority: number;
  startDate: Date | null;
  dueDate: Date | null;
  assigneeUserIds: string[];
  difficulty: number | null;
}

// Project form data
export interface ProjectFormData {
  name: string;
  description: string;
  startDate: Date | null;
  endDate: Date | null;
  ownerId: string;
  status: string;
  progress: number;
}
```

---

## 🔧 Phase 3: Fix Critical Issues (Day 2 Morning)

### 3.1 Fix api-client.ts (6 occurrences)

**Before**:
```typescript
throw new Error((response.data as any).error?.message || 'Request failed');
```

**After**:
```typescript
import type { ApiErrorResponse } from '@/types/api-responses';

// Type guard
function isErrorResponse(data: unknown): data is ApiErrorResponse {
  return typeof data === 'object' &&
         data !== null &&
         'success' in data &&
         (data as any).success === false;
}

// In error handler
if (isErrorResponse(response.data)) {
  throw new Error(response.data.error.message || 'Request failed');
}
throw new Error('Request failed');
```

---

### 3.2 Fix use-tasks.ts (4 occurrences)

**Before**:
```typescript
const boardData = value as any;
```

**After**:
```typescript
import type { BoardData } from '@/types/api-responses';

// In optimistic update
queryClient.setQueryData<BoardData>(
  projectKeys.board(projectId),
  (oldData) => {
    if (!oldData) return oldData;

    return {
      ...oldData,
      tasks: oldData.tasks.map(t =>
        t.id === taskId ? { ...t, ...updates } : t
      )
    };
  }
);
```

---

### 3.3 Fix use-sync-mutation.ts (6 occurrences)

**Before**:
```typescript
const context = (onMutate as any) ? await (onMutate as any)(variables) : undefined;
```

**After**:
```typescript
// Use proper generics from @tanstack/react-query
export function useSyncMutation<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown
>(
  options: UseMutationOptions<TData, TError, TVariables, TContext> & {
    animationDuration?: number;
  }
) {
  // Type-safe mutation options
  const {
    onMutate,
    onSuccess,
    onError,
    onSettled,
    animationDuration = 800,
    ...restOptions
  } = options;

  // Now TypeScript knows the correct types
  const context = onMutate ? await onMutate(variables) : undefined;

  if (onSuccess) {
    onSuccess(data, variables, context);
  }
}
```

---

### 3.4 Fix task-panel/details-tab (3 occurrences)

**Before**:
```typescript
resolver: (zodResolver as any)(taskFormSchema),
control={control as any}
```

**After**:
```typescript
import { zodResolver } from '@hookform/resolvers/zod';
import type { Control } from 'react-hook-form';

// Create proper form type
type TaskFormValues = z.infer<typeof taskFormSchema>;

const { control, handleSubmit } = useForm<TaskFormValues>({
  resolver: zodResolver(taskFormSchema), // No cast needed
  defaultValues: {...}
});

// Use typed control
<Controller
  control={control} // Type-safe, no cast needed
  name="statusId"
  render={({ field }) => <StatusSelect {...field} />}
/>
```

---

## 🔧 Phase 4: Fix High Priority Issues (Day 2 Afternoon)

### 4.1 Fix Task interface with project relation

**Add to `src/types/prisma-extended.ts`**:
```typescript
export interface TaskWithProject extends TaskWithRelations {
  project: {
    id: string;
    name: string;
    departmentId: string;
    department?: {
      id: string;
      name: string;
    };
  };
}
```

**Update `task-row.tsx`**:
```typescript
// Before
{(task as any).project?.name || '-'}

// After
import type { TaskWithProject } from '@/types/prisma-extended';

interface TaskRowProps {
  task: TaskWithProject;
  // ...
}

// In component
{task.project?.name || '-'}
```

---

### 4.2 Fix Project interface with creator/timestamps

**Update Project type in use-projects.ts**:
```typescript
export interface Project extends ProjectWithRelations {
  creator: {
    id: string;
    fullName: string;
    profileImageUrl: string | null;
  };
  createdAt: string;
  updatedAt: string;
}
```

**Update edit-project-modal.tsx** (removes 8 `as any`):
```typescript
// Before
{(project as any).creator?.fullName || "-"}
{format(new Date((project as any).createdAt), ...)}

// After
{project.creator?.fullName || "-"}
{format(new Date(project.createdAt), ...)}
```

---

### 4.3 Fix pinnedTasks JSON field

**Create type in `src/types/user.ts`**:
```typescript
export interface PinnedTask {
  taskId: string;
  pinnedAt: string;
}

export type PinnedTasksArray = PinnedTask[];
```

**Update API route**:
```typescript
// Before
pinnedTasks: updatedPinnedTasks as any

// After
import type { PinnedTasksArray } from '@/types/user';

const user = await prisma.user.findUnique({
  where: { id: userId },
  select: { pinnedTasks: true }
});

const currentPinned = (user?.pinnedTasks as PinnedTasksArray) || [];
const updatedPinnedTasks: PinnedTasksArray = [
  ...currentPinned,
  { taskId, pinnedAt: new Date().toISOString() }
];

await prisma.user.update({
  where: { id: userId },
  data: {
    pinnedTasks: updatedPinnedTasks as unknown as Prisma.JsonValue
  }
});
```

---

## 🔧 Phase 5: Fix Medium Priority Issues (Day 3 Morning)

### 5.1 Chart.js font weight types

```typescript
// Before
weight: "500" as any

// After
import type { FontSpec } from 'chart.js';

const fontConfig: Partial<FontSpec> = {
  weight: '500' // TypeScript accepts string | number
};
```

---

### 5.2 FullCalendar event handlers

```typescript
// Before
eventResize={handleEventDrop as any}

// After
import type { EventResizeDoneArg } from '@fullcalendar/interaction';

const handleEventResize = (info: EventResizeDoneArg) => {
  // Same logic as drop
  handleEventDrop(info as any as EventDropArg);
};

// Use proper handler
eventResize={handleEventResize}
```

---

## 🧪 Phase 6: Testing & Verification (Day 3 Afternoon)

### 6.1 Run Type Check

```bash
npm run type-check
```

**Expected result**: 0 errors (down from ~50+ type bypass warnings)

---

### 6.2 Test Critical Paths

**Manual testing checklist**:
- [ ] Login/Logout (api-client errors)
- [ ] Create/Edit Task (task form, mutations)
- [ ] Update Task (board optimistic updates)
- [ ] Edit Project (project with creator)
- [ ] Pin/Unpin Task (pinnedTasks JSON)
- [ ] View Reports (Chart.js rendering)
- [ ] Calendar view (event handlers)

---

### 6.3 Run Full Build

```bash
npm run build
```

**Expected**: Build succeeds with no type errors

---

## 📋 Success Metrics

| Metric | Before | Target | Status |
|--------|--------|--------|--------|
| `as any` count | 49 | 0-5 (only unavoidable) | ⏳ Pending |
| `@ts-ignore` count | 33 | ~15 (Prisma only) | ⏳ Pending |
| Type errors in build | Unknown | 0 | ⏳ Pending |
| Runtime type bugs | Unknown | 0 | ⏳ Pending |

---

## 🚫 Out of Scope (Save for Later)

**Not included in P0**:
1. Fixing all 24 Prisma `@ts-nocheck` files (requires Prisma schema updates)
2. Removing `@deprecated` multi-assignee code (separate P1 task)
3. Creating service layer types (P3 task)

These will be addressed in separate refactoring phases.

---

## 🎯 Final Checklist

**Before starting**:
- [ ] Backup current code (git commit)
- [ ] Create branch: `refactor/p0-type-safety`
- [ ] Read this plan thoroughly

**During refactoring**:
- [ ] Fix one category at a time
- [ ] Run `npm run type-check` after each fix
- [ ] Test critical paths after each phase
- [ ] Commit after each phase completion

**After completion**:
- [ ] Full type-check passes (0 errors)
- [ ] Full build succeeds
- [ ] Manual testing passes
- [ ] Update CLAUDE.md with results
- [ ] Create PR for review

---

## 📝 Notes

**Why this matters**:
- TypeScript is only valuable when properly typed
- `as any` defeats the purpose of TypeScript
- Catching errors at compile-time > runtime
- Better IDE autocomplete and refactoring

**Estimated time breakdown**:
- Day 1 AM: Analysis (4h)
- Day 1 PM: Type definitions (4h)
- Day 2 AM: Critical fixes (4h)
- Day 2 PM: High priority fixes (4h)
- Day 3 AM: Medium priority fixes (4h)
- Day 3 PM: Testing (4h)
- **Total: 24 hours / 3 days**

---

**Plan Status**: ✅ Complete - Ready for execution

**Next Step**: Present plan to developer for approval, then begin Phase 1
