'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Building2,
  Users,
  ShieldCheck,
  Settings,
  LayoutDashboard,
  LogOut,
  Building,
  FileText,
  X,
  Activity,
  BarChart3,
  ListFilter,
  ShieldAlert,
  Bell,
  Lock,
  Calendar,
  Box,
  Clock,
  Wrench,
  ChevronDown,
  Car,
  MapPin,
  AlertTriangle,
  ClipboardList,
  UserRound,
  Megaphone,
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store/store';
import { useLogoutMutation } from '@/services/authApi';
import { logout as logoutAction } from '@/store/slices/authSlice';
import { toggleSidebar } from '@/store/slices/uiSlice';
import { MODULES_CONFIG } from '@/config/modules.config';
import { useGetMyModulesQuery } from '@/services/platformApi';

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

interface NavGroup {
  category?: string;
  items: NavItem[];
}

export const Sidebar = () => {
  const pathname = usePathname();
  const dispatch = useDispatch();
  const [logoutApi] = useLogoutMutation();
  const roles = useSelector((state: RootState) => state.auth.user?.roles || []);
  const sidebarOpen = useSelector((state: RootState) => state.ui.sidebarOpen);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  // Dynamic Module Checking
  const { data: myModulesResponse } = useGetMyModulesQuery(undefined, {
    skip: !roles.includes('ORGANIZATION_ADMIN') && !roles.includes('BUILDING_MANAGER') && !roles.includes('RESIDENT') && !roles.includes('TENANT') && !roles.includes('UNIT_OWNER') && !roles.includes('TECHNICIAN'),
  });

  const reduxModules = useSelector((state: RootState) => (state.auth.user as any)?.organizationModules) || [];
  // Use the backend response as source of truth if available, otherwise fallback to Redux session state
  const enabledModules = myModulesResponse?.data?.map((m: any) => m.code) || reduxModules;
  const hasModule = (module: string) => enabledModules.includes(module);

  const isPlatformAdmin = roles.includes('PLATFORM_SUPER_ADMIN');
  const isResident = roles.includes('RESIDENT') || roles.includes('TENANT') || roles.includes('UNIT_OWNER');
  const isBuildingManager = roles.includes('BUILDING_MANAGER') && !roles.includes('ORGANIZATION_ADMIN');
  const isTechnician = roles.includes('TECHNICIAN') && !roles.includes('ORGANIZATION_ADMIN');
  const isSecurityGuard = roles.includes('SECURITY_GUARD') && !roles.includes('ORGANIZATION_ADMIN');

  const toggleCategory = (category: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const platformGroups: NavGroup[] = [
    {
      category: 'Overview',
      items: [
        { title: 'Dashboard', href: '/platform/dashboard', icon: <LayoutDashboard size={20} /> },
        { title: 'Activity Overview', href: '/platform/activity', icon: <BarChart3 size={20} /> },
      ],
    },
    {
      category: 'Organizations',
      items: [
        { title: 'Organizations', href: '/platform/organizations', icon: <Building2 size={20} /> },
        { title: 'Org Activity', href: '/platform/organizations/activity', icon: <Activity size={20} /> },
      ],
    },
    {
      category: 'User Management',
      items: [
        { title: 'Users', href: '/platform/users', icon: <Users size={20} /> },
        { title: 'Access Management', href: '/platform/roles', icon: <ShieldCheck size={20} /> },
        { title: 'Notifications', href: '/platform/notifications', icon: <Bell size={20} /> },
      ],
    },
    {
      category: 'Audit & System',
      items: [
        { title: 'Activity Logs', href: '/platform/activity/logs', icon: <ListFilter size={20} /> },
        { title: 'Audit Logs', href: '/platform/audit-logs', icon: <ShieldAlert size={20} /> },
        { title: 'Security', href: '/platform/security', icon: <Lock size={20} /> },
        { title: 'System Settings', href: '/platform/settings', icon: <Settings size={20} /> },
      ],
    },
  ];

  const orgGroups: NavGroup[] = [
    {
      category: 'Overview',
      items: [
        { title: 'Dashboard', href: '/organization/dashboard', icon: <LayoutDashboard size={20} /> },
      ],
    },
  ];

  if (roles.includes('ORGANIZATION_ADMIN') || roles.includes('BUILDING_MANAGER')) {
    const categoryMap: Record<string, NavItem[]> = {
      'Administration & Staff': [
        { title: 'Departments', href: '/organization/departments', icon: <Users size={20} /> },
        { title: 'Users', href: '/organization/users', icon: <Users size={20} /> },
        { title: 'Access Management', href: '/organization/roles', icon: <ShieldCheck size={20} /> },
        { title: 'Technicians', href: '/organization/technicians', icon: <Users size={20} /> },
        { title: 'Security Guards', href: '/organization/security-guards', icon: <ShieldCheck size={20} /> },
      ],
      'System & Security': [
        { title: 'Security Deployment', href: '/organization/security-deployment', icon: <ShieldCheck size={20} /> },
        { title: 'Activity & Audit', href: '/organization/activity', icon: <ShieldAlert size={20} /> },
        { title: 'Settings', href: '/organization/settings', icon: <Settings size={20} /> },
      ]
    };

    MODULES_CONFIG.forEach(module => {
      if (hasModule(module.code)) {
        if (!categoryMap[module.category]) {
          categoryMap[module.category] = [];
        }
        // Avoid duplicate routes if modules overlap routes
        module.items.forEach(item => {
          if (!categoryMap[module.category].find(existing => existing.href === item.href)) {
            categoryMap[module.category].push(item);
          }
        });
      }
    });

    // Define the display order for the sidebar categories
    const categoryOrder = [
      'Property Structure',
      'Facilities & Assets',
      'Maintenance & Operations',
      'Administration & Staff',
      'System & Security'
    ];

    categoryOrder.forEach(category => {
      if (categoryMap[category] && categoryMap[category].length > 0) {
        orgGroups.push({ category, items: categoryMap[category] });
      }
    });

    // Catch any remaining categories that were not explicitly ordered
    Object.keys(categoryMap).forEach(category => {
      if (!categoryOrder.includes(category) && categoryMap[category].length > 0) {
        orgGroups.push({ category, items: categoryMap[category] });
      }
    });
  }

  const residentItems: NavItem[] = [
    { title: 'Dashboard', href: '/resident/dashboard', icon: <LayoutDashboard size={20} /> },
    { title: 'Complaints', href: '/resident/complaints', icon: <FileText size={20} /> },
    { title: 'Visitors', href: '/resident/visitors', icon: <Users size={20} /> },
    { title: 'Announcements', href: '/resident/announcements', icon: <Megaphone size={20} /> },
    { title: 'Notifications', href: '/resident/notifications', icon: <Bell size={20} /> },
    { title: 'My Profile', href: '/resident/profile', icon: <UserRound size={20} /> },
  ];
  if (hasModule('FACILITY_MANAGEMENT') || hasModule('FACILITY_BOOKING')) {
    residentItems.push({ title: 'Facility Reservations', href: '/resident/facilities', icon: <Calendar size={20} /> });
  }
  if (hasModule('PARKING_MANAGEMENT') || hasModule('PARKING')) {
    residentItems.push({ title: 'My Parking', href: '/resident/parking', icon: <Car size={20} /> });
  }
  const residentGroups: NavGroup[] = [
    { items: residentItems },
  ];

  const techTaskItems: NavItem[] = [
    { title: 'My Work Orders', href: '/technician/work-orders', icon: <FileText size={20} /> },
    { title: 'Complaints', href: '/technician/complaints', icon: <FileText size={20} /> },
  ];
  if (hasModule('ASSET_MANAGEMENT')) {
    techTaskItems.push({ title: 'Assigned Assets', href: '/technician/assets', icon: <Box size={20} /> });
  }
  if (hasModule('PREVENTIVE_MAINTENANCE') || hasModule('WORK_ORDERS')) {
    techTaskItems.push({ title: 'Preventive Maintenance', href: '/technician/maintenance', icon: <Wrench size={20} /> });
  }

  const technicianGroups: NavGroup[] = [
    {
      category: 'Overview',
      items: [
        { title: 'Dashboard', href: '/technician/dashboard', icon: <LayoutDashboard size={20} /> },
      ],
    },
    {
      category: 'Tasks & Maintenance',
      items: techTaskItems,
    },
    {
      category: 'Administration & HR',
      items: [
        { title: 'Inventory Request', href: '/technician/inventory', icon: <Building2 size={20} /> },
        { title: 'Attendance', href: '/technician/attendance', icon: <Users size={20} /> },
        { title: 'Leaves', href: '/technician/leaves', icon: <ShieldCheck size={20} /> },
        { title: 'Reports', href: '/technician/reports', icon: <FileText size={20} /> },
        { title: 'Profile', href: '/technician/profile', icon: <Users size={20} /> },
      ],
    },
  ];

  const securityGroups: NavGroup[] = [
    {
      category: 'Overview',
      items: [
        { title: 'Dashboard', href: '/security/dashboard', icon: <LayoutDashboard size={20} /> },
        { title: 'My Posts', href: '/security/posts', icon: <ShieldCheck size={20} /> },
      ],
    },
    {
      category: 'Gate & Access',
      items: [
        { title: 'Visitor Check-In', href: '/security/visitors', icon: <Users size={20} /> },
        { title: 'Access Log', href: '/security/access-log', icon: <ClipboardList size={20} /> },
      ],
    },
    {
      category: 'Security Operations',
      items: [
        { title: 'Incidents', href: '/security/incidents', icon: <AlertTriangle size={20} /> },
        { title: 'Patrol Routes', href: '/security/patrols', icon: <MapPin size={20} /> },
      ],
    },
  ];

  let navGroups = orgGroups;
  if (isPlatformAdmin) navGroups = platformGroups;
  else if (isResident) navGroups = residentGroups;
  else if (isTechnician) navGroups = technicianGroups;
  else if (isSecurityGuard) navGroups = securityGroups;
  else if (isBuildingManager) navGroups = orgGroups;

  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logoutApi({}).unwrap();
    } catch (err) { }
    dispatch(logoutAction());
    router.push('/login');
  };

  const SidebarContent = (
    <div className="flex h-full w-64 flex-col border-r border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#0a0f1c]/80 backdrop-blur-2xl shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-all">
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-slate-200 dark:border-white/10 bg-transparent">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">BMMS</span>
        </div>
        <button className="ml-auto md:hidden text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white" onClick={() => dispatch(toggleSidebar())}>
          <X size={20} />
        </button>
      </div>
      <nav className="flex-1 space-y-5 px-3 py-5 overflow-y-auto">
        {navGroups.map((group, groupIdx) => {
          const isCollapsed = group.category ? !!collapsedCategories[group.category] : false;
          return (
            <div key={group.category || groupIdx} className="space-y-1">
              {group.category && (
                <button
                  type="button"
                  onClick={() => toggleCategory(group.category!)}
                  className="flex w-full items-center justify-between px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors focus:outline-none group"
                >
                  <span className="truncate">{group.category}</span>
                  <ChevronDown
                    size={14}
                    className={`text-slate-400 dark:text-slate-500 transform transition-transform duration-200 ${isCollapsed ? '-rotate-90' : 'rotate-0'
                      }`}
                  />
                </button>
              )}
              <div className={`space-y-1 transition-all duration-200 ${isCollapsed ? 'hidden' : 'block'}`}>
                {group.items.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.title}
                      href={item.href}
                      className={`group flex items-center px-3 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${isActive
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] font-semibold'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white'
                        }`}
                      onClick={() => {
                        if (window.innerWidth < 768) {
                          dispatch(toggleSidebar());
                        }
                      }}
                    >
                      <div className={`mr-3 flex-shrink-0 transition-colors duration-200 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`}>
                        {item.icon}
                      </div>
                      <span className="truncate">{item.title}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
      <div className="flex shrink-0 border-t border-slate-200 dark:border-white/10 p-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all duration-300"
        >
          <LogOut className="mr-3 h-4 w-4 text-red-400 group-hover:text-red-500" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile sidebar overlay */}
      <div
        className={`fixed inset-0 z-40 bg-gray-900/80 backdrop-blur-sm transition-opacity md:hidden ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        onClick={() => dispatch(toggleSidebar())}
      />

      {/* Sidebar container (responsive) */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
        {SidebarContent}
      </div>
    </>
  );
};

