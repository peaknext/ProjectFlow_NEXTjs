# Phase 5: Notifications & Activities APIs - Test Guide

## Overview
Phase 5 implements 10 endpoints for notifications management and activity tracking across the system.

## Prerequisites
- Authenticated user session token
- Existing tasks with activities from Phase 4
- Multiple users for testing notifications

## Environment Variables
```bash
export API_URL="http://localhost:3000"
export TOKEN="your-session-token-here"
export USER_ID="your-user-id"
export PROJECT_ID="existing-project-id"
```

---

## 5.1 Notifications Management

### Get All Notifications
```bash
# Get all notifications
curl -X GET "$API_URL/api/notifications" \
  -H "Authorization: Bearer $TOKEN"

# Expected: Array of notifications with task/user details
# Save a notification ID: export NOTIFICATION_ID="..."
```

### Filter Notifications
```bash
# Get only unread notifications
curl -X GET "$API_URL/api/notifications?isRead=false" \
  -H "Authorization: Bearer $TOKEN"

# Get only read notifications
curl -X GET "$API_URL/api/notifications?isRead=true" \
  -H "Authorization: Bearer $TOKEN"

# Filter by notification type
curl -X GET "$API_URL/api/notifications?type=TASK_ASSIGNED" \
  -H "Authorization: Bearer $TOKEN"

# Types: TASK_ASSIGNED, TASK_UPDATED, TASK_CLOSED, COMMENT_MENTION,
#        PROJECT_UPDATED, DEADLINE_APPROACHING, OVERDUE_TASK, SYSTEM_ANNOUNCEMENT

# With pagination
curl -X GET "$API_URL/api/notifications?limit=10&offset=0" \
  -H "Authorization: Bearer $TOKEN"
```

### Mark Single Notification as Read
```bash
curl -X PATCH "$API_URL/api/notifications/$NOTIFICATION_ID" \
  -H "Authorization: Bearer $TOKEN"

# Expected: Notification marked as read, isRead: true
```

### Mark All Notifications as Read
```bash
curl -X POST "$API_URL/api/notifications/mark-all-read" \
  -H "Authorization: Bearer $TOKEN"

# Expected: All unread notifications marked as read, returns count
```

### Get Unread Count (For Badge)
```bash
curl -X GET "$API_URL/api/notifications/unread-count" \
  -H "Authorization: Bearer $TOKEN"

# Expected: { "unreadCount": 5 }
# Use this for badge display in UI
```

### Delete Notification
```bash
curl -X DELETE "$API_URL/api/notifications/$NOTIFICATION_ID" \
  -H "Authorization: Bearer $TOKEN"

# Expected: Notification deleted successfully
```

---

## 5.2 Activity Feed APIs

### System-Wide Activities (Admin View)
```bash
# Requires 'view_activities' permission
curl -X GET "$API_URL/api/activities" \
  -H "Authorization: Bearer $TOKEN"

# Expected: Activities from all users and projects

# With filters
curl -X GET "$API_URL/api/activities?limit=20&offset=0" \
  -H "Authorization: Bearer $TOKEN"

# Filter by entity type
curl -X GET "$API_URL/api/activities?entityType=Task" \
  -H "Authorization: Bearer $TOKEN"
```

### Project Activities
```bash
# Get all activities for a project
curl -X GET "$API_URL/api/projects/$PROJECT_ID/activities" \
  -H "Authorization: Bearer $TOKEN"

# Expected: All task activities within the project

# With pagination
curl -X GET "$API_URL/api/projects/$PROJECT_ID/activities?limit=25&offset=0" \
  -H "Authorization: Bearer $TOKEN"
```

### User Activities
```bash
# Get activities performed by specific user
curl -X GET "$API_URL/api/users/$USER_ID/activities" \
  -H "Authorization: Bearer $TOKEN"

# Expected: All activities the user has performed

# With pagination
curl -X GET "$API_URL/api/users/$USER_ID/activities?limit=30&offset=0" \
  -H "Authorization: Bearer $TOKEN"
```

### Recent Activities (Dashboard View)
```bash
# Get combined feed for dashboard
curl -X GET "$API_URL/api/activities/recent" \
  -H "Authorization: Bearer $TOKEN"

# Expected: Combined feed of:
# - User's own activities
# - Notifications
# - Comments on assigned tasks
# Sorted by timestamp (newest first)

# Limit results
curl -X GET "$API_URL/api/activities/recent?limit=15" \
  -H "Authorization: Bearer $TOKEN"
```

