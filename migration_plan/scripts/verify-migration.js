/**
 * Database Migration Verification Script
 * Verifies that data from migration_data.json was correctly migrated to PostgreSQL
 *
 * Usage: node migration_plan/scripts/verify-migration.js
 */

const { PrismaClient } = require('../../src/generated/prisma');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bright');
  console.log('='.repeat(60));
}

async function loadMigrationData() {
  const dataPath = path.join(__dirname, '../../migration_data.json');
  if (!fs.existsSync(dataPath)) {
    throw new Error('migration_data.json not found!');
  }

  const rawData = fs.readFileSync(dataPath, 'utf-8');
  return JSON.parse(rawData);
}

async function testDatabaseConnection() {
  logSection('1. Testing Database Connection');

  try {
    await prisma.$connect();
    log('✓ Successfully connected to PostgreSQL database', 'green');

    // Get database info
    const result = await prisma.$queryRaw`SELECT version()`;
    log(`✓ Database version: ${result[0].version.split(',')[0]}`, 'cyan');

    return true;
  } catch (error) {
    log('✗ Failed to connect to database', 'red');
    log(`  Error: ${error.message}`, 'red');
    return false;
  }
}

async function verifyRecordCounts(migrationData) {
  logSection('2. Verifying Record Counts');

  const checks = [];

  // Core tables
  const tables = [
    { name: 'Users', model: 'user', dataKey: 'users' },
    { name: 'Sessions', model: 'session', dataKey: 'sessions' },
    { name: 'Mission Groups', model: 'missionGroup', dataKey: 'missionGroups' },
    { name: 'Divisions', model: 'division', dataKey: 'divisions' },
    { name: 'Departments', model: 'department', dataKey: 'departments' },
    { name: 'Projects', model: 'project', dataKey: 'projects' },
    { name: 'Statuses', model: 'status', dataKey: 'statuses' },
    { name: 'Tasks', model: 'task', dataKey: 'tasks' },
    { name: 'Comments', model: 'comment', dataKey: 'taskComments' },
    { name: 'Notifications', model: 'notification', dataKey: 'notifications' },
    { name: 'Checklists', model: 'checklist', dataKey: 'checklistItems' },
    { name: 'Phases', model: 'phase', dataKey: 'phases' },
    { name: 'IT Goals', model: 'iTGoal', dataKey: 'itGoals' },
    { name: 'Action Plans', model: 'actionPlan', dataKey: 'actionPlans' },
    { name: 'Hospital Missions', model: 'hospitalMission', dataKey: 'hospitalMissions' },
  ];

  console.log('\n📊 Record Count Comparison:\n');
  console.log('Table                    Expected    Actual      Status');
  console.log('-'.repeat(60));

  let totalMatches = 0;
  let totalMismatches = 0;

  for (const table of tables) {
    const expected = migrationData[table.dataKey]?.length || 0;

    try {
      const actual = await prisma[table.model].count();
      const match = expected === actual;

      if (match) {
        totalMatches++;
      } else {
        totalMismatches++;
      }

      const status = match ? '✓' : '✗';
      const color = match ? 'green' : 'red';

      const line = `${table.name.padEnd(24)} ${String(expected).padStart(8)}    ${String(actual).padStart(8)}      ${status}`;
      log(line, color);

      checks.push({
        table: table.name,
        expected,
        actual,
        match,
      });
    } catch (error) {
      log(`${table.name.padEnd(24)} ${String(expected).padStart(8)}    ERROR       ✗`, 'red');
      log(`  Error: ${error.message}`, 'red');
      totalMismatches++;
    }
  }

  console.log('-'.repeat(60));
  log(`\nSummary: ${totalMatches} matches, ${totalMismatches} mismatches`,
      totalMismatches === 0 ? 'green' : 'yellow');

  return checks;
}

