# ProjectFlow - Revised Development Roadmap

**Version:** 2.0 (Updated after Authentication Discovery)
**Date:** 2025-10-22
**Status:** 🔴 Phase 0 Required (Authentication Blocker)
**Estimated Timeline:** 11-13 weeks from now

---

## 📊 Current Status Overview

| Metric | Value |
|--------|-------|
| **Backend Progress** | ✅ 100% Complete (71 API endpoints) |
| **Frontend Progress** | 🔄 ~30-35% Complete |
| **Overall Progress** | 🔄 ~65% Complete |
| **Estimated Completion** | 2026-01-15 (13 weeks from 2025-10-22) |

### ✅ What's Complete (7 components)
1. Layout System (Navbar, Sidebar, Footer)
2. Theme System (Light/Dark mode)
3. Board View (Kanban with drag-and-drop)
4. Calendar View (FullCalendar with Thai locale)
5. List View (Table with sorting, filtering, bulk actions)
6. Task Panel v1.0 (3 tabs, 11 optimistic mutations)
7. Dashboard Page (layout only, mock data)

### ❌ What's Missing (48+ components)
- **5 Authentication Pages** (CRITICAL BLOCKER)
- 8 Dashboard Widgets
- 3 Management Pages
- 7 Modals
- Task Panel sections (Comments, Subtasks, Checklists)
- And 25+ more components

---

## 🗺️ Development Roadmap

### **Phase 0: Authentication System** 🔴 CRITICAL
**Duration:** 1 week (5 days)
**Status:** ❌ Not Started
**Priority:** HIGHEST - **MUST DO FIRST**
**Blocker:** Cannot deploy or rollout without this

#### Week 1 Breakdown

**Day 1-2: Core Authentication Pages**
- [ ] **Login Page** (`src/app/(auth)/login/page.tsx`)
  - Email/password form with validation
  - "Remember me" checkbox
  - Error handling (invalid credentials, account disabled)
  - Redirect to dashboard on success
  - Links to register and forgot password

- [ ] **Registration Page** (`src/app/(auth)/register/page.tsx`)
  - Full name, email, password, confirm password inputs
  - Password strength indicator
  - Terms of service checkbox
  - Email verification notice after submit
  - Validation (unique email, password requirements)

**Day 3: Password Reset & Verification**
- [ ] **Email Verification Page** (`src/app/(auth)/verify-email/page.tsx`)
  - Auto-verify on mount (read token from URL)
  - Success/Error states
  - Resend verification button
  - Redirect to login on success

- [ ] **Password Reset Request** (`src/app/(auth)/request-reset/page.tsx`)
  - Email input
  - Send reset link button
  - Success message
  - Back to login link

- [ ] **Password Reset Page** (`src/app/(auth)/reset-password/page.tsx`)
  - New password + confirm inputs
  - Password strength indicator
  - Token validation
  - Success redirect to login

**Day 4: Integration & Session Management**
- [ ] Create `(auth)` route group (no dashboard layout)
- [ ] Implement session token storage in localStorage
- [ ] Create auto-redirect middleware
  - Logged out users → `/login`
  - Logged in users trying to access `/login` → `/dashboard`
- [ ] Install and configure Toast component (`npx shadcn@latest add toast`)
- [ ] Create password strength validator component
- [ ] Integrate with `src/lib/api-client.ts`

**Day 5: Testing & Polish**
- [ ] Test all authentication flows end-to-end
- [ ] Test error scenarios (invalid credentials, expired tokens, network errors)
- [ ] Test token expiry handling
- [ ] Test auto-redirect logic
- [ ] Dark mode support for all auth pages
- [ ] Responsive design testing
- [ ] Accessibility testing (keyboard navigation, screen readers)

#### Success Criteria
- ✅ All 5 auth pages built and styled
- ✅ All auth flows work end-to-end
- ✅ Session management functional
- ✅ Route protection working
- ✅ Error handling comprehensive
- ✅ Dark mode supported
- ✅ Responsive design
- ✅ All test cases passing

