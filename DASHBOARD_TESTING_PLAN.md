# Dashboard Testing Plan

**Document Version**: 1.0
**Created**: 2025-10-26
**Status**: Ready for Testing
**Components**: 7 widgets + 4 stat cards

---

## Overview

This document outlines the comprehensive testing plan for the User Dashboard implementation. All 7 widgets have been implemented and UI/UX refinements are complete. This testing phase will validate functionality, data accuracy, performance, and user experience.

---

## Testing Environment

### Prerequisites

```bash
# 1. Ensure dev server is running
PORT=3010 npm run dev

# 2. Database must be seeded with test data
npx prisma db execute --file ./prisma/seed.sql --schema ./prisma/schema.prisma

# 3. Test user credentials
Email: admin@hospital.test
Password: SecurePass123!

# 4. Alternative test users
Email: user001@hospital.test (LEADER role)
Email: user002@hospital.test (MEMBER role)
```

### Test Data Requirements

- At least 20 tasks with various states (NOT_STARTED, IN_PROGRESS, DONE, closed)
- At least 5 overdue tasks (dueDate in the past)
- At least 3 pinned tasks
- At least 10 checklist items across multiple tasks
- Tasks with due dates spanning current month
- Recent activity history (last 7 days)

---

## Test Cases

### 1. Stats Cards (4 cards)

#### TC-STATS-001: Total Tasks Count

**Priority**: High
**Steps**:

1. Login as admin user
2. Navigate to dashboard
3. Observe "งานทั้งหมด" card

**Expected**:

- Displays correct total count of all tasks assigned to user
- Excludes deleted tasks (deletedAt IS NULL)
- Number animates on load (CountUp effect)
- Updates when tasks are added/completed

**Data Validation**:

```sql
-- Manual count verification
SELECT COUNT(*) FROM tasks
WHERE deletedAt IS NULL
AND id IN (SELECT taskId FROM task_assignees WHERE userId = 'user_id');
```

#### TC-STATS-002: In Progress Tasks Count

**Priority**: High
**Steps**:

1. View "กำลังดำเนินการ" card
2. Check count matches tasks with IN_PROGRESS status

**Expected**:

- Correct count of IN_PROGRESS tasks
- Green icon displayed
- Updates when task status changes

#### TC-STATS-003: Overdue Tasks Count

**Priority**: High
**Steps**:

1. View "เกินกำหนด" card
2. Verify count matches tasks with dueDate < today AND NOT closed

**Expected**:

- Correct count of overdue tasks
- Red icon and red text color
- Excludes closed tasks
- Updates when tasks are completed or closed

#### TC-STATS-004: Completed Tasks Count

**Priority**: High
**Steps**:

1. View "เสร็จสิ้น" card
2. Check count matches closed tasks or DONE status

**Expected**:

- Correct count of completed tasks
- Includes both isClosed=true and status=DONE
- Updates when tasks are marked complete

#### TC-STATS-005: Permission-Based Visibility

**Priority**: Medium
**Steps**:

1. Login as different role users (ADMIN, LEADER, MEMBER)
2. Verify each user sees only their assigned tasks

**Expected**:

- Each role sees appropriate data scope
- No permission errors in console
- Counts reflect user's assigned tasks only

---

### 2. Overdue Tasks Alert Widget

#### TC-OVERDUE-001: Display Overdue Tasks

**Priority**: High
**Steps**:

1. Ensure there are tasks with dueDate in the past
2. View overdue tasks widget

**Expected**:

- Shows up to 5 most overdue tasks
- Tasks sorted by dueDate (oldest first)
- Red theme applied (red-50/red-900 background)
- Each task shows: name, project, due date, assignee avatars

#### TC-OVERDUE-002: Assignee Avatars Display

**Priority**: Medium
**Steps**:

1. View tasks with multiple assignees
2. Check avatar display

**Expected**:

- Avatars displayed at top-right of each card
- Maximum 3 avatars shown with overlap style (-space-x-2)
- "+N" indicator if more than 3 assignees
- Avatars have border-2 border-background
- Initials shown in fallback avatar