async function verifyDataIntegrity(migrationData) {
  logSection('3. Verifying Data Integrity');

  const issues = [];

  // Check 1: Foreign Key Integrity - Users
  console.log('\n🔍 Checking foreign key integrity...\n');

  try {
    const usersWithInvalidDept = await prisma.user.findMany({
      where: {
        departmentId: { not: null },
        department: null,
      },
      select: { id: true, email: true, departmentId: true },
    });

    if (usersWithInvalidDept.length > 0) {
      log(`✗ Found ${usersWithInvalidDept.length} users with invalid department references`, 'red');
      issues.push(`${usersWithInvalidDept.length} users with invalid departments`);
    } else {
      log('✓ All user department references are valid', 'green');
    }
  } catch (error) {
    log(`⚠ Could not check user department integrity: ${error.message}`, 'yellow');
  }

  // Check 2: Tasks with invalid projects
  try {
    const tasksWithInvalidProject = await prisma.task.count({
      where: { project: null },
    });

    if (tasksWithInvalidProject > 0) {
      log(`✗ Found ${tasksWithInvalidProject} tasks with invalid project references`, 'red');
      issues.push(`${tasksWithInvalidProject} tasks with invalid projects`);
    } else {
      log('✓ All task project references are valid', 'green');
    }
  } catch (error) {
    log(`⚠ Could not check task project integrity: ${error.message}`, 'yellow');
  }

  // Check 3: Tasks with invalid status
  try {
    const tasksWithInvalidStatus = await prisma.task.count({
      where: { status: null },
    });

    if (tasksWithInvalidStatus > 0) {
      log(`✗ Found ${tasksWithInvalidStatus} tasks with invalid status references`, 'red');
      issues.push(`${tasksWithInvalidStatus} tasks with invalid status`);
    } else {
      log('✓ All task status references are valid', 'green');
    }
  } catch (error) {
    log(`⚠ Could not check task status integrity: ${error.message}`, 'yellow');
  }

  return issues;
}

async function spotCheckData(migrationData) {
  logSection('4. Spot-Checking Sample Records');

  console.log('\n🔬 Comparing random sample records...\n');

  const spotChecks = [];

  // Spot check: Random user
  if (migrationData.users && migrationData.users.length > 0) {
    const randomIndex = Math.floor(Math.random() * migrationData.users.length);
    const sourceUser = migrationData.users[randomIndex];

    try {
      const dbUser = await prisma.user.findUnique({
        where: { email: sourceUser.email },
      });

      if (dbUser) {
        const matches =
          dbUser.email === sourceUser.email &&
          dbUser.fullName === sourceUser.fullName &&
          dbUser.role === sourceUser.role.toUpperCase();

        if (matches) {
          log(`✓ User spot check passed: ${sourceUser.email}`, 'green');
          spotChecks.push({ type: 'user', status: 'pass' });
        } else {
          log(`✗ User spot check failed: ${sourceUser.email}`, 'red');
          log(`  Expected: ${sourceUser.fullName} (${sourceUser.role})`, 'yellow');
          log(`  Got: ${dbUser.fullName} (${dbUser.role})`, 'yellow');
          spotChecks.push({ type: 'user', status: 'fail' });
        }
      } else {
        log(`✗ User not found in database: ${sourceUser.email}`, 'red');
        spotChecks.push({ type: 'user', status: 'missing' });
      }
    } catch (error) {
      log(`⚠ Error checking user: ${error.message}`, 'yellow');
    }
  }

  // Spot check: Random department
  if (migrationData.departments && migrationData.departments.length > 0) {
    const randomIndex = Math.floor(Math.random() * migrationData.departments.length);
    const sourceDept = migrationData.departments[randomIndex];

    try {
      const dbDept = await prisma.department.findFirst({
        where: { name: sourceDept.name },
      });

      if (dbDept) {
        log(`✓ Department spot check passed: ${sourceDept.name}`, 'green');
        spotChecks.push({ type: 'department', status: 'pass' });
      } else {
        log(`✗ Department not found: ${sourceDept.name}`, 'red');
        spotChecks.push({ type: 'department', status: 'missing' });
      }
    } catch (error) {
      log(`⚠ Error checking department: ${error.message}`, 'yellow');
    }
  }

  // Spot check: Random task
  if (migrationData.tasks && migrationData.tasks.length > 0) {
    const randomIndex = Math.floor(Math.random() * migrationData.tasks.length);
    const sourceTask = migrationData.tasks[randomIndex];

    try {
      const dbTask = await prisma.task.findFirst({
        where: { name: sourceTask.name },
        include: {
          project: true,
          status: true,
        },
      });

      if (dbTask) {
        log(`✓ Task spot check passed: ${sourceTask.name}`, 'green');
        log(`  Project: ${dbTask.project.name}`, 'cyan');
        log(`  Status: ${dbTask.status.name}`, 'cyan');
        spotChecks.push({ type: 'task', status: 'pass' });
      } else {
        log(`✗ Task not found: ${sourceTask.name}`, 'red');
        spotChecks.push({ type: 'task', status: 'missing' });
      }
    } catch (error) {
      log(`⚠ Error checking task: ${error.message}`, 'yellow');
    }
  }

  return spotChecks;
}

