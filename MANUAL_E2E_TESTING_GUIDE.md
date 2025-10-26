# Manual End-to-End Testing Guide

**Version**: 1.0.0
**Date**: 2025-10-26
**Estimated Time**: 2-3 hours
**Prerequisites**: Dev server running on port 3010, database seeded

---

## 🎯 Testing Objectives

1. Verify all critical user flows work correctly
2. Ensure permission system works as expected
3. Catch bugs before production deployment
4. Validate UI/UX across different user roles

---

## 🚀 Pre-Testing Setup

### 1. Start Dev Server
```bash
PORT=3010 npm run dev
```

### 2. Verify Database is Seeded
```bash
# Check if test data exists
npm run prisma:studio
# Look for: admin@hospital.test, test users, projects, tasks
```

### 3. Test Credentials

**ADMIN User:**
- Email: `admin@hospital.test`
- Password: `SecurePass123!`
- Role: ADMIN (full access)

**LEADER User:**
- Email: `leader@hospital.test`
- Password: `SecurePass123!`
- Role: LEADER (division scope)

**HEAD User:**
- Email: `head@hospital.test`
- Password: `SecurePass123!`
- Role: HEAD (department scope)

**MEMBER User:**
- Email: `member@hospital.test`
- Password: `SecurePass123!`
- Role: MEMBER (limited access)

### 4. Testing Browser
- **Primary**: Chrome (latest)
- **Secondary**: Firefox, Safari (if available)

---

## 📋 Test Scenarios

### ✅ Scenario 1: Authentication Flow (15 min)

#### 1.1 Registration
- [ ] Navigate to `/register`
- [ ] Fill all required fields:
  - Title Prefix: นาย
  - First Name: ทดสอบ
  - Last Name: ระบบ
  - Email: `test-${Date.now()}@example.com`
  - Password: SecurePass123!
  - Confirm Password: SecurePass123!
  - Department: (select any)
- [ ] Click "ลงทะเบียน"
- [ ] **Expected**: Success message, redirect to login
- [ ] **Verify**: User created in database (Prisma Studio)

#### 1.2 Login - Success
- [ ] Navigate to `/login`
- [ ] Enter: `admin@hospital.test` / `SecurePass123!`
- [ ] Click "เข้าสู่ระบบ"
- [ ] **Expected**: Redirect to `/dashboard`
- [ ] **Verify**: User info in navbar (name, avatar)

#### 1.3 Login - Wrong Password
- [ ] Navigate to `/login`
- [ ] Enter: `admin@hospital.test` / `WrongPassword`
- [ ] Click "เข้าสู่ระบบ"
- [ ] **Expected**: Error message "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
- [ ] **Verify**: Error clears when typing

#### 1.4 Password Reset Request
- [ ] Navigate to `/request-reset`
- [ ] Enter: `admin@hospital.test`
- [ ] Click "ส่งลิงก์รีเซ็ตรหัสผ่าน"
- [ ] **Expected**: Success message
- [ ] **Verify**: Check console for email link (if BYPASS_EMAIL=true)

#### 1.5 Password Reset
- [ ] Copy reset token from console/email
- [ ] Navigate to `/reset-password?token=<TOKEN>`
- [ ] Enter new password twice
- [ ] Click "รีเซ็ตรหัสผ่าน"
- [ ] **Expected**: Success, redirect to login
- [ ] **Verify**: Can login with new password

#### 1.6 Session Persistence
- [ ] Login as admin
- [ ] Close browser tab
- [ ] Open new tab, navigate to `http://localhost:3010`
- [ ] **Expected**: Still logged in (redirect to dashboard)

#### 1.7 Logout
- [ ] Click profile menu → Logout
- [ ] **Expected**: Redirect to `/login`
- [ ] **Verify**: Cannot access `/dashboard` without login

---

### ✅ Scenario 2: Dashboard Widgets (20 min)

**Login as**: `admin@hospital.test`

#### 2.1 Stats Cards
- [ ] Navigate to `/dashboard`
- [ ] **Verify**: 4 stat cards display correct counts
  - งานทั้งหมด (Total Tasks)
  - งานที่เสร็จแล้ว (Completed Tasks)
  - งานที่ค้างอยู่ (Pending Tasks)
  - งานที่เกินกำหนด (Overdue Tasks)
