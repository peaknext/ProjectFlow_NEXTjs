/**
 * Quick Database Check Script
 * Fast check to see if database has data
 *
 * Usage: node migration_plan/scripts/quick-check.js
 */

const { PrismaClient } = require('../../src/generated/prisma');

const prisma = new PrismaClient();

async function quickCheck() {
  console.log('\n🔍 Quick Database Check\n');
  console.log('='.repeat(50));

  try {
    // Test connection
    await prisma.$connect();
    console.log('✓ Connected to database');

    // Quick counts
    const counts = {
      'Users': await prisma.user.count(),
      'Departments': await prisma.department.count(),
      'Projects': await prisma.project.count(),
      'Tasks': await prisma.task.count(),
      'Statuses': await prisma.status.count(),
    };

    console.log('\nRecord Counts:');
    Object.entries(counts).forEach(([name, count]) => {
      const status = count > 0 ? '✓' : '⚠';
      console.log(`  ${status} ${name}: ${count}`);
    });

    const hasData = Object.values(counts).some(c => c > 0);

    console.log('\n' + '='.repeat(50));
    if (hasData) {
      console.log('✅ Database has data!\n');
    } else {
      console.log('⚠️  Database is empty - migration may not have run yet\n');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\nPossible issues:');
    console.log('  - DATABASE_URL not configured in .env');
    console.log('  - Database not accessible');
    console.log('  - Prisma client not generated (run: npx prisma generate)\n');
  } finally {
    await prisma.$disconnect();
  }
}

quickCheck();
