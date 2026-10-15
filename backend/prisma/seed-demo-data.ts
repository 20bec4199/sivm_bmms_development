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
  const ownerRole = await prisma.role.findFirst({ where: { name: 'UNIT_OWNER', organizationId: orgId } });
  const tenantRole = await prisma.role.findFirst({ where: { name: 'TENANT', organizationId: orgId } });
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

  const buildingManager = await prisma.user.findFirst({
    where: { email: 'manager@tamilapartments.com', organizationId: orgId },
  });
  if (buildingManager) {
    await prisma.userPropertyNode.createMany({
      data: buildings.map((b) => ({
        organizationId: orgId,
        userId: buildingManager.id,
        propertyNodeId: b.id,
        accessLevel: 'MANAGE',
      })),
      skipDuplicates: true,
    });
    console.log('   ✓ Building manager assigned to all buildings');
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

  console.log('\n🏊 Seeding Facilities, Asset Catalog, Bookings & Preventive Maintenance...');
  const facilitySpecs = [
    { code: 'DEMO-GYM', name: 'Fitness Centre', category: 'Fitness', description: 'Residents gym with cardio and strength equipment.', capacity: 25, rate: 0, building: buildings[0], tower: towers[0], locationName: 'Empire Grand Tower - Ground Floor' },
    { code: 'DEMO-POOL', name: 'Swimming Pool', category: 'Recreation', description: 'Outdoor community swimming pool.', capacity: 30, rate: 0, building: buildings[0], tower: towers[0], locationName: 'Empire Grand Tower - Pool Deck' },
    { code: 'DEMO-CLUB', name: 'Community Hall', category: 'Events', description: 'Hall for resident meetings and celebrations.', capacity: 80, rate: 500, building: buildings[2], tower: towers[4], locationName: 'Greenwood Haven Residency - Clubhouse' },
  ];
  const facilities: any[] = [];
  for (const spec of facilitySpecs) {
    let facility = await prisma.facility.findFirst({ where: { organizationId: orgId, facilityCode: spec.code } });
    const facilityData = {
      name: spec.name,
      facilityCode: spec.code,
      category: spec.category,
      description: spec.description,
      shortDescription: spec.description,
      status: 'ACTIVE',
      isActive: true,
      capacity: spec.capacity,
      hourlyRate: spec.rate,
      depositAmount: 0,
      rules: ['Keep the facility clean', 'Follow posted safety instructions', 'Leave on time for the next booking'],
      buildingId: spec.building.id,
      towerId: spec.tower.id,
      locationName: spec.locationName,
      bookingConfig: { type: 'SLOT', occupancyMode: 'PRIVATE', slotIntervalMinutes: 60, minDurationMinutes: 60, maxDurationMinutes: 240 },
      approvalConfig: { type: 'MANUAL' },
    };
    facility = facility
      ? await prisma.facility.update({ where: { id: facility.id }, data: facilityData })
      : await prisma.facility.create({ data: { ...facilityData, organizationId: orgId } });
    facilities.push(facility);
  }

  const assetCategorySpecs = [
    { name: 'HVAC Equipment', description: 'Air conditioning and ventilation equipment' },
    { name: 'Water Systems', description: 'Pumps and water treatment equipment' },
    { name: 'Safety Equipment', description: 'Fire and life-safety equipment' },
  ];
  const assetCategories: Record<string, any> = {};
  for (const spec of assetCategorySpecs) {
    let category = await prisma.assetCategory.findFirst({ where: { organizationId: orgId, name: spec.name } });
    category = category
      ? await prisma.assetCategory.update({ where: { id: category.id }, data: { description: spec.description } })
      : await prisma.assetCategory.create({ data: { organizationId: orgId, ...spec } });
    assetCategories[spec.name] = category;
  }

  const now = new Date();
  const assetSpecs = [
    { tag: 'HVAC-2026-0001', serial: 'AC-CH-001', name: 'Rooftop Chiller Unit 1', category: 'HVAC Equipment', location: `${buildings[0].name} - Roof`, status: 'ACTIVE', warrantyDays: 240 },
    { tag: 'HVAC-2026-0002', serial: 'AHU-EM-014', name: 'Air Handling Unit - Block A', category: 'HVAC Equipment', location: `${buildings[0].name} - Plant Room`, status: 'ACTIVE', warrantyDays: 18 },
    { tag: 'WTR-2026-0001', serial: 'PMP-GW-002', name: 'Booster Pump 2', category: 'Water Systems', location: `${buildings[2].name} - Pump Room`, status: 'IN_REPAIR', warrantyDays: -120 },
    { tag: 'SAF-2026-0001', serial: 'FACP-EM-001', name: 'Fire Alarm Control Panel', category: 'Safety Equipment', location: `${buildings[0].name} - Security Room`, status: 'ACTIVE', warrantyDays: 365 },
  ];
  const assets: any[] = [];
  for (const spec of assetSpecs) {
    const warrantyExpiry = new Date(now.getTime() + spec.warrantyDays * 86400000);
    let asset = await prisma.asset.findFirst({ where: { organizationId: orgId, serialNumber: { contains: spec.tag } } });
    const assetData = {
      name: spec.name,
      category: { connect: { id: assetCategories[spec.category].id } },
      serialNumber: `TAG: ${spec.tag} | SN: ${spec.serial}`,
      purchaseDate: new Date(now.getTime() - 365 * 86400000),
      purchasePrice: spec.category === 'HVAC Equipment' ? 185000 : 65000,
      warrantyExpiry,
      warrantyDetails: 'Demo manufacturer warranty; contact Facilities for service history.',
      expectedLifespanYears: spec.category === 'Safety Equipment' ? 10 : 12,
      status: spec.status as 'ACTIVE' | 'IN_REPAIR',
      location: spec.location,
    };
    asset = asset
      ? await prisma.asset.update({ where: { id: asset.id }, data: assetData })
      : await prisma.asset.create({ data: { organization: { connect: { id: orgId } }, ...assetData } });
    assets.push(asset);
  }

  const bookingSpecs = [
    { code: 'DEMO-BOOK-GYM', facility: facilities[0], owner: owners[0], days: 3, purpose: 'Morning fitness session', status: 'CONFIRMED' as const },
    { code: 'DEMO-BOOK-HALL', facility: facilities[2], owner: owners[1], days: 6, purpose: 'Residents committee meeting', status: 'PENDING' as const },
  ];
  for (const spec of bookingSpecs) {
    const startTime = new Date(now.getTime() + spec.days * 86400000);
    startTime.setHours(9, 0, 0, 0);
    const endTime = new Date(startTime.getTime() + 2 * 3600000);
    const notes = `DEMO-SEED:${spec.code}`;
    const booking = await prisma.facilityBooking.findFirst({ where: { organizationId: orgId, notes } });
    const bookingData = {
      organizationId: orgId,
      facilityId: spec.facility.id,
      userId: spec.owner.userId,
      startTime,
      endTime,
      status: spec.status,
      attendeeCount: spec.code === 'DEMO-BOOK-HALL' ? 18 : 2,
      purpose: spec.purpose,
      notes,
      totalCost: spec.facility.hourlyRate ? spec.facility.hourlyRate * 2 : 0,
      depositAmount: 0,
      depositPaid: false,
    };
    if (booking) {
      await prisma.facilityBooking.update({ where: { id: booking.id }, data: bookingData });
    } else {
      await prisma.facilityBooking.create({ data: bookingData });
    }
  }

  const maintenanceSpecs = [
    {
      code: 'DEMO-PMP-HVAC-01', title: 'Monthly chiller inspection', category: 'HVAC & Air Distribution Subsystems', asset: assets[0], facility: facilities[0], building: buildings[0], frequency: 'MONTHLY', dueDays: 7,
      tasks: ['Check refrigerant pressure and operating temperature', 'Clean condenser coils and inspect filters', 'Record vibration and unusual operating noise'],
    },
    {
      code: 'DEMO-PMP-PUMP-01', title: 'Quarterly booster pump service', category: 'Water Systems', asset: assets[2], facility: facilities[2], building: buildings[2], frequency: 'QUARTERLY', dueDays: 14,
      tasks: ['Inspect pump seals and motor coupling', 'Check inlet and outlet pressure readings', 'Record test results and attach service photos'],
    },
    {
      code: 'DEMO-PMP-FIRE-01', title: 'Monthly fire alarm panel test', category: 'Fire & Life Safety', asset: assets[3], facility: facilities[1], building: buildings[0], frequency: 'MONTHLY', dueDays: 21,
      tasks: ['Check panel for active faults', 'Test a sample detector and sounder', 'Record test result and notify security desk'],
    },
  ];
  for (const spec of maintenanceSpecs) {
    const nextDueDate = new Date(now.getTime() + spec.dueDays * 86400000);
    let plan = await prisma.maintenancePlan.findFirst({ where: { organizationId: orgId, planCode: spec.code } });
    const planData = {
      title: spec.title,
      planCode: spec.code,
      description: `Demo ${spec.frequency.toLowerCase()} preventive inspection. Generate a work order when ready to perform the checklist.`,
      category: spec.category,
      maintenanceType: 'Preventive',
      priority: spec.asset.status === 'IN_REPAIR' ? 'HIGH' as const : 'MEDIUM' as const,
      status: 'ACTIVE',
      frequency: spec.frequency,
      nextDueDate,
      buildingId: spec.building.id,
      locationScope: 'BUILDING',
      locationName: spec.building.name,
      facilityIds: [spec.facility.id],
      assetIds: [spec.asset.id],
      targetAssetCategory: spec.category,
      scheduleConfig: { timeZone: 'Asia/Kolkata', preferredWindow: '09:00-12:00' },
      assignmentConfig: { strategy: 'MANUAL' },
      blackoutConfig: { autoSyncFacilityBlock: true, blockDurationHours: 3 },
      complianceScore: 100,
    };
    plan = plan
      ? await prisma.maintenancePlan.update({ where: { id: plan.id }, data: planData })
      : await prisma.maintenancePlan.create({ data: { organizationId: orgId, ...planData } });
    await prisma.maintenanceChecklist.deleteMany({ where: { planId: plan.id } });
    await prisma.maintenanceChecklist.createMany({
      data: spec.tasks.map((taskName, index) => ({
        planId: plan!.id,
        taskName,
        description: 'Complete the check and record any issue for the supervisor.',
        instructions: 'Follow site safety rules. Stop and report unsafe conditions.',
        sequence: index + 1,
        taskCategory: spec.category,
        taskType: 'CHECKBOX',
        isMandatory: true,
        photoRequired: index === spec.tasks.length - 1,
        estimatedDurationMinutes: 15,
      })),
    });
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

  // -------------------------------------------------------------
  // 15. TECHNICIANS, SECURITY GUARDS & COMPLAINTS
  // -------------------------------------------------------------
  console.log('\n🛠️  Seeding Technicians...');
  async function ensureRole(name: string, description: string) {
    let role = await prisma.role.findFirst({ where: { name, organizationId: orgId } });
    if (!role) {
      role = await prisma.role.create({ data: { name, description, organizationId: orgId } });
    }
    return role;
  }
  const technicianRole = await ensureRole('TECHNICIAN', 'Maintenance and service staff');
  const guardRole = await ensureRole('SECURITY_GUARD', 'Security staff for visitor access, incidents, and patrols');

  const techniciansData = [
    { email: 'tech.electrician@tamilapartments.com', first: 'Murugan', last: 'Selvam', empId: 'TECH-001', specialization: 'Electrical', skills: ['Wiring', 'Panel Maintenance', 'Lighting'], experience: 8, shift: 'Day' },
    { email: 'tech.plumber@tamilapartments.com', first: 'Ganesh', last: 'Raman', empId: 'TECH-002', specialization: 'Plumbing', skills: ['Pipe Fitting', 'Leak Repair', 'Pump Service'], experience: 6, shift: 'Day' },
    { email: 'tech.hvac@tamilapartments.com', first: 'Imran', last: 'Khan', empId: 'TECH-003', specialization: 'HVAC', skills: ['AC Servicing', 'Chiller Operation'], experience: 10, shift: 'Day' },
    { email: 'tech.general@tamilapartments.com', first: 'Bala', last: 'Murali', empId: 'TECH-004', specialization: 'General Maintenance', skills: ['Carpentry', 'Painting', 'Lift Support'], experience: 4, shift: 'Evening' },
  ];

  const technicians: any[] = [];
  for (const t of techniciansData) {
    let user = await prisma.user.findFirst({ where: { email: t.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: t.email,
          emailNormalized: t.email.toLowerCase(),
          passwordHash: defaultPasswordHash,
          firstName: t.first,
          lastName: t.last,
          isActive: true,
          emailVerified: true,
          organizationId: orgId,
        },
      });
    }
    await prisma.userRole.createMany({ data: [{ userId: user.id, roleId: technicianRole.id }], skipDuplicates: true });
    await prisma.technicianProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        organizationId: orgId,
        userId: user.id,
        employeeId: t.empId,
        specialization: t.specialization,
        experience: t.experience,
        shift: t.shift,
        joiningDate: new Date('2024-02-01'),
        skills: t.skills,
        availability: 'AVAILABLE',
        workingHours: t.shift === 'Day' ? '09:00-18:00' : '14:00-22:00',
        status: 'ACTIVE',
        assignedBuildings: buildings.map((b) => b.id),
        assignedTowers: [],
      },
    });
    technicians.push(user);
    console.log(`   ✓ Technician: ${t.first} ${t.last} (${t.email}) - ${t.specialization}`);
  }

  console.log('\n💂 Seeding Security Guards & Posts...');
  const guardsData = [
    { email: 'guard.gate@tamilapartments.com', first: 'Ravi', last: 'Shankar', shift: 'Morning' },
    { email: 'guard.lobby@tamilapartments.com', first: 'Senthil', last: 'Nathan', shift: 'Evening' },
    { email: 'guard.night@tamilapartments.com', first: 'Mohan', last: 'Das', shift: 'Night' },
  ];

  const guards: any[] = [];
  for (const g of guardsData) {
    let user = await prisma.user.findFirst({ where: { email: g.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: g.email,
          emailNormalized: g.email.toLowerCase(),
          passwordHash: defaultPasswordHash,
          firstName: g.first,
          lastName: g.last,
          isActive: true,
          emailVerified: true,
          organizationId: orgId,
        },
      });
    }
    await prisma.userRole.createMany({ data: [{ userId: user.id, roleId: guardRole.id }], skipDuplicates: true });
    guards.push({ user, shift: g.shift });
    console.log(`   ✓ Security Guard: ${g.first} ${g.last} (${g.email}) - ${g.shift} shift`);
  }

  const postsData = [
    { name: 'Main Gate', postType: 'GATE', description: 'Vehicle and visitor entry control', duties: ['Verify visitors', 'Record vehicle entry', 'Operate boom barrier'], building: buildings[0] },
    { name: 'Tower A Lobby Desk', postType: 'LOBBY', description: 'Lobby reception and access desk', duties: ['Greet visitors', 'Monitor CCTV', 'Handle parcels'], building: buildings[0] },
    { name: 'Basement Patrol', postType: 'PATROL', description: 'Parking and basement patrol', duties: ['Hourly patrol', 'Check fire exits'], building: buildings[0] },
  ];
  const shiftTimes: Record<string, { start: string; end: string }> = {
    Morning: { start: '06:00', end: '14:00' },
    Evening: { start: '14:00', end: '22:00' },
    Night: { start: '22:00', end: '06:00' },
  };
  for (let i = 0; i < postsData.length; i++) {
    const p = postsData[i];
    let post = await prisma.securityPost.findFirst({ where: { organizationId: orgId, name: p.name } });
    if (!post) {
      post = await prisma.securityPost.create({
        data: {
          organizationId: orgId,
          name: p.name,
          postType: p.postType,
          description: p.description,
          duties: p.duties,
          propertyNodeId: p.building.id,
          isActive: true,
        },
      });
    }
    const guard = guards[i];
    const existingAssignment = await prisma.securityPostAssignment.findFirst({
      where: { organizationId: orgId, postId: post.id, guardId: guard.user.id },
    });
    if (!existingAssignment) {
      const day = new Date();
      const [sh, sm] = shiftTimes[guard.shift].start.split(':').map(Number);
      const [eh, em] = shiftTimes[guard.shift].end.split(':').map(Number);
      const startsAt = new Date(day.getFullYear(), day.getMonth(), day.getDate(), sh, sm);
      const endsAt = new Date(day.getFullYear(), day.getMonth(), day.getDate() + (eh <= sh ? 1 : 0), eh, em);
      await prisma.securityPostAssignment.create({
        data: {
          organizationId: orgId,
          postId: post.id,
          guardId: guard.user.id,
          shiftName: guard.shift,
          startsAt,
          endsAt,
          daysOfWeek: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
          isActive: true,
          assignedById: orgAdmin?.id,
        },
      });
    }
    console.log(`   ✓ Post: ${p.name} -> ${guard.user.firstName} ${guard.user.lastName}`);
  }

  const incidentsData = [
    { title: 'Unauthorised person near basement entrance', description: 'An unidentified person was seen loitering near the B1 entrance. Escorted out by the guard.', severity: 'MINOR', status: 'RESOLVED', guard: 0 },
    { title: 'Fire exit door found blocked', description: 'Stored cartons found blocking the fire exit on the Tower A ground floor. Removed and reported.', severity: 'MAJOR', status: 'INVESTIGATING', guard: 1 },
  ];
  for (const inc of incidentsData) {
    const exists = await prisma.incident.findFirst({ where: { organizationId: orgId, title: inc.title } });
    if (!exists) {
      await prisma.incident.create({
        data: {
          organizationId: orgId,
          title: inc.title,
          description: inc.description,
          reportedById: guards[inc.guard].user.id,
          incidentDate: new Date(Date.now() - 86400000),
          severity: inc.severity as any,
          status: inc.status as any,
        },
      });
    }
  }
  console.log(`   ✓ Incidents: ${incidentsData.length}`);

  console.log('\n📣 Seeding Complaints...');
  const complaintCategoryNames = ['Electrical', 'Plumbing', 'Lift', 'Cleaning', 'Parking', 'Security', 'Water Leakage', 'Air Conditioning', 'Common Area', 'Others'];
  const complaintCategories: Record<string, any> = {};
  for (const name of complaintCategoryNames) {
    let cat = await prisma.complaintCategory.findFirst({ where: { organizationId: orgId, name } });
    if (!cat) {
      cat = await prisma.complaintCategory.create({
        data: { organizationId: orgId, name, description: `${name} related complaints` },
      });
    }
    complaintCategories[name] = cat;
  }

  const complaintsSpec = [
    { title: 'Power outage in kitchen sockets', description: 'Kitchen sockets stopped working since morning. MCB trips when reset.', category: 'Electrical', priority: 'HIGH', status: 'NEW', owner: 0 },
    { title: 'Water leakage from bathroom ceiling', description: 'Water is dripping from the ceiling of the master bathroom. Possible leak from the unit above.', category: 'Water Leakage', priority: 'CRITICAL', status: 'ASSIGNED', owner: 1, tech: 1 },
    { title: 'Lift stops between floors', description: 'Tower A lift 2 stops between 2nd and 3rd floor for a few seconds during peak hours.', category: 'Lift', priority: 'HIGH', status: 'IN_PROGRESS', owner: 2, tech: 3 },
    { title: 'AC not cooling properly', description: 'Living room AC is running but not cooling. Needs gas check and filter cleaning.', category: 'Air Conditioning', priority: 'MEDIUM', status: 'IN_PROGRESS', owner: 3, tech: 2 },
    { title: 'Corridor lights not working', description: 'Three corridor lights on the 3rd floor are not working.', category: 'Electrical', priority: 'MEDIUM', status: 'RESOLVED', owner: 4, tech: 0 },
    { title: 'Garbage not cleared from common area', description: 'Garbage near the staircase landing was not cleared for two days.', category: 'Cleaning', priority: 'LOW', status: 'OPEN', owner: 5 },
    { title: 'Unknown vehicle in my parking bay', description: 'A vehicle that does not belong to us is parked in our allotted bay.', category: 'Parking', priority: 'MEDIUM', status: 'CLOSED', owner: 6, tech: 3 },
    { title: 'Tap leaking in kitchen', description: 'Kitchen tap keeps dripping even when fully closed.', category: 'Plumbing', priority: 'LOW', status: 'ASSIGNED', owner: 7, tech: 1 },
  ];

  const complaintOwnerOrder = owners;
  for (const c of complaintsSpec) {
    const owner = complaintOwnerOrder[c.owner];
    if (!owner?.userId) continue;
    const exists = await prisma.complaint.findFirst({ where: { organizationId: orgId, title: c.title } });
    if (exists) continue;
    const tech = c.tech !== undefined ? technicians[c.tech] : undefined;
    const complaint = await prisma.complaint.create({
      data: {
        organizationId: orgId,
        propertyNodeId: owner.propertyNodeId,
        categoryId: complaintCategories[c.category].id,
        creatorId: owner.userId,
        title: c.title,
        description: c.description,
        status: c.status as any,
        priority: c.priority as any,
        assignedToId: tech?.id,
      },
    });
    await prisma.complaintHistory.create({
      data: { complaintId: complaint.id, statusFrom: null, statusTo: 'NEW', notes: 'Complaint submitted' },
    });
    if (tech) {
      await prisma.complaintHistory.create({
        data: { complaintId: complaint.id, statusFrom: 'NEW', statusTo: 'ASSIGNED', notes: `Assigned to ${tech.firstName} ${tech.lastName}` },
      });
      await prisma.complaintComment.create({
        data: { complaintId: complaint.id, userId: tech.id, content: 'Noted. I will visit the unit and update the status.' },
      });
    }
    if (['IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(c.status)) {
      await prisma.complaintHistory.create({
        data: { complaintId: complaint.id, statusFrom: 'ASSIGNED', statusTo: 'IN_PROGRESS', notes: 'Work started' },
      });
    }
    if (['RESOLVED', 'CLOSED'].includes(c.status)) {
      await prisma.complaintHistory.create({
        data: { complaintId: complaint.id, statusFrom: 'IN_PROGRESS', statusTo: c.status as any, notes: 'Issue fixed' },
      });
    }
    console.log(`   ✓ Complaint: "${c.title}" [${c.status}]`);
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
