import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as argon2 from 'argon2';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

const ALL_MODULES = [
  'Dashboard', 'Organization', 'User', 'Role', 'Permission', 'Building', 'Tower', 'Floor', 'Unit',
  'Owner', 'Tenant', 'Resident', 'Staff', 'Department', 'Asset', 'AssetCategory', 'AssetGroup',
  'AssetDocument', 'PreventiveMaintenance', 'CorrectiveMaintenance', 'MaintenanceRequest',
  'WorkOrder', 'WorkOrderComment', 'WorkOrderAttachment', 'Schedule', 'Inspection', 'Checklist',
  'Inventory', 'InventoryTransaction', 'SparePart', 'Vendor', 'Contractor', 'PurchaseOrder',
  'Quotation', 'Invoice', 'Payment', 'Budget', 'Expense', 'Visitor', 'VisitorRegistration', 'GatePass', 'Incident',
  'Parking', 'Announcement', 'Notification', 'Document', 'Report', 'Settings', 'AuditLog'
];

const SYSTEM_MODULES = [
  { id: 'PROPERTY_MANAGEMENT', name: 'Property Management', description: 'Core property management features' },
  { id: 'FACILITY_MANAGEMENT', name: 'Facility Management', description: 'Facility and booking management' },
  { id: 'ASSET_MANAGEMENT', name: 'Asset Management', description: 'Asset tracking and management' },
  { id: 'PARKING_MANAGEMENT', name: 'Parking Management', description: 'Parking spaces and vehicles' },
  { id: 'VISITOR_MANAGEMENT', name: 'Visitor Management', description: 'Visitor registration and tracking' },
  { id: 'SECURITY_MANAGEMENT', name: 'Security Management', description: 'Security and incident reporting' },
  { id: 'BILLING_FINANCE', name: 'Billing & Finance', description: 'Invoices, payments, and budgets' },
  { id: 'RESIDENT_PORTAL', name: 'Resident Portal', description: 'Portal for residents' },
  { id: 'TENANT_PORTAL', name: 'Tenant Portal', description: 'Portal for commercial tenants' },
  { id: 'INVENTORY_MANAGEMENT', name: 'Inventory Management', description: 'Inventory and stock tracking' },
  { id: 'VENDOR_MANAGEMENT', name: 'Vendor Management', description: 'Vendor and contractor tracking' },
  { id: 'PROCUREMENT', name: 'Procurement', description: 'Purchase orders and quotations' },
  { id: 'WORK_ORDERS', name: 'Work Orders', description: 'Work order generation and tracking' },
  { id: 'PREVENTIVE_MAINTENANCE', name: 'Preventive Maintenance', description: 'Scheduled maintenance plans' },
  { id: 'CORRECTIVE_MAINTENANCE', name: 'Corrective Maintenance', description: 'Breakdown and repair maintenance' },
  { id: 'HOUSEKEEPING', name: 'Housekeeping', description: 'Cleaning schedules and checklists' },
  { id: 'COMPLAINT_MANAGEMENT', name: 'Complaint Management', description: 'Resident and tenant complaints' },
  { id: 'HELPDESK', name: 'Helpdesk', description: 'Support ticketing system' },
  { id: 'COMMUNITY_MANAGEMENT', name: 'Community Management', description: 'Announcements, events, and polls' },
  { id: 'DOCUMENT_MANAGEMENT', name: 'Document Management', description: 'Document storage and sharing' },
  { id: 'UTILITY_MANAGEMENT', name: 'Utility Management', description: 'Utility bills and meters' },
  { id: 'ENERGY_MONITORING', name: 'Energy Monitoring', description: 'Energy consumption tracking' },
  { id: 'IOT_INTEGRATION', name: 'IoT Integration', description: 'IoT sensors and smart devices' },
  { id: 'ACCESS_CONTROL', name: 'Access Control', description: 'Digital access systems' },
  { id: 'LIFT_MANAGEMENT', name: 'Lift Management', description: 'Elevator monitoring' },
  { id: 'CCTV_MANAGEMENT', name: 'CCTV Management', description: 'Camera systems' },
  { id: 'INCIDENT_MANAGEMENT', name: 'Incident Management', description: 'Safety and security incidents' },
  { id: 'EVENT_BOOKING', name: 'Event Booking', description: 'Community event bookings' },
  { id: 'FACILITY_BOOKING', name: 'Facility Booking', description: 'Amenities booking' },
  { id: 'VEHICLE_MANAGEMENT', name: 'Vehicle Management', description: 'Vehicle registration' },
  { id: 'STAFF_MANAGEMENT', name: 'Staff Management', description: 'Employee tracking' },
  { id: 'HR', name: 'HR', description: 'Human resources management' },
  { id: 'REPORTS', name: 'Reports', description: 'Reporting and analytics' },
  { id: 'ANALYTICS_DASHBOARD', name: 'Analytics Dashboard', description: 'Advanced analytics' },
];

