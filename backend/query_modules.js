const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const modules = await prisma.moduleMaster.findMany();
  console.log('Available Modules:', modules);
}
main().finally(() => prisma.$disconnect());
