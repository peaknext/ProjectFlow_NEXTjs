# Frontend Migration Guide - COMPLETE VERSION
## GAS HTML/JS → Next.js + shadcn/ui

**Version:** 2.0 (Updated with Missing Features)
**Date:** 2025-10-21
**Status:** 🔴 CRITICAL UPDATE - 29 Missing Components Identified

---

## 📊 Executive Summary

### Coverage Analysis

| Category | GAS Features | Currently Planned | **MISSING** | Coverage % |
|----------|--------------|-------------------|-------------|------------|
| **Authentication Pages** | 5 | 0 | **5** | 0% ⚠️ |
| **Views & Pages** | 10 | 4 | **6** | 40% |
| **Management Interfaces** | 3 | 0 | **3** | 0% |
| **Modals & Dialogs** | 8 | 4 | **4** | 50% |
| **Selectors & Pickers** | 9 | 4 | **5** | 44% |
| **Dashboard Widgets** | 8 | 0 | **8** | 0% |
| **Advanced Features** | 12 | 4 | **8** | 33% |
| **TOTAL COMPONENTS** | **55** | **16** | **39** | **29%** |

**🚨 ACTION REQUIRED:** แผนปัจจุบันครอบคลุมเพียง 29% ของ functionality ที่มีในระบบเดิม
**🔴 CRITICAL**: Authentication pages (0%) block all rollout plans

---

## Table of Contents

