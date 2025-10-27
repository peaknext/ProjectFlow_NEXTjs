# Task Panel Testing Guide

**Quick Start**: How to test the Task Panel in your browser

---

## Prerequisites

✅ Dev server running on http://localhost:3010
✅ Database seeded with test data
✅ Browser open (Chrome/Edge recommended)

---

## Step 1: Access the Application

1. **Open your browser**
2. **Navigate to**: http://localhost:3010
3. **Login with test credentials**:
   ```
   Email: admin@hospital.test
   Password: SecurePass123!
   ```

---

## Step 2: Open a Project with Tasks

### Option A: Via Dashboard
1. You should see the dashboard with project cards
2. Click on any project (e.g., "โครงการพัฒนาระบบ IT")

### Option B: Direct URL
Navigate to: http://localhost:3010/projects/proj001/board

---

## Step 3: Open Task Panel

### How to Open:
1. **From Board View**: Click on any task card
2. **From List View**: Click on any task row
3. **From Calendar View**: Click on any task event

**Expected Result**:
- Panel slides in from the right
- Shows "รายละเอียดงาน" (Task Details) header
- Task information loads

---

## Step 4: Test Each Feature

### 🔹 Basic Information

**What to Test**:
- [ ] Task name displays correctly
- [ ] Description shows
- [ ] Pin button works (click to toggle)
- [ ] Close button (X) works

**How**:
1. Look at the task name at the top
2. Click the pin icon (📌) - should toggle filled/outlined
3. Click X - panel should close

---

### 🔹 Status Slider

**What to Test**:
- [ ] Slider shows project statuses
- [ ] Gradient colors match status colors
- [ ] Can drag to change status
- [ ] Status label updates

**How**:
1. Find the status slider (gradient bar)
2. Drag the slider thumb left/right
3. Watch the status label change
4. Check if "Save Changes" button enables

**Expected Behavior**:
```
[●────────] รอดำเนินการ
   ↓ drag right
[──────●──] กำลังดำเนินการ
   ↓ drag right
[────────●] เสร็จสิ้น
```

---

### 🔹 Assignee Field

**What to Test**:
- [ ] Shows current assignee(s)
- [ ] Can search for users
- [ ] Can select multiple users
- [ ] Avatars display correctly

**How**:
1. Click on the assignee field (shows avatar stacks or "มอบหมายผู้รับผิดชอบ")
2. Dropdown opens with user list
3. Type in search box to filter
4. Click users to select/deselect (checkmark appears)
5. Click "บันทึก" (Save) button

**Expected Result**:
- User list shows real department users
- Avatars appear (or initials if no image)
- Can select multiple users
- Selected users show as stacked avatars

---

### 🔹 Priority & Difficulty

**What to Test**:
- [ ] Priority shows 4 levels (ด่วนที่สุด, ด่วน, ปกติ, ต่ำ)
- [ ] Difficulty shows 3 levels (ง่าย, ปกติ, ยาก)
- [ ] Colors match correctly

**How**:
1. Click priority field (flag icon)
2. Select different priority
3. Click difficulty field
4. Select different difficulty

**Expected Colors**:
- Priority 1 (ด่วนที่สุด): Red
- Priority 2 (ด่วน): Orange
- Priority 3 (ปกติ): Yellow
- Priority 4 (ต่ำ): Green

- Difficulty 1 (ง่าย): Green
- Difficulty 2 (ปกติ): Yellow
- Difficulty 3 (ยาก): Red

---

### 🔹 Date Pickers

**What to Test**:
- [ ] Start date picker opens
- [ ] Due date picker opens
- [ ] Thai locale calendar works
- [ ] Can clear dates

**How**:
1. Click "วันที่เริ่มต้น" (Start Date) field
2. Calendar opens in Thai (Buddhist Era)
3. Click a date
4. Click "Today" button
5. Click "Clear" button
6. Repeat for "วันที่กำหนดเสร็จ" (Due Date)

**Expected**:
- Calendar shows Thai month names
- Year is Buddhist Era (e.g., 2568)
- Selected date displays in format: "21 ตุลาคม 2568"

---

### 🔹 Description

**What to Test**:
- [ ] Can edit description
- [ ] Multi-line text works
- [ ] Changes trigger dirty state

**How**:
1. Click in description textarea
2. Type some text
3. Press Enter for new lines
4. Check if "Save Changes" button enables