- [ ] **Expected**: Numbers > 0 (if data exists)
- [ ] **Verify**: Animated count-up effect on load

#### 2.2 Overdue Tasks Alert
- [ ] Check "งานที่เกินกำหนด" widget (red theme)
- [ ] **Verify**:
  - Shows max 5 overdue tasks
  - Assignee avatars in top-right corner
  - Task names clickable
- [ ] Click a task name
- [ ] **Expected**: Task panel opens on right side

#### 2.3 Pinned Tasks Widget
- [ ] Check "งานที่ปักหมุด" widget (amber theme)
- [ ] **Verify**:
  - Shows pinned tasks only
  - Assignee avatars in top-right corner
  - Expand/collapse button works
- [ ] Click pin icon on a task
- [ ] **Expected**: Task unpinned, widget updates immediately

#### 2.4 My Tasks Widget
- [ ] Check "งานของฉัน" widget
- [ ] **Verify**: Filter tabs work
  - ทั้งหมด (All)
  - วันนี้ (Today)
  - สัปดาห์นี้ (This Week)
  - เกินกำหนด (Overdue)
- [ ] Toggle "Hide closed tasks" switch
- [ ] **Expected**: Closed tasks hidden/shown
- [ ] **Verify**: Setting persists on page refresh

#### 2.5 Dashboard Calendar
- [ ] Check calendar widget
- [ ] **Verify**:
  - Shows current month in Thai
  - Tasks appear on correct dates
  - Tooltip shows task name on hover
  - Legend in top-right corner
- [ ] Click a date with tasks
- [ ] **Expected**: Highlights tasks for that date

#### 2.6 Recent Activities
- [ ] Check "กิจกรรมล่าสุด" widget
- [ ] **Verify**:
  - Shows 10 recent activities
  - Each has avatar + activity text
  - Hover effect on rows
  - "ดูทั้งหมด" (View All) expands to show more
- [ ] Click "ดูทั้งหมด"
- [ ] **Expected**: Shows more activities (up to 30)

#### 2.7 My Checklist Widget
- [ ] Check "รายการตรวจสอบของฉัน" widget
- [ ] **Verify**:
  - Progress bar in header
  - Task names hidden (tooltips only)
  - Checkbox toggle works
- [ ] Click checkbox on an item
- [ ] **Expected**:
  - Immediate toggle (optimistic update)
  - Progress bar updates
  - Toast notification appears

---

### ✅ Scenario 3: Project Management (30 min)

**Login as**: `admin@hospital.test`

#### 3.1 Create New Project
- [ ] Navigate to `/projects`
- [ ] Click "สร้างโปรเจคใหม่" button
- [ ] Fill form:
  - Project Name: `Test Project ${Date.now()}`
  - Description: `E2E Testing Project`
  - Department: (select any)
  - Add 2 phases with dates
  - Keep default statuses (4 statuses)
- [ ] Click "สร้างโปรเจค"
- [ ] **Expected**:
  - Modal closes
  - Project appears in list immediately (optimistic)
  - Toast success message
- [ ] **Verify**: Project exists in database

#### 3.2 Edit Project
- [ ] Click project name to open
- [ ] Click info button (?) in toolbar
- [ ] Edit description
- [ ] Change phase dates
- [ ] Change status colors
- [ ] Click "บันทึก"
- [ ] **Expected**:
  - Changes saved
  - Modal closes
  - UI updates
- [ ] **Verify**: Reload page, changes persisted

#### 3.3 View Project - Board View
- [ ] Open project
- [ ] Default view should be "Board"
- [ ] **Verify**:
  - All statuses shown as columns
  - Tasks grouped by status
  - Drag & drop works (try moving a task)
- [ ] Drag task to different status
- [ ] **Expected**:
  - Task moves immediately (optimistic)
  - Sync animation in footer
  - Status updated in database

#### 3.4 View Project - Calendar View
- [ ] Click "Calendar" tab
- [ ] **Verify**:
  - Tasks with dates shown on calendar
  - Tooltip shows task details
  - Legend shows task types
  - Can create task by clicking date
- [ ] Click empty date
- [ ] **Expected**: Create task modal opens with pre-filled date

