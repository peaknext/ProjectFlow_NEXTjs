// Check current jobtitle table structure
const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function checkStructure() {
  try {
    // Use raw query to get table columns
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'jobtitle'
      ORDER BY ordinal_position;
    `;

    console.log('Current jobtitle table structure:');
    console.log('================================');
    columns.forEach(col => {
      console.log(`- ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    console.log('\n✅ Table exists with', columns.length, 'columns');

    // Try to get a sample row
    const sample = await prisma.$queryRaw`SELECT * FROM jobtitle LIMIT 1;`;
    console.log('\nSample row:', sample[0]);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkStructure();
