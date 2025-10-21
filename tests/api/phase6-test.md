# Phase 6: Batch Operations & Optimization - Test Guide

## Overview
Phase 6 implements 3 high-performance batch endpoints that optimize multiple operations into single API calls, reducing network overhead and improving application performance.

## Prerequisites
- Authenticated user session token
- Multiple projects with tasks from previous phases
- Tasks with checklists and subtasks

## Environment Variables
```bash
export API_URL="http://localhost:3000"
export TOKEN="your-session-token-here"
export PROJECT_ID="existing-project-id"
export TASK_ID_1="first-task-id"
export TASK_ID_2="second-task-id"
export TASK_ID_3="third-task-id"
```

---

## 6.1 Batch Operations API (PERFORMANCE CRITICAL)

### Single Operation Types

#### Update Task Field
```bash
curl -X POST "$API_URL/api/batch" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "operations": [
      {
        "type": "UPDATE_TASK_FIELD",
        "taskId": "'$TASK_ID_1'",
        "field": "priority",
        "value": 1
      }
    ]
  }'

# Supported fields: name, description, priority, difficulty, dueDate, startDate
```

#### Update Task Status
```bash
curl -X POST "$API_URL/api/batch" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "operations": [
      {
        "type": "UPDATE_TASK_STATUS",
        "taskId": "'$TASK_ID_1'",
        "statusId": "'$NEW_STATUS_ID'"
      }
    ]
  }'
```

#### Update Task Assignee
```bash
curl -X POST "$API_URL/api/batch" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "operations": [
      {
        "type": "UPDATE_TASK_ASSIGNEE",
        "taskId": "'$TASK_ID_1'",
        "assigneeUserId": "'$USER_ID'"
      }
    ]
  }'

# Set to null to remove assignee
```

#### Update Checklist Status
```bash
# First get checklist item ID
CHECKLIST_ITEMS=$(curl -s -X GET "$API_URL/api/tasks/$TASK_ID_1/checklists" \
  -H "Authorization: Bearer $TOKEN")
ITEM_ID=$(echo $CHECKLIST_ITEMS | jq -r '.data.items[0].id')

curl -X POST "$API_URL/api/batch" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "operations": [
      {
        "type": "UPDATE_CHECKLIST_STATUS",
        "itemId": "'$ITEM_ID'",
        "isChecked": true
      }
    ]
  }'
```

#### Add Checklist Item
```bash
curl -X POST "$API_URL/api/batch" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "operations": [
      {
        "type": "ADD_CHECKLIST_ITEM",
        "taskId": "'$TASK_ID_1'",
        "name": "Review code",
        "order": 1
      }
    ]
  }'
```

### Multiple Operations (Batch)

#### Update Multiple Tasks at Once
```bash
curl -X POST "$API_URL/api/batch" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "operations": [
      {
        "type": "UPDATE_TASK_FIELD",
        "taskId": "'$TASK_ID_1'",
        "field": "priority",
        "value": 1
      },
      {
        "type": "UPDATE_TASK_FIELD",
        "taskId": "'$TASK_ID_2'",
        "field": "priority",
        "value": 2
      },
      {
        "type": "UPDATE_TASK_FIELD",
        "taskId": "'$TASK_ID_3'",
        "field": "priority",
        "value": 3
      }
    ]
  }'

# Expected: All 3 tasks updated in single transaction
# Response includes individual results for each operation
```

#### Mixed Operations in Single Request
```bash
curl -X POST "$API_URL/api/batch" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "operations": [
      {
        "type": "UPDATE_TASK_STATUS",
        "taskId": "'$TASK_ID_1'",
        "statusId": "'$IN_PROGRESS_STATUS_ID'"
      },
      {
        "type": "UPDATE_TASK_ASSIGNEE",
        "taskId": "'$TASK_ID_1'",
        "assigneeUserId": "'$USER_ID'"
      },
      {
        "type": "ADD_CHECKLIST_ITEM",
        "taskId": "'$TASK_ID_1'",
        "name": "Initial setup"
      },
      {
        "type": "ADD_CHECKLIST_ITEM",
        "taskId": "'$TASK_ID_1'",
        "name": "Configure environment"
      },
      {
        "type": "UPDATE_TASK_FIELD",
        "taskId": "'$TASK_ID_2'",
        "field": "priority",
        "value": 1
      }
    ]
  }'

# Expected: All operations executed in single transaction
# If any operation fails, others still proceed (partial success allowed)
```

