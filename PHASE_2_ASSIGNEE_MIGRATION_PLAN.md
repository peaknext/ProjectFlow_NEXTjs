# Phase 2: Fix Deprecated assigneeUserId - Implementation Plan

**Created**: 2025-10-30
**Status**: Planning
**Priority**: 🔴 CRITICAL (Data Consistency & Multi-Assignee Support)

---

## 📋 Overview

**Goal**: Replace all references to deprecated `assigneeUserId` with correct `assigneeUserIds` array

**Current Status**: 28 files using deprecated single-assignee field (excluding Prisma generated)
**Target**: 0 files using `assigneeUserId` (100% migrated to multi-assignee)
**Estimated Time**: 2-3 hours

**Impact**:
- ✅ Consistent multi-assignee support across codebase
- ✅ Remove confusion between single vs multi-assignee
- ✅ Align with current database schema (task_assignees table)
- ✅ Prevent data inconsistency bugs

---

## 🎯 Background

**Migration History**:
- Original system: Single assignee via `assigneeUserId` field
- Current system: Multi-assignee via `task_assignees` join table
- Problem: Code still references old field in 28+ places

**Database Schema**:
```prisma
model Task {
  // Deprecated (remove references)
  assigneeUserId String?  // ❌ OLD - single assignee

  // Current (use this)
  assignees TaskAssignee[]  // ✅ NEW - many-to-many relation
}

model TaskAssignee {
  taskId String
  userId String
  task   Task @relation(fields: [taskId])
  user   User @relation(fields: [userId])
}
```

**Correct Usage**:
```typescript
// ❌ OLD - Single assignee
task.assigneeUserId  // string | null

// ✅ NEW - Multi assignee
task.assigneeUserIds  // string[] (derived from assignees)
task.assignees        // User[] (with full relations)
```

---

## 📊 File Analysis

### Files to Fix (28 total, grouped by category)

#### Group 1: API Routes - Task Operations (8 files)
Core task CRUD operations

1. `src/app/api/tasks/route.ts` - Create task
2. `src/app/api/tasks/[taskId]/route.ts` - Get/Update/Delete single task
3. `src/app/api/tasks/[taskId]/close/route.ts` - Close task
4. `src/app/api/tasks/[taskId]/comments/route.ts` - Task comments with notifications
5. `src/app/api/tasks/bulk-update/route.ts` - Bulk task updates
6. `src/app/api/projects/[projectId]/tasks/route.ts` - Project tasks list/create
7. `src/app/api/batch/route.ts` - Batch operations
8. `src/app/api/reports/tasks/route.ts` - Task reports

**Common Issue**: API routes may use `assigneeUserId` in:
- Request body validation (Zod schemas)
- Database queries (where clauses)
- Response formatting

---

#### Group 2: API Routes - Data Aggregation (4 files)
Routes that aggregate task data

9. `src/app/api/projects/[projectId]/board/route.ts` - Board view data
10. `src/app/api/departments/[departmentId]/tasks/route.ts` - Department tasks
11. `src/app/api/workspace/route.ts` - Workspace overview
12. `src/app/api/activities/recent/route.ts` - Recent activities

**Common Issue**: May include `assigneeUserId` in SELECT projections

---

#### Group 3: Hooks & State Management (5 files)
React Query hooks and state

13. `src/hooks/use-tasks.ts` - Task data fetching and mutations
14. `src/hooks/use-bulk-actions.ts` - Bulk operations
15. `src/hooks/use-task-permissions.ts` - Task permission checks
16. `src/hooks/use-reports.ts` - Reports data

**Common Issue**: Type definitions expecting `assigneeUserId`

---

#### Group 4: Components - Task Panel (3 files)
Task detail panel components

17. `src/components/task-panel/details-tab/index.tsx` - Main details tab
18. `src/components/task-panel/details-tab/field-grid.tsx` - Field display
19. `src/components/task-panel/details-tab/subtasks-section.tsx` - Subtasks

**Common Issue**: Reading/displaying `assigneeUserId` field

---

#### Group 5: Components - Views (4 files)
List and grid view components

20. `src/components/views/list-view/index.tsx` - List view
21. `src/components/views/department-tasks/department-tasks-view.tsx` - Department view
22. `src/components/common/task-row.tsx` - Task row component
23. `src/components/views/common/filter-tasks.ts` - Task filtering utility

**Common Issue**: Filter/sort by assignee using old field

---

#### Group 6: Forms & Validation (2 files)
Task creation/editing forms

24. `src/components/modals/create-task-modal.tsx` - Create task modal
25. `src/lib/validations/task-schema.ts` - Zod validation schemas

**Common Issue**: Form schemas expecting `assigneeUserId`

---

#### Group 7: Types & Utilities (2 files)
Type definitions and utilities

