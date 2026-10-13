const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Migrating existing Platform Super Admins to isPlatformAdmin = true...');
  const usersToUpdate = await prisma.user.findMany({
    where: {
      userRoles: {
        some: {
          role: {
            name: 'PLATFORM_SUPER_ADMIN',
            organization: {
              name: 'Platform HQ'
            }
          }
        }
      }
    }
  });

  console.log(`Found ${usersToUpdate.length} legitimate platform admins.`);
  
  for (const user of usersToUpdate) {
    await prisma.user.update({
      where: { id: user.id },
      data: { isPlatformAdmin: true }
    });
    console.log(`Migrated user: ${user.email}`);
  }
  console.log('Migration complete.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