#### TC-OVERDUE-003: Task Badge Count

**Priority**: Low
**Steps**:

1. Count overdue tasks manually
2. Check badge displays correct count

**Expected**:

- Badge shows total overdue task count
- Badge positioned at top-right of widget header
- Updates dynamically

#### TC-OVERDUE-004: Empty State

**Priority**: Medium
**Steps**:

1. Complete or close all overdue tasks
2. View widget

**Expected**:

- Widget not displayed (conditional rendering)
- No errors in console
- Other widgets unaffected

#### TC-OVERDUE-005: Task Click Navigation

**Priority**: High
**Steps**:

1. Click on an overdue task card
2. Verify task panel opens

**Expected**:

- Task detail panel slides in from right
- Correct task data displayed
- Can close panel and return to dashboard

#### TC-OVERDUE-006: Padding and Layout

**Priority**: Low
**Steps**:

1. Inspect task card spacing

**Expected**:

- Task cards have py-4 pl-8 pr-4 padding
- Consistent padding with other task list widgets
- Text properly aligned

---

### 3. Pinned Tasks Widget

#### TC-PINNED-001: Display Pinned Tasks

**Priority**: High
**Steps**:

1. Pin at least 3 tasks using task panel
2. View pinned tasks widget

**Expected**:

- All pinned tasks displayed
- Amber theme applied (amber-200/800 border, amber-50/900 header)
- Pin icon displayed with amber-500 color
- Tasks sorted by pin date (newest first)

#### TC-PINNED-002: Amber Color Scheme

**Priority**: Medium
**Steps**:

1. View pinned tasks widget
2. Compare with department tasks view pinned section

**Expected**:

- Border: border-amber-200 dark:border-amber-800
- Header background: bg-amber-50 dark:bg-amber-900/10
- Badge: bg-amber-100 text-amber-700 (light mode)
- Badge: bg-amber-900/30 text-amber-400 (dark mode)
- Pin icon: text-amber-500 fill-amber-500
- Consistent with department tasks view styling

#### TC-PINNED-003: Assignee Avatars

**Priority**: Medium
**Steps**:

1. Check tasks with multiple assignees
2. Verify avatar display

**Expected**:

- Avatars at top-right with overlap style
- Maximum 3 avatars + "+N" indicator
- Same styling as overdue tasks

#### TC-PINNED-004: Expand/Collapse

**Priority**: Medium
**Steps**:

1. View widget with more than 5 pinned tasks
2. Click "ดูเพิ่มเติม" button
3. Click "ซ่อน" button

**Expected**:

- Initially shows 5 tasks
- Expands to show all tasks
- Collapses back to 5 tasks
- Button text changes appropriately

#### TC-PINNED-005: Unpin Functionality

**Priority**: High
**Steps**:

1. Click on a pinned task
2. Unpin from task panel
3. Return to dashboard

**Expected**:

- Task removed from pinned widget
- Badge count decreases
- Widget hides if no pinned tasks remain

#### TC-PINNED-006: Empty State

**Priority**: Medium
**Steps**:

1. Unpin all tasks
2. View dashboard

**Expected**:

- Widget not displayed
- No errors in console

---

### 4. My Tasks Widget

#### TC-MYTASKS-001: Display All Tasks

**Priority**: High
**Steps**:

1. Select "ทั้งหมด" filter tab
2. Verify all assigned tasks displayed

**Expected**:

- All tasks where user is assignee
- Checkbox for each task
- Task name and metadata (project, due date)
- Badge shows total count

#### TC-MYTASKS-002: Filter Tabs Functionality

**Priority**: High
**Steps**:

1. Click each filter tab: ทั้งหมด, กำลังทำ, รอดำเนินการ, เสร็จแล้ว
2. Verify filtering works

**Expected**:

- ทั้งหมด: All tasks
- กำลังทำ: status.type = "IN_PROGRESS"
- รอดำเนินการ: status.type = "NOT_STARTED"
- เสร็จแล้ว: status.type = "DONE" OR isClosed = true
- Badge count updates with filter
- Active tab highlighted with "default" variant