#### Bulk Checklist Updates
```bash
# Update multiple checklist items at once
curl -X POST "$API_URL/api/batch" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "operations": [
      {
        "type": "UPDATE_CHECKLIST_STATUS",
        "itemId": "'$ITEM_ID_1'",
        "isChecked": true
      },
      {
        "type": "UPDATE_CHECKLIST_STATUS",
        "itemId": "'$ITEM_ID_2'",
        "isChecked": true
      },
      {
        "type": "UPDATE_CHECKLIST_STATUS",
        "itemId": "'$ITEM_ID_3'",
        "isChecked": true
      },
      {
        "type": "UPDATE_CHECKLIST_STATUS",
        "itemId": "'$ITEM_ID_4'",
        "isChecked": true
      }
    ]
  }'

# Use case: Mark all checklist items as complete at once
```

---

## 6.2 Batch Status Creation (From Phase 3)

### Create Multiple Statuses for New Project
```bash
curl -X POST "$API_URL/api/projects/$PROJECT_ID/statuses/batch" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "statuses": [
      {
        "name": "Backlog",
        "color": "#94a3b8",
        "type": "NOT_STARTED",
        "order": 1
      },
      {
        "name": "Ready",
        "color": "#6366f1",
        "type": "NOT_STARTED",
        "order": 2
      },
      {
        "name": "In Progress",
        "color": "#3b82f6",
        "type": "IN_PROGRESS",
        "order": 3
      },
      {
        "name": "Review",
        "color": "#8b5cf6",
        "type": "IN_PROGRESS",
        "order": 4
      },
      {
        "name": "Testing",
        "color": "#f59e0b",
        "type": "IN_PROGRESS",
        "order": 5
      },
      {
        "name": "Done",
        "color": "#22c55e",
        "type": "DONE",
        "order": 6
      }
    ]
  }'

# Expected: All 6 statuses created in single transaction
# Use for initial project setup
```

---

## 6.3 Batch Progress Calculation (OPTIMIZATION)

### Calculate Progress for Multiple Projects
```bash
# Get multiple project IDs
PROJECT_IDS='["'$PROJECT_ID_1'", "'$PROJECT_ID_2'", "'$PROJECT_ID_3'"]'

curl -X POST "$API_URL/api/projects/progress/batch" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "projectIds": '$PROJECT_IDS'
  }'

# Expected: Comprehensive progress data for all projects
# Response includes:
# - Per-project progress breakdown
# - Task completion statistics
# - Subtask progress
# - Checklist completion
# - Overall weighted progress
# - Aggregate summary statistics
```

### Dashboard Use Case: Get All Projects Progress
```bash
# Get all user's projects
PROJECTS=$(curl -s -X GET "$API_URL/api/projects" \
  -H "Authorization: Bearer $TOKEN")

# Extract project IDs
PROJECT_IDS=$(echo $PROJECTS | jq '[.data.projects[].id]')

# Get progress for all projects in ONE request
curl -X POST "$API_URL/api/projects/progress/batch" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"projectIds\": $PROJECT_IDS
  }"

# Use case: Display progress cards on dashboard
# Instead of N requests (one per project), make 1 batch request
```

---

## Complete Test Workflows

### Workflow 1: Kanban Board Drag & Drop
```bash
#!/bin/bash

# Simulate drag & drop: Move multiple tasks to new status

API_URL="http://localhost:3000"
TOKEN="your-token-here"
NEW_STATUS_ID="in-progress-status-id"

# Move 5 tasks from "Todo" to "In Progress" in one request
curl -X POST "$API_URL/api/batch" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "operations": [
      {"type": "UPDATE_TASK_STATUS", "taskId": "task1", "statusId": "'$NEW_STATUS_ID'"},
      {"type": "UPDATE_TASK_STATUS", "taskId": "task2", "statusId": "'$NEW_STATUS_ID'"},
      {"type": "UPDATE_TASK_STATUS", "taskId": "task3", "statusId": "'$NEW_STATUS_ID'"},
      {"type": "UPDATE_TASK_STATUS", "taskId": "task4", "statusId": "'$NEW_STATUS_ID'"},
      {"type": "UPDATE_TASK_STATUS", "taskId": "task5", "statusId": "'$NEW_STATUS_ID'"}
    ]
  }'

echo "✓ Moved 5 tasks to In Progress"
```

### Workflow 2: Bulk Priority Update
```bash
#!/bin/bash

# Update priority for all tasks in a sprint

API_URL="http://localhost:3000"
TOKEN="your-token-here"

# Set priority for multiple tasks
curl -X POST "$API_URL/api/batch" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "operations": [
      {"type": "UPDATE_TASK_FIELD", "taskId": "task1", "field": "priority", "value": 1},
      {"type": "UPDATE_TASK_FIELD", "taskId": "task2", "field": "priority", "value": 1},
      {"type": "UPDATE_TASK_FIELD", "taskId": "task3", "field": "priority", "value": 2},
      {"type": "UPDATE_TASK_FIELD", "taskId": "task4", "field": "priority", "value": 2},
      {"type": "UPDATE_TASK_FIELD", "taskId": "task5", "field": "priority", "value": 3}
    ]
  }'

echo "✓ Updated priorities for 5 tasks"
```

