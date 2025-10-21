# Phase 3 API Testing Guide
## Projects & Statuses APIs

## Prerequisites
- Phase 1 & 2 completed and working
- Authentication token from login
- At least one department created (from Phase 2)

---

## 1. Projects CRUD APIs

### 1.1 Create Project
```bash
curl -X POST "http://localhost:3000/api/projects" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Hospital Information System Modernization",
    "description": "Upgrade legacy HIS to modern cloud-based system",
    "departmentId": "DEPT_ID",
    "status": "ACTIVE",
    "color": "#3b82f6",
    "startDate": "2025-01-01T00:00:00Z",
    "endDate": "2025-12-31T23:59:59Z"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "project": {
      "id": "proj-1",
      "name": "Hospital Information System Modernization",
      "status": "ACTIVE",
      "color": "#3b82f6",
      "department": {
        "id": "dept-1",
        "name": "IT Department"
      },
      "owner": {
        "id": "user-1",
        "fullName": "John Doe"
      }
    },
    "message": "Project created successfully with default statuses"
  }
}
```

### 1.2 List Projects
```bash
# Basic list
curl -X GET "http://localhost:3000/api/projects" \
  -H "Authorization: Bearer YOUR_TOKEN"

# With filters
curl -X GET "http://localhost:3000/api/projects?page=1&limit=10&search=HIS&departmentId=DEPT_ID&status=ACTIVE" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 1.3 Get Project Details
```bash
curl -X GET "http://localhost:3000/api/projects/PROJECT_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 1.4 Update Project
```bash
curl -X PATCH "http://localhost:3000/api/projects/PROJECT_ID" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Project Name",
    "status": "ON_HOLD",
    "color": "#f59e0b"
  }'
```

### 1.5 Delete Project
```bash
curl -X DELETE "http://localhost:3000/api/projects/PROJECT_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Error (Project with tasks):**
```json
{
  "success": false,
  "error": {
    "code": "PROJECT_HAS_TASKS",
    "message": "Project has 15 active tasks. Please archive or delete tasks first."
  }
}
```

---

## 2. Project Board API (Performance Critical!)

This endpoint fetches ALL data needed for the project board in ONE query.

```bash
curl -X GET "http://localhost:3000/api/projects/PROJECT_ID/board" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "project": {
      "id": "proj-1",
      "name": "HIS Modernization",
      "description": "...",
      "color": "#3b82f6",
      "status": "ACTIVE",
      "department": {
        "id": "dept-1",
        "name": "IT Department",
        "division": {
          "id": "div-1",
          "name": "Information Technology Division"
        }
      },
      "owner": {
        "id": "user-1",
        "fullName": "John Doe",
        "email": "john@example.com"
      }
    },
    "statuses": [
      {
        "id": "status-1",
        "name": "Todo",
        "color": "#94a3b8",
        "order": 1,
        "type": "NOT_STARTED"
      },
      {
        "id": "status-2",
        "name": "In Progress",
        "color": "#3b82f6",
        "order": 2,
        "type": "IN_PROGRESS"
      },
      {
        "id": "status-3",
        "name": "Done",
        "color": "#22c55e",
        "order": 3,
        "type": "DONE"
      }
    ],
    "tasks": [
      {
        "id": "task-1",
        "name": "Setup Database",
        "description": "Configure PostgreSQL database",
        "statusId": "status-2",
        "priority": 1,
        "assignee": {
          "id": "user-2",
          "fullName": "Jane Smith",
          "profileImageUrl": null
        },
        "status": {
          "id": "status-2",
          "name": "In Progress",
          "color": "#3b82f6"
        },
        "subtaskCount": 3,
        "subtaskCompletedCount": 1,
        "checklistCount": 5,
        "checklistCompletedCount": 3,
        "commentCount": 2,
        "progress": 60
      }
    ],
    "phases": [
      {
        "id": "phase-1",
        "name": "Planning Phase",
        "startDate": "2025-01-01T00:00:00Z",
        "endDate": "2025-03-31T23:59:59Z",
        "order": 1
      }
    ],
    "stats": {
      "totalTasks": 10,
      "openTasks": 7,
      "closedTasks": 3,
      "completedTasks": 2,
      "abortedTasks": 1,
      "tasksByStatus": [
        { "statusId": "status-1", "statusName": "Todo", "count": 5 },
        { "statusId": "status-2", "statusName": "In Progress", "count": 2 },
        { "statusId": "status-3", "statusName": "Done", "count": 3 }
      ]
    }
  }
}
```

---

## 3. Project Progress API

```bash
curl -X GET "http://localhost:3000/api/projects/PROJECT_ID/progress" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "projectId": "proj-1",
    "progress": 65,
    "totalTasks": 10,
    "completedTasks": 6,
    "abortedTasks": 1,
    "openTasks": 3,
    "method": "weighted_difficulty"
  }
}
```

---

## 4. Statuses Management APIs

### 4.1 List Statuses
```bash
curl -X GET "http://localhost:3000/api/projects/PROJECT_ID/statuses" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4.2 Create Custom Status
```bash
curl -X POST "http://localhost:3000/api/projects/PROJECT_ID/statuses" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "In Review",
    "color": "#a855f7",
    "type": "IN_PROGRESS",
    "order": 3
  }'
```

