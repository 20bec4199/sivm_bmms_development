'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ShieldCheck, ShieldAlert, Clock, AlertTriangle, CheckCircle2, TrendingUp, Activity } from 'lucide-react';

interface ComplianceStats {
  totalScheduled?: number;
  onTime?: number;
  overdue?: number;
  failed?: number;
  skipped?: number;
  completionRate?: number;
}

interface ComplianceScoreProps {
  score?: number;
  stats?: ComplianceStats;
  size?: 'sm' | 'md' | 'lg';
  showBreakdown?: boolean;
}

export const ComplianceScore: React.FC<ComplianceScoreProps> = ({
  score = 96,
  stats = { totalScheduled: 50, onTime: 48, overdue: 1, failed: 1, skipped: 0 },
  size = 'md',
  showBreakdown = false
}) => {
  const finalScore = Math.round(score ?? (stats.totalScheduled ? ((stats.onTime || 0) / stats.totalScheduled) * 100 : 100));

  let colorScheme = 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
  let Icon = ShieldCheck;
  let label = 'EXCELLENT COMPLIANCE';

  if (finalScore < 75) {
    colorScheme = 'text-red-700 bg-red-50 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800';
    Icon = ShieldAlert;
    label = 'CRITICAL ATTENTION REQUIRED';
  } else if (finalScore < 90) {
    colorScheme = 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
    Icon = AlertTriangle;
    label = 'MODERATE DEVIATION';
  }

  if (size === 'sm') {
    return (
      <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-black border ${colorScheme}`}>
        <Icon size={13} />
        <span>{finalScore}% Compliant</span>
      </span>
    );
  }

  return (
    <div className={`rounded-2xl border p-4 transition-all ${colorScheme}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 shadow-xs">
            <Icon size={22} className={finalScore >= 90 ? 'text-emerald-600' : 'text-amber-500'} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest block opacity-75">{label}</span>
            <span className="text-2xl font-black">{finalScore}% Regimen Score</span>
          </div>
        </div>
      </div>

      {showBreakdown && stats && (
        <div className="mt-3 pt-3 border-t border-current/20 grid grid-cols-4 gap-2 text-center text-xs">
          <div>
            <span className="block font-bold opacity-75 text-[10px]">On-Time</span>
            <span className="font-black text-sm">{stats.onTime || 0}</span>
          </div>
          <div>
            <span className="block font-bold opacity-75 text-[10px]">Due Soon</span>
            <span className="font-black text-sm">{stats.totalScheduled || 0}</span>
          </div>
          <div>
            <span className="block font-bold opacity-75 text-[10px]">Overdue</span>
            <span className="font-black text-sm text-amber-600 dark:text-amber-400">{stats.overdue || 0}</span>
          </div>
          <div>
            <span className="block font-bold opacity-75 text-[10px]">Failed</span>
            <span className="font-black text-sm text-red-600 dark:text-red-400">{stats.failed || 0}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export const MaintenanceStatsCard: React.FC<{ title: string; value: string | number; icon: any; color?: string; change?: string }> = ({
  title, value, icon: Icon, color = 'indigo', change
}) => (
  <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-sm transition-all">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">{title}</p>
        <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">{value}</h3>
        {change && (
          <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center">
            <TrendingUp size={12} className="mr-1 inline" /> {change}
          </p>
        )}
      </div>
      <div className={`p-3 rounded-2xl bg-${color}-50 dark:bg-${color}-950/40 text-${color}-600 dark:text-${color}-400 shadow-2xs`}>
        <Icon size={22} />
      </div>
    </div>
  </div>
);

export const LifecycleHealthCard: React.FC<{ assetName: string; lifespanYears?: number; installationDate?: string; warrantyExpiry?: string }> = ({
  assetName = 'Chiller Sub-unit #104', lifespanYears = 10, installationDate = '2018-05-15', warrantyExpiry = '2026-08-30'
}) => (
  <div className="p-4 bg-purple-50/70 dark:bg-purple-950/30 rounded-2xl border border-purple-200 dark:border-purple-800 flex items-center justify-between">
    <div className="flex items-center space-x-3">
      <div className="p-2.5 rounded-xl bg-purple-600 text-white shadow-2xs">
        <Activity size={20} />
      </div>
      <div>
        <h5 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{assetName} Lifecycle Assessment</h5>
        <p className="text-xs text-slate-500 font-mono">Installed: {installationDate} • Rated: {lifespanYears} yrs</p>
      </div>
    </div>
    <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900 dark:text-amber-100 font-extrabold text-xs px-3 py-1">
      ⚠️ Warranty Expiring Soon ({warrantyExpiry})
    </Badge>
  </div>
);