#### TC-MYTASKS-003: Filter Tabs Position

**Priority**: Low
**Steps**:

1. Inspect header layout

**Expected**:

- Filter tabs positioned in header
- Layout: Title | [Switch] [Filter Tabs] [Badge]
- Tabs aligned to right side before badge

#### TC-MYTASKS-004: Hide Closed Tasks Switch

**Priority**: High
**Steps**:

1. View switch in header (before filter tabs)
2. Toggle switch on
3. Refresh page
4. Toggle switch off

**Expected**:

- Switch labeled "ซ่อนงานที่ปิดแล้ว"
- When ON: Filters out tasks where isClosed=true OR status=DONE
- State persists in localStorage (key: "dashboard.myTasks.hideClosedTasks")
- Works in combination with filter tabs
- State restored after page refresh or logout/login

#### TC-MYTASKS-005: localStorage Persistence

**Priority**: Medium
**Steps**:

1. Toggle hide closed tasks ON
2. Logout
3. Login again
4. Check switch state

**Expected**:

- Switch state restored from localStorage
- Tasks filtered according to saved state
- Works across different sessions

#### TC-MYTASKS-006: Complete Task Checkbox

**Priority**: High
**Steps**:

1. Click checkbox for a task
2. Verify task completion mutation
3. Check optimistic update

**Expected**:

- Checkbox updates immediately (optimistic)
- Task name shows strikethrough
- Text color changes to muted
- API mutation succeeds
- If error, checkbox reverts

#### TC-MYTASKS-007: Infinite Scroll

**Priority**: Medium
**Steps**:

1. Scroll to bottom of task list
2. Verify more tasks load

**Expected**:

- "กำลังโหลด..." indicator appears
- Next batch of tasks loaded
- No duplicate tasks
- Smooth scrolling experience

#### TC-MYTASKS-008: Task Click Navigation

**Priority**: High
**Steps**:

1. Click on task name
2. Verify task panel opens

**Expected**:

- Task detail panel opens
- Correct task displayed
- Can return to dashboard

#### TC-MYTASKS-009: Empty State

**Priority**: Medium
**Steps**:

1. Remove user from all task assignees
2. View widget

**Expected**:

- Empty state message: "ไม่มีงานที่มอบหมาย"
- "สร้างงาน" button displayed
- No errors

---

### 5. Dashboard Calendar Widget

#### TC-CALENDAR-001: Display Current Month

**Priority**: High
**Steps**:

1. View calendar widget
2. Verify current month displayed

**Expected**:

- Thai month name and Buddhist year (พ.ศ.)
- Current date highlighted with primary color
- 7-column grid (Sunday to Saturday)
- Thai day abbreviations: อา, จ, อ, พ, พฤ, ศ, ส

#### TC-CALENDAR-002: Month Navigation

**Priority**: High
**Steps**:

1. Click previous month button
2. Click next month button
3. Click "วันนี้" button

**Expected**:

- Previous month displayed
- Next month displayed
- Returns to current month
- Task dots update for new month

#### TC-CALENDAR-003: Task Indicators (Dots)

**Priority**: High
**Steps**:

1. View dates with tasks
2. Verify colored dots appear

**Expected**:

- Red dot: Overdue tasks (dueDate < today AND NOT closed)
- Orange dot: Due soon (0-3 days, NOT closed)
- Blue dot: Upcoming tasks (>3 days, NOT closed)
- Multiple dots can appear on same date

#### TC-CALENDAR-004: Tooltip on Hover

**Priority**: High
**Steps**:

1. Hover over date with tasks
2. Verify tooltip appears

**Expected**:

- Tooltip shows after 200ms delay
- Displays date in Thai format: "d MMMM yyyy"
- Lists up to 5 tasks with priority dots
- Shows "และอีก N งาน..." if more than 5 tasks
- Closed tasks shown with strikethrough and opacity-60
- Tooltip positioned above date (side="top")

#### TC-CALENDAR-005: Tooltip Content

**Priority**: Medium
**Steps**:

1. Hover over date with various task priorities
2. Check task display

**Expected**:

- Priority 1: red dot (bg-red-500)
- Priority 2: orange dot (bg-orange-500)
- Priority 3: blue dot (bg-blue-500)
- Priority 4: gray dot (bg-gray-500)
- Task names displayed with proper wrapping
- max-w-xs limits tooltip width

#### TC-CALENDAR-006: Legend Display

**Priority**: Low
**Steps**:

1. View legend at bottom of calendar

**Expected**:

- Legend positioned at bottom-right (justify-end)
- Three indicators: เกินกำหนด (red), ใกล้ครบกำหนด (orange), งานถัดไป (blue)
- Consistent with task dot colors
- Border-top separator

#### TC-CALENDAR-007: Empty Dates

**Priority**: Low
**Steps**:

1. Hover over dates with no tasks

**Expected**:

- No tooltip appears
- No dots displayed
- Date still hoverable (hover:bg-muted/50)

#### TC-CALENDAR-008: Dark Mode

**Priority**: Medium
**Steps**:

1. Toggle dark mode
2. Check calendar appearance

**Expected**:

- All colors properly themed
- Today's date contrast maintained
- Tooltip readable in dark mode
- Legend visible

---

### 6. Recent Activities Widget

#### TC-ACTIVITY-001: Display Recent Activities

**Priority**: High
**Steps**:

1. Perform various actions (create task, update status, add comment)
2. View recent activities widget

**Expected**:

- Shows last 10 activities by default
- Each activity has: avatar, activity text, timestamp
- Sorted by date (newest first)
- Relative time display: "2 ชั่วโมงที่แล้ว", "วานนี้"

#### TC-ACTIVITY-002: Activity Types

**Priority**: Medium
**Steps**:

1. Verify different activity types displayed

**Expected**:

- Task created
- Status changed
- Task assigned
- Comment added
- Due date changed
- Priority changed
- All formatted correctly in Thai

#### TC-ACTIVITY-003: Avatar Display

**Priority**: Low
**Steps**:

1. Check user avatars in activities

**Expected**:

- Avatar shows user initials if no image
- Consistent size (h-8 w-8)
- Proper fallback colors

#### TC-ACTIVITY-004: Expand/Collapse

**Priority**: Medium
**Steps**:

1. Click "ดูเพิ่มเติม" if more than 10 activities
2. Click "ซ่อน" button

**Expected**:

- Initially shows 10 activities
- Expands to show all
- Collapses back to 10
- Smooth transition

#### TC-ACTIVITY-005: Empty State

**Priority**: Low
**Steps**:

1. Use new account with no activities

**Expected**:

- Empty state message displayed
- No errors in console

---

### 7. My Checklist Widget

#### TC-CHECKLIST-001: Display Checklist Items

**Priority**: High
**Steps**:

1. Add checklist items to assigned tasks
2. View my checklist widget

**Expected**:

- Flattened list of all checklist items from all tasks
- Shows up to 10 items initially
- Each item has checkbox and name
- Progress bar in header showing completion %

#### TC-CHECKLIST-002: Progress Bar Display

**Priority**: High
**Steps**:

1. View progress bar in header
2. Check calculation

**Expected**:

- Progress bar positioned in header before badge
- Width: w-32 (128px)
- Shows completion percentage visually
- Badge shows "X/Y สำเร็จ" count
- No percentage text displayed

#### TC-CHECKLIST-003: Progress Bar Position

**Priority**: Low
**Steps**:

1. Inspect header layout

**Expected**:

- Layout: Title | (space) [Progress Bar] [Badge]
- Progress bar w-32 (not flex-1)
- Badge positioned after progress bar
- Right-aligned group

#### TC-CHECKLIST-004: Task Name Tooltip

**Priority**: High
**Steps**:

1. Hover over a checklist item
2. Verify tooltip appears

**Expected**:

- Tooltip shows parent task name
- Appears after default delay
- Item row is clickable
- Cursor changes to pointer

#### TC-CHECKLIST-005: Toggle Checkbox

**Priority**: High
**Steps**:

1. Click checkbox for an item
2. Verify mutation

**Expected**:

- Checkbox toggles immediately (optimistic)
- Item text shows strikethrough when checked
- Progress bar updates
- Badge count updates
- API mutation succeeds

#### TC-CHECKLIST-006: Click to Open Task

**Priority**: High
**Steps**:

1. Click anywhere on checklist item row
2. Verify task panel opens

**Expected**:

- Task detail panel opens
- Shows parent task, not checklist item
- Can edit task and checklist from panel
- Return to dashboard works

#### TC-CHECKLIST-007: Expand More Items

**Priority**: Medium
**Steps**:

1. Have more than 10 checklist items
2. Click "ดูเพิ่มเติม (N รายการ)" button
3. Click "ซ่อน" button

**Expected**:

- Shows all items when expanded
- Shows 10 items when collapsed
- Button text updates appropriately

#### TC-CHECKLIST-008: Empty State

**Priority**: Low
**Steps**:

1. Remove all checklists from tasks

**Expected**:

- Empty state displayed
- Message: "ยังไม่มี Checklist"
- Suggestion text shown
- No errors

---

## Performance Testing

### PERF-001: Initial Load Time

**Target**: < 2 seconds for dashboard page load
**Steps**:

1. Clear browser cache
2. Open DevTools Network tab
3. Navigate to dashboard
4. Measure time to interactive

**Metrics**:

- Total requests
- Total transfer size
- DOMContentLoaded time
- Load time

### PERF-002: React Query Caching

**Target**: < 200ms for cached data
**Steps**:

1. Load dashboard
2. Navigate away
3. Return to dashboard within staleTime
4. Measure response time

**Expected**:

- Data loaded from cache
- No API calls made
- Instant display

### PERF-003: Infinite Scroll Performance

**Target**: < 500ms per batch load
**Steps**:

1. Scroll to trigger next batch in My Tasks
2. Measure load time
3. Check for memory leaks

**Expected**:

- Smooth scrolling
- No frame drops
- Memory usage stable

### PERF-004: Optimistic Updates

**Target**: < 50ms visual response
**Steps**:

1. Toggle task checkbox
2. Toggle checklist checkbox
3. Measure time to visual update

**Expected**:

- Immediate visual feedback
- No layout shift
- Smooth animation

---

## Cross-Browser Testing

### Browsers to Test

- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest, macOS)
- ✅ Edge (latest)

### Test Areas

- Layout consistency
- Tooltip positioning
- Hover states
- Animation smoothness
- Font rendering

---

## Responsive Design Testing

### Breakpoints to Test

- Mobile: 375px (iPhone SE)
- Mobile: 414px (iPhone Pro Max)
- Tablet: 768px (iPad)
- Desktop: 1024px
- Desktop: 1440px

### Expected Behavior

- Widgets stack vertically on mobile
- Grid adjusts appropriately
- Touch targets ≥ 44px
- No horizontal scroll
- Text remains readable

**Note**: Dashboard may not be fully optimized for mobile yet - document issues for future iteration.

---

## Accessibility Testing

### WCAG 2.1 Level AA Compliance

#### A11Y-001: Keyboard Navigation

**Steps**:

1. Use Tab key to navigate
2. Use Enter/Space to activate
3. Use Escape to close panels

**Expected**:

- All interactive elements focusable
- Visible focus indicators
- Logical tab order
- Keyboard shortcuts work

#### A11Y-002: Screen Reader Support

**Tools**: NVDA (Windows), VoiceOver (macOS)
**Steps**:

1. Navigate dashboard with screen reader
2. Verify all content announced

**Expected**:

- Widget titles announced
- Task counts announced
- Interactive elements labeled
- Status changes announced

#### A11Y-003: Color Contrast

**Tool**: axe DevTools
**Steps**:

1. Run contrast checker
2. Verify all text meets 4.5:1 ratio

**Expected**:

- Regular text: 4.5:1
- Large text: 3:1
- No contrast failures

#### A11Y-004: ARIA Labels

**Steps**:

1. Inspect elements with screen reader
2. Check ARIA attributes

**Expected**:

- Buttons have aria-label
- Regions have aria-labelledby
- Live regions for updates
- Proper role attributes

