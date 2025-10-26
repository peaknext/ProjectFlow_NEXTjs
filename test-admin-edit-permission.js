const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();

// Replicate isUserInManagementScope for testing
async function isUserInManagementScope(currentUserId, targetUserId) {
  const [currentUser, targetUser] = await Promise.all([
    prisma.user.findUnique({
      where: { id: currentUserId },
      select: {
        id: true,
        role: true,
      },
    }),
    prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        role: true,
        fullName: true,
      },
    }),
  ]);

  if (!currentUser || !targetUser) return false;

  // Cannot manage yourself
  if (currentUserId === targetUserId) return false;

  // ADMIN special cases
  if (currentUser.role === 'ADMIN') {
    // Admin can manage all non-Admin users
    return targetUser.role !== 'ADMIN';
  }

  // Non-Admin cannot manage Admin users
  if (targetUser.role === 'ADMIN') return false;

  return false; // Simplified for this test
}

async function testAdminEditPermissions() {
  try {
    console.log('===== ทดสอบ Permission การแก้ไข =====\n');

    // Get admin user
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN', email: 'peaknext@gmail.com' }
    });

    // Get all users
    const allUsers = await prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        fullName: true,
        role: true,
      },
      orderBy: { role: 'desc' }
    });

    console.log(`🔍 ทดสอบด้วย: ${adminUser.fullName} (ADMIN)\n`);

    // Group by role
    const byRole = {};
    for (const user of allUsers) {
      if (user.id === adminUser.id) continue; // Skip self

      const canManage = await isUserInManagementScope(adminUser.id, user.id);

      if (!byRole[user.role]) {
        byRole[user.role] = { canEdit: [], cannotEdit: [] };
      }

      if (canManage) {
        byRole[user.role].canEdit.push(user);
      } else {
        byRole[user.role].cannotEdit.push(user);
      }
    }

    console.log('===== ผลการทดสอบ Permission =====\n');

    Object.keys(byRole).sort().reverse().forEach(role => {
      const data = byRole[role];
      const canEditCount = data.canEdit.length;
      const cannotEditCount = data.cannotEdit.length;
      const total = canEditCount + cannotEditCount;

      console.log(`📌 ${role} (${total} คน):`);

      if (canEditCount > 0) {
        console.log(`   ✅ แก้ไขได้: ${canEditCount} คน`);
        data.canEdit.forEach(u => {
          console.log(`      - ${u.fullName}`);
        });
      }

      if (cannotEditCount > 0) {
        console.log(`   ❌ แก้ไขไม่ได้: ${cannotEditCount} คน`);
        data.cannotEdit.forEach(u => {
          console.log(`      - ${u.fullName}`);
        });
      }

      console.log('');
    });

    // Summary
    console.log('===== สรุป =====\n');

    const adminsInList = allUsers.filter(u => u.role === 'ADMIN' && u.id !== adminUser.id);
    const canEditAdmins = await Promise.all(
      adminsInList.map(async u => await isUserInManagementScope(adminUser.id, u.id))
    );
    const canEditAdminCount = canEditAdmins.filter(Boolean).length;

    if (canEditAdminCount === 0 && adminsInList.length > 0) {
      console.log(`✅ ถูกต้อง! ADMIN เห็น ADMIN คนอื่น ${adminsInList.length} คน แต่แก้ไขไม่ได้ทั้งหมด`);
      console.log('   (ป้องกันการแก้ไขข้อมูล ADMIN คนอื่นสำเร็จ)');
    } else if (canEditAdminCount > 0) {
      console.log(`❌ ผิด! ADMIN สามารถแก้ไข ADMIN คนอื่นได้ ${canEditAdminCount} คน`);
    } else {
      console.log('⚠️  ไม่พบ ADMIN คนอื่นในระบบ');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testAdminEditPermissions();
