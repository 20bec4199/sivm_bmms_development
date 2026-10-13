'use client';

import React, { useState, useMemo } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { 
  Megaphone, AlertTriangle, Wrench, Bell, 
  Search, Plus, Users, Building, Flame,
  CheckCircle2, Radio, Info, Eye
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { showWarning } from '@/store/slices/uiSlice';
import { 
  useGetAlertsQuery, 
  useCreateBroadcastMutation 
} from '@/services/alertsApi';
import { useGetBuildingsQuery } from '@/services/organizationApi';
import { RequireModule } from '@/components/auth/RequireModule';

export default function OrganizationAlertsPage() {
  const dispatch = useDispatch();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<string>('ALL');
  const [selectedAudienceFilter, setSelectedAudienceFilter] = useState<string>('ALL');

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedAlertForView, setSelectedAlertForView] = useState<any | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [alertType, setAlertType] = useState<'EMERGENCY' | 'MAINTENANCE' | 'ANNOUNCEMENT'>('EMERGENCY');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('HIGH');
  const [audience, setAudience] = useState<'ALL' | 'RESIDENTS' | 'STAFF' | 'SPECIFIC_NODE'>('ALL');
  const [targetNodeId, setTargetNodeId] = useState('');

  // Queries
  const { data: alertsResponse, isLoading: isLoadingAlerts, refetch: refetchAlerts } = useGetAlertsQuery({
    type: selectedTypeFilter !== 'ALL' ? selectedTypeFilter : undefined,
    audience: selectedAudienceFilter !== 'ALL' ? selectedAudienceFilter : undefined,
    search: searchQuery || undefined,
    take: 50,
  });
  const { data: buildingsResponse } = useGetBuildingsQuery({});

  // Mutations
  const [createBroadcast, { isLoading: isBroadcasting }] = useCreateBroadcastMutation();

  // Data Normalization
  const alerts = useMemo(() => {
    if (!alertsResponse) return [];
    if (Array.isArray(alertsResponse)) return alertsResponse;
    return alertsResponse.data || [];
  }, [alertsResponse]);

  const buildings = useMemo(() => {
    if (!buildingsResponse) return [];
    if (Array.isArray(buildingsResponse)) return buildingsResponse;
    return buildingsResponse.data || [];
  }, [buildingsResponse]);

  // Metric Computations
  const totalAlerts = alerts.length;
  const emergencyCount = alerts.filter((a: any) => a.type === 'EMERGENCY').length;
  const maintenanceCount = alerts.filter((a: any) => a.type === 'MAINTENANCE').length;
  const announcementCount = alerts.filter((a: any) => a.type === 'ANNOUNCEMENT').length;

  // Filtered Alerts
  const filteredAlerts = useMemo(() => {
    return alerts.filter((a: any) => {
      const matchesSearch = !searchQuery || 
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.message.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPriority = selectedPriorityFilter === 'ALL' || a.priority === selectedPriorityFilter;
      return matchesSearch && matchesPriority;
    });
  }, [alerts, searchQuery, selectedPriorityFilter]);

  // Form Submit Handler
  const handleCreateBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      dispatch(showWarning({ message: 'Broadcast title is required.' }));
      return;
    }
    if (!message.trim()) {
      dispatch(showWarning({ message: 'Broadcast message body is required.' }));
      return;
    }
    if (audience === 'SPECIFIC_NODE' && !targetNodeId) {
      dispatch(showWarning({ message: 'Please select a specific building/target node.' }));
      return;
    }

    try {
      await createBroadcast({
        title: title.trim(),
        message: message.trim(),
        type: alertType,
        priority,
        audience,
        targetNodeId: audience === 'SPECIFIC_NODE' ? targetNodeId : undefined,
      }).unwrap();

      setIsCreateModalOpen(false);
      setTitle('');
      setMessage('');
      setAlertType('EMERGENCY');
      setPriority('HIGH');
      setAudience('ALL');
      setTargetNodeId('');
      refetchAlerts();
      dispatch(showWarning({ title: 'Broadcast Dispatched', message: 'Alert was successfully transmitted to target recipients.' }));
    } catch (err: any) {
      dispatch(showWarning({ message: err?.data?.message || 'Failed to dispatch broadcast alert.' }));
    }
  };

  // Badge Helpers
  const renderTypeBadge = (type: string) => {
    switch (type) {
      case 'EMERGENCY':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800 shadow-sm">
            <Flame className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
            Emergency
          </span>
        );
      case 'MAINTENANCE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800 shadow-sm">
            <Wrench className="w-3.5 h-3.5 text-amber-600" />
            Maintenance
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800 shadow-sm">
            <Megaphone className="w-3.5 h-3.5 text-indigo-600" />
            Announcement
          </span>
        );
    }
  };

  const renderPriorityBadge = (p: string) => {
    switch (p) {
      case 'CRITICAL':
        return <Badge className="bg-rose-600 text-white font-bold text-xs uppercase px-2 py-0.5">Critical</Badge>;
      case 'HIGH':
        return <Badge className="bg-amber-500 text-white font-bold text-xs uppercase px-2 py-0.5">High</Badge>;
      case 'MEDIUM':
        return <Badge className="bg-blue-600 text-white font-bold text-xs uppercase px-2 py-0.5">Medium</Badge>;
      default:
        return <Badge className="bg-slate-500 text-white font-bold text-xs uppercase px-2 py-0.5">Low</Badge>;
    }
  };

  const renderAudienceChip = (aud: string, targetNodeName?: string) => {
    switch (aud) {
      case 'RESIDENTS':
        return (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Users className="w-3.5 h-3.5 text-indigo-500" />
            Residents Only
          </div>
        );
      case 'STAFF':
        return (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Wrench className="w-3.5 h-3.5 text-amber-500" />
            Facility Staff
          </div>
        );
      case 'SPECIFIC_NODE':
        return (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Building className="w-3.5 h-3.5 text-blue-500" />
            {targetNodeName ? `Zone: ${targetNodeName}` : 'Specific Zone'}
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Radio className="w-3.5 h-3.5 text-emerald-500" />
            Entire Community
          </div>
        );
    }
  };

  // Columns for DataTable
  const columns: Column<any>[] = [
    {
      header: 'Broadcast Notice',
      accessorKey: 'title',
      cell: (alert) => (
        <div className="flex items-start gap-3.5 max-w-md">
          <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center border shadow-sm ${
            alert.type === 'EMERGENCY' ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/50 dark:border-rose-800' :
            alert.type === 'MAINTENANCE' ? 'bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-950/50 dark:border-amber-800' :
            'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-950/50 dark:border-indigo-800'
          }`}>
            {alert.type === 'EMERGENCY' ? <Flame className="w-5 h-5 animate-pulse" /> :
             alert.type === 'MAINTENANCE' ? <Wrench className="w-5 h-5" /> :
             <Megaphone className="w-5 h-5" />}
          </div>
          <div className="space-y-1">
            <div className="font-bold text-slate-900 dark:text-white leading-tight">
              {alert.title}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
              {alert.message}
            </p>
          </div>
        </div>
      )
    },
    {
      header: 'Category',
      accessorKey: 'type',
      cell: (alert) => renderTypeBadge(alert.type)
    },
    {
      header: 'Priority',
      accessorKey: 'priority',
      cell: (alert) => renderPriorityBadge(alert.priority)
    },
    {
      header: 'Target Audience',
      accessorKey: 'audience',
      cell: (alert) => renderAudienceChip(alert.audience, alert.targetNode?.name)
    },
    {
      header: 'Dispatched By',
      accessorKey: 'createdBy',
      cell: (alert) => (
        <div className="text-xs text-slate-600 dark:text-slate-400">
          <div className="font-semibold text-slate-800 dark:text-slate-200">
            {alert.createdBy ? `${alert.createdBy.firstName} ${alert.createdBy.lastName || ''}` : 'Admin'}
          </div>
          <div className="text-slate-400 text-[11px]">
            {alert.createdAt ? new Date(alert.createdAt).toLocaleString() : 'Just now'}
          </div>
        </div>
      )
    },
    {
      header: 'Actions',
      accessorKey: 'id',
      cell: (alert) => (
        <Button
          size="sm"
          variant="outline"
          className="rounded-xl text-xs gap-1.5 border-slate-200 dark:border-slate-700 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/40"
          onClick={() => setSelectedAlertForView(alert)}
        >
          <Eye className="w-3.5 h-3.5" />
          View
        </Button>
      )
    }
  ];

  return (
    <RequireModule moduleCode="COMMUNITY_MANAGEMENT">
      <div className="space-y-8 max-w-[1600px] mx-auto pb-16">
        {/* Header */}
        <PageHeader
          title="SmartiAlert • Emergency & Broadcast Center"
          description="Transmit instant critical advisories, planned maintenance blackouts, and facility bulletins across the property."
        />

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Card className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Transmissions</span>
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Radio className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{totalAlerts}</div>
              <p className="text-xs text-slate-400 mt-1.5 font-medium">Broadcasts logged in system</p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Emergency Alerts</span>
                <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
                  <Flame className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 tracking-tight">{emergencyCount}</div>
              <p className="text-xs text-rose-500 mt-1.5 font-medium">Critical safety advisories</p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Maintenance Notices</span>
                <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Wrench className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{maintenanceCount}</div>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 font-medium">Scheduled utility shutdowns</p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Community Bulletins</span>
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Megaphone className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{announcementCount}</div>
              <p className="text-xs text-slate-400 mt-1.5 font-medium">General resident bulletins</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter and Action Bar */}
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input 
              placeholder="Search by title, keywords or message content..."
              className="pl-10 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border-0 h-11 text-sm focus:ring-2 focus:ring-indigo-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Category Filter */}
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3.5 h-11 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Categories</option>
              <option value="EMERGENCY">Emergency Only</option>
              <option value="MAINTENANCE">Maintenance Only</option>
              <option value="ANNOUNCEMENT">Announcements Only</option>
            </select>

            {/* Priority Filter */}
            <select
              value={selectedPriorityFilter}
              onChange={(e) => setSelectedPriorityFilter(e.target.value)}
              className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3.5 h-11 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            {/* Audience Filter */}
            <select
              value={selectedAudienceFilter}
              onChange={(e) => setSelectedAudienceFilter(e.target.value)}
              className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3.5 h-11 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Audiences</option>
              <option value="RESIDENTS">Residents Only</option>
              <option value="STAFF">Staff Only</option>
              <option value="SPECIFIC_NODE">Specific Zone</option>
            </select>

            {/* Dispatch Action Button */}
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="rounded-2xl h-11 px-5 bg-gradient-to-r from-rose-600 via-indigo-600 to-indigo-700 hover:from-rose-700 hover:to-indigo-800 text-white gap-2 text-sm font-semibold shadow-md shadow-indigo-600/20"
            >
              <Radio className="w-4 h-4 animate-pulse" />
              Dispatch Broadcast
            </Button>
          </div>
        </div>

        {/* DataTable */}
        <DataTable
          columns={columns}
          data={filteredAlerts}
          isLoading={isLoadingAlerts}
          emptyMessage="No broadcast transmissions found. Click 'Dispatch Broadcast' to send your first advisory."
        />

        {/* Modal: Dispatch Broadcast */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Compose & Transmit Broadcast"
        >
          <form onSubmit={handleCreateBroadcast} className="space-y-4">
            {/* Category Selector Tabs */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                Advisory Category *
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAlertType('EMERGENCY');
                    setPriority('CRITICAL');
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-bold transition-all ${
                    alertType === 'EMERGENCY'
                      ? 'bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950/50 dark:border-rose-600 dark:text-rose-300 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Flame className="w-5 h-5 mb-1 text-rose-600" />
                  Emergency
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAlertType('MAINTENANCE');
                    setPriority('HIGH');
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-bold transition-all ${
                    alertType === 'MAINTENANCE'
                      ? 'bg-amber-50 border-amber-500 text-amber-700 dark:bg-amber-950/50 dark:border-amber-600 dark:text-amber-300 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Wrench className="w-5 h-5 mb-1 text-amber-600" />
                  Maintenance
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAlertType('ANNOUNCEMENT');
                    setPriority('MEDIUM');
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-bold transition-all ${
                    alertType === 'ANNOUNCEMENT'
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-950/50 dark:border-indigo-600 dark:text-indigo-300 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Megaphone className="w-5 h-5 mb-1 text-indigo-600" />
                  Bulletin
                </button>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Headline / Title *
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  alertType === 'EMERGENCY' ? 'e.g., Immediate Water Line Repair & Isolation' :
                  alertType === 'MAINTENANCE' ? 'e.g., Scheduled Elevator Servicing - Tower B' :
                  'e.g., Annual Society General Meeting Notice'
                }
                className="rounded-xl font-medium"
                required
                autoFocus
              />
            </div>

            {/* Message Body */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Notice Body & Instructions *
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Provide specific details: affected zones, estimated duration, emergency contacts, or action requested..."
                className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            {/* Priority & Audience */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Severity Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="CRITICAL">🔴 Critical (Instant Push + Email)</option>
                  <option value="HIGH">🟠 High (Instant In-App + Push)</option>
                  <option value="MEDIUM">🔵 Medium (In-App Notification)</option>
                  <option value="LOW">⚪ Low (Feed Only)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Target Audience
                </label>
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">Entire Community (All Users)</option>
                  <option value="RESIDENTS">Residents & Tenants Only</option>
                  <option value="STAFF">Facility & Security Staff Only</option>
                  <option value="SPECIFIC_NODE">Specific Building / Tower</option>
                </select>
              </div>
            </div>

            {/* Dynamic Specific Node Selector */}
            {audience === 'SPECIFIC_NODE' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Select Specific Building / Tower *
                </label>
                <select
                  value={targetNodeId}
                  onChange={(e) => setTargetNodeId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Choose target building...</option>
                  {buildings.map((b: any) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Real-time Preview */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" />
                  Live Notification Preview
                </span>
                {renderPriorityBadge(priority)}
              </div>
              <div className="font-bold text-slate-900 dark:text-white text-sm">
                {title || 'Headline will appear here...'}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                {message || 'Body text will appear here...'}
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-5 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={isBroadcasting}
                className="rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 text-white font-semibold px-6 shadow-md shadow-indigo-600/20"
              >
                Transmit Alert
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal: View Alert Details */}
        {selectedAlertForView && (
          <Modal
            isOpen={!!selectedAlertForView}
            onClose={() => setSelectedAlertForView(null)}
            title="Broadcast Transmission Record"
          >
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                {renderTypeBadge(selectedAlertForView.type)}
                {renderPriorityBadge(selectedAlertForView.priority)}
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {selectedAlertForView.title}
                </h3>
                <div className="text-xs text-slate-400 mt-1">
                  Dispatched on {new Date(selectedAlertForView.createdAt).toLocaleString()}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                {selectedAlertForView.message}
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800">
                  <span className="text-slate-400 block mb-1">Target Audience</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedAlertForView.audience}
                    {selectedAlertForView.targetNode?.name && ` (${selectedAlertForView.targetNode.name})`}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800">
                  <span className="text-slate-400 block mb-1">Dispatched By</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedAlertForView.createdBy ? `${selectedAlertForView.createdBy.firstName} ${selectedAlertForView.createdBy.lastName || ''}` : 'Admin'}
                  </span>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button
                  onClick={() => setSelectedAlertForView(null)}
                  className="rounded-xl px-6"
                >
                  Close
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </RequireModule>
  );
}
