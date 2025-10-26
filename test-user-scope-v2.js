const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();

// Replicate getUserAccessibleScope logic
async function getUserAccessibleScope(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      departmentId: true,
      additionalRoles: true,
      department: {
        select: {
          id: true,
          divisionId: true,
          division: {
            select: {
              id: true,
              missionGroupId: true,
              missionGroup: { select: { id: true } },
            },
          },
        },
      },
    },
  });

  if (!user) return { departmentIds: [] };

  // ADMIN: All departments
  if (user.role === 'ADMIN') {
    const allDepts = await prisma.department.findMany({
      where: { deletedAt: null },
      select: { id: true },
    });
    return { departmentIds: allDepts.map(d => d.id) };
  }

  // Build department → role mapping
  const departmentRoleMap = {};
  if (user.departmentId) {
    departmentRoleMap[user.departmentId] = user.role;
  }

  // Add additional roles
  if (user.additionalRoles && typeof user.additionalRoles === 'object') {
    Object.entries(user.additionalRoles).forEach(([key, value]) => {
      let deptId, role;
      if (key.startsWith('DEPT-') || key.startsWith('DIV-')) {
        deptId = key;
        role = value;
      } else {
        deptId = value;
        role = key;
      }
      departmentRoleMap[deptId] = role;
    });
  }

  // Fetch all departments with hierarchy
  const allDepartments = await prisma.department.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      divisionId: true,
      division: {
        select: {
          id: true,
          missionGroupId: true,
        },
      },
    },
  });

  // Build lookup maps
  const deptToDivMap = new Map();
  const deptToMGMap = new Map();
  const divToDeptMap = new Map();
  const mgToDivMap = new Map();

  allDepartments.forEach(dept => {
    const divId = dept.divisionId;
    const mgId = dept.division.missionGroupId;

    deptToDivMap.set(dept.id, divId);
    deptToMGMap.set(dept.id, mgId);

    if (!divToDeptMap.has(divId)) divToDeptMap.set(divId, []);
    divToDeptMap.get(divId).push(dept.id);

    if (!mgToDivMap.has(mgId)) mgToDivMap.set(mgId, []);
    if (!mgToDivMap.get(mgId).includes(divId)) {
      mgToDivMap.get(mgId).push(divId);
    }
  });

  // Calculate accessible departments
  const accessibleDepts = new Set();

  Object.entries(departmentRoleMap).forEach(([deptId, role]) => {
    const divId = deptToDivMap.get(deptId);
    const mgId = deptToMGMap.get(deptId);
    if (!divId || !mgId) return;

    const normalizedRole = role.toUpperCase();

    if (normalizedRole === 'CHIEF') {
      // CHIEF: All departments in mission group
      const divsInMG = mgToDivMap.get(mgId) || [];
      divsInMG.forEach(d => {
        const deptsInDiv = divToDeptMap.get(d) || [];
        deptsInDiv.forEach(dept => accessibleDepts.add(dept));
      });
    } else if (normalizedRole === 'LEADER') {
      // LEADER: All departments in division
      const deptsInDiv = divToDeptMap.get(divId) || [];
      deptsInDiv.forEach(dept => accessibleDepts.add(dept));
    } else if (['HEAD', 'MEMBER', 'USER'].includes(normalizedRole)) {
      // HEAD/MEMBER/USER: Only own department
      accessibleDepts.add(deptId);
    }
  });

  return { departmentIds: Array.from(accessibleDepts) };
}

// Replicate getUserManageableUserIds logic
async function getUserManageableUserIds(userId) {
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      departmentId: true,
      additionalRoles: true,
    },
  });

  if (!currentUser) return [];

  // Only these roles can manage users
  if (!['ADMIN', 'CHIEF', 'LEADER', 'HEAD'].includes(currentUser.role)) {
    return [];
  }

  // Admin can manage all non-Admin users
  if (currentUser.role === 'ADMIN') {
    const allUsers = await prisma.user.findMany({
      where: {
        role: { not: 'ADMIN' },
        deletedAt: null,
      },
      select: { id: true },
    });
    return allUsers.map(u => u.id);
  }

  // For other roles, use getUserAccessibleScope
  const scope = await getUserAccessibleScope(userId);

  // Get all users in accessible departments
  const users = await prisma.user.findMany({
    where: {
      departmentId: { in: scope.departmentIds },
      role: { not: 'ADMIN' },
      deletedAt: null,
    },
    select: { id: true },
  });

  // Filter out self
  return users.map(u => u.id).filter(id => id !== userId);
}

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
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log('📊 ผู้ใช้ทั้งหมดในระบบ:', allUsers.length, 'คน\n');

    // Test each user's scope
    for (const testUser of allUsers) {
      console.log(`\n🔍 ทดสอบกับ: ${testUser.fullName} (${testUser.role})`);
      console.log(`   Email: ${testUser.email}`);
      if (testUser.department) {
        console.log(`   หน่วยงาน: ${testUser.department.name}`);
        console.log(`   กลุ่มงาน: ${testUser.department.division.name}`);
      }

      // Get manageable user IDs for this user
      const manageableIds = await getUserManageableUserIds(testUser.id);

      console.log(`   ✅ สามารถเห็นผู้ใช้: ${manageableIds.length} คน`);

      if (manageableIds.length > 0 && manageableIds.length <= 10) {
        // Get details of manageable users (only if <= 10 for readability)
        const manageableUsers = await prisma.user.findMany({
          where: { id: { in: manageableIds } },
          select: {
            id: true,
            fullName: true,
            role: true,
          },
          orderBy: { fullName: 'asc' }
        });

        console.log('\n   รายชื่อที่เห็น:');
        manageableUsers.forEach((u, i) => {
          console.log(`      ${i + 1}. ${u.fullName} (${u.role})`);
        });
      } else if (manageableIds.length === 0) {
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