---

### 🔹 Subtasks Section

**What to Test**:
- [ ] Shows existing subtasks
- [ ] Each subtask shows status color dot
- [ ] Shows assignee avatar
- [ ] Can click to navigate to subtask
- [ ] "Add Subtask" button works

**How**:
1. Scroll to "งานย่อย" (Subtasks) section
2. If subtasks exist:
   - See colored dots (status indicator)
   - See assignee avatar on right
   - Click on a subtask → Should open that subtask's panel
3. Click "+ เพิ่มงานย่อย" (Add Subtask)
   - Should open Create Task Modal (if implemented)

---

### 🔹 Checklists Section

**What to Test**:
- [ ] Shows existing checklist items
- [ ] Can toggle checkboxes
- [ ] Can add new items
- [ ] Can delete items
- [ ] Optimistic updates work

**How**:
1. Scroll to "Checklists" section
2. **Toggle**: Click checkbox next to an item
   - Should immediately check/uncheck (optimistic update)
3. **Add**:
   - Click "+ เพิ่มรายการ" (Add Item)
   - Type item name
   - Press Enter or click checkmark
4. **Delete**:
   - Hover over item
   - Click trash icon
   - Confirm deletion

**Expected**:
- Checkboxes toggle instantly (before server response)
- New items appear immediately
- Deleted items disappear immediately

---

### 🔹 Comments Section

**What to Test**:
- [ ] Shows existing comments
- [ ] @ mention autocomplete works
- [ ] Can submit comment
- [ ] Mentions are highlighted

**How**:
1. Scroll to "ความคิดเห็น" (Comments) section
2. **Read comments**:
   - See user avatar
   - See comment text
   - See relative time (e.g., "2 hours ago")
   - Mentioned users are highlighted
3. **Add comment**:
   - Click in comment box
   - Type text
   - Type `@` → autocomplete dropdown appears
   - Type a few letters → user list filters
   - Click user to mention
   - Click "ส่ง" (Send) or press Ctrl+Enter

**Expected**:
- Autocomplete shows real users from department
- Mentioned users appear as highlighted tags
- Comment appears in list after submit

---

### 🔹 Save Functionality

**What to Test**:
- [ ] Button is disabled when no changes
- [ ] Button enables when form is dirty
- [ ] Shows loading spinner during save
- [ ] Form resets after successful save
- [ ] Button disables again after save

**How**:
1. **Initial state**: "บันทึกการแก้ไข" button should be disabled
2. **Make changes**: Edit any field (name, priority, date, etc.)
3. **Button enables**: Should now be clickable
4. **Click save**:
   - Button shows "กำลังบันทึก..." with spinner
   - Wait for response
   - Button returns to "บันทึกการแก้ไข" and disables

**Expected**:
```
[No changes] → Button disabled (gray)
     ↓ edit field
[Has changes] → Button enabled (blue)
     ↓ click save
[Saving...] → Button shows spinner
     ↓ success
[Saved] → Button disabled again
```

---

### 🔹 Close Task

**What to Test**:
- [ ] Button label is context-aware
- [ ] Dialog opens
- [ ] Can select COMPLETED/ABORTED
- [ ] Task closes successfully

**How**:
1. **Check button label**:
   - If task is at first status → "ยกเลิกงาน" (Cancel Task)
   - If task is at last status → "ทำสำเร็จ" (Complete Task)
   - Otherwise → "ปิดงาน" (Close Task)
2. **Click button**: Dialog opens
3. **Select option**:
   - ✅ "ทำสำเร็จ (COMPLETED)" - task finished successfully
   - ❌ "ยกเลิก (ABORTED)" - task cancelled
4. **Click "ยืนยัน"** (Confirm)

**Expected**:
- Task status updates to closed
- Task appears in closed section
- Panel may close automatically

---

### 🔹 Permissions

**What to Test**:
- [ ] Fields disable based on role
- [ ] Permission notice appears
- [ ] Non-owners can't edit
- [ ] Closed tasks are read-only

**How**:
1. **Test as Admin** (current login):
   - Should be able to edit everything
2. **Test with closed task**:
   - Find a closed task
   - Open panel
   - All fields should be disabled
   - Notice: "งานนี้ปิดแล้ว ไม่สามารถแก้ไขได้"
3. **Test as non-owner** (requires different login):
   - Login as different user
   - Open task created by someone else
   - May see permission restrictions

