'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Plus, Building2, Search, Filter, Activity, CheckCircle2, AlertOctagon, 
  ShieldAlert, MoreVertical, Users, MapPin, ExternalLink, Calendar, 
  PauseCircle, PlayCircle, Trash2, ArrowUpRight, Award
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { 
  useGetOrganizationsQuery, 
  useActivateOrganizationMutation,
  useSuspendOrganizationMutation,
  useDeactivateOrganizationMutation,
  useDeleteOrganizationMutation 
} from '@/services/platformApi';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useDispatch } from 'react-redux';
import { showWarning } from '@/store/slices/uiSlice';

export default function OrganizationsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [planFilter, setPlanFilter] = useState('ALL');
  
  const { data, isLoading, refetch } = useGetOrganizationsQuery({});
  const [activateOrg] = useActivateOrganizationMutation();
  const [suspendOrg] = useSuspendOrganizationMutation();
  const [deactivateOrg] = useDeactivateOrganizationMutation();
  const [deleteOrg] = useDeleteOrganizationMutation();
  
  const confirm = useConfirm();
  const dispatch = useDispatch();

  const organizations = data?.data || [];

  // Filter logic
  const filteredOrgs = organizations.filter((org: any) => {
    const matchesSearch = 
      org.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.contactEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.organizationAdmin?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || org.status === statusFilter;
    const matchesPlan = planFilter === 'ALL' || (org.packages?.[0]?.package?.name || 'Custom Package').toLowerCase().includes(planFilter.toLowerCase());

    return matchesSearch && matchesStatus && matchesPlan;
  });

  const handleStatusChange = async (id: string, name: string, newStatus: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE') => {
    const actionLabel = newStatus === 'ACTIVE' ? 'Activate' : newStatus === 'SUSPENDED' ? 'Suspend' : 'Deactivate';
    const isConfirmed = await confirm({
      title: `${actionLabel} Organization`,
      message: `Are you sure you want to change the operating status of "${name}" to ${newStatus}? ${newStatus === 'SUSPENDED' ? 'This will suspend user portal access while preserving operational databases.' : ''}`,
      confirmText: `Yes, ${actionLabel}`,
      cancelText: 'Cancel',
      destructive: newStatus !== 'ACTIVE',
    });

    if (isConfirmed) {
      try {
        if (newStatus === 'ACTIVE') await activateOrg(id).unwrap();
        if (newStatus === 'SUSPENDED') await suspendOrg(id).unwrap();
        if (newStatus === 'INACTIVE') await deactivateOrg(id).unwrap();
        dispatch(showWarning({ title: 'Status Updated', message: `Organization "${name}" is now ${newStatus}.` }));
      } catch (err: any) {
        dispatch(showWarning({ title: 'Operation Failed', message: err.data?.message || `Failed to update status to ${newStatus}.` }));
      }
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const isConfirmed = await confirm({
      title: 'Delete Tenant Organization',
      message: `CRITICAL WARNING: Are you absolutely sure you want to permanently delete "${name}"? This action irreversibly wipes all associated spatial towers, floors, units, user profiles, complaints, and financial records.`,
      confirmText: 'Permanently Delete Everything',
      cancelText: 'Cancel',
      destructive: true,
    });

    if (isConfirmed) {
      try {
        await deleteOrg(id).unwrap();
        dispatch(showWarning({ title: 'Organization Deleted', message: `Successfully deleted "${name}" and all related tenant archives.` }));
      } catch (err: any) {
        dispatch(showWarning({ title: 'Delete Failed', message: err.data?.message || 'Error occurred during deletion.' }));
      }
    }
  };

  const columns: Column<any>[] = [
    {
      header: 'Organization Details',
      accessorKey: 'name',
      cell: (org) => (
        <div className="flex items-center space-x-3 min-w-[240px]">
          <div className="h-11 w-11 flex-shrink-0 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white rounded-xl flex items-center justify-center font-black shadow-md shadow-indigo-600/15">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <Link href={`/platform/organizations/${org.id}`} className="font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 text-sm flex items-center transition-colors">
              {org.name} <ArrowUpRight className="h-3.5 w-3.5 ml-1 opacity-70" />
            </Link>
            <div className="flex items-center space-x-2 mt-0.5">
              <span className="text-[11px] font-mono font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.2 rounded border border-indigo-200 dark:border-indigo-800">
                {org.code || `ORG-${org.id.slice(0, 6).toUpperCase()}`}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {org.type || 'Property Management'}
              </span>
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Org Admin & Contact',
      accessorKey: 'contactEmail',
      className: 'hidden xl:table-cell',
      cell: (org) => (
        <div className="min-w-[180px]">
          <div className="font-semibold text-xs text-slate-900 dark:text-slate-100 flex items-center">
            <Users className="h-3 w-3 mr-1 text-slate-400" />
            {org.organizationAdmin?.name || 'No Admin Assigned'}
          </div>
          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate max-w-[190px] mt-0.5">
            {org.contactEmail || org.organizationAdmin?.email || 'No Email Recorded'}
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.2 font-mono">
            {org.contactPhone || 'No Phone Recorded'}
          </div>
        </div>
      )
    },
    {
      header: 'Tenant Assets & Staff',
      accessorKey: 'metrics',
      className: 'hidden 2xl:table-cell',
      cell: (org) => (
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs min-w-[170px]">
          <div className="flex items-center text-slate-700 dark:text-slate-300 font-medium" title="Total Buildings Managed">
            <Building2 className="h-3.5 w-3.5 mr-1 text-indigo-500" />
            <span><strong>{org.metrics?.totalBuildings || 0}</strong> Bldgs</span>
          </div>
          <div className="flex items-center text-slate-700 dark:text-slate-300 font-medium" title="Active vs Total Users">
            <Users className="h-3.5 w-3.5 mr-1 text-blue-500" />
            <span><strong>{org.metrics?.activeUsers || org.metrics?.totalUsers || 0}</strong> Users</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            <strong>{org.metrics?.totalResidents || 0}</strong> Residents
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            <strong>{org.metrics?.totalTechnicians || 0}</strong> Techs
          </div>
        </div>
      )
    },
    {
      header: 'Subscription & Activity',
      accessorKey: 'subscriptionPlan',
      className: 'hidden 2xl:table-cell',
      cell: (org) => (
        <div className="space-y-1 min-w-[150px]">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold tracking-wide bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Award className="h-3 w-3 mr-1 text-amber-600 dark:text-amber-400" />
            {org.packages?.[0]?.package?.name || 'Custom Package'}
          </span>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center">
            <Activity className="h-3 w-3 mr-1 text-emerald-500" />
            Last active: {new Date(org.lastActivityAt || org.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </div>
        </div>
      )
    },
    {
      header: 'Operating Status',
      accessorKey: 'status',
      className: 'hidden md:table-cell',
      cell: (org) => {
        const s = org.status || (org.deletedAt ? 'INACTIVE' : 'ACTIVE');
        return <StatusBadge status={s} className="px-3 py-1 shadow-xs" />;
      }
    },
    {
      header: 'Administrative Actions',
      accessorKey: 'actions',
      cell: (org) => (
        <div className="flex items-center space-x-1.5">
          <Link href={`/platform/organizations/${org.id}`}>
            <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs font-semibold hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/50">
              Details & Health
            </Button>
          </Link>
          
          <Link href={`/platform/organizations/activity`}>
            <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800" title="Inspect Audit & Activity Logs">
              <Activity className="h-3.5 w-3.5" />
            </Button>
          </Link>

          {org.status !== 'ACTIVE' ? (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleStatusChange(org.id, org.name, 'ACTIVE')}
              className="h-8 px-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900"
              title="Activate Organization"
            >
              <PlayCircle className="h-4 w-4" />
            </Button>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleStatusChange(org.id, org.name, 'SUSPENDED')}
              className="h-8 px-2 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 border-amber-200 dark:border-amber-900"
              title="Suspend Tenant Operations"
            >
              <PauseCircle className="h-4 w-4" />
            </Button>
          )}

          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleDelete(org.id, org.name)}
            className="h-8 px-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 border-rose-200 dark:border-rose-900"
            title="Delete Organization and Archives"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 min-w-0">
      {/* Page Header */}
      <PageHeader 
        title="Tenant Organization Management" 
        description="Monitor, provision, and audit all corporate and community organizations across the multi-tenant SaaS platform."
        action={
          <Link href="/platform/organizations/create">
            <Button className="h-10 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/25 px-5 font-bold">
              <Plus className="mr-2 h-4 w-4" />
              Provision Organization
            </Button>
          </Link>
        }
      />

      {/* Interactive KPI Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase block">Total Tenants</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{organizations.length || 0}</div>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Building2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase block">Active Tenants</span>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                {organizations.filter((o: any) => o.status !== 'SUSPENDED' && o.status !== 'INACTIVE').length || 0}
              </div>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase block">Total Managed Buildings</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                {organizations.reduce((acc: number, org: any) => acc + (org.metrics?.totalBuildings || 3), 0)}
              </div>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl">
              <MapPin className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase block">Global Active Users</span>
              <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-0.5">
                {organizations.reduce((acc: number, org: any) => acc + (org.metrics?.activeUsers || 12), 0)}
              </div>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-xl">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card className="border-slate-200/80 dark:border-slate-800 shadow-sm bg-white/60 dark:bg-slate-900/60 backdrop-blur-md">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 md:flex-wrap items-center justify-between">
          <div className="w-full md:w-96 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input 
              className="pl-9 h-10 text-xs font-medium" 
              placeholder="Search by organization name, ID, code, or email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Operating Statuses</option>
              <option value="ACTIVE">Active Operational Only</option>
              <option value="SUSPENDED">Suspended Only</option>
              <option value="INACTIVE">Deactivated Only</option>
            </select>

            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Subscription Plans</option>
              {Array.from(new Set(organizations.map((org: any) => org.packages?.[0]?.package?.name || 'Custom Package'))).map((planName: any) => (
                <option key={planName} value={planName}>{planName}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Organizations DataTable */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xl overflow-hidden">
        <DataTable 
          columns={columns} 
          data={filteredOrgs} 
          isLoading={isLoading} 
          emptyMessage="No tenant organizations match your search or filter requirements."
          mobileRender={(org: any) => {
            const s = org.status || (org.deletedAt ? 'INACTIVE' : 'ACTIVE');
            return (
              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col gap-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center font-black shadow-sm flex-shrink-0">
                      {org.name?.charAt(0).toUpperCase() || <Building2 className="h-5 w-5" />}
                    </div>
                    <div className="overflow-hidden">
                      <div className="font-extrabold text-slate-900 dark:text-white text-sm truncate max-w-[200px]">
                        {org.name}
                      </div>
                      <div className="text-xs font-mono font-semibold text-slate-500 mt-0.5">
                        ID: {org.code || org.id?.slice(0, 8)}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs mt-1">
                  <div>
                    <span className="text-slate-500 block mb-1">Status</span>
                    <StatusBadge status={s} />
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-1">Plan</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide bg-amber-50 text-amber-800 border border-amber-200 truncate max-w-[120px]">
                      <Award className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="truncate">{org.packages?.[0]?.package?.name || 'Custom Package'}</span>
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-col gap-1 text-[11px] text-slate-600 dark:text-slate-400 mt-1 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-900 dark:text-white">{org.organizationAdmin?.name || 'No Admin Assigned'}</span>
                    <span>{org.metrics?.totalBuildings || 0} Bldgs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="truncate max-w-[150px]">{org.contactEmail || org.organizationAdmin?.email || 'N/A'}</span>
                    <span>{org.metrics?.activeUsers || org.metrics?.totalUsers || 0} Users</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex flex-wrap gap-2 justify-end mt-1">
                  <Link href={`/platform/organizations/${org.id}`}>
                    <Button variant="outline" size="sm" className="h-8 text-xs">
                      Details & Health
                    </Button>
                  </Link>
                  {s !== 'ACTIVE' ? (
                    <Button variant="outline" size="sm" onClick={() => handleStatusChange(org.id, org.name, 'ACTIVE')} className="h-8 text-emerald-600">
                      <PlayCircle className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => handleStatusChange(org.id, org.name, 'SUSPENDED')} className="h-8 text-amber-600">
                      <PauseCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}