### Workflow 3: Bulk Task Assignment
```bash
#!/bin/bash

# Assign multiple tasks to team members

API_URL="http://localhost:3000"
TOKEN="your-token-here"
DEVELOPER_1="user-id-1"
DEVELOPER_2="user-id-2"

curl -X POST "$API_URL/api/batch" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "operations": [
      {"type": "UPDATE_TASK_ASSIGNEE", "taskId": "task1", "assigneeUserId": "'$DEVELOPER_1'"},
      {"type": "UPDATE_TASK_ASSIGNEE", "taskId": "task2", "assigneeUserId": "'$DEVELOPER_1'"},
      {"type": "UPDATE_TASK_ASSIGNEE", "taskId": "task3", "assigneeUserId": "'$DEVELOPER_2'"},
      {"type": "UPDATE_TASK_ASSIGNEE", "taskId": "task4", "assigneeUserId": "'$DEVELOPER_2'"}
    ]
  }'

echo "✓ Assigned 4 tasks to team members"
# Note: Notifications sent automatically to assignees
```

### Workflow 4: Setup New Task with Checklist
```bash
#!/bin/bash

# Create task and add checklist items in batch

API_URL="http://localhost:3000"
TOKEN="your-token-here"
TASK_ID="newly-created-task-id"
STATUS_ID="in-progress-status-id"
ASSIGNEE_ID="user-id"

# Setup task + checklist in one request
curl -X POST "$API_URL/api/batch" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "operations": [
      {
        "type": "UPDATE_TASK_STATUS",
        "taskId": "'$TASK_ID'",
        "statusId": "'$STATUS_ID'"
      },
      {
        "type": "UPDATE_TASK_ASSIGNEE",
        "taskId": "'$TASK_ID'",
        "assigneeUserId": "'$ASSIGNEE_ID'"
      },
      {
        "type": "ADD_CHECKLIST_ITEM",
        "taskId": "'$TASK_ID'",
        "name": "Setup development environment"
      },
      {
        "type": "ADD_CHECKLIST_ITEM",
        "taskId": "'$TASK_ID'",
        "name": "Review requirements"
      },
      {
        "type": "ADD_CHECKLIST_ITEM",
        "taskId": "'$TASK_ID'",
        "name": "Write unit tests"
      },
      {
        "type": "ADD_CHECKLIST_ITEM",
        "taskId": "'$TASK_ID'",
        "name": "Code review"
      }
    ]
  }'

echo "✓ Task configured with checklist"
```

### Workflow 5: Dashboard Progress Overview
```bash
#!/bin/bash

# Get progress for all projects on dashboard

API_URL="http://localhost:3000"
TOKEN="your-token-here"

echo "=== Dashboard Progress Report ==="

# Get all projects
PROJECTS=$(curl -s -X GET "$API_URL/api/projects" \
  -H "Authorization: Bearer $TOKEN")

PROJECT_COUNT=$(echo $PROJECTS | jq '.data.projects | length')
echo "Total Projects: $PROJECT_COUNT"

# Extract project IDs
PROJECT_IDS=$(echo $PROJECTS | jq '[.data.projects[].id]')

# Get progress for all in ONE batch request
PROGRESS=$(curl -s -X POST "$API_URL/api/projects/progress/batch" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"projectIds\": $PROJECT_IDS}")

echo -e "\n=== Progress Summary ==="
echo $PROGRESS | jq '.data.summary'

echo -e "\n=== Individual Project Progress ==="
echo $PROGRESS | jq '.data.projects[] | {
  name: .projectName,
  progress: .overallProgress,
  tasks: "\(.completedTasks)/\(.totalTasks)",
  status: (if .overallProgress >= 75 then "On Track" elif .overallProgress >= 50 then "In Progress" else "Starting" end)
}'

echo -e "\n=== Performance Benefit ==="
echo "Single batch request vs $PROJECT_COUNT individual requests"
echo "Network reduction: ~$((PROJECT_COUNT - 1)) fewer HTTP calls"
```

---

## Performance Benchmarks

### Expected Response Times

**Batch Operations:**
- 1-5 operations: < 200ms
- 10 operations: < 300ms
- 50 operations: < 800ms
- 100 operations: < 1500ms

**Batch Progress:**
- 1-5 projects: < 250ms
- 10 projects: < 400ms
- 25 projects: < 800ms
- 50 projects: < 1500ms

### Performance Comparison

**Before (Individual Requests):**
```bash
# Update 10 tasks individually
time for i in {1..10}; do
  curl -X PATCH "$API_URL/api/tasks/task$i" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"priority": 1}'
done

# Expected: ~2-3 seconds (10 round trips)
```

