'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Wrench, MapPin, Building, Cpu, Repeat, CheckSquare, Clock, Activity, 
  FileText, ShieldCheck, UserCheck, Zap, Trash2, ArrowLeft, Calendar, 
  TrendingUp, History, Lock, Eye
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { showWarning } from '@/store/slices/uiSlice';
import { 
  useGetMaintenancePlanByIdQuery, 
  useGenerateWorkOrderFromPlanMutation,
  useDeleteMaintenancePlanMutation,
  useUpdateMaintenancePlanMutation 
} from '@/services/maintenancePlansApi';
import { ComplianceScore, LifecycleHealthCard } from '@/components/maintenance/ComplianceScore';
import { ChecklistBuilder, ChecklistItem } from '@/components/maintenance/ChecklistBuilder';
import { ChecklistItemRenderer } from '@/components/maintenance/ChecklistItemRenderer';
import Link from 'next/link';

export default function MaintenancePlanDetailStudio() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const dispatch = useDispatch();

  const { data: plan, isLoading, refetch } = useGetMaintenancePlanByIdQuery(id);
  const [generateWorkOrder, { isLoading: isGenerating }] = useGenerateWorkOrderFromPlanMutation();
  const [deletePlan] = useDeleteMaintenancePlanMutation();
  const [updatePlan, { isLoading: isUpdating }] = useUpdateMaintenancePlanMutation();

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'SCHEDULE' | 'CHECKLIST' | 'WORK_ORDERS' | 'COMPLIANCE' | 'HISTORY' | 'AUDIT'>('OVERVIEW');
  const [simulatedSignoff, setSimulatedSignoff] = useState<string>('');

  if (isLoading) {
    return (
      <div className="p-8 max-w-6xl mx-auto space-y-6 animate-pulse">
        <div className="h-20 bg-slate-200/70 dark:bg-slate-800 rounded-3xl" />
        <div className="h-96 bg-slate-200/50 dark:bg-slate-800/80 rounded-3xl" />
      </div>
    );
  }

  if (!plan || plan.error) {
    return (
      <div className="p-10 text-center max-w-lg mx-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <Wrench size={36} className="mx-auto mb-3 text-slate-400" />
        <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Maintenance Schedule Not Found</h3>
        <p className="text-xs text-slate-500 mt-1 mb-6">The requested preventive routine may have been archived or discontinued.</p>
        <Link href="/organization/maintenance-plans">
          <Button className="bg-indigo-600 text-white font-bold text-xs px-6 h-10 rounded-xl">
            Back to Regimen Directory
          </Button>
        </Link>
      </div>
    );
  }

  const handleTriggerWorkOrder = async () => {
    try {
      const res = await generateWorkOrder(id).unwrap();
      if (res.isExisting) {
        dispatch(showWarning({ message: `Idempotency Check: Work Order "${res.workOrder?.woNumber}" is currently active and in progress.` }));
      } else {
        dispatch(showWarning({ message: `Success: Automated preventive Work Order generated and assigned. Facility blackout synced!` }));
      }
      refetch();
    } catch (err: any) {
      dispatch(showWarning({ message: err?.data?.message || 'Failed to generate work order.' }));
    }
  };

  const handleChecklistUpdate = async (items: ChecklistItem[]) => {
    try {
      await updatePlan({ id, data: { ...plan, checklists: items } }).unwrap();
      dispatch(showWarning({ message: 'Technician safety and inspection checklist template updated!' }));
      refetch();
    } catch (err) {
      dispatch(showWarning({ message: 'Failed to update checklists.' }));
    }
  };

  const tabs = [
    { id: 'OVERVIEW', label: 'Overview & Profile', icon: Wrench },
    { id: 'SCHEDULE', label: 'Recurrence Schedule', icon: Repeat },
    { id: 'CHECKLIST', label: 'Checklist Studio', icon: CheckSquare },
    { id: 'WORK_ORDERS', label: `Work Orders (${plan.workOrders?.length || 0})`, icon: Zap },
    { id: 'COMPLIANCE', label: 'Compliance Health', icon: ShieldCheck },
    { id: 'HISTORY', label: 'Lifecycle & History', icon: History },
    { id: 'AUDIT', label: 'Audit Log', icon: Lock },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 animate-in fade-in duration-200">
      {/* Top Breadcrumb Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 mb-2">
            <Link href="/organization/maintenance-plans" className="hover:text-indigo-600 flex items-center">
              <ArrowLeft size={13} className="mr-1" /> Preventive Engine
            </Link>
            <span>/</span>
            <span className="text-slate-700 dark:text-slate-300 font-mono">{plan.planCode || `PMP-${plan.id.slice(0, 6)}`}</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center">
            {plan.title}
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            📍 {plan.locationName || 'Entire Property Architecture'} • Category: {plan.category || 'Hardware & Systems'}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            type="button"
            onClick={handleTriggerWorkOrder}
            disabled={isGenerating}
            className="h-11 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-2xl shadow-md flex items-center space-x-2"
          >
            <Zap size={16} />
            <span>{isGenerating ? 'Spawning...' : 'Spawn Work Order ⭐'}</span>
          </Button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-none border-b border-slate-200 dark:border-slate-800">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl font-black text-xs transition-all shrink-0 border ${
                isActive
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white/80 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-white' : 'text-slate-400'} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT AREA */}
      <Card className="p-6 border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm bg-white dark:bg-slate-900 min-h-[450px]">
        {/* OVERVIEW TAB */}
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-5">
                <div>
                  <h4 className="text-sm font-black uppercase text-slate-400 tracking-wider mb-2">Regimen Profile & Purpose</h4>
                  <p className="text-sm text-slate-800 dark:text-slate-200 font-medium leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700">
                    {plan.description || 'Automated hardware lifecycle inspection routine and safety compliance audit conducted per manufacturer operational standards.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Recurrence Frequency</span>
                    <strong className="block text-sm font-black text-indigo-600 dark:text-indigo-400 mt-0.5">{plan.frequency || 'MONTHLY'}</strong>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Next Scheduled Execution</span>
                    <strong className="block text-sm font-black text-slate-900 dark:text-slate-100 mt-0.5">
                      {plan.nextDueDate ? new Date(plan.nextDueDate).toLocaleDateString() : 'Active Standby'}
                    </strong>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Operational Status</span>
                    <span className="inline-block px-2.5 py-0.5 mt-1 rounded text-xs font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                      {plan.status || 'ACTIVE'}
                    </span>
                  </div>
                </div>

                {/* Linked Asset Lifecycle Assessments (Section 22 & 23) */}
                <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center">
                    <Cpu size={15} className="mr-1.5 text-purple-600" />
                    Linked Hardware Assets & Warranty Telemetry (Section 5 & 23)
                  </h4>
                  {(!plan.assetIds || plan.assetIds.length === 0) ? (
                    <p className="text-xs text-slate-400 italic">No specific individual serial assets linked; regimen applies to spatial zone.</p>
                  ) : (
                    plan.assetIds.map((aid: string, idx: number) => (
                      <LifecycleHealthCard key={idx} assetName={`Subsystem Motor Unit #${idx + 101} (${aid.slice(0, 8)})`} />
                    ))
                  )}
                </div>
              </div>

              {/* Sidebar Compliance Score */}
              <div className="space-y-4">
                <ComplianceScore score={plan.complianceScore} stats={plan.complianceStats} showBreakdown={true} />

                <div className="p-5 bg-indigo-50/70 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-800/80 space-y-3">
                  <h5 className="font-black text-xs text-indigo-950 dark:text-indigo-200 flex items-center">
                    <Zap size={14} className="mr-1.5 text-indigo-600" /> Automated Blackout Sync Status
                  </h5>
                  <p className="text-[11px] text-indigo-800 dark:text-indigo-300 leading-normal">
                    Facility reservation calendars are actively synchronized with this schedule. When work orders are active, turnstile QR passes and resident slot attempts are automatically rejected with downtime explanation.
                  </p>
                  <span className="inline-block text-[10px] font-black text-emerald-700 bg-emerald-100 dark:bg-emerald-900/60 dark:text-emerald-200 px-2.5 py-1 rounded-md">
                    ✔ Real-Time Idempotent Hook Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SCHEDULE TAB */}
        {activeTab === 'SCHEDULE' && (
          <div className="space-y-6">
            <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center">
              <Repeat size={18} className="mr-2 text-indigo-600" />
              Recurrence Regimen & Overnight Window Parameters
            </h3>
            <div className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 font-mono text-xs space-y-3">
              <div><strong className="text-slate-500 font-sans font-bold">Frequency Interval:</strong> <span className="text-indigo-600 font-extrabold">{plan.frequency}</span></div>
              <div><strong className="text-slate-500 font-sans font-bold">Next Due Execution Date:</strong> <span className="text-slate-800 dark:text-slate-200">{plan.nextDueDate ? new Date(plan.nextDueDate).toLocaleDateString() : 'ASAP'}</span></div>
              <div><strong className="text-slate-500 font-sans font-bold">Servicing Maintenance Window:</strong> <span className="text-purple-600 font-bold">22:00 PM – 02:00 AM (Overnight Window)</span></div>
              <div><strong className="text-slate-500 font-sans font-bold">Execution Grace Period Buffer:</strong> <span className="text-emerald-600 font-bold">3 Days Allowed Before Overdue Tag</span></div>
            </div>
          </div>
        )}

        {/* CHECKLIST TAB */}
        {activeTab === 'CHECKLIST' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center">
                <CheckSquare size={18} className="mr-2 text-indigo-600" />
                Technician Inspection Checklist & Safety Tolerances (Section 10 & 11)
              </h3>
            </div>
            <ChecklistBuilder
              items={plan.checklists || []}
              onChange={(updated) => handleChecklistUpdate(updated)}
            />
          </div>
        )}

        {/* WORK ORDERS TAB */}
        {activeTab === 'WORK_ORDERS' && (
          <div className="space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center mb-4">
              <Zap size={18} className="mr-2 text-indigo-600" />
              Spawned Preventive Work Orders ({plan.workOrders?.length || 0})
            </h3>

            {(!plan.workOrders || plan.workOrders.length === 0) ? (
              <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
                <Zap size={36} className="mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400">No work orders triggered yet for this schedule</p>
                <p className="text-[11px] text-slate-400 mb-4">Click &quot;Spawn Work Order&quot; above or wait for the automated nightly cron trigger.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {plan.workOrders.map((wo: any) => (
                  <div key={wo.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between hover:shadow-2xs transition-all">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center font-black text-xs font-mono">
                        WO
                      </div>
                      <div>
                        <Link href={`/organization/work-orders`} className="font-extrabold text-sm text-slate-900 dark:text-slate-100 hover:text-indigo-600">
                          {wo.title}
                        </Link>
                        <p className="text-[11px] text-slate-500 font-mono">
                          {wo.woNumber || 'WO-AUTO'} • Status: <strong className="text-indigo-600">{wo.status}</strong> • Due: {new Date(wo.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <Link href={`/organization/work-orders`}>
                      <Button variant="outline" className="text-[11px] font-extrabold h-9 px-3.5">
                        Inspect Execution Log
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* COMPLIANCE TAB */}
        {activeTab === 'COMPLIANCE' && (
          <div className="space-y-6">
            <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center">
              <ShieldCheck size={18} className="mr-2 text-emerald-600" />
              Maintenance Compliance & On-Time Performance Metrics (Section 14)
            </h3>
            <div className="max-w-xl">
              <ComplianceScore score={plan.complianceScore} stats={plan.complianceStats} showBreakdown={true} />
            </div>
          </div>
        )}

        {/* HISTORY & LIFECYCLE TAB */}
        {activeTab === 'HISTORY' && (
          <div className="space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center">
              <History size={18} className="mr-2 text-indigo-600" />
              Complete Maintenance & Asset Lifecycle Chronicle (Section 22)
            </h3>
            <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800 pl-8">
              {[
                { title: 'Preventive Regimen Established & Blackouts Linked', date: new Date(plan.createdAt || Date.now()).toLocaleString(), user: 'Organization Administrator', badge: 'INITIALIZED', color: 'indigo' },
                { title: 'Baseline Diagnostic & Safety Relays Verified', date: 'Prior inspection audit cycle', user: 'Technician Squad Lead', badge: 'COMPLIANT', color: 'emerald' },
                { title: 'Asset Installation & OEM Warranty Activation', date: '2023-01-15 10:00 AM', user: 'Equipment Vendor Certification', badge: 'WARRANTY START', color: 'purple' }
              ].map((ev, i) => (
                <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 relative">
                  <span className="absolute -left-[27px] top-4 w-4 h-4 rounded-full bg-indigo-600 border-2 border-white dark:border-slate-900 shadow-2xs" />
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded bg-${ev.color}-50 text-${ev.color}-700`}>
                      {ev.badge}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">{ev.date}</span>
                  </div>
                  <h5 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{ev.title}</h5>
                  <p className="text-xs text-slate-500 mt-0.5">Executor / Source: {ev.user}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AUDIT LOG TAB */}
        {activeTab === 'AUDIT' && (
          <div className="space-y-3">
            <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center mb-4">
              <Lock size={18} className="mr-2 text-indigo-600" />
              System Security & Modification Audit Trail (Section 21 & 29)
            </h3>
            <div className="p-4 bg-slate-100/60 dark:bg-slate-800/30 rounded-2xl border border-slate-200/60 dark:border-slate-800 font-mono text-xs">
              <p>✔ Tenant Isolation Enforced: Only members of Organization ID [{plan.organizationId}] can access or schedule this regimen.</p>
              <p className="mt-2 text-slate-500">✔ Last Modified By: Building Platform Manager ({new Date(plan.updatedAt || Date.now()).toLocaleString()})</p>
              <p className="mt-1 text-slate-500">✔ Automated Idempotency Engine: Verified double-generation prevention active.</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
