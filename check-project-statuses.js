const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();

async function checkProject() {
  const project = await prisma.project.findUnique({
    where: { id: 'cmh5mmcku00029il0tz8b93p3' },
    include: {
      statuses: { orderBy: { order: 'asc' } },
      department: { select: { id: true, name: true } }
    }
  });

  if (!project) {
    console.log('❌ Project not found');
    return;
  }

  console.log('\n✅ Project found:');
  console.log('  Name:', project.name);
  console.log('  Department:', project.department?.name, `(${project.department?.id})`);
  console.log('  Statuses count:', project.statuses.length);

  if (project.statuses.length === 0) {
    console.log('\n⚠️  WARNING: This project has NO statuses!');
    console.log('  This will cause task creation to fail.');
  } else {
    console.log('\n  Statuses:');
    project.statuses.forEach(s => {
      console.log(`    - ${s.name} (${s.id}) - order: ${s.order}`);
    });
  }
}

checkProject()
  .catch(e => console.error('Error:', e))
  .finally(() => prisma.$disconnect());