---

## Error Handling Testing

### ERROR-001: API Failures

**Steps**:

1. Simulate network failure
2. Observe error states

**Expected**:

- Error message displayed
- No infinite loading
- Retry mechanism available
- Other widgets unaffected

### ERROR-002: Invalid Data

**Steps**:

1. Provide malformed API response
2. Check error boundaries

**Expected**:

- Graceful degradation
- Error logged to console
- User-friendly error message
- No white screen

### ERROR-003: Permission Errors

**Steps**:

1. Access dashboard with insufficient permissions
2. Check handling

**Expected**:

- 403 error handled gracefully
- Redirect or error message
- No console errors

---

## Data Validation Testing

### DATA-001: Task Count Accuracy

**Steps**:

1. Manually count tasks in database
2. Compare with dashboard stats

**SQL Queries**:

```sql
-- Total tasks
SELECT COUNT(*) FROM tasks t
JOIN task_assignees ta ON t.id = ta.taskId
WHERE ta.userId = 'user_id' AND t.deletedAt IS NULL;

-- In Progress
SELECT COUNT(*) FROM tasks t
JOIN task_assignees ta ON t.id = ta.taskId
JOIN project_statuses ps ON t.statusId = ps.id
WHERE ta.userId = 'user_id' AND t.deletedAt IS NULL AND ps.type = 'IN_PROGRESS';

-- Overdue
SELECT COUNT(*) FROM tasks t
JOIN task_assignees ta ON t.id = ta.taskId
WHERE ta.userId = 'user_id' AND t.deletedAt IS NULL
AND t.dueDate < NOW() AND t.isClosed = FALSE;

-- Completed
SELECT COUNT(*) FROM tasks t
JOIN task_assignees ta ON t.id = ta.taskId
WHERE ta.userId = 'user_id' AND t.deletedAt IS NULL AND t.isClosed = TRUE;
```

### DATA-002: Pinned Tasks Accuracy

**Steps**:

1. Check pinnedTasks JSONB field for user
2. Compare with widget display

**SQL**:

```sql
SELECT jsonb_array_length(pinnedTasks)
FROM users WHERE id = 'user_id';
```

### DATA-003: Checklist Progress Calculation

**Steps**:

1. Count checked vs total checklist items
2. Verify progress bar percentage

**SQL**:

```sql
SELECT
  COUNT(*) as total,
  SUM(CASE WHEN isChecked THEN 1 ELSE 0 END) as checked
FROM checklists c
JOIN tasks t ON c.taskId = t.id
JOIN task_assignees ta ON t.id = ta.taskId
WHERE ta.userId = 'user_id' AND c.deletedAt IS NULL;
```

---

## Integration Testing

### INT-001: Widget Interactions

**Steps**:

1. Complete a task from My Tasks widget
2. Verify updates in other widgets

**Expected**:

- Stats card count decreases
- Task removed from overdue (if applicable)
- Checklist progress updates (if has checklist)
- Recent activity logged

### INT-002: Real-time Updates

**Steps**:

1. Open dashboard in two tabs
2. Perform action in one tab
3. Check other tab updates

**Expected**:

- React Query invalidation works
- staleTime respected (2-5 minutes)
- Manual refresh shows updated data

### INT-003: Navigation Flow

**Steps**:

1. Click task from any widget
2. Edit task in panel
3. Close panel
4. Return to dashboard

**Expected**:

- Panel opens correctly
- Changes saved
- Dashboard reflects updates
- No navigation errors

---

## Security Testing

### SEC-001: Permission-Based Data

**Steps**:

1. Login as different roles
2. Verify data scope

**Expected**:

- ADMIN sees all org tasks (if configured)
- LEADER sees department tasks
- MEMBER sees only assigned tasks
- No unauthorized data exposure

### SEC-002: API Authorization

**Steps**:

1. Inspect network requests
2. Verify Bearer token sent

**Expected**:

- All requests include Authorization header
- Token valid and not expired
- No sensitive data in URL params

### SEC-003: XSS Prevention

**Steps**:

