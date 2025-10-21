# Phase 4: Task Management APIs - Test Guide

## Overview
Phase 4 implements 13 endpoints for complete task lifecycle management including tasks, comments, checklists, history, and pinned tasks.

## Prerequisites
- Authenticated user session token
- Existing project with statuses from Phase 3
- User has appropriate permissions

## Environment Variables
```bash
export API_URL="http://localhost:3000"
export TOKEN="your-session-token-here"
export PROJECT_ID="existing-project-id"
export STATUS_ID="existing-status-id"
```

---

## 4.1 Task Management

### Create Task
```bash
# Create a simple task
curl -X POST "$API_URL/api/projects/$PROJECT_ID/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Implement user authentication",
    "description": "Add JWT-based authentication system",
    "statusId": "'$STATUS_ID'",
    "priority": 1,
    "difficulty": 3,
    "dueDate": "2025-11-30T23:59:59Z"
  }'

# Expected: 201 Created
# Save task ID: export TASK_ID="..."
```

### Create Task with Assignee
```bash
# Get a user ID first
curl -X GET "$API_URL/api/users?limit=1" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.data.users[0].id'

export ASSIGNEE_ID="user-id-here"

# Create task with assignee
curl -X POST "$API_URL/api/projects/$PROJECT_ID/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Design database schema",
    "description": "Create ERD for new features",
    "statusId": "'$STATUS_ID'",
    "assigneeUserId": "'$ASSIGNEE_ID'",
    "priority": 2,
    "difficulty": 4,
    "startDate": "2025-10-22T00:00:00Z",
    "dueDate": "2025-10-28T23:59:59Z"
  }'

# Expected: Task created + notification sent to assignee
```

### Create Subtask
```bash
curl -X POST "$API_URL/api/projects/$PROJECT_ID/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Research authentication libraries",
    "statusId": "'$STATUS_ID'",
    "priority": 3,
    "parentTaskId": "'$TASK_ID'"
  }'

# Expected: Subtask linked to parent task
```

### List Tasks
```bash
# Get all tasks in project
curl -X GET "$API_URL/api/projects/$PROJECT_ID/tasks" \
  -H "Authorization: Bearer $TOKEN"

# Filter by status
curl -X GET "$API_URL/api/projects/$PROJECT_ID/tasks?statusId=$STATUS_ID" \
  -H "Authorization: Bearer $TOKEN"

# Filter by assignee
curl -X GET "$API_URL/api/projects/$PROJECT_ID/tasks?assigneeId=$ASSIGNEE_ID" \
  -H "Authorization: Bearer $TOKEN"

# Filter by priority
curl -X GET "$API_URL/api/projects/$PROJECT_ID/tasks?priority=1" \
  -H "Authorization: Bearer $TOKEN"

# Get closed tasks only
curl -X GET "$API_URL/api/projects/$PROJECT_ID/tasks?isClosed=true" \
  -H "Authorization: Bearer $TOKEN"

# Get open tasks only
curl -X GET "$API_URL/api/projects/$PROJECT_ID/tasks?isClosed=false" \
  -H "Authorization: Bearer $TOKEN"

# Search by name
curl -X GET "$API_URL/api/projects/$PROJECT_ID/tasks?search=authentication" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Single Task
```bash
curl -X GET "$API_URL/api/tasks/$TASK_ID" \
  -H "Authorization: Bearer $TOKEN"

# Expected: Full task details with assignee, status, creator, subtasks, checklists
```

### Update Task
```bash
# Update task name and priority
curl -X PATCH "$API_URL/api/tasks/$TASK_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Implement JWT authentication",
    "priority": 1
  }'

# Change assignee (triggers notification)
curl -X PATCH "$API_URL/api/tasks/$TASK_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "assigneeUserId": "'$ASSIGNEE_ID'"
  }'

# Change status
curl -X PATCH "$API_URL/api/tasks/$TASK_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "statusId": "'$STATUS_ID'"
  }'

# Update dates
curl -X PATCH "$API_URL/api/tasks/$TASK_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2025-10-21T00:00:00Z",
    "dueDate": "2025-10-25T23:59:59Z"
  }'
