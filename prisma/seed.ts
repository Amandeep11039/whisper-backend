import { PrismaClient } from '@prisma/client';
import { hashPin } from '../src/utils/hash.js';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const user1 = await prisma.user.upsert({
    where: { username: 'user1' },
    update: {},
    create: {
      username: 'user1',
      displayName: 'Your Name',
      pinHash: await hashPin('000000'),
      preferences: { create: { theme: 'SYSTEM' } },
    },
  });

  const user2 = await prisma.user.upsert({
    where: { username: 'user2' },
    update: {},
    create: {
      username: 'user2',
      displayName: 'Their Name',
      pinHash: await hashPin('000000'),
      preferences: { create: { theme: 'SYSTEM' } },
    },
  });

  await prisma.nickname.upsert({
    where: { giverId_receiverId: { giverId: user1.id, receiverId: user2.id } },
    update: {},
    create: { giverId: user1.id, receiverId: user2.id, nickname: 'My Sunshine' },
  });

  console.log('Seeded two users. PINS are 000000.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
