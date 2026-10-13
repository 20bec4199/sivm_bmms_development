'use client';

import React from 'react';
import { 
  Activity, Users, Building2, TrendingUp, ShieldCheck, Clock, 
  CheckCircle2, ArrowUpRight, BarChart3, PieChart, Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { useGetActivityStatsQuery } from '@/services/auditApi';
import Link from 'next/link';

interface ActivityChartsProps {
  organizationId?: string;
  isGlobal?: boolean;
}

export const ActivityCharts: React.FC<ActivityChartsProps> = ({ 
  organizationId = 'ALL',
  isGlobal = true
}) => {
  const { data: statsResponse, isLoading } = useGetActivityStatsQuery({
    organizationId: organizationId !== 'ALL' ? organizationId : undefined
  });

  const kpi = statsResponse?.kpi || {
    totalOrganizations: 0,
    activeOrganizations: 0,
    suspendedOrganizations: 0,
    totalUsers: 0,
    activeUsers: 0,
    totalActivities: 0,
    activitiesToday: 0,
    activitiesThisWeek: 0,
    activitiesThisMonth: 0,
  };

  const charts = statsResponse?.charts || {
    byModule: [],
    byRole: [],
    byAction: [],
    dailyTrends: [],
    activitiesByOrganization: []
  };

  const maxTrendValue = Math.max(...(charts.dailyTrends || []).map((t: any) => t.activities || 0), 10);
  const totalModuleCount = Math.max((charts.byModule || []).reduce((acc: number, cur: any) => acc + (cur.value || 0), 0), 1);

  const moduleColors = ['bg-indigo-600 dark:bg-indigo-500', 'bg-emerald-600 dark:bg-emerald-500', 'bg-blue-600 dark:bg-blue-500', 'bg-amber-600 dark:bg-amber-500', 'bg-purple-600 dark:bg-purple-500', 'bg-rose-600 dark:bg-rose-500'];

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-600 dark:text-slate-300 font-semibold text-base animate-pulse bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        Loading live enterprise analytics & telemetry...
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">
      {/* 
        Section 4: Improve Dashboard Cards 
        Responsive grid: Desktop: 4 cards per row, Tablet: 2 cards per row, Mobile: 1 card per row
        Equal card heights, small icon, clear title (14-16px medium), large primary number (24-32px bold), short trend
      */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* Card 1: Total Activities */}
        <Card className="h-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <CardContent className="p-6 flex flex-col justify-between h-full space-y-4">
            <div className="flex items-start justify-between">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                Total Activities
              </span>
              <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800 flex-shrink-0">
                <Activity className="h-5 w-5" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {kpi.totalActivities?.toLocaleString() || '0'}
              </div>
              <div className="mt-2 flex items-center text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-md w-fit border border-emerald-200 dark:border-emerald-800">
                <TrendingUp className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                <span>+{kpi.activitiesToday || 0} actions logged today</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Recent Velocity */}
        <Card className="h-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <CardContent className="p-6 flex flex-col justify-between h-full space-y-4">
            <div className="flex items-start justify-between">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                30-Day Activity Volume
              </span>
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800 flex-shrink-0">
                <BarChart3 className="h-5 w-5" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {kpi.activitiesThisMonth || 0}
              </div>
              <div className="mt-2 flex items-center text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md w-fit border border-slate-200 dark:border-slate-700">
                <Clock className="h-3.5 w-3.5 mr-1.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <span>{kpi.activitiesThisWeek || 0} recorded this week</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Tenant Organizations (or Local Scoped Status) */}
        <Card className="h-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <CardContent className="p-6 flex flex-col justify-between h-full space-y-4">
            <div className="flex items-start justify-between">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                {isGlobal ? 'Monitored Tenants' : 'Organization Status'}
              </span>
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800 flex-shrink-0">
                <Building2 className="h-5 w-5" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {isGlobal ? (kpi.totalOrganizations || 0) : 'Active'}
              </div>
              <div className="mt-2 flex items-center text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-md w-fit border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                <span>{isGlobal ? `${kpi.activeOrganizations || 0} Active operational tenants` : 'Fully SLA compliant'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Users & Staff */}
        <Card className="h-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <CardContent className="p-6 flex flex-col justify-between h-full space-y-4">
            <div className="flex items-start justify-between">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                Total Authorized Users
              </span>
              <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800 flex-shrink-0">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {kpi.totalUsers || 0}
              </div>
              <div className="mt-2 flex items-center text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-md w-fit border border-indigo-200 dark:border-indigo-800">
                <ShieldCheck className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                <span>{kpi.activeUsers || 0} currently active sessions</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 
        Section 13: Improve Charts and Analytics
        Clear titles (20-24px semibold/bold), short description (14px regular readable text), visible labels, legend, tooltips on hover.
      */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Activity Trend Line / Bar Chart */}
        <Card className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col justify-between rounded-2xl overflow-hidden">
          <CardHeader className="p-6 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-900">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  14-Day Activity Velocity Trends
                </CardTitle>
                <CardDescription className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-1">
                  Daily frequency of operational events, user authentications, and system mutations.
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs">
                <span className="w-3 h-3 rounded-full bg-indigo-600 dark:bg-indigo-500 inline-block mr-1.5" />
                <span>Daily Log Count</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 flex-1 flex flex-col justify-end min-h-[280px] overflow-x-auto">
            <div className="h-52 flex items-end justify-between gap-2 pt-6 px-2 min-w-[500px]">
              {charts.dailyTrends?.map((item: any, idx: number) => {
                const heightPercent = Math.max((item.activities / maxTrendValue) * 100, 10);
                const isToday = idx === (charts.dailyTrends?.length - 1);
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center group relative">
                    {/* High Contrast Tooltip on Hover */}
                    <div className="absolute -top-11 scale-0 group-hover:scale-100 transition-all duration-150 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-extrabold py-1.5 px-3 rounded-lg shadow-xl z-20 whitespace-nowrap pointer-events-none border border-slate-700 dark:border-slate-200">
                      {item.activities} activities • {item.date}
                    </div>
                    {/* Bar Value Indicator */}
                    <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 mb-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                      {item.activities}
                    </span>
                    {/* Bar */}
                    <div 
                      style={{ height: `${heightPercent}%` }} 
                      className={`w-full max-w-[36px] rounded-t-lg transition-all duration-300 group-hover:brightness-110 ${
                        isToday ? 'bg-indigo-600 dark:bg-indigo-500 shadow-md shadow-indigo-600/30' : 'bg-indigo-400/80 dark:bg-indigo-800/80 hover:bg-indigo-600 dark:hover:bg-indigo-500'
                      }`}
                    />
                    {/* Readable X-Axis Date Label (Section 2 & 3: Never light gray, medium contrast) */}
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-2.5 truncate w-full text-center block">
                      {item.date?.split(',')[0] || item.date}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Donut / Horizontal Progress Chart: Activities by Module */}
        <Card className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col justify-between rounded-2xl overflow-hidden">
          <CardHeader className="p-6 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-900">
            <CardTitle className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Activities by Module
            </CardTitle>
            <CardDescription className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-1">
              Share of operations across core system modules.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-5 flex-1 flex flex-col justify-center">
            {charts.byModule?.map((item: any, idx: number) => {
              const percent = Math.round(((item.value || 0) / totalModuleCount) * 100);
              const barColor = moduleColors[idx % moduleColors.length];
              return (
                <div key={item.name} className="space-y-2">
                  <div className="flex justify-between items-center text-sm font-extrabold">
                    <span className="text-slate-800 dark:text-slate-200 flex items-center truncate pr-2">
                      <span className={`w-3 h-3 rounded-full ${barColor} mr-2.5 inline-block flex-shrink-0 shadow-xs`} />
                      {item.name}
                    </span>
                    <span className="font-mono text-slate-900 dark:text-white font-black text-sm">
                      {item.value} <span className="text-slate-500 dark:text-slate-400 font-bold text-xs">({percent}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-200/60 dark:border-slate-700/50">
                    <div className={`h-2.5 rounded-full ${barColor} transition-all duration-500`} style={{ width: `${Math.max(percent, 6)}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Role Distribution & Top Active Organizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Active Organizations (Bar / Ranked Table) */}
        <Card className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="p-6 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Activities by Organization
              </CardTitle>
              <CardDescription className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-1">
                Tenant organizations with highest operational throughput.
              </CardDescription>
            </div>
            {isGlobal && (
              <Link href="/platform/organizations/activity">
                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 transition-colors inline-flex items-center shadow-xs">
                  View All Orgs <ArrowUpRight className="h-4 w-4 ml-1" />
                </span>
              </Link>
            )}
          </CardHeader>
          <CardContent className="p-0 divide-y divide-slate-200/70 dark:divide-slate-800">
            {charts.activitiesByOrganization?.map((org: any, idx: number) => (
              <div key={idx} className="p-5 flex items-center justify-between hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group">
                <div className="flex items-center space-x-4 overflow-hidden">
                  <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 font-extrabold text-sm flex items-center justify-center text-slate-800 dark:text-slate-200 flex-shrink-0 border border-slate-200 dark:border-slate-700 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all shadow-xs">
                    #{idx + 1}
                  </div>
                  <div className="overflow-hidden">
                    <div className="font-extrabold text-sm text-slate-900 dark:text-white truncate max-w-[280px]">
                      {org.name || 'Tenant Organization'}
                    </div>
                    <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold flex items-center mt-0.5">
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                      Active Tenant • Verified Enterprise Telemetry
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="px-3 py-1.5 text-xs font-bold font-mono bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg border border-slate-300 dark:border-slate-700 shadow-xs whitespace-nowrap">
                    {org.count} records
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Horizontal Bar Chart: Activities by User Role */}
        <Card className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="p-6 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-900">
            <CardTitle className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Activities by User Role
            </CardTitle>
            <CardDescription className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-1">
              Transactional operations categorized by administrative and residential roles.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {charts.byRole?.map((role: any, idx: number) => {
                const totalRoleCount = Math.max((charts.byRole || []).reduce((a: number, c: any) => a + (c.value || 0), 0), 1);
                const rolePercent = Math.round(((role.value || 0) / totalRoleCount) * 100);
                return (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100/70 dark:hover:bg-slate-800/70 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-extrabold uppercase tracking-wide px-2.5 py-1 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-md shadow-xs border border-slate-300 dark:border-slate-700">
                          {role.name?.replace(/_/g, ' ') || 'USER ROLE'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-mono font-extrabold text-slate-900 dark:text-white">{role.value}</span>
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 ml-1.5">({rolePercent}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-200/80 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden border border-slate-300/50 dark:border-slate-600/50">
                      <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 dark:from-indigo-500 dark:to-purple-500 h-2.5 rounded-full" style={{ width: `${Math.max(rolePercent, 8)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
