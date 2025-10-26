# Notification Creation Bug Fix

**Date**: 2025-10-26
**Severity**: HIGH
**Status**: 🔧 **FIXING IN PROGRESS**

---

## Issue Description

**Reported By**: User (Production Testing)

**Issues Identified**:
1. **Mention notifications not created**: When users mention others with @, no notification is created
2. **Task assignment notifications not created**: When tasks are assigned, no notification is sent to assignees
3. **Polling works but shows no new notifications**: Notification polling is working (fetches every 60s) but has nothing to show because notifications are never created

### Root Cause

**Notification creation code is completely disabled** across multiple API endpoints with TODO comments:

#### 1. Comment/Mention Route (`src/app/api/tasks/[taskId]/comments/route.ts`)
Lines 138-169: Notification creation for mentions is **commented out**

```typescript
// Notify mentioned users (if any)
// TODO: Implement notification system
// if (mentionedUserIds.length > 0) {
//   await prisma.notification.createMany({
//     data: mentionedUserIds.map(userId => ({
//       userId,
//       type: 'MENTIONED_IN_COMMENT',
//       ...
//     })),
//   },
// });
```

#### 2. Task Assignment Route (`src/app/api/tasks/[taskId]/route.ts`)
Lines 385-419: Task assignment change tracking exists, but **NO notification creation** for new assignees

**Result**: Users who are mentioned or assigned to tasks receive NO notifications, making the notification system appear broken.

---

## Impact

**User Experience**:
- ❌ Users don't know when they're mentioned in comments
- ❌ Users don't know when tasks are assigned to them
- ❌ Notification bell never shows new notifications (always 0)
- ❌ Users think notification system is broken

**System Behavior**:
- ✅ Notification polling works correctly (fetches every 60s)
- ✅ Auto-mark as read works correctly
- ✅ Frontend UI works correctly
- ❌ **Backend never creates notifications**

---

## User Confusion About "Different Profile Pictures"

### What the User Reported
User opened fresh incognito tab, logged in, saw 4 notifications with "different profile pictures, different activities" and thought they were seeing other users' notifications.

### Actual Behavior (CORRECT)
The 4 notifications belong to the logged-in user, but each notification shows the **triggeredBy user's** profile picture (the person who performed the action), which is EXPECTED:

**Example**:
- "John assigned you to task X" → Shows John's profile picture ✅
- "Mary commented on task Y" → Shows Mary's profile picture ✅
- "David updated task Z" → Shows David's profile picture ✅

All 3 notifications belong to YOU (the recipient), but show different triggeredBy users' pictures.

**Notification Schema**:
```typescript
{
  id: string,
  userId: string,              // ← Recipient (owner of notification)
  triggeredByUserId: string,   // ← Person who triggered the action
  message: string,
  taskId: string,
  type: NotificationType,
  isRead: boolean,
}
```

**Frontend Display** (`src/components/notifications/notification-item.tsx`):
- Shows `triggeredBy.profileImageUrl` (correct)
- Shows `message` which includes triggeredBy.fullName
- Shows `task.name` as context

**Conclusion**: The "different profile pictures" issue is a **misunderstanding of expected behavior**, NOT a data leakage bug.

---

## Data Leakage Investigation

### Previously Suspected Issue (RESOLVED)
Earlier fix attempt added `queryClient.clear()` in login mutation's `onMutate` hook to prevent React Query cache from persisting between user sessions.

**Verification**:
- ✅ `.env` has `BYPASS_AUTH=false` (normal auth enabled)
- ✅ `BYPASS_USER_ID=cmh54o5rn00099iugu3rlq0px` is set but NOT used (only used when BYPASS_AUTH=true)
- ✅ Incognito mode testing shows no localStorage or cache
- ✅ Session-based authentication working correctly

**Conclusion**: No data leakage issue exists. The earlier fix is still valid for non-incognito mode cache clearing during logout→login flows.

---

## Solution Required

### Phase 1: Enable Notification Creation for Mentions ⚠️ REQUIRED

**File**: `src/app/api/tasks/[taskId]/comments/route.ts`

**Action**: Uncomment and fix notification creation code (lines 138-169)

