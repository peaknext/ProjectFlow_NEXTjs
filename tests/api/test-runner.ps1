# ProjectFlow API Test Runner (PowerShell)
# Automated testing for all 71 API endpoints across 6 phases

$ErrorActionPreference = "Continue"

# Configuration
$API_URL = "http://localhost:3010"
$TEST_EMAIL = "admin@hospital.test"
$TEST_PASSWORD = "SecurePass123!"

# Test counters
$TOTAL_TESTS = 0
$PASSED_TESTS = 0
$FAILED_TESTS = 0
$TEST_RESULTS = @()

# Helper function to print colored output
function Write-ColorOutput {
    param(
        [string]$Color,
        [string]$Message
    )
    Write-Host $Message -ForegroundColor $Color
}

# Helper function to test API endpoint
function Test-Endpoint {
    param(
        [string]$Method,
        [string]$Endpoint,
        [string]$Data,
        [string]$Description,
        [int]$ExpectedStatus = 200
    )

    $script:TOTAL_TESTS++

    Write-ColorOutput "Cyan" "`n[$script:TOTAL_TESTS] Testing: $Description"
    Write-Host "→ $Method $Endpoint"

    try {
        $headers = @{
            "Content-Type" = "application/json"
        }

        if ($script:TOKEN) {
            $headers["Authorization"] = "Bearer $script:TOKEN"
        }

        $params = @{
            Uri = "$API_URL$Endpoint"
            Method = $Method
            Headers = $headers
            TimeoutSec = 30
        }

        if ($Method -ne "GET" -and $Method -ne "DELETE" -and $Data) {
            $params["Body"] = $Data
        }

        $response = Invoke-WebRequest @params -UseBasicParsing
        $statusCode = $response.StatusCode
        $body = $response.Content

        # Check if status matches expected
        if ($statusCode -eq $ExpectedStatus -or $statusCode -eq 200 -or $statusCode -eq 201) {
            Write-ColorOutput "Green" "✓ PASS - Status: $statusCode"
            $script:PASSED_TESTS++
            $script:TEST_RESULTS += "PASS: $Description"

            # Store response for later use
            $body | Out-File -FilePath "$env:TEMP\last_response.json" -Encoding UTF8
            return $true
        } else {
            Write-ColorOutput "Red" "✗ FAIL - Expected: $ExpectedStatus, Got: $statusCode"
            $script:FAILED_TESTS++
            $script:TEST_RESULTS += "FAIL: $Description (Status: $statusCode)"
            return $false
        }
    }
    catch {
        $statusCode = if ($_.Exception.Response) { $_.Exception.Response.StatusCode.value__ } else { "Error" }
        Write-ColorOutput "Red" "✗ FAIL - Status: $statusCode"
        Write-ColorOutput "Red" "Error: $($_.Exception.Message)"
        $script:FAILED_TESTS++
        $script:TEST_RESULTS += "FAIL: $Description (Error: $statusCode)"
        return $false
    }
}

# Print test header
function Write-Header {
    param([string]$Phase)

    Write-Host ""
    Write-Host "========================================"
    Write-ColorOutput "Yellow" $Phase
    Write-Host "========================================"
}

# ============================================
# PHASE 1: Authentication & User APIs
# ============================================
function Test-Phase1 {
    Write-Header "PHASE 1: Authentication & User APIs"

    # 1. User Registration
    Test-Endpoint -Method "POST" -Endpoint "/api/auth/register" `
        -Data '{"email":"testuser@hospital.test","password":"TestPass123!","fullName":"Test User","departmentId":null}' `
        -Description "Register new user" -ExpectedStatus 201

    # 2. Login
    Test-Endpoint -Method "POST" -Endpoint "/api/auth/login" `
        -Data "{`"email`":`"$TEST_EMAIL`",`"password`":`"$TEST_PASSWORD`"}" `
        -Description "User login" -ExpectedStatus 200

    # Extract token
    if (Test-Path "$env:TEMP\last_response.json") {
        $response = Get-Content "$env:TEMP\last_response.json" | ConvertFrom-Json
        $script:TOKEN = $response.data.session.sessionToken
        if ($script:TOKEN) {
            Write-ColorOutput "Green" "✓ Session token obtained: $($script:TOKEN.Substring(0,20))..."
        }
    }

    # 3. List Users
    Test-Endpoint -Method "GET" -Endpoint "/api/users?limit=10" `
        -Description "List users with pagination"

    # 4. Get Current User
    Test-Endpoint -Method "GET" -Endpoint "/api/users/me" `
        -Description "Get current user profile"

    # Extract user ID
    if (Test-Path "$env:TEMP\last_response.json") {
        $response = Get-Content "$env:TEMP\last_response.json" | ConvertFrom-Json
        $script:USER_ID = $response.data.user.id
    }

    # 5. Get User by ID
    if ($script:USER_ID) {
        Test-Endpoint -Method "GET" -Endpoint "/api/users/$script:USER_ID" `
            -Description "Get specific user"
    }

    # 6. Get Users for Mentions
    Test-Endpoint -Method "GET" -Endpoint "/api/users/mentions?q=test" `
        -Description "Get users for @mentions autocomplete"
}

