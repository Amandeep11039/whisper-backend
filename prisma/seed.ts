import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing data...');
  await prisma.message.deleteMany();
  await prisma.revokedToken.deleteMany();
  await prisma.user.deleteMany();

  const defaultPin = '123456';
  const salt = await bcrypt.genSalt(10);
  const pinHash = await bcrypt.hash(defaultPin, salt);

  console.log('Seeding 2 users: alice and bob with 6-digit PIN: 123456');

  const alice = await prisma.user.create({
    data: {
      username: 'alice',
      pinHash,
    },
  });

  const bob = await prisma.user.create({
    data: {
      username: 'bob',
      pinHash,
    },
  });

  console.log(`Users created: ${alice.username} (${alice.id}), ${bob.username} (${bob.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
