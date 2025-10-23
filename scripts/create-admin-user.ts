/**
 * Script to create or update ADMIN test user
 * Run with: npx ts-node scripts/create-admin-user.ts
 */

import { prisma } from '../src/lib/db';

async function main() {
  const adminUser = await prisma.user.upsert({
    where: { id: 'admin001' },
    update: {
      role: 'ADMIN',
      isVerified: true,
      userStatus: 'ACTIVE',
    },
    create: {
      id: 'admin001',
      email: 'admin@hospital.test',
      fullName: 'Admin User (Test)',
      passwordHash: '511d3401e1485e7cc4445127a363bf2d9564ad56c31237b5b7287a4785c03e93',
      salt: 'randomsalt123',
      role: 'ADMIN',
      departmentId: 'DEPT-059',
      isVerified: true,
      userStatus: 'ACTIVE',
    },
  });

  console.log('✅ ADMIN user created/updated:');
  console.log('  ID:', adminUser.id);
  console.log('  Email:', adminUser.email);
  console.log('  Role:', adminUser.role);
  console.log('  Password: SecurePass123!');
  console.log('\nTo use this user with BYPASS_AUTH, add to .env:');
  console.log('  BYPASS_USER_ID=admin001');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
