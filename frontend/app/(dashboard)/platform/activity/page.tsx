'use client';

import React from 'react';
import { ActivityCharts } from '@/components/audit/ActivityCharts';
import { AuditLogViewer } from '@/components/audit/AuditLogViewer';
import { Activity, ShieldAlert, FileSearch } from 'lucide-react';

export default function PlatformActivityOverviewPage() {
  return (
    <div className="space-y-8 min-w-0">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              Platform Command Center
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Global Activity Overview & Telemetry</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Monitor real-time system performance, operational throughput, and user activity across every tenant organization.
          </p>
        </div>
      </div>

      {/* KPI & Analytical Charts */}
      <ActivityCharts isGlobal={true} />

      {/* Embedded Activity Log Stream */}
      <div className="pt-4">
        <AuditLogViewer 
          mode="platform"
          title="Recent Platform Activity Stream"
          description="Live transactional feed of create, update, delete, and authentication events across the system."
        />
      </div>
    </div>
  );
}
