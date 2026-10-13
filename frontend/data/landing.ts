// data/landing.ts
// Central content for the BMMS landing page. All terminology reflects actual BMMS architecture.

export const SITE_META = {
  title: 'BMMS — Intelligent Property & Facility Management Platform',
  description: 'BMMS connects property management, facilities, maintenance, parking, security and resident operations in one intelligent platform.',
};

export const NAV_LINKS = [
  { label: 'Platform', href: '#platform' },
  { label: 'Modules', href: '#modules' },
  { label: 'Workflow', href: '#workflow' },
  { label: 'Security', href: '#security' },
  { label: 'Solutions', href: '#solutions' },
];

export const MODULES = [
  { id: 'property', label: 'Property Admin', color: '#3b82f6', description: 'Map your entire portfolio. Manage buildings, towers, floors, units, owners, tenants, and residents in a structured digital hierarchy.', features: ['Building Setup', 'Tower & Floor Management', 'Unit Management', 'Owner & Tenant Records'] },
  { id: 'facilities', label: 'Facilities', color: '#10b981', description: 'Keep all amenities and shared spaces well-maintained. Schedule preventive maintenance, track usage, and manage facility bookings.', features: ['Facility Booking', 'Preventive Maintenance', 'Inspections', 'Vendor Management'] },
  { id: 'work_orders', label: 'Work Orders', color: '#f59e0b', description: 'Connect resident requests to technician dispatch. Track every maintenance request from creation to resolution with a full audit trail.', features: ['Request Management', 'Technician Assignment', 'Progress Tracking', 'Audit Logging'] },
  { id: 'assets', label: 'Assets', color: '#8b5cf6', description: 'Maintain a living record of every physical asset. Track condition, location, and maintenance schedules across the entire property.', features: ['Asset Registry', 'Condition Tracking', 'Maintenance Schedule', 'Location Mapping'] },
  { id: 'parking', label: 'Parking', color: '#22d3ee', description: 'Full parking lifecycle from bay allocation to active sessions. Manage parking areas, zones, bays, permits, reservations and violations.', features: ['Parking Areas & Zones', 'Bay Allocation', 'Session Management', 'Permits & Reservations'] },
  { id: 'security', label: 'Security', color: '#f43f5e', description: 'Gate operations, visitor management and incident reporting in one interface. QR-based visitor passes, guard tours and real-time alerts.', features: ['Visitor Management', 'QR Access Passes', 'Incident Reporting', 'Guard Tours'] },
  { id: 'visitors', label: 'Visitors', color: '#f97316', description: 'Pre-register visitors, issue time-limited QR passes and track all visitor activity at gate and within the property.', features: ['Pre-registration', 'QR Passes', 'Visitor Logs', 'Overstay Alerts'] },
  { id: 'residents', label: 'Residents', color: '#06b6d4', description: 'Give residents a self-service portal for parking, facility bookings, maintenance requests, billing and announcements.', features: ['Resident Portal', 'Facility Booking', 'Request Submission', 'Billing & Payments'] },
];

export const HIERARCHY_LEVELS = [
  { level: 'Building', desc: 'The root entity — the physical property', color: '#3b82f6' },
  { level: 'Tower / Block', desc: 'Manage multiple structures within a property', color: '#06b6d4' },
  { level: 'Floor', desc: 'Spatial grouping within each tower', color: '#10b981' },
  { level: 'Unit', desc: 'Individual residential or commercial spaces', color: '#f59e0b' },
  { level: 'Resident / Tenant', desc: 'End-users — owners and tenants in units', color: '#8b5cf6' },
];

export const WORKFLOW_STEPS = [
  { id: 'request', title: 'Resident Request', desc: 'Submitted via resident portal or mobile', color: '#3b82f6' },
  { id: 'manager', title: 'Manager Review', desc: 'Reviewed and approved in the command center', color: '#f59e0b' },
  { id: 'work_order', title: 'Work Order Created', desc: 'Detailed work order generated automatically', color: '#8b5cf6' },
  { id: 'dispatch', title: 'Technician Dispatched', desc: 'Assigned with checklist and tools required', color: '#f97316' },
  { id: 'resolution', title: 'Issue Resolved', desc: 'Completion confirmed and resident notified', color: '#10b981' },
  { id: 'audit', title: 'Audit Trail', desc: 'Full history logged for compliance and review', color: '#94a3b8' },
];

export const PERSONAS = [
  { role: 'Property Manager', color: '#3b82f6', description: 'Manage the entire property portfolio, finances, occupancy and team from a powerful operational command center.' },
  { role: 'Technician', color: '#f59e0b', description: 'Receive work orders, complete digital checklists, update progress and close jobs from a streamlined mobile interface.' },
  { role: 'Security', color: '#f43f5e', description: 'Scan visitor QR passes, conduct guard tours, monitor gate activity and report incidents in real-time.' },
  { role: 'Resident', color: '#10b981', description: 'Book facilities, pay bills, allocate parking, raise maintenance requests and receive announcements easily.' },
];

export const SECURITY_PILLARS = [
  { title: 'Organization Isolation', desc: 'Every organization is a fully isolated data tenant. No data leaks between organizations.', color: '#3b82f6' },
  { title: 'Role-Based Access', desc: 'Granular RBAC ensures each user only sees what they are permitted to see and do.', color: '#8b5cf6' },
  { title: 'Audit Logging', desc: 'Every action, change and access event is permanently logged for compliance and review.', color: '#10b981' },
  { title: 'Secure Authentication', desc: 'Cryptographic session management with secure token handling and expiry controls.', color: '#22d3ee' },
];

export const BUSINESS_IMPACTS = [
  { title: 'Reduce Manual Work', desc: 'Automate repetitive operations, data entry and reporting.' },
  { title: 'Faster Issue Resolution', desc: 'Connect maintenance requests directly to operational workflows.' },
  { title: 'Better Operational Visibility', desc: 'Understand exactly what is happening across your portfolio.' },
  { title: 'Connected Teams', desc: 'Keep management, technicians, security and residents in sync.' },
  { title: 'Scalable Operations', desc: 'Expand to new properties without multiplying administrative overhead.' },
  { title: 'Better Resident Experience', desc: 'Deliver the high-quality digital experience residents expect.' },
];

export const PARKING_BAY_TYPES = [
  { type: 'Available', color: '#10b981', count: 24 },
  { type: 'Occupied', color: '#ef4444', count: 38 },
  { type: 'Reserved', color: '#3b82f6', count: 12 },
  { type: 'EV Charging', color: '#22d3ee', count: 8 },
  { type: 'Visitor', color: '#f59e0b', count: 6 },
  { type: 'Accessible', color: '#8b5cf6', count: 4 },
];
