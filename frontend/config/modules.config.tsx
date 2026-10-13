import { 
  Building, Building2, Box, Calendar, Car, FileText, Clock, Users, ShieldCheck, Megaphone, LifeBuoy, FolderOpen
} from 'lucide-react';

export interface ModuleConfig {
  code: string;
  name: string;
  brandName: string;
  category: string;
  items: {
    title: string;
    href: string;
    icon: React.ReactNode;
    requiredRoles?: string[];
  }[];
}

export const MODULES_CONFIG: ModuleConfig[] = [
  {
    code: 'PROPERTY_MANAGEMENT',
    name: 'Property Management',
    brandName: 'Core Property',
    category: 'Property Structure',
    items: [
      { title: 'Buildings', href: '/organization/buildings', icon: <Building size={20} /> },
      { title: 'Towers', href: '/organization/towers', icon: <Building2 size={20} /> },
      { title: 'Floors', href: '/organization/floors', icon: <Box size={20} /> },
      { title: 'Units', href: '/organization/units', icon: <Building size={20} /> },
      { title: 'Residents & Occupants', href: '/organization/residents', icon: <Users size={20} /> },
      { title: 'Documents', href: '/organization/documents', icon: <FileText size={20} /> },
    ]
  },
  {
    code: 'FACILITY_MANAGEMENT',
    name: 'Facility Management',
    brandName: 'SmartiFacility',
    category: 'Facilities & Assets',
    items: [
      { title: 'Facility Reservations', href: '/organization/facilities', icon: <Calendar size={20} /> },
    ]
  },
  {
    code: 'COMPLAINT_MANAGEMENT',
    name: 'Complaints & Escalations',
    brandName: 'SmartiCare',
    category: 'Maintenance & Operations',
    items: [
      { title: 'Complaints & Incidents', href: '/organization/complaints', icon: <LifeBuoy size={20} /> },
      { title: 'Complaint Categories', href: '/organization/complaint-categories', icon: <FolderOpen size={20} /> },
    ]
  },
  {
    code: 'ASSET_MANAGEMENT',
    name: 'Asset Management',
    brandName: 'SmartiAsset',
    category: 'Facilities & Assets',
    items: [
      { title: 'Assets & Inventory', href: '/organization/assets', icon: <Box size={20} /> },
    ]
  },
  {
    code: 'PARKING_MANAGEMENT',
    name: 'Parking Management',
    brandName: 'SmartiPark',
    category: 'Facilities & Assets',
    items: [
      { title: 'SmartiPark', href: '/organization/parking', icon: <Car size={20} /> },
    ]
  },
  {
    code: 'VISITOR_MANAGEMENT',
    name: 'Visitor Management',
    brandName: 'SmartiVisit',
    category: 'Administration & Staff',
    items: [
      { title: 'Visitors', href: '/organization/visitors', icon: <Users size={20} /> },
    ]
  },
  {
    code: 'COMMUNITY_MANAGEMENT',
    name: 'Alerts & Announcements',
    brandName: 'SmartiAlert',
    category: 'Administration & Staff',
    items: [
      { title: 'Alerts & Broadcasts', href: '/organization/alerts', icon: <Megaphone size={20} /> },
    ]
  },
  {
    code: 'WORK_ORDERS',
    name: 'Work Orders',
    brandName: 'SmartiWork',
    category: 'Maintenance & Operations',
    items: [
      { title: 'Work Orders', href: '/organization/work-orders', icon: <FileText size={20} /> },
    ]
  },
  {
    code: 'PREVENTIVE_MAINTENANCE',
    name: 'Preventive Maintenance',
    brandName: 'SmartiWork',
    category: 'Maintenance & Operations',
    items: [
      { title: 'Preventive Maintenance', href: '/organization/maintenance-plans', icon: <Clock size={20} /> },
    ]
  },
  {
    code: 'SECURITY_MANAGEMENT',
    name: 'Security Management',
    brandName: 'SmartiGuard',
    category: 'System & Security',
    items: [
      { title: 'Security Monitoring', href: '/organization/security', icon: <ShieldCheck size={20} /> },
      { title: 'Security Guards', href: '/organization/security-guards', icon: <Users size={20} /> },
    ]
  }
];
