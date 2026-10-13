'use client';

import { useEffect, useState } from 'react';
import { Shield, Users, AlertTriangle, MapPin, ClipboardList, TrendingUp, Clock } from 'lucide-react';
import { getSecurityDashboardStats } from '@/services/securityApi';

interface DashboardStats {
  totalIncidents: number;
  openIncidents: number;
  todayIncidents: number;
  activeVisitors: number;
  todayVisitorLogs: number;
  patrolRoutes: number;
  todayPatrolLogs: number;
}

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: 'text-red-600 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20',
  MAJOR: 'text-orange-600 bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20',
  MINOR: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20',
};

const STATUS_COLORS: Record<string, string> = {
  REPORTED: 'text-red-600 bg-red-50 dark:bg-red-500/10',
  INVESTIGATING: 'text-orange-600 bg-orange-50 dark:bg-orange-500/10',
  RESOLVED: 'text-green-600 bg-green-50 dark:bg-green-500/10',
  CLOSED: 'text-slate-600 bg-slate-100 dark:bg-slate-500/10',
};

export default function SecurityDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSecurityDashboardStats()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const stats: DashboardStats = data?.stats ?? {};

  const statCards = [
    {
      label: 'Active Visitors',
      value: stats.activeVisitors ?? 0,
      sub: `${stats.todayVisitorLogs ?? 0} checked in today`,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-500/10',
    },
    {
      label: 'Open Incidents',
      value: stats.openIncidents ?? 0,
      sub: `${stats.todayIncidents ?? 0} reported today`,
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50 dark:bg-red-500/10',
    },
    {
      label: 'Patrol Routes',
      value: stats.patrolRoutes ?? 0,
      sub: `${stats.todayPatrolLogs ?? 0} checkpoints logged today`,
      icon: MapPin,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    },
    {
      label: 'Total Incidents',
      value: stats.totalIncidents ?? 0,
      sub: 'All time',
      icon: ClipboardList,
      color: 'text-slate-600',
      bg: 'bg-slate-100 dark:bg-slate-500/10',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center border border-blue-200 dark:border-blue-500/20">
          <Shield className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Security Dashboard</h1>
          <p className="text-sm text-slate-500">Real-time overview of access, incidents and patrols</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-5"
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${card.bg}`}>
                <Icon className={`w-5 h-5 ${card.color}`} />
              </div>
              {loading ? (
                <div className="h-8 w-16 rounded bg-slate-100 dark:bg-white/5 animate-pulse mb-1" />
              ) : (
                <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{card.value}</div>
              )}
              <div className="text-[12px] font-semibold text-slate-600 dark:text-slate-400">{card.label}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{card.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Two columns: Recent Incidents + Recent Access */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Incidents */}
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-white/10">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="font-semibold text-slate-800 dark:text-white text-sm">Recent Incidents</span>
            </div>
            <a href="/security/incidents" className="text-[12px] text-blue-600 hover:underline font-medium">View all</a>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-white/[0.05]">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-5 py-3 flex gap-3 items-center">
                  <div className="w-16 h-5 rounded bg-slate-100 dark:bg-white/5 animate-pulse" />
                  <div className="flex-1 h-4 rounded bg-slate-100 dark:bg-white/5 animate-pulse" />
                </div>
              ))
            ) : !data?.recentIncidents?.length ? (
              <div className="px-5 py-8 text-center text-slate-400 text-sm">No incidents yet</div>
            ) : (
              data.recentIncidents.map((incident: any) => (
                <a
                  key={incident.id}
                  href={`/security/incidents/${incident.id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors"
                >
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${SEVERITY_COLORS[incident.severity] ?? ''}`}
                  >
                    {incident.severity}
                  </span>
                  <span className="text-sm text-slate-700 dark:text-slate-300 flex-1 truncate">{incident.title}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[incident.status] ?? ''}`}>
                    {incident.status.replace(/_/g, ' ')}
                  </span>
                </a>
              ))
            )}
          </div>
        </div>

        {/* Recent Access */}
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-white/10">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <span className="font-semibold text-slate-800 dark:text-white text-sm">Recent Access Events</span>
            </div>
            <a href="/security/access-log" className="text-[12px] text-blue-600 hover:underline font-medium">View all</a>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-white/[0.05]">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-5 py-3 flex gap-3 items-center">
                  <div className="w-24 h-4 rounded bg-slate-100 dark:bg-white/5 animate-pulse" />
                  <div className="flex-1 h-4 rounded bg-slate-100 dark:bg-white/5 animate-pulse" />
                </div>
              ))
            ) : !data?.recentAccess?.length ? (
              <div className="px-5 py-8 text-center text-slate-400 text-sm">No access events today</div>
            ) : (
              data.recentAccess.map((log: any) => {
                const visitor = log.registration?.visitor;
                const node = log.registration?.propertyNode;
                const isActive = log.checkInTime && !log.checkOutTime;
                return (
                  <div key={log.id} className="flex items-center gap-3 px-5 py-3">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                        {visitor?.firstName} {visitor?.lastName}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">{node?.name}</div>
                    </div>
                    <div className="text-[11px] text-slate-500 flex-shrink-0">
                      {isActive ? (
                        <span className="text-green-600 font-semibold">Inside</span>
                      ) : (
                        <span>Checked out</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
