import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function analyzeIdentities() {
  console.log('--- OWNER ANALYSIS ---');
  const owners = await prisma.owner.findMany({
    where: { userId: null },
  });
  console.log(`Found ${owners.length} owners without userId.`);

  let ownerMatches = 0;
  let ownerAmbiguous = 0;
  let ownerNoMatch = 0;

  for (const owner of owners) {
    if (!owner.email) {
      ownerNoMatch++;
      continue;
    }
    const users = await prisma.user.findMany({
      where: { 
        organizationId: owner.organizationId,
        email: owner.email 
      },
    });

    if (users.length === 1) {
      ownerMatches++;
      // console.log(`[CONFIDENT MATCH] Owner ${owner.email} -> User ${users[0].id}`);
    } else if (users.length > 1) {
      ownerAmbiguous++;
      // console.log(`[AMBIGUOUS MATCH] Owner ${owner.email} matches ${users.length} users`);
    } else {
      ownerNoMatch++;
      // console.log(`[NO MATCH] Owner ${owner.email} has no matching User`);
    }
  }

  console.log(`Confident Matches: ${ownerMatches}, Ambiguous: ${ownerAmbiguous}, No Match: ${ownerNoMatch}`);


  console.log('\n--- TENANT ANALYSIS ---');
  const tenants = await prisma.tenant.findMany({
    where: { userId: null },
  });
  console.log(`Found ${tenants.length} tenants without userId.`);

  let tenantMatches = 0;
  let tenantAmbiguous = 0;
  let tenantNoMatch = 0;

  for (const tenant of tenants) {
    if (!tenant.email) {
      tenantNoMatch++;
      continue;
    }
    const users = await prisma.user.findMany({
      where: { 
        organizationId: tenant.organizationId,
        email: tenant.email 
      },
    });

    if (users.length === 1) {
      tenantMatches++;
    } else if (users.length > 1) {
      tenantAmbiguous++;
    } else {
      tenantNoMatch++;
    }
  }

  console.log(`Confident Matches: ${tenantMatches}, Ambiguous: ${tenantAmbiguous}, No Match: ${tenantNoMatch}`);

  await prisma.$disconnect();
}

analyzeIdentities().catch(e => {
  console.error(e);
  process.exit(1);
});
