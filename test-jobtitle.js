// Test if jobtitle table exists
const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function test() {
  try {
    console.log('Testing JobTitle table...');
    const jobTitles = await prisma.jobTitle.findMany();
    console.log('✅ JobTitle table exists!');
    console.log(`Found ${jobTitles.length} job titles`);

    if (jobTitles.length > 0) {
      console.log('Sample:', jobTitles[0]);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Code:', error.code);

    if (error.code === 'P2021' || error.code === 'P2022') {
      console.error('\n⚠️  Table "jobtitle" does not exist in the database!');
      console.error('Solution: Run "npm run prisma:push" to create the table');
    }
  } finally {
    await prisma.$disconnect();
  }
}

test();