#### 3.5 View Project - List View
- [ ] Click "List" tab
- [ ] **Verify**:
  - All tasks in table format
  - Inline editing works (name, priority, assignee, status)
  - Filters work (search, priority, status)
  - Sorting works (click column headers)
- [ ] Edit task name inline
- [ ] **Expected**: Immediate update (optimistic)

---

### ✅ Scenario 4: Task Management (25 min)

**Login as**: `admin@hospital.test`

#### 4.1 Create Task
- [ ] Open any project
- [ ] Click "สร้างงานใหม่" (+ button)
- [ ] Fill form:
  - Task Name: `E2E Test Task ${Date.now()}`
  - Description: `Testing task creation`
  - Priority: Urgent (1)
  - Assign to 2 users (multi-select)
  - Start Date: Today
  - Due Date: Tomorrow
  - Parent Task: (optional)
- [ ] Click "สร้างงาน"
- [ ] **Expected**:
  - Task appears in view immediately
  - Toast notification
  - Modal closes
- [ ] **Verify**: Task in database

#### 4.2 Edit Task - Task Panel
- [ ] Click any task to open task panel
- [ ] Edit various fields:
  - Name
  - Description
  - Priority
  - Status
  - Assignees
  - Dates
- [ ] **Expected**:
  - Save button enables only when dirty
  - Changes saved on "บันทึก" click
  - Panel stays open
  - UI updates immediately

#### 4.3 Add Comments
- [ ] Open task panel
- [ ] Go to "Comments" tab
- [ ] Type comment: `This is a test comment`
- [ ] **Try @mention**: Type `@` and select a user
- [ ] Click "แสดงความคิดเห็น"
- [ ] **Expected**:
  - Comment appears immediately
  - Mentioned user gets notification
  - History entry created

#### 4.4 Add Checklist Items
- [ ] Open task panel
- [ ] Go to "Details" tab
- [ ] Scroll to "Checklists" section
- [ ] Add 3 checklist items:
  - `Test item 1`
  - `Test item 2`
  - `Test item 3`
- [ ] **Expected**: Items appear in list
- [ ] Check/uncheck items
- [ ] **Expected**: Immediate toggle, history logged

#### 4.5 View Task History
- [ ] Open task panel
- [ ] Go to "History" tab
- [ ] **Verify**:
  - All changes logged
  - Newest first
  - Shows who changed what
  - Timestamps in Thai

#### 4.6 Close Task - Completed
- [ ] Open task panel
- [ ] Click "ปิดงาน" button
- [ ] Select "เสร็จสมบูรณ์" (COMPLETED)
- [ ] Click confirm
- [ ] **Expected**:
  - Task marked as closed
  - closeType = COMPLETED
  - closedAt = now
  - closedBy = current user
  - Task hidden from default views (unless "Show Closed" enabled)

#### 4.7 Close Task - Aborted
- [ ] Open another task
- [ ] Click "ปิดงาน"
- [ ] Select "ยกเลิก" (ABORTED)
- [ ] Enter reason: `Testing aborted status`
- [ ] Click confirm
- [ ] **Expected**: Same as above but closeType = ABORTED

---

### ✅ Scenario 5: User Management (20 min)

**Login as**: `admin@hospital.test`

#### 5.1 Access Users Page (ADMIN Only)
- [ ] Navigate to `/users`
- [ ] **Expected**: Page loads (only for ADMIN)
- [ ] **Verify**: Table shows all users

#### 5.2 Create New User
- [ ] Click "สร้างผู้ใช้ใหม่" button
- [ ] Fill all required fields:
  - Email: `newuser-${Date.now()}@example.com`
  - Title Prefix: นาย
  - First Name: ทดสอบ
  - Last Name: ผู้ใช้ใหม่
  - Role: MEMBER
  - Department: (select any)
  - Job Title: (select any)
- [ ] Click "สร้างผู้ใช้"
- [ ] **Expected**:
  - User created
  - Password reset email sent (check console if BYPASS_EMAIL=true)
  - Modal closes
  - User appears in table

#### 5.3 Edit User
- [ ] Click "Edit" on a user row
- [ ] Change:
  - Job Title
  - Role (try different roles)
  - Additional Roles
- [ ] Click "บันทึก"
- [ ] **Expected**:
  - Changes saved
  - Dirty check works (unsaved changes warning)

