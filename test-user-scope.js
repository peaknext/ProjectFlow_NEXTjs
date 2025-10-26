const { PrismaClient } = require('./src/generated/prisma');
const { getUserManageableUserIds } = require('./src/lib/permissions');

const prisma = new PrismaClient();

async function testUserScope() {
  try {
    console.log('===== ทดสอบการแสดงผู้ใช้ในหน้าจัดการบุคลากร =====\n');

    // Get all active users
    const allUsers = await prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log('📊 ผู้ใช้ทั้งหมดในระบบ:', allUsers.length, 'คน\n');

    // Test each user's scope
    for (const testUser of allUsers) {
      console.log(`\n🔍 ทดสอบกับ: ${testUser.fullName} (${testUser.role})`);
      console.log(`   Email: ${testUser.email}`);
      console.log(`   User ID: ${testUser.id}`);

      // Get manageable user IDs for this user
      const manageableIds = await getUserManageableUserIds(testUser.id);

      console.log(`   ✅ สามารถเห็นผู้ใช้: ${manageableIds.length} คน`);

      if (manageableIds.length > 0) {
        // Get details of manageable users
        const manageableUsers = await prisma.user.findMany({
          where: { id: { in: manageableIds } },
          select: {
            id: true,
            fullName: true,
            role: true,
            email: true,
          },
          orderBy: { fullName: 'asc' }
        });

        console.log('\n   รายชื่อที่เห็น:');
        manageableUsers.forEach((u, i) => {
          console.log(`      ${i + 1}. ${u.fullName} (${u.role}) - ${u.email}`);
        });
      } else {
        console.log('   ⚠️  ไม่สามารถเห็นผู้ใช้คนใดได้ (role ไม่มีสิทธิ์จัดการบุคลากร)');
      }

      console.log('   ' + '─'.repeat(80));
    }

    console.log('\n\n===== สรุป =====\n');
    console.log('📋 Logic การกรองผู้ใช้:');
    console.log('   • ADMIN: เห็นทุกคน ยกเว้น ADMIN คนอื่น');
    console.log('   • CHIEF: เห็นผู้ใช้ใน Mission Group ของตัวเอง + additional roles');
    console.log('   • LEADER: เห็นผู้ใช้ใน Division ของตัวเอง + additional roles');
    console.log('   • HEAD: เห็นผู้ใช้ใน Department ของตัวเอง + additional roles');
    console.log('   • MEMBER/USER: ไม่เห็นใคร (ไม่มีสิทธิ์จัดการบุคลากร)');
    console.log('\n📌 หมายเหตุ: ผู้ใช้จะไม่เห็นตัวเองในรายการ (filtered out)');

  } catch (error) {
    console.error('❌ Error:', error);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testUserScope();
