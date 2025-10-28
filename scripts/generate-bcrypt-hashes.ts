/**
 * Generate bcrypt hashes for seed data
 *
 * Usage: npx tsx scripts/generate-bcrypt-hashes.ts
 */

import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;
const PASSWORD = 'SecurePass123!';

async function generateHashes() {
  console.log('Generating bcrypt hashes for seed data...\n');
  console.log(`Password: ${PASSWORD}`);
  console.log(`Salt Rounds: ${SALT_ROUNDS}\n`);

  // Generate hashes for each user
  const users = [
    { id: 'admin001', email: 'admin@hospital.test' },
    { id: 'user001', email: 'somchai@hospital.test' },
    { id: 'user002', email: 'somying@hospital.test' },
    { id: 'user003', email: 'wichai@hospital.test' },
  ];

  console.log('Generated hashes:\n');
  console.log('-- All users use password: SecurePass123!\n');

  for (const user of users) {
    const hash = await bcrypt.hash(PASSWORD, SALT_ROUNDS);
    console.log(`-- ${user.id} (${user.email})`);
    console.log(`'${hash}',\n`);
  }
}

generateHashes();