### Activity Statistics
```bash
# Requires 'view_analytics' permission

# Get 7-day stats (default)
curl -X GET "$API_URL/api/activities/stats" \
  -H "Authorization: Bearer $TOKEN"

# Expected: Aggregated stats including:
# - Total activities, comments, notifications
# - Top users by activity
# - Top tasks by activity
# - Daily activity timeline

# Get 30-day stats
curl -X GET "$API_URL/api/activities/stats?period=30" \
  -H "Authorization: Bearer $TOKEN"

# Get 90-day stats
curl -X GET "$API_URL/api/activities/stats?period=90" \
  -H "Authorization: Bearer $TOKEN"

# Filter by project
curl -X GET "$API_URL/api/activities/stats?period=30&projectId=$PROJECT_ID" \
  -H "Authorization: Bearer $TOKEN"

# Filter by user
curl -X GET "$API_URL/api/activities/stats?period=30&userId=$USER_ID" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Complete Test Workflow

### Bash Script for Phase 5 Testing
```bash
#!/bin/bash

# Phase 5 Complete Workflow Test

API_URL="http://localhost:3000"
TOKEN="your-token-here"
PROJECT_ID="your-project-id"

echo "=== Phase 5: Notifications & Activities APIs Test ==="

# 1. Get Unread Count
echo -e "\n1. Checking unread notifications..."
UNREAD_RESPONSE=$(curl -s -X GET "$API_URL/api/notifications/unread-count" \
  -H "Authorization: Bearer $TOKEN")
UNREAD_COUNT=$(echo $UNREAD_RESPONSE | jq -r '.data.unreadCount')
echo "✓ Unread notifications: $UNREAD_COUNT"

# 2. Get Notifications
echo -e "\n2. Fetching notifications..."
NOTIFICATIONS=$(curl -s -X GET "$API_URL/api/notifications?limit=5" \
  -H "Authorization: Bearer $TOKEN")
echo "✓ Recent notifications:"
echo $NOTIFICATIONS | jq '.data.notifications[] | {type, message, isRead}'

# Save first notification ID
NOTIFICATION_ID=$(echo $NOTIFICATIONS | jq -r '.data.notifications[0].id')

# 3. Mark One as Read
if [ "$NOTIFICATION_ID" != "null" ]; then
  echo -e "\n3. Marking notification as read..."
  curl -s -X PATCH "$API_URL/api/notifications/$NOTIFICATION_ID" \
    -H "Authorization: Bearer $TOKEN" > /dev/null
  echo "✓ Notification marked as read"
fi

# 4. Mark All as Read
echo -e "\n4. Marking all notifications as read..."
MARK_ALL=$(curl -s -X POST "$API_URL/api/notifications/mark-all-read" \
  -H "Authorization: Bearer $TOKEN")
MARKED_COUNT=$(echo $MARK_ALL | jq -r '.data.markedCount')
echo "✓ Marked $MARKED_COUNT notifications as read"

# 5. Verify Unread Count is Zero
echo -e "\n5. Verifying unread count..."
UNREAD_RESPONSE=$(curl -s -X GET "$API_URL/api/notifications/unread-count" \
  -H "Authorization: Bearer $TOKEN")
UNREAD_COUNT=$(echo $UNREAD_RESPONSE | jq -r '.data.unreadCount')
echo "✓ Unread notifications now: $UNREAD_COUNT"

# 6. Get Recent Activities for Dashboard
echo -e "\n6. Fetching recent activities..."
RECENT=$(curl -s -X GET "$API_URL/api/activities/recent?limit=10" \
  -H "Authorization: Bearer $TOKEN")
echo "✓ Recent activities:"
echo $RECENT | jq '.data.activities[] | {type, description: (.description[:50]+"...")}'

# 7. Get Project Activities
echo -e "\n7. Fetching project activities..."
PROJECT_ACTIVITIES=$(curl -s -X GET "$API_URL/api/projects/$PROJECT_ID/activities?limit=5" \
  -H "Authorization: Bearer $TOKEN")
ACTIVITY_COUNT=$(echo $PROJECT_ACTIVITIES | jq '.data.total')
echo "✓ Project has $ACTIVITY_COUNT activities"

# 8. Get Activity Stats
echo -e "\n8. Fetching activity statistics (7 days)..."
STATS=$(curl -s -X GET "$API_URL/api/activities/stats?period=7" \
  -H "Authorization: Bearer $TOKEN")
echo "✓ 7-Day Statistics:"
echo $STATS | jq '.data.stats'

echo -e "\n✓ Top Active Users:"
echo $STATS | jq '.data.topUsers[] | {user: .user.fullName, activities: .activityCount}'