---

## Step 5: Test Edge Cases

### Empty States

**Test**:
- [ ] Task with no subtasks → Shows "ยังไม่มีงานย่อย"
- [ ] Task with no checklists → Shows empty state
- [ ] Task with no comments → Shows empty state
- [ ] Task with no assignee → Shows "มอบหมายผู้รับผิดชอบ"

### Loading States

**Test**:
- [ ] Panel shows skeleton loaders while fetching
- [ ] Buttons show spinners during mutations

### Error Handling

**Test**:
- [ ] What happens if save fails? (simulate by stopping server)
- [ ] What happens if network is slow?

---

## Step 6: Check Browser Console

### Open DevTools:
- Press `F12` (Windows/Linux)
- Press `Cmd+Option+I` (Mac)

### Look for:
- ✅ **No errors** in Console tab
- ✅ **Network requests succeed** in Network tab
- ✅ **React Query devtools** (if enabled)

### Expected Network Calls:

When opening task panel:
```
GET /api/tasks/task001          → 200 OK (task data)
GET /api/projects/proj001/board → 200 OK (project + statuses)
GET /api/users?departmentId=... → 200 OK (department users)
```

When saving changes:
```
PATCH /api/tasks/task001 → 200 OK (updated task)
```

---

## Common Issues & Solutions

### Issue: Panel doesn't open
**Solution**:
- Check console for errors
- Verify task ID exists
- Check UIStore state in React DevTools

### Issue: No users in assignee dropdown
**Solution**:
- Check if project has a department
- Verify users exist in that department
- Check network call to `/api/users?departmentId=...`

### Issue: Save button doesn't work
**Solution**:
- Check if form is dirty (make a change)
- Check console for errors
- Verify handleSave is registered (check React DevTools)

### Issue: Status slider doesn't show
**Solution**:
- Verify project has statuses
- Check `/api/projects/:id/board` response
- Look for errors in console

### Issue: Mentions don't work
**Solution**:
- Type `@` to trigger
- Check if users are loaded
- Verify Tribute.js is initialized (check console)

---

## Quick Test Checklist ✅

Use this for rapid testing:

```
□ Open panel from board view
□ Edit task name → Save button enables
□ Change status via slider
□ Select assignee from dropdown
□ Change priority
□ Change difficulty
□ Set start date
□ Set due date
□ Edit description
□ Click subtask to navigate
□ Toggle checklist item
□ Add new checklist item
□ Add comment with @mention
□ Click Save Changes
□ Verify save succeeds
□ Click Close Task
□ Select COMPLETED
□ Confirm close
```

**Expected Time**: ~5 minutes for full test

---

## Advanced Testing (Optional)

### Test with React DevTools

1. **Install**: [React DevTools Extension](https://react.dev/learn/react-developer-tools)
2. **Open**: F12 → "Components" tab
3. **Find**: TaskPanel component
4. **Inspect**:
   - Props: `task`, `users`, `statuses`
   - State: `formState`, `handleSave`
   - Hooks: useTask, useProject, useQuery

### Test with React Query DevTools

1. **Look for**: Floating React Query icon (bottom corner)
2. **Click**: Opens query explorer
3. **Check**:
   - `['tasks', 'detail', 'task001']` → Fresh/Stale?
   - `['projects', 'detail', 'proj001', 'board']` → Cached?
   - `['users', 'department', 'dept001']` → 5min stale time?

### Performance Testing

1. **Open**: Chrome DevTools → Performance tab
2. **Record**: Click record button
3. **Action**: Open task panel
4. **Stop**: Stop recording
5. **Analyze**:
   - Should load in < 500ms
   - No layout shifts
   - Smooth 60fps animation

---

## Reporting Issues

If you find bugs, note:

1. **What you did** (steps to reproduce)
2. **What you expected**
3. **What actually happened**
4. **Browser console errors** (screenshot/copy)
5. **Network requests** (from Network tab)

---

## Success Criteria ✅

Task Panel is working correctly if:

1. ✅ All data loads from real API (no empty arrays)
2. ✅ All fields are editable (when permitted)
3. ✅ Save button enables on changes
4. ✅ Save persists changes to database
5. ✅ All interactive elements respond
6. ✅ No console errors
7. ✅ Animations are smooth
8. ✅ Permissions are respected

**Happy Testing!** 🎉