#### 5.4 Toggle User Status
- [ ] Find a MEMBER user
- [ ] Click status toggle switch
- [ ] **Expected**:
  - Status changes immediately (ACTIVE ↔ SUSPENDED)
  - User cannot login when SUSPENDED

#### 5.5 Permission: Non-ADMIN Cannot Access
- [ ] Logout
- [ ] Login as `member@hospital.test` / `SecurePass123!`
- [ ] Try to navigate to `/users`
- [ ] **Expected**: Access Denied or redirect
- [ ] **Verify**: "บุคลากร" menu item hidden in sidebar

---

### ✅ Scenario 6: Department Tasks View (20 min)

#### 6.1 LEADER View (Division Scope)
- [ ] Login as `leader@hospital.test`
- [ ] Navigate to `/department/tasks`
- [ ] **Expected**: See all tasks in their division
- [ ] **Verify**:
  - Tasks grouped by project
  - Expand/collapse project groups
  - Pinned tasks table at top
  - Department badges show on cross-department tasks
  - Task counts accurate

#### 6.2 HEAD View (Department Scope)
- [ ] Login as `head@hospital.test`
- [ ] Navigate to `/department/tasks`
- [ ] **Expected**: See only tasks in their department
- [ ] **Verify**: Fewer tasks than LEADER view

#### 6.3 MEMBER Cannot Access
- [ ] Login as `member@hospital.test`
- [ ] Navigate to `/department/tasks`
- [ ] **Expected**: Access Denied or redirect
- [ ] **Verify**: "Department Tasks" menu hidden

#### 6.4 Filters & Sorting
- [ ] Back to LEADER/HEAD account
- [ ] Test filters:
  - View: Grouped / Flat
  - Sort By: Name, Priority, Due Date
  - Sort Direction: Asc / Desc
  - Include Completed: On / Off
- [ ] **Expected**: All filters work, persisted in URL

#### 6.5 Pin/Unpin Tasks
- [ ] Click pin icon on a task
- [ ] **Expected**: Task appears in Pinned Tasks table
- [ ] Click pin icon again
- [ ] **Expected**: Task removed from Pinned Tasks

---

### ✅ Scenario 7: Reports Dashboard (15 min)

**Login as**: `admin@hospital.test`

#### 7.1 Access Reports
- [ ] Navigate to `/reports`
- [ ] **Expected**: 5 charts load
  - Task Completion Chart (line)
  - Task Priority Chart (pie)
  - Task Status Chart (bar)
  - Tasks by Department (bar)
  - Tasks by User (bar)

#### 7.2 Organization Filters
- [ ] Test Mission Group filter
- [ ] Test Division filter
- [ ] Test Department filter
- [ ] **Expected**: Charts update based on selection

#### 7.3 Date Range Filters
- [ ] Click date range buttons:
  - 7 days
  - 30 days
  - 90 days
  - Custom (select dates)
- [ ] **Expected**: Charts update

#### 7.4 Export CSV
- [ ] Click "Export CSV" button
- [ ] **Expected**: CSV file downloads with task data

#### 7.5 Permission: Non-ADMIN Scope Limited
- [ ] Login as `leader@hospital.test`
- [ ] Navigate to `/reports`
- [ ] **Expected**:
  - Can only see their division
  - Mission Group filter disabled or shows only their group

---

### ✅ Scenario 8: Notifications (15 min)

**Login as**: Any user with notifications

#### 8.1 Notification Bell
- [ ] Check bell icon in navbar
- [ ] **Expected**: Shows unread count badge

#### 8.2 Notification Dropdown
- [ ] Click bell icon
- [ ] **Expected**:
  - Dropdown shows recent notifications
  - Unread notifications highlighted
  - Click notification opens related task

#### 8.3 Auto Mark as Read
- [ ] Open notification dropdown
- [ ] Hover on a notification for 2.5 seconds
- [ ] **Expected**: Notification marked as read
- [ ] **Verify**: Unread count decreases

#### 8.4 Notification Polling
- [ ] Keep page open
- [ ] In another browser/incognito, create a comment mentioning current user
- [ ] Wait 60 seconds
- [ ] **Expected**: Notification appears (auto-refresh every 60s)

