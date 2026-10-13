import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.user.updateMany({
    data: {
      lockedUntil: null,
      failedLoginCount: 0,
      isPermanentlyLocked: false,
    }
  });
  console.log('All accounts unlocked.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