```typescript
// After creating comment (line 136), add:

// Create notifications for mentioned users
if (mentionedUserIds.length > 0) {
  const currentUserFullName = req.session.user.fullName;

  // Fetch mentioned users to validate they exist
  const mentionedUsers = await prisma.user.findMany({
    where: { id: { in: mentionedUserIds } },
    select: { id: true },
  });

  const validUserIds = mentionedUsers.map(u => u.id);

  // Create notification for each mentioned user (except self)
  const notificationData = validUserIds
    .filter(userId => userId !== req.session.userId) // Don't notify self
    .map(userId => ({
      userId,
      type: 'COMMENT_MENTION',
      message: `${currentUserFullName} ได้แท็กคุณในความคิดเห็น`,
      taskId,
      triggeredByUserId: req.session.userId,
    }));

  if (notificationData.length > 0) {
    await prisma.notification.createMany({
      data: notificationData,
    });
  }
}
```

### Phase 2: Add Notification Creation for Task Assignments ⚠️ REQUIRED

**File**: `src/app/api/tasks/[taskId]/route.ts`

**Action**: Add notification creation after assignee changes (after line 419)

```typescript
// After logging assignee additions to history (around line 405), add:

// Create notifications for newly assigned users
if (added.length > 0) {
  const currentUserFullName = req.session.user.fullName;

  const notificationData = added
    .filter((userId: string) => userId !== req.session.userId) // Don't notify self
    .map((userId: string) => ({
      userId,
      type: 'TASK_ASSIGNED',
      message: `${currentUserFullName} ได้มอบหมายงาน "${updatedTask.name}" ให้กับคุณ`,
      taskId,
      triggeredByUserId: req.session.userId,
    }));

  if (notificationData.length > 0) {
    await prisma.notification.createMany({
      data: notificationData,
    });
  }
}
```

### Phase 3: Add Notification Creation for Task Creation 🔄 OPTIONAL

**File**: `src/app/api/projects/[projectId]/tasks/route.ts`

**Action**: Add notification when new task is assigned during creation

### Phase 4: Add Notification Creation for Other Events 🔄 FUTURE

**Future notification types to implement**:
- `TASK_UPDATED` - When task details change
- `TASK_CLOSED` - When task is closed
- `PROJECT_UPDATED` - When project changes affect user's tasks
- `TASK_DUE_SOON` - Scheduled notifications for upcoming deadlines (requires cron job)

---

## Testing Plan

### Test 1: Comment Mention Notification
**Prerequisites**: 2 user accounts (User A, User B)

**Steps**:
1. Login as User A
2. Open any task
3. Add comment mentioning User B: "@User B please review this"
4. Login as User B in different browser/incognito
5. Check notification bell

**Expected**:
- ✅ Bell shows "1" badge (unread count)
- ✅ Dropdown shows notification: "User A ได้แท็กคุณในความคิดเห็น"
- ✅ Clicking notification opens task panel
- ✅ After 2.5s, notification marked as read, badge shows "0"

### Test 2: Task Assignment Notification
**Prerequisites**: 2 user accounts (User A, User B)

**Steps**:
1. Login as User A (must have permission to edit task)
2. Open any task
3. Change assignee to User B (use Assignee dropdown)
4. Login as User B in different browser/incognito
5. Check notification bell

**Expected**:
- ✅ Bell shows "1" badge
- ✅ Dropdown shows: "User A ได้มอบหมายงาน 'Task Name' ให้กับคุณ"
- ✅ Clicking notification opens task panel
- ✅ After 2.5s, notification marked as read

### Test 3: Multi-Mention Notification
**Prerequisites**: 3 user accounts (User A, User B, User C)

**Steps**:
1. Login as User A
2. Add comment mentioning both: "@User B @User C please check"
3. Login as User B - should see 1 notification
4. Login as User C - should see 1 notification

**Expected**:
- ✅ Both User B and User C receive separate notifications
- ✅ User A does NOT receive a notification (self-mention filtered)

### Test 4: Notification Polling
**Prerequisites**: 2 browser tabs/windows

**Steps**:
1. Tab 1: Login as User B, keep notification dropdown CLOSED
2. Tab 2: Login as User A, mention User B in a comment
3. Wait 60 seconds (polling interval)
4. Tab 1: Check notification bell (WITHOUT refreshing page)

**Expected**:
- ✅ Bell badge updates from "0" to "1" automatically (polling detected new notification)
- ✅ No page refresh required