```

### Close Task
```bash
# Close as COMPLETED
curl -X POST "$API_URL/api/tasks/$TASK_ID/close" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "closeType": "COMPLETED",
    "reason": "All requirements met and tested successfully"
  }'

# Close as ABORTED
curl -X POST "$API_URL/api/tasks/$TASK_ID/close" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "closeType": "ABORTED",
    "reason": "Requirements changed, feature no longer needed"
  }'

# Expected: Task marked as closed, activity logged
```

### Delete Task
```bash
curl -X DELETE "$API_URL/api/tasks/$TASK_ID" \
  -H "Authorization: Bearer $TOKEN"

# Expected: Soft delete, task marked as deleted
```

---

## 4.2 Comments

### Add Comment
```bash
# Simple comment
curl -X POST "$API_URL/api/tasks/$TASK_ID/comments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Great progress on this task!"
  }'

# Expected: 201 Created, save COMMENT_ID
export COMMENT_ID="..."
```

### Comment with @mention
```bash
# Get user for mention
curl -X GET "$API_URL/api/users/mentions?q=john" \
  -H "Authorization: Bearer $TOKEN"

# Comment with mention (triggers notification)
curl -X POST "$API_URL/api/tasks/$TASK_ID/comments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "@john.doe Please review the authentication implementation"
  }'

# Expected: Comment created + notification sent to mentioned user
```

### List Comments
```bash
curl -X GET "$API_URL/api/tasks/$TASK_ID/comments" \
  -H "Authorization: Bearer $TOKEN"

# Expected: Array of comments with user details, sorted by newest first
```

---

## 4.3 Checklists (HIGH PRIORITY)

### Create Checklist Items
```bash
# Create first item
curl -X POST "$API_URL/api/tasks/$TASK_ID/checklists" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Research JWT libraries"
  }'

# Expected: 201 Created, auto-order = 1
export ITEM_ID_1="..."

# Create second item
curl -X POST "$API_URL/api/tasks/$TASK_ID/checklists" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Implement login endpoint"
  }'

# Expected: auto-order = 2
export ITEM_ID_2="..."

# Create with specific order
curl -X POST "$API_URL/api/tasks/$TASK_ID/checklists" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Write unit tests",
    "order": 10
  }'
```

### List Checklist Items
```bash
curl -X GET "$API_URL/api/tasks/$TASK_ID/checklists" \
  -H "Authorization: Bearer $TOKEN"

# Expected: Array sorted by order, includes total and completed count
```

### Update Checklist Item
```bash
# Mark as checked
curl -X PATCH "$API_URL/api/tasks/$TASK_ID/checklists/$ITEM_ID_1" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "isChecked": true
  }'

# Expected: Item updated, activity logged

# Rename item
curl -X PATCH "$API_URL/api/tasks/$TASK_ID/checklists/$ITEM_ID_2" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Implement login and register endpoints"
  }'

# Reorder item
curl -X PATCH "$API_URL/api/tasks/$TASK_ID/checklists/$ITEM_ID_2" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "order": 5
  }'
```

### Delete Checklist Item
```bash
curl -X DELETE "$API_URL/api/tasks/$TASK_ID/checklists/$ITEM_ID_1" \
  -H "Authorization: Bearer $TOKEN"

# Expected: Soft delete, activity logged
```

---

## 4.4 Task History

### Get Activity History
```bash
curl -X GET "$API_URL/api/tasks/$TASK_ID/history" \
  -H "Authorization: Bearer $TOKEN"

# Expected: Activity log with human-readable Thai descriptions

# Limit results
curl -X GET "$API_URL/api/tasks/$TASK_ID/history?limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 4.5 Pinned Tasks

### Pin a Task
```bash
curl -X POST "$API_URL/api/users/me/pinned-tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "'$TASK_ID'"
  }'

# Expected: 201 Created, task pinned for quick access
```

### List Pinned Tasks
```bash
curl -X GET "$API_URL/api/users/me/pinned-tasks" \
  -H "Authorization: Bearer $TOKEN"

# Expected: Array of pinned tasks with full details (status, assignee, project, counts)
```

### Unpin a Task
```bash
curl -X DELETE "$API_URL/api/users/me/pinned-tasks/$TASK_ID" \
  -H "Authorization: Bearer $TOKEN"

# Expected: Task unpinned successfully
```

---

## Complete Test Workflow