26. `src/types/api-responses.ts` - API response types
27. `src/types/form-types.ts` - Form data types
28. `src/lib/permissions.ts` - Permission checks

**Common Issue**: Type definitions with `assigneeUserId` field

---

## 🚀 Implementation Steps

### **Step 1: Types & Validation (Group 6-7)** ⏱️ 20-30 min
**Files**: 4 files (api-responses, form-types, task-schema, permissions)

**Rationale**: Fix type definitions first so components can reference correct types

**Tasks**:
1. Update `src/types/api-responses.ts`
   - Change `assigneeUserId?: string` → `assigneeUserIds?: string[]`
   - Verify TaskResponse, TaskListResponse types

2. Update `src/types/form-types.ts`
   - Change `assigneeUserId?: string` → `assigneeUserIds?: string[]`
   - Verify CreateTaskFormData, UpdateTaskFormData types

3. Update `src/lib/validations/task-schema.ts`
   - Change Zod schema: `assigneeUserId: z.string().optional()` → `assigneeUserIds: z.array(z.string()).optional()`

4. Update `src/lib/permissions.ts`
   - Update permission check functions to handle arrays
   - Change `userId === task.assigneeUserId` → `task.assigneeUserIds?.includes(userId)`

5. Test: `npm run type-check`

**Acceptance Criteria**:
- ✅ All 4 files compile without errors
- ✅ Type definitions use `assigneeUserIds` (array)
- ✅ Permission checks handle arrays correctly

---

### **Step 2: Hooks & State (Group 3)** ⏱️ 20-30 min
**Files**: 4 files (use-tasks, use-bulk-actions, use-task-permissions, use-reports)

**Tasks**:
1. Update `src/hooks/use-tasks.ts`
   - Change mutation payloads to use `assigneeUserIds`
   - Update query data transformations

2. Update `src/hooks/use-bulk-actions.ts`
   - Change bulk update to use `assigneeUserIds`

3. Update `src/hooks/use-task-permissions.ts`
   - Update permission checks to use array

4. Update `src/hooks/use-reports.ts`
   - Update report data types

5. Test: `npm run type-check`

**Acceptance Criteria**:
- ✅ All 4 hooks compile without errors
- ✅ React Query types match API types
- ✅ Permission checks work with arrays

---

### **Step 3: API Routes - Task Operations (Group 1)** ⏱️ 30-40 min
**Files**: 8 files (tasks routes, batch, reports)

**Tasks**:
1. Update each API route:
   - Change Zod validation schemas to use `assigneeUserIds`
   - Update Prisma queries to use `assignees` relation
   - Update response formatting

2. Pattern to follow:
   ```typescript
   // ❌ OLD
   const task = await prisma.task.findUnique({
     where: { id },
     include: { assignee: true }
   });

   // ✅ NEW
   const task = await prisma.task.findUnique({
     where: { id },
     include: {
       assignees: {
         include: { user: true }
       }
     }
   });

   // Extract assigneeUserIds
   const assigneeUserIds = task.assignees.map(a => a.userId);
   ```

3. Test each route after changes

**Acceptance Criteria**:
- ✅ All 8 routes compile without errors
- ✅ API responses include `assigneeUserIds` array
- ✅ Multi-assignee functionality works

---

### **Step 4: API Routes - Aggregation (Group 2)** ⏱️ 20-30 min
**Files**: 4 files (board, department tasks, workspace, activities)

**Tasks**:
1. Update aggregation queries to include assignees relation
2. Transform data to include `assigneeUserIds` array
3. Test: `npm run type-check`

**Acceptance Criteria**:
- ✅ All 4 routes compile without errors
- ✅ Aggregated data includes correct assignee arrays

---

### **Step 5: Components - Forms (Group 6)** ⏱️ 15-20 min
**Files**: 1 file (create-task-modal)

**Tasks**:
1. Update `src/components/modals/create-task-modal.tsx`
   - Change form field from single to multi-select
   - Update form submission to send `assigneeUserIds`

2. Test: Create task with multiple assignees

**Acceptance Criteria**:
- ✅ Form allows multiple assignee selection
- ✅ Form submits `assigneeUserIds` array

---

### **Step 6: Components - Views (Group 4-5)** ⏱️ 20-30 min
**Files**: 7 files (task-panel, list-view, task-row, etc.)

**Tasks**:
1. Update all view components to read `assigneeUserIds`
2. Update filter logic to check array membership
3. Test: Display and filtering work correctly

**Acceptance Criteria**:
- ✅ All 7 components compile without errors
- ✅ Task assignees display correctly
- ✅ Filtering by assignee works

---

### **Step 7: Final Verification** ⏱️ 10-15 min

**Tasks**:
1. Run full type-check: `npm run type-check`
2. Search for remaining references: `grep -r "assigneeUserId" src/`
3. Test multi-assignee functionality:
   - Create task with multiple assignees
   - Update task assignees
   - Filter by assignee
   - Check permissions