async function generateReport(checks, issues, spotChecks) {
  logSection('5. Verification Report Summary');

  const totalChecks = checks.length;
  const passedChecks = checks.filter(c => c.match).length;
  const failedChecks = checks.filter(c => !c.match).length;

  console.log('\n📋 Overall Results:\n');
  console.log(`Total Tables Checked: ${totalChecks}`);
  console.log(`Record Count Matches: ${passedChecks}`);
  console.log(`Record Count Mismatches: ${failedChecks}`);
  console.log(`Data Integrity Issues: ${issues.length}`);

  const spotCheckPasses = spotChecks.filter(s => s.status === 'pass').length;
  const spotCheckFails = spotChecks.filter(s => s.status !== 'pass').length;
  console.log(`Spot Checks Passed: ${spotCheckPasses}/${spotChecks.length}`);

  console.log('\n');

  if (failedChecks === 0 && issues.length === 0 && spotCheckFails === 0) {
    log('✅ VERIFICATION PASSED - All checks successful!', 'green');
    log('\nYour database migration appears to be correct! 🎉', 'green');
    return true;
  } else {
    log('⚠️  VERIFICATION FAILED - Issues detected', 'yellow');

    if (failedChecks > 0) {
      console.log('\n❌ Record count mismatches found:');
      checks.filter(c => !c.match).forEach(check => {
        console.log(`   - ${check.table}: expected ${check.expected}, got ${check.actual}`);
      });
    }

    if (issues.length > 0) {
      console.log('\n❌ Data integrity issues:');
      issues.forEach(issue => {
        console.log(`   - ${issue}`);
      });
    }

    if (spotCheckFails > 0) {
      console.log('\n❌ Spot check failures:');
      spotChecks.filter(s => s.status !== 'pass').forEach(check => {
        console.log(`   - ${check.type}: ${check.status}`);
      });
    }

    console.log('\n💡 Recommended actions:');
    console.log('   1. Review migration logs for errors');
    console.log('   2. Check data transformation logic');
    console.log('   3. Re-run migration if necessary');

    return false;
  }
}

async function main() {
  log('\n🚀 ProjectFlow Database Migration Verification', 'bright');
  log('Starting verification process...', 'cyan');

  try {
    // Step 1: Test connection
    const connected = await testDatabaseConnection();
    if (!connected) {
      process.exit(1);
    }

    // Step 2: Load migration data
    logSection('Loading Migration Data');
    const migrationData = await loadMigrationData();
    log(`✓ Loaded migration_data.json successfully`, 'green');

    // Step 3: Verify record counts
    const checks = await verifyRecordCounts(migrationData);

    // Step 4: Verify data integrity
    const issues = await verifyDataIntegrity(migrationData);

    // Step 5: Spot check data
    const spotChecks = await spotCheckData(migrationData);

    // Step 6: Generate report
    const success = await generateReport(checks, issues, spotChecks);

    // Save detailed report to file
    const reportPath = path.join(__dirname, 'verification-report.json');
    const report = {
      timestamp: new Date().toISOString(),
      success,
      recordCounts: checks,
      integrityIssues: issues,
      spotChecks,
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    log(`\n📄 Detailed report saved to: ${reportPath}`, 'cyan');

    process.exit(success ? 0 : 1);

  } catch (error) {
    log('\n💥 Fatal error during verification:', 'red');
    log(error.message, 'red');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
