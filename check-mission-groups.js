const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();

(async () => {
  try {
    const mgs = await prisma.missionGroup.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true }
    });

    console.log('Mission Groups:');
    mgs.forEach(mg => console.log('  -', mg.id, ':', mg.name));

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
