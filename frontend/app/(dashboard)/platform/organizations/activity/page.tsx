'use client';

import React, { useState } from 'react';
import { AuditLogViewer } from '@/components/audit/AuditLogViewer';
import { ActivityCharts } from '@/components/audit/ActivityCharts';
import { useGetOrganizationsQuery } from '@/services/platformApi';
import { Building2, Search, Activity, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function OrganizationActivityManagementPage() {
  const [selectedOrgId, setSelectedOrgId] = useState<string>('ALL');
  const { data: orgsResponse } = useGetOrganizationsQuery({});
  const organizations = orgsResponse?.data || [];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              Multi-Tenant Oversight
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Organization Activity & Audit Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Select a tenant organization to inspect its operational health, complaint volume, work order throughput, and immutable audit logs.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <span className="text-xs font-bold uppercase text-slate-500">Filter by Tenant:</span>
          <select
            value={selectedOrgId}
            onChange={(e) => setSelectedOrgId(e.target.value)}
            className="h-10 w-full sm:w-64 rounded-xl border border-indigo-200 bg-white dark:bg-slate-800 dark:border-slate-700 px-3 text-xs font-bold text-slate-900 dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          >
            <option value="ALL">🌐 All Tenant Organizations</option>
            {organizations.map((o: any) => (
              <option key={o.id} value={o.id}>{o.name} ({o.code || o.id.slice(0, 6)})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Analytics widgets scoped to selected organization or ALL */}
      <ActivityCharts organizationId={selectedOrgId} isGlobal={selectedOrgId === 'ALL'} />

      {/* Interactive Audit Table */}
      <div className="pt-2">
        <AuditLogViewer 
          mode="platform"
          initialOrgId={selectedOrgId}
          title={selectedOrgId === 'ALL' ? "Global Tenant Transaction Feed" : "Organization Scoped Audit Stream"}
          description="Detailed sequential log of administrative overrides, maintenance completions, and security interventions."
        />
      </div>
    </div>
  );
}
