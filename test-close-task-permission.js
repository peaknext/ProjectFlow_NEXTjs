/**
 * Test Close Task Permission Fix
 *
 * This script tests that MEMBER users can only close their own tasks
 * (tasks they created or are assigned to), not other people's tasks.
 *
 * Prerequisites:
 * - Dev server running on port 3010
 * - BYPASS_AUTH=true in .env
 * - Database seeded with test data
 *
 * Test Cases:
 * 1. MEMBER closes own task (creator) - Should SUCCEED
 * 2. MEMBER closes assigned task - Should SUCCEED
 * 3. MEMBER closes other's task - Should FAIL (403 Forbidden)
 * 4. HEAD closes any task in department - Should SUCCEED
 */

const BASE_URL = 'http://localhost:3010';

// Test users (from seed data)
const USERS = {
  MEMBER: 'user001', // MEMBER role
  HEAD: 'user003',   // HEAD role
  ADMIN: 'admin001', // ADMIN role
};

// Helper function to make API calls
async function apiCall(endpoint, options = {}) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      'X-Bypass-User-Id': options.userId || USERS.MEMBER,
      ...options.headers,
    },
    ...options,
  });

  const data = await response.json();
  return { status: response.status, data };
}

// Test helper
function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    return false;
  }
  console.log(`✅ PASS: ${message}`);
  return true;
}

async function runTests() {
  console.log('🧪 Testing Close Task Permission Fix\n');
  console.log('=' .repeat(60));

  let allPassed = true;

  // Test 1: Find a task created by MEMBER (user001)
  console.log('\n📋 Test 1: MEMBER closes own task (creator)');
  const { data: tasksData } = await apiCall('/api/projects/proj001/board', {
    userId: USERS.MEMBER,
  });

  const ownTask = tasksData.data.tasks.find(
    t => t.creatorUserId === USERS.MEMBER && !t.isClosed
  );

  if (!ownTask) {
    console.log('⚠️  SKIP: No open tasks created by MEMBER found');
  } else {
    const { status: closeStatus } = await apiCall(
      `/api/tasks/${ownTask.id}/close`,
      {
        method: 'POST',
        userId: USERS.MEMBER,
        body: JSON.stringify({ type: 'COMPLETED' }),
      }
    );

    allPassed &= assert(
      closeStatus === 200,
      `MEMBER can close own task (creator) - Expected 200, got ${closeStatus}`
    );
  }

  // Test 2: Find a task assigned to MEMBER
  console.log('\n📋 Test 2: MEMBER closes assigned task');
  const assignedTask = tasksData.data.tasks.find(
    t => (t.assigneeUserId === USERS.MEMBER ||
          t.assigneeUserIds?.includes(USERS.MEMBER)) &&
         !t.isClosed &&
         t.creatorUserId !== USERS.MEMBER
  );

  if (!assignedTask) {
    console.log('⚠️  SKIP: No tasks assigned to MEMBER found');
  } else {
    const { status: closeStatus2 } = await apiCall(
      `/api/tasks/${assignedTask.id}/close`,
      {
        method: 'POST',
        userId: USERS.MEMBER,
        body: JSON.stringify({ type: 'COMPLETED' }),
      }
    );

    allPassed &= assert(
      closeStatus2 === 200,
      `MEMBER can close assigned task - Expected 200, got ${closeStatus2}`
    );
  }

  // Test 3: MEMBER tries to close someone else's task (CRITICAL TEST)
  console.log('\n📋 Test 3: MEMBER closes other\'s task (should FAIL)');
  const otherTask = tasksData.data.tasks.find(
    t => t.creatorUserId !== USERS.MEMBER &&
         t.assigneeUserId !== USERS.MEMBER &&
         !t.assigneeUserIds?.includes(USERS.MEMBER) &&
         !t.isClosed
  );

  if (!otherTask) {
    console.log('⚠️  SKIP: No tasks from other users found');
  } else {
    console.log(`   Testing with task: ${otherTask.name} (creator: ${otherTask.creatorUserId})`);

    const { status: closeStatus3, data: closeData3 } = await apiCall(
      `/api/tasks/${otherTask.id}/close`,
      {
        method: 'POST',
        userId: USERS.MEMBER,
        body: JSON.stringify({ type: 'COMPLETED' }),
      }
    );

    allPassed &= assert(
      closeStatus3 === 403,
      `MEMBER CANNOT close other's task - Expected 403, got ${closeStatus3}`
    );

    if (closeStatus3 === 403) {
      console.log(`   ✓ Error message: ${closeData3.error || closeData3.message}`);
    }
  }

  // Test 4: HEAD can close any task in department
  console.log('\n📋 Test 4: HEAD closes any task in department');
  const anyTask = tasksData.data.tasks.find(t => !t.isClosed);

  if (!anyTask) {
    console.log('⚠️  SKIP: No open tasks found');
  } else {
    const { status: closeStatus4 } = await apiCall(
      `/api/tasks/${anyTask.id}/close`,
      {
        method: 'POST',
        userId: USERS.HEAD,
        body: JSON.stringify({ type: 'COMPLETED' }),
      }
    );

    allPassed &= assert(
      closeStatus4 === 200,
      `HEAD can close any task - Expected 200, got ${closeStatus4}`
    );
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    console.log('✅ ALL TESTS PASSED!');
    console.log('\n🎉 Permission fix is working correctly!');
  } else {
    console.log('❌ SOME TESTS FAILED');
    console.log('\n⚠️  Please review the failed tests above');
  }
  console.log('='.repeat(60));
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});
