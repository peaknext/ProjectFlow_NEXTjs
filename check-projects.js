const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();

(async () => {
  try {
    // Get all unique project IDs from tasks
    const tasks = await prisma.task.findMany({
      select: { projectId: true },
      where: { deletedAt: null }
    });

    const uniqueProjectIds = [...new Set(tasks.map(t => t.projectId))];
    console.log('Unique project IDs from tasks:', uniqueProjectIds.length);

    // Check each project
    for (const projectId of uniqueProjectIds) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: {
          id: true,
          name: true,
          dateDeleted: true
        }
      });

      if (!project) {
        console.log(`❌ Project ${projectId} NOT FOUND in database`);
      } else if (project.dateDeleted) {
        console.log(`🗑️ Project ${project.id} (${project.name}) is DELETED at ${project.dateDeleted}`);
      } else {
        console.log(`✅ Project ${project.id} (${project.name}) is ACTIVE`);
      }
    }

    // Count tasks by project status
    console.log('\n=== TASKS BY PROJECT STATUS ===');
    const tasksWithProjects = await prisma.task.findMany({
      where: {
        deletedAt: null,
        NOT: { closeType: 'ABORTED' }
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            dateDeleted: true
          }
        }
      }
    });

    const activeProjectTasks = tasksWithProjects.filter(t => !t.project.dateDeleted);
    const deletedProjectTasks = tasksWithProjects.filter(t => t.project.dateDeleted);

    console.log(`Tasks in ACTIVE projects: ${activeProjectTasks.length}`);
    console.log(`Tasks in DELETED projects: ${deletedProjectTasks.length}`);

    if (deletedProjectTasks.length > 0) {
      console.log('\nTasks in deleted projects:');
      deletedProjectTasks.forEach(t => {
        console.log(`  - ${t.id}: ${t.name} (project: ${t.project.name})`);
      });
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
