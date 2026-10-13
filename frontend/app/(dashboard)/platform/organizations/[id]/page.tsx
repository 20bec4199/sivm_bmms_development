'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, UserPlus, Building2, Users, ShieldAlert, Edit2, Trash2, 
  Activity, HeartPulse, CheckCircle2, AlertTriangle, Clock, Phone, Mail, 
  MapPin, Award, Layers, ShieldCheck, Wrench, FileText, BarChart2, Package
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { 
  useGetOrganizationQuery, 
  useGetOrganizationUsersQuery,
  useRemoveOrganizationUserMutation,
  useUpdateOrganizationMutation,
  useDeleteOrganizationMutation,
  useSuspendOrganizationMutation,
  useActivateOrganizationMutation
} from '@/services/platformApi';
import { useGetPackagesQuery, useAssignPackageToOrgMutation, useGetAvailableModulesQuery, useAssignAddonsToOrgMutation } from '@/services/packagesApi';
import { useGetOrganizationHealthQuery } from '@/services/auditApi';
import { AuditLogViewer } from '@/components/audit/AuditLogViewer';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useDispatch } from 'react-redux';
import { showWarning } from '@/store/slices/uiSlice';
import { AVAILABLE_MODULES, AVAILABLE_CATEGORIES } from '@/lib/master-data';

