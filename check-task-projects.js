const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();

(async () => {
  try {
    const tasks = await prisma.task.findMany({
      where: {
        deletedAt: null,
        NOT: { closeType: 'ABORTED' }
      },
      select: {
        id: true,
        name: true,
        projectId: true
      }
    });

    console.log(`Non-ABORTED tasks: ${tasks.length}`);
    console.log('');

    let invalidCount = 0;
    let deletedProjectCount = 0;
    let validCount = 0;

    for (const task of tasks) {
      const project = await prisma.project.findUnique({
        where: { id: task.projectId },
        select: {
          id: true,
          name: true,
          dateDeleted: true
        }
      });

      if (!project) {
        console.log(`INVALID: Task ${task.id} (${task.name}) has projectId ${task.projectId} that doesn't exist`);
        invalidCount++;
      } else if (project.dateDeleted) {
        console.log(`DELETED: Task ${task.id} (${task.name}) belongs to deleted project ${project.name}`);
        deletedProjectCount++;
      } else {
        validCount++;
      }
    }

    console.log('');
    console.log('=== SUMMARY ===');
    console.log(`Total non-ABORTED tasks: ${tasks.length}`);
    console.log(`Valid tasks (active project): ${validCount}`);
    console.log(`Tasks with deleted project: ${deletedProjectCount}`);
    console.log(`Tasks with invalid projectId: ${invalidCount}`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
