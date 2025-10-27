# Workspace Navigation & Hierarchy Comparison: GAS vs Next.js

**Date**: 2025-10-23
**Purpose**: Compare Google Apps Script (GAS) implementation with current Next.js implementation to identify missing features and gaps

---

## 1. Workspace Hierarchy Implementation

### GAS Implementation (old_project)

**Data Structure:**
```javascript
// appState.navigation (in main.js.html, lines 52-62)
navigation: {
  currentLevel: "project", // 'missionGroup' | 'division' | 'department' | 'project'
  missionGroupId: null,
  missionGroupName: null,
  divisionId: null,
  divisionName: null,
  departmentId: null,
  departmentName: null,
  projectId: null,
  projectName: null,
}
```

**Key Features:**
- ✅ **4-Level Navigation**: Mission Group → Division → Department → Project
- ✅ **Stateful Navigation**: Tracks current level and all parent hierarchy
- ✅ **Cascading Context**: Parent IDs/names preserved when navigating deeper
- ✅ **Workspace Selectors**: 3 popover components for organization selection:
  - `MissionGroupSelector` (component.MissionGroupSelector.html)
  - `DivisionSelector` (component.DivisionSelector.html) - supports dependent filtering by Mission Group
  - `DepartmentSelector` (component.DepartmentSelector.html) - supports dependent filtering by Division
- ✅ **Single/Multiple Selection Mode**: All selectors support both modes
- ✅ **Searchable Dropdowns**: All selectors have search functionality

**Selector Features (All 3 Components):**
- Popover-based UI with search bar
- Dark mode support
- Shows metadata (e.g., chief user, division name, department tel)
- Checkbox (multiple) or Radio (single) selection
- Cancel/Save buttons
- Data from `appState.organizationData` (single source of truth)

---

### Next.js Implementation (Current)

**Data Structure:**
```typescript
// src/hooks/use-workspace.ts
interface WorkspaceData {
  viewType: 'hierarchical' | 'flat';
  userRole: UserRole;
  hierarchical?: WorkspaceMissionGroup[]; // For ADMIN/CHIEF/LEADER
  flat?: FlatWorkspaceItem[]; // For HEAD/MEMBER/USER
  departmentName?: string;
  divisionName?: string;
  missionGroupName?: string;
}

// WorkspaceMissionGroup structure
interface WorkspaceMissionGroup {
  id: string;
  name: string;
  divisions: WorkspaceDivision[]; // Nested divisions
}
```

**API Endpoint:**
- ✅ `GET /api/workspace` - Returns workspace structure based on role (src/app/api/workspace/route.ts)

**Key Features:**
- ✅ **Role-Based Workspace**: Different view for ADMIN/CHIEF/LEADER vs HEAD/MEMBER/USER
- ✅ **Hierarchical Data**: Mission Group → Division → Department → Project
- ✅ **Flat View**: For lower roles, simplified project list
- ✅ **Sidebar Component**: Collapsible tree view (src/components/layout/sidebar.tsx)
  - Expandable Mission Groups
  - Expandable Divisions
  - Expandable Departments
  - Project links

**Missing Features:**
- ❌ **No Navigation State Management**: No equivalent to GAS `appState.navigation`
- ❌ **No Workspace Selectors**: No popover components for selecting Mission Group/Division/Department
- ❌ **No Dependent Dropdowns**: No cascading selection (e.g., Division filtered by Mission Group)
- ❌ **No Multi-Select Support**: Cannot select multiple departments/divisions at once
- ❌ **No Search in Workspace**: Sidebar tree doesn't have search functionality
- ❌ **No Current Level Tracking**: Doesn't track whether user is viewing at Mission Group/Division/Department/Project level

---

## 2. Department View Implementation

### GAS Implementation

**Data Structure:**
```javascript
// appState.departmentView (lines 65-71)
departmentView: {
  currentDepartmentId: null,
  projects: [], // Array of projects in the department
  loadedTaskCounts: {}, // { projectId: numberOfLoadedTasks }
  tasksPerPage: 20, // Pagination
  sortStates: {}, // { projectId: { column: 'name', direction: 'asc' } }
}
```

**Key Features:**
- ✅ **Multi-Project Table View**: Shows all projects in a department with tasks
- ✅ **Pagination per Project**: Each project can load more tasks (20 at a time)
- ✅ **Per-Project Sorting**: Each project's tasks can be sorted independently
- ✅ **Department Cache**: `DepartmentCache.set()` and `DepartmentCache.setAsCurrent()` for performance
- ✅ **Auto-Sync**: When task changes in project view, department view data updates automatically
- ✅ **API Endpoint**: `getDepartmentTasks(departmentId)` (from APIService)

**Loading Flow (lines 3371-3464):**
1. Check if already loaded for this department in `appState.departmentView`
2. Try to load from `DepartmentCache`
3. If cache miss, fetch from backend `APIService.getDepartmentTasks(departmentId)`
4. Store in `appState.departmentView` and render
5. Update cache with new data

**Rendering:**
- `renderDepartmentView()` function (referenced but not shown in grep output)
- Shows skeleton loader while loading
- Multi-project table layout with expandable task rows

---

### Next.js Implementation (Current)

**Department Tasks View:**
- ⚠️ **Partially Planned**: Documented in `NEXT_GOAL_DEPARTMENT_TASKS.md` and related design docs
- ❌ **Not Yet Implemented**: No actual page exists at `/department/tasks` (referenced in sidebar.tsx:41)
- ❌ **No Department API**: No equivalent to `GET /api/departments/{id}/tasks`
- ❌ **No Multi-Project View**: No table showing all department projects at once
- ❌ **No Per-Project Pagination**: Not implemented
- ❌ **No Department Cache**: No client-side caching for department data