1. [Complete Component Inventory](#1-complete-component-inventory)
2. [Missing Critical Features](#2-missing-critical-features--must-implement)
3. [Updated Migration Plan](#3-updated-migration-plan)
4. [Implementation Priority Matrix](#4-implementation-priority-matrix)
5. [Design System Migration](#5-design-system-migration)
6. [State Management Strategy](#6-state-management-strategy)
7. [Component Migration Examples](#7-component-migration-examples)
8. [Timeline & Resource Estimation](#8-timeline--resource-estimation)

⚠️ **CRITICAL UPDATE**: Authentication frontend pages are NOT implemented. Only backend API endpoints exist.

---

## 1. Complete Component Inventory

### 1.1 ✅ Currently Planned Components (16 components)

| GAS Component | Next.js Path | shadcn/ui | Priority | Status |
|---------------|--------------|-----------|----------|--------|
| **Core Views (4)** |
| `component.BoardView.html` | `src/components/views/board-view/` | DnD | HIGH | ✅ Done |
| `component.ListView.html` | `src/components/views/list-view/` | Table | HIGH | ✅ Done |
| `component.CalendarView.html` | `src/components/views/calendar-view/` | Calendar | HIGH | ✅ Done |
| `component.DashboardView.html` | `src/components/views/dashboard-view/` | Card | MED | ⏳ Partial |
| **Modals (4)** |
| `component.CreateTaskModal.html` | `src/components/modals/create-task-modal.tsx` | Dialog, Form | HIGH | ⏳ Planned |
| `component.CreateProjectModal.html` | `src/components/modals/create-project-modal.tsx` | Dialog | HIGH | ⏳ Planned |
| `component.EditProjectModal.html` | `src/components/modals/edit-project-modal.tsx` | Dialog | MED | ⏳ Planned |
| `component.EditProfileModal.html` | `src/components/modals/edit-profile-modal.tsx` | Dialog, Avatar | MED | ⏳ Planned |
| **Panels (1)** |
| `component.TaskPanel.html` | `src/components/panels/task-panel/` | Sheet, Tabs | HIGH | ⏳ Planned |
| **Selectors (4)** |
| `component.ProjectSelector.html` | `src/components/selectors/project-selector.tsx` | Combobox | HIGH | ⏳ Planned |
| `component.DepartmentSelector.html` | `src/components/selectors/department-selector.tsx` | Select | MED | ⏳ Planned |
| `component.DivisionSelector.html` | `src/components/selectors/division-selector.tsx` | Select | MED | ⏳ Planned |
| `component.MissionGroupSelector.html` | `src/components/selectors/mission-group-selector.tsx` | Select | MED | ⏳ Planned |
| **UI Components (3)** |
| `component.FilterBar.html` | `src/components/common/filter-bar.tsx` | Popover | HIGH | ⏳ Planned |
| `component.ColorPicker.html` | `src/components/common/color-picker.tsx` | Popover | MED | ⏳ Planned |
| `component.NotificationCenter.html` | `src/components/layout/notification-center.tsx` | Popover | MED | ⏳ Planned |

---

### 1.2 🔴 MISSING CRITICAL Components (34 components)

#### A. Management Pages (3 components) - 🔴 PRIORITY 1

| GAS Component | Next.js Path | Description | Complexity |
|---------------|--------------|-------------|------------|
| **`component.UserManagement.html`** | `src/app/(dashboard)/admin/users/page.tsx` | User CRUD, search, filter, pagination, role assignment | HIGH |
| **`component.ProjectManagement.html`** | `src/app/(dashboard)/admin/projects/page.tsx` | Project CRUD, archive, bulk operations | HIGH |
| **`component.ReportsDashboard.html`** | `src/app/(dashboard)/reports/page.tsx` | Charts (Chart.js), analytics, date range filters, export | HIGH |

**ผลกระทบ:** ไม่มีหน้าเหล่านี้ = ไม่สามารถจัดการ users, projects, และดู reports ได้

---

#### B. Dashboard Widgets (8 components) - 🔴 PRIORITY 1

| Widget | Path | Description | Complexity |
|--------|------|-------------|------------|
| **Quick Stats Cards** | `src/components/dashboard/quick-stats.tsx` | Total/Completed/Overdue/Week tasks with icons | LOW |
| **Overdue Tasks Alert** | `src/components/dashboard/overdue-alert.tsx` | Red gradient section with top 5 overdue tasks | MEDIUM |
| **Mini Calendar** | `src/components/dashboard/mini-calendar.tsx` | Calendar with task date indicators (dots) | MEDIUM |
| **Recent Activities Widget** | `src/components/dashboard/recent-activities.tsx` | Activity feed with avatars, time-ago format | MEDIUM |
| **Recent Comments Widget** | `src/components/dashboard/recent-comments.tsx` | Comments list with user references | MEDIUM |
| **Pinned Tasks Section** | `src/components/dashboard/pinned-tasks.tsx` | Horizontal scrollable pinned tasks | LOW |
| **Task Filters (Dashboard)** | `src/components/dashboard/task-filters.tsx` | All/Today/Week buttons + Hide closed toggle | LOW |
| **Department Filter** | `src/components/dashboard/department-filter.tsx` | Filter dashboard by department | LOW |

**ผลกระทบ:** Dashboard จะมีแค่พื้นฐาน ไม่มี widgets สำคัญที่ช่วยให้ผู้ใช้เห็นภาพรวม

---

#### C. Advanced Modals & Dialogs (4 components) - 🟡 PRIORITY 2

| Modal | Path | Description | Complexity |
|-------|------|-------------|------------|
| **Close Task Dialog** | `src/components/modals/close-task-dialog.tsx` | Select close type (Completed/Aborted), confirmation | LOW |
| **Reopen Task Dialog** | `src/components/modals/reopen-task-dialog.tsx` | Reopen recently closed task with reason | LOW |
| **Delete Confirmation** | `src/components/modals/delete-confirmation.tsx` | Reusable delete confirm with custom messages | LOW |
| **Bulk Actions Dialog** | `src/components/modals/bulk-actions-dialog.tsx` | Bulk delete, status change, assign | MEDIUM |

---

#### D. Specialized Selectors (5 components) - 🟡 PRIORITY 2

| Selector | Path | Description | Complexity |
|----------|------|-------------|------------|
| **Hospital Mission Selector** | `src/components/selectors/hospital-mission-selector.tsx` | Multi-select hospital missions | MEDIUM |
| **Action Plan Selector** | `src/components/selectors/action-plan-selector.tsx` | Multi-select action plans | MEDIUM |
| **IT Goals Checklist** | `src/components/selectors/it-goals-checklist.tsx` | IT goals with progress indicators | MEDIUM |
| **User Selector (Multi)** | `src/components/selectors/user-selector-multi.tsx` | Multi-select users with search, checkboxes | MEDIUM |
| **Difficulty Selector** | `src/components/selectors/difficulty-selector.tsx` | Easy/Normal/Hard with color dots | LOW |

---

#### E. Task Panel Components (4 components) - 🔴 PRIORITY 1

| Component | Path | Description | Complexity |
|-----------|------|-------------|------------|
| **Subtasks Section** | `src/components/panels/task-panel/subtasks-section.tsx` | List subtasks, add subtask, parent link | MEDIUM |
| **Checklists Section** | `src/components/panels/task-panel/checklist-section.tsx` | Add/toggle/delete checklist items, progress bar | MEDIUM |
| **Comments Section** | `src/components/panels/task-panel/comments-section.tsx` | Add comments with @mentions (Tribute.js), list | HIGH |
| **Task History Tab** | `src/components/panels/task-panel/task-history.tsx` | Activity timeline for task changes | MEDIUM |

**ผลกระทบ:** Task Panel จะไม่สมบูรณ์ ขาด subtasks, checklists, comments, history

---

#### F. UI Components & Features (10 components) - 🟢 PRIORITY 3

| Component | Path | Description | Complexity |
|-----------|------|-------------|------------|
| **Inline Editor** | `src/components/common/inline-editor.tsx` | In-place edit with Save/Cancel, keyboard shortcuts | MEDIUM |
| **Global Search** | `src/components/layout/global-search.tsx` | Task search in header with dropdown results | MEDIUM |
| **Skeleton States** | `src/components/common/skeleton-states.tsx` | Loading skeletons for cards/tables/forms | LOW |
| **Empty States** | `src/components/common/empty-states.tsx` | Illustrations for no data scenarios | LOW |
| **Toast Notifications** | `src/components/common/toast-notifications.tsx` | Success/Error/Info toasts | LOW |
| **Date Picker (Custom)** | `src/components/common/date-picker-custom.tsx` | Thai month names, Buddhist calendar | MEDIUM |
| **Avatar Group** | `src/components/common/avatar-group.tsx` | Stacked avatars with +N indicator | LOW |
| **Progress Bar** | `src/components/common/progress-bar.tsx` | Task/project progress visualization | LOW |
| **Badge Group** | `src/components/common/badge-group.tsx` | Multiple badges for filters/tags | LOW |
| **Action Menu** | `src/components/common/action-menu.tsx` | Reusable dropdown menu for actions | LOW |

---

#### G. Settings & Profile Pages (3 components) - 🟢 PRIORITY 3

| Page | Path | Description | Complexity |
|------|------|-------------|------------|
| **Settings Page** | `src/app/(dashboard)/settings/page.tsx` | User preferences, notifications, theme | MEDIUM |
| **Profile Page** | `src/app/(dashboard)/profile/page.tsx` | Full profile view, stats, activity | MEDIUM |
| **Organization Page** | `src/app/(dashboard)/admin/organization/page.tsx` | Manage mission groups/divisions/departments | HIGH |

---

## 2. Missing Critical Features — MUST IMPLEMENT

### 2.1 🔴 CRITICAL Features (Cannot launch without these)

#### **A. Authentication System** ⚠️ **HIGHEST PRIORITY - MISSING**

**Current State:** ❌ NOT implemented (Only API endpoints exist)
**Required For:** Application access, user onboarding, security

**Missing Pages:**

1. **Login Page** (`src/app/(auth)/login/page.tsx`)
   - Email + Password form
   - "Remember me" checkbox
   - "Forgot password?" link
   - Validation with Zod
   - Error handling (invalid credentials, account disabled)
   - Redirect to dashboard after login
   - Loading state during authentication

2. **Registration Page** (`src/app/(auth)/register/page.tsx`)
   - Full name, Email, Password, Confirm Password
   - Password strength indicator
   - Terms of service checkbox
   - Email verification sent message
   - Validation (email format, password strength, unique email)
   - Success redirect to verification notice

3. **Email Verification Page** (`src/app/(auth)/verify-email/page.tsx`)
   - Verification token from URL query parameter
   - Auto-verify on mount
   - Success/Error states
   - Resend verification email button
   - Redirect to login after success

4. **Password Reset Request Page** (`src/app/(auth)/request-reset/page.tsx`)
   - Email input
   - Send reset link button
   - Success message: "Check your email"
   - Back to login link

5. **Password Reset Page** (`src/app/(auth)/reset-password/page.tsx`)
   - Reset token from URL
   - New password + Confirm password inputs
   - Password strength indicator
   - Submit button
   - Success redirect to login

**API Endpoints (Already Exist):**
- ✅ `POST /api/auth/login`
- ✅ `POST /api/auth/logout`
- ✅ `POST /api/auth/register`
- ✅ `POST /api/auth/verify-email`
- ✅ `POST /api/auth/request-reset`
- ✅ `POST /api/auth/reset-password`

**Implementation Estimate:** 3-4 days

**Technical Requirements:**
- Use `src/lib/api-client.ts` for API calls
- Store session token in localStorage
- Implement auto-redirect if already logged in
- Handle email service (currently console.log)
- Create `(auth)` route group (no dashboard layout)

---

#### **B. User Management System**

**Current State:** ❌ Not planned
**Required For:** Admin operations, user onboarding

**Components:**
1. **User List Page** (`src/app/(dashboard)/admin/users/page.tsx`)
   - DataTable with columns: Name, Email, Role, Department, Status, Last Active
   - Search by name/email (debounced 300ms)
   - Filter by: Status (Active/Suspended), Role (6 levels), Department
   - Sort by: Name, Email, Role, Status, Last Active
   - Pagination (10/20/50 per page)
   - Actions: Edit, Disable, Delete (with confirmation)

2. **Edit User Dialog** (`src/components/modals/edit-user-dialog.tsx`)
   - Update: Full name, Email, Role, Department, Status
   - Assign additional roles (if admin)
   - Validation with Zod

**Implementation Estimate:** 3-4 days

---

#### **B. Project Management System**

**Current State:** ❌ Not planned
**Required For:** Project CRUD, department organization

**Components:**
1. **Project List Page** (`src/app/(dashboard)/admin/projects/page.tsx`)
   - Project cards/table with: Name, Department, Status, Task count, Last updated
   - Filter by: Department, Status (Active/Archived)
   - Search by name
   - Bulk operations: Archive, Delete (with confirmation)
   - Actions: Edit, Delete, View, Archive/Unarchive

2. **Project Settings Panel** (`src/components/panels/project-settings-panel.tsx`)
   - Edit project details
   - Manage custom statuses (add/edit/delete/reorder)
   - Assign project lead
   - Archive project

**Implementation Estimate:** 2-3 days

---

#### **C. Reports & Analytics Dashboard**

**Current State:** ❌ Not planned
**Required For:** Management oversight, data-driven decisions

**Components:**
1. **Reports Page** (`src/app/(dashboard)/reports/page.tsx`)
   - Summary cards: Unassigned, In Progress, Completed tasks
   - Charts using Recharts (React) or Chart.js:
     - **Donut Chart:** Tasks by Status (color-coded)
     - **Bar Chart:** Open Tasks by Assignee
     - **Stacked Bar Chart:** Workload by Status per user
   - Date range filter
   - Department filter
   - Export to CSV/PDF (optional)

2. **Chart Components**
   ```tsx
   src/components/charts/
   ├── donut-chart.tsx        # Tasks by status
   ├── bar-chart.tsx          # Tasks by assignee
   └── stacked-bar-chart.tsx  # Workload distribution
   ```

**Dependencies:** Install `recharts` or `chart.js` + `react-chartjs-2`

**Implementation Estimate:** 3-4 days

---

#### **D. Comments with @Mentions**

**Current State:** ❌ Not planned
**Required For:** Team collaboration, task discussions

**Components:**
1. **Comments Section** (`src/components/panels/task-panel/comments-section.tsx`)
   - Comment input with @mention autocomplete
   - Use `react-mentions` or `@tiptap/react` for mentions
   - Display comments with:
     - User avatar
     - User name (clickable to profile)
     - Timestamp (relative: "2 hours ago")
     - Mentioned users highlighted
   - Load more comments (pagination)

2. **Mention Autocomplete**
   - Trigger on "@" character
   - Search users by name
   - Insert mention tag: `@[User Name](userId)`

**Dependencies:** `react-mentions` or `@tiptap/react` + `@tiptap/extension-mention`

**Implementation Estimate:** 2-3 days

---

#### **E. Subtasks Management**

**Current State:** ❌ Not planned
**Required For:** Task breakdown, hierarchical organization

**Components:**
1. **Subtasks Section** (`src/components/panels/task-panel/subtasks-section.tsx`)
   - List subtasks with status checkboxes
   - Click subtask to open its panel
   - "Add subtask" button → Opens Create Task Modal with:
     - Pre-filled parent task ID
     - Indicator: "เป็นงานย่อยของ: [Parent Task Name]"
   - Display parent task link (if current task is subtask)

**API Requirements:**
- `GET /api/tasks/:id/subtasks` - Already exists ✅
- `POST /api/projects/:projectId/tasks` with `parentTaskId` - Already exists ✅

**Implementation Estimate:** 1-2 days

---

#### **F. Dashboard Widgets**

**Current State:** ⚠️ Partially planned (basic dashboard only)
**Required For:** User productivity, quick overview

**Missing Widgets:**

1. **Overdue Tasks Alert** (`src/components/dashboard/overdue-alert.tsx`)
   ```tsx
   - Red gradient background
   - Icon + count: "มีงาน X รายการเกินกำหนด"
   - List top 5 overdue tasks
   - Action button per task
   ```

2. **Mini Calendar** (`src/components/dashboard/mini-calendar.tsx`)
   ```tsx
   - Month view with prev/next navigation
   - Task indicators (dots):
     - Red dot: Overdue task
     - Orange dot: Due today
     - Blue dot: Due this week
   - Click date → Filter tasks by that date
   - Thai day abbreviations: อา, จ, อ, พ, พฤ, ศ, ส
   ```

3. **Recent Activities** (`src/components/dashboard/recent-activities.tsx`)
   ```tsx
   - List 10 recent activities
   - Avatar + Name + Action + Time ago
   - Examples:
     - "John created task 'XYZ'" - 5 min ago
     - "Jane completed task 'ABC'" - 1 hour ago
   ```

4. **Recent Comments** (`src/components/dashboard/recent-comments.tsx`)
   ```tsx
   - List 5 recent comments
   - Avatar + Name + Comment preview + Task link
   - Click → Open task panel
   ```

5. **Pinned Tasks Section** (`src/components/dashboard/pinned-tasks.tsx`)
   ```tsx
   - Horizontal scrollable list of pinned task cards
   - Quick access to important tasks
   - Empty state: "ยังไม่มีงานที่ปักหมุด"
   ```

**Implementation Estimate:** 3-4 days for all widgets

---

### 2.2 🟡 HIGH Priority Features (Should have)

#### **A. Global Search**

**Implementation:**
```tsx
// src/components/layout/global-search.tsx

- Search input in navbar (header)
- Debounced search (300ms)
- Dropdown results showing:
  - Task name
  - Project name
  - Assignee
  - Due date
- Click result → Open task panel
- Keyboard navigation (arrow keys, Enter)
```

**API:** `GET /api/search?q=keyword` (need to create)

**Estimate:** 1-2 days

---

#### **A. Inline Editor**

**Implementation:**
```tsx
// src/components/common/inline-editor.tsx

- Click text → Switch to input mode
- Show Save/Cancel buttons
- Keyboard shortcuts:
  - Enter → Save
  - Escape → Cancel
- Auto-focus input
- Validation before save
```

**Use Cases:**
- Task name editing in Task Panel
- Project name editing
- Description editing

**Estimate:** 1 day

---

#### **C. Close Task Workflow**

**Current:** ⚠️ Partially implemented (basic close)
**Missing:**
1. Close type selection (Completed vs Aborted)
2. Confirmation dialog
3. Reason input (optional)
4. Reopen functionality

**Implementation:**
```tsx
// src/components/modals/close-task-dialog.tsx

<Dialog>
  <DialogTitle>ปิดงาน: {taskName}</DialogTitle>
  <RadioGroup>
    <Radio value="COMPLETED">แล้วเสร็จ (เขียว)</Radio>
    <Radio value="ABORTED">ยกเลิก (เทา)</Radio>
  </RadioGroup>
  <Textarea placeholder="เหตุผล (ถ้ามี)" />
  <Button onClick={handleClose}>ยืนยัน</Button>
</Dialog>
```

**Estimate:** 0.5-1 day

---

### 2.3 🟢 MEDIUM Priority Features (Nice to have)

- Settings Page (user preferences, notifications)
- Profile Page (full profile view, activity history)
- Organization Management Page (mission groups, divisions, departments)
- Keyboard shortcuts guide
- Onboarding tour
- Export/Import functionality

**Total Estimate:** 5-7 days

---

## 3. Updated Migration Plan

### 3.1 Revised Component Count

| Category | Original Plan | Updated Plan | Delta |
|----------|---------------|--------------|-------|
| **Authentication Pages** | 0 | **5** | +5 ⚠️ |
| Views & Pages | 6 | **13** | +7 |
| Modals | 4 | **12** | +8 |
| Panels & Sections | 3 | **11** | +8 |
| Selectors | 4 | **9** | +5 |
| Widgets | 0 | **8** | +8 |
| UI Components | 9 | **19** | +10 |
| **TOTAL** | **26** | **77** | **+51** |

**Note:** Authentication pages added after discovering they were missing entirely.

---

### 3.2 Updated Timeline

**Original Estimate:** 6-7 weeks
**Revised Estimate:** 11-13 weeks

| Phase | Original | Revised | Reason |
|-------|----------|---------|--------|
| **Phase 0: Authentication** | 0 weeks | **1 week** | NEW (Login, Register, Reset, Verify) ⚠️ |
| Phase 1: Layout | 1-2 weeks | 1-2 weeks | Same (already complete) |
| Phase 2: Task Management | 2-3 weeks | **4-5 weeks** | +Subtasks, +Checklists, +Comments |
| Phase 3: Dashboard & Widgets | 1 week | **2-3 weeks** | +8 widgets |
| Phase 4: Management Pages | 0 weeks | **2-3 weeks** | NEW (Users, Projects, Reports) |
| Phase 5: Polish & Testing | 2 weeks | 2 weeks | Same |
| **TOTAL** | **6-7 weeks** | **11-13 weeks** | +5-6 weeks |

**🔴 CRITICAL**: Phase 0 must be completed before any rollout planning can begin.

---

## 4. Implementation Priority Matrix

### 4.1 Phase Breakdown (Revised)

#### **Phase 0: Authentication (Week 1)** - 🔴 **NEW - CRITICAL BLOCKER**

**Priority:** HIGHEST (Cannot launch without)
**Estimated Time:** 1 week (3-4 days development + 2-3 days testing)

**Pages to Build:**
- [ ] Login Page (`src/app/(auth)/login/page.tsx`)
  - [ ] Email/password form with validation
  - [ ] Remember me checkbox
  - [ ] Error handling (wrong credentials, disabled account)
  - [ ] Redirect to dashboard on success
  - [ ] Link to register and forgot password

- [ ] Registration Page (`src/app/(auth)/register/page.tsx`)
  - [ ] Full name, email, password, confirm password
  - [ ] Password strength indicator
  - [ ] Terms of service checkbox
  - [ ] Email verification notice after submit
  - [ ] Validation (unique email, password requirements)

- [ ] Email Verification Page (`src/app/(auth)/verify-email/page.tsx`)
  - [ ] Auto-verify on mount (read token from URL)
  - [ ] Success/Error states
  - [ ] Resend verification button
  - [ ] Redirect to login on success

- [ ] Password Reset Request (`src/app/(auth)/request-reset/page.tsx`)
  - [ ] Email input
  - [ ] Send reset link button
  - [ ] Success message
  - [ ] Back to login link

- [ ] Password Reset Page (`src/app/(auth)/reset-password/page.tsx`)
  - [ ] New password + confirm inputs
  - [ ] Password strength indicator
  - [ ] Token validation
  - [ ] Success redirect to login

**Technical Tasks:**
- [ ] Create `(auth)` route group (no dashboard layout)
- [ ] Session token storage in localStorage
- [ ] Auto-redirect middleware (logged in → dashboard, logged out → login)
- [ ] Error toast/alert component
- [ ] Password strength validator

**Testing:**
- [ ] All auth flows work end-to-end
- [ ] Token expiry handling
- [ ] Invalid token handling
- [ ] Error states display correctly

---

#### **Phase 1: Foundation (Week 2-3)** - ✅ MOSTLY COMPLETE

- [x] Layout (Navbar, Sidebar, Footer)
- [x] Routing setup
- [x] Theme system (dark mode)
- [ ] ~~Authentication pages~~ → MOVED TO PHASE 0
- [ ] Skeleton loading components

**Status:** ~80% Complete (Layout done, need skeletons)

---

#### **Phase 2: Core Task Management (Week 3-6)** - 🔴 EXPANDED

**Week 3:**
- [ ] Board View enhancements
  - [ ] Pin indicators
  - [ ] Skeleton states for closing tasks
  - [ ] Drag restrictions for closed tasks
- [ ] List View enhancements
  - [ ] Pin column
  - [ ] Pinned tasks sorting
- [ ] Calendar View
  - [ ] Dark mode colors
  - [ ] Pin indicators on events

**Week 4:**
- [ ] Create Task Modal (complete)
- [ ] Task Panel (basic structure)
- [ ] **Subtasks Section** 🆕
- [ ] **Checklists Section** 🆕

**Week 5:**
- [ ] **Comments Section with @Mentions** 🆕
- [ ] **Task History Tab** 🆕
- [ ] Close Task Dialog 🆕
- [ ] Reopen Task functionality 🆕

**Week 6:**
- [ ] Filter Bar (complete)
- [ ] Quick filters in header
- [ ] Pinned tasks handling
- [ ] UI Store for skeleton states

---

#### **Phase 3: Dashboard & Widgets (Week 7-9)** - 🔴 NEW CONTENT

**Week 7: Dashboard Base**
- [ ] Dashboard layout
- [ ] Quick Stats Cards
- [ ] Department filter
- [ ] Task filters (All/Today/Week)
- [ ] Hide closed toggle

**Week 8: Dashboard Widgets**
- [ ] Overdue Tasks Alert
- [ ] Mini Calendar with date indicators
- [ ] Pinned Tasks section (horizontal scroll)

**Week 9: Activity & Social**
- [ ] Recent Activities widget
- [ ] Recent Comments widget
- [ ] Load more pagination for feeds

---

#### **Phase 4: Management Pages (Week 10-12)** - 🔴 COMPLETELY NEW

**Week 10: User Management**
- [ ] User list page
- [ ] Search/filter/sort functionality
- [ ] Pagination controls
- [ ] Edit User dialog
- [ ] Disable/Delete confirmation
- [ ] Role assignment interface

**Week 11: Project Management**
- [ ] Project list page
- [ ] Filter by department/status
- [ ] Bulk operations (archive, delete)
- [ ] Edit Project dialog
- [ ] Project settings panel
- [ ] Status management (add/edit/delete/reorder)

**Week 12: Reports & Analytics**
- [ ] Reports page layout
- [ ] Summary cards
- [ ] Donut Chart (Tasks by Status)
- [ ] Bar Chart (Tasks by Assignee)
- [ ] Stacked Bar Chart (Workload)
- [ ] Date range filter
- [ ] Department filter
- [ ] Export functionality (CSV)

---

#### **Phase 5: Advanced Features (Week 13-14)** - 🟡 OPTIONAL

**Week 13:**
- [ ] Global Search
- [ ] Inline Editor
- [ ] Settings Page
- [ ] Profile Page
- [ ] Organization Management

**Week 14:**
- [ ] Specialized selectors (Hospital Mission, Action Plan, IT Goals)
- [ ] Difficulty selector
- [ ] User selector (multi)
- [ ] Empty states & illustrations
- [ ] Keyboard shortcuts guide

---

#### **Phase 6: Polish & Testing (Week 15-16)** - ✅ SAME AS BEFORE

**Week 15:**
- [ ] Accessibility improvements (ARIA, keyboard nav)
- [ ] Performance optimization
- [ ] Animation polish
- [ ] Responsive design testing
- [ ] Cross-browser testing

**Week 16:**
- [ ] Component unit tests
- [ ] Integration tests
- [ ] E2E tests (critical paths)
- [ ] Bug fixes
- [ ] Final UI/UX review

---

## 5. Design System Migration

### 5.1 Chart Library Selection

**Recommendation:** **Recharts** (React-native charting library)

**Why Recharts:**
- ✅ React components (not jQuery wrapper like Chart.js)
- ✅ TypeScript support
- ✅ Responsive by default
- ✅ Easy theming (dark mode)
- ✅ Smaller bundle size
- ✅ Better animation performance

**Installation:**
```bash
npm install recharts
```

**Alternative:** Chart.js + react-chartjs-2 (if team prefers)

---

### 5.2 Mention Library Selection

**Recommendation:** **@tiptap/react** with mention extension

**Why Tiptap:**
- ✅ Modern React editor
- ✅ Extensible with plugins
- ✅ Built-in mention support
- ✅ Markdown shortcuts
- ✅ Active development
- ✅ TypeScript first

**Installation:**
```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-mention
```

**Alternative:** `react-mentions` (simpler but less flexible)

---

### 5.3 Thai Locale Support

**Date Library:** Continue using `date-fns` with Thai locale

**Installation:**
```bash
npm install date-fns
```

**Usage:**
```typescript
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

format(new Date(), 'PPP', { locale: th });
// "21 ตุลาคม 2568" (Buddhist year)
```

**For Buddhist Calendar:**
```typescript
export function formatThaiDate(date: Date): string {
  const gregorianYear = date.getFullYear();
  const buddhistYear = gregorianYear + 543;

  return format(date, 'd MMMM', { locale: th }) + ` ${buddhistYear}`;
}
```

---

## 6. State Management Strategy

### 6.1 Updated Zustand Stores

#### **A. App Store** (Existing - keep as is)
```typescript
// src/stores/use-app-store.ts
- currentUser, sessionToken
- currentProject
- filterState
- listSortState
```

#### **B. UI Store** (NEW - needs enhancement)
```typescript
// src/stores/use-ui-store.ts

interface UIState {
  // Modals
  isCreateTaskModalOpen: boolean;
  isEditProjectModalOpen: boolean;
  isCloseTaskDialogOpen: boolean;

  // Panels
  taskPanelTaskId: string | null;

  // Skeleton states
  closingTasks: Set<string>;
  closingTypes: Map<string, 'completing' | 'aborting'>;
  creatingTask: boolean;

  // Search
  searchQuery: string;
  searchResults: Task[];

  // Actions
  openTaskPanel: (taskId: string) => void;
  closeTaskPanel: () => void;
  setTaskClosing: (taskId: string, type: 'completing' | 'aborting') => void;
  setTaskClosingComplete: (taskId: string) => void;
}
```

#### **C. Sync Store** (Existing - keep as is)
```typescript
// src/stores/use-sync-store.ts
- isSyncing
- triggerSync
- Animation control
```

#### **D. Dashboard Store** (NEW)
```typescript
// src/stores/use-dashboard-store.ts

interface DashboardState {
  selectedDepartment: string | null;
  taskFilter: 'all' | 'today' | 'week';
  showClosedTasks: boolean;
  selectedDate: Date | null; // From mini calendar

  setDepartment: (id: string | null) => void;
  setTaskFilter: (filter: 'all' | 'today' | 'week') => void;
  toggleShowClosed: () => void;
  setSelectedDate: (date: Date | null) => void;
}
```

---

### 6.2 React Query Hooks (Updated)

#### **New Hooks Required:**

```typescript
// src/hooks/use-users.ts
export function useUsers(filters?: UserFilters) { ... }
export function useUser(userId: string) { ... }
export function useUpdateUser() { ... }
export function useDeleteUser() { ... }

// src/hooks/use-projects.ts (enhance existing)
export function useProjects(filters?: ProjectFilters) { ... }
export function useArchiveProject() { ... }
export function useProjectStatuses(projectId: string) { ... }

// src/hooks/use-dashboard.ts (NEW)
export function useDashboardStats(departmentId?: string) { ... }
export function useOverdueTasks() { ... }
export function useRecentActivities(limit: number) { ... }
export function useRecentComments(limit: number) { ... }
export function usePinnedTasks() { ... }

// src/hooks/use-reports.ts (NEW)
export function useTasksByStatus(filters: ReportFilters) { ... }
export function useTasksByAssignee(filters: ReportFilters) { ... }
export function useWorkloadByStatus(filters: ReportFilters) { ... }

// src/hooks/use-comments.ts (NEW)
export function useComments(taskId: string) { ... }
export function useCreateComment() { ... }
export function useDeleteComment() { ... }

// src/hooks/use-checklists.ts (enhance existing)
export function useChecklists(taskId: string) { ... }
export function useToggleChecklistItem() { ... }

// src/hooks/use-subtasks.ts (NEW)
export function useSubtasks(taskId: string) { ... }
```

---

## 7. Component Migration Examples

### 7.1 User Management Page (NEW)

```tsx
// src/app/(dashboard)/admin/users/page.tsx

'use client';

import { useState } from 'react';
import { useUsers, useDeleteUser } from '@/hooks/use-users';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { EditUserDialog } from '@/components/modals/edit-user-dialog';
import { ConfirmDialog } from '@/components/modals/confirm-dialog';
import { Pencil, Trash2, UserX } from 'lucide-react';

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  const { data, isLoading } = useUsers({
    search: searchQuery,
    status: statusFilter === 'all' ? undefined : statusFilter,
    role: roleFilter === 'all' ? undefined : roleFilter,
    sortBy,
    sortDirection,
    page,
    perPage,
  });

  const deleteUserMutation = useDeleteUser();

  const columns = [
    {
      accessorKey: 'fullName',
      header: 'ชื่อ-นามสกุล',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Avatar>
            <AvatarImage src={row.original.profileImageUrl} />
            <AvatarFallback>{row.original.fullName[0]}</AvatarFallback>
          </Avatar>
          <span>{row.original.fullName}</span>
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'อีเมล',
    },
    {
      accessorKey: 'role',
      header: 'บทบาท',
      cell: ({ row }) => <Badge>{row.original.role}</Badge>,
    },
    {
      accessorKey: 'department',
      header: 'แผนก',
      cell: ({ row }) => row.original.department?.name,
    },
    {
      accessorKey: 'isActive',
      header: 'สถานะ',
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? 'success' : 'secondary'}>
          {row.original.isActive ? 'ใช้งาน' : 'ระงับ'}
        </Badge>
      ),
    },
    {
      accessorKey: 'lastActive',
      header: 'ใช้งานล่าสุด',
      cell: ({ row }) => formatDistanceToNow(new Date(row.original.lastActive)),
    },
    {
      id: 'actions',
      header: 'จัดการ',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleEdit(row.original)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDisable(row.original)}
          >
            <UserX className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDelete(row.original)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">จัดการผู้ใช้งาน</h1>
        <Button>เพิ่มผู้ใช้ใหม่</Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Input
          placeholder="ค้นหาชื่อหรืออีเมล..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="สถานะ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทั้งหมด</SelectItem>
            <SelectItem value="active">ใช้งาน</SelectItem>
            <SelectItem value="suspended">ระงับ</SelectItem>
          </SelectContent>
        </Select>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="บทบาท" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทั้งหมด</SelectItem>
            <SelectItem value="ADMIN">ADMIN</SelectItem>
            <SelectItem value="CHIEF">CHIEF</SelectItem>
            <SelectItem value="LEADER">LEADER</SelectItem>
            <SelectItem value="HEAD">HEAD</SelectItem>
            <SelectItem value="MEMBER">MEMBER</SelectItem>
            <SelectItem value="USER">USER</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={data?.users || []}
        loading={isLoading}
      />

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          แสดง {(page - 1) * perPage + 1} - {Math.min(page * perPage, data?.total || 0)} จาก {data?.total || 0} รายการ
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            ก่อนหน้า
          </Button>
          <Button
            variant="outline"
            disabled={page * perPage >= (data?.total || 0)}
            onClick={() => setPage(page + 1)}
          >
            ถัดไป
          </Button>
        </div>
      </div>
    </div>
  );
}
```

---

### 7.2 Reports Dashboard (NEW)

```tsx
// src/app/(dashboard)/reports/page.tsx

'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { DateRangePicker } from '@/components/common/date-range-picker';
import { Select } from '@/components/ui/select';
import { DonutChart } from '@/components/charts/donut-chart';
import { BarChart } from '@/components/charts/bar-chart';
import { StackedBarChart } from '@/components/charts/stacked-bar-chart';
import { useTasksByStatus, useTasksByAssignee, useWorkloadByStatus } from '@/hooks/use-reports';
import { FileDown, Filter } from 'lucide-react';

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });
  const [departmentId, setDepartmentId] = useState<string | null>(null);

  const { data: statusData } = useTasksByStatus({ dateRange, departmentId });
  const { data: assigneeData } = useTasksByAssignee({ dateRange, departmentId });
  const { data: workloadData } = useWorkloadByStatus({ dateRange, departmentId });

  const handleExport = () => {
    // Export to CSV logic
    console.log('Exporting...');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">รายงานและสถิติ</h1>
        <div className="flex gap-2">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <Select
            value={departmentId || 'all'}
            onValueChange={(value) => setDepartmentId(value === 'all' ? null : value)}
          >
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="แผนก" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกแผนก</SelectItem>
              {/* Map departments */}
            </SelectContent>
          </Select>
          <Button onClick={handleExport}>
            <FileDown className="h-4 w-4 mr-2" />
            ส่งออก CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{statusData?.unassigned || 0}</div>
            <p className="text-sm text-muted-foreground">งานที่ยังไม่ได้มอบหมาย</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{statusData?.inProgress || 0}</div>
            <p className="text-sm text-muted-foreground">งานที่กำลังดำเนินการ</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{statusData?.completed || 0}</div>
            <p className="text-sm text-muted-foreground">งานที่เสร็จสิ้น</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>งานแยกตามสถานะ</CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart data={statusData?.chartData || []} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>งานที่เปิดอยู่ แยกตามผู้รับผิดชอบ</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart data={assigneeData || []} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ปริมาณงานแยกตามสถานะต่อบุคคล</CardTitle>
        </CardHeader>
        <CardContent>
          <StackedBarChart data={workloadData || []} />
        </CardContent>
      </Card>
    </div>
  );
}
```

---

### 7.3 Comments Section with @Mentions (NEW)

```tsx
// src/components/panels/task-panel/comments-section.tsx

'use client';

import { useState } from 'react';
import { useComments, useCreateComment } from '@/hooks/use-comments';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Mention, MentionsInput } from 'react-mentions';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';
import { Send, Loader2 } from 'lucide-react';

interface CommentsSectionProps {
  taskId: string;
}

export function CommentsSection({ taskId }: CommentsSectionProps) {
  const [commentText, setCommentText] = useState('');
  const { data: comments, isLoading } = useComments(taskId);
  const createCommentMutation = useCreateComment();

  const handleSubmit = async () => {
    if (!commentText.trim()) return;

    try {
      await createCommentMutation.mutateAsync({
        taskId,
        text: commentText,
      });
      setCommentText('');
    } catch (error) {
      console.error('Failed to create comment:', error);
    }
  };

  // Parse mentions from text (e.g., "@[John Doe](user123)")
  const renderCommentText = (text: string) => {
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;

    return text.replace(mentionRegex, (match, name, userId) => {
      return `<span class="text-primary font-medium">@${name}</span>`;
    });
  };

  return (
    <div className="space-y-4">
      {/* Comment Input */}
      <div className="flex gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={currentUser?.profileImageUrl} />
          <AvatarFallback>{currentUser?.fullName[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <MentionsInput
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="เขียนความคิดเห็น... (พิมพ์ @ เพื่อแท็กคน)"
            className="mentions-input"
          >
            <Mention
              trigger="@"
              data={async (query) => {
                // Fetch users matching query
                const users = await fetchUsers(query);
                return users.map((u) => ({
                  id: u.id,
                  display: u.fullName,
                }));
              }}
              renderSuggestion={(suggestion) => (
                <div className="flex items-center gap-2 p-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={suggestion.profileImageUrl} />
                    <AvatarFallback>{suggestion.display[0]}</AvatarFallback>
                  </Avatar>
                  <span>{suggestion.display}</span>
                </div>
              )}
              markup="@[__display__](__id__)"
            />
          </MentionsInput>
          <div className="flex justify-end mt-2">
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!commentText.trim() || createCommentMutation.isPending}
            >
              {createCommentMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="h-4 w-4 mr-1" />
                  ส่ง
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {isLoading ? (
          <div>กำลังโหลด...</div>
        ) : comments?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            ยังไม่มีความคิดเห็น
          </div>
        ) : (
          comments?.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={comment.user.profileImageUrl} />
                <AvatarFallback>{comment.user.fullName[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">
                      {comment.user.fullName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.dateCreated), {
                        locale: th,
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <div
                    className="text-sm"
                    dangerouslySetInnerHTML={{
                      __html: renderCommentText(comment.text),
                    }}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load More */}
      {comments && comments.length >= 10 && (
        <Button variant="outline" className="w-full">
          โหลดความคิดเห็นเพิ่มเติม
        </Button>
      )}
    </div>
  );
}
```

**CSS for Mentions:**
```css
/* src/styles/mentions.css */

.mentions-input {
  @apply w-full;
}

.mentions-input__control {
  @apply min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm;
}

.mentions-input__highlighter {
  @apply p-2;
}

.mentions-input__input {
  @apply p-2 outline-none;
}

.mentions-input__suggestions {
  @apply absolute z-50 mt-1 max-h-60 overflow-auto rounded-md border bg-popover shadow-lg;
}

.mentions-input__suggestions__list {
  @apply p-1;
}

.mentions-input__suggestions__item {
  @apply cursor-pointer rounded px-2 py-1.5 hover:bg-accent;
}

.mentions-input__suggestions__item--focused {
  @apply bg-accent;
}
```

---

### 7.4 Mini Calendar Widget (NEW)

```tsx
// src/components/dashboard/mini-calendar.tsx

'use client';

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTasks } from '@/hooks/use-tasks';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, isBefore, startOfDay } from 'date-fns';
import { th } from 'date-fns/locale';

interface MiniCalendarProps {
  onDateSelect?: (date: Date) => void;
}

export function MiniCalendar({ onDateSelect }: MiniCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const { data: tasks } = useTasks();

  // Group tasks by date
  const tasksByDate = useMemo(() => {
    const map = new Map<string, { total: number; overdue: number; dueToday: number }>();

    tasks?.forEach((task) => {
      if (!task.dueDate || task.isClosed) return;

      const dateKey = format(new Date(task.dueDate), 'yyyy-MM-dd');
      const existing = map.get(dateKey) || { total: 0, overdue: 0, dueToday: 0 };

      existing.total += 1;

      const dueDate = startOfDay(new Date(task.dueDate));
      const today = startOfDay(new Date());

      if (isBefore(dueDate, today)) {
        existing.overdue += 1;
      } else if (isSameDay(dueDate, today)) {
        existing.dueToday += 1;
      }

      map.set(dateKey, existing);
    });

    return map;
  }, [tasks]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get first day of week for padding
  const startDayOfWeek = monthStart.getDay(); // 0 = Sunday

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    onDateSelect?.(date);
  };

  const getDayIndicator = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const data = tasksByDate.get(dateKey);

    if (!data) return null;

    if (data.overdue > 0) return 'overdue';
    if (data.dueToday > 0) return 'due-today';
    return 'has-tasks';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            {format(currentMonth, 'MMMM yyyy', { locale: th })}
          </CardTitle>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for padding */}
          {Array.from({ length: startDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {/* Actual days */}
          {daysInMonth.map((date) => {
            const indicator = getDayIndicator(date);
            const isSelected = selectedDate && isSameDay(date, selectedDate);
            const isTodayDate = isToday(date);

            return (
              <button
                key={date.toISOString()}
                onClick={() => handleDateClick(date)}
                className={cn(
                  'relative aspect-square rounded-md text-sm transition-colors',
                  'hover:bg-accent',
                  isTodayDate && 'font-bold border-2 border-primary',
                  isSelected && 'bg-primary text-primary-foreground',
                  !isSameMonth(date, currentMonth) && 'text-muted-foreground'
                )}
              >
                {format(date, 'd')}

                {/* Task Indicator Dot */}
                {indicator && (
                  <div
                    className={cn(
                      'absolute bottom-1 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full',
                      indicator === 'overdue' && 'bg-red-500',
                      indicator === 'due-today' && 'bg-orange-500',
                      indicator === 'has-tasks' && 'bg-blue-500'
                    )}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <span>เกินกำหนด</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-orange-500" />
            <span>ครบวันนี้</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-blue-500" />
            <span>มีงาน</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## 8. Timeline & Resource Estimation

### 8.1 Revised Timeline (10-12 weeks)

```
Week 1-2:   Foundation (Layout, Auth, Routing)
Week 3-6:   Core Task Management (Views + Task Panel with all sections)
Week 7-9:   Dashboard & Widgets (8 new widgets)
Week 10-12: Management Pages (Users, Projects, Reports)
Week 13-14: Advanced Features (Search, Settings, etc.) - OPTIONAL
Week 15-16: Polish & Testing
```

### 8.2 Team Resource Requirements

**Recommended Team:**
- 2 Frontend Developers (full-time)
- 1 UI/UX Designer (part-time - design system, widgets)
- 1 QA Engineer (week 15-16)

**Alternative (Solo):**
- 1 Full-stack Developer = 12-14 weeks

### 8.3 Dependency Installation

```bash
# Charts
npm install recharts

# Mentions
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-mention

# Date handling
npm install date-fns

# Already installed
# @tanstack/react-query
# zustand
# @hello-pangea/dnd
# shadcn/ui components
```

---

## 9. Risk Assessment & Mitigation

### 9.1 High-Risk Areas

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Scope creep** | HIGH | HIGH | Lock features after Phase 4, defer to v2.0 |
| **Chart performance** | MEDIUM | MEDIUM | Use Recharts (optimized), implement virtualization |
| **@Mention complexity** | HIGH | MEDIUM | Use proven library (Tiptap), allocate 3 days |
| **Timeline overrun** | HIGH | MEDIUM | Buffer 2 weeks, prioritize CRITICAL features |
| **Thai locale bugs** | LOW | MEDIUM | Thorough testing, use date-fns/locale/th |

### 9.2 Contingency Plans

**If timeline slips:**
1. Defer Phase 5 (Advanced Features) to v2.1
2. Simplify Reports (only 2 charts instead of 3)
3. Use basic comments (no mentions) initially

**If resources limited:**
1. Focus on CRITICAL priority items only
2. Use AI assistance for boilerplate code
3. Reuse more shadcn/ui examples

---

## 10. Summary & Action Items

### 10.1 Key Findings

1. ❌ **Original plan only covered 32% of GAS functionality**
2. ❌ **Missing 34 critical components**
3. ❌ **No management pages (Users, Projects, Reports)**
4. ❌ **No dashboard widgets (8 widgets missing)**
5. ❌ **Incomplete Task Panel (missing 4 sections)**

### 10.2 Required Actions

#### **IMMEDIATE (This Week)**
- [ ] Review and approve updated plan
- [ ] Install additional dependencies (Recharts, Tiptap, react-mentions)
- [ ] Update project timeline (add 4-5 weeks)
- [ ] Assign resources for extended timeline

#### **PHASE 1 (Week 1-2) - No changes**
- [x] Continue with existing layout work

#### **PHASE 2 (Week 3-6) - ADD**
- [ ] Subtasks Section
- [ ] Checklists Section (already planned ✅)
- [ ] Comments Section with @Mentions
- [ ] Task History Tab
- [ ] Close Task Dialog

#### **PHASE 3 (Week 7-9) - NEW**
- [ ] Quick Stats Cards
- [ ] Overdue Tasks Alert
- [ ] Mini Calendar
- [ ] Recent Activities Widget
- [ ] Recent Comments Widget
- [ ] Pinned Tasks Section
- [ ] Task Filters (All/Today/Week)
- [ ] Department Filter

#### **PHASE 4 (Week 10-12) - NEW**
- [ ] User Management Page
- [ ] Project Management Page
- [ ] Reports Dashboard
- [ ] Chart components (Donut, Bar, Stacked Bar)

#### **PHASE 5 (Week 13-14) - OPTIONAL**
- [ ] Global Search
- [ ] Inline Editor
- [ ] Settings Page
- [ ] Profile Page

### 10.3 Success Metrics

**Phase 4 Complete = Feature Parity with GAS**

- [ ] All 10 views/pages implemented
- [ ] All 8 dashboard widgets functional
- [ ] All 3 management pages working
- [ ] Task Panel has 6 sections (Details, Subtasks, Checklists, Comments, History, Attachments*)
- [ ] Reports with 3 charts rendering
- [ ] User/Project CRUD operations working

**Attachments is optional (nice to have)

---

## 11. Conclusion

The original frontend migration plan significantly underestimated the scope of the GAS application. This updated plan provides a **comprehensive roadmap** to achieve **full feature parity** with the existing system.

**Key Changes:**
- Component count: 26 → 72 (+177%)
- Timeline: 6-7 weeks → 10-12 weeks (+4-5 weeks)
- New phases: Management Pages, Dashboard Widgets
- Enhanced components: Task Panel, Dashboard

**Recommendation:**
Approve this updated plan and allocate additional resources/time to ensure successful migration without feature loss.

---

**Document Status:** ✅ COMPLETE (Updated 2025-10-21)
**Next Steps:** Review → Approve → Begin Phase 2 Week 3
**Contact:** Development Team

---

**END OF DOCUMENT**
