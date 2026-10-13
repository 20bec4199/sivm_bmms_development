import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as argon2 from 'argon2';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function seedDemoData() {
  console.log('🚀 Starting Comprehensive Property & Parking Management Demo Seeding...\n');

  // 1. Identify Target Organization (Tamil Apartments or first available)
  let org = await prisma.organization.findFirst({
    where: { name: 'Tamil Apartments' },
  });

  if (!org) {
    org = await prisma.organization.findFirst({
      where: { NOT: { name: 'Platform HQ' } },
    });
  }

  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: 'Prestige Smart City Community',
        industry: 'Real Estate & Property Management',
        size: '100-500',
      },
    });
  }

  const orgId = org.id;
  console.log(`🏢 Target Organization: "${org.name}" (ID: ${orgId})`);

  // Ensure default resident roles exist for this organization
  const ownerRole = await prisma.role.findFirst({ where: { name: 'UNIT_OWNER' } });
  const tenantRole = await prisma.role.findFirst({ where: { name: 'TENANT' } });
  const orgAdmin = await prisma.user.findFirst({
    where: { organizationId: orgId },
  });

  const defaultPasswordHash = await argon2.hash('Password123', { type: argon2.argon2id });

  // Helper to upsert a resident user account
  async function ensureResidentUser(email: string, firstName: string, lastName: string, roleId?: string) {
    let user = await prisma.user.findFirst({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          emailNormalized: email.toLowerCase(),
          passwordHash: defaultPasswordHash,
          firstName,
          lastName,
          isActive: true,
          emailVerified: true,
          organizationId: orgId,
          userRoles: roleId ? { create: { roleId } } : undefined,
        },
      });
    }
    return user;
  }

  // -------------------------------------------------------------
  // 2. BUILDINGS (Top-level PropertyNodes)
  // -------------------------------------------------------------
  console.log('\n🏗️  Seeding Buildings...');
  const buildingsData = [
    {
      name: 'Empire Grand Tower',
      address: 'Plot 42, Central IT Corridor Road',
      city: 'Chennai',
      state: 'Tamil Nadu',
      zipCode: '600096',
      country: 'India',
      sizeSqft: 250000,
    },
    {
      name: 'Cyber Gateway Pinnacle',
      address: 'Block 7, Tech Park Phase 2',
      city: 'Chennai',
      state: 'Tamil Nadu',
      zipCode: '600119',
      country: 'India',
      sizeSqft: 180000,
    },
    {
      name: 'Greenwood Haven Residency',
      address: '15, Lake View Avenue',
      city: 'Chennai',
      state: 'Tamil Nadu',
      zipCode: '600042',
      country: 'India',
      sizeSqft: 120000,
    },
  ];

  const buildings: any[] = [];
  for (const b of buildingsData) {
    let node = await prisma.propertyNode.findFirst({
      where: { organizationId: orgId, nodeType: 'BUILDING', name: b.name },
    });
    if (!node) {
      node = await prisma.propertyNode.create({
        data: {
          organizationId: orgId,
          nodeType: 'BUILDING',
          name: b.name,
          address: b.address,
          city: b.city,
          state: b.state,
          zipCode: b.zipCode,
          country: b.country,
          sizeSqft: b.sizeSqft,
          status: 'ACTIVE',
        },
      });
    }
    buildings.push(node);
    console.log(`   ✓ Building: ${node.name}`);
  }

  // -------------------------------------------------------------
  // 3. TOWERS / BLOCKS
  // -------------------------------------------------------------
  console.log('\n🗼 Seeding Towers & Blocks...');
  const towersData = [
    { buildingIdx: 0, name: 'Tower A (Emerald)' },
    { buildingIdx: 0, name: 'Tower B (Sapphire)' },
    { buildingIdx: 1, name: 'Tech Wing Alpha' },
    { buildingIdx: 1, name: 'Tech Wing Beta' },
    { buildingIdx: 2, name: 'Block Meadow' },
  ];

  const towers: any[] = [];
  for (const t of towersData) {
    const parentBuilding = buildings[t.buildingIdx];
    let node = await prisma.propertyNode.findFirst({
      where: { organizationId: orgId, nodeType: 'TOWER', parentId: parentBuilding.id, name: t.name },
    });
    if (!node) {
      node = await prisma.propertyNode.create({
        data: {
          organizationId: orgId,
          nodeType: 'TOWER',
          parentId: parentBuilding.id,
          name: t.name,
          status: 'ACTIVE',
        },
      });
    }
    towers.push(node);
    console.log(`   ✓ Tower: ${node.name} (in ${parentBuilding.name})`);
  }

  // -------------------------------------------------------------
  // 4. FLOORS
  // -------------------------------------------------------------
  console.log('\n🏢 Seeding Floors...');
  const floors: any[] = [];
  const floorTemplates = [
    { name: 'Basement Level B2', level: -2 },
    { name: 'Basement Level B1', level: -1 },
    { name: 'Ground Floor', level: 0 },
    { name: '1st Floor', level: 1 },
    { name: '2nd Floor', level: 2 },
    { name: '3rd Floor', level: 3 },
    { name: '4th Floor (Executive)', level: 4 },
  ];

  for (const tower of towers) {
    for (const f of floorTemplates) {
      let node = await prisma.propertyNode.findFirst({
        where: { organizationId: orgId, nodeType: 'FLOOR', parentId: tower.id, name: f.name },
      });
      if (!node) {
        node = await prisma.propertyNode.create({
          data: {
            organizationId: orgId,
            nodeType: 'FLOOR',
            parentId: tower.id,
            name: f.name,
            metadata: { level: f.level },
            status: 'ACTIVE',
          },
        });
      }
      floors.push({ ...node, towerName: tower.name });
    }
    console.log(`   ✓ Added 7 floors to ${tower.name}`);
  }

  // -------------------------------------------------------------
  // 5. UNITS (Apartments, Suites & Offices)
  // -------------------------------------------------------------
  console.log('\n🚪 Seeding Units...');
  const unitsSpec = [
    // Tower A Residential Units (1st to 4th Floor)
    { towerIdx: 0, floorLevel: 1, unitNumber: 'A-101', category: 'RESIDENTIAL', type: '3BHK', sizeSqft: 1650 },
    { towerIdx: 0, floorLevel: 1, unitNumber: 'A-102', category: 'RESIDENTIAL', type: '2BHK', sizeSqft: 1250 },
    { towerIdx: 0, floorLevel: 2, unitNumber: 'A-201', category: 'RESIDENTIAL', type: '3BHK', sizeSqft: 1700 },
    { towerIdx: 0, floorLevel: 2, unitNumber: 'A-202', category: 'RESIDENTIAL', type: '4BHK', sizeSqft: 2200 },
    { towerIdx: 0, floorLevel: 3, unitNumber: 'A-301', category: 'RESIDENTIAL', type: '3BHK', sizeSqft: 1650 },
    { towerIdx: 0, floorLevel: 3, unitNumber: 'A-302', category: 'RESIDENTIAL', type: '2BHK', sizeSqft: 1250 },
    { towerIdx: 0, floorLevel: 4, unitNumber: 'A-401 (Penthouse)', category: 'RESIDENTIAL', type: 'DUPLEX', sizeSqft: 3400 },

    // Tower B Residential Units
    { towerIdx: 1, floorLevel: 1, unitNumber: 'B-101', category: 'RESIDENTIAL', type: '3BHK', sizeSqft: 1600 },
    { towerIdx: 1, floorLevel: 1, unitNumber: 'B-102', category: 'RESIDENTIAL', type: '2BHK', sizeSqft: 1200 },
    { towerIdx: 1, floorLevel: 2, unitNumber: 'B-201', category: 'RESIDENTIAL', type: '3BHK', sizeSqft: 1600 },
    { towerIdx: 1, floorLevel: 3, unitNumber: 'B-301', category: 'RESIDENTIAL', type: '3BHK', sizeSqft: 1650 },

    // Commercial Offices in Tech Wing Alpha
    { towerIdx: 2, floorLevel: 1, unitNumber: 'Suite-101 (FinTech Labs)', category: 'COMMERCIAL', type: 'OFFICE', sizeSqft: 4500 },
    { towerIdx: 2, floorLevel: 2, unitNumber: 'Suite-201 (Cloud Solutions)', category: 'COMMERCIAL', type: 'OFFICE', sizeSqft: 5200 },
    { towerIdx: 2, floorLevel: 3, unitNumber: 'Suite-301 (Cyber Defense)', category: 'COMMERCIAL', type: 'OFFICE', sizeSqft: 4800 },

    // Commercial Offices in Tech Wing Beta
    { towerIdx: 3, floorLevel: 1, unitNumber: 'Studio-101 (Design HQ)', category: 'COMMERCIAL', type: 'STUDIO', sizeSqft: 2800 },
    { towerIdx: 3, floorLevel: 2, unitNumber: 'Suite-202 (AI Research)', category: 'COMMERCIAL', type: 'OFFICE', sizeSqft: 6100 },

    // Greenwood Haven Villas
    { towerIdx: 4, floorLevel: 1, unitNumber: 'Villa-01 (Lakefront)', category: 'RESIDENTIAL', type: '4BHK', sizeSqft: 2900 },
    { towerIdx: 4, floorLevel: 1, unitNumber: 'Villa-02 (Gardenia)', category: 'RESIDENTIAL', type: '3BHK', sizeSqft: 2300 },
    { towerIdx: 4, floorLevel: 2, unitNumber: 'Villa-03 (Sunset)', category: 'RESIDENTIAL', type: '3BHK', sizeSqft: 2300 },
  ];

  const units: any[] = [];
  for (const u of unitsSpec) {
    const parentTower = towers[u.towerIdx];
    // Find matching floor in this tower
    const floorNode = floors.find(
      (f) => f.parentId === parentTower.id && f.metadata?.level === u.floorLevel
    );

    const parentFloorId = floorNode ? floorNode.id : parentTower.id;

    let node = await prisma.propertyNode.findFirst({
      where: { organizationId: orgId, nodeType: 'UNIT', parentId: parentFloorId, name: u.unitNumber },
    });
    if (!node) {
      node = await prisma.propertyNode.create({
        data: {
          organizationId: orgId,
          nodeType: 'UNIT',
          parentId: parentFloorId,
          name: u.unitNumber,
          sizeSqft: u.sizeSqft,
          metadata: {
            category: u.category,
            type: u.type,
            sizeSqft: u.sizeSqft,
            status: 'OCCUPIED',
          },
          status: 'ACTIVE',
        },
      });
    }
    units.push({ ...node, unitNumber: u.unitNumber, towerName: parentTower.name });
    console.log(`   ✓ Unit ${u.unitNumber} (${u.type}, ${u.sizeSqft} sqft)`);
  }

  // -------------------------------------------------------------
  // 6. OWNERS & TENANTS (Residents with linked user accounts)
  // -------------------------------------------------------------
  console.log('\n👥 Seeding Owners and Tenants...');

  const ownersData = [
    { unitIdx: 0, first: 'Rajesh', last: 'Kannan', email: 'rajesh.kannan@example.com', phone: '9840123451' },
    { unitIdx: 1, first: 'Meera', last: 'Narayanan', email: 'meera.n@example.com', phone: '9840123452' },
    { unitIdx: 2, first: 'Siddharth', last: 'Menon', email: 'siddharth.m@example.com', phone: '9840123453' },
    { unitIdx: 3, first: 'Ananya', last: 'Sundaram', email: 'ananya.sundaram@example.com', phone: '9840123454' },
    { unitIdx: 4, first: 'Vikram', last: 'Rathore', email: 'vikram.rathore@example.com', phone: '9840123455' },
    { unitIdx: 6, first: 'Karthik', last: 'Subramanian', email: 'karthik.subbu@example.com', phone: '9840123456' },
    { unitIdx: 7, first: 'Divya', last: 'Prakash', email: 'divya.prakash@example.com', phone: '9840123457' },
    { unitIdx: 11, first: 'Dr. Arun', last: 'Chandran', email: 'arun.chandran@fintechlabs.io', phone: '9840123458' },
    { unitIdx: 16, first: 'Lakshmi', last: 'Narayanan', email: 'lakshmi.narayan@example.com', phone: '9840123459' },
  ];

  const owners: any[] = [];
  for (const o of ownersData) {
    const unitNode = units[o.unitIdx];
    const user = await ensureResidentUser(o.email, o.first, o.last, ownerRole?.id);

    let owner = await prisma.owner.findFirst({
      where: { organizationId: orgId, propertyNodeId: unitNode.id, email: o.email },
    });

    if (!owner) {
      owner = await prisma.owner.create({
        data: {
          organizationId: orgId,
          propertyNodeId: unitNode.id,
          firstName: o.first,
          lastName: o.last,
          email: o.email,
          phone: o.phone,
          moveInDate: new Date('2024-01-15'),
          userId: user.id,
        },
      });
    }

    // Link UserPropertyNode for resident portal
    const upnExists = await prisma.userPropertyNode.findFirst({
      where: { userId: user.id, propertyNodeId: unitNode.id },
    });
    if (!upnExists) {
      await prisma.userPropertyNode.create({
        data: {
          organizationId: orgId,
          userId: user.id,
          propertyNodeId: unitNode.id,
          accessLevel: 'FULL',
        },
      });
    }

    owners.push({ ...owner, unitNode });
    console.log(`   ✓ Owner: ${o.first} ${o.last} -> Unit ${unitNode.unitNumber}`);
  }

  const tenantsData = [
    { unitIdx: 5, first: 'Pradeep', last: 'Kumar', email: 'pradeep.kumar@example.com', phone: '9840223461', start: '2025-06-01', end: '2026-05-31' },
    { unitIdx: 8, first: 'Pooja', last: 'Hegde', email: 'pooja.hegde@example.com', phone: '9840223462', start: '2025-08-01', end: '2026-07-31' },
    { unitIdx: 9, first: 'Amitabh', last: 'Sen', email: 'amitabh.sen@example.com', phone: '9840223463', start: '2025-03-01', end: '2026-02-28' },
    { unitIdx: 12, first: 'Sarah', last: 'Jenkins', email: 'sarah.j@cloudsolutions.com', phone: '9840223464', start: '2024-11-01', end: '2027-10-31' },
    { unitIdx: 17, first: 'Varun', last: 'Dhawan', email: 'varun.dhawan@example.com', phone: '9840223465', start: '2025-01-10', end: '2026-01-09' },
  ];

  const tenants: any[] = [];
  for (const t of tenantsData) {
    const unitNode = units[t.unitIdx];
    const user = await ensureResidentUser(t.email, t.first, t.last, tenantRole?.id);

    let tenant = await prisma.tenant.findFirst({
      where: { organizationId: orgId, propertyNodeId: unitNode.id, phone: t.phone },
    });

    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          organizationId: orgId,
          propertyNodeId: unitNode.id,
          firstName: t.first,
          lastName: t.last,
          email: t.email,
          phone: t.phone,
          leaseStart: new Date(t.start),
          leaseEnd: new Date(t.end),
          userId: user.id,
        },
      });
    }

    const upnExists = await prisma.userPropertyNode.findFirst({
      where: { userId: user.id, propertyNodeId: unitNode.id },
    });
    if (!upnExists) {
      await prisma.userPropertyNode.create({
        data: {
          organizationId: orgId,
          userId: user.id,
          propertyNodeId: unitNode.id,
          accessLevel: 'READ_ONLY',
        },
      });
    }

    tenants.push({ ...tenant, unitNode });
    console.log(`   ✓ Tenant: ${t.first} ${t.last} -> Unit ${unitNode.unitNumber}`);
  }

  // -------------------------------------------------------------
  // 7. VEHICLES (Cars, SUVs, Electric Vehicles, Two-wheelers)
  // -------------------------------------------------------------
  console.log('\n🚗 Seeding Registered Vehicles...');
  const vehiclesSpec = [
    { unitIdx: 0, plate: 'TN01AB1024', make: 'Honda', model: 'City ZX', color: 'Platinum White' },
    { unitIdx: 0, plate: 'TN01EV2048', make: 'Tata', model: 'Nexon EV Empowered', color: 'Intense Teal' },
    { unitIdx: 1, plate: 'TN07CD5512', make: 'Hyundai', model: 'Creta SX(O)', color: 'Titan Grey' },
    { unitIdx: 2, plate: 'KA03EV9999', make: 'Tesla', model: 'Model 3 Long Range', color: 'Pearl White' },
    { unitIdx: 2, plate: 'TN03BK3500', make: 'Royal Enfield', model: 'Hunter 350', color: 'Dapper Ash' },
    { unitIdx: 3, plate: 'TN09EF7821', make: 'Kia', model: 'Seltos GTX+', color: 'Imperial Blue' },
    { unitIdx: 4, plate: 'TN05BM3300', make: 'BMW', model: '330Li M Sport', color: 'Portimao Blue' },
    { unitIdx: 5, plate: 'TN02XY7712', make: 'Maruti Suzuki', model: 'Swift ZXi+', color: 'Solid Fire Red' },
    { unitIdx: 6, plate: 'TN14EV8800', make: 'MG', model: 'ZS EV Exclusive', color: 'Currant Red' },
    { unitIdx: 6, plate: 'TN14EL1122', make: 'Ather', model: '450X Gen 3', color: 'Space Grey' },
    { unitIdx: 7, plate: 'TN10JK4455', make: 'Toyota', model: 'Hyryder Hybrid', color: 'Cave Black' },
    { unitIdx: 8, plate: 'TN04MN9090', make: 'Volkswagen', model: 'Virtus GT', color: 'Wild Cherry Red' },
    { unitIdx: 11, plate: 'KA05FT1001', make: 'Audi', model: 'A6 Technology', color: 'Mythos Black' },
    { unitIdx: 12, plate: 'KA01CS2020', make: 'Mercedes-Benz', model: 'E-Class E220d', color: 'Obsidian Black' },
    { unitIdx: 16, plate: 'TN19GH6789', make: 'Mahindra', model: 'XUV700 AX7L', color: 'Midnight Black' },
    { unitIdx: 17, plate: 'TN22PQ3344', make: 'Skoda', model: 'Slavia 1.5 TSI', color: 'Lava Blue' },
  ];

  const vehicles: any[] = [];
  for (const v of vehiclesSpec) {
    const unitNode = units[v.unitIdx];
    let veh = await prisma.vehicle.findFirst({
      where: { organizationId: orgId, licensePlate: v.plate },
    });

    if (!veh) {
      veh = await prisma.vehicle.create({
        data: {
          organizationId: orgId,
          propertyNodeId: unitNode.id,
          licensePlate: v.plate,
          make: v.make,
          model: v.model,
          color: v.color,
        },
      });
    }
    vehicles.push({ ...veh, unitNode });
    console.log(`   ✓ Vehicle: [${v.plate}] ${v.make} ${v.model} (${v.color}) -> Unit ${unitNode.unitNumber}`);
  }

  // -------------------------------------------------------------
  // 8. PARKING AREAS / ZONES
  // -------------------------------------------------------------
  console.log('\n🅿️  Seeding SmartiPark Zones & Areas...');
  const parkingAreasData = [
    {
      name: 'Basement B1 - Resident North Wing',
      description: 'Exclusive residential allocated bays with automated barrier entry and surveillance.',
      type: 'BASEMENT',
      totalSlots: 20,
      buildingIdx: 0,
    },
    {
      name: 'Basement B2 - Supercharger EV Hub',
      description: 'High-speed EV charging bays with automated energy monitoring and idle fee management.',
      type: 'BASEMENT',
      totalSlots: 10,
      buildingIdx: 0,
    },
    {
      name: 'Podium Level 1 - Executive & Office Parking',
      description: 'Covered podium parking for commercial tenants, corporate fleet and VIP guests.',
      type: 'INDOOR',
      totalSlots: 12,
      buildingIdx: 1,
    },
    {
      name: 'Surface Lot - Visitor & Guest Parking',
      description: 'Outdoor open-air parking stalls with 2-hour free visitor validation passes.',
      type: 'OUTDOOR',
      totalSlots: 10,
      buildingIdx: 0,
    },
    {
      name: 'Greenwood South - Residential Courtyard',
      description: 'Villa and townhouse dedicated vehicle stalls.',
      type: 'OUTDOOR',
      totalSlots: 8,
      buildingIdx: 2,
    },
  ];

  const areas: any[] = [];
  for (const a of parkingAreasData) {
    const parentBuilding = buildings[a.buildingIdx];
    let area = await prisma.parkingArea.findFirst({
      where: { organizationId: orgId, name: a.name },
    });

    if (!area) {
      area = await prisma.parkingArea.create({
        data: {
          organizationId: orgId,
          name: a.name,
          description: a.description,
          type: a.type,
          totalSlots: a.totalSlots,
          propertyNodeId: parentBuilding.id,
        },
      });
    }
    areas.push(area);
    console.log(`   ✓ Parking Zone: "${area.name}" (${area.type}, ${area.totalSlots} slots)`);
  }

  // -------------------------------------------------------------
  // 9. PARKING SLOTS / BAYS (Standard, EV, Accessible, Visitor)
  // -------------------------------------------------------------
  console.log('\n🚗 Seeding Parking Bays...');
  const slots: any[] = [];

  // Zone 1: Basement B1 (Resident Stalls B1-01 to B1-16)
  for (let i = 1; i <= 16; i++) {
    const slotNumber = `B1-${i.toString().padStart(2, '0')}`;
    const code = `B1-N-${i.toString().padStart(2, '0')}`;
    let slot = await prisma.parkingSlot.findFirst({
      where: { areaId: areas[0].id, slotNumber },
    });
    if (!slot) {
      slot = await prisma.parkingSlot.create({
        data: {
          organizationId: orgId,
          areaId: areas[0].id,
          slotNumber,
          code,
          zone: 'North Wing',
          size: i % 5 === 0 ? 'COMPACT' : 'STANDARD',
          type: i === 15 ? 'HANDICAPPED' : 'STANDARD',
          status: 'AVAILABLE',
          isAccessible: i === 15,
          notes: i === 15 ? 'Designated accessible bay near elevator bank' : undefined,
        },
      });
    }
    slots.push(slot);
  }

  // Zone 2: Basement B2 (EV Supercharger Hub EV-01 to EV-08)
  for (let i = 1; i <= 8; i++) {
    const slotNumber = `EV-${i.toString().padStart(2, '0')}`;
    const code = `B2-EV-${i.toString().padStart(2, '0')}`;
    let slot = await prisma.parkingSlot.findFirst({
      where: { areaId: areas[1].id, slotNumber },
    });
    if (!slot) {
      slot = await prisma.parkingSlot.create({
        data: {
          organizationId: orgId,
          areaId: areas[1].id,
          slotNumber,
          code,
          zone: 'EV Hub',
          size: 'STANDARD',
          type: 'EV_CHARGING',
          status: 'AVAILABLE',
          isEv: true,
          notes: '22kW AC Fast Charger equipped with Type 2 connector',
        },
      });
    }
    slots.push(slot);
  }

  // Zone 3: Podium Level 1 (Executive & Office P1-01 to P1-10)
  for (let i = 1; i <= 10; i++) {
    const slotNumber = `P1-${i.toString().padStart(2, '0')}`;
    const code = `POD-1-${i.toString().padStart(2, '0')}`;
    let slot = await prisma.parkingSlot.findFirst({
      where: { areaId: areas[2].id, slotNumber },
    });
    if (!slot) {
      slot = await prisma.parkingSlot.create({
        data: {
          organizationId: orgId,
          areaId: areas[2].id,
          slotNumber,
          code,
          zone: 'Podium Commercial',
          size: 'LARGE',
          type: i <= 3 ? 'VISITOR' : 'STANDARD',
          status: i === 9 ? 'MAINTENANCE' : 'AVAILABLE',
          maintenanceStatus: i === 9 ? 'Sensor telemetry recalibration in progress' : undefined,
          notes: i <= 3 ? 'Reserved for corporate clients' : undefined,
        },
      });
    }
    slots.push(slot);
  }

  // Zone 4: Surface Lot (Visitor VST-01 to VST-06)
  for (let i = 1; i <= 6; i++) {
    const slotNumber = `VST-${i.toString().padStart(2, '0')}`;
    const code = `SRF-V-${i.toString().padStart(2, '0')}`;
    let slot = await prisma.parkingSlot.findFirst({
      where: { areaId: areas[3].id, slotNumber },
    });
    if (!slot) {
      slot = await prisma.parkingSlot.create({
        data: {
          organizationId: orgId,
          areaId: areas[3].id,
          slotNumber,
          code,
          zone: 'Surface Plaza',
          size: 'STANDARD',
          type: 'VISITOR',
          status: 'AVAILABLE',
          notes: 'Standard 2h free visitor validation bay',
        },
      });
    }
    slots.push(slot);
  }

  console.log(`   ✓ Created ${slots.length} total parking bays across 4 zones.`);

  // -------------------------------------------------------------
  // 10. ALLOCATIONS (Linking Bays to Units, Residents, Vehicles)
  // -------------------------------------------------------------
  console.log('\n🔗 Seeding Parking Allocations...');

  const allocationsSpec = [
    // Unit A-101 (Rajesh Kannan) -> Bay B1-01 with Honda City
    { slotNumber: 'B1-01', unitIdx: 0, vehicleIdx: 0, type: 'PERMANENT' },
    // Unit A-101 (Rajesh Kannan second car) -> Bay EV-01 with Tata Nexon EV
    { slotNumber: 'EV-01', unitIdx: 0, vehicleIdx: 1, type: 'PERMANENT' },
    // Unit A-102 (Meera Narayanan) -> Bay B1-02 with Hyundai Creta
    { slotNumber: 'B1-02', unitIdx: 1, vehicleIdx: 2, type: 'PERMANENT' },
    // Unit A-201 (Siddharth Menon) -> Bay EV-02 with Tesla Model 3
    { slotNumber: 'EV-02', unitIdx: 2, vehicleIdx: 3, type: 'PERMANENT' },
    // Unit A-202 (Ananya Sundaram) -> Bay B1-03 with Kia Seltos
    { slotNumber: 'B1-03', unitIdx: 3, vehicleIdx: 5, type: 'PERMANENT' },
    // Unit A-301 (Vikram Rathore) -> Bay B1-04 with BMW 330Li
    { slotNumber: 'B1-04', unitIdx: 4, vehicleIdx: 6, type: 'PERMANENT' },
    // Unit A-302 (Pradeep Kumar - Tenant) -> Bay B1-05 with Maruti Swift
    { slotNumber: 'B1-05', unitIdx: 5, vehicleIdx: 7, type: 'PERMANENT' },
    // Unit A-401 Penthouse (Karthik Subramanian) -> Bay EV-03 with MG ZS EV
    { slotNumber: 'EV-03', unitIdx: 6, vehicleIdx: 8, type: 'PERMANENT' },
    // Commercial Suite-101 (FinTech Labs) -> Bay P1-04 with Audi A6
    { slotNumber: 'P1-04', unitIdx: 11, vehicleIdx: 12, type: 'PERMANENT' },
    // Commercial Suite-201 (Cloud Solutions) -> Bay P1-05 with Mercedes E220d
    { slotNumber: 'P1-05', unitIdx: 12, vehicleIdx: 13, type: 'PERMANENT' },
  ];

  for (const alloc of allocationsSpec) {
    const slot = slots.find((s) => s.slotNumber === alloc.slotNumber);
    const unitNode = units[alloc.unitIdx];
    const veh = vehicles[alloc.vehicleIdx];

    if (!slot || !unitNode || !veh) continue;

    // Check if slot already has active allocation
    const existing = await prisma.parkingAllocation.findFirst({
      where: { slotId: slot.id, isActive: true },
    });

    if (!existing) {
      await prisma.parkingAllocation.create({
        data: {
          organizationId: orgId,
          slotId: slot.id,
          propertyNodeId: unitNode.id,
          vehicleId: veh.id,
          allocationType: alloc.type,
          isActive: true,
          startDate: new Date('2024-06-01'),
        },
      });

      await prisma.parkingSlot.update({
        where: { id: slot.id },
        data: { status: 'OCCUPIED' },
      });

      console.log(`   ✓ Allocated Bay [${slot.slotNumber}] -> Unit ${unitNode.unitNumber} (${veh.licensePlate})`);
    }
  }

  // -------------------------------------------------------------
  // 11. ACTIVE & HISTORICAL SESSIONS
  // -------------------------------------------------------------
  console.log('\n⏱️  Seeding Live Parking Sessions...');
  const sessionsSpec = [
    {
      slotNumber: 'B1-01',
      plate: 'TN01AB1024',
      sessionType: 'RESIDENT',
      method: 'ANPR',
      minsAgo: 145,
      status: 'ACTIVE',
    },
    {
      slotNumber: 'EV-02',
      plate: 'KA03EV9999',
      sessionType: 'EV_CHARGING',
      method: 'RFID',
      minsAgo: 60,
      status: 'ACTIVE',
    },
    {
      slotNumber: 'VST-01',
      plate: 'TN09ZZ1234',
      sessionType: 'VISITOR',
      method: 'QR',
      minsAgo: 45,
      status: 'ACTIVE',
    },
    {
      slotNumber: 'P1-04',
      plate: 'KA05FT1001',
      sessionType: 'COMMERCIAL',
      method: 'ANPR',
      minsAgo: 320,
      status: 'ACTIVE',
    },
  ];

  for (const s of sessionsSpec) {
    const slot = slots.find((sl) => sl.slotNumber === s.slotNumber);
    const existing = await prisma.parkingSession.findFirst({
      where: { organizationId: orgId, licensePlate: s.plate, sessionStatus: 'ACTIVE' },
    });

    if (!existing) {
      const entryTime = new Date(Date.now() - s.minsAgo * 60 * 1000);
      await prisma.parkingSession.create({
        data: {
          organizationId: orgId,
          slotId: slot ? slot.id : undefined,
          areaId: slot ? slot.areaId : undefined,
          licensePlate: s.plate,
          entryMethod: s.method,
          entryTime,
          accessPoint: 'North Gate Boom Barrier',
          sessionStatus: s.status,
          paymentStatus: 'WAIVED',
        },
      });
      console.log(`   ✓ Active Gate Session: [${s.plate}] in Bay ${s.slotNumber} (${s.minsAgo} mins)`);
    }
  }

  // -------------------------------------------------------------
  // 12. DIGITAL QR PERMITS & ADVANCE RESERVATIONS
  // -------------------------------------------------------------
  console.log('\n🎟️  Seeding Digital QR Permits & Reservations...');

  const permitsSpec = [
    { number: 'PRM-2026-RES-01', type: 'RESIDENT', plate: 'TN01AB1024', slotNum: 'B1-01' },
    { number: 'PRM-2026-EV-02', type: 'RESIDENT', plate: 'KA03EV9999', slotNum: 'EV-02' },
    { number: 'PRM-2026-VIP-03', type: 'VIP', plate: 'KA05FT1001', slotNum: 'P1-04' },
    { number: 'PRM-2026-VIS-04', type: 'VISITOR', plate: 'TN09ZZ1234', slotNum: 'VST-01' },
  ];

  for (const p of permitsSpec) {
    const slot = slots.find((sl) => sl.slotNumber === p.slotNum);
    const veh = vehicles.find((v) => v.licensePlate === p.plate);
    const existing = await prisma.parkingPermit.findFirst({
      where: { organizationId: orgId, permitNumber: p.number },
    });

    if (!existing) {
      await prisma.parkingPermit.create({
        data: {
          organizationId: orgId,
          permitNumber: p.number,
          permitType: p.type,
          slotId: slot ? slot.id : undefined,
          vehicleId: veh ? veh.id : undefined,
          validFrom: new Date('2026-01-01'),
          validTo: new Date('2026-12-31'),
          status: 'ACTIVE',
          qrCode: `SMARTIPARK-PERMIT-${p.number}-${p.plate}`,
        },
      });
      console.log(`   ✓ Digital Permit: ${p.number} (${p.type}) for ${p.plate}`);
    }
  }

  // Scheduled Reservation for VIP & Vendor
  const reservationsSpec = [
    {
      guestName: 'Chief Audit Officer (KPMG)',
      plate: 'DL01VIP001',
      slotNum: 'VST-02',
      category: 'VIP',
      hoursAhead: 2,
      durationHours: 3,
    },
    {
      guestName: 'Otis Elevators Inspection Team',
      plate: 'TN05TK4411',
      slotNum: 'VST-03',
      category: 'CONTRACTOR',
      hoursAhead: 5,
      durationHours: 4,
    },
  ];

  for (const r of reservationsSpec) {
    const slot = slots.find((sl) => sl.slotNumber === r.slotNum);
    const startTime = new Date(Date.now() + r.hoursAhead * 3600 * 1000);
    const endTime = new Date(startTime.getTime() + r.durationHours * 3600 * 1000);

    const existing = await prisma.parkingReservation.findFirst({
      where: { organizationId: orgId, notes: { contains: r.guestName } },
    });

    if (!existing) {
      await prisma.parkingReservation.create({
        data: {
          organizationId: orgId,
          slotId: slot ? slot.id : undefined,
          areaId: slot ? slot.areaId : undefined,
          startTime,
          endTime,
          parkingType: r.category,
          status: 'CONFIRMED',
          notes: `Advance booking for ${r.guestName} (${r.plate})`,
          qrCode: `SMARTIPARK-RES-${r.plate}-${Date.now()}`,
        },
      });

      if (slot) {
        await prisma.parkingSlot.update({
          where: { id: slot.id },
          data: { status: 'RESERVED' },
        });
      }
      console.log(`   ✓ Scheduled Booking: ${r.guestName} (${r.plate}) -> Bay ${r.slotNum}`);
    }
  }

  // -------------------------------------------------------------
  // 13. COMPLIANCE VIOLATIONS
  // -------------------------------------------------------------
  console.log('\n⚠️  Seeding Parking Compliance Violations...');
  if (orgAdmin) {
    const violationsSpec = [
      {
        slotNum: 'EV-04',
        plate: 'TN10XX9999',
        type: 'UNAUTHORIZED_PARKING',
        desc: 'Non-electric vehicle parked in high-voltage charging stall blocking designated EV users.',
        fine: 1000,
        status: 'WARNING_ISSUED',
      },
      {
        slotNum: 'VST-04',
        plate: 'KA04ZZ7777',
        type: 'OVERSTAY',
        desc: 'Visitor vehicle exceeded 4-hour permitted window by 6+ hours without digital renewal.',
        fine: 500,
        status: 'REPORTED',
      },
    ];

    for (const v of violationsSpec) {
      const slot = slots.find((sl) => sl.slotNumber === v.slotNum);
      const existing = await prisma.parkingViolation.findFirst({
        where: { organizationId: orgId, description: { contains: v.plate } },
      });

      if (!existing) {
        await prisma.parkingViolation.create({
          data: {
            organizationId: orgId,
            slotId: slot ? slot.id : undefined,
            reportedById: orgAdmin.id,
            violationType: v.type,
            description: `[${v.plate}] ${v.desc}`,
            fineAmount: v.fine,
            status: v.status,
            actionTaken: v.status === 'WARNING_ISSUED' ? 'SMS warning sent to vehicle owner with 30m grace' : undefined,
          },
        });
        console.log(`   ✓ Infraction: ${v.type} (${v.plate}) in Bay ${v.slotNum} (Fine: ₹${v.fine})`);
      }
    }
  }

  // -------------------------------------------------------------
  // 14. SMARTIPARK CONFIGURATION, TARIFFS & RULES
  // -------------------------------------------------------------
  console.log('\n⚙️  Seeding SmartiPark Operations Platform Config...');

  await prisma.parkingConfiguration.upsert({
    where: { organizationId: orgId },
    update: {
      parkingMode: 'RESIDENTIAL',
      allocationModel: 'DEDICATED',
      visitorParkingEnabled: true,
      reservationEnabled: true,
      paidParkingEnabled: true,
      evParkingEnabled: true,
      qrAccessEnabled: true,
      anprEnabled: true,
      rfidAccessEnabled: true,
      temporaryParkingEnabled: true,
      violationsEnabled: true,
    },
    create: {
      organizationId: orgId,
      parkingMode: 'RESIDENTIAL',
      allocationModel: 'DEDICATED',
      visitorParkingEnabled: true,
      reservationEnabled: true,
      paidParkingEnabled: true,
      evParkingEnabled: true,
      qrAccessEnabled: true,
      anprEnabled: true,
      rfidAccessEnabled: true,
      temporaryParkingEnabled: true,
      violationsEnabled: true,
    },
  });
  console.log('   ✓ Platform Configuration: Enabled Multi-Zone, EV, ANPR, QR & Violations');

  // Rate Cards
  const rates = [
    { name: 'Standard Visitor Car Tariff', rateType: 'HOURLY', baseAmount: 20, hourlyRate: 30, grace: 30, maxDaily: 250 },
    { name: 'Overnight Visitor Parking', rateType: 'FLAT', baseAmount: 150, hourlyRate: 0, grace: 15, maxDaily: 150 },
    { name: 'EV Stall Surcharge Tariff', rateType: 'HOURLY', baseAmount: 50, hourlyRate: 40, grace: 15, maxDaily: 400 },
  ];

  for (const r of rates) {
    const existing = await prisma.parkingRate.findFirst({
      where: { organizationId: orgId, name: r.name },
    });
    if (!existing) {
      await prisma.parkingRate.create({
        data: {
          organizationId: orgId,
          name: r.name,
          rateType: r.rateType,
          baseAmount: r.baseAmount,
          hourlyRate: r.hourlyRate,
          gracePeriodMinutes: r.grace,
          maxDailyAmount: r.maxDaily,
          isActive: true,
        },
      });
      console.log(`   ✓ Tariff Card: "${r.name}" (Base ₹${r.baseAmount}, ₹${r.hourlyRate}/hr)`);
    }
  }

  // Rules
  const rules = [
    {
      name: 'Max Visitor Stay (4 Hours)',
      ruleType: 'VISITOR_DURATION',
      conditions: { maxMinutes: 240 },
      actions: { notifySecurity: true, issueFine: 500 },
    },
    {
      name: 'EV Stall Idle Surcharge After 100% Charge',
      ruleType: 'HOURLY_RATE',
      conditions: { idleThresholdMins: 30 },
      actions: { surchargePerHour: 100 },
    },
  ];

  for (const rl of rules) {
    const existing = await prisma.parkingRule.findFirst({
      where: { organizationId: orgId, name: rl.name },
    });
    if (!existing) {
      await prisma.parkingRule.create({
        data: {
          organizationId: orgId,
          name: rl.name,
          ruleType: rl.ruleType,
          conditions: rl.conditions,
          actions: rl.actions,
          isActive: true,
        },
      });
      console.log(`   ✓ Rule Engine: "${rl.name}"`);
    }
  }

  console.log('\n🎉 Comprehensive Demo Seeding Complete!');
  console.log(`
Summary of Created Data:
- Buildings: 3 (Empire Grand, Cyber Gateway, Greenwood)
- Towers: 5
- Floors: 35
- Units: 19 (Apartments, Penthouses, Offices, Villas)
- Owners: 9 (with user credentials: Password123)
- Tenants: 5 (with active lease dates)
- Vehicles: 16 (Cars, SUVs, EVs, 2-Wheelers)
- Parking Zones: 4 (Basement B1, B2 EV Hub, Podium, Surface)
- Parking Bays: 40 (Standard, Compact, EV, Accessible, Visitor)
- Allocations: 10 (Linking Units + Residents + Vehicles + Bays)
- Live Sessions: 4 (Active in-gate telemetry)
- Permits & Bookings: 4 Digital QR Passes & 2 Advance Reservations
- Compliance Violations: 2 (Stall obstruction & overstay)
  `);
}

seedDemoData()
  .catch((e) => {
    console.error('❌ Error during demo seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