### 4.3 Batch Create Statuses
```bash
curl -X POST "http://localhost:3000/api/projects/PROJECT_ID/statuses/batch" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "statuses": [
      {
        "name": "Backlog",
        "color": "#6b7280",
        "type": "NOT_STARTED",
        "order": 1
      },
      {
        "name": "Ready",
        "color": "#10b981",
        "type": "NOT_STARTED",
        "order": 2
      },
      {
        "name": "Testing",
        "color": "#f59e0b",
        "type": "IN_PROGRESS",
        "order": 4
      },
      {
        "name": "Deployed",
        "color": "#22c55e",
        "type": "DONE",
        "order": 5
      }
    ]
  }'
```

### 4.4 Update Status
```bash
curl -X PATCH "http://localhost:3000/api/projects/PROJECT_ID/statuses/STATUS_ID" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Code Review",
    "color": "#8b5cf6"
  }'
```

### 4.5 Delete Status
```bash
curl -X DELETE "http://localhost:3000/api/projects/PROJECT_ID/statuses/STATUS_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Error (Status with tasks):**
```json
{
  "success": false,
  "error": {
    "code": "STATUS_HAS_TASKS",
    "message": "Cannot delete status with 5 tasks. Please reassign tasks first."
  }
}
```

---

## 5. Phases Management APIs

### 5.1 List Phases
```bash
curl -X GET "http://localhost:3000/api/projects/PROJECT_ID/phases" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5.2 Create Phase
```bash
curl -X POST "http://localhost:3000/api/projects/PROJECT_ID/phases" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Implementation Phase",
    "description": "Core system development",
    "startDate": "2025-04-01T00:00:00Z",
    "endDate": "2025-09-30T23:59:59Z",
    "order": 2
  }'
```

### 5.3 Batch Create Phases
```bash
curl -X POST "http://localhost:3000/api/projects/PROJECT_ID/phases/batch" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phases": [
      {
        "name": "Phase 1: Planning",
        "startDate": "2025-01-01T00:00:00Z",
        "endDate": "2025-03-31T23:59:59Z",
        "order": 1
      },
      {
        "name": "Phase 2: Development",
        "startDate": "2025-04-01T00:00:00Z",
        "endDate": "2025-09-30T23:59:59Z",
        "order": 2
      },
      {
        "name": "Phase 3: Testing & Deployment",
        "startDate": "2025-10-01T00:00:00Z",
        "endDate": "2025-12-31T23:59:59Z",
        "order": 3
      }
    ]
  }'
```

---

## 6. Complete Project Setup Workflow