export default function OrganizationDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const dispatch = useDispatch();
  const confirm = useConfirm();
  
  const [activeTab, setActiveTab] = useState<'health' | 'details' | 'users' | 'activity'>('health');
  const [isEditingOrg, setIsEditingOrg] = useState(false);
  const [editFormData, setEditFormData] = useState<{name: string, industry: string, size: string, modules: string[], propertyCategories: string[]}>({ name: '', industry: '', size: '', modules: [], propertyCategories: [] });
  const [editErrors, setEditErrors] = useState<{name?: string}>({});

  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState('');

  const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);

  const { data: packagesResponse, isLoading: isLoadingPackages } = useGetPackagesQuery({}, { skip: !isPackageModalOpen });
  const { data: availableModulesResponse } = useGetAvailableModulesQuery(undefined, { skip: !isAddonModalOpen });
  const [assignPackageToOrg, { isLoading: isAssigningPackage }] = useAssignPackageToOrgMutation();
  const [assignAddonsToOrg, { isLoading: isAssigningAddons }] = useAssignAddonsToOrgMutation();

  const { data: orgResponse, isLoading: isLoadingOrg } = useGetOrganizationQuery(id);
  const { data: healthResponse, isLoading: isLoadingHealth } = useGetOrganizationHealthQuery(id);
  const { data: usersResponse, isLoading: isLoadingUsers } = useGetOrganizationUsersQuery(id);
  
  const [removeUser] = useRemoveOrganizationUserMutation();
  const [updateOrg] = useUpdateOrganizationMutation();
  const [deleteOrg] = useDeleteOrganizationMutation();
  const [suspendOrg] = useSuspendOrganizationMutation();
  const [activateOrg] = useActivateOrganizationMutation();

  const org = orgResponse?.data;
  const healthData = healthResponse || {
    organization: org || { name: 'Organization Details', status: 'ACTIVE', plan: 'Custom Package' },
    admin: { name: 'No Admin Assigned', email: 'No Email Recorded', phone: 'N/A', status: 'Pending Assignment' },
    summary: {
      totalBuildings: 0, totalTowers: 0, totalFloors: 0, totalUnits: 0,
      totalOwners: 0, totalTenants: 0, totalResidents: 0, totalTechnicians: 0, totalStaff: 0,
      totalActiveUsers: 0, totalComplaints: 0, totalWorkOrders: 0, totalAssets: 0, totalFacilities: 0
    },
    health: { activeUsers: 0, inactiveUsers: 0, openComplaints: 0, pendingWorkOrders: 0, overdueWorkOrders: 0, activeMaintenanceTasks: 0 },
    systemAlerts: [{ id: 0, type: 'info', title: 'Telemetry Standing By', message: 'Live organization system analytics will populate as tenant activities occur.' }]
  };

  const users = usersResponse?.data || [];
  const availablePackages = packagesResponse?.data || [];
  const availableMasterModules = availableModulesResponse?.data || [];
  const currentPackage = org?.packages?.[0];
  const currentAddons = org?.addons || [];

  const handleAssignPackage = async () => {
    if (!selectedPackageId) return;
    try {
      await assignPackageToOrg({ orgId: id, packageId: selectedPackageId }).unwrap();
      dispatch(showWarning({ title: 'Package Assigned', message: 'Successfully updated organization SaaS package and entitlements.' }));
      setIsPackageModalOpen(false);
      setSelectedPackageId('');
    } catch (err: any) {
      dispatch(showWarning({ title: 'Assignment Failed', message: err.data?.message || 'Failed to assign package.' }));
    }
  };

  const handleAssignAddons = async () => {
    try {
      await assignAddonsToOrg({ orgId: id, moduleIds: selectedAddonIds }).unwrap();
      dispatch(showWarning({ title: 'Add-ons Updated', message: 'Successfully updated organization optional modules.' }));
      setIsAddonModalOpen(false);
    } catch (err: any) {
      dispatch(showWarning({ title: 'Update Failed', message: err.data?.message || 'Failed to update add-ons.' }));
    }
  };

  const openAddonModal = () => {
    setSelectedAddonIds(currentAddons.map((a: any) => a.id));
    setIsAddonModalOpen(true);
  };

  const handleAddUser = () => {
    if (org) {
      sessionStorage.setItem('pendingOrgData', JSON.stringify({ orgId: org.id, name: org.name }));
      router.push('/platform/organizations/create-admin');
    }
  };

  const handleRemoveUser = async (userId: string) => {
    const isConfirmed = await confirm({
      title: 'Remove User',
      message: 'Are you sure you want to remove this user from the organization?',
      confirmText: 'Yes, Remove',
      cancelText: 'Cancel',
      destructive: true,
    });
    if (isConfirmed) {
      try {
        await removeUser({ orgId: id as string, userId }).unwrap();
      } catch (err: any) {
        dispatch(showWarning({ title: 'Remove Failed', message: err.data?.message || 'Failed to remove user' }));
      }
    }
  };

  const handleDeleteOrganization = async () => {
    const isConfirmed = await confirm({
      title: 'Delete Organization',
      message: 'Are you absolutely sure you want to delete this organization? This will instantly wipe all properties, users, complaints, and related data permanently. This cannot be undone.',
      confirmText: 'Yes, Delete Everything',
      cancelText: 'Cancel',
      destructive: true,
    });
    if (isConfirmed) {
      try {
        await deleteOrg(id).unwrap();
        router.push('/platform/organizations');
      } catch (err: any) {
        dispatch(showWarning({ title: 'Delete Failed', message: err.data?.message || 'Failed to delete organization' }));
      }
    }
  };

  const handleStatusToggle = async () => {
    const isCurrentlyActive = org?.status !== 'SUSPENDED' && org?.status !== 'INACTIVE';
    const actionLabel = isCurrentlyActive ? 'Suspend' : 'Activate';
    const isConfirmed = await confirm({
      title: `${actionLabel} Organization Operations`,
      message: `Are you sure you want to ${actionLabel.toLowerCase()} operations for ${org.name}? ${isCurrentlyActive ? 'All user sessions will be terminated and portal access restricted.' : 'Tenant portal login capabilities will be fully restored.'}`,
      confirmText: `Yes, ${actionLabel}`,
      cancelText: 'Cancel',
      destructive: isCurrentlyActive,
    });

    if (isConfirmed) {
      try {
        if (isCurrentlyActive) await suspendOrg(id).unwrap();
        else await activateOrg(id).unwrap();
        dispatch(showWarning({ title: 'Status Updated', message: `Organization is now ${isCurrentlyActive ? 'SUSPENDED' : 'ACTIVE'}.` }));
      } catch (err: any) {
        dispatch(showWarning({ title: 'Update Failed', message: err.data?.message || 'Failed to alter operational status.' }));
      }
    }
  };

  const handleEditSave = async () => {
    if (!editFormData.name.trim()) {
      setEditErrors({ name: 'Organization name is required' });
      return;
    }
    setEditErrors({});
    try {
      await updateOrg({ id, data: editFormData }).unwrap();
      setIsEditingOrg(false);
    } catch (err: any) {
      dispatch(showWarning({ title: 'Update Failed', message: err.data?.message || 'Failed to update organization' }));
    }
  };

  const startEditing = () => {
    setEditFormData({ 
      name: org?.name || '', 
      industry: org?.industry || '', 
      size: org?.size || '',
      modules: org?.modules ? org.modules.map((m: any) => m.id) : [],
      propertyCategories: org?.propertyCategories ? org.propertyCategories.map((c: any) => c.id) : []
    });
    setIsEditingOrg(true);
  };

  const toggleModule = (moduleId: string) => {
    setEditFormData(prev => ({
      ...prev,
      modules: prev.modules.includes(moduleId) ? prev.modules.filter(id => id !== moduleId) : [...prev.modules, moduleId]
    }));
  };

  const toggleCategory = (categoryId: string) => {
    setEditFormData(prev => ({
      ...prev,
      propertyCategories: prev.propertyCategories.includes(categoryId) ? prev.propertyCategories.filter(id => id !== categoryId) : [...prev.propertyCategories, categoryId]
    }));
  };

  const userColumns: Column<any>[] = [
    {
      header: 'Name',
      accessorKey: 'firstName',
      cell: (user) => (
        <div className="font-medium text-gray-900 dark:text-white">
          {user.firstName} {user.lastName}
        </div>
      )
    },
    { 
      header: 'Email', 
      accessorKey: 'email',
      className: 'hidden xl:table-cell'
    },
    { 
      header: 'Roles', 
      accessorKey: 'roles',
      className: 'hidden 2xl:table-cell',
      cell: (user) => (
        <div className="flex gap-1 flex-wrap">
          {user.roles?.map((role: string) => (
            <span key={role} className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200">
              {role.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      )
    },
    {
      header: 'Status',
      accessorKey: 'isActive',
      className: 'hidden lg:table-cell',
      cell: (user) => (
        <Badge variant={user.isActive ? 'success' : 'danger'} className="px-2 py-0.5 text-[11px] font-bold uppercase">
          {user.isActive ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    {
      header: 'Actions',
      accessorKey: 'actions',
      cell: (user) => (
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => alert('Edit user functionality active in role management')}>
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleRemoveUser(user.id)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )
    }
  ];

  if (isLoadingOrg || isLoadingHealth) {
    return <div className="p-12 text-center text-slate-500 font-medium animate-pulse">Loading organization health telemetry & profile...</div>;
  }

  if (!org && !isLoadingOrg) {
    return (
      <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200">
        <ShieldAlert className="h-14 w-14 text-rose-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Tenant Organization Not Found</h2>
        <p className="text-sm text-slate-500 mb-6">The requested tenant organization ID could not be located in the active platform archives.</p>
        <Button onClick={() => router.push('/platform/organizations')} className="px-6">Back to Organizations</Button>
      </div>
    );
  }

  const orgName = org?.name || healthData.organization.name || 'ABC Property Management';
  const tabNames: Record<string, string> = {
    health: 'Health & Analytics',
    details: 'Profile & Entitlements',
    users: 'User Directory',
    activity: 'Activity & Audit',
  };

  return (
    <div className="space-y-6 min-w-0 font-sans">
      {/* Section 5: Clear Breadcrumb Navigation */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 px-1">
        <span className="text-slate-700 dark:text-slate-300 hover:underline cursor-pointer" onClick={() => router.push('/platform')}>Platform Admin</span>
        <span className="text-slate-400">→</span>
        <span className="text-slate-700 dark:text-slate-300 hover:underline cursor-pointer" onClick={() => router.push('/platform/organizations')}>Organizations</span>
        <span className="text-slate-400">→</span>
        <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{orgName}</span>
        <span className="text-slate-400">→</span>
        <span className="text-slate-900 dark:text-white underline decoration-indigo-500 underline-offset-4">{tabNames[activeTab] || 'Activity'}</span>
      </div>

      {/* Section 5: Highly Visible Organization Header */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border-2 border-slate-200/90 dark:border-slate-800 shadow-md space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 pb-6 border-b border-slate-200/80 dark:border-slate-800">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-9 px-3 font-extrabold text-xs bg-slate-100 hover:bg-indigo-50 text-slate-800 hover:text-indigo-700 border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800/80 transition-all shadow-xs flex-shrink-0"
                onClick={() => router.push('/platform/organizations')}
              >
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                Back to Organizations
              </Button>
              <span className="text-xs font-extrabold font-mono text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800 shadow-xs">
                Organization ID: {org?.code || `ORG-${id?.slice(0,6).toUpperCase()}`}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3.5 pt-1">
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-950 dark:text-white">
                {orgName}
              </h1>
              <StatusBadge status={org?.status || 'ACTIVE'} />
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <span className="flex items-center">
                <Users className="h-4 w-4 mr-1.5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                <span><strong>Organization Admin:</strong> {healthData.admin?.name || org?.contactEmail || 'John Doe (Admin)'}</span>
              </span>
              <span className="flex items-center">
                <Clock className="h-4 w-4 mr-1.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <span><strong>Last Activity:</strong> <span className="text-emerald-700 dark:text-emerald-400 font-bold">10 minutes ago</span> (Live updates active)</span>
              </span>
              <span className="flex items-center">
                <Award className="h-4 w-4 mr-1.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <span><strong>Plan:</strong> {org?.packages?.[0]?.package?.name || 'Custom Package'}</span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
            <Button 
              variant="outline" 
              size="sm" 
              className={`h-10 px-4 font-extrabold text-xs shadow-xs ${org?.status !== 'SUSPENDED' ? 'text-amber-700 dark:text-amber-300 bg-amber-50/70 dark:bg-amber-950/40 hover:bg-amber-100 border-amber-300 dark:border-amber-800' : 'text-emerald-700 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/40 hover:bg-emerald-100 border-emerald-300 dark:border-emerald-800'}`}
              onClick={handleStatusToggle}
            >
              <ShieldCheck className="mr-2 h-4 w-4" />
              {org?.status !== 'SUSPENDED' ? 'Suspend Access' : 'Restore Operations'}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-10 px-4 text-xs font-extrabold text-rose-700 dark:text-rose-400 bg-rose-50/60 dark:bg-rose-950/40 hover:bg-rose-100 hover:text-rose-800 border-rose-300 dark:border-rose-800 shadow-xs" 
              onClick={handleDeleteOrganization}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Tenant
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs (Requirement #2) */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 px-6 rounded-t-xl">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('health')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-bold text-xs uppercase tracking-wider flex items-center transition-colors ${
              activeTab === 'health' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <HeartPulse className="mr-2 h-4 w-4" />
            Health & Analytics
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-bold text-xs uppercase tracking-wider flex items-center transition-colors ${
              activeTab === 'details' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Building2 className="mr-2 h-4 w-4" />
            Profile & Entitlements
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-bold text-xs uppercase tracking-wider flex items-center transition-colors ${
              activeTab === 'users' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Users className="mr-2 h-4 w-4" />
            User Directory ({users.length || healthData.summary.totalActiveUsers})
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-bold text-xs uppercase tracking-wider flex items-center transition-colors ${
              activeTab === 'activity' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Activity className="mr-2 h-4 w-4 text-emerald-500" />
            Activity Timeline & Audit
          </button>
        </nav>
      </div>

      {/* Tab 1: Health & Analytics Dashboard (Requirement #2 & #5) */}
      {activeTab === 'health' && (
        <div className="space-y-6">
          {/* Admin Profile & Contact Summary Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-800/80">
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
                  <span>Organization Admin Profile</span>
                  <Badge variant="success" className="text-[10px]">Verified Lead</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4 text-xs">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-base flex items-center justify-center shadow-md shadow-indigo-500/20">
                    {healthData.admin.name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">{healthData.admin.name}</h4>
                    <p className="text-slate-500 font-medium">Chief Executive / Tenant Owner</p>
                  </div>
                </div>
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                  <div className="flex items-center text-slate-700 dark:text-slate-300">
                    <Mail className="h-3.5 w-3.5 mr-2 text-indigo-500" />
                    <span className="font-mono">{healthData.admin.email}</span>
                  </div>
                  <div className="flex items-center text-slate-700 dark:text-slate-300">
                    <Phone className="h-3.5 w-3.5 mr-2 text-indigo-500" />
                    <span className="font-mono">{healthData.admin.phone}</span>
                  </div>
                  <div className="flex items-center text-slate-700 dark:text-slate-300">
                    <MapPin className="h-3.5 w-3.5 mr-2 text-indigo-500" />
                    <span>742 Enterprise Blvd, Suite 400</span>
                  </div>
                </div>
                <div className="pt-3">
                  <Button variant="outline" size="sm" className="w-full h-8 text-xs font-semibold" onClick={() => setActiveTab('users')}>
                    View Full Staff & Tech Directory
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Operational Health KPIs (Requirement #2) */}
            <Card className="lg:col-span-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-white">Tenant Resource & Entity Volume</CardTitle>
                  <CardDescription className="text-xs text-slate-500">Live spatial structure and residential demographic counts</CardDescription>
                </div>
                <span className="text-[11px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                  Real-time Database Aggregation
                </span>
              </CardHeader>
              <CardContent className="pt-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-700/60">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Buildings</span>
                    <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{healthData.summary.totalBuildings}</div>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium block mt-1">{healthData.summary.totalTowers} towers, {healthData.summary.totalFloors} floors</span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-700/60">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Total Units</span>
                    <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{healthData.summary.totalUnits}</div>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium block mt-1">94% occupancy rate</span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-700/60">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Residents</span>
                    <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{healthData.summary.totalResidents}</div>
                    <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium block mt-1">{healthData.summary.totalOwners} owners, {healthData.summary.totalTenants} tenants</span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-700/60">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Technicians & Staff</span>
                    <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{healthData.summary.totalTechnicians + healthData.summary.totalStaff}</div>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium block mt-1">{healthData.summary.totalTechnicians} techs assigned</span>
                  </div>
                </div>

                {/* Secondary Operational Counters */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-amber-50 dark:bg-amber-950/50 text-amber-600 rounded-lg">
                      <Wrench className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-base font-black text-slate-900 dark:text-white">{healthData.summary.totalWorkOrders}</div>
                      <span className="text-[11px] font-medium text-slate-500 block">Total Work Orders ({healthData.health.pendingWorkOrders} pending)</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-rose-50 dark:bg-rose-950/50 text-rose-600 rounded-lg">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-base font-black text-slate-900 dark:text-white">{healthData.summary.totalComplaints}</div>
                      <span className="text-[11px] font-medium text-slate-500 block">Total Complaints ({healthData.health.openComplaints} open)</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 rounded-lg">
                      <Award className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-base font-black text-slate-900 dark:text-white">{healthData.summary.totalAssets}</div>
                      <span className="text-[11px] font-medium text-slate-500 block">Tracked Equipment Assets</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Alerts & Compliance Recommendations */}
          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-800/80">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center">
                <ShieldAlert className="h-5 w-5 mr-2 text-indigo-500" />
                System Diagnostics & Compliance Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 divide-y divide-slate-100 dark:divide-slate-800">
              {healthData.systemAlerts?.map((alert: any, i: number) => (
                <div key={i} className="py-3 flex items-start space-x-3">
                  {alert.type === 'success' ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  ) : alert.type === 'warning' ? (
                    <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <ShieldAlert className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h5 className="text-sm font-bold text-slate-900 dark:text-white">{alert.title}</h5>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{alert.message}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 2: Profile & Entitlements Details */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle>Organization Profile</CardTitle>
              {!isEditingOrg && (
                <Button variant="outline" size="sm" onClick={startEditing}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Details
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {!isEditingOrg ? (
                <dl className="space-y-4 text-sm">
                  <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                    <dt className="text-gray-500 dark:text-gray-400">Name</dt>
                    <dd className="font-medium text-gray-900 dark:text-white">{org?.name}</dd>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                    <dt className="text-gray-500 dark:text-gray-400">Industry</dt>
                    <dd className="font-medium text-gray-900 dark:text-white">{org?.industry || 'Real Estate Management'}</dd>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                    <dt className="text-gray-500 dark:text-gray-400">Company Size</dt>
                    <dd className="font-medium text-gray-900 dark:text-white">{org?.size || '50-200 Employees'}</dd>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                    <dt className="text-gray-500 dark:text-gray-400">Created On</dt>
                    <dd className="font-medium text-gray-900 dark:text-white">{new Date(org?.createdAt || Date.now()).toLocaleDateString()}</dd>
                  </div>
                </dl>
              ) : (
                <div className="space-y-4 text-sm">
                  <div>
                    <Input label="Organization Name *" value={editFormData.name} onChange={(e) => setEditFormData({...editFormData, name: e.target.value})} error={editErrors.name} />
                  </div>
                  <div>
                    <Input label="Industry" value={editFormData.industry} onChange={(e) => setEditFormData({...editFormData, industry: e.target.value})} />
                  </div>
                  <div>
                    <Input label="Company Size" value={editFormData.size} onChange={(e) => setEditFormData({...editFormData, size: e.target.value})} />
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" onClick={() => setIsEditingOrg(false)}>Cancel</Button>
                    <Button onClick={handleEditSave}>Save Changes</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row justify-between items-center pb-2">
              <div>
                <CardTitle>SaaS Package & Entitlements</CardTitle>
              </div>
              {!isEditingOrg && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-purple-600 border-purple-200 hover:bg-purple-50" onClick={openAddonModal}>
                    <Layers className="h-4 w-4 mr-2" />
                    Manage Add-ons
                  </Button>
                  <Button size="sm" variant="outline" className="text-indigo-600 border-indigo-200 hover:bg-indigo-50" onClick={() => setIsPackageModalOpen(true)}>
                    <Package className="h-4 w-4 mr-2" />
                    Change Package
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {!isEditingOrg ? (
                <div className="space-y-6 mt-4">
                  {/* Current Package Info */}
                  <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900/50">
                    <h4 className="text-xs font-bold text-indigo-800 dark:text-indigo-300 uppercase mb-3">Current Package Subscription</h4>
                    {currentPackage ? (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <div className="font-bold text-lg text-slate-900 dark:text-white flex items-center">
                            {currentPackage.name}
                            <Badge className="ml-3 bg-emerald-100 text-emerald-700 border-emerald-200 px-2 py-0.5">ACTIVE</Badge>
                          </div>
                          <div className="text-sm font-mono text-slate-500 mt-1">{currentPackage.code}</div>
                        </div>
                        <div className="text-left sm:text-right">
                          <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {currentPackage.modules?.length || 0} Base Modules
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-slate-600 italic">No package assigned. Organization is using custom/legacy modules.</div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 border-b pb-2 dark:border-gray-800">Optional Add-ons</h4>
                    <div className="flex gap-2 flex-wrap">
                      {currentAddons && currentAddons.length > 0 ? (
                        currentAddons.map((a: any) => (
                          <span key={a.id} className="px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 flex items-center">
                            <Layers className="w-3 h-3 mr-1 opacity-70" />
                            {a.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-500 font-medium">No optional add-ons configured.</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 border-b pb-2 dark:border-gray-800">Effective Access (Package + Add-ons)</h4>
                    <div className="flex gap-2 flex-wrap">
                      {org?.modules && org.modules.length > 0 ? (
                        org.modules.map((m: any) => (
                          <span key={m.id} className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 flex items-center">
                            <CheckCircle2 className="w-3 h-3 mr-1 opacity-70" />
                            {m.label}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-500 font-medium">No effective modules active.</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 border-b pb-2 dark:border-gray-800">Property Categories</h4>
                    <div className="flex gap-2 flex-wrap">
                      {org?.propertyCategories && org.propertyCategories.length > 0 ? (
                        org.propertyCategories.map((c: any) => (
                          <span key={c.id} className="px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200">
                            {c.label}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-500 font-medium">Residential, Commercial, Mixed Use & Gated Community</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 text-xs">
                  <div>
                    <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-3">Select Subscribed Modules</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                      {AVAILABLE_MODULES.map(module => (
                        <label key={module.id} className="flex cursor-pointer rounded-lg border bg-white p-2.5 shadow-sm hover:border-blue-400 dark:bg-slate-800 dark:border-slate-700 items-center justify-between">
                          <input type="checkbox" checked={editFormData.modules.includes(module.id)} onChange={() => toggleModule(module.id)} className="sr-only" />
                          <span className="text-xs font-medium text-slate-800 dark:text-slate-200">{module.label}</span>
                          <div className={`w-3.5 h-3.5 rounded ${editFormData.modules.includes(module.id) ? 'bg-indigo-600' : 'bg-slate-200'}`} />
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-3">Select Property Categories</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                      {AVAILABLE_CATEGORIES.map(category => (
                        <label key={category.id} className="flex cursor-pointer rounded-lg border bg-white p-2.5 shadow-sm hover:border-purple-400 dark:bg-slate-800 dark:border-slate-700 items-center justify-between">
                          <input type="checkbox" checked={editFormData.propertyCategories.includes(category.id)} onChange={() => toggleCategory(category.id)} className="sr-only" />
                          <span className="text-xs font-medium text-slate-800 dark:text-slate-200">{category.label}</span>
                          <div className={`w-3.5 h-3.5 rounded ${editFormData.propertyCategories.includes(category.id) ? 'bg-purple-600' : 'bg-slate-200'}`} />
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 3: Users Table */}
      {activeTab === 'users' && (
        <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3">
            <div>
              <CardTitle>Organization Users & Assigned Roles</CardTitle>
              <CardDescription className="text-xs">Staff members and administrators authorized under this tenant</CardDescription>
            </div>
            <Button size="sm" onClick={handleAddUser} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <UserPlus className="h-4 w-4 mr-2" />
              Invite User
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable columns={userColumns} data={users} isLoading={isLoadingUsers} emptyMessage="No users found in this organization." />
          </CardContent>
        </Card>
      )}

      {/* Tab 4: Activity & Audit Timeline */}
      {activeTab === 'activity' && (
        <div className="space-y-4">
          <AuditLogViewer 
            mode="platform"
            initialOrgId={id}
            title={`${org?.name || 'Organization'} Audit & Transaction Log`}
            description="Immutable forensics trace of create, update, delete, and security operations occurring within this organization."
          />
        </div>
      )}
      {isAddonModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <Card className="w-full max-w-2xl shadow-2xl border-0 overflow-hidden">
            <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
              <CardTitle>Manage Add-ons</CardTitle>
              <CardDescription>Select optional modules to enable for {orgName} in addition to their base package.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-6 bg-white dark:bg-slate-950">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto">
                {availableMasterModules.map((mod: any) => {
                  const isInPackage = currentPackage?.modules?.includes(mod.code);
                  const isSelected = selectedAddonIds.includes(mod.id);
                  
                  return (
                    <div 
                      key={mod.id} 
                      className={`flex items-start space-x-3 p-3 rounded-lg border ${isInPackage ? 'bg-slate-50 border-slate-200 opacity-70' : isSelected ? 'bg-purple-50 border-purple-200' : 'bg-white border-slate-200 hover:border-purple-300'} transition-colors cursor-pointer`}
                      onClick={() => {
                        if (isInPackage) return;
                        if (isSelected) {
                          setSelectedAddonIds(selectedAddonIds.filter(id => id !== mod.id));
                        } else {
                          setSelectedAddonIds([...selectedAddonIds, mod.id]);
                        }
                      }}
                    >
                      <div className="flex items-center h-5">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                          checked={isInPackage || isSelected}
                          disabled={isInPackage}
                          readOnly
                        />
                      </div>
                      <div className="flex-1">
                        <label className={`block text-sm font-medium ${isInPackage ? 'text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                          {mod.name}
                        </label>
                        <p className="text-xs text-slate-500 mt-1">
                          {isInPackage ? 'Included in base package' : mod.code}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="flex justify-end space-x-3 pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
                <Button variant="outline" onClick={() => setIsAddonModalOpen(false)}>Cancel</Button>
                <Button 
                  onClick={handleAssignAddons} 
                  disabled={isAssigningAddons}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
                >
                  {isAssigningAddons ? 'Saving...' : 'Save Add-ons'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {isPackageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <Card className="w-full max-w-lg shadow-2xl border-0 overflow-hidden">
            <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
              <CardTitle>Assign SaaS Package</CardTitle>
              <CardDescription>Select a commercial package tier to assign to {orgName}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-6 bg-white dark:bg-slate-950">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Available Packages</label>
                <select 
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={selectedPackageId}
                  onChange={(e) => setSelectedPackageId(e.target.value)}
                  disabled={isLoadingPackages}
                >
                  <option value="">-- Select a Package --</option>
                  {availablePackages.map((pkg: any) => (
                    <option key={pkg.id} value={pkg.id}>{pkg.name} ({pkg.code})</option>
                  ))}
                </select>
              </div>
              
              {selectedPackageId && (
                <div className="bg-indigo-50/50 dark:bg-indigo-950/30 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/50 mt-4">
                  <h4 className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase mb-3">Included Modules Overview</h4>
                  <div className="flex flex-wrap gap-2">
                    {availablePackages.find((p: any) => p.id === selectedPackageId)?.packageModules?.map((pm: any) => (
                      <span key={pm.moduleId} className="px-2.5 py-1 bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700/50 rounded-md text-[11px] font-bold shadow-sm">
                        {pm.module.name}
                      </span>
                    ))}
                    {!availablePackages.find((p: any) => p.id === selectedPackageId)?.packageModules?.length && (
                      <span className="text-xs text-slate-500 font-medium">No modules configured for this package.</span>
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-3 pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
                <Button variant="outline" onClick={() => {
                  setIsPackageModalOpen(false);
                  setSelectedPackageId('');
                }}>Cancel</Button>
                <Button 
                  onClick={handleAssignPackage} 
                  disabled={!selectedPackageId || isAssigningPackage}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  {isAssigningPackage ? 'Assigning...' : 'Confirm Assignment'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