---

## Database Schema Verification

**Notification Table** (`prisma/schema.prisma`):
```prisma
model Notification {
  id                String           @id @default(cuid())
  userId            String           // Recipient
  type              NotificationType
  message           String
  isRead            Boolean          @default(false)
  taskId            String?
  projectId         String?
  triggeredByUserId String?
  createdAt         DateTime         @default(now())

  user              User             @relation("UserNotifications", fields: [userId], references: [id])
  triggeredBy       User?            @relation("TriggeredNotifications", fields: [triggeredByUserId], references: [id])
  task              Task?            @relation(fields: [taskId], references: [id])

  @@index([userId])
  @@index([isRead])
  @@map("notifications")
}

enum NotificationType {
  TASK_ASSIGNED
  COMMENT_MENTION
  TASK_UPDATED
  TASK_CLOSED
  PROJECT_UPDATED
}
```

**Verified**: Schema supports all required notification types ✅

---

## Related Files

### Modified (Phase 1 & 2)
- `src/app/api/tasks/[taskId]/comments/route.ts` - Enable mention notifications
- `src/app/api/tasks/[taskId]/route.ts` - Add assignment notifications

### Analyzed (No Changes Needed)
- `src/hooks/use-notifications.ts` - Frontend hooks work correctly
- `src/components/notifications/notification-bell.tsx` - Bell polling works correctly
- `src/components/notifications/notification-dropdown.tsx` - Auto-mark as read works
- `src/lib/notification-utils.ts` - Display utilities work correctly
- `src/lib/api-middleware.ts` - Session auth works correctly
- `DATA_LEAKAGE_SECURITY_FIX.md` - Previous fix is still valid

---

## Implementation Summary

### ✅ Phase 1: Comment Mention Notifications
**File**: `src/app/api/tasks/[taskId]/comments/route.ts` (Lines 138-166)

**Changes**:
- Uncommented and implemented notification creation for mentions
- Validates mentioned users exist before creating notifications
- Filters out self-mentions (don't notify yourself)
- Creates bulk notifications using `createMany()`

**Code Added**: 28 lines

### ✅ Phase 2: Task Assignment Notifications
**File**: `src/app/api/tasks/[taskId]/route.ts` (Lines 406-422, 460-471, 485-496)

**Changes**:
- Multi-assignee support: Notifications when users added to task (lines 406-422)
- Legacy single-assignee: Notifications when task first assigned (lines 460-471)
- Legacy reassignment: Notifications when assignee changed (lines 485-496)
- Filters out self-assignments in all cases

**Code Added**: 42 lines (3 locations)

### ✅ Phase 3: Task Creation Notifications (Already Implemented + Enhanced)
**File**: `src/app/api/projects/[projectId]/tasks/route.ts` (Lines 259-284)

**Changes**:
- Enhanced existing single-assignee notification to support multi-assignee
- Added TaskAssignee table sync for multi-assignee support
- Creates bulk notifications for all assigned users (except creator)

**Code Enhanced**: 25 lines

**Total Code Changed**: 95 lines across 3 files

---

## Checklist

- [x] Phase 1: Enable mention notifications (comments route)
- [x] Phase 2: Add assignment notifications (task update route)
- [x] Phase 3: Enhanced task creation notifications (multi-assignee)
- [ ] Test mention notifications (Test 1) ⚠️ **USER TESTING REQUIRED**
- [ ] Test assignment notifications (Test 2) ⚠️ **USER TESTING REQUIRED**
- [ ] Test task creation notifications ⚠️ **USER TESTING REQUIRED**
- [ ] Test multi-mention (Test 3) ⚠️ **USER TESTING REQUIRED**
- [ ] Test polling (Test 4) ⚠️ **USER TESTING REQUIRED**
- [x] Remove TODO comments (all removed)
- [ ] Update NOTIFICATION_SYSTEM_IMPLEMENTATION.md
- [ ] Mark as complete after testing

---

## Testing Status

**Implementation**: ✅ COMPLETE (2025-10-26)
**Testing**: ⚠️ PENDING USER VERIFICATION

**Next Steps for User**:
1. Test comment mentions (see Test 1 above)
2. Test task assignments (see Test 2 above)
3. Verify notification polling works (see Test 4 above)
4. Report any issues found

---

**End of Document**
