# Department Tasks Navigation Fix

**Date**: 2025-10-23
**Status**: ✅ Complete

## Summary

Fixed multiple critical issues with ADMIN role access and department navigation in the Department Tasks View. The fixes ensure proper navigation between departments, correct project filtering, and simple data flow from parent to child components.

## Issues Fixed

### 1. ADMIN Role Authentication ✅

**Problem**: ADMIN role users could only see their own department (1 department) instead of all departments (72 departments).

**Root Cause**: BYPASS_AUTH mode was using a hard-coded mock session with `userId: 'user001'`, but user001 in the database was actually a LEADER, not an ADMIN.

**Solution**:
- Modified `src/lib/api-middleware.ts` to fetch real user data from database based on `BYPASS_USER_ID` env variable
- Created admin001 user with ADMIN role via `scripts/create-admin-user.ts`
- Added `BYPASS_USER_ID=admin001` to `.env` for ADMIN testing

**Result**: ADMIN users can now access all 9 Mission Groups and 72 Departments

**Files Modified**:
- `src/lib/api-middleware.ts` - Fetch real user from database
- `scripts/create-admin-user.ts` - Script to create ADMIN user
- `.env` - Added BYPASS_USER_ID variable

---

### 2. Department Navigation with URL Query Parameters ✅

**Problem**: When navigating to different departments, the breadcrumb project selector and department tasks view did not update to show the correct department's data.

**Root Cause**: Department tasks page was reading `departmentId` from `user.departmentId` instead of from URL query parameter.

**Solution**:
- Modified `src/app/(dashboard)/department/tasks/page.tsx` to read `departmentId` from `?departmentId=` query param using `useSearchParams()`
- Updated `src/components/navigation/workspace-navigation.tsx` to navigate with `?departmentId=` when clicking departments
- Updated `src/components/navigation/breadcrumb.tsx` to navigate with `?departmentId=` when switching departments

**Result**: Department navigation now works correctly. When navigating to any department, the page updates to show that department's projects and tasks.

**Files Modified**:
- `src/app/(dashboard)/department/tasks/page.tsx` - Read departmentId from URL
- `src/components/navigation/workspace-navigation.tsx` - Navigate with query param
- `src/components/navigation/breadcrumb.tsx` - Navigate with query param

---

### 3. Project Display (Show All, Collapse Empty) ✅

**Problem**: Projects with no tasks were completely hidden from the view, causing confusion when console showed "8 projects" but only 1 was visible.

**User Feedback**: "When did I tell you to hide projects with no tasks? You're overstepping again. What should be done is collapse projects with no tasks, and expand projects with tasks by default."

**Root Cause**: Overly eager implementation added `if (sortedTasks.length === 0) return null;` which hid empty projects.

**Solution**:
- Removed the hiding logic from `src/components/views/department-tasks/department-tasks-view.tsx`
- Added empty state message: "ไม่มีงานที่ตรงกับตัวกรอง" (No tasks matching filter)
- Modified initial `collapsedProjects` state to auto-collapse projects with no tasks (but still show them)

**Result**: All 8 projects now visible. Empty projects are collapsed by default but can be expanded by clicking the chevron.

**Files Modified**:
- `src/components/views/department-tasks/department-tasks-view.tsx` - Show all projects, collapse empty ones

---

### 4. CreateTaskModal Project Selector (Simple Pass-through) ✅

**Problem**: CreateTaskModal was not loading projects from the current department. The workspace cache was empty, causing no projects to appear in the project selector.

**User Feedback**: "Do you understand that the project selector should equal the projects in breadcrumb? Why are you thinking so complex?"

**Root Cause**: Overcomplicated logic trying to load from workspace cache, then fall back to department tasks cache, with multiple console.log statements.

**Solution**: Simple parent-to-child data flow
1. `DepartmentToolbar` filters projects by current department
2. Passes filtered projects to both `Breadcrumb` AND `CreateTaskButton` via `availableProjects` prop
3. `CreateTaskButton` passes to `useUIStore.openCreateTaskModal()`
4. `CreateTaskModal` uses pre-filtered projects directly (no complex cache logic)

**Result**: Project selector in CreateTaskModal now shows the exact same projects as the breadcrumb selector.

**Files Modified**:
- `src/components/layout/department-toolbar.tsx` - Filter and pass projects to both Breadcrumb and CreateTaskButton
- `src/components/common/create-task-button.tsx` - Accept and pass `availableProjects` prop
- `src/stores/use-ui-store.ts` - Store `availableProjects` in modal state
- `src/components/modals/create-task-modal.tsx` - Use pre-filtered projects (simple pattern)

---

## Technical Implementation

### BYPASS_AUTH Enhancement

**Before**:
```typescript
// Hard-coded mock session
authenticatedReq.session = {
  userId: 'user001',
  user: { /* hard-coded data */ }
};
```

**After**:
```typescript
// Fetch real user from database
const bypassUserId = process.env.BYPASS_USER_ID || 'user001';
const user = await prisma.user.findUnique({
  where: { id: bypassUserId },
  select: { /* all user fields */ }
});

authenticatedReq.session = {
  userId: user.id,
  user: { /* real user data from database */ }
};
```

