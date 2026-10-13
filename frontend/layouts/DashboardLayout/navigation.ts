import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import ApartmentIcon from '@mui/icons-material/Apartment';
import GroupIcon from '@mui/icons-material/Group';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import BadgeIcon from '@mui/icons-material/Badge';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import DescriptionIcon from '@mui/icons-material/Description';
import InventoryIcon from '@mui/icons-material/Inventory';
import BuildIcon from '@mui/icons-material/Build';
import SecurityIcon from '@mui/icons-material/Security';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';

export interface NavItem {
  title: string;
  path: string;
  icon: any;
  roles: string[];
}

export const navigationConfig: NavItem[] = [
  {
    title: 'Dashboard',
    path: '/dashboard',
    icon: DashboardIcon,
    roles: ['SUPER_ADMIN', 'PROPERTY_MANAGER', 'FACILITY_MANAGER', 'TECHNICIAN', 'SECURITY', 'OWNER', 'TENANT']
  },
  {
    title: 'Users',
    path: '/dashboard/users',
    icon: PeopleIcon,
    roles: ['SUPER_ADMIN']
  },
  {
    title: 'Properties',
    path: '/dashboard/properties',
    icon: ApartmentIcon,
    roles: ['SUPER_ADMIN', 'PROPERTY_MANAGER']
  },
  {
    title: 'Residents',
    path: '/dashboard/residents',
    icon: GroupIcon,
    roles: ['SUPER_ADMIN', 'PROPERTY_MANAGER']
  },
  {
    title: 'Complaints',
    path: '/dashboard/complaints',
    icon: ReportProblemIcon,
    roles: ['SUPER_ADMIN', 'PROPERTY_MANAGER', 'FACILITY_MANAGER', 'OWNER', 'TENANT']
  },
  {
    title: 'Visitors',
    path: '/dashboard/visitors',
    icon: BadgeIcon,
    roles: ['SUPER_ADMIN', 'PROPERTY_MANAGER', 'SECURITY', 'OWNER', 'TENANT']
  },
  {
    title: 'Facilities',
    path: '/dashboard/facilities',
    icon: EventAvailableIcon,
    roles: ['SUPER_ADMIN', 'PROPERTY_MANAGER', 'FACILITY_MANAGER', 'OWNER', 'TENANT']
  },
  {
    title: 'Documents',
    path: '/dashboard/documents',
    icon: DescriptionIcon,
    roles: ['SUPER_ADMIN', 'PROPERTY_MANAGER', 'FACILITY_MANAGER', 'OWNER']
  },
  {
    title: 'Assets',
    path: '/dashboard/assets',
    icon: InventoryIcon,
    roles: ['SUPER_ADMIN', 'PROPERTY_MANAGER', 'FACILITY_MANAGER']
  },
  {
    title: 'Maintenance',
    path: '/dashboard/maintenance',
    icon: BuildIcon,
    roles: ['SUPER_ADMIN', 'PROPERTY_MANAGER', 'FACILITY_MANAGER', 'TECHNICIAN']
  },
  {
    title: 'Security',
    path: '/dashboard/security',
    icon: SecurityIcon,
    roles: ['SUPER_ADMIN', 'PROPERTY_MANAGER', 'SECURITY']
  },
  {
    title: 'Reports',
    path: '/dashboard/reports',
    icon: AssessmentIcon,
    roles: ['SUPER_ADMIN', 'PROPERTY_MANAGER', 'FACILITY_MANAGER']
  },
  {
    title: 'Settings',
    path: '/dashboard/settings',
    icon: SettingsIcon,
    roles: ['SUPER_ADMIN', 'PROPERTY_MANAGER', 'FACILITY_MANAGER', 'TECHNICIAN', 'SECURITY', 'OWNER', 'TENANT']
  }
];
