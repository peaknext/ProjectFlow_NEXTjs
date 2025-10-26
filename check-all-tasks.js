const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();

(async () => {
  try {
    const tasks = await prisma.task.findMany({
      select: {
        id: true,
        name: true,
        deletedAt: true,
        closeType: true,
        isClosed: true,
        createdAt: true,
        projectId: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('=== TOTAL TASKS IN DATABASE ===');
    console.log('Total:', tasks.length);
    console.log('');

    console.log('=== ALL TASKS ===');
    tasks.forEach((t, i) => {
      console.log(`${i + 1}. ${t.id}: ${t.name}`);
      console.log(`   projectId: ${t.projectId}`);
      console.log(`   deletedAt: ${t.deletedAt}`);
      console.log(`   closeType: ${t.closeType}`);
      console.log(`   isClosed: ${t.isClosed}`);
      console.log(`   createdAt: ${t.createdAt}`);
      console.log('');
    });

    // Count by status
    const notDeleted = tasks.filter(t => !t.deletedAt);
    const aborted = tasks.filter(t => t.closeType === 'ABORTED');
    const completed = tasks.filter(t => t.closeType === 'COMPLETED');
    const open = tasks.filter(t => !t.closeType);

    console.log('=== SUMMARY ===');
    console.log(`Total: ${tasks.length}`);
    console.log(`Not deleted: ${notDeleted.length}`);
    console.log(`Aborted: ${aborted.length}`);
    console.log(`Completed: ${completed.length}`);
    console.log(`Open (no closeType): ${open.length}`);
    console.log(`Not deleted + Not aborted: ${tasks.filter(t => !t.deletedAt && t.closeType !== 'ABORTED').length}`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
