const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();

async function testAdminCanSeeAdmin() {
  try {
    console.log('===== ทดสอบว่า ADMIN เห็น ADMIN คนอื่นหรือไม่ =====\n');

    // Simulate the FIXED getUserManageableUserIds logic for ADMIN
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN', email: 'peaknext@gmail.com' }
    });

    if (!adminUser) {
      console.log('❌ ไม่พบ ADMIN user');
      return;
    }

    console.log(`✅ ทดสอบด้วย: ${adminUser.fullName} (${adminUser.role})`);
    console.log(`   Email: ${adminUser.email}\n`);

    // NEW LOGIC: Admin can see all users (including other admins)
    const allUsers = await prisma.user.findMany({
      where: {
        deletedAt: null,
        id: { not: adminUser.id }, // Exclude self
      },
      select: {
        id: true,
        fullName: true,
        role: true,
        email: true,
      },
      orderBy: { role: 'desc' }
    });

    console.log(`📊 จำนวนผู้ใช้ที่ ADMIN ควรเห็น: ${allUsers.length} คน\n`);

    // Group by role
    const byRole = {};
    allUsers.forEach(u => {
      if (!byRole[u.role]) byRole[u.role] = [];
      byRole[u.role].push(u);
    });

    console.log('===== รายชื่อที่ ADMIN เห็น (แบ่งตาม Role) =====\n');

    Object.keys(byRole).sort().reverse().forEach(role => {
      console.log(`📌 ${role}: ${byRole[role].length} คน`);
      byRole[role].forEach((u, i) => {
        console.log(`   ${i + 1}. ${u.fullName} - ${u.email}`);
      });
      console.log('');
    });

    // Check if ADMINs are included
    const adminCount = allUsers.filter(u => u.role === 'ADMIN').length;
    console.log('===== ผลการทดสอบ =====\n');
    if (adminCount > 0) {
      console.log(`✅ ถูกต้อง! ADMIN เห็น ADMIN คนอื่น: ${adminCount} คน`);
      console.log(`   (ทั้งหมด 3 ADMIN - 1 ตัวเอง = 2 คนที่เห็น)`);
    } else {
      console.log('❌ ผิด! ADMIN ไม่เห็น ADMIN คนอื่น');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAdminCanSeeAdmin();
