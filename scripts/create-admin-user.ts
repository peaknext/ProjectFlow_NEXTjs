/**
 * Script to create or update ADMIN test user
 * Run with: npx ts-node scripts/create-admin-user.ts
 */

import { prisma } from "../src/lib/db";

async function main() {
  const adminUser = await prisma.user.upsert({
    where: { id: "admin001" },
    update: {
      role: "ADMIN",
      isVerified: true,
      userStatus: "ACTIVE",
    },
    create: {
      id: "admin001",
      email: "admin@hospital.test",
      titlePrefix: "นาย",
      firstName: "Admin",
      lastName: "User (Test)",
      passwordHash:
        "511d3401e1485e7cc4445127a363bf2d9564ad56c31237b5b7287a4785c03e93",
      salt: "randomsalt123",
      role: "ADMIN",
      departmentId: "DEPT-059",
      isVerified: true,
      userStatus: "ACTIVE",
    },
  });
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
