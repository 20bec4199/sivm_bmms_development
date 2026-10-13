const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const nodes = await prisma.propertyNode.findMany({
    where: { nodeType: 'BUILDING' }
  });
  console.log('BUILDINGS:', nodes);
}
main().finally(() => prisma.$disconnect());