### URL-Based Navigation

**Before**:
```typescript
// Read from user's department
const departmentId = user?.departmentId;
```

**After**:
```typescript
// Read from URL query parameter
const searchParams = useSearchParams();
const departmentIdFromUrl = searchParams.get('departmentId');
const departmentId = departmentIdFromUrl || user?.departmentId;
```

### Simple Data Flow Pattern

**Before** (Complex):
```typescript
// Try workspace cache
const cachedWorkspace = queryClient.getQueryData(['workspace']);
if (cachedWorkspace) { /* filter projects */ }

// Fall back to department tasks cache
if (projects.length === 0) {
  const departmentTasksCache = queryClient.getQueriesData(['departmentTasks', departmentId]);
  // More complex logic...
}
```

**After** (Simple):
```typescript
// DepartmentToolbar filters projects
const departmentProjects = useMemo(() => {
  // Find current department and extract its projects
  return dept.projects;
}, [workspaceData, currentDepartmentId]);

// Pass to both Breadcrumb AND CreateTaskButton
<Breadcrumb projects={departmentProjects} />
<CreateTaskButton availableProjects={departmentProjects} />
```

---

## Environment Variables

Added new environment variable for BYPASS_AUTH mode:

```bash
# .env
BYPASS_AUTH=true              # Enable authentication bypass
BYPASS_USER_ID=admin001       # User ID to use (admin001 for ADMIN, user001 for LEADER)
```

**Usage**:
- Set `BYPASS_USER_ID=admin001` to test as ADMIN role (full access to all departments)
- Set `BYPASS_USER_ID=user001` to test as LEADER role (limited to specific mission group)
- Default: `user001` if not specified

---

## Testing

**Test Scenarios**:

1. ✅ **ADMIN Access**: Navigate to different departments using workspace navigation or breadcrumb
   - Expected: All 9 Mission Groups and 72 Departments accessible
   - Actual: Working correctly

2. ✅ **Department Navigation**: Click on different departments in workspace navigation
   - Expected: URL updates with `?departmentId=DEPT-XXX`, page shows correct department's data
   - Actual: Working correctly

3. ✅ **Project Display**: Navigate to department with 8 projects (some empty)
   - Expected: All 8 projects visible, empty ones collapsed by default
   - Actual: Working correctly, shows "แสดง 8 โปรเจค | รวม X งาน"

4. ✅ **CreateTaskModal**: Click "Create Task" button in department tasks view
   - Expected: Project selector shows same projects as breadcrumb
   - Actual: Working correctly

**Test URLs**:
- http://localhost:3010/department/tasks?departmentId=DEPT-058
- http://localhost:3010/department/tasks?departmentId=DEPT-059

---

## Key Learnings

1. **Don't overcomplicate**: If data is already filtered in a parent component, just pass it down. No need for complex cache logic.

2. **Don't add features not requested**: User specifically said to collapse empty projects, not hide them. Listen to requirements carefully.

3. **Use URL for navigation state**: URL query parameters are the source of truth for navigation, not local state or user's primary department.

4. **BYPASS_AUTH should use real data**: Fetching real user data from database ensures proper testing of role-based access control.

---

## Documentation Updates

Updated the following documentation:

1. **CLAUDE.md**:
   - Added "Recent Completions" section with all 4 fixes
   - Updated "Test Environment" section with BYPASS_USER_ID info
   - Updated "Environment Variables" section
   - Updated "Department Tasks View" section with navigation details
   - Added to Changelog (2025-10-23 Part 4)

2. **Created this document** (DEPARTMENT_TASKS_NAVIGATION_FIX.md)

---

## Files Changed

**Total**: 11 files modified, 1167 insertions, 120 deletions

**Backend**:
- `src/lib/api-middleware.ts` - BYPASS_AUTH enhancement
- `scripts/create-admin-user.ts` - ADMIN user creation script (NEW)

**Frontend - Pages**:
- `src/app/(dashboard)/department/tasks/page.tsx` - URL-based navigation

**Frontend - Navigation**:
- `src/components/navigation/workspace-navigation.tsx` - Navigate with query param (NEW)
- `src/components/navigation/breadcrumb.tsx` - Navigate with query param (NEW)
- `src/components/layout/department-toolbar.tsx` - Filter and pass projects (NEW)

**Frontend - Views**:
- `src/components/views/department-tasks/department-tasks-view.tsx` - Show all projects

**Frontend - Modals**:
- `src/components/common/create-task-button.tsx` - Accept availableProjects prop
- `src/components/modals/create-task-modal.tsx` - Use pre-filtered projects

**Frontend - State**:
- `src/stores/use-ui-store.ts` - Store availableProjects

**Documentation**:
- `CLAUDE.md` - Updated with all fixes and new patterns

---

## Commit

```bash
git commit -m "fix: Department tasks navigation and CreateTaskModal project selector"
```

Commit hash: `25e403a`

---

## Next Steps

All issues are now resolved. Department tasks view is fully functional with:
- ✅ ADMIN role authentication
- ✅ URL-based navigation between departments
- ✅ All projects visible (empty ones collapsed)
- ✅ CreateTaskModal project selector matching breadcrumb

No further action required for this feature set.