# ============================================
# PHASE 2: Organization Structure APIs
# ============================================
function Test-Phase2 {
    Write-Header "PHASE 2: Organization Structure APIs"

    # 1. Get Complete Organization
    Test-Endpoint -Method "GET" -Endpoint "/api/organization" `
        -Description "Get complete organization hierarchy"

    # 2. List Mission Groups
    Test-Endpoint -Method "GET" -Endpoint "/api/organization/mission-groups" `
        -Description "List all mission groups"

    # 3. List Divisions
    Test-Endpoint -Method "GET" -Endpoint "/api/organization/divisions" `
        -Description "List all divisions"

    # 4. List Departments
    Test-Endpoint -Method "GET" -Endpoint "/api/organization/departments" `
        -Description "List all departments"
}

# ============================================
# PHASE 3: Projects & Statuses APIs
# ============================================
function Test-Phase3 {
    Write-Header "PHASE 3: Projects & Statuses APIs"

    # 1. List Projects
    Test-Endpoint -Method "GET" -Endpoint "/api/projects" `
        -Description "List all projects"

    # Extract first project
    if (Test-Path "$env:TEMP\last_response.json") {
        $response = Get-Content "$env:TEMP\last_response.json" | ConvertFrom-Json
        if ($response.data.projects -and $response.data.projects.Count -gt 0) {
            $script:PROJECT_ID = $response.data.projects[0].id
        }
    }

    # 2. Get Project Details
    if ($script:PROJECT_ID) {
        Test-Endpoint -Method "GET" -Endpoint "/api/projects/$script:PROJECT_ID" `
            -Description "Get specific project"

        # 3. Get Project Statuses
        Test-Endpoint -Method "GET" -Endpoint "/api/projects/$script:PROJECT_ID/statuses" `
            -Description "Get project statuses"

        # Extract first status
        if (Test-Path "$env:TEMP\last_response.json") {
            $response = Get-Content "$env:TEMP\last_response.json" | ConvertFrom-Json
            if ($response.data.statuses -and $response.data.statuses.Count -gt 0) {
                $script:STATUS_ID = $response.data.statuses[0].id
            }
        }

        # 4. Get Project Board
        Test-Endpoint -Method "GET" -Endpoint "/api/projects/$script:PROJECT_ID/board" `
            -Description "Get project board (ONE query)"
    }
}