#### Dependencies
**npm packages (already installed):**
- `@tanstack/react-query`
- `zustand`
- `zod`
- `react-hook-form`
- `next-themes`

**shadcn/ui components to add:**
- Toast (`npx shadcn@latest add toast`)

#### API Endpoints (Already Exist ✅)
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/register`
- `POST /api/auth/verify-email`
- `POST /api/auth/send-verification`
- `POST /api/auth/request-reset`
- `POST /api/auth/reset-password`

---

### **Phase 1: Layout & Foundation** ✅ COMPLETE
**Duration:** 1-2 weeks
**Status:** ✅ Complete
**Completed:** 2025-10-21

#### Completed Items
- [x] Dashboard layout with sidebar navigation
- [x] Responsive navbar with notifications
- [x] Theme toggle (light/dark mode with next-themes)
- [x] Sidebar with workspace navigation
- [x] Sync animation footer
- [x] Route structure setup
- [x] Board View
- [x] Calendar View
- [x] List View

---

### **Phase 2: Core Task Management**
**Duration:** 4-5 weeks
**Status:** 🔄 In Progress (~40% complete)
**Estimated Start:** Week 2 (after Phase 0)
**Estimated End:** Week 6-7

#### Week 2-3: Task Creation & Modals

**Week 2:**
- [ ] **Create Task Modal** (`src/components/modals/create-task-modal.tsx`)
  - Modal form with validation (Zod)
  - Form fields: name, description, priority, assignee, dates, status
  - Default status selection
  - Quick task creation flow
  - Integration with Board, Calendar, and List views
  - Optimistic UI update

**Week 3:**
- [ ] **Close Task Dialog** (`src/components/modals/close-task-dialog.tsx`)
  - Select close type (Completed/Aborted)
  - Confirmation dialog
  - Reason input (optional)
  - Update task status optimistically

- [ ] **Delete Confirmation Modal** (`src/components/modals/delete-confirmation.tsx`)
  - Reusable delete confirm with custom messages
  - Warning for irreversible actions
  - Integration with all views

#### Week 4: Task Panel Enhancements

- [ ] **Subtasks Section** (`src/components/task-panel/subtasks-section.tsx`)
  - List subtasks with status checkboxes
  - Click subtask to open its panel
  - "Add subtask" button → Opens Create Task Modal with pre-filled parent
  - Display parent task link (if current task is subtask)
  - API: `GET /api/tasks/:id/subtasks` ✅ exists

- [ ] **Checklists Section** (`src/components/task-panel/checklist-section.tsx`)
  - Add/edit/delete checklist items
  - Toggle checkbox with optimistic UI
  - Inline editing
  - Progress bar (X/Y completed)
  - Real-time count display
  - API: Already implemented ✅

#### Week 5-6: Comments & Collaboration

- [ ] **Comments Section** (`src/components/task-panel/comments-section.tsx`)
  - Comment input with @mention autocomplete
  - Use `@tiptap/react` + `@tiptap/extension-mention` for mentions
  - Display comments with:
    - User avatar (colorful, from UserAvatar component)
    - User name (clickable to profile)
    - Timestamp (relative: "2 ชั่วโมงที่แล้ว" with date-fns/locale/th)
    - Mentioned users highlighted
  - Load more comments (pagination)
  - Real-time comment creation
  - API: `GET/POST/DELETE /api/tasks/:id/comments` ✅ exists

- [ ] **Install Dependencies:**
  ```bash
  npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-mention
  ```

#### Week 6-7: Polish & Additional Features

- [ ] **Filter Bar Enhancements**
  - Complete filter UI in toolbar
  - Quick filters in header
  - Save filter presets

- [ ] **Pinned Tasks Handling**
  - Pin indicators on all views
  - Pinned section in dashboard
  - Quick pin/unpin actions

- [ ] **UI Store Updates**
  - Skeleton states for closing tasks
  - Loading states for all mutations
  - Error handling UI

#### Success Criteria
- ✅ Can create tasks from any view
- ✅ Task panel has all 6 sections working
- ✅ Comments with @mentions functional
- ✅ Subtasks can be created and managed
- ✅ Checklists fully interactive
- ✅ All optimistic updates working smoothly

---

### **Phase 3: Dashboard & Widgets**
**Duration:** 2-3 weeks
**Status:** ❌ Not Started
**Estimated Start:** Week 7
**Estimated End:** Week 9-10

#### Week 7: Dashboard Base

- [ ] **Dashboard Layout** (`src/app/(dashboard)/dashboard/page.tsx`)
  - Connect to real API endpoints (remove mock data)
  - Department filter integration
  - Task filters (All/Today/Week) integration
  - Hide closed toggle functionality

- [ ] **Quick Stats Cards** (`src/components/dashboard/quick-stats.tsx`)
  - Total tasks card
  - Completed tasks card
  - Overdue tasks card
  - This week tasks card
  - Icons and color coding
  - Click to filter

#### Week 8: Primary Widgets

- [ ] **Overdue Tasks Alert** (`src/components/dashboard/overdue-alert.tsx`)
  - Red gradient background section
  - Icon + count: "มีงาน X รายการเกินกำหนด"
  - List top 5 overdue tasks
  - Action button per task
  - Auto-hide when no overdue tasks

- [ ] **Mini Calendar** (`src/components/dashboard/mini-calendar.tsx`)
  - Month view with prev/next navigation
  - Task indicators (dots):
    - Red dot: Overdue task
    - Orange dot: Due today
    - Blue dot: Due this week
  - Click date → Filter tasks by that date
  - Thai day abbreviations: อา, จ, อ, พ, พฤ, ศ, ส
  - Dark mode colors

- [ ] **Pinned Tasks Section** (`src/components/dashboard/pinned-tasks.tsx`)
  - Horizontal scrollable list of pinned task cards
  - Quick access to important tasks
  - Empty state: "ยังไม่มีงานที่ปักหมุด"
  - Drag to reorder (optional)

#### Week 9: Activity & Social Widgets

- [ ] **Recent Activities Widget** (`src/components/dashboard/recent-activities.tsx`)
  - List 10 recent activities
  - Avatar + Name + Action + Time ago
  - Examples:
    - "สมชาย ใจดี สร้างงาน 'XYZ'" - 5 นาทีที่แล้ว
    - "สมหญิง ดีมาก ทำงาน 'ABC' เสร็จสิ้น" - 1 ชั่วโมงที่แล้ว
  - Click activity → Open related task/project
  - Load more pagination

- [ ] **Recent Comments Widget** (`src/components/dashboard/recent-comments.tsx`)
  - List 5 recent comments
  - Avatar + Name + Comment preview (50 chars) + Task link
  - Click → Open task panel
  - Show @mentions highlighted

- [ ] **Task Filters** (`src/components/dashboard/task-filters.tsx`)
  - All/Today/Week buttons
  - Active state styling
  - Integration with task list

- [ ] **Department Filter** (`src/components/dashboard/department-filter.tsx`)
  - Dropdown selector
  - Filter entire dashboard by department
  - "All Departments" option

#### Success Criteria
- ✅ Dashboard shows real-time data
- ✅ All 8 widgets functional
- ✅ Widgets update based on filters
- ✅ Mini calendar interactive
- ✅ Activities and comments load correctly

---

### **Phase 4: Management Pages**
**Duration:** 2-3 weeks
**Status:** ❌ Not Started
**Estimated Start:** Week 10
**Estimated End:** Week 12-13

#### Week 10: User Management

- [ ] **User Management Page** (`src/app/(dashboard)/admin/users/page.tsx`)
  - DataTable with columns:
    - Avatar + Name
    - Email
    - Role (with badge)
    - Department
    - Status (Active/Suspended)
    - Last Active
    - Actions
  - Search by name/email (debounced 300ms)
  - Filter by:
    - Status (Active/Suspended/All)
    - Role (6 levels + All)
    - Department
  - Sort by: Name, Email, Role, Status, Last Active
  - Pagination (10/20/50 per page)
  - Actions: Edit, Disable, Delete (with confirmation)

- [ ] **Edit User Dialog** (`src/components/modals/edit-user-dialog.tsx`)
  - Update: Full name, Email, Role, Department, Status
  - Assign additional roles (if admin)
  - Validation with Zod
  - Profile image upload (optional)

- [ ] **API Integration:**
  - `GET /api/users` (with filters, pagination)
  - `GET /api/users/:id`
  - `PATCH /api/users/:id`
  - `DELETE /api/users/:id`
  - All endpoints ✅ exist

#### Week 11: Project Management

- [ ] **Project Management Page** (`src/app/(dashboard)/admin/projects/page.tsx`)
  - Project cards/table view toggle
  - Columns:
    - Project Name
    - Department
    - Status (Active/Archived)
    - Task count (Open/Total)
    - Last updated
    - Actions
  - Filter by:
    - Department
    - Status (Active/Archived/All)
  - Search by name
  - Bulk operations:
    - Archive selected
    - Delete selected (with confirmation)
  - Actions per project: Edit, Delete, View, Archive/Unarchive

- [ ] **Edit Project Modal** (`src/components/modals/edit-project-modal.tsx`)
  - Project name, description
  - Department assignment
  - Default status configuration
  - Color theme

- [ ] **Project Settings Panel** (`src/components/panels/project-settings-panel.tsx`)
  - Edit project details
  - Manage custom statuses:
    - Add new status
    - Edit status name/color
    - Delete status (with task count warning)
    - Reorder statuses (drag-and-drop)
  - Assign project lead
  - Archive/Unarchive project

#### Week 12-13: Reports & Analytics

- [ ] **Install Chart Library:**
  ```bash
  npm install recharts
  ```

- [ ] **Reports Dashboard** (`src/app/(dashboard)/reports/page.tsx`)
  - Summary cards:
    - Unassigned tasks
    - In Progress tasks
    - Completed tasks
  - Date range filter (with DateRangePicker)
  - Department filter
  - Export to CSV button

- [ ] **Donut Chart** (`src/components/charts/donut-chart.tsx`)
  - Tasks by Status
  - Color-coded by status
  - Interactive legend
  - Click to filter
  - Using Recharts library

- [ ] **Bar Chart** (`src/components/charts/bar-chart.tsx`)
  - Open Tasks by Assignee
  - Horizontal bars
  - Sorted by count (descending)
  - User avatars on Y-axis

- [ ] **Stacked Bar Chart** (`src/components/charts/stacked-bar-chart.tsx`)
  - Workload by Status per User
  - Color-coded segments (To Do, In Progress, Review, etc.)
  - Tooltip showing exact counts
  - Click to drill down

- [ ] **Export Functionality**
  - CSV export for all charts
  - Date range in filename
  - Department filter included

- [ ] **API Endpoints:**
  - `GET /api/reports/tasks-by-status`
  - `GET /api/reports/tasks-by-assignee`
  - `GET /api/reports/workload`
  - Need to create these endpoints (30 min each)

#### Success Criteria
- ✅ User management CRUD working
- ✅ Project management CRUD working
- ✅ All 3 charts rendering correctly
- ✅ Filters apply to charts
- ✅ CSV export functional
- ✅ Responsive on mobile

---

### **Phase 5: Advanced Features** (OPTIONAL)
**Duration:** 1-2 weeks
**Status:** ❌ Not Started
**Priority:** MEDIUM (Can defer to v2.1 if timeline slips)
**Estimated Start:** Week 13-14
**Estimated End:** Week 14-15

#### Week 13: Search & Editor

- [ ] **Global Search** (`src/components/layout/global-search.tsx`)
  - Search input in navbar header
  - Debounced search (300ms)
  - Dropdown results showing:
    - Task name
    - Project name
    - Assignee avatar
    - Due date
  - Keyboard navigation (arrow keys, Enter)
  - Click result → Open task panel
  - Search history (localStorage)
  - API: `GET /api/search?q=keyword` (need to create)

- [ ] **Inline Editor** (`src/components/common/inline-editor.tsx`)
  - Click text → Switch to input mode
  - Show Save/Cancel buttons
  - Keyboard shortcuts:
    - Enter → Save
    - Escape → Cancel
  - Auto-focus input
  - Validation before save
  - Use cases:
    - Task name editing in Task Panel
    - Project name editing
    - Description editing

- [ ] **Settings Page** (`src/app/(dashboard)/settings/page.tsx`)
  - User preferences:
    - Theme (Light/Dark/Auto)
    - Language (Thai/English) - future
    - Default view (Board/Calendar/List)
  - Notification settings:
    - Email notifications toggle
    - Push notifications toggle
    - Notification types checkboxes
  - Account settings:
    - Change password
    - Update profile
    - Delete account

- [ ] **Profile Page** (`src/app/(dashboard)/profile/page.tsx`)
  - Full profile view
  - User stats:
    - Tasks completed
    - Tasks assigned
    - Comments posted
  - Activity history
  - Edit profile button

#### Week 14: Specialized Selectors

- [ ] **Hospital Mission Selector** (`src/components/selectors/hospital-mission-selector.tsx`)
  - Multi-select missions
  - Checkboxes with search
  - API: `GET /api/organization/hospital-missions` ✅ exists

- [ ] **Action Plan Selector** (`src/components/selectors/action-plan-selector.tsx`)
  - Multi-select action plans
  - Filtered by selected mission

- [ ] **IT Goals Checklist** (`src/components/selectors/it-goals-checklist.tsx`)
  - IT goals with progress indicators
  - Checkboxes for selection

- [ ] **User Selector (Multi)** (`src/components/selectors/user-selector-multi.tsx`)
  - Multi-select users with search
  - Checkboxes
  - Avatar display
  - Department grouping

- [ ] **Difficulty Selector** (`src/components/selectors/difficulty-selector.tsx`)
  - 1-5 levels: Very Easy, Easy, Normal, Hard, Very Hard
  - Color dots for each level
  - Visual indicator

- [ ] **Empty States & Skeletons**
  - Empty state illustrations for:
    - No tasks
    - No projects
    - No notifications
    - No search results
  - Comprehensive loading skeletons for:
    - Board view
    - List view
    - Calendar view
    - Dashboard widgets

#### Success Criteria
- ✅ Global search working
- ✅ Inline editor in 3+ places
- ✅ Settings save and apply
- ✅ Profile page shows stats
- ✅ All selectors functional

---

### **Phase 6: Polish & Testing**
**Duration:** 2 weeks
**Status:** ❌ Not Started
**Estimated Start:** Week 15
**Estimated End:** Week 16-17

#### Week 15: Quality Assurance

- [ ] **Accessibility Improvements**
  - ARIA labels on all interactive elements
  - Keyboard navigation for all features
  - Focus indicators visible
  - Screen reader testing (NVDA/JAWS)
  - Color contrast compliance (WCAG AA)
  - Skip links for navigation

- [ ] **Performance Optimization**
  - Code splitting for large components
  - Lazy loading for heavy pages
  - Image optimization
  - Bundle size analysis
  - React.memo for expensive components
  - Virtualization for long lists

- [ ] **Animation Polish**
  - Smooth transitions (300ms standard)
  - Loading states for all async operations
  - Skeleton screens
  - Success/error animations
  - Micro-interactions (hover, click feedback)

- [ ] **Responsive Design Testing**
  - Mobile (320px - 768px)
  - Tablet (768px - 1024px)
  - Desktop (1024px+)
  - Touch-friendly targets (44px minimum)
  - Mobile navigation patterns

- [ ] **Cross-Browser Testing**
  - Chrome (latest)
  - Firefox (latest)
  - Safari (latest)
  - Edge (latest)
  - Mobile Safari (iOS)
  - Chrome Mobile (Android)

#### Week 16: Testing & Bug Fixes

- [ ] **Component Unit Tests**
  - Test critical components with Jest + React Testing Library
  - Target > 80% coverage for utilities
  - Focus on user interactions

- [ ] **Integration Tests**
  - Test API route handlers
  - Test authentication flows
  - Test data mutations

- [ ] **E2E Tests** (Playwright)
  - Critical user paths:
    - Login flow
    - Create task flow
    - Edit task flow
    - Board view drag-and-drop
    - Calendar view date change
    - List view filtering
  - Target: 10-15 E2E tests

- [ ] **Bug Fixes**
  - Fix all critical bugs (P0)
  - Fix all high priority bugs (P1)
  - Document known issues (P2/P3) for v2.1

- [ ] **Final UI/UX Review**
  - Consistency check (colors, spacing, typography)
  - Error message review (clear, helpful)
  - Loading states review
  - Empty states review
  - Success/error feedback review

#### Success Criteria
- ✅ Accessibility score > 90 (Lighthouse)
- ✅ Performance score > 85 (Lighthouse)
- ✅ All critical bugs fixed
- ✅ E2E tests passing
- ✅ Cross-browser compatibility confirmed

---

## 📅 Timeline Summary

| Phase | Duration | Start | End | Status |
|-------|----------|-------|-----|--------|
| **Phase 0: Authentication** | 1 week | Week 1 | Week 1 | ❌ Pending |
| **Phase 1: Layout** | - | - | - | ✅ Complete |
| **Phase 2: Task Management** | 4-5 weeks | Week 2 | Week 6-7 | 🔄 40% |
| **Phase 3: Dashboard & Widgets** | 2-3 weeks | Week 7 | Week 9-10 | ❌ Pending |
| **Phase 4: Management Pages** | 2-3 weeks | Week 10 | Week 12-13 | ❌ Pending |
| **Phase 5: Advanced Features** | 1-2 weeks | Week 13-14 | Week 14-15 | ❌ Optional |
| **Phase 6: Polish & Testing** | 2 weeks | Week 15 | Week 16-17 | ❌ Pending |
| **TOTAL** | **11-13 weeks** | 2025-10-22 | **2026-01-15** | 🔄 In Progress |

**Note:** Phase 5 is optional and can be deferred to v2.1 if timeline pressure occurs.

---

## 🎯 Success Milestones

### Milestone 1: Authentication Complete (Week 1)
- ✅ Users can log in and register
- ✅ Password reset flow works
- ✅ Email verification works
- ✅ Session management functional
- **Unlocks:** Beta testing possibility

### Milestone 2: Core Features Complete (Week 7)
- ✅ Task CRUD fully functional
- ✅ Comments with @mentions working
- ✅ Subtasks and checklists working
- ✅ All views (Board, Calendar, List) complete
- **Unlocks:** Internal pilot program

### Milestone 3: Dashboard Complete (Week 10)
- ✅ All 8 widgets functional
- ✅ Real-time data display
- ✅ User dashboard experience complete
- **Unlocks:** Soft launch to 50-100 users

### Milestone 4: Management Complete (Week 13)
- ✅ User management functional
- ✅ Project management functional
- ✅ Reports dashboard with charts
- **Unlocks:** Admin features available

### Milestone 5: Production Ready (Week 17)
- ✅ All tests passing
- ✅ Performance optimized
- ✅ Accessibility compliant
- ✅ Cross-browser tested
- **Unlocks:** Full production launch

---

## 🚨 Critical Blockers

### 🔴 PHASE 0 BLOCKER: Authentication Pages
**Impact:** Cannot deploy, cannot rollout, cannot test with real users
**Status:** Not started
**Required:** MUST complete before any deployment
**Timeline:** 1 week

### ⚠️ Email Service Configuration
**Current:** Emails console.log instead of sending
**Impact:** Email verification, password reset won't work in production
**Required Before:** Production deployment
**Estimated Effort:** 2-4 hours
**Solutions:** SendGrid, AWS SES, Mailgun

---

## 📦 Dependencies to Install

### Phase 0 (Week 1)
```bash
npx shadcn@latest add toast
```

### Phase 2 (Week 5)
```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-mention
```

### Phase 4 (Week 12)
```bash
npm install recharts
```

### Phase 6 (Week 16)
```bash
npm install -D @playwright/test
npx playwright install
```

---

## 🎓 Technical Patterns to Follow

### 1. Optimistic Updates (Standard Pattern)
**Reference:** `OPTIMISTIC_UPDATE_PATTERN.md` (600+ lines)

Use `useSyncMutation` for all interactive updates:
```typescript
import { useSyncMutation } from '@/lib/use-sync-mutation';

