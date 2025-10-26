const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('=== TESTING REPORTS FILTERS ===\n');

    // Test 1: Get all tasks (no filter)
    const allTasks = await prisma.task.findMany({
      where: {
        deletedAt: null,
        project: { dateDeleted: null },
        OR: [{ closeType: null }, { closeType: 'COMPLETED' }],
      },
      include: { project: { select: { id: true, name: true, departmentId: true } } },
    });
    console.log(`1. All tasks (no filter): ${allTasks.length} tasks`);

    // Test 2: Filter by specific department (DEPT-059)
    const dept059Tasks = await prisma.task.findMany({
      where: {
        deletedAt: null,
        project: {
          dateDeleted: null,
          departmentId: 'DEPT-059'
        },
        OR: [{ closeType: null }, { closeType: 'COMPLETED' }],
      },
      include: { project: { select: { id: true, name: true, departmentId: true } } },
    });
    console.log(`2. Department DEPT-059: ${dept059Tasks.length} tasks`);
    if (dept059Tasks.length > 0) {
      console.log(`   First task: "${dept059Tasks[0].name}" in project ${dept059Tasks[0].project.name}`);
    }

    // Test 3: Filter by division (DIV-037)
    const divDepts = await prisma.department.findMany({
      where: { divisionId: 'DIV-037', deletedAt: null },
      select: { id: true, name: true },
    });
    const divDeptIds = divDepts.map(d => d.id);
    console.log(`\n3. Division DIV-037 has ${divDepts.length} departments:`, divDeptIds.join(', '));

    const div037Tasks = await prisma.task.findMany({
      where: {
        deletedAt: null,
        project: {
          dateDeleted: null,
          departmentId: { in: divDeptIds }
        },
        OR: [{ closeType: null }, { closeType: 'COMPLETED' }],
      },
      include: { project: { select: { id: true, name: true, departmentId: true } } },
    });
    console.log(`   Division DIV-037: ${div037Tasks.length} tasks`);

    // Test 4: Filter by mission group (ID=1)
    const mgDepts = await prisma.department.findMany({
      where: {
        division: { missionGroupId: '1' },
        deletedAt: null
      },
      select: { id: true, name: true },
    });
    const mgDeptIds = mgDepts.map(d => d.id);
    console.log(`\n4. Mission Group 1 has ${mgDepts.length} departments`);

    const mg1Tasks = await prisma.task.findMany({
      where: {
        deletedAt: null,
        project: {
          dateDeleted: null,
          departmentId: { in: mgDeptIds }
        },
        OR: [{ closeType: null }, { closeType: 'COMPLETED' }],
      },
      include: { project: { select: { id: true, name: true, departmentId: true } } },
    });
    console.log(`   Mission Group 1: ${mg1Tasks.length} tasks`);

    console.log('\n✅ Database query test complete');
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
})();