**After (Batch Request):**
```bash
# Update 10 tasks in batch
time curl -X POST "$API_URL/api/batch" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "operations": [
      # ... 10 UPDATE_TASK_FIELD operations ...
    ]
  }'

# Expected: ~300ms (1 round trip)
# Performance improvement: 6-10x faster
```

---

## Error Handling

### Partial Success Handling
```bash
# Some operations succeed, some fail
curl -X POST "$API_URL/api/batch" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "operations": [
      {
        "type": "UPDATE_TASK_FIELD",
        "taskId": "valid-task-id",
        "field": "priority",
        "value": 1
      },
      {
        "type": "UPDATE_TASK_FIELD",
        "taskId": "invalid-task-id",
        "field": "priority",
        "value": 1
      },
      {
        "type": "UPDATE_TASK_FIELD",
        "taskId": "another-valid-task-id",
        "field": "priority",
        "value": 2
      }
    ]
  }'

# Expected: Response shows which operations succeeded and which failed
# Operations 1 and 3 succeed, operation 2 fails
# Result includes summary: {successful: 2, failed: 1}
```

### Error Cases
```bash
# Too many operations (> 100)
curl -X POST "$API_URL/api/batch" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "operations": [...]  # 101 operations
  }'
# Expected: 400 BAD_REQUEST - Max 100 operations per batch

# Invalid operation type
curl -X POST "$API_URL/api/batch" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "operations": [
      {
        "type": "INVALID_TYPE",
        "taskId": "task-id"
      }
    ]
  }'
# Expected: 400 BAD_REQUEST - Invalid operation type

# No permission
curl -X POST "$API_URL/api/batch" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "operations": [
      {
        "type": "UPDATE_TASK_FIELD",
        "taskId": "task-user-cannot-edit",
        "field": "priority",
        "value": 1
      }
    ]
  }'
# Expected: Operation marked as failed in results with permission error
```

---

## Validation Checklist

### Batch Operations ✓
- [ ] UPDATE_TASK_FIELD supports all allowed fields
- [ ] UPDATE_TASK_STATUS validates status exists
- [ ] UPDATE_TASK_ASSIGNEE validates user exists
- [ ] UPDATE_TASK_ASSIGNEE creates notification when assigned
- [ ] UPDATE_CHECKLIST_STATUS validates checklist item exists
- [ ] ADD_CHECKLIST_ITEM creates with auto-order if not specified
- [ ] All operations check permissions
- [ ] Operations executed in transaction
- [ ] Partial success allowed (individual operations can fail)
- [ ] Activity logs created for each operation
- [ ] Response includes individual results per operation
- [ ] Summary shows total/successful/failed counts
- [ ] Limit of 100 operations enforced

### Batch Status Creation ✓
- [ ] Creates multiple statuses in transaction
- [ ] Validates unique names per project
- [ ] Validates color format (#RRGGBB)
- [ ] Validates status types
- [ ] Order preserved
- [ ] Permission check (can create statuses)

### Batch Progress Calculation ✓
- [ ] Calculates progress for multiple projects
- [ ] Progress includes task completion
- [ ] Progress includes subtask completion
- [ ] Progress includes checklist completion
- [ ] Weighted overall progress calculated correctly
- [ ] Aggregate statistics provided
- [ ] Handles non-existent projects gracefully
- [ ] Limit of 50 projects enforced
- [ ] Optimized with parallel processing

---

## Phase 6 Complete! ✅

All 3 high-performance endpoints implemented:
1. ✅ POST /api/batch (5 operation types, transaction-based)
2. ✅ POST /api/projects/:projectId/statuses/batch (from Phase 3)
3. ✅ POST /api/projects/progress/batch (optimized calculation)

**Performance Benefits:**
- 6-10x faster than individual requests
- Reduced network overhead
- Atomic transactions
- Optimized for dashboard views
- Scalable to 100 operations/50 projects per batch

---

## All Phases Complete! 🎉

**Migration Progress: 71 of 71 endpoints (100%)**

### Phase Summary:
- ✅ Phase 1: Authentication & Users (13 endpoints)
- ✅ Phase 2: Organization Structure (18 endpoints)
- ✅ Phase 3: Projects & Statuses (14 endpoints)
- ✅ Phase 4: Task Management (13 endpoints)
- ✅ Phase 5: Notifications & Activities (10 endpoints)
- ✅ Phase 6: Batch Operations & Optimization (3 endpoints)

**Total: 71 API Endpoints Complete**

**Next Steps:**
1. Run all test guides (Phase 1-6)
2. Perform integration testing
3. Load testing on batch endpoints
4. Frontend migration to use new APIs
5. Deploy to staging environment

**Document Status:** ✅ COMPLETE (2025-10-21)
