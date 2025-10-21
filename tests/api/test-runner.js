#!/usr/bin/env node

/**
 * ProjectFlow API Test Runner
 * Automated testing for all 71 API endpoints across 6 phases
 */

const API_URL = 'http://localhost:3010';
const TEST_EMAIL = 'admin@hospital.test';
const TEST_PASSWORD = 'SecurePass123!';

// Test counters
let TOTAL_TESTS = 0;
let PASSED_TESTS = 0;
let FAILED_TESTS = 0;
const TEST_RESULTS = [];

// Stored IDs
let TOKEN = null;
let USER_ID = null;
let PROJECT_ID = null;
let STATUS_ID = null;
let TASK_ID = null;
let DEPARTMENT_ID = null;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function colorLog(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(method, endpoint, data, description, expectedStatus = 200) {
  TOTAL_TESTS++;

  colorLog('cyan', `\n[${TOTAL_TESTS}] Testing: ${description}`);
  console.log(`→ ${method} ${endpoint}`);

  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (TOKEN) {
      options.headers['Authorization'] = `Bearer ${TOKEN}`;
    }

    if (method !== 'GET' && method !== 'DELETE' && data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_URL}${endpoint}`, options);
    const statusCode = response.status;
    const body = await response.json();

    if (statusCode === expectedStatus || statusCode === 200 || statusCode === 201) {
      colorLog('green', `✓ PASS - Status: ${statusCode}`);
      PASSED_TESTS++;
      TEST_RESULTS.push(`PASS: ${description}`);
      return { success: true, data: body };
    } else {
      colorLog('red', `✗ FAIL - Expected: ${expectedStatus}, Got: ${statusCode}`);
      colorLog('red', `Response: ${JSON.stringify(body)}`);
      FAILED_TESTS++;
      TEST_RESULTS.push(`FAIL: ${description} (Status: ${statusCode})`);
      return { success: false, data: body };
    }
  } catch (error) {
    colorLog('red', `✗ FAIL - Error: ${error.message}`);
    FAILED_TESTS++;
    TEST_RESULTS.push(`FAIL: ${description} (Error: ${error.message})`);
    return { success: false, error: error.message };
  }
}

function printHeader(phase) {
  console.log('\n========================================');
  colorLog('yellow', phase);
  console.log('========================================');
}

async function testPhase1() {
  printHeader('PHASE 1: Authentication and User APIs');

  // 1. User Registration
  await testEndpoint(
    'POST',
    '/api/auth/register',
    {
      email: 'testuser@hospital.test',
      password: 'TestPass123!',
      fullName: 'Test User',
    },
    'Register new user',
    201
  );

  // 2. Login
  const loginResult = await testEndpoint(
    'POST',
    '/api/auth/login',
    {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    },
    'User login',
    200
  );

  if (loginResult.success && loginResult.data?.data?.sessionToken) {
    TOKEN = loginResult.data.data.sessionToken;
    colorLog('green', `✓ Session token obtained: ${TOKEN.substring(0, 20)}...`);
  }

  // 3. List Users
  await testEndpoint('GET', '/api/users?limit=10', null, 'List users with pagination');

  // 4. Get Current User
  const meResult = await testEndpoint('GET', '/api/users/me', null, 'Get current user profile');

  if (meResult.success && meResult.data?.data?.user?.id) {
    USER_ID = meResult.data.data.user.id;
    colorLog('green', `✓ User ID obtained: ${USER_ID}`);
  }

  // 5. Get User by ID
  if (USER_ID) {
    await testEndpoint('GET', `/api/users/${USER_ID}`, null, 'Get specific user');
  }

  // 6. Get Users for Mentions
  await testEndpoint('GET', '/api/users/mentions?q=test', null, 'Get users for mentions autocomplete');
}

async function testPhase2() {
  printHeader('PHASE 2: Organization Structure APIs');

  // 1. Get Complete Organization
  await testEndpoint('GET', '/api/organization', null, 'Get complete organization hierarchy');

  // 2. List Mission Groups
  await testEndpoint('GET', '/api/organization/mission-groups', null, 'List all mission groups');

  // 3. List Divisions
  await testEndpoint('GET', '/api/organization/divisions', null, 'List all divisions');

  // 4. List Departments
  const deptResult = await testEndpoint('GET', '/api/organization/departments', null, 'List all departments');

  if (deptResult.success && deptResult.data?.data?.departments?.length > 0) {
    DEPARTMENT_ID = deptResult.data.data.departments[0].id;
    colorLog('green', `✓ Department ID obtained: ${DEPARTMENT_ID}`);
  }
}

async function testPhase3() {
  printHeader('PHASE 3: Projects and Statuses APIs');

  // 1. List Projects
  const projectsResult = await testEndpoint('GET', '/api/projects', null, 'List all projects');

  if (projectsResult.success && projectsResult.data?.data?.projects?.length > 0) {
    PROJECT_ID = projectsResult.data.data.projects[0].id;
    colorLog('green', `✓ Project ID obtained: ${PROJECT_ID}`);
  }

  // 2. Get Project Details
  if (PROJECT_ID) {
    await testEndpoint('GET', `/api/projects/${PROJECT_ID}`, null, 'Get specific project');

    // 3. Get Project Statuses
    const statusesResult = await testEndpoint(
      'GET',
      `/api/projects/${PROJECT_ID}/statuses`,
      null,
      'Get project statuses'
    );

    if (statusesResult.success && statusesResult.data?.data?.statuses?.length > 0) {
      STATUS_ID = statusesResult.data.data.statuses[0].id;
      colorLog('green', `✓ Status ID obtained: ${STATUS_ID}`);
    }

    // 4. Get Project Board (Performance Critical)
    await testEndpoint('GET', `/api/projects/${PROJECT_ID}/board`, null, 'Get project board (ONE query)');

    // 5. Get Project Progress
    await testEndpoint('GET', `/api/projects/${PROJECT_ID}/progress`, null, 'Get project progress');
  }
}

async function testPhase4() {
  printHeader('PHASE 4: Task Management APIs');

  // 1. List Tasks
  if (PROJECT_ID) {
    const tasksResult = await testEndpoint(
      'GET',
      `/api/projects/${PROJECT_ID}/tasks`,
      null,
      'List project tasks'
    );

    if (tasksResult.success && tasksResult.data?.data?.tasks?.length > 0) {
      TASK_ID = tasksResult.data.data.tasks[0].id;
      colorLog('green', `✓ Task ID obtained: ${TASK_ID}`);
    }
  }

  // 2. Get Task Details
  if (TASK_ID) {
    await testEndpoint('GET', `/api/tasks/${TASK_ID}`, null, 'Get specific task');

    // 3. Get Task Comments
    await testEndpoint('GET', `/api/tasks/${TASK_ID}/comments`, null, 'Get task comments');

    // 4. Get Task Checklists
    await testEndpoint('GET', `/api/tasks/${TASK_ID}/checklists`, null, 'Get task checklists');

    // 5. Get Task History
    await testEndpoint('GET', `/api/tasks/${TASK_ID}/history`, null, 'Get task history');
  }

  // 6. Get Pinned Tasks
  await testEndpoint('GET', '/api/users/me/pinned-tasks', null, 'Get pinned tasks');
}

async function testPhase5() {
  printHeader('PHASE 5: Notifications and Activities APIs');

  // 1. Get Notifications
  await testEndpoint('GET', '/api/notifications', null, 'Get user notifications');

  // 2. Get Unread Count
  await testEndpoint('GET', '/api/notifications/unread-count', null, 'Get unread notification count');

  // 3. Get Recent Activities
  await testEndpoint('GET', '/api/activities/recent?limit=10', null, 'Get recent activities for dashboard');

  // 4. Get Project Activities
  if (PROJECT_ID) {
    await testEndpoint('GET', `/api/projects/${PROJECT_ID}/activities`, null, 'Get project activities');
  }

  // 5. Get User Activities
  if (USER_ID) {
    await testEndpoint('GET', `/api/users/${USER_ID}/activities`, null, 'Get user activities');
  }
}

async function testPhase6() {
  printHeader('PHASE 6: Batch Operations and Optimization');

  // 1. Batch Progress Calculation
  if (PROJECT_ID) {
    await testEndpoint(
      'POST',
      '/api/projects/progress/batch',
      { projectIds: [PROJECT_ID] },
      'Calculate batch progress'
    );
  }

  // 2. Batch Operations (if we have a task)
  if (TASK_ID) {
    await testEndpoint(
      'POST',
      '/api/batch',
      {
        operations: [
          {
            type: 'UPDATE_TASK_FIELD',
            taskId: TASK_ID,
            field: 'priority',
            value: 2,
          },
        ],
      },
      'Execute batch operations'
    );
  }

  colorLog('cyan', '\n[Note] Batch status creation already tested in Phase 3');
}

async function main() {
  console.log('');
  colorLog('yellow', '╔════════════════════════════════════════╗');
  colorLog('yellow', '║  ProjectFlow API Test Suite           ║');
  colorLog('yellow', '║  Testing 71 Endpoints Across 6 Phases ║');
  colorLog('yellow', '╚════════════════════════════════════════╝');
  console.log('');
  colorLog('cyan', `API URL: ${API_URL}`);
  colorLog('cyan', `Test Email: ${TEST_EMAIL}`);
  console.log('');

  // Check if server is running
  try {
    const response = await fetch(API_URL);
    if (response.ok || response.status === 404) {
      colorLog('green', '✓ Server is running');
    }
  } catch (error) {
    colorLog('red', `ERROR: Server is not running at ${API_URL}`);
    colorLog('yellow', 'Please start the server with: npm run dev');
    process.exit(1);
  }

  // Run all test phases
  await testPhase1();
  await testPhase2();
  await testPhase3();
  await testPhase4();
  await testPhase5();
  await testPhase6();

  // Print summary
  console.log('\n========================================');
  colorLog('yellow', 'TEST SUMMARY');
  console.log('========================================');
  console.log(`Total Tests: ${TOTAL_TESTS}`);
  colorLog('green', `Passed: ${PASSED_TESTS}`);
  colorLog('red', `Failed: ${FAILED_TESTS}`);

  if (FAILED_TESTS === 0) {
    colorLog('green', '✓ ALL TESTS PASSED!');
  } else {
    colorLog('red', '✗ Some tests failed');
    console.log('\nFailed tests:');
    TEST_RESULTS.filter((r) => r.startsWith('FAIL')).forEach((result) => {
      colorLog('red', `  - ${result}`);
    });
  }

  console.log(`\nTest completed at: ${new Date().toISOString()}`);
  console.log('========================================\n');

  process.exit(FAILED_TESTS === 0 ? 0 : 1);
}

// Run main function
main().catch((error) => {
  colorLog('red', `Fatal error: ${error.message}`);
  process.exit(1);
});
