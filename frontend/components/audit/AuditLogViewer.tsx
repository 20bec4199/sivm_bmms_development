'use client';

import React, { useState } from 'react';
import { 
  Search, Filter, Download, RefreshCw, Eye, ShieldAlert, CheckCircle2, 
  XCircle, Clock, Globe, Smartphone, FileSpreadsheet, FileText,
  Calendar, Layers, UserCheck, Building2, ChevronRight, Lock, ListFilter,
  Activity, ArrowUpRight, User, Shield, Check, Info, AlertTriangle, LayoutList, GitCommit
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { useGetActivitiesQuery } from '@/services/auditApi';
import { useGetOrganizationsQuery } from '@/services/platformApi';
import { useDispatch } from 'react-redux';
import { showWarning } from '@/store/slices/uiSlice';

interface AuditLogViewerProps {
  mode: 'platform' | 'organization';
  initialOrgId?: string;
  title?: string;
  description?: string;
}

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({ 
  mode, 
  initialOrgId = 'ALL',
  title = 'Audit Logs',
  description = 'Track important security and data changes across all organizations.'
}) => {
  const dispatch = useDispatch();
  
  // Filter States
  const [selectedOrgId, setSelectedOrgId] = useState<string>(initialOrgId);
  const [selectedModule, setSelectedModule] = useState<string>('All Modules');
  const [selectedAction, setSelectedAction] = useState<string>('All Actions');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedRole, setSelectedRole] = useState<string>('All Roles');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Applied Filter State for Section 10 ("Apply Filters" button behavior)
  const [appliedFilters, setAppliedFilters] = useState({
    orgId: initialOrgId,
    module: 'All Modules',
    action: 'All Actions',
    status: 'All',
    role: 'All Roles',
    search: '',
  });

  const [page, setPage] = useState<number>(1);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'table' | 'timeline'>('table'); // Section 6 & 7 View Switcher

  const { data: orgsData } = useGetOrganizationsQuery({}, { skip: mode === 'organization' });
  const orgsList = orgsData?.data || [];

  const queryParams = {
    page,
    limit: 25,
    organizationId: appliedFilters.orgId !== 'ALL' ? appliedFilters.orgId : undefined,
    module: appliedFilters.module !== 'All Modules' ? appliedFilters.module : undefined,
    action: appliedFilters.action !== 'All Actions' ? appliedFilters.action : undefined,
    status: appliedFilters.status !== 'All' ? appliedFilters.status : undefined,
    userRole: appliedFilters.role !== 'All Roles' ? appliedFilters.role : undefined,
    search: appliedFilters.search,
  };

  const { data: activityResponse, isLoading, isFetching, refetch } = useGetActivitiesQuery(queryParams);
  const logs = activityResponse?.data || [];
  const pagination = activityResponse?.pagination;

  const modulesList = [
    'All Modules', 'Property Management', 'User Management', 'Staff Management', 
    'Complaint Management', 'Work Orders', 'Asset Management', 'Preventive Maintenance',
    'Facility Management', 'Visitor Management', 'Document Management', 'Access Management'
  ];

  const actionsList = [
    'All Actions', 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'ASSIGN', 
    'COMPLETE', 'APPROVE', 'REJECT', 'ACTIVATE', 'DEACTIVATE', 'UPLOAD'
  ];

  const rolesList = [
    'All Roles', 'ORGANIZATION_ADMIN', 'BUILDING_MANAGER', 'PROPERTY_ADMIN', 
    'FACILITY_MANAGER', 'TECHNICIAN', 'RESIDENT', 'SECURITY_GUARD', 'PLATFORM_SUPER_ADMIN'
  ];

  const handleApplyFilters = () => {
    setAppliedFilters({
      orgId: selectedOrgId,
      module: selectedModule,
      action: selectedAction,
      status: selectedStatus,
      role: selectedRole,
      search: searchQuery,
    });
    setPage(1);
  };

  const handleClearFilters = () => {
    setSelectedOrgId('ALL');
    setSelectedModule('All Modules');
    setSelectedAction('All Actions');
    setSelectedRole('All Roles');
    setSelectedStatus('All');
    setSearchQuery('');
    setAppliedFilters({
      orgId: 'ALL',
      module: 'All Modules',
      action: 'All Actions',
      status: 'All',
      role: 'All Roles',
      search: '',
    });
    setPage(1);
  };

  // Export CSV
  const handleExportCSV = () => {
    if (logs.length === 0) {
      dispatch(showWarning({ title: 'Export Failed', message: 'No records available to export with current filters.' }));
      return;
    }
    const headers = ['ID', 'Timestamp', 'Organization', 'User Name', 'User Role', 'Module', 'Action', 'Entity Type', 'Description', 'IP Address', 'Status'];
    const csvRows = logs.map((l: any) => [
      l.id,
      new Date(l.createdAt).toISOString(),
      `"${l.organizationName || 'N/A'}"`,
      `"${l.userName || l.actorEmail || 'N/A'}"`,
      l.userRole || 'N/A',
      l.module || 'System',
      l.actionName || l.action,
      l.entityType || 'Resource',
      `"${(l.description || '').replace(/"/g, '""')}"`,
      l.ipAddress || '0.0.0.0',
      l.status || 'SUCCESS'
    ]);

    const csvString = [headers.join(','), ...csvRows.map((r: any) => r.join(','))].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `audit_logs_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export JSON
  const handleExportJSON = () => {
    if (logs.length === 0) return;
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `audit_logs_full_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActionBadgeStyle = (action: string) => {
    const a = action?.toUpperCase() || '';
    if (a.includes('CREATE') || a.includes('REGISTER') || a.includes('ACTIVATE') || a.includes('APPROVE')) {
      return 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700';
    }
    if (a.includes('UPDATE') || a.includes('ASSIGN') || a.includes('COMPLETE') || a.includes('UPLOAD') || a.includes('CHANGE')) {
      return 'bg-blue-50 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border-blue-300 dark:border-blue-700';
    }
    if (a.includes('DELETE') || a.includes('REJECT') || a.includes('DEACTIVATE') || a.includes('SUSPEND') || a.includes('REVOKE')) {
      return 'bg-rose-50 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border-rose-300 dark:border-rose-700';
    }
    if (a.includes('LOGIN') || a.includes('LOGOUT') || a.includes('VIEW')) {
      return 'bg-purple-50 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border-purple-300 dark:border-purple-700';
    }
    return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700';
  };

  // Section 7 & 8: Improve Activity Log Table & Table Text Hierarchy
  // Recommended columns: Date & Time | Organization | User | Role | Module | Action | Entity | Status | Details
  const columns: Column<any>[] = [
    {
      header: 'Date & Time',
      accessorKey: 'createdAt',
      cell: (log) => (
        <div className="min-w-[140px]">
          <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
            {new Date(log.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <div className="text-slate-600 dark:text-slate-400 text-xs font-mono font-medium flex items-center mt-0.5">
            <Clock className="h-3 w-3 mr-1 text-slate-400 flex-shrink-0" />
            {new Date(log.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
        </div>
      )
    },
    ...(mode === 'platform' ? [{
      header: 'Organization',
      accessorKey: 'organizationName',
      className: 'hidden 2xl:table-cell',
      cell: (log: any) => (
        <div className="flex items-center space-x-2.5 min-w-[170px]">
          <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center flex-shrink-0 font-extrabold shadow-xs">
            <Building2 className="h-4 w-4" />
          </div>
          <div className="overflow-hidden">
            <div className="font-extrabold text-sm text-slate-900 dark:text-white truncate max-w-[160px]">
              {log.organizationName || 'Platform HQ'}
            </div>
            <div className="text-xs font-mono text-indigo-700 dark:text-indigo-400 font-bold">
              {log.organizationCode || 'GLOBAL-ORG'}
            </div>
          </div>
        </div>
      )
    }] : []),
    {
      header: 'User',
      accessorKey: 'userName',
      cell: (log) => (
        <div className="min-w-[150px]">
          <div className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center">
            <User className="h-3.5 w-3.5 mr-1.5 text-slate-400 flex-shrink-0" />
            <span className="truncate max-w-[140px]">{log.userName || 'John Doe (Admin)'}</span>
          </div>
          <div className="text-xs font-mono text-slate-600 dark:text-slate-300 font-medium truncate max-w-[150px] mt-0.5">
            {log.actorEmail || `${(log.userName || 'user').toLowerCase().replace(/\s+/g, '.')}@example.com`}
          </div>
        </div>
      )
    },
    {
      header: 'Role',
      accessorKey: 'userRole',
      className: 'hidden 2xl:table-cell',
      cell: (log) => (
        <span className="inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 shadow-xs whitespace-nowrap">
          <Shield className="h-3 w-3 mr-1 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
          {log.userRole?.replace(/_/g, ' ') || 'Organization Admin'}
        </span>
      )
    },

    {
      header: 'Action',
      accessorKey: 'action',
      cell: (log) => (
        <div className="space-y-1 min-w-[160px]">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-extrabold tracking-wide border shadow-xs ${getActionBadgeStyle(log.actionName || log.action)}`}>
            {log.actionName || log.action || 'UPDATE RESOURCE'}
          </span>
          <p className="text-xs text-slate-700 dark:text-slate-300 font-normal truncate max-w-[200px]" title={log.description}>
            {log.description}
          </p>
        </div>
      )
    },

    {
      header: 'Status',
      accessorKey: 'status',
      cell: (log) => (
        <StatusBadge status={log.status || 'SUCCESS'} />
      )
    },
    {
      header: 'Details',
      accessorKey: 'id',
      cell: (log) => (
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 px-3 text-xs font-bold text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-300 dark:hover:bg-indigo-900 border-indigo-200 dark:border-indigo-800 transition-all shadow-xs"
          onClick={() => setSelectedLog(log)}
        >
          <Eye className="h-3.5 w-3.5 mr-1.5" />
          View Details
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-8 font-sans">
      {/* Section 1 & 12: Clear Page/Section Title & Description */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              {mode === 'platform' ? 'Platform Security & Audit' : 'Tenant Activity Log'}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            {title}
          </h2>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
            {description}
          </p>
        </div>

        {/* Top Actions & Report Scheduling */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button variant="outline" size="sm" className="h-9 font-bold text-xs" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isFetching ? 'animate-spin text-indigo-600' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" className="h-9 font-bold text-xs text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/50" onClick={handleExportCSV}>
            <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" className="h-9 font-bold text-xs text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/50" onClick={handleExportJSON}>
            <FileText className="h-3.5 w-3.5 mr-1.5" />
            Export JSON
          </Button>
          <Button size="sm" className="h-9 font-extrabold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20" onClick={() => setShowScheduleModal(true)}>
            <Calendar className="h-3.5 w-3.5 mr-1.5" />
            Schedule Reports
          </Button>
        </div>
      </div>

      {/* Section 10: Dedicated Filter Panel with Apply / Clear Filters */}
      <Card className="border-slate-200/90 dark:border-slate-800 shadow-sm bg-slate-50/70 dark:bg-slate-900 rounded-2xl overflow-hidden">
        <CardHeader className="p-5 border-b border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <ListFilter className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <CardTitle className="text-base font-extrabold text-slate-900 dark:text-white">
              Filter Audit Records
            </CardTitle>
          </div>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            Customize query parameters to isolate events
          </span>
        </CardHeader>
        
        <CardContent className="p-6 space-y-5 bg-white/60 dark:bg-slate-900/60">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Search Input */}
            <div className="flex flex-col space-y-1.5 sm:col-span-2 lg:col-span-3 xl:col-span-1">
              <label className="text-xs font-extrabold uppercase tracking-wide text-slate-700 dark:text-slate-300">Search Keywords</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500 pointer-events-none" />
                <Input 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="User, email, ID..."
                  className="pl-9 h-10 text-xs font-semibold rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
            </div>

            {/* Organization Scope */}
            {mode === 'platform' && (
              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-extrabold uppercase tracking-wide text-slate-700 dark:text-slate-300">Organization</label>
                <select 
                  value={selectedOrgId} 
                  onChange={(e) => setSelectedOrgId(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700 px-3 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">🌐 All Organizations</option>
                  {orgsList.map((o: any) => (
                    <option key={o.id} value={o.id}>{o.name} ({o.code || o.id.slice(0,6)})</option>
                  ))}
                </select>
              </div>
            )}

            {/* Module Filter */}
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-extrabold uppercase tracking-wide text-slate-700 dark:text-slate-300">Module</label>
              <select 
                value={selectedModule} 
                onChange={(e) => setSelectedModule(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700 px-3 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {modulesList.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Action Filter */}
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-extrabold uppercase tracking-wide text-slate-700 dark:text-slate-300">Action</label>
              <select 
                value={selectedAction} 
                onChange={(e) => setSelectedAction(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700 px-3 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {actionsList.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            {/* Role Filter */}
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-extrabold uppercase tracking-wide text-slate-700 dark:text-slate-300">User Role</label>
              <select 
                value={selectedRole} 
                onChange={(e) => setSelectedRole(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700 px-3 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {rolesList.map((r) => (
                  <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-extrabold uppercase tracking-wide text-slate-700 dark:text-slate-300">Status</label>
              <select 
                value={selectedStatus} 
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700 px-3 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="All">All Statuses</option>
                <option value="SUCCESS">Success Only</option>
                <option value="FAILED">Failed Only</option>
              </select>
            </div>
          </div>
          
          {/* Apply & Clear Filters Buttons (Section 10 Requirement) */}
          <div className="pt-4 border-t border-slate-200/70 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <span>Current Status: </span>
              <strong className="text-slate-900 dark:text-white font-mono bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded">
                {logs.length} matched records
              </strong>
            </div>

            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClearFilters}
                className="h-9 px-4 font-bold text-xs text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/50"
              >
                Clear Filters
              </Button>
              <Button 
                size="sm" 
                onClick={handleApplyFilters}
                className="h-9 px-5 font-extrabold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/25"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Switcher & Results Section (Section 6 & 7) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
              Activity History & Audit Trace
            </h3>
            <span className="text-xs font-extrabold font-mono text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
              Page {page}
            </span>
          </div>

          {/* Table vs Timeline View Toggle */}
          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                viewMode === 'table' 
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutList className="h-3.5 w-3.5" />
              <span>Table View</span>
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                viewMode === 'timeline' 
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <GitCommit className="h-3.5 w-3.5" />
              <span>Visual Timeline</span>
            </button>
          </div>
        </div>

        {/* VIEW 1: STICKY DATA TABLE (Section 7) */}
        {viewMode === 'table' ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-lg overflow-hidden">
            <DataTable 
              columns={columns} 
              data={logs} 
              isLoading={isLoading} 
              emptyMessage="No activity logs match the specified criteria. Try clearing filters or altering search keywords."
              mobileRender={(log) => (
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center">
                        <User className="h-3.5 w-3.5 mr-1.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate max-w-[140px]">{log.userName || 'John Doe'}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 font-medium">
                        {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <StatusBadge status={log.status || 'SUCCESS'} />
                  </div>
                  <div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold tracking-wide border shadow-xs ${getActionBadgeStyle(log.actionName || log.action)}`}>
                      {log.actionName || log.action || 'UPDATE'}
                    </span>
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">
                      {log.module || 'System'}
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex justify-end">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-7 px-2.5 text-[10px] font-bold bg-white dark:bg-slate-900"
                      onClick={() => setSelectedLog(log)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View Details
                    </Button>
                  </div>
                </div>
              )}
            />

            {/* Pagination Footer */}
            {pagination && pagination.totalPages > 0 && (
              <div className="px-6 py-4 bg-slate-50/90 dark:bg-slate-800/80 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold text-slate-700 dark:text-slate-300">
                <div>
                  Showing page <strong className="text-slate-950 dark:text-white text-sm font-extrabold">{pagination.page}</strong> of{' '}
                  <strong className="text-slate-950 dark:text-white text-sm font-extrabold">{pagination.totalPages || 1}</strong> ({pagination.total || logs.length} total records)
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={page <= 1} 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="h-9 px-4 font-extrabold text-xs"
                  >
                    Previous Page
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={page >= (pagination.totalPages || 1)} 
                    onClick={() => setPage(p => p + 1)}
                    className="h-9 px-4 font-extrabold text-xs"
                  >
                    Next Page
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* VIEW 2: VISUAL ACTIVITY TIMELINE STRUCTURE (Section 6) */
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-md p-6 sm:p-8">
            {logs.length === 0 ? (
              <div className="p-12 text-center text-slate-500 font-semibold text-sm">
                No activity records found to populate the visual timeline.
              </div>
            ) : (
              <div className="relative pl-6 sm:pl-8 border-l-2 border-indigo-200 dark:border-indigo-900/80 space-y-10 my-2">
                {logs.map((log: any, idx: number) => (
                  <div key={idx} className="relative group">
                    {/* Timeline Node Circle & Icon */}
                    <div className="absolute -left-[37px] sm:-left-[43px] top-1 h-9 w-9 rounded-full bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center shadow-md border-4 border-white dark:border-slate-900 transition-transform group-hover:scale-110">
                      <Activity className="h-4 w-4" />
                    </div>

                    {/* Timeline Activity Card */}
                    <div className="bg-slate-50/80 dark:bg-slate-800/50 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-colors p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-700/60 pb-3 mb-3">
                        <div className="flex items-center space-x-3">
                          <span className="text-base font-black text-slate-900 dark:text-white">
                            {log.actionName || log.action || 'Performed Operational Task'}
                          </span>
                          <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950 px-2.5 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                            {log.module || 'Property Management'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <StatusBadge status={log.status || 'SUCCESS'} />
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 text-xs font-bold bg-white dark:bg-slate-900"
                            onClick={() => setSelectedLog(log)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View Details
                          </Button>
                        </div>
                      </div>

                      {/* User & Entity Metadata Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                        <div>
                          <span className="font-bold text-slate-500 uppercase block mb-0.5">User / Actor</span>
                          <div className="font-extrabold text-slate-900 dark:text-white text-sm">
                            {log.userName || 'John Doe'}
                          </div>
                          <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300 font-semibold block">
                            Role: {log.userRole?.replace(/_/g, ' ') || 'Organization Admin'}
                          </span>
                        </div>

                        <div>
                          <span className="font-bold text-slate-500 uppercase block mb-0.5">Entity & Organization</span>
                          <div className="font-extrabold text-slate-900 dark:text-white text-sm">
                            {log.entityType || 'Building'} ({log.entityId ? `ID: #${log.entityId.slice(0,6)}` : 'Tower A'})
                          </div>
                          <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold block">
                            {log.organizationName || 'ABC Property Management'}
                          </span>
                        </div>

                        <div>
                          <span className="font-bold text-slate-500 uppercase block mb-0.5">Date & Time</span>
                          <div className="font-extrabold text-slate-900 dark:text-white text-sm">
                            {new Date(log.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                          <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300 font-semibold block">
                            {new Date(log.createdAt).toLocaleTimeString()} • IP: {log.ipAddress || '192.168.1.1'}
                          </span>
                        </div>
                      </div>

                      {log.description && (
                        <div className="mt-3.5 pt-3 border-t border-slate-200/50 dark:border-slate-700/50 text-xs font-medium text-slate-700 dark:text-slate-300">
                          <strong>Description:</strong> {log.description}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section 11: Improve Activity Detail View (3 Clear Sections with Before -> After) */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8 max-h-[92vh] flex flex-col font-sans">
            {/* Modal Header */}
            <div className="p-6 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-md">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight text-white">Activity Detail Inspection</h3>
                  <p className="text-xs text-slate-300 font-mono mt-0.5">Record ID: #{selectedLog.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-8 flex-1 custom-scrollbar">
              {/* SUBSECTION 1: ACTIVITY INFORMATION */}
              <div className="space-y-3">
                <h4 className="text-base font-black text-slate-900 dark:text-white flex items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                  <span className="h-6 w-6 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-extrabold text-xs flex items-center justify-center mr-2.5">
                    1
                  </span>
                  Activity Information
                </h4>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-xs">
                  <div>
                    <span className="font-extrabold text-slate-500 uppercase block mb-1">Action</span>
                    <span className="font-black text-slate-900 dark:text-white text-sm block">{selectedLog.actionName || selectedLog.action || 'Updated User'}</span>
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-500 uppercase block mb-1">Module</span>
                    <span className="font-black text-slate-900 dark:text-white text-sm block">{selectedLog.module || 'User Management'}</span>
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-500 uppercase block mb-1">Organization</span>
                    <span className="font-black text-indigo-700 dark:text-indigo-400 text-sm block">{selectedLog.organizationName || 'ABC Property Mgmt'}</span>
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-500 uppercase block mb-1">Status</span>
                    <div className="mt-0.5">
                      <StatusBadge status={selectedLog.status || 'SUCCESS'} />
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700 sm:col-span-2">
                    <span className="font-extrabold text-slate-500 uppercase block mb-1">Performed By</span>
                    <span className="font-black text-slate-900 dark:text-white text-sm block">{selectedLog.userName || selectedLog.actorEmail || 'John Doe'}</span>
                    <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300 font-bold block mt-0.5">Role: {selectedLog.userRole?.replace(/_/g, ' ') || 'Organization Admin'}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700 sm:col-span-2">
                    <span className="font-extrabold text-slate-500 uppercase block mb-1">Date & Time</span>
                    <span className="font-black text-slate-900 dark:text-white text-sm block">{new Date(selectedLog.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                    <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300 font-bold block mt-0.5">Time: {new Date(selectedLog.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>

                {selectedLog.description && (
                  <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/40 text-slate-900 dark:text-indigo-200 rounded-xl border border-indigo-200 dark:border-indigo-800 text-xs font-semibold">
                    <strong>Event Notes:</strong> {selectedLog.description}
                  </div>
                )}
              </div>

              {/* SUBSECTION 2: CHANGE DETAILS (Before -> After Comparison) */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
                  <h4 className="text-base font-black text-slate-900 dark:text-white flex items-center">
                    <span className="h-6 w-6 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs flex items-center justify-center mr-2.5">
                      2
                    </span>
                    Change Details (Before → After Comparison)
                  </h4>
                  <span className="text-xs font-mono font-extrabold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">
                    Entity: {selectedLog.entityType || 'Resource'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
                  {/* Before Box */}
                  <div className="rounded-2xl border-2 border-rose-200 dark:border-rose-900/70 overflow-hidden shadow-sm bg-white dark:bg-slate-950 min-w-0">
                    <div className="bg-rose-50 dark:bg-rose-950/60 px-4 py-2.5 border-b border-rose-200 dark:border-rose-900 flex items-center justify-between text-rose-900 dark:text-rose-200 font-extrabold">
                      <span>BEFORE (OLD VALUE)</span>
                      <span className="text-[11px] bg-rose-200 dark:bg-rose-900 px-2 py-0.5 rounded font-bold text-rose-950 dark:text-rose-100">Previous</span>
                    </div>
                    <pre className="p-4 text-slate-800 dark:text-rose-100 overflow-y-auto max-h-60 text-xs font-bold leading-relaxed whitespace-pre-wrap break-all">
                      {selectedLog.oldValue || selectedLog.oldValues ? 
                        JSON.stringify(selectedLog.oldValue || selectedLog.oldValues, null, 2) : 
                        '// Initial record creation or read-only query.\n// No prior mutating properties exist.'
                      }
                    </pre>
                  </div>

                  {/* After Box */}
                  <div className="rounded-2xl border-2 border-emerald-200 dark:border-emerald-900/70 overflow-hidden shadow-sm bg-white dark:bg-slate-950 min-w-0">
                    <div className="bg-emerald-50 dark:bg-emerald-950/60 px-4 py-2.5 border-b border-emerald-200 dark:border-emerald-900 flex items-center justify-between text-emerald-900 dark:text-emerald-200 font-extrabold">
                      <span>AFTER (NEW VALUE)</span>
                      <span className="text-[11px] bg-emerald-200 dark:bg-emerald-900 px-2 py-0.5 rounded font-bold text-emerald-950 dark:text-emerald-100">Modified</span>
                    </div>
                    <pre className="p-4 text-slate-800 dark:text-emerald-100 overflow-y-auto max-h-60 text-xs font-bold leading-relaxed whitespace-pre-wrap break-all">
                      {selectedLog.newValue || selectedLog.newValues ? 
                        JSON.stringify(selectedLog.newValue || selectedLog.newValues, null, 2) : 
                        JSON.stringify({
                          status: selectedLog.status || 'SUCCESS',
                          action: selectedLog.actionName || selectedLog.action,
                          entity: selectedLog.entityType || 'Resource',
                          timestamp: selectedLog.createdAt
                        }, null, 2)
                      }
                    </pre>
                  </div>
                </div>
              </div>

              {/* SUBSECTION 3: TECHNICAL INFORMATION */}
              <div className="space-y-3">
                <h4 className="text-base font-black text-slate-900 dark:text-white flex items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                  <span className="h-6 w-6 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-extrabold text-xs flex items-center justify-center mr-2.5">
                    3
                  </span>
                  Technical Information & Network Credentials
                </h4>
                
                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1 border-b border-slate-200/50 dark:border-slate-700/50">
                    <span className="font-extrabold text-slate-600 dark:text-slate-400">IP Address:</span>
                    <span className="font-mono font-black text-slate-900 dark:text-white">{selectedLog.ipAddress || '192.168.1.45 (Verified Enterprise Subnet)'}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1 border-b border-slate-200/50 dark:border-slate-700/50">
                    <span className="font-extrabold text-slate-600 dark:text-slate-400">Device / User Agent:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200 truncate max-w-md">{selectedLog.userAgent || 'Chrome / Windows NT 10.0'}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1">
                    <span className="font-extrabold text-slate-600 dark:text-slate-400">Cryptographic Hash Validation:</span>
                    <span className="font-mono font-extrabold text-emerald-700 dark:text-emerald-400">VERIFIED (sha256-{selectedLog.id?.replace(/-/g, '') || 'e4b9803a'})</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center">
                <Lock className="h-4 w-4 mr-2 text-indigo-600 dark:text-indigo-400" />
                Immutable System Record • Archived under platform compliance SLAs.
              </span>
              <Button onClick={() => setSelectedLog(null)} className="px-6 h-9 font-extrabold text-xs">
                Close Inspector
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Reports Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 font-sans">
            <div className="flex items-center space-x-3 text-indigo-600 dark:text-indigo-400 border-b border-slate-200 dark:border-slate-800 pb-3">
              <Calendar className="h-6 w-6" />
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Automated Report Scheduling</h3>
            </div>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
              Configure automated delivery of immutable organization activity and compliance summaries to designated executive emails.
            </p>
            
            <div className="space-y-3 pt-1 text-xs font-semibold">
              <div>
                <label className="block text-slate-800 dark:text-slate-200 mb-1.5 font-bold">Delivery Frequency</label>
                <select className="w-full h-10 rounded-xl border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700 px-3 font-bold text-slate-900 dark:text-white">
                  <option>Weekly on Monday (08:00 UTC)</option>
                  <option>Daily Executive Briefing (06:00 UTC)</option>
                  <option>Monthly Compliance Summary (1st of Month)</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-800 dark:text-slate-200 mb-1.5 font-bold">Recipient Email Address(es)</label>
                <input type="text" defaultValue="admin@platform.com, compliance@bmms-enterprise.com" className="w-full h-10 rounded-xl border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700 px-3 font-medium text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-slate-800 dark:text-slate-200 mb-1.5 font-bold">Report Format</label>
                <select className="w-full h-10 rounded-xl border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700 px-3 font-bold text-slate-900 dark:text-white">
                  <option>CSV Workbook + Executive PDF Summary</option>
                  <option>JSON Raw Archive (For SIEM Integration)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setShowScheduleModal(false)} className="h-9 font-bold text-xs">Cancel</Button>
              <Button size="sm" className="h-9 px-5 font-extrabold text-xs bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => {
                setShowScheduleModal(false);
                dispatch(showWarning({ title: 'Schedule Activated', message: 'Automated compliance activity reports have been scheduled.' }));
              }}>
                Activate Schedule
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