1. Try injecting script tags in task names
2. Check if executed

**Expected**:

- Scripts not executed
- Content properly escaped
- React handles sanitization

---

## User Acceptance Testing (UAT)

### UAT-001: First-time User Experience

**Persona**: New user, first login
**Steps**:

1. Login for first time
2. Navigate to dashboard
3. Interact with widgets

**Questions**:

- Is layout intuitive?
- Are labels clear?
- Is empty state helpful?
- Are actions discoverable?

### UAT-002: Power User Experience

**Persona**: Experienced user, daily usage
**Steps**:

1. Use dashboard for typical workflow
2. Complete common tasks
3. Measure time to complete

**Questions**:

- Is navigation efficient?
- Are frequent actions easy to access?
- Does localStorage enhance experience?
- Are there any frustrations?

### UAT-003: Mobile User Experience

**Persona**: User on mobile device
**Steps**:

1. Access dashboard on mobile
2. Attempt common tasks

**Questions**:

- Is layout usable on small screen?
- Are touch targets adequate?
- Is scrolling smooth?
- Are tooltips accessible?

---

## Regression Testing

After any bug fixes or enhancements:

1. Re-run all High priority test cases
2. Re-run affected widget test cases
3. Verify no new bugs introduced
4. Check performance not degraded

---

## Test Execution Tracking

### Test Results Template

```
Test Case ID: [TC-XXX-000]
Tester: [Name]
Date: [YYYY-MM-DD]
Browser: [Chrome/Firefox/Safari/Edge]
Result: [PASS/FAIL/BLOCKED]
Notes: [Any observations]
Screenshots: [If applicable]
```

### Pass/Fail Criteria

- **PASS**: All expected results achieved, no critical issues
- **FAIL**: One or more expected results not achieved
- **BLOCKED**: Cannot execute due to dependency or environment issue

### Bug Reporting Template

```
Bug ID: BUG-XXX
Severity: [Critical/High/Medium/Low]
Priority: [P0/P1/P2/P3]
Component: [Widget name]
Description: [Clear description]
Steps to Reproduce: [Numbered steps]
Expected Result: [What should happen]
Actual Result: [What actually happens]
Environment: [Browser, OS, etc.]
Screenshots: [If applicable]
```

---

## Definition of Done

Dashboard is ready for production when:

✅ All High priority test cases pass
✅ No Critical or High severity bugs
✅ Performance targets met
✅ Cross-browser compatibility verified
✅ Accessibility audit passed (Level AA)
✅ Security review completed
✅ UAT sign-off received
✅ Documentation complete
✅ Code review approved

---

## Next Steps After Testing

1. **Bug Fixes**: Address all identified issues by priority
2. **Performance Optimization**: If targets not met
3. **Documentation**: Update CLAUDE.md with test results
4. **Demo**: Prepare demo for stakeholders
5. **Deployment Planning**: Plan production rollout
6. **User Training**: Create user guide if needed
7. **Monitoring Setup**: Configure error tracking and analytics

---

## Testing Timeline (Estimated)

- **Day 1**: Stats Cards, Overdue Tasks, Pinned Tasks (TC-STATS-_, TC-OVERDUE-_, TC-PINNED-\*)
- **Day 2**: My Tasks Widget, Calendar Widget (TC-MYTASKS-_, TC-CALENDAR-_)
- **Day 3**: Recent Activities, My Checklist (TC-ACTIVITY-_, TC-CHECKLIST-_)
- **Day 4**: Performance, Cross-browser, Responsive (PERF-\*, Browser tests)
- **Day 5**: Accessibility, Security, Integration (A11Y-_, SEC-_, INT-\*)
- **Day 6**: UAT, Bug fixes
- **Day 7**: Regression testing, Final sign-off

**Total Estimated Time**: 7 days (with 1-2 testers)

---

## Contact & Support

**Technical Issues**: Reference CLAUDE.md troubleshooting section
**Test Data Issues**: Re-run seed script
**Environment Issues**: Check dev server logs
**Questions**: Review implementation documentation files

---

**End of Dashboard Testing Plan v1.0**