### Bash Script for Full Task Lifecycle
```bash
#!/bin/bash

# Phase 4 Complete Workflow Test

API_URL="http://localhost:3000"
TOKEN="your-token-here"
PROJECT_ID="your-project-id"
STATUS_ID="your-status-id"

echo "=== Phase 4: Task Management APIs Test ==="

# 1. Create Task
echo -e "\n1. Creating task..."
TASK_RESPONSE=$(curl -s -X POST "$API_URL/api/projects/$PROJECT_ID/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Build payment integration",
    "description": "Integrate Stripe payment gateway",
    "statusId": "'$STATUS_ID'",
    "priority": 1,
    "difficulty": 4,
    "dueDate": "2025-11-15T23:59:59Z"
  }')

TASK_ID=$(echo $TASK_RESPONSE | jq -r '.data.task.id')
echo "✓ Task created: $TASK_ID"

# 2. Add Checklists
echo -e "\n2. Adding checklist items..."
curl -s -X POST "$API_URL/api/tasks/$TASK_ID/checklists" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Research Stripe API"}' > /dev/null

ITEM_RESPONSE=$(curl -s -X POST "$API_URL/api/tasks/$TASK_ID/checklists" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Implement payment endpoint"}')

ITEM_ID=$(echo $ITEM_RESPONSE | jq -r '.data.item.id')
echo "✓ Checklist items added"

# 3. Add Comment
echo -e "\n3. Adding comment..."
curl -s -X POST "$API_URL/api/tasks/$TASK_ID/comments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text": "Started working on Stripe integration"}' > /dev/null
echo "✓ Comment added"

# 4. Update Checklist (mark as checked)
echo -e "\n4. Marking checklist item as done..."
curl -s -X PATCH "$API_URL/api/tasks/$TASK_ID/checklists/$ITEM_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isChecked": true}' > /dev/null
echo "✓ Checklist item checked"

# 5. Pin Task
echo -e "\n5. Pinning task..."
curl -s -X POST "$API_URL/api/users/me/pinned-tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"taskId": "'$TASK_ID'"}' > /dev/null
echo "✓ Task pinned"

# 6. Get Task Details
echo -e "\n6. Fetching task details..."
TASK_DETAILS=$(curl -s -X GET "$API_URL/api/tasks/$TASK_ID" \
  -H "Authorization: Bearer $TOKEN")
echo "✓ Task details:"
echo $TASK_DETAILS | jq '{
  name: .data.task.name,
  priority: .data.task.priority,
  checklistCount: .data.task.checklistItems | length,
  commentCount: .data.task._count.comments
}'

# 7. Get History
echo -e "\n7. Fetching task history..."
HISTORY=$(curl -s -X GET "$API_URL/api/tasks/$TASK_ID/history?limit=5" \
  -H "Authorization: Bearer $TOKEN")
echo "✓ Recent activities:"
echo $HISTORY | jq '.data.history[] | {actionType, description}'

# 8. Close Task
echo -e "\n8. Closing task..."
curl -s -X POST "$API_URL/api/tasks/$TASK_ID/close" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "closeType": "COMPLETED",
    "reason": "Payment integration completed and tested"
  }' > /dev/null
echo "✓ Task closed as COMPLETED"

# 9. Verify Pinned Tasks
echo -e "\n9. Checking pinned tasks..."
PINNED=$(curl -s -X GET "$API_URL/api/users/me/pinned-tasks" \
  -H "Authorization: Bearer $TOKEN")
echo "✓ Pinned tasks count: $(echo $PINNED | jq '.data.total')"

# 10. Unpin Task
echo -e "\n10. Unpinning task..."
curl -s -X DELETE "$API_URL/api/users/me/pinned-tasks/$TASK_ID" \
  -H "Authorization: Bearer $TOKEN" > /dev/null
echo "✓ Task unpinned"

echo -e "\n=== Phase 4 Test Complete ==="
```

---

## Validation Checklist

### Task Management ✓
- [ ] Create task with all fields
- [ ] Create task with minimal fields
- [ ] Create subtask (with parentTaskId)
- [ ] List tasks with various filters
- [ ] Get single task details
- [ ] Update task (name, priority, status, assignee, dates)
- [ ] Close task as COMPLETED
- [ ] Close task as ABORTED
- [ ] Delete task (soft delete)
- [ ] Assignee receives notification on task creation/update

