# Phase 2 API Testing Guide
## Organization Structure & Planning APIs

## Prerequisites
- Phase 1 completed and working
- Authentication token from login
- Admin or Chief user role (for write operations)

---

## 1. Organization Hierarchy APIs

### 1.1 Get Complete Organization Structure
```bash
curl -X GET "http://localhost:3000/api/organization" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Include inactive/deleted entities
curl -X GET "http://localhost:3000/api/organization?includeInactive=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "organization": [
      {
        "id": "mg-1",
        "name": "Mission Group 1",
        "chief": { "id": "user-1", "fullName": "John Doe" },
        "divisions": [
          {
            "id": "div-1",
            "name": "Division 1",
            "leader": { "id": "user-2", "fullName": "Jane Smith" },
            "departments": [
              {
                "id": "dept-1",
                "name": "IT Department",
                "head": { "id": "user-3", "fullName": "Bob Wilson" },
                "_count": { "users": 10, "projects": 5 }
              }
            ]
          }
        ]
      }
    ],
    "stats": {
      "totalMissionGroups": 1,
      "totalDivisions": 1,
      "totalDepartments": 1,
      "totalUsers": 10,
      "totalProjects": 5
    }
  }
}
```

### 1.2 Mission Groups

```bash
# List all mission groups
curl -X GET "http://localhost:3000/api/organization/mission-groups" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create mission group
curl -X POST "http://localhost:3000/api/organization/mission-groups" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Medical Services Mission Group",
    "chiefUserId": "USER_ID"
  }'
```

### 1.3 Divisions

```bash
# List all divisions
curl -X GET "http://localhost:3000/api/organization/divisions" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Filter by mission group
curl -X GET "http://localhost:3000/api/organization/divisions?missionGroupId=MG_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create division
curl -X POST "http://localhost:3000/api/organization/divisions" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Information Technology Division",
    "missionGroupId": "MG_ID",
    "leaderUserId": "USER_ID"
  }'
```

### 1.4 Departments (Full CRUD)

```bash
# List all departments
curl -X GET "http://localhost:3000/api/organization/departments" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Filter by division
curl -X GET "http://localhost:3000/api/organization/departments?divisionId=DIV_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create department
curl -X POST "http://localhost:3000/api/organization/departments" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Software Development Department",
    "divisionId": "DIV_ID",
    "headUserId": "USER_ID",
    "tel": "02-123-4567"
  }'

# Update department
curl -X PATCH "http://localhost:3000/api/organization/departments/DEPT_ID" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Department Name",
    "tel": "02-999-8888"
  }'

# Delete department (soft delete)
curl -X DELETE "http://localhost:3000/api/organization/departments/DEPT_ID" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Expected Error (Department with users):**
```json
{
  "success": false,
  "error": {
    "code": "DEPARTMENT_HAS_USERS",
    "message": "Cannot delete department with 10 users. Please reassign users first."
  }
}
```

---

## 2. Hospital Missions & Strategic Planning APIs

### 2.1 Hospital Missions

```bash
# List all hospital missions
curl -X GET "http://localhost:3000/api/organization/hospital-missions" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Filter by year
curl -X GET "http://localhost:3000/api/organization/hospital-missions?year=2025" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create hospital mission
curl -X POST "http://localhost:3000/api/organization/hospital-missions" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ยกระดับคุณภาพบริการทางการแพทย์",
    "description": "พัฒนาระบบบริการให้ทันสมัยและมีคุณภาพ",
    "year": 2025,
    "order": 1
  }'

# Get mission with full hierarchy (IT goals → action plans → projects)
curl -X GET "http://localhost:3000/api/organization/hospital-missions/MISSION_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Update mission
curl -X PATCH "http://localhost:3000/api/organization/hospital-missions/MISSION_ID" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Mission Name",
    "year": 2026
  }'

# Delete mission
curl -X DELETE "http://localhost:3000/api/organization/hospital-missions/MISSION_ID" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Expected Response (Get Mission):**
```json
{
  "success": true,
  "data": {
    "mission": {
      "id": "mission-1",
      "name": "ยกระดับคุณภาพบริการทางการแพทย์",
      "year": 2025,
      "itGoals": [
        {
          "id": "goal-1",
          "name": "พัฒนาระบบ IT สนับสนุนการรักษา",
          "actionPlans": [
            {
              "id": "plan-1",
              "name": "พัฒนา HIS ใหม่",
              "projects": [
                {
                  "id": "proj-1",
                  "name": "HIS Modernization Project",
                  "status": "ACTIVE"
                }
              ]
            }
          ]
        }
      ]
    }
  }
}
```

### 2.2 IT Goals

```bash
# List all IT goals
curl -X GET "http://localhost:3000/api/organization/it-goals" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Filter by mission
curl -X GET "http://localhost:3000/api/organization/it-goals?missionId=MISSION_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create IT goal
curl -X POST "http://localhost:3000/api/organization/it-goals" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "พัฒนาระบบ IT สนับสนุนการรักษา",
    "hospitalMissionId": "MISSION_ID",
    "description": "เพิ่มประสิทธิภาพระบบ HIS และ EMR",
    "order": 1
  }'
```

### 2.3 Action Plans