const mutation = useSyncMutation({
  mutationFn: ({ id, data }) => api.patch(`/api/resource/${id}`, data),
  onMutate: async ({ id, data }) => {
    // Cancel outgoing queries
    await queryClient.cancelQueries({ queryKey: keys.detail(id) });

    // Save previous state
    const previousData = queryClient.getQueryData(keys.detail(id));

    // Update cache immediately
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
      queryClient.invalidateQueries({ queryKey: keys.detail(response.resource.id) });
    }
  },
});
```

### 2. Query Key Organization
```typescript
export const resourceKeys = {
  all: ['resources'] as const,
  lists: () => [...resourceKeys.all, 'list'] as const,
  list: (filters: any) => [...resourceKeys.lists(), filters] as const,
  details: () => [...resourceKeys.all, 'detail'] as const,
  detail: (id: string) => [...resourceKeys.details(), id] as const,
};
```

### 3. API Client Usage
```typescript
import { api } from '@/lib/api-client';

// Automatically handles:
// - Bearer token from localStorage
// - JSON parsing
// - Extracting .data field
const data = await api.get<{ resource: Resource }>('/api/resource');
```

### 4. Form Validation
Use Zod + React Hook Form:
```typescript
const schema = z.object({
  name: z.string().min(1, 'ชื่องานห้ามว่าง'),
  email: z.string().email('อีเมลไม่ถูกต้อง'),
});

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema),
});
```

### 5. Thai Locale Dates
```typescript
import { format, formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';

// Relative time
formatDistanceToNow(date, { addSuffix: true, locale: th });
// "5 นาทีที่แล้ว"

// Buddhist calendar
const buddhistYear = new Date().getFullYear() + 543;
format(date, 'd MMMM', { locale: th }) + ` ${buddhistYear}`;
// "22 ตุลาคม 2568"
```

---

## 📊 Progress Tracking

### Week 1 Checklist (Phase 0)
- [ ] Day 1: Login + Registration pages
- [ ] Day 2: Complete auth pages
- [ ] Day 3: Password reset flow
- [ ] Day 4: Session management & integration
- [ ] Day 5: Testing & polish

### Week 2-7 Checklist (Phase 2)
- [ ] Week 2: Create Task Modal
- [ ] Week 3: Close Task Dialog + Delete Confirmation
- [ ] Week 4: Subtasks + Checklists sections
- [ ] Week 5-6: Comments with @mentions
- [ ] Week 6-7: Polish & additional features

### Week 7-10 Checklist (Phase 3)
- [ ] Week 7: Dashboard base + Quick Stats
- [ ] Week 8: Overdue Alert + Mini Calendar + Pinned Tasks
- [ ] Week 9: Activities + Comments widgets

### Week 10-13 Checklist (Phase 4)
- [ ] Week 10: User Management
- [ ] Week 11: Project Management
- [ ] Week 12-13: Reports Dashboard with charts

### Week 15-17 Checklist (Phase 6)
- [ ] Week 15: Accessibility + Performance + Responsive
- [ ] Week 16: Testing + Bug fixes
- [ ] Week 17: Final review + Launch prep

---

## 🔄 Iteration Strategy

### If Timeline Slips
1. **Defer Phase 5** (Advanced Features) to v2.1
2. **Simplify Reports** (2 charts instead of 3)
3. **Basic Comments** (no @mentions initially)
4. **Skip Specialized Selectors** (use basic select instead)

### If Resources Limited
1. Focus on **CRITICAL priority only** (Phase 0-4)
2. Use **AI assistance** for boilerplate code
3. **Reuse shadcn/ui examples** extensively
4. **Simplify animations** (instant updates, no transitions)

### Priority Levels
- 🔴 **P0 (CRITICAL):** Must have for launch (Phase 0-4)
- 🟡 **P1 (HIGH):** Should have (Phase 5)
- 🟢 **P2 (MEDIUM):** Nice to have (defer to v2.1)
- ⚪ **P3 (LOW):** Future enhancement (v2.2+)

---

## 📞 Review Schedule

### Weekly Reviews (Every Friday)
- Review completed tasks
- Update progress percentages
- Identify blockers
- Adjust timeline if needed
- Update this roadmap document

### Phase Completion Reviews
- Demo completed features
- User acceptance testing
- Bug triage
- Go/No-Go decision for next phase

---

## 📚 References

### Documentation
- [PROJECT_STATUS.md](PROJECT_STATUS.md) - Overall project status
- [AUTHENTICATION_FRONTEND_MISSING.md](AUTHENTICATION_FRONTEND_MISSING.md) - Auth blocker details
- [OPTIMISTIC_UPDATE_PATTERN.md](OPTIMISTIC_UPDATE_PATTERN.md) - Standard UI update pattern
- [migration_plan/03_FRONTEND_MIGRATION_COMPLETE.md](migration_plan/03_FRONTEND_MIGRATION_COMPLETE.md) - Complete component inventory
- [migration_plan/05_ROLLOUT_PLAN.md](migration_plan/05_ROLLOUT_PLAN.md) - Deployment strategy

### Technical Guides
- [CLAUDE.md](CLAUDE.md) - Project overview and commands
- [TASK_PANEL_V1.0_COMPLETE.md](TASK_PANEL_V1.0_COMPLETE.md) - Task Panel implementation
- [SYNC_ANIMATION_SYSTEM.md](SYNC_ANIMATION_SYSTEM.md) - Sync footer system

---

## ✅ Definition of Done

### Feature Complete When:
- ✅ Code written and reviewed
- ✅ Dark mode supported
- ✅ Responsive design (mobile + desktop)
- ✅ Loading states implemented
- ✅ Error handling implemented
- ✅ Optimistic updates working
- ✅ Thai language UI
- ✅ Accessibility compliant
- ✅ Manual testing passed

### Phase Complete When:
- ✅ All features in phase marked done
- ✅ No critical bugs (P0)
- ✅ Performance acceptable
- ✅ Documentation updated
- ✅ Demo completed successfully

### Project Complete When:
- ✅ All phases 0-4 complete (or 0-5 if time permits)
- ✅ Phase 6 testing complete
- ✅ All P0 and P1 bugs fixed
- ✅ Email service configured
- ✅ Production deployment successful
- ✅ User acceptance testing passed

---

**Document Status:** ✅ COMPLETE
**Last Updated:** 2025-10-22
**Next Review:** End of Week 1 (after Phase 0 complete)
**Owner:** Development Team
**Estimated Completion:** 2026-01-15 (13 weeks from 2025-10-22)

---

**END OF ROADMAP**
