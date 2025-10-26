const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();

async function checkCurrentSession() {
  try {
    console.log('===== ตรวจสอบ Session ปัจจุบัน =====\n');

    // Get all active sessions (not expired)
    const activeSessions = await prisma.session.findMany({
      where: {
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        userId: true,
        sessionToken: true,
        expiresAt: true,
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
            department: {
              select: {
                name: true,
                division: {
                  select: {
                    name: true,
                    missionGroup: { select: { name: true } }
                  }
                }
              }
            }
          }
        },
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    if (activeSessions.length === 0) {
      console.log('⚠️  ไม่พบ session ที่ active อยู่');
      console.log('\n💡 Hint: ให้ login ก่อนเพื่อสร้าง session');
      return;
    }

    console.log(`✅ พบ ${activeSessions.length} session ที่ active อยู่:\n`);

    activeSessions.forEach((session, i) => {
      const user = session.user;
      console.log(`${i + 1}. Session ID: ${session.id.substring(0, 20)}...`);
      console.log(`   User: ${user.fullName} (${user.role})`);
      console.log(`   Email: ${user.email}`);
      if (user.department) {
        console.log(`   หน่วยงาน: ${user.department.name}`);
        console.log(`   กลุ่มงาน: ${user.department.division.name}`);
        console.log(`   กลุ่มภารกิจ: ${user.department.division.missionGroup.name}`);
      }
      console.log(`   Token: ${session.sessionToken.substring(0, 30)}...`);
      console.log(`   สร้างเมื่อ: ${session.createdAt.toLocaleString('th-TH')}`);
      console.log(`   หมดอายุ: ${session.expiresAt.toLocaleString('th-TH')}`);

      // Calculate what this user should see
      let expectedCount = 0;
      if (user.role === 'ADMIN') {
        expectedCount = '7 คน (ทุกคนยกเว้น ADMIN คนอื่นและตัวเอง)';
      } else if (user.role === 'LEADER') {
        expectedCount = '3-4 คน (ผู้ใช้ใน Division เดียวกัน)';
      } else if (user.role === 'CHIEF') {
        expectedCount = 'ขึ้นอยู่กับจำนวนผู้ใช้ใน Mission Group';
      } else if (user.role === 'HEAD') {
        expectedCount = 'ผู้ใช้ใน Department เดียวกัน';
      } else {
        expectedCount = '0 คน (ไม่มีสิทธิ์จัดการบุคลากร)';
      }

      console.log(`   📊 ควรเห็นผู้ใช้: ${expectedCount}`);
      console.log('');
    });

    console.log('\n===== การตรวจสอบเพิ่มเติม =====\n');

    // Get most recent session
    const latestSession = activeSessions[0];
    const user = latestSession.user;

    console.log(`🔍 Session ล่าสุด: ${user.fullName} (${user.role})`);

    // Simulate getUserManageableUserIds for this user
    if (!['ADMIN', 'CHIEF', 'LEADER', 'HEAD'].includes(user.role)) {
      console.log('⚠️  Role นี้ไม่สามารถเข้าถึงหน้าจัดการบุคลากรได้');
      console.log('   (เฉพาะ ADMIN, CHIEF, LEADER, HEAD เท่านั้น)');
    } else {
      console.log('✅ Role นี้สามารถเข้าถึงหน้าจัดการบุคลากรได้');

      if (user.role === 'ADMIN') {
        const nonAdminUsers = await prisma.user.count({
          where: {
            role: { not: 'ADMIN' },
            deletedAt: null,
          }
        });
        console.log(`   จะเห็นผู้ใช้: ${nonAdminUsers} คน (ไม่รวมตัวเอง = ${nonAdminUsers - 1} คน)`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCurrentSession();