4. Update documentation

**Acceptance Criteria**:
- ✅ Zero `assigneeUserId` references (excluding Prisma generated)
- ✅ `npm run type-check` passes (0 errors)
- ✅ Multi-assignee functionality works end-to-end
- ✅ Documentation updated

---

## 📈 Progress Tracking

| Step | Status | Files | Progress | Time |
|------|--------|-------|----------|------|
| Step 1 | ⏳ Pending | 4 files | 0/28 (0%) | - |
| Step 2 | ⏳ Pending | 4 files | 4/28 (14%) | - |
| Step 3 | ⏳ Pending | 8 files | 8/28 (29%) | - |
| Step 4 | ⏳ Pending | 4 files | 12/28 (43%) | - |
| Step 5 | ⏳ Pending | 1 file | 13/28 (46%) | - |
| Step 6 | ⏳ Pending | 7 files | 20/28 (71%) | - |
| Step 7 | ⏳ Pending | Verify | 28/28 (100%) | - |

**Total Progress**: 0/28 files fixed (0%)

---

## 🧪 Testing Strategy

**After Each Step**:
```bash
# 1. Type-check specific files
npm run type-check

# 2. Count remaining references
grep -r "assigneeUserId" src/ --include="*.ts" --include="*.tsx" | grep -v "generated/prisma" | wc -l

# 3. Test affected functionality
# (Run dev server and test specific features)
```

**Final Testing**:
```bash
# 1. Full type-check
npm run type-check

# 2. Verify zero references (excluding Prisma)
grep -r "assigneeUserId" src/ --include="*.ts" --include="*.tsx" | grep -v "generated/prisma"
# Should return: (empty)

# 3. Manual testing
# - Create task with multiple assignees
# - Update task assignees
# - View task in different views
# - Filter by assignee
# - Check permission-based access
```

---

## 📝 Common Patterns

### Pattern 1: Type Definition Update
```typescript
// ❌ OLD
interface Task {
  assigneeUserId?: string | null;
}

// ✅ NEW
interface Task {
  assigneeUserIds?: string[];
  assignees?: User[];  // Include full relation if needed
}
```

### Pattern 2: Zod Schema Update
```typescript
// ❌ OLD
assigneeUserId: z.string().uuid().optional()

// ✅ NEW
assigneeUserIds: z.array(z.string().uuid()).optional()
```

### Pattern 3: Prisma Query Update
```typescript
// ❌ OLD - Single assignee
const tasks = await prisma.task.findMany({
  where: { assigneeUserId: userId },
  include: { assignee: true }
});

// ✅ NEW - Multi assignee
const tasks = await prisma.task.findMany({
  where: {
    assignees: {
      some: { userId }  // Check if user is in assignees
    }
  },
  include: {
    assignees: {
      include: { user: true }
    }
  }
});

// Transform to include assigneeUserIds
const tasksWithIds = tasks.map(task => ({
  ...task,
  assigneeUserIds: task.assignees.map(a => a.userId)
}));
```

### Pattern 4: Permission Check Update
```typescript
// ❌ OLD
const isAssignee = task.assigneeUserId === userId;

// ✅ NEW
const isAssignee = task.assigneeUserIds?.includes(userId) ?? false;
```

### Pattern 5: Filter Logic Update
```typescript
// ❌ OLD
tasks.filter(task => task.assigneeUserId === selectedUserId)

// ✅ NEW
tasks.filter(task => task.assigneeUserIds?.includes(selectedUserId))
```

---

## 🎯 Success Criteria

- [ ] All 28 files updated (100% migration)
- [ ] Zero `assigneeUserId` references (excluding Prisma generated)
- [ ] `npm run type-check` passes with 0 errors
- [ ] Multi-assignee functionality works end-to-end
- [ ] Permission checks work correctly with arrays
- [ ] Filtering by assignee works in all views
- [ ] Documentation updated (CLAUDE.md, REFACTORING_PLAN)
- [ ] Completion report created

---

## 🚨 Rollback Plan

If migration causes issues:

1. Revert specific file: `git checkout HEAD -- <file>`
2. Re-add temporary type cast: `(task as any).assigneeUserId`
3. Document issue in TODO comment
4. Move to next file
5. Return to problematic file later

---

## 📚 References

- **Multi-Assignee Implementation**: `MULTI_ASSIGNEE_IMPLEMENTATION.md`
- **Prisma Schema**: `prisma/schema.prisma` (Task, TaskAssignee models)
- **Type Safety Best Practices**: `CLAUDE.md` (lines 789-921)
- **Refactoring Plan**: `REFACTORING_PLAN_2025-10-30.md`

---

**Next Action**: Start with Step 1 (Types & Validation - 4 files)