echo -e "\n✓ Daily Activity Trend:"
echo $STATS | jq '.data.dailyActivities'

# 9. Get 30-Day Stats
echo -e "\n9. Fetching 30-day statistics..."
STATS_30=$(curl -s -X GET "$API_URL/api/activities/stats?period=30" \
  -H "Authorization: Bearer $TOKEN")
echo "✓ 30-Day Statistics:"
echo $STATS_30 | jq '.data.stats'

echo -e "\n=== Phase 5 Test Complete ==="
```

---

## Notification Types Testing

### Generate Test Notifications
```bash
# To test notifications, perform actions that trigger them:

# 1. TASK_ASSIGNED - Assign task to another user
curl -X POST "$API_URL/api/projects/$PROJECT_ID/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test notification task",
    "statusId": "'$STATUS_ID'",
    "assigneeUserId": "'$OTHER_USER_ID'"
  }'

# 2. COMMENT_MENTION - Add comment with @mention
curl -X POST "$API_URL/api/tasks/$TASK_ID/comments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "@username Please check this task"
  }'

# 3. TASK_UPDATED - Update task assignee
curl -X PATCH "$API_URL/api/tasks/$TASK_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "assigneeUserId": "'$NEW_ASSIGNEE_ID'"
  }'

# 4. TASK_CLOSED - Close a task
curl -X POST "$API_URL/api/tasks/$TASK_ID/close" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "closeType": "COMPLETED",
    "reason": "Task completed successfully"
  }'

# Then check notifications for the affected users
curl -X GET "$API_URL/api/notifications?isRead=false" \
  -H "Authorization: Bearer $AFFECTED_USER_TOKEN"
```

---

## Activity Feed Use Cases

### Use Case 1: Dashboard Recent Activity
```bash
# Display recent activity feed on user dashboard
curl -X GET "$API_URL/api/activities/recent?limit=20" \
  -H "Authorization: Bearer $TOKEN"

# Expected: Combined feed showing:
# - Tasks user created/updated
# - Notifications (assignments, mentions)
# - Comments on user's tasks
# All sorted chronologically
```

### Use Case 2: Project Activity Timeline
```bash
# Show project history timeline
curl -X GET "$API_URL/api/projects/$PROJECT_ID/activities" \
  -H "Authorization: Bearer $TOKEN"

# Expected: All task activities within project
# Use for project audit trail and progress tracking
```

### Use Case 3: User Activity Report
```bash
# Generate user activity report
curl -X GET "$API_URL/api/users/$USER_ID/activities" \
  -H "Authorization: Bearer $TOKEN"

# Expected: All activities performed by user
# Use for productivity tracking and auditing
```

### Use Case 4: Analytics Dashboard
```bash
# Get statistics for admin dashboard
curl -X GET "$API_URL/api/activities/stats?period=30" \
  -H "Authorization: Bearer $TOKEN"

# Expected: Comprehensive stats including:
# - Activity trends over time
# - Most active users
# - Most active tasks/projects
# - Daily activity charts
```

---

## Real-Time Notification Polling

### Implement Polling for Real-Time Updates
```bash
#!/bin/bash

# Continuous polling for new notifications (every 30 seconds)

API_URL="http://localhost:3000"
TOKEN="your-token-here"

while true; do
  # Get unread count
  UNREAD=$(curl -s -X GET "$API_URL/api/notifications/unread-count" \
    -H "Authorization: Bearer $TOKEN" | jq -r '.data.unreadCount')

  if [ "$UNREAD" -gt 0 ]; then
    echo "$(date): You have $UNREAD unread notification(s)"

    # Get unread notifications
    curl -s -X GET "$API_URL/api/notifications?isRead=false&limit=5" \
      -H "Authorization: Bearer $TOKEN" \
      | jq '.data.notifications[] | {type, message}'
  else
    echo "$(date): No new notifications"
  fi

  sleep 30