### Comments ✓
- [ ] Create comment
- [ ] Create comment with @mention
- [ ] List comments for task
- [ ] Mentioned users receive notifications
- [ ] Comments sorted by newest first

### Checklists ✓
- [ ] Create checklist item (auto-order)
- [ ] Create checklist item with specific order
- [ ] List checklist items (ordered)
- [ ] Update checklist item name
- [ ] Mark checklist item as checked
- [ ] Reorder checklist item
- [ ] Delete checklist item
- [ ] Checklist statistics (total, completed) calculated correctly

### History ✓
- [ ] View task activity history
- [ ] History includes all CRUD operations
- [ ] History shows human-readable Thai descriptions
- [ ] History ordered by newest first
- [ ] Limit parameter works

### Pinned Tasks ✓
- [ ] Pin a task
- [ ] Cannot pin same task twice
- [ ] List pinned tasks with full details
- [ ] Unpin a task
- [ ] Cannot unpin non-pinned task

### Permissions ✓
- [ ] Users can only edit tasks they have permission for
- [ ] Permission checks for project access
- [ ] Permission checks for task operations
- [ ] Activity logs created for all operations

---

## Performance Benchmarks

Expected response times:
- Create task: < 100ms
- List tasks (50 items): < 150ms
- Get task details: < 80ms
- Create comment: < 80ms
- Create checklist item: < 70ms
- Get task history: < 100ms
- Pin/unpin task: < 50ms

---

## Error Cases to Test

### Task Errors
```bash
# Task not found
curl -X GET "$API_URL/api/tasks/invalid-id" \
  -H "Authorization: Bearer $TOKEN"
# Expected: 404 TASK_NOT_FOUND

# Invalid status ID
curl -X POST "$API_URL/api/projects/$PROJECT_ID/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test", "statusId": "invalid-status"}'
# Expected: 400 INVALID_STATUS

# Close already closed task
curl -X POST "$API_URL/api/tasks/$TASK_ID/close" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"closeType": "COMPLETED"}'
# Expected: 400 TASK_ALREADY_CLOSED
```

### Checklist Errors
```bash
# Checklist item not found
curl -X PATCH "$API_URL/api/tasks/$TASK_ID/checklists/invalid-id" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isChecked": true}'
# Expected: 404 ITEM_NOT_FOUND

# Item belongs to different task
curl -X DELETE "$API_URL/api/tasks/wrong-task-id/checklists/$ITEM_ID" \
  -H "Authorization: Bearer $TOKEN"
# Expected: 400 INVALID_TASK
```

### Pinned Tasks Errors
```bash
# Pin already pinned task
curl -X POST "$API_URL/api/users/me/pinned-tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"taskId": "'$TASK_ID'"}'
# Expected: 400 ALREADY_PINNED

# Unpin non-pinned task
curl -X DELETE "$API_URL/api/users/me/pinned-tasks/non-pinned-task-id" \
  -H "Authorization: Bearer $TOKEN"
# Expected: 404 NOT_PINNED
```

---

## Phase 4 Complete! ✅

All 13 endpoints implemented:
1. ✅ POST /api/projects/:projectId/tasks
2. ✅ GET /api/projects/:projectId/tasks
3. ✅ GET /api/tasks/:taskId
4. ✅ PATCH /api/tasks/:taskId
5. ✅ DELETE /api/tasks/:taskId
6. ✅ POST /api/tasks/:taskId/close
7. ✅ POST /api/tasks/:taskId/comments
8. ✅ GET /api/tasks/:taskId/comments
9. ✅ GET /api/tasks/:taskId/history
10. ✅ POST /api/tasks/:taskId/checklists
11. ✅ GET /api/tasks/:taskId/checklists
12. ✅ PATCH /api/tasks/:taskId/checklists/:itemId
13. ✅ DELETE /api/tasks/:taskId/checklists/:itemId
14. ✅ GET /api/users/me/pinned-tasks
15. ✅ POST /api/users/me/pinned-tasks
16. ✅ DELETE /api/users/me/pinned-tasks/:taskId

**Next Phase**: Phase 5 - Notifications & Activities APIs