```bash
# List all action plans
curl -X GET "http://localhost:3000/api/organization/action-plans" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Filter by IT goal
curl -X GET "http://localhost:3000/api/organization/action-plans?goalId=GOAL_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Filter by hospital mission
curl -X GET "http://localhost:3000/api/organization/action-plans?missionId=MISSION_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create action plan
curl -X POST "http://localhost:3000/api/organization/action-plans" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "พัฒนา HIS ระยะที่ 1",
    "itGoalId": "GOAL_ID",
    "description": "Modernize core modules",
    "order": 1
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "plan": {
      "id": "plan-1",
      "name": "พัฒนา HIS ระยะที่ 1",
      "order": 1,
      "itGoal": {
        "id": "goal-1",
        "name": "พัฒนาระบบ IT สนับสนุนการรักษา",
        "hospitalMission": {
          "id": "mission-1",
          "name": "ยกระดับคุณภาพบริการทางการแพทย์",
          "year": 2025
        }
      },
      "_count": {
        "projects": 0
      }
    },
    "message": "Action plan created successfully"
  }
}
```

---

## 3. Complete Workflow Test

### Scenario: สร้าง Organization Structure สมบูรณ์

```bash
#!/bin/bash

API_URL="http://localhost:3000"
TOKEN="YOUR_ADMIN_TOKEN"

echo "=== Phase 2: Organization Structure Setup ==="

# 1. Create Mission Group
echo "1. Creating Mission Group..."
MG_RESPONSE=$(curl -s -X POST "$API_URL/api/organization/mission-groups" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Medical Services Mission Group"}')
MG_ID=$(echo $MG_RESPONSE | jq -r '.data.missionGroup.id')
echo "Mission Group ID: $MG_ID"

# 2. Create Division
echo "2. Creating Division..."
DIV_RESPONSE=$(curl -s -X POST "$API_URL/api/organization/divisions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"IT Division\",\"missionGroupId\":\"$MG_ID\"}")
DIV_ID=$(echo $DIV_RESPONSE | jq -r '.data.division.id')
echo "Division ID: $DIV_ID"

# 3. Create Department
echo "3. Creating Department..."
DEPT_RESPONSE=$(curl -s -X POST "$API_URL/api/organization/departments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Software Development\",\"divisionId\":\"$DIV_ID\",\"tel\":\"02-123-4567\"}")
DEPT_ID=$(echo $DEPT_RESPONSE | jq -r '.data.department.id')
echo "Department ID: $DEPT_ID"

# 4. Create Hospital Mission
echo "4. Creating Hospital Mission..."
MISSION_RESPONSE=$(curl -s -X POST "$API_URL/api/organization/hospital-missions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Digital Transformation 2025","year":2025,"order":1}')
MISSION_ID=$(echo $MISSION_RESPONSE | jq -r '.data.mission.id')
echo "Mission ID: $MISSION_ID"

# 5. Create IT Goal
echo "5. Creating IT Goal..."
GOAL_RESPONSE=$(curl -s -X POST "$API_URL/api/organization/it-goals" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Modernize Hospital Information Systems\",\"hospitalMissionId\":\"$MISSION_ID\",\"order\":1}")
GOAL_ID=$(echo $GOAL_RESPONSE | jq -r '.data.goal.id')
echo "Goal ID: $GOAL_ID"

# 6. Create Action Plan
echo "6. Creating Action Plan..."
PLAN_RESPONSE=$(curl -s -X POST "$API_URL/api/organization/action-plans" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"HIS Modernization Phase 1\",\"itGoalId\":\"$GOAL_ID\",\"order\":1}")
PLAN_ID=$(echo $PLAN_RESPONSE | jq -r '.data.plan.id')
echo "Plan ID: $PLAN_ID"

# 7. Verify complete structure
echo ""
echo "7. Verifying Complete Organization Structure..."
curl -s -X GET "$API_URL/api/organization" \
  -H "Authorization: Bearer $TOKEN" | jq

echo ""
echo "=== Setup Complete ==="
echo "Mission Group: $MG_ID"
echo "Division: $DIV_ID"
echo "Department: $DEPT_ID"
echo "Hospital Mission: $MISSION_ID"
echo "IT Goal: $GOAL_ID"
echo "Action Plan: $PLAN_ID"
```

---

## 4. Error Cases to Test

### 4.1 Validation Errors
```bash
# Create department without division ID
curl -X POST "http://localhost:3000/api/organization/departments" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Department"}'
# Expected: 400 VALIDATION_ERROR
```

### 4.2 Not Found Errors
```bash
# Get non-existent mission
curl -X GET "http://localhost:3000/api/organization/hospital-missions/invalid-id" \
  -H "Authorization: Bearer YOUR_TOKEN"
# Expected: 404 MISSION_NOT_FOUND
```

### 4.3 Cascading Delete Protection
```bash
# Try to delete department with users
curl -X DELETE "http://localhost:3000/api/organization/departments/DEPT_WITH_USERS" \
  -H "Authorization: Bearer ADMIN_TOKEN"
# Expected: 400 DEPARTMENT_HAS_USERS

# Try to delete mission with IT goals
curl -X DELETE "http://localhost:3000/api/organization/hospital-missions/MISSION_WITH_GOALS" \
  -H "Authorization: Bearer ADMIN_TOKEN"
# Expected: 400 MISSION_HAS_GOALS
```

---

## 5. Success Criteria

✅ **Phase 2 is complete when:**

- [ ] All 18 endpoints return correct responses
- [ ] Complete organization hierarchy can be retrieved
- [ ] Mission Groups → Divisions → Departments flow works
- [ ] Hospital Missions → IT Goals → Action Plans flow works
- [ ] CRUD operations work with proper validation
- [ ] Soft delete works correctly
- [ ] Cascade delete protection works
- [ ] Filtering by parent entities works
- [ ] Statistics and counts are accurate
- [ ] Permission checks enforce access control

---

## Next Steps

After Phase 2 testing is complete:
1. Document any issues found
2. Verify data relationships are correct
3. Test with real-world data scenarios
4. Create Postman collection for Phase 2
5. Proceed to **Phase 3: Projects & Statuses APIs**