const SYSTEM_CATEGORIES = [
  { id: 'RESIDENTIAL', name: 'Residential', description: 'Residential properties' },
  { id: 'COMMERCIAL', name: 'Commercial', description: 'Commercial spaces' },
  { id: 'INDUSTRIAL', name: 'Industrial', description: 'Industrial facilities' },
  { id: 'MIXED_USE', name: 'Mixed Use', description: 'Mixed residential and commercial' },
  { id: 'GATED_COMMUNITY', name: 'Gated Community', description: 'Gated residential areas' },
  { id: 'IT_PARK', name: 'IT Park', description: 'IT and technology parks' },
  { id: 'EDUCATIONAL', name: 'Educational', description: 'Schools and universities' },
  { id: 'HEALTHCARE', name: 'Healthcare', description: 'Hospitals and clinics' },
  { id: 'HOSPITALITY', name: 'Hospitality', description: 'Hotels and resorts' },
  { id: 'GOVERNMENT', name: 'Government', description: 'Government buildings' },
];

const BASE_ACTIONS = ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LIST', 'EXPORT', 'IMPORT', 'APPROVE', 'REJECT', 'ASSIGN', 'ARCHIVE', 'RESTORE'];

async function main() {
  console.log('Seeding Master Data (Modules & Categories)...');
  
  for (const mod of SYSTEM_MODULES) {
    await prisma.moduleMaster.upsert({
      where: { code: mod.id },
      update: { name: mod.name, description: mod.description },
      create: { id: mod.id, code: mod.id, name: mod.name, description: mod.description },
    });
  }

  for (const cat of SYSTEM_CATEGORIES) {
    await prisma.propertyCategoryMaster.upsert({
      where: { code: cat.id },
      update: { name: cat.name, description: cat.description },
      create: { id: cat.id, code: cat.id, name: cat.name, description: cat.description },
    });
  }

  console.log('Seeding Platform Admin...');

  const adminEmail = 'admin@platform.com';
  const adminPassword = 'Password123';

  // Create or get platform organization
  let platformOrg = await prisma.organization.findFirst({
    where: { name: 'Platform HQ' },
  });

  if (!platformOrg) {
    platformOrg = await prisma.organization.create({
      data: { name: 'Platform HQ', industry: 'Software', size: '1-10' },
    });
  }

  console.log('Seeding baseline permissions...');
  
  // Create all granular permissions dynamically
  for (const subject of ALL_MODULES) {
    for (const action of BASE_ACTIONS) {
      const exists = await prisma.permission.findFirst({ where: { action, subject } });
      if (!exists) {
        await prisma.permission.create({
          data: {
            action,
            subject,
            description: `Allows ${action.toLowerCase()} operations on ${subject}s`,
          }
        });
      }
    }
  }
  
  // Specific additional module permissions (if any custom ones are needed)
  const additionalPermissions = [
    { action: 'MANAGE', subject: 'ALL', description: 'Full system access' }
  ];
  for (const perm of additionalPermissions) {
    const exists = await prisma.permission.findFirst({ where: { action: perm.action, subject: perm.subject } });
    if (!exists) {
      await prisma.permission.create({ data: perm });
    }
  }
  
  const allPermRecords = await prisma.permission.findMany();
  
  // Helper function to map wildcard strings (e.g. ['Building.*', 'User.READ']) to actual Permission IDs
  const getPermissionIds = (rolePerms: string[]) => {
    if (rolePerms.includes('*') || rolePerms.includes('ALL.*')) {
      return allPermRecords.map(p => p.id);
    }
    
    let matchedIds: string[] = [];
    for (const permString of rolePerms) {
      const [subject, action] = permString.split('.');
      if (action === '*') {
        matchedIds.push(...allPermRecords.filter(p => p.subject.toLowerCase() === subject.toLowerCase()).map(p => p.id));
      } else {
        const exactMatch = allPermRecords.find(p => p.subject.toLowerCase() === subject.toLowerCase() && p.action.toLowerCase() === action.toUpperCase());
        if (exactMatch) matchedIds.push(exactMatch.id);
      }
    }
    return Array.from(new Set(matchedIds)); // Unique IDs
  };

  const ROLES_DEFINITION = [
    { name: 'PLATFORM_SUPER_ADMIN', desc: 'Full platform access', isDefault: true, perms: ['*'] },
    { name: 'SUPPORT_ADMIN', desc: 'Support access', isDefault: true, perms: ['organization.read', 'organization.list', 'user.read', 'user.list', 'user.update', 'auditlog.read', 'auditlog.list'] },
    { name: 'BILLING_ADMIN', desc: 'Billing access', isDefault: true, perms: ['organization.read', 'organization.list', 'invoice.*', 'payment.*', 'report.read', 'report.list'] },
    { name: 'PLATFORM_AUDITOR', desc: 'Global read only', isDefault: true, perms: ['*.read', '*.list', 'report.export', 'auditlog.read', 'auditlog.list'] },
    
    { name: 'ORGANIZATION_ADMIN', desc: 'Full Organization access', isDefault: true, perms: ['*'] },
    { name: 'ORGANIZATION_MANAGER', desc: 'Manager access', isDefault: false, perms: ['report.read', 'staff.*', 'dashboard.read'] },
    { name: 'FACILITY_MANAGER', desc: 'Facility manager', isDefault: false, perms: ['building.*', 'asset.*', 'inspection.*', 'preventivemaintenance.*', 'correctivemaintenance.*', 'workorder.*', 'report.read'] },
    { name: 'MAINTENANCE_MANAGER', desc: 'Maintenance lead', isDefault: false, perms: ['preventivemaintenance.create', 'workorder.*', 'maintenancerequest.approve', 'report.read'] },
    { name: 'BUILDING_MANAGER', desc: 'Building supervisor', isDefault: false, perms: ['building.*', 'tower.*', 'floor.*', 'unit.*', 'workorder.read', 'workorder.list'] },
    { name: 'INVENTORY_MANAGER', desc: 'Inventory control', isDefault: false, perms: ['inventory.*', 'inventorytransaction.*', 'sparepart.*', 'vendor.*'] },
    { name: 'PROCUREMENT_MANAGER', desc: 'Procurement', isDefault: false, perms: ['vendor.*', 'quotation.*', 'purchaseorder.*'] },
    { name: 'FINANCE_MANAGER', desc: 'Finance access', isDefault: false, perms: ['invoice.*', 'payment.*', 'expense.*', 'budget.*', 'report.read'] },
    { name: 'HR_MANAGER', desc: 'HR access', isDefault: false, perms: ['staff.*', 'department.*', 'role.assign'] },
    { name: 'SECURITY_MANAGER', desc: 'Security supervisor', isDefault: false, perms: ['incident.*', 'visitor.*', 'gatepass.*', 'staff.read'] },
    { name: 'HOUSEKEEPING_MANAGER', desc: 'Housekeeping lead', isDefault: false, perms: ['schedule.create', 'schedule.update', 'inspection.read'] },
    { name: 'RECEPTIONIST', desc: 'Front desk', isDefault: false, perms: ['visitor.create', 'visitor.read', 'gatepass.create', 'gatepass.read', 'resident.read', 'unit.read'] },
    { name: 'AUDITOR', desc: 'Organization auditor', isDefault: false, perms: ['*.read', '*.list', 'report.export', 'auditlog.read'] },
    
    { name: 'TOWER_MANAGER', desc: 'Tower manager', isDefault: false, perms: ['tower.*', 'floor.read', 'unit.read'] },
    { name: 'FLOOR_MANAGER', desc: 'Floor manager', isDefault: false, perms: ['floor.*', 'unit.read', 'maintenancerequest.read'] },
    { name: 'TECHNICIAN', desc: 'General tech', isDefault: false, perms: ['workorder.read', 'workorder.update', 'workordercomment.create', 'workorderattachment.create'] },
    { name: 'ELECTRICIAN', desc: 'Electrician', isDefault: false, perms: ['workorder.read', 'workorder.update', 'workordercomment.create', 'workorderattachment.create'] },
    { name: 'PLUMBER', desc: 'Plumber', isDefault: false, perms: ['workorder.read', 'workorder.update', 'workordercomment.create', 'workorderattachment.create'] },
    { name: 'HVAC_TECHNICIAN', desc: 'HVAC tech', isDefault: false, perms: ['workorder.read', 'workorder.update', 'workordercomment.create', 'workorderattachment.create'] },
    { name: 'CARPENTER', desc: 'Carpenter', isDefault: false, perms: ['workorder.read', 'workorder.update', 'workordercomment.create', 'workorderattachment.create'] },
    { name: 'PAINTER', desc: 'Painter', isDefault: false, perms: ['workorder.read', 'workorder.update', 'workordercomment.create', 'workorderattachment.create'] },
    { name: 'CLEANER', desc: 'Cleaner', isDefault: false, perms: ['schedule.read', 'schedule.update'] },
    { name: 'SECURITY_GUARD', desc: 'Security guard', isDefault: false, perms: ['incident.read', 'incident.create', 'incident.update', 'visitorregistration.read', 'visitorregistration.create', 'visitorregistration.update'] },
    
    { name: 'UNIT_OWNER', desc: 'Owner', isDefault: false, perms: ['unit.read', 'maintenancerequest.create', 'maintenancerequest.read', 'invoice.read', 'payment.read', 'document.read'] },
    { name: 'TENANT', desc: 'Tenant', isDefault: false, perms: ['maintenancerequest.create', 'maintenancerequest.read', 'document.read', 'invoice.read', 'notification.read'] },
    { name: 'RESIDENT', desc: 'Resident', isDefault: false, perms: ['announcement.read', 'notification.read', 'maintenancerequest.create'] },
    
    { name: 'VENDOR', desc: 'Vendor', isDefault: false, perms: ['purchaseorder.read', 'quotation.create', 'invoice.create'] },
    { name: 'CONTRACTOR', desc: 'Contractor', isDefault: false, perms: ['workorder.read', 'workorder.update', 'document.create', 'invoice.create'] },
    { name: 'VISITOR', desc: 'Visitor', isDefault: false, perms: ['visitor.create'] }
  ];

  console.log('Seeding default roles and assigning permissions...');

  for (const roleDef of ROLES_DEFINITION) {
    let role = await prisma.role.findFirst({
      where: { name: roleDef.name, organizationId: platformOrg.id },
    });

    if (!role) {
      role = await prisma.role.create({
        data: {
          name: roleDef.name,
          description: roleDef.desc,
          organizationId: platformOrg.id,
          isDefault: roleDef.isDefault,
        },
      });
    }

    const permissionIds = getPermissionIds(roleDef.perms);
    
    // Assign permissions
    for (const pId of permissionIds) {
      const rpExists = await prisma.rolePermission.findFirst({
        where: { roleId: role.id, permissionId: pId }
      });
      if (!rpExists) {
        await prisma.rolePermission.create({
          data: { roleId: role.id, permissionId: pId }
        });
      }
    }
  }

  // PLATFORM_SUPER_ADMIN setup
  const superAdminRole = await prisma.role.findFirst({ where: { name: 'PLATFORM_SUPER_ADMIN' } });
  if (superAdminRole) {
    const passwordHash = await argon2.hash(adminPassword, { type: argon2.argon2id });
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: { passwordHash, emailVerified: true, isActive: true, isPlatformAdmin: true },
      create: {
        email: adminEmail,
        emailNormalized: adminEmail.toLowerCase(),
        passwordHash,
        firstName: 'Platform',
        lastName: 'Admin',
        isActive: true,
        emailVerified: true,
        isPlatformAdmin: true,
        organizationId: platformOrg.id,
        userRoles: { create: { roleId: superAdminRole.id } },
      },
    });
  }

  console.log('RBAC Seeding Complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
