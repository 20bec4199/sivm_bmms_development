'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3, MapPin, Car, Building, Activity,
  Calendar, AlertTriangle, Sliders, ShieldCheck,
} from 'lucide-react';

interface SmartiParkNavProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  slotsCount?: number;
  areasCount?: number;
  violationsCount?: number;
  actions?: React.ReactNode;
}

const IN_PAGE_TABS = [
  { id: 'dashboard',    label: 'Dashboard', icon: BarChart3 },
  { id: 'map',          label: 'Map View',  icon: MapPin },
  { id: 'slots',        label: 'Bays',      icon: Car,          countKey: 'slots'      },
  { id: 'areas',        label: 'Zones',     icon: Building,     countKey: 'areas'      },
  { id: 'sessions',     label: 'Sessions',  icon: Activity                              },
  { id: 'reservations', label: 'Bookings',  icon: Calendar                              },
  { id: 'violations',   label: 'Violations',icon: AlertTriangle, countKey: 'violations', danger: true },
  { id: 'config',       label: 'Settings',  icon: Sliders                               },
] as const;

export function SmartiParkNav({
  activeTab,
  onTabChange,
  slotsCount = 0,
  areasCount = 0,
  violationsCount = 0,
  actions,
}: SmartiParkNavProps) {
  const pathname = usePathname();
  const isGatePage = pathname.includes('/gate');

  const counts: Record<string, number> = {
    slots: slotsCount,
    areas: areasCount,
    violations: violationsCount,
  };

  return (
    <div className="w-full space-y-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all">
      {/* Brand & Action Header Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-0.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 flex items-center justify-center shadow-md shadow-indigo-600/30 flex-shrink-0">
            <Car className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white uppercase tracking-wider">
                SmartiPark
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800">
                Operations
              </span>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Live</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              {isGatePage ? 'Real-time Gate & Barrier Console' : 'Multi-zone parking operations, visual telemetry & permits'}
            </p>
          </div>
        </div>

        {/* Contextual actions slot */}
        {actions && (
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {actions}
          </div>
        )}
      </div>

      {/* Structured horizontal tab bar */}
      <div className="flex items-center gap-1 p-1.5 bg-slate-100/90 dark:bg-slate-800/80 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 overflow-x-auto scrollbar-none">
        {IN_PAGE_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = !isGatePage && activeTab === tab.id;
          const countKey = (tab as any).countKey as string | undefined;
          const count = countKey ? counts[countKey] : 0;
          const isDanger = !!(tab as any).danger;

          const badge = count > 0 ? (
            <span className={`ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
              isDanger ? 'bg-rose-500 text-white' : isActive
                ? 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}>{count}</span>
          ) : null;

          if (isGatePage) {
            return (
              <Link key={tab.id} href={`/organization/parking?tab=${tab.id}`}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap text-slate-500 hover:text-slate-800 hover:bg-white dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-700 transition-all">
                <Icon className="w-3.5 h-3.5" />{tab.label}{badge}
              </Link>
            );
          }

          return (
            <button key={tab.id} onClick={() => onTabChange?.(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-sm border border-slate-200/80 dark:border-slate-600'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-white/60 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-700/50'
              }`}>
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : ''}`} />
              {tab.label}{badge}
            </button>
          );
        })}

        <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1 flex-shrink-0" />

        <Link href="/organization/parking/gate"
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
            isGatePage
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
              : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60'
          }`}>
          <ShieldCheck className="w-3.5 h-3.5" />
          Gate Terminal
        </Link>
      </div>
    </div>
  );
}