```bash
#!/bin/bash

API_URL="http://localhost:3000"
TOKEN="YOUR_TOKEN"

echo "=== Phase 3: Complete Project Setup ==="

# 1. Create Project
echo "1. Creating project..."
PROJECT_RESPONSE=$(curl -s -X POST "$API_URL/api/projects" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"HIS Modernization Project",
    "description":"Upgrade to cloud-based HIS",
    "departmentId":"DEPT_ID",
    "status":"ACTIVE",
    "color":"#3b82f6",
    "startDate":"2025-01-01T00:00:00Z",
    "endDate":"2025-12-31T23:59:59Z"
  }')
PROJECT_ID=$(echo $PROJECT_RESPONSE | jq -r '.data.project.id')
echo "Project ID: $PROJECT_ID"

# 2. Create Custom Statuses
echo "2. Creating custom statuses..."
curl -s -X POST "$API_URL/api/projects/$PROJECT_ID/statuses/batch" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "statuses": [
      {"name":"Backlog","color":"#6b7280","type":"NOT_STARTED","order":1},
      {"name":"In Development","color":"#3b82f6","type":"IN_PROGRESS","order":2},
      {"name":"In Review","color":"#a855f7","type":"IN_PROGRESS","order":3},
      {"name":"Testing","color":"#f59e0b","type":"IN_PROGRESS","order":4},
      {"name":"Done","color":"#22c55e","type":"DONE","order":5}
    ]
  }' | jq

# 3. Create Phases
echo "3. Creating phases..."
curl -s -X POST "$API_URL/api/projects/$PROJECT_ID/phases/batch" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phases": [
      {"name":"Phase 1: Requirements","startDate":"2025-01-01T00:00:00Z","endDate":"2025-02-28T23:59:59Z","order":1},
      {"name":"Phase 2: Development","startDate":"2025-03-01T00:00:00Z","endDate":"2025-09-30T23:59:59Z","order":2},
      {"name":"Phase 3: Deployment","startDate":"2025-10-01T00:00:00Z","endDate":"2025-12-31T23:59:59Z","order":3}
    ]
  }' | jq

# 4. Get Complete Board Data
echo "4. Fetching complete project board..."
curl -s -X GET "$API_URL/api/projects/$PROJECT_ID/board" \
  -H "Authorization: Bearer $TOKEN" | jq

echo ""
echo "=== Project Setup Complete ==="
echo "Project ID: $PROJECT_ID"
```

---

## 7. Performance Testing

### Test Project Board Load Time
```bash
#!/bin/bash

API_URL="http://localhost:3000"
TOKEN="YOUR_TOKEN"
PROJECT_ID="PROJECT_ID"

echo "Testing project board performance..."

for i in {1..10}; do
  START=$(date +%s%N)
  curl -s -X GET "$API_URL/api/projects/$PROJECT_ID/board" \
    -H "Authorization: Bearer $TOKEN" > /dev/null
  END=$(date +%s%N)
  TIME=$((($END - $START) / 1000000))
  echo "Request $i: ${TIME}ms"
done
```

**Target:** < 200ms average response time

---

## 8. Success Criteria

✅ **Phase 3 is complete when:**

- [ ] All 14 endpoints return correct responses
- [ ] Project CRUD operations work correctly
- [ ] Default statuses are created when project is created
- [ ] Project board API returns complete data in ONE query
- [ ] Project progress calculation works (simple & weighted)
- [ ] Custom statuses can be created and managed
- [ ] Batch status creation works
- [ ] Status deletion protection works (tasks exist)
- [ ] Phases can be created and managed
- [ ] Batch phase creation works
- [ ] Permission checks enforce access control
- [ ] Soft delete works for all entities
- [ ] Board endpoint responds in < 200ms

---

## Next Steps

After Phase 3 testing is complete:
1. Performance test the board endpoint
2. Verify all filters work correctly
3. Test with large datasets (100+ tasks)
4. Create Postman collection for Phase 3
5. Proceed to **Phase 4: Task Management APIs**
