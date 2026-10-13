import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { execSync } from 'child_process';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function resetDatabase() {
  console.log('\x1b[33m%s\x1b[0m', '═══════════════════════════════════════════════════════════════');
  console.log('\x1b[33m%s\x1b[0m', '  ⚠️  BMMS DATABASE RESET SCRIPT INITIATED');
  console.log('\x1b[33m%s\x1b[0m', '═══════════════════════════════════════════════════════════════');

  try {
    console.log('\x1b[36m%s\x1b[0m', '🔍 Scanning PostgreSQL database for existing public tables...');
    
    // Fetch all public table names except _prisma_migrations
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
        AND tablename != '_prisma_migrations';
    `;

    if (tables.length === 0) {
      console.log('\x1b[33m%s\x1b[0m', 'ℹ️  No tables found in public schema to truncate.');
    } else {
      console.log('\x1b[36m%s\x1b[0m', `🧹 Truncating ${tables.length} tables with RESTART IDENTITY CASCADE...`);

      // Quote table names properly for PostgreSQL
      const quotedTableNames = tables
        .map((t) => `"public"."${t.tablename}"`)
        .join(', ');

      await prisma.$executeRawUnsafe(
        `TRUNCATE TABLE ${quotedTableNames} RESTART IDENTITY CASCADE;`
      );

      console.log('\x1b[32m%s\x1b[0m', `✅ Successfully wiped ${tables.length} tables and reset ID sequences.`);
    }

    console.log('\x1b[36m%s\x1b[0m', '🌱 Executing fresh database seeding (Modules, Roles, Permissions, Super Admin)...');
    
    // Run the Prisma seed script
    execSync('npx prisma db seed', {
      stdio: 'inherit',
      cwd: process.cwd(),
      env: { ...process.env },
    });

    console.log('\x1b[32m%s\x1b[0m', '═══════════════════════════════════════════════════════════════');
    console.log('\x1b[32m%s\x1b[0m', '  ✨ DATABASE RESET AND SEEDING COMPLETED SUCCESSFULLY!');
    console.log('\x1b[32m%s\x1b[0m', '═══════════════════════════════════════════════════════════════');
    console.log('\x1b[36m%s\x1b[0m', 'Default Platform Admin Credentials:');
    console.log('\x1b[37m%s\x1b[0m', '  • Email:    admin@platform.com');
    console.log('\x1b[37m%s\x1b[0m', '  • Password: Password123');
    console.log('\x1b[37m%s\x1b[0m', '  • Role:     PLATFORM_SUPER_ADMIN');
    console.log('\x1b[32m%s\x1b[0m', '═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', '❌ Failed to reset database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resetDatabase();
