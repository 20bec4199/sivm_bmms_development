import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categories = [
  'Electrical',
  'Plumbing',
  'Lift',
  'Cleaning',
  'Housekeeping',
  'Parking',
  'Security',
  'Landscape',
  'Pest Control',
  'Water Leakage',
  'Air Conditioning',
  'Common Area',
  'Others'
];

async function main() {
  const org = await prisma.organization.findFirst();
  if (!org) {
    console.log('No organization found. Create an org first.');
    return;
  }

  for (const name of categories) {
    const exists = await prisma.complaintCategory.findFirst({
      where: { organizationId: org.id, name }
    });
    if (!exists) {
      await prisma.complaintCategory.create({
        data: {
          organizationId: org.id,
          name,
          description: `${name} related complaints`
        }
      });
      console.log(`Created category: ${name}`);
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
