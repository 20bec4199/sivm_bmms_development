'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { DataTable } from '@/components/ui/DataTable';
import { 
  Plus, Clock, ShieldAlert, Wrench, Calendar as CalendarIcon, CheckSquare, 
  Search, Trash2, Repeat, ArrowRight, Activity, ShieldCheck, Zap, 
  Table, Filter, Play, Pause, FileText, Cpu, Building
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store/store';
import { showWarning } from '@/store/slices/uiSlice';
import { useConfirm } from '@/providers/ConfirmProvider';
import { 
  useGetMaintenancePlansQuery, 
  useDeleteMaintenancePlanMutation,
  useGenerateWorkOrderFromPlanMutation,
  useUpdateMaintenancePlanMutation
} from '@/services/maintenancePlansApi';
import { ComplianceScore, MaintenanceStatsCard } from '@/components/maintenance/ComplianceScore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function OrganizationMaintenancePlansPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const confirm = useConfirm();
  const roles = useSelector((state: RootState) => state.auth.user?.roles || []);
  const enabledModules = useSelector((state: RootState) => (state.auth.user as any)?.organizationModules) || [];
  const hasModule = enabledModules.includes('PREVENTIVE_MAINTENANCE') || enabledModules.includes('WORK_ORDERS') || enabledModules.includes('MAINTENANCE_MANAGEMENT') || roles.includes('PLATFORM_SUPER_ADMIN');

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const { data: plansResponse, isLoading: isLoadingPlans, refetch } = useGetMaintenancePlansQuery();
  const [deletePlan] = useDeleteMaintenancePlanMutation();
  const [generateWorkOrder, { isLoading: isGenerating }] = useGenerateWorkOrderFromPlanMutation();
  const [updatePlan] = useUpdateMaintenancePlanMutation();

  const plans = Array.isArray(plansResponse) ? plansResponse : (plansResponse?.data || []);

  if (!hasModule) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <Card className="border-amber-200 bg-amber-50/80 dark:bg-amber-950/20 dark:border-amber-800 p-8 text-center rounded-2xl shadow-sm">
          <ShieldAlert className="w-16 h-16 text-amber-500 mx-auto mb-4 animate-pulse" />
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Module Not Enrolled</h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-6 text-sm leading-relaxed">
            Your organization has not enrolled in the <strong>Preventive Maintenance & Lifecycle Scheduling</strong> module. To automate recurring technician inspections, asset health checklists, and facility blackout syncing, contact your Platform Admin.
          </p>
        </Card>
      </div>
    );
  }

  const handleDeletePlan = async (id: string, planName: string) => {
    const isConfirmed = await confirm({
      title: 'Discontinue Maintenance Schedule',
      message: `Are you certain you wish to archive and discontinue the preventive maintenance schedule "${planName}"? Automated work order generation for this routine will cease immediately.`,
      confirmText: 'Discontinue Plan',
      cancelText: 'Cancel',
      destructive: true,
    });

    if (isConfirmed) {
      try {
        await deletePlan(id).unwrap();
        dispatch(showWarning({ message: 'Maintenance schedule archived and discontinued successfully.' }));
      } catch (err: any) {
        dispatch(showWarning({ message: err?.data?.message || 'Failed to remove maintenance plan.' }));
      }
    }
  };

  const handleTriggerWorkOrder = async (id: string, planTitle: string) => {
    try {
      const res = await generateWorkOrder(id).unwrap();
      if (res.isExisting) {
        dispatch(showWarning({ message: `Idempotency Protected: An active Work Order already exists for "${planTitle}" (${res.workOrder?.woNumber}).` }));
      } else {
        dispatch(showWarning({ message: `Success: Automated work order generated for "${planTitle}". Technician checklists initialized!` }));
      }
      refetch();
    } catch (err: any) {
      dispatch(showWarning({ message: err?.data?.message || 'Failed to trigger preventive work order.' }));
    }
  };

  const handleToggleStatus = async (plan: any) => {
    const newStatus = plan.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      await updatePlan({ id: plan.id, data: { status: newStatus } }).unwrap();
      dispatch(showWarning({ message: `Plan status updated to ${newStatus}.` }));
    } catch (err: any) {
      dispatch(showWarning({ message: 'Failed to update plan status.' }));
    }
  };

  // KPI calculations (Section 19)
  const activeCount = plans.filter((p: any) => p.status === 'ACTIVE').length;
  const pausedCount = plans.filter((p: any) => p.status === 'PAUSED').length;
  const dueThisWeek = plans.filter((p: any) => {
    if (!p.nextDueDate) return false;
    const diff = new Date(p.nextDueDate).getTime() - Date.now();
    return diff > 0 && diff <= 86400000 * 7;
  }).length;
  const overdueCount = plans.filter((p: any) => {
    if (!p.nextDueDate) return false;
    return new Date(p.nextDueDate).getTime() < Date.now() && p.status === 'ACTIVE';
  }).length;

  const avgCompliance = plans.length > 0
    ? Math.round(plans.reduce((sum: number, p: any) => sum + (p.complianceScore || 100), 0) / plans.length)
    : 100;

  const categories = ['ALL', ...Array.from(new Set(plans.map((p: any) => p.category || 'HVAC & Subsystems')))];

  const filteredPlans = plans.filter((item: any) => {
    const matchesSearch = item.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.planCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.locationName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === 'ALL' || item.category === categoryFilter;
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    return matchesSearch && matchesCat && matchesStatus;
  });

  const planColumns = [
    {
      header: 'Regimen & Plan Code',
      accessorKey: 'title',
      cell: (item: any) => (
        <div className="flex flex-col">
          <Link href={`/organization/maintenance-plans/${item.id}`} className="font-black text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center">
            <Wrench size={14} className="mr-1.5 text-indigo-600 dark:text-indigo-400 inline shrink-0" />
            <span>{item.title}</span>
          </Link>
          <span className="text-[11px] font-mono text-slate-400 mt-0.5">
            {item.planCode || `PMP-${item.id?.slice(0, 6)}`} • {item.maintenanceType || 'Preventive'}
          </span>
        </div>
      )
    },
    {
      header: 'Spatial Location Scope',
      accessorKey: 'locationName',
      cell: (item: any) => (
        <div className="flex flex-col max-w-xs">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
            📍 {item.locationName || 'Entire Property Architecture'}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 font-mono">
            Scope: {item.locationScope || 'PROPERTY'}
          </span>
        </div>
      )
    },
    {
      header: 'Linked Resources',
      accessorKey: 'links',
      cell: (item: any) => {
        const facCount = Array.isArray(item.facilityIds) ? item.facilityIds.length : 0;
        const assetCount = Array.isArray(item.assetIds) ? item.assetIds.length : 0;
        return (
          <div className="flex flex-wrap gap-1.5 items-center">
            {facCount > 0 ? (
              <span className="inline-flex items-center text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                <Building size={11} className="mr-1" /> {facCount} Facilit{facCount === 1 ? 'y' : 'ies'}
              </span>
            ) : null}
            {assetCount > 0 ? (
              <span className="inline-flex items-center text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                <Cpu size={11} className="mr-1" /> {assetCount} Asset{assetCount === 1 ? '' : 's'}
              </span>
            ) : (
              !facCount && <span className="text-[11px] text-slate-400 italic">No specific attachments</span>
            )}
          </div>
        );
      }
    },
    {
      header: 'Recurrence Interval',
      accessorKey: 'frequency',
      cell: (item: any) => {
        const freq = (item.frequency || 'MONTHLY').toUpperCase();
        let color = 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300';
        if (freq === 'WEEKLY' || freq === 'DAILY') color = 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950/40 dark:text-indigo-300';
        if (freq === 'ANNUALLY' || freq === 'YEARLY') color = 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300';
        
        return (
          <span className={`px-3 py-1 rounded-full text-xs font-bold border inline-flex items-center space-x-1 ${color}`}>
            <Repeat size={12} className="mr-1" />
            <span>{freq}</span>
          </span>
        );
      }
    },
    {
      header: 'Compliance Score',
      accessorKey: 'complianceScore',
      cell: (item: any) => (
        <ComplianceScore score={item.complianceScore} size="sm" />
      )
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (item: any) => {
        const st = (item.status || 'ACTIVE').toUpperCase();
        return (
          <span className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold border ${
            st === 'ACTIVE'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
          }`}>
            {st}
          </span>
        );
      }
    },
    {
      header: 'Actions',
      accessorKey: 'id',
      cell: (item: any) => (
        <div className="flex items-center space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleTriggerWorkOrder(item.id, item.title)}
            title="Generate Automated Work Order"
            className="h-8 text-[11px] font-extrabold px-2.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 flex items-center"
          >
            <Zap size={13} className="mr-1 text-indigo-600" /> Spawn WO
          </Button>
          <Link href={`/organization/maintenance-plans/${item.id}`}>
            <Button variant="outline" className="h-8 text-[11px] font-bold px-3">
              Studio
            </Button>
          </Link>
          <button
            type="button"
            onClick={() => handleToggleStatus(item)}
            title={item.status === 'ACTIVE' ? 'Pause Regimen' : 'Resume Regimen'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
          >
            {item.status === 'ACTIVE' ? <Pause size={15} /> : <Play size={15} className="text-emerald-500" />}
          </button>
          <button
            type="button"
            onClick={() => handleDeletePlan(item.id, item.title)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            <Trash2 size={15} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="Preventive Maintenance & Lifecycle Engine"
          description="Automate recurring equipment inspections, facility blackout syncing, safety compliance auditing, and technician checklists."
        />
        
        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/organization/maintenance-plans/calendar">
            <Button variant="outline" className="h-10 px-3.5 font-extrabold text-xs flex items-center space-x-1.5 bg-white dark:bg-slate-900">
              <CalendarIcon size={15} className="text-indigo-600 dark:text-indigo-400" />
              <span>Calendar View</span>
            </Button>
          </Link>
          <Link href="/organization/maintenance-plans/matrix">
            <Button variant="outline" className="h-10 px-3.5 font-extrabold text-xs flex items-center space-x-1.5 bg-white dark:bg-slate-900">
              <Table size={15} className="text-purple-600 dark:text-purple-400" />
              <span>Schedule Matrix</span>
            </Button>
          </Link>
          <Link href="/organization/maintenance-plans/create">
            <Button className="h-10 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md flex items-center space-x-2">
              <Plus size={16} />
              <span>Establish New Regimen</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Top KPI Cards (Section 19) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MaintenanceStatsCard title="Active Regimens" value={activeCount} icon={Activity} color="indigo" change="Automated Cron Polling" />
        <MaintenanceStatsCard title="Due This Week" value={dueThisWeek} icon={Clock} color="amber" change="Upcoming technician slots" />
        <MaintenanceStatsCard title="Overdue Inspections" value={overdueCount} icon={ShieldAlert} color="red" change={overdueCount === 0 ? 'Optimal zero deviation' : 'Requires escalation'} />
        <MaintenanceStatsCard title="Regimen Compliance Rate" value={`${avgCompliance}%`} icon={ShieldCheck} color="emerald" change="Across all linked assets" />
      </div>

      {/* Filters & Search Table */}
      <Card className="border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden bg-white dark:bg-slate-900">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/20">
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by plan code, regimen title, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-3 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center space-x-2.5">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-10 px-3 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
            >
              {categories.map((c, i) => (
                <option key={i} value={c as string}>{c as string === 'ALL' ? 'All Subsystem Categories' : (c as string)}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="PAUSED">Paused</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>

        <CardContent className="p-0">
          <DataTable
            data={filteredPlans}
            columns={planColumns}
            isLoading={isLoadingPlans}
            emptyMessage="No preventive maintenance regimens established yet. Click 'Establish New Regimen' to define spatial scopes and safety checklists."
          />
        </CardContent>
      </Card>
    </div>
  );
}
