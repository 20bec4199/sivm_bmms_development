'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Car, Layers, AlertTriangle, ArrowUpRight, ArrowDownRight,
  DollarSign, CheckCircle2, ShieldAlert, Zap, Clock, Activity,
  BarChart3, RefreshCw, Sparkles, Building2
} from 'lucide-react';
import { useGetParkingAnalyticsQuery } from '@/services/parkingApi';

export function ParkoraAnalytics({ onNavigateTab }: { onNavigateTab?: (tab: string) => void }) {
  const { data: analyticsData, isLoading, refetch } = useGetParkingAnalyticsQuery({});
  const a = analyticsData || {};

  const totalSlots = a.totalSlots || 0;
  const occupied = a.occupied || 0;
  const available = a.available || 0;
  const reserved = a.reserved || 0;
  const blocked = a.blocked || 0;
  const maintenance = a.maintenance || 0;
  const occupancyRate = a.occupancyRate || 0;

  const todayEntries = a.todayEntries || 0;
  const todayExits = a.todayExits || 0;
  const todayRevenue = a.todayRevenue || 0;
  const activeViolations = a.activeViolations || 0;
  const activeSessions = a.activeSessionsCount || 0;
  const totalZones = a.totalZones || 0;

  return (
    <div className="space-y-6">
      {/* Top Operations Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">SmartiPark · Operations Dashboard</h2>
              <p className="text-xs text-slate-400">
                Real-time spatial telemetry, occupancy pressure, turnover throughput, and financial performance.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors border border-slate-700"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Live Metrics
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Facility Occupancy */}
        <Card className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Car className="w-6 h-6" />
              </div>
              <Badge className={`text-xs font-bold ${
                occupancyRate > 85 ? 'bg-rose-100 text-rose-800 border-rose-200' :
                occupancyRate > 60 ? 'bg-amber-100 text-amber-800 border-amber-200' :
                'bg-emerald-100 text-emerald-800 border-emerald-200'
              }`}>
                {occupancyRate}% Load
              </Badge>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Live Occupancy</span>
              <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {occupied} <span className="text-base font-normal text-slate-400">/ {totalSlots} bays</span>
              </div>
              <div className="text-xs text-slate-500 pt-1 flex items-center gap-1">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{available} bays</span> available right now
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Today's Gate Flow */}
        <Card className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Activity className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                <ArrowUpRight className="w-4 h-4" />
                <span>Active Feed</span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Today's Gate Flow</span>
              <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {todayEntries} <span className="text-base font-normal text-slate-400">In</span> • {todayExits} <span className="text-base font-normal text-slate-400">Out</span>
              </div>
              <div className="text-xs text-slate-500 pt-1">
                {activeSessions} vehicles currently parked in stalls
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Tariff & Fee Collections */}
        <Card className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <DollarSign className="w-6 h-6" />
              </div>
              <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs">
                Real-Time
              </Badge>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Revenue Collected</span>
              <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                ₹{todayRevenue.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 pt-1">
                Visitor parking & overstay tariff receipts
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Infractions & Violations */}
        <Card className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200/60 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              {activeViolations > 0 ? (
                <Badge className="bg-rose-100 text-rose-800 border-rose-200 text-xs">
                  Action Required
                </Badge>
              ) : (
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs">
                  All Clear
                </Badge>
              )}
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Active Infractions</span>
              <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {activeViolations}
              </div>
              <div className="text-xs text-slate-500 pt-1">
                Unauthorized stalls & overstays under review
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visual Capacity & Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Bay Allocation Breakdown */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6 shadow-sm">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Spatial Capacity Distribution</h3>
            <p className="text-xs text-slate-500">Live operational status breakdown across all parking zones.</p>
          </div>

          {/* Stacked Progress Bar */}
          <div className="w-full h-5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex shadow-inner">
            {totalSlots > 0 ? (
              <>
                <div
                  style={{ width: `${(available / totalSlots) * 100}%` }}
                  className="bg-emerald-500 transition-all"
                  title={`Available: ${available}`}
                />
                <div
                  style={{ width: `${(occupied / totalSlots) * 100}%` }}
                  className="bg-indigo-600 transition-all"
                  title={`Occupied: ${occupied}`}
                />
                <div
                  style={{ width: `${(reserved / totalSlots) * 100}%` }}
                  className="bg-purple-500 transition-all"
                  title={`Reserved: ${reserved}`}
                />
                <div
                  style={{ width: `${(blocked / totalSlots) * 100}%` }}
                  className="bg-amber-500 transition-all"
                  title={`Blocked: ${blocked}`}
                />
                <div
                  style={{ width: `${(maintenance / totalSlots) * 100}%` }}
                  className="bg-rose-500 transition-all"
                  title={`Maintenance: ${maintenance}`}
                />
              </>
            ) : (
              <div className="w-full bg-slate-200 dark:bg-slate-700" />
            )}
          </div>

          {/* Status Metric Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/50">
              <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                Available
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white mt-1">{available}</div>
              <div className="text-[10px] text-slate-400">Ready for entry</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/50">
              <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-400 font-bold text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" />
                Occupied
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white mt-1">{occupied}</div>
              <div className="text-[10px] text-slate-400">Parked vehicles</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/50">
              <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-400 font-bold text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
                Reserved
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white mt-1">{reserved}</div>
              <div className="text-[10px] text-slate-400">Allocated / Booked</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/50">
              <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-bold text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                Blocked
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white mt-1">{blocked}</div>
              <div className="text-[10px] text-slate-400">Admin restricted</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/50">
              <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-bold text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                Maintenance
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white mt-1">{maintenance}</div>
              <div className="text-[10px] text-slate-400">Out of service</div>
            </div>
          </div>
        </div>

        {/* Right Col: Quick Facility Summary & Action Links */}
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5 shadow-sm">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Facility Topology</h3>
            <p className="text-xs text-slate-500">Summary configuration of active zones and gates.</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-xs">
              <span className="text-slate-500">Configured Parking Zones:</span>
              <span className="font-bold text-slate-900 dark:text-white">{totalZones} Zones</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-xs">
              <span className="text-slate-500">Total Spatial Bays:</span>
              <span className="font-bold text-slate-900 dark:text-white">{totalSlots} Stalls</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-xs">
              <span className="text-slate-500">Active Gate Terminals:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Online
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
            {onNavigateTab && (
              <>
                <button
                  onClick={() => onNavigateTab('map')}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 font-semibold text-xs transition-colors flex items-center justify-between"
                >
                  <span>Open Interactive Visual Map</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onNavigateTab('sessions')}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 font-semibold text-xs transition-colors flex items-center justify-between"
                >
                  <span>View Live Parked Sessions</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
