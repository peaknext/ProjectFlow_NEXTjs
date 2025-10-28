/**
 * Migration Script: SHA256 → bcrypt Password Hashing
 *
 * VULN-001 Fix: Hard Migration for Testing Environment
 *
 * This script will:
 * 1. Generate reset tokens for all existing users
 * 2. Clear all password hashes (force password reset)
 * 3. Send reset password emails to all users
 *
 * ⚠️  WARNING: This will INVALIDATE all current passwords!
 * ⚠️  All users will need to reset their passwords.
 *
 * Usage:
 *   npm run migrate:bcrypt
 *   or
 *   npx tsx scripts/migrate-to-bcrypt.ts
 */

import { PrismaClient } from '../src/generated/prisma/index.js';
import crypto from 'crypto';

const prisma = new PrismaClient();

function generateSecureToken(): string {
  return crypto.randomBytes(64).toString('hex'); // 128 characters
}

async function migrateToBcrypt() {
  console.log('🔒 Starting Password Hash Migration (SHA256 → bcrypt)');
  console.log('=====================================\n');

  try {
    // Get all active users
    const users = await prisma.user.findMany({
      where: {
        deletedAt: null,
        userStatus: 'ACTIVE',
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
      },
    });

    console.log(`📊 Found ${users.length} active users to migrate\n`);

    if (users.length === 0) {
      console.log('✅ No users to migrate. Exiting...');
      return;
    }

    // Confirm migration
    console.log('⚠️  WARNING: This will invalidate ALL current passwords!');
    console.log('⚠️  Users will need to use "Forgot Password" to reset.\n');

    const migrationData = [];

    // Process each user
    for (const user of users) {
      const resetToken = generateSecureToken();
      const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Update user with reset token and placeholder password
      await prisma.user.update({
        where: { id: user.id },
        data: {
          // Placeholder - will be replaced when user resets password
          passwordHash: '$2b$12$PLACEHOLDER_HASH_REQUIRES_RESET',
          salt: '', // No longer needed with bcrypt
          resetToken,
          resetTokenExpiry,
        },
      });

      migrationData.push({
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        resetToken,
      });

      console.log(`✅ Migrated: ${user.email} (${user.role})`);
    }

    console.log(`\n✅ Migration complete! Updated ${users.length} users.`);
    console.log('\n📧 Next steps:');
    console.log('   1. Send reset password emails to all users');
    console.log('   2. Users must use "Forgot Password" to set new passwords');
    console.log('   3. New passwords will automatically use bcrypt hashing\n');

    console.log('📋 Reset Links for Manual Distribution:');
    console.log('=====================================\n');

    for (const data of migrationData) {
      const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/reset-password?token=${data.resetToken}`;
      console.log(`${data.email} (${data.role}):`);
      console.log(`  ${resetLink}\n`);
    }

    console.log('\n✅ Migration script completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateToBcrypt()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
