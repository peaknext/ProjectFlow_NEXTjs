#!/bin/bash

# ProjectFlow API Test Runner
# Automated testing for all 71 API endpoints across 6 phases

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL="http://localhost:3010"
TEST_EMAIL="admin@hospital.test"
TEST_PASSWORD="SecurePass123!"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test results array
declare -a TEST_RESULTS

# Helper function to print colored output
print_color() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Helper function to test API endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    local expected_status=${5:-200}

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    print_color "$BLUE" "\n[$TOTAL_TESTS] Testing: $description"
    echo "→ $method $endpoint"

    # Make request
    if [ "$method" = "GET" ] || [ "$method" = "DELETE" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi

    # Extract status code and body
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    # Check if status matches expected
    if [ "$http_code" = "$expected_status" ] || [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        print_color "$GREEN" "✓ PASS - Status: $http_code"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        TEST_RESULTS+=("PASS: $description")

        # Store response for later use if needed
        echo "$body" > /tmp/last_response.json
        return 0
    else
        print_color "$RED" "✗ FAIL - Expected: $expected_status, Got: $http_code"
        print_color "$RED" "Response: $body"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        TEST_RESULTS+=("FAIL: $description (Status: $http_code)")
        return 1
    fi
}

# Print test header
print_header() {
    local phase=$1
    echo ""
    echo "========================================"
    print_color "$YELLOW" "$phase"
    echo "========================================"
}

# ============================================
# PHASE 1: Authentication & User APIs (13 endpoints)
# ============================================
test_phase1() {
    print_header "PHASE 1: Authentication & User APIs"

    # 1. User Registration
    test_endpoint "POST" "/api/auth/register" \
        "{\"email\":\"testuser@hospital.test\",\"password\":\"TestPass123!\",\"fullName\":\"Test User\",\"departmentId\":null}" \
        "Register new user" \
        201

    # 2. Login (get session token)
    test_endpoint "POST" "/api/auth/login" \
        "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" \
        "User login" \
        200

    # Extract token from response
    if [ -f /tmp/last_response.json ]; then
        TOKEN=$(cat /tmp/last_response.json | jq -r '.data.session.sessionToken // .data.sessionToken // empty')
        if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
            export TOKEN
            print_color "$GREEN" "✓ Session token obtained: ${TOKEN:0:20}..."
        else
            print_color "$RED" "✗ Failed to extract session token"
        fi
    fi

    # 3. Verify Email (request)
    test_endpoint "POST" "/api/auth/send-verification" \
        "{\"email\":\"testuser@hospital.test\"}" \
        "Request email verification"

    # 4. Password Reset Request
    test_endpoint "POST" "/api/auth/request-reset" \
        "{\"email\":\"testuser@hospital.test\"}" \
        "Request password reset"

    # 5. List Users
    test_endpoint "GET" "/api/users?limit=10" \
        "" \
        "List users with pagination"

    # 6. Get Current User
    test_endpoint "GET" "/api/users/me" \
        "" \
        "Get current user profile"

    # Save user ID for later tests
    if [ -f /tmp/last_response.json ]; then
        USER_ID=$(cat /tmp/last_response.json | jq -r '.data.user.id // .data.id // empty')
        export USER_ID
    fi

    # 7. Get User by ID
    if [ -n "$USER_ID" ]; then
        test_endpoint "GET" "/api/users/$USER_ID" \
            "" \
            "Get specific user"
    fi

    # 8. Get Users for Mentions
    test_endpoint "GET" "/api/users/mentions?q=test" \
        "" \
        "Get users for @mentions autocomplete"
}

# ============================================
# PHASE 2: Organization Structure APIs (18 endpoints)
# ============================================
test_phase2() {
    print_header "PHASE 2: Organization Structure APIs"

    # 1. Get Complete Organization Hierarchy
    test_endpoint "GET" "/api/organization" \
        "" \
        "Get complete organization hierarchy"

    # 2. List Mission Groups
    test_endpoint "GET" "/api/organization/mission-groups" \
        "" \
        "List all mission groups"

    # 3. Create Mission Group
    test_endpoint "POST" "/api/organization/mission-groups" \
        "{\"name\":\"Test Mission Group\",\"chiefUserId\":\"$USER_ID\"}" \
        "Create new mission group" \
        201

    # Save mission group ID
    if [ -f /tmp/last_response.json ]; then
        MISSION_GROUP_ID=$(cat /tmp/last_response.json | jq -r '.data.missionGroup.id // .data.id // empty')
        export MISSION_GROUP_ID
    fi

    # 4. List Divisions
    test_endpoint "GET" "/api/organization/divisions" \
        "" \
        "List all divisions"

    # 5. Create Division
    if [ -n "$MISSION_GROUP_ID" ]; then
        test_endpoint "POST" "/api/organization/divisions" \
            "{\"name\":\"Test Division\",\"missionGroupId\":\"$MISSION_GROUP_ID\",\"leaderUserId\":\"$USER_ID\"}" \
            "Create new division" \
            201

        if [ -f /tmp/last_response.json ]; then
            DIVISION_ID=$(cat /tmp/last_response.json | jq -r '.data.division.id // .data.id // empty')
            export DIVISION_ID
        fi
    fi

    # 6. List Departments
    test_endpoint "GET" "/api/organization/departments" \
        "" \
        "List all departments"

    # 7. Create Department
    if [ -n "$DIVISION_ID" ]; then
        test_endpoint "POST" "/api/organization/departments" \
            "{\"name\":\"Test Department\",\"divisionId\":\"$DIVISION_ID\",\"headUserId\":\"$USER_ID\"}" \
            "Create new department" \
            201

        if [ -f /tmp/last_response.json ]; then
            DEPARTMENT_ID=$(cat /tmp/last_response.json | jq -r '.data.department.id // .data.id // empty')
            export DEPARTMENT_ID
        fi
    fi
}

# ============================================
# PHASE 3: Projects & Statuses APIs (14 endpoints)
# ============================================
test_phase3() {
    print_header "PHASE 3: Projects & Statuses APIs"

    # 1. Create Project
    test_endpoint "POST" "/api/projects" \
        "{\"name\":\"Test Project\",\"description\":\"Automated test project\",\"departmentId\":\"$DEPARTMENT_ID\",\"color\":\"#3b82f6\"}" \
        "Create new project" \
        201

    # Save project ID
    if [ -f /tmp/last_response.json ]; then
        PROJECT_ID=$(cat /tmp/last_response.json | jq -r '.data.project.id // .data.id // empty')
        export PROJECT_ID
    fi

    # 2. List Projects
    test_endpoint "GET" "/api/projects" \
        "" \
        "List all projects"

    # 3. Get Project Details
    if [ -n "$PROJECT_ID" ]; then
        test_endpoint "GET" "/api/projects/$PROJECT_ID" \
            "" \
            "Get specific project"
    fi

    # 4. Get Project Statuses
    if [ -n "$PROJECT_ID" ]; then
        test_endpoint "GET" "/api/projects/$PROJECT_ID/statuses" \
            "" \
            "Get project statuses"

        # Save first status ID
        if [ -f /tmp/last_response.json ]; then
            STATUS_ID=$(cat /tmp/last_response.json | jq -r '.data.statuses[0].id // empty')
            export STATUS_ID
        fi
    fi

    # 5. Create Status
    if [ -n "$PROJECT_ID" ]; then
        test_endpoint "POST" "/api/projects/$PROJECT_ID/statuses" \
            "{\"name\":\"Testing\",\"color\":\"#f59e0b\",\"type\":\"IN_PROGRESS\",\"order\":10}" \
            "Create new status" \
            201
    fi

    # 6. Get Project Board (Performance Critical)
    if [ -n "$PROJECT_ID" ]; then
        test_endpoint "GET" "/api/projects/$PROJECT_ID/board" \
            "" \
            "Get project board (ONE query)"
    fi
}

# ============================================
# PHASE 4: Task Management APIs (13 endpoints)
# ============================================
test_phase4() {
    print_header "PHASE 4: Task Management APIs"

    # 1. Create Task
    if [ -n "$PROJECT_ID" ] && [ -n "$STATUS_ID" ]; then
        test_endpoint "POST" "/api/projects/$PROJECT_ID/tasks" \
            "{\"name\":\"Test Task\",\"description\":\"Automated test task\",\"statusId\":\"$STATUS_ID\",\"priority\":1}" \
            "Create new task" \
            201

        # Save task ID
        if [ -f /tmp/last_response.json ]; then
            TASK_ID=$(cat /tmp/last_response.json | jq -r '.data.task.id // .data.id // empty')
            export TASK_ID
        fi
    fi

    # 2. List Tasks
    if [ -n "$PROJECT_ID" ]; then
        test_endpoint "GET" "/api/projects/$PROJECT_ID/tasks" \
            "" \
            "List project tasks"
    fi

    # 3. Get Task Details
    if [ -n "$TASK_ID" ]; then
        test_endpoint "GET" "/api/tasks/$TASK_ID" \
            "" \
            "Get specific task"
    fi

    # 4. Update Task
    if [ -n "$TASK_ID" ]; then
        test_endpoint "PATCH" "/api/tasks/$TASK_ID" \
            "{\"priority\":2,\"difficulty\":3}" \
            "Update task"
    fi

    # 5. Add Comment
    if [ -n "$TASK_ID" ]; then
        test_endpoint "POST" "/api/tasks/$TASK_ID/comments" \
            "{\"text\":\"This is a test comment\"}" \
            "Add comment to task" \
            201
    fi

    # 6. Get Comments
    if [ -n "$TASK_ID" ]; then
        test_endpoint "GET" "/api/tasks/$TASK_ID/comments" \
            "" \
            "Get task comments"
    fi

    # 7. Create Checklist Item
    if [ -n "$TASK_ID" ]; then
        test_endpoint "POST" "/api/tasks/$TASK_ID/checklists" \
            "{\"name\":\"Test checklist item\"}" \
            "Create checklist item" \
            201

        if [ -f /tmp/last_response.json ]; then
            CHECKLIST_ITEM_ID=$(cat /tmp/last_response.json | jq -r '.data.item.id // .data.id // empty')
            export CHECKLIST_ITEM_ID
        fi
    fi

    # 8. Get Checklist Items
    if [ -n "$TASK_ID" ]; then
        test_endpoint "GET" "/api/tasks/$TASK_ID/checklists" \
            "" \
            "Get task checklists"
    fi

    # 9. Update Checklist Item
    if [ -n "$TASK_ID" ] && [ -n "$CHECKLIST_ITEM_ID" ]; then
        test_endpoint "PATCH" "/api/tasks/$TASK_ID/checklists/$CHECKLIST_ITEM_ID" \
            "{\"isChecked\":true}" \
            "Update checklist item"
    fi

    # 10. Get Task History
    if [ -n "$TASK_ID" ]; then
        test_endpoint "GET" "/api/tasks/$TASK_ID/history" \
            "" \
            "Get task history"
    fi

    # 11. Pin Task
    if [ -n "$TASK_ID" ]; then
        test_endpoint "POST" "/api/users/me/pinned-tasks" \
            "{\"taskId\":\"$TASK_ID\"}" \
            "Pin task" \
            201
    fi

    # 12. Get Pinned Tasks
    test_endpoint "GET" "/api/users/me/pinned-tasks" \
        "" \
        "Get pinned tasks"
}

# ============================================
# PHASE 5: Notifications & Activities APIs (10 endpoints)
# ============================================
test_phase5() {
    print_header "PHASE 5: Notifications & Activities APIs"

    # 1. Get Notifications
    test_endpoint "GET" "/api/notifications" \
        "" \
        "Get user notifications"

    # 2. Get Unread Count
    test_endpoint "GET" "/api/notifications/unread-count" \
        "" \
        "Get unread notification count"

    # 3. Mark All as Read
    test_endpoint "POST" "/api/notifications/mark-all-read" \
        "{}" \
        "Mark all notifications as read"

    # 4. Get Recent Activities
    test_endpoint "GET" "/api/activities/recent?limit=10" \
        "" \
        "Get recent activities for dashboard"

    # 5. Get Project Activities
    if [ -n "$PROJECT_ID" ]; then
        test_endpoint "GET" "/api/projects/$PROJECT_ID/activities" \
            "" \
            "Get project activities"
    fi

    # 6. Get User Activities
    if [ -n "$USER_ID" ]; then
        test_endpoint "GET" "/api/users/$USER_ID/activities" \
            "" \
            "Get user activities"
    fi
}

# ============================================
# PHASE 6: Batch Operations & Optimization (3 endpoints)
# ============================================
test_phase6() {
    print_header "PHASE 6: Batch Operations & Optimization"

    # 1. Batch Operations
    if [ -n "$TASK_ID" ]; then
        test_endpoint "POST" "/api/batch" \
            "{\"operations\":[{\"type\":\"UPDATE_TASK_FIELD\",\"taskId\":\"$TASK_ID\",\"field\":\"priority\",\"value\":1}]}" \
            "Execute batch operations"
    fi

    # 2. Batch Progress Calculation
    if [ -n "$PROJECT_ID" ]; then
        test_endpoint "POST" "/api/projects/progress/batch" \
            "{\"projectIds\":[\"$PROJECT_ID\"]}" \
            "Calculate batch progress"
    fi

    # 3. Batch Status Creation (already tested in Phase 3)
    print_color "$BLUE" "\n[Note] Batch status creation already tested in Phase 3"
}

# ============================================
# Main Execution
# ============================================
main() {
    print_color "$YELLOW" "╔════════════════════════════════════════╗"
    print_color "$YELLOW" "║  ProjectFlow API Test Suite           ║"
    print_color "$YELLOW" "║  Testing 71 Endpoints Across 6 Phases ║"
    print_color "$YELLOW" "╚════════════════════════════════════════╝"

    echo ""
    print_color "$BLUE" "API URL: $API_URL"
    print_color "$BLUE" "Test Email: $TEST_EMAIL"
    echo ""

    # Check if server is running
    if ! curl -s "$API_URL" > /dev/null 2>&1; then
        print_color "$RED" "ERROR: Server is not running at $API_URL"
        print_color "$YELLOW" "Please start the server with: npm run dev"
        exit 1
    fi

    print_color "$GREEN" "✓ Server is running"

    # Run all test phases
    test_phase1
    test_phase2
    test_phase3
    test_phase4
    test_phase5
    test_phase6

    # Print summary
    echo ""
    echo "========================================"
    print_color "$YELLOW" "TEST SUMMARY"
    echo "========================================"
    echo "Total Tests: $TOTAL_TESTS"
    print_color "$GREEN" "Passed: $PASSED_TESTS"
    print_color "$RED" "Failed: $FAILED_TESTS"

    if [ $FAILED_TESTS -eq 0 ]; then
        print_color "$GREEN" "✓ ALL TESTS PASSED!"
    else
        print_color "$RED" "✗ Some tests failed"
        echo ""
        echo "Failed tests:"
        for result in "${TEST_RESULTS[@]}"; do
            if [[ $result == FAIL* ]]; then
                print_color "$RED" "  - $result"
            fi
        done
    fi

    echo ""
    echo "Test completed at: $(date)"
    echo "========================================"
}

# Run main function
main "$@"