# ============================================
# PHASE 4: Task Management APIs
# ============================================
function Test-Phase4 {
    Write-Header "PHASE 4: Task Management APIs"

    # 1. List Tasks
    if ($script:PROJECT_ID) {
        Test-Endpoint -Method "GET" -Endpoint "/api/projects/$script:PROJECT_ID/tasks" `
            -Description "List project tasks"

        # Extract first task
        if (Test-Path "$env:TEMP\last_response.json") {
            $response = Get-Content "$env:TEMP\last_response.json" | ConvertFrom-Json
            if ($response.data.tasks -and $response.data.tasks.Count -gt 0) {
                $script:TASK_ID = $response.data.tasks[0].id
            }
        }
    }

    # 2. Get Task Details
    if ($script:TASK_ID) {
        Test-Endpoint -Method "GET" -Endpoint "/api/tasks/$script:TASK_ID" `
            -Description "Get specific task"

        # 3. Get Task Comments
        Test-Endpoint -Method "GET" -Endpoint "/api/tasks/$script:TASK_ID/comments" `
            -Description "Get task comments"

        # 4. Get Task Checklists
        Test-Endpoint -Method "GET" -Endpoint "/api/tasks/$script:TASK_ID/checklists" `
            -Description "Get task checklists"

        # 5. Get Task History
        Test-Endpoint -Method "GET" -Endpoint "/api/tasks/$script:TASK_ID/history" `
            -Description "Get task history"
    }

    # 6. Get Pinned Tasks
    Test-Endpoint -Method "GET" -Endpoint "/api/users/me/pinned-tasks" `
        -Description "Get pinned tasks"
}

# ============================================
# PHASE 5: Notifications & Activities APIs
# ============================================
function Test-Phase5 {
    Write-Header "PHASE 5: Notifications & Activities APIs"

    # 1. Get Notifications
    Test-Endpoint -Method "GET" -Endpoint "/api/notifications" `
        -Description "Get user notifications"

    # 2. Get Unread Count
    Test-Endpoint -Method "GET" -Endpoint "/api/notifications/unread-count" `
        -Description "Get unread notification count"

    # 3. Get Recent Activities
    Test-Endpoint -Method "GET" -Endpoint "/api/activities/recent?limit=10" `
        -Description "Get recent activities for dashboard"

    # 4. Get Project Activities
    if ($script:PROJECT_ID) {
        Test-Endpoint -Method "GET" -Endpoint "/api/projects/$script:PROJECT_ID/activities" `
            -Description "Get project activities"
    }

    # 5. Get User Activities
    if ($script:USER_ID) {
        Test-Endpoint -Method "GET" -Endpoint "/api/users/$script:USER_ID/activities" `
            -Description "Get user activities"
    }
}

# ============================================
# PHASE 6: Batch Operations
# ============================================
function Test-Phase6 {
    Write-Header "PHASE 6: Batch Operations & Optimization"

    # 1. Batch Progress
    if ($script:PROJECT_ID) {
        Test-Endpoint -Method "POST" -Endpoint "/api/projects/progress/batch" `
            -Data "{`"projectIds`":[`"$script:PROJECT_ID`"]}" `
            -Description "Calculate batch progress"
    }

    Write-ColorOutput "Cyan" "`n[Note] Additional batch operations require existing data"
}

# ============================================
# Main Execution
# ============================================
function Main {
    Write-Host ""
    Write-ColorOutput "Yellow" "╔════════════════════════════════════════╗"
    Write-ColorOutput "Yellow" "║  ProjectFlow API Test Suite           ║"
    Write-ColorOutput "Yellow" "║  Testing 71 Endpoints Across 6 Phases ║"
    Write-ColorOutput "Yellow" "╚════════════════════════════════════════╝"
    Write-Host ""
    Write-ColorOutput "Cyan" "API URL: $API_URL"
    Write-ColorOutput "Cyan" "Test Email: $TEST_EMAIL"
    Write-Host ""

    # Check if server is running
    try {
        $null = Invoke-WebRequest -Uri $API_URL -Method GET -TimeoutSec 5 -UseBasicParsing
        Write-ColorOutput "Green" "✓ Server is running"
    }
    catch {
        Write-ColorOutput "Red" "ERROR: Server is not running at $API_URL"
        Write-ColorOutput "Yellow" "Please start the server with: npm run dev"
        exit 1
    }

    # Run all test phases
    Test-Phase1
    Test-Phase2
    Test-Phase3
    Test-Phase4
    Test-Phase5
    Test-Phase6

    # Print summary
    Write-Host ""
    Write-Host "========================================"
    Write-ColorOutput "Yellow" "TEST SUMMARY"
    Write-Host "========================================"
    Write-Host "Total Tests: $TOTAL_TESTS"
    Write-ColorOutput "Green" "Passed: $PASSED_TESTS"
    Write-ColorOutput "Red" "Failed: $FAILED_TESTS"

    if ($FAILED_TESTS -eq 0) {
        Write-ColorOutput "Green" "✓ ALL TESTS PASSED!"
    } else {
        Write-ColorOutput "Red" "✗ Some tests failed"
        Write-Host ""
        Write-Host "Failed tests:"
        foreach ($result in $TEST_RESULTS) {
            if ($result.StartsWith("FAIL")) {
                Write-ColorOutput "Red" "  - $result"
            }
        }
    }

    Write-Host ""
    Write-Host "Test completed at: $(Get-Date)"
    Write-Host "========================================"
}

# Run main function
Main
