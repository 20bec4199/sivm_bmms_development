const { Pool } = require('pg');
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'building_management',
  password: 'password',
  port: 5432,
});

async function run() {
  const orgResult = await pool.query("SELECT id FROM organizations LIMIT 1");
  if (orgResult.rows.length === 0) {
    console.log("No organization found");
    return;
  }
  const orgId = orgResult.rows[0].id;
  const names = ['Electrical', 'Plumbing', 'Lift', 'Cleaning', 'Housekeeping', 'Parking', 'Security', 'Landscape', 'Pest Control', 'Water Leakage', 'Air Conditioning', 'Common Area', 'Others'];
  
  for (const name of names) {
    const existing = await pool.query("SELECT id FROM complaint_categories WHERE name = $1 AND \"organizationId\" = $2", [name, orgId]);
    if (existing.rows.length === 0) {
      await pool.query("INSERT INTO complaint_categories (id, \"organizationId\", name, description, \"createdAt\", \"updatedAt\") VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW())", [orgId, name, name]);
      console.log("Inserted " + name);
    } else {
      console.log("Exists " + name);
    }
  }
  console.log("Done");
  pool.end();
}
run();