#### 8.5 Notification Types
- [ ] **Verify** these notifications work:
  - Task assigned to you
  - Comment mentions you (@mention)
  - Task status changed
  - Task closed
  - Checklist item completed

---

### ✅ Scenario 9: Cross-Browser Testing (30 min)

Repeat critical scenarios on different browsers:

#### 9.1 Chrome (Primary)
- [ ] All scenarios above

#### 9.2 Firefox
- [ ] Login/Logout
- [ ] Dashboard widgets load
- [ ] Create task
- [ ] Drag & drop (Board view)

#### 9.3 Safari (if available)
- [ ] Same as Firefox

#### 9.4 Edge
- [ ] Same as Firefox

#### 9.5 Mobile Browsers (Optional)
- [ ] Chrome Mobile (Android)
- [ ] Safari Mobile (iOS)
- [ ] **Check**: Responsive design, touch interactions

---

### ✅ Scenario 10: Performance & UX (15 min)

#### 10.1 Page Load Speed
- [ ] Open Chrome DevTools → Network
- [ ] Navigate to `/dashboard`
- [ ] **Expected**: Page loads < 3 seconds
- [ ] Check for:
  - No failed requests (red)
  - No console errors (red)

#### 10.2 Optimistic Updates
- [ ] Test these actions (should be instant):
  - Pin/unpin task
  - Toggle checklist item
  - Change task status (Board view drag)
  - Create project
  - Delete project
- [ ] **Expected**: UI updates immediately, sync animation shows

#### 10.3 Loading States
- [ ] Throttle network to "Slow 3G" (DevTools)
- [ ] Navigate to pages
- [ ] **Expected**:
  - Loading skeletons appear
  - No blank screens
  - Graceful degradation

#### 10.4 Error Handling
- [ ] Turn off internet connection
- [ ] Try to create a task
- [ ] **Expected**:
  - Error message shown
  - UI doesn't break
  - Can retry when connection restored

---

## 📊 Test Results Template

Create a file: `TEST_RESULTS_${DATE}.md`

```markdown
# E2E Test Results

**Date**: 2025-10-26
**Tester**: Your Name
**Browser**: Chrome 120
**Environment**: http://localhost:3010

## Summary
- Total Scenarios: 10
- Passed: X
- Failed: Y
- Blocked: Z

## Failed Tests

### Scenario X.Y: Test Name
**Expected**: ...
**Actual**: ...
**Steps to Reproduce**:
1. ...
2. ...

**Screenshot**: (attach)
**Priority**: High/Medium/Low
**Assigned To**: ...

## Notes
- Overall stability: Good/Fair/Poor
- Performance: Fast/Acceptable/Slow
- Critical blockers: Yes/No
- Ready for deployment: Yes/No/With Conditions
```

---

## 🐛 Common Issues to Watch For

### High Priority
- [ ] Authentication failures
- [ ] Permission bypass (users accessing unauthorized resources)
- [ ] Data loss (creates/updates not saving)
- [ ] App crashes/white screens
- [ ] Console errors (red)

### Medium Priority
- [ ] Slow loading (>3 seconds)
- [ ] Broken links/404s
- [ ] Missing translations (English instead of Thai)
- [ ] Layout issues (overlapping text, broken UI)
- [ ] Form validation not working

### Low Priority
- [ ] Minor UI inconsistencies
- [ ] Console warnings (yellow)
- [ ] Typos
- [ ] Missing tooltips

---

## ✅ Completion Criteria

**Ready for Deployment when**:
- [ ] All critical scenarios pass (Auth, Dashboard, Projects, Tasks)
- [ ] No high-priority bugs
- [ ] Permission system works correctly
- [ ] No console errors in happy path
- [ ] Performance acceptable (<3s page loads)
- [ ] Works on Chrome + 1 other browser

**Optional (Nice to have)**:
- [ ] All scenarios pass
- [ ] Works on all browsers
- [ ] Mobile responsive
- [ ] No medium-priority bugs

---

## 📝 Next Steps After Testing

1. **Document all bugs** in GitHub Issues or separate file
2. **Prioritize fixes** (High → Medium → Low)
3. **Fix critical bugs** before deployment
4. **Re-test** after fixes
5. **Get stakeholder approval** (if applicable)
6. **Proceed to deployment**

---

**Good luck with testing! 🚀**
