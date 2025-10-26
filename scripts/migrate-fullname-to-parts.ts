/**
 * Migration Script: Split fullName into titlePrefix, firstName, lastName
 *
 * This script updates existing user records that have fullName but missing
 * firstName or lastName fields.
 *
 * Thai title prefixes: นาย, นาง, นางสาว, ดร., รศ.ดร., ศ.ดร., พล.อ., ฯพณฯ, etc.
 */

import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

// Common Thai title prefixes
const TITLE_PREFIXES = [
  'ฯพณฯ',
  'พระ',
  'สมเด็จพระ',
  'พล.อ.', 'พล.ต.', 'พล.ท.', 'พล.ร.อ.', 'พล.ร.ต.', 'พล.ร.ท.',
  'พ.อ.', 'พ.ต.', 'พ.ท.',
  'ร.อ.', 'ร.ต.', 'ร.ท.',
  'น.อ.', 'น.ต.', 'น.ท.',
  'ร.ต.อ.', 'ร.ต.ต.', 'ร.ต.ท.',
  'จ.ส.อ.', 'จ.ส.ต.', 'จ.ส.ท.',
  'ศ.ดร.', 'รศ.ดร.', 'ผศ.ดร.',
  'ศ.', 'รศ.', 'ผศ.',
  'ดร.',
  'นาย', 'นาง', 'นางสาว',
  'Mr.', 'Mrs.', 'Miss', 'Ms.', 'Dr.',
];

/**
 * Split fullName into titlePrefix, firstName, lastName
 */
function splitFullName(fullName: string): {
  titlePrefix: string | null;
  firstName: string;
  lastName: string;
} {
  const trimmed = fullName.trim();

  // Check if starts with any title prefix
  let titlePrefix: string | null = null;
  let nameWithoutTitle = trimmed;

  for (const prefix of TITLE_PREFIXES) {
    if (trimmed.startsWith(prefix + ' ') || trimmed.startsWith(prefix)) {
      titlePrefix = prefix;
      nameWithoutTitle = trimmed.substring(prefix.length).trim();
      break;
    }
  }

  // Split remaining name into firstName and lastName
  const parts = nameWithoutTitle.split(/\s+/);

  if (parts.length === 0) {
    // Edge case: empty name (shouldn't happen)
    return {
      titlePrefix,
      firstName: 'N/A',
      lastName: 'N/A',
    };
  } else if (parts.length === 1) {
    // Only one name (rare case)
    return {
      titlePrefix,
      firstName: parts[0],
      lastName: parts[0], // Use same for both
    };
  } else {
    // Multiple parts: first part is firstName, rest is lastName
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ');

    return {
      titlePrefix,
      firstName,
      lastName,
    };
  }
}

async function main() {
  console.log('🚀 Starting fullName migration...\n');

  try {
    // Get all users that need migration (have fullName but missing firstName or lastName)
    const usersToMigrate = await prisma.user.findMany({
      where: {
        OR: [
          { firstName: null },
          { lastName: null },
        ],
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        firstName: true,
        lastName: true,
        titlePrefix: true,
      },
    });

    console.log(`📊 Found ${usersToMigrate.length} users to migrate\n`);

    if (usersToMigrate.length === 0) {
      console.log('✅ No users need migration. All users already have firstName and lastName.');
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const user of usersToMigrate) {
      try {
        const { titlePrefix, firstName, lastName } = splitFullName(user.fullName);

        console.log(`📝 Migrating: ${user.fullName}`);
        console.log(`   → Title: ${titlePrefix || '(none)'}`);
        console.log(`   → First: ${firstName}`);
        console.log(`   → Last: ${lastName}`);

        await prisma.user.update({
          where: { id: user.id },
          data: {
            titlePrefix,
            firstName,
            lastName,
            // Keep fullName as-is for backward compatibility
          },
        });

        successCount++;
        console.log(`   ✅ Success\n`);

      } catch (error: any) {
        errorCount++;
        console.error(`   ❌ Error updating user ${user.email}:`, error.message, '\n');
      }
    }

    console.log('\n📈 Migration Summary:');
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📊 Total: ${usersToMigrate.length}`);

    if (successCount === usersToMigrate.length) {
      console.log('\n🎉 Migration completed successfully!');
    } else {
      console.log('\n⚠️  Migration completed with errors. Please review the logs above.');
    }

  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
