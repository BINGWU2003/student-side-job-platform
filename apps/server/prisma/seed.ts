import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/hash';

const prisma = new PrismaClient();

async function main() {
  const username = 'admin';
  const existing = await prisma.user.findUnique({ where: { username } });

  if (existing) {
    console.log('Admin user already exists, skipping seed.');
    return;
  }

  const password = await hashPassword('Admin@123456');

  await prisma.user.create({
    data: {
      username,
      password,
      phone: '13800000000',
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  console.log('Admin user created: admin');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
