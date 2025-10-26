const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();

async function checkUsersCount() {
  try {
    console.log('===== สถิติผู้ใช้ในฐานข้อมูล =====\n');

    // Count all users
    const total = await prisma.user.count();
    console.log('ทั้งหมด:', total, 'คน');

    // Count active users
    const active = await prisma.user.count({
      where: { deletedAt: null }
    });
    console.log('Active (deletedAt = null):', active, 'คน');

    // Count deleted users
    const deleted = await prisma.user.count({
      where: { deletedAt: { not: null } }
    });
    console.log('Deleted (deletedAt != null):', deleted, 'คน');

    console.log('\n===== จำนวนตาม Role (Active เท่านั้น) =====\n');

    // Group by role
    const byRole = await prisma.user.groupBy({
      by: ['role'],
      where: { deletedAt: null },
      _count: true,
      orderBy: { role: 'asc' }
    });

    byRole.forEach(r => {
      console.log(r.role + ':', r._count, 'คน');
    });

    console.log('\n===== ตัวอย่างผู้ใช้ 5 คนแรก =====\n');

    // Show first 5 users
    const users = await prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        departmentId: true,
        department: {
          select: {
            name: true,
            division: {
              select: {
                name: true,
                missionGroup: {
                  select: { name: true }
                }
              }
            }
          }
        }
      },
      take: 5,
      orderBy: { createdAt: 'desc' }
    });

    users.forEach((u, i) => {
      console.log(`${i + 1}. ${u.fullName} (${u.email})`);
      console.log(`   Role: ${u.role}`);
      if (u.department) {
        console.log(`   หน่วยงาน: ${u.department.name}`);
        console.log(`   กลุ่มงาน: ${u.department.division.name}`);
        console.log(`   กลุ่มภารกิจ: ${u.department.division.missionGroup.name}`);
      }
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsersCount();
