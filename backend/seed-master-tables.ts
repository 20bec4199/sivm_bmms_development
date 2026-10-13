import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/building_management?schema=public' });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding Master Tables...');

  // 1. Seed Modules
  const modules = [
    { code: 'PROPERTY_MANAGEMENT', name: 'Property Management' },
    { code: 'FACILITY_MANAGEMENT', name: 'Facility Management' },
    { code: 'ASSET_MANAGEMENT', name: 'Asset Management' },
    { code: 'PARKING_MANAGEMENT', name: 'Parking Management' },
    { code: 'VISITOR_MANAGEMENT', name: 'Visitor Management' },
    { code: 'SECURITY_MANAGEMENT', name: 'Security Management' },
    { code: 'BILLING_FINANCE', name: 'Billing & Finance' },
    { code: 'RESIDENT_PORTAL', name: 'Resident Portal' },
    { code: 'TENANT_PORTAL', name: 'Tenant Portal' },
    { code: 'INVENTORY_MANAGEMENT', name: 'Inventory Management' },
    { code: 'VENDOR_MANAGEMENT', name: 'Vendor Management' },
    { code: 'PROCUREMENT', name: 'Procurement' },
    { code: 'WORK_ORDERS', name: 'Work Orders' },
    { code: 'PREVENTIVE_MAINTENANCE', name: 'Preventive Maintenance' },
    { code: 'CORRECTIVE_MAINTENANCE', name: 'Corrective Maintenance' },
    { code: 'HOUSEKEEPING', name: 'Housekeeping' },
    { code: 'COMPLAINT_MANAGEMENT', name: 'Complaint Management' },
    { code: 'HELPDESK', name: 'Helpdesk' },
    { code: 'COMMUNITY_MANAGEMENT', name: 'Community Management' },
    { code: 'DOCUMENT_MANAGEMENT', name: 'Document Management' },
    { code: 'UTILITY_MANAGEMENT', name: 'Utility Management' },
    { code: 'ENERGY_MONITORING', name: 'Energy Monitoring' },
    { code: 'IOT_INTEGRATION', name: 'IoT Integration' },
    { code: 'ACCESS_CONTROL', name: 'Access Control' },
    { code: 'LIFT_MANAGEMENT', name: 'Lift Management' },
    { code: 'CCTV_MANAGEMENT', name: 'CCTV Management' },
    { code: 'INCIDENT_MANAGEMENT', name: 'Incident Management' },
    { code: 'EVENT_BOOKING', name: 'Event Booking' },
    { code: 'FACILITY_BOOKING', name: 'Facility Booking' },
    { code: 'VEHICLE_MANAGEMENT', name: 'Vehicle Management' },
    { code: 'STAFF_MANAGEMENT', name: 'Staff Management' },
    { code: 'HR', name: 'HR' },
    { code: 'REPORTS', name: 'Reports' },
    { code: 'ANALYTICS_DASHBOARD', name: 'Analytics Dashboard' },
  ];

  for (const mod of modules) {
    await prisma.moduleMaster.upsert({
      where: { code: mod.code },
      update: {},
      create: mod,
    });
  }
  console.log(`✅ Seeded ${modules.length} Modules`);

  // 2. Seed Property Categories (Level 1) & Types (Level 2)
  const categoryData = [
    {
      code: 'RESIDENTIAL',
      name: 'Residential',
      types: [
        { code: 'APARTMENTS', name: 'Apartments' },
        { code: 'CONDOMINIUMS', name: 'Condominiums' },
        { code: 'FLATS', name: 'Flats' },
        { code: 'VILLAS', name: 'Villas' },
        { code: 'TOWNHOUSES', name: 'Townhouses' },
        { code: 'DUPLEXES', name: 'Duplexes' },
        { code: 'INDIVIDUAL_HOUSES', name: 'Individual Houses' },
        { code: 'STUDENT_HOUSING', name: 'Student Housing' },
        { code: 'SENIOR_LIVING', name: 'Senior Living' },
        { code: 'SERVICED_APARTMENTS', name: 'Serviced Apartments' },
      ],
    },
    {
      code: 'COMMERCIAL',
      name: 'Commercial',
      types: [
        { code: 'OFFICE_BUILDING', name: 'Office Building' },
        { code: 'SHOPPING_MALL', name: 'Shopping Mall' },
        { code: 'RETAIL_SHOPS', name: 'Retail Shops' },
        { code: 'BUSINESS_CENTRE', name: 'Business Centre' },
        { code: 'HOTEL_COMMERCIAL', name: 'Hotel' },
        { code: 'RESTAURANT', name: 'Restaurant' },
        { code: 'MIXED_RETAIL', name: 'Mixed Retail' },
      ],
    },
    {
      code: 'INDUSTRIAL',
      name: 'Industrial',
      types: [
        { code: 'FACTORY', name: 'Factory' },
        { code: 'WAREHOUSE', name: 'Warehouse' },
        { code: 'MANUFACTURING_PLANT', name: 'Manufacturing Plant' },
        { code: 'DISTRIBUTION_CENTER', name: 'Distribution Center' },
        { code: 'LOGISTICS_PARK', name: 'Logistics Park' },
      ],
    },
    {
      code: 'MIXED_USE',
      name: 'Mixed Use',
      types: [
        { code: 'RESIDENTIAL_COMMERCIAL', name: 'Residential + Commercial' },
      ],
    },
    {
      code: 'GATED_COMMUNITY',
      name: 'Gated Community',
      types: [
        { code: 'VILLA_TOWNSHIP', name: 'Villa Township' },
        { code: 'HOUSING_ESTATE', name: 'Housing Estate' },
        { code: 'PRIVATE_COMMUNITY', name: 'Private Community' },
      ],
    },
    {
      code: 'IT_PARK',
      name: 'IT Park',
      types: [
        { code: 'CORPORATE_CAMPUS', name: 'Corporate Campus' },
        { code: 'SOFTWARE_PARK', name: 'Software Park' },
        { code: 'BUSINESS_PARK', name: 'Business Park' },
        { code: 'TECHNOLOGY_CAMPUS', name: 'Technology Campus' },
      ],
    },
    {
      code: 'EDUCATIONAL',
      name: 'Educational',
      types: [
        { code: 'SCHOOL', name: 'School' },
        { code: 'COLLEGE', name: 'College' },
        { code: 'UNIVERSITY', name: 'University' },
        { code: 'HOSTEL', name: 'Hostel' },
        { code: 'TRAINING_INSTITUTE', name: 'Training Institute' },
      ],
    },
    {
      code: 'HEALTHCARE',
      name: 'Healthcare',
      types: [
        { code: 'HOSPITAL', name: 'Hospital' },
        { code: 'MEDICAL_CENTRE', name: 'Medical Centre' },
        { code: 'CLINIC', name: 'Clinic' },
        { code: 'NURSING_HOME', name: 'Nursing Home' },
      ],
    },
    {
      code: 'HOSPITALITY',
      name: 'Hospitality',
      types: [
        { code: 'HOTEL_HOSPITALITY', name: 'Hotel' },
        { code: 'RESORT', name: 'Resort' },
        { code: 'GUEST_HOUSE', name: 'Guest House' },
        { code: 'SERVICE_APARTMENT', name: 'Service Apartment' },
      ],
    },
    {
      code: 'GOVERNMENT',
      name: 'Government',
      types: [
        { code: 'GOVERNMENT_OFFICE', name: 'Government Office' },
        { code: 'MUNICIPALITY', name: 'Municipality' },
        { code: 'PUBLIC_BUILDING', name: 'Public Building' },
      ],
    },
  ];

  for (const cat of categoryData) {
    const category = await prisma.propertyCategoryMaster.upsert({
      where: { code: cat.code },
      update: {},
      create: {
        code: cat.code,
        name: cat.name,
      },
    });

    for (const type of cat.types) {
      await prisma.propertyTypeMaster.upsert({
        where: { code: type.code },
        update: { categoryId: category.id },
        create: {
          code: type.code,
          name: type.name,
          categoryId: category.id,
        },
      });
    }
  }
  console.log(`✅ Seeded ${categoryData.length} Property Categories and their Types`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