**Existing Related:**
- ✅ API exists: `GET /api/departments/{departmentId}/tasks` (src/app/api/departments/[departmentId]/tasks/route.ts)
  - Returns all projects in department with their tasks
  - Filters by `deletedAt IS NULL` and `dateDeleted IS NULL`
  - Includes task counts and custom statuses

**Design Documents:**
- `DEPARTMENT_TASKS_VIEW_DESIGN.md` - Main design document (not yet implemented)
- `DEPARTMENT_TASKS_GANTT_CHART_DESIGN.md` - Gantt chart feature (future)
- `DEPARTMENT_TASKS_CUSTOM_GROUPING_DESIGN.md` - Custom grouping (future)
- `DEPARTMENT_TASKS_DEPENDENCIES.md` - Task dependencies (future)

---

## 3. Breadcrumb Navigation Implementation

### GAS Implementation

**Key Features (lines 2894-3044):**
- ✅ **Dynamic Breadcrumb**: `renderBreadcrumb()` function
- ✅ **Multi-Level Path**: Shows Mission Group > Division > Department > Project
- ✅ **Clickable Links**: Navigate back to any level
- ✅ **Current Level Indicator**: Non-clickable and bold
- ✅ **Non-Clickable Levels**: Mission Group and Division are display-only
- ✅ **Project Selector Button**: Chevron button after department name (works in both department and project views)
- ✅ **Context-Aware**: Uses `appState.navigation` to determine current position
- ✅ **Workspace Filtering**: Only shows accessible levels based on user's workspace

**Breadcrumb Structure:**
```javascript
// Example breadcrumb path
[
  { level: "missionGroup", name: "กลุ่มภารกิจ A", id: "mg001" }, // Non-clickable
  { level: "division", name: "กองบริหาร", id: "div001" }, // Non-clickable
  { level: "department", name: "งานธุรการ", id: "dept001" }, // Clickable
  { level: "project", name: "โครงการจัดซื้อ", id: "proj001" } // Current (non-clickable)
]
```

**Project Selector in Breadcrumb (lines 3046-3078):**
- Chevron button appears after department name
- Opens popover with project list
- Context-aware: In department view, shows `departmentView.projects`; in project view, shows `departmentProjects`
- On select: Calls `navigateToLevel("project", projectId)`

**Navigation Handler (lines 3082-3230):**
- `handleBreadcrumbClick(e)` - Handles breadcrumb link clicks
- Updates `appState.navigation` state based on clicked level
- Loads data for the selected level:
  - Department: Calls `loadDepartmentView(id)`
  - Project: Loads project data and updates breadcrumb
- Re-renders breadcrumb and workspace after navigation

---

### Next.js Implementation (Current)

**Current State:**
- ❌ **No Breadcrumb Component**: No breadcrumb navigation exists
- ❌ **No Navigation Context**: No state tracking for current level
- ❌ **No Multi-Level Navigation**: Cannot navigate back to parent levels
- ❌ **No Project Selector in Breadcrumb**: No quick project switching

**Missing Components:**
- Breadcrumb component for multi-level navigation
- Navigation state management (Context or Zustand store)
- Project selector popover
- Level-specific loaders (loadDepartmentView, etc.)

---

## 4. Summary of Gaps

### Critical Missing Features:

1. **Navigation State Management**
   - No equivalent to `appState.navigation`
   - No tracking of current level (Mission Group/Division/Department/Project)
   - No parent hierarchy preservation

2. **Workspace Selectors**
   - Missing 3 popover selector components (Mission Group/Division/Department)
   - No dependent/cascading dropdowns
   - No multi-select support
   - No search in selectors

3. **Department View**
   - Page exists as route but not implemented (`/department/tasks`)
   - API endpoint exists but not used
   - No multi-project table view
   - No per-project pagination
   - No department-level cache

4. **Breadcrumb Navigation**
   - No breadcrumb component
   - No multi-level path display
   - No navigation back to parent levels
   - No project selector in breadcrumb

5. **Caching & Performance**
   - No `DepartmentCache` equivalent
   - No proactive data loading
   - No state synchronization between views

---

## 5. Recommendations

### Phase 1: Navigation State (High Priority)
- [ ] Create navigation context/store to track current level and hierarchy
- [ ] Add breadcrumb component with multi-level path
- [ ] Implement level-specific data loaders

### Phase 2: Department View (High Priority)
- [ ] Implement `/department/tasks` page with multi-project table
- [ ] Add per-project pagination and sorting
- [ ] Create department cache system
- [ ] Add auto-sync between project and department views

### Phase 3: Workspace Selectors (Medium Priority)
- [ ] Create `MissionGroupSelector` component (shadcn Dialog + Command)
- [ ] Create `DivisionSelector` component with dependent filtering
- [ ] Create `DepartmentSelector` component with dependent filtering
- [ ] Add multi-select support to all selectors
- [ ] Add search functionality

### Phase 4: Enhanced Navigation (Medium Priority)
- [ ] Add project selector button in breadcrumb
- [ ] Implement click handlers for breadcrumb navigation
- [ ] Add workspace filtering based on permissions

### Phase 5: Future Enhancements (Low Priority)
- [ ] Gantt chart view for department tasks (per design doc)
- [ ] Custom task grouping (per design doc)
- [ ] Task dependencies visualization

---

## 6. Next Steps

As requested, this comparison document is ready for review. Please let me know:

1. Which features should be prioritized for implementation?
2. Are there any GAS features that should NOT be migrated to Next.js?
3. Should we follow the GAS UI patterns exactly, or modernize with shadcn/ui components?

The most critical missing piece appears to be the **Department Tasks View** combined with **Navigation State Management** and **Breadcrumb Navigation**.