done
```

---

## Validation Checklist

### Notifications ✓
- [ ] List all notifications with pagination
- [ ] Filter by isRead status
- [ ] Filter by notification type
- [ ] Mark single notification as read
- [ ] Mark all notifications as read
- [ ] Get unread count (for badge)
- [ ] Delete notification
- [ ] Notifications include task and triggeredBy user details
- [ ] Pagination works correctly (limit/offset)

### Activity Feeds ✓
- [ ] System-wide activity feed (admin permission required)
- [ ] Project-specific activity feed
- [ ] User-specific activity feed
- [ ] Recent activities for dashboard (combined feed)
- [ ] Activities include user and task context
- [ ] Activities sorted by timestamp (newest first)
- [ ] Pagination works for all activity endpoints

### Activity Statistics ✓
- [ ] Get 7-day statistics (default)
- [ ] Get 30-day statistics
- [ ] Get 90-day statistics
- [ ] Filter stats by project
- [ ] Filter stats by user
- [ ] Top users by activity count
- [ ] Top tasks by activity count
- [ ] Daily activity timeline
- [ ] Average activities per day calculated
- [ ] Requires view_analytics permission

### Integration ✓
- [ ] Notifications created automatically on task assignment
- [ ] Notifications created on @mentions in comments
- [ ] Notifications created on task updates (assignee change)
- [ ] Activities logged for all CRUD operations
- [ ] Activity history accessible via multiple endpoints
- [ ] Real-time polling works for notifications

---

## Performance Benchmarks

Expected response times:
- Get notifications: < 100ms
- Get unread count: < 30ms (optimized query)
- Mark as read: < 50ms
- Get recent activities: < 150ms
- Get project activities: < 120ms
- Get activity stats: < 200ms

---

## Error Cases to Test

### Notification Errors
```bash
# Notification not found
curl -X PATCH "$API_URL/api/notifications/invalid-id" \
  -H "Authorization: Bearer $TOKEN"
# Expected: 404 NOTIFICATION_NOT_FOUND

# Access other user's notification
curl -X DELETE "$API_URL/api/notifications/$OTHER_USER_NOTIFICATION_ID" \
  -H "Authorization: Bearer $TOKEN"
# Expected: 403 FORBIDDEN
```

### Activity Errors
```bash
# Project not found
curl -X GET "$API_URL/api/projects/invalid-id/activities" \
  -H "Authorization: Bearer $TOKEN"
# Expected: 404 PROJECT_NOT_FOUND

# User not found
curl -X GET "$API_URL/api/users/invalid-id/activities" \
  -H "Authorization: Bearer $TOKEN"
# Expected: 404 USER_NOT_FOUND

# Missing permission for system activities
curl -X GET "$API_URL/api/activities" \
  -H "Authorization: Bearer $NON_ADMIN_TOKEN"
# Expected: 403 FORBIDDEN (requires view_activities permission)

# Missing permission for stats
curl -X GET "$API_URL/api/activities/stats" \
  -H "Authorization: Bearer $NON_ADMIN_TOKEN"
# Expected: 403 FORBIDDEN (requires view_analytics permission)
```

---

## Phase 5 Complete! ✅

All 10 endpoints implemented:
1. ✅ GET /api/notifications
2. ✅ PATCH /api/notifications/:id
3. ✅ DELETE /api/notifications/:id
4. ✅ POST /api/notifications/mark-all-read
5. ✅ GET /api/notifications/unread-count
6. ✅ GET /api/activities (system-wide, requires permission)
7. ✅ GET /api/projects/:projectId/activities
8. ✅ GET /api/users/:userId/activities
9. ✅ GET /api/activities/recent (dashboard view)
10. ✅ GET /api/activities/stats (analytics, requires permission)

**Next Phase**: Phase 6 - Batch Operations & Optimization APIs

---

## Integration with Frontend

### Recommended Frontend Patterns

**1. Notification Badge Component**
```javascript
// Poll every 30 seconds for unread count
useEffect(() => {
  const fetchUnreadCount = async () => {
    const response = await fetch('/api/notifications/unread-count');
    const data = await response.json();
    setUnreadCount(data.data.unreadCount);
  };

  fetchUnreadCount();
  const interval = setInterval(fetchUnreadCount, 30000);
  return () => clearInterval(interval);
}, []);
```

**2. Activity Feed Component**
```javascript
// Infinite scroll for activity feed
const { data, fetchMore } = useInfiniteQuery({
  queryKey: ['activities', 'recent'],
  queryFn: ({ pageParam = 0 }) =>
    fetch(`/api/activities/recent?limit=20&offset=${pageParam}`),
  getNextPageParam: (lastPage) =>
    lastPage.data.hasMore ? lastPage.data.offset + lastPage.data.limit : undefined
});
```

**3. Real-time Notifications**
```javascript
// Consider implementing WebSocket for real-time updates
// Fallback to polling for now
usePolling('/api/notifications?isRead=false', {
  interval: 30000,
  onNewData: (notifications) => {
    // Show toast/alert for new notifications
    notifications.forEach(notif => showToast(notif.message));
  }
});
```

---

**Document Status:** ✅ COMPLETE
**Total Progress:** 68 of 71 endpoints complete (96%)
