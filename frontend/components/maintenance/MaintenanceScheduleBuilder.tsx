'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Clock, Calendar, Repeat, Moon, Sun, Zap, ShieldCheck } from 'lucide-react';

export interface ScheduleConfig {
  frequency: string; // DAILY, WEEKLY, BIWEEKLY, MONTHLY, QUARTERLY, HALF_YEARLY, ANNUALLY, CUSTOM
  customIntervalNumber?: number;
  customIntervalUnit?: 'DAYS' | 'WEEKS' | 'MONTHS' | 'YEARS';
  selectedWeekdays?: string[]; // ['Monday', 'Wednesday', 'Friday']
  monthlyRule?: 'SPECIFIC_DATE' | 'FIRST_MONDAY' | 'LAST_FRIDAY' | 'FIRST_DAY' | 'LAST_DAY';
  specificDayOfMonth?: number;
  annualMonth?: string;
  annualDay?: number;
  startDate: string;
  endDate?: string;
  timeZone: string;
  maintenanceWindow: {
    startTime: string; // e.g. "22:00"
    endTime: string;   // e.g. "02:00"
    isOvernight?: boolean;
  };
  gracePeriodDays: number;
}

interface MaintenanceScheduleBuilderProps {
  value: ScheduleConfig;
  onChange: (config: ScheduleConfig) => void;
}

export const MaintenanceScheduleBuilder: React.FC<MaintenanceScheduleBuilderProps> = ({
  value,
  onChange
}) => {
  const [config, setConfig] = useState<ScheduleConfig>(value || {
    frequency: 'MONTHLY',
    startDate: new Date().toISOString().split('T')[0],
    timeZone: 'UTC+05:30 (IST / Local)',
    maintenanceWindow: { startTime: '09:00', endTime: '12:00', isOvernight: false },
    gracePeriodDays: 3,
    monthlyRule: 'SPECIFIC_DATE',
    specificDayOfMonth: 1,
    selectedWeekdays: ['Monday']
  });

  // Calculate overnight status across midnight whenever hours change
  useEffect(() => {
    const startHour = parseInt(config.maintenanceWindow?.startTime?.split(':')[0] || '0', 10);
    const endHour = parseInt(config.maintenanceWindow?.endTime?.split(':')[0] || '0', 10);
    const isOvernight = startHour > endHour || (startHour === endHour && parseInt(config.maintenanceWindow?.startTime?.split(':')[1] || '0', 10) > parseInt(config.maintenanceWindow?.endTime?.split(':')[1] || '0', 10));

    const newConfig = {
      ...config,
      maintenanceWindow: {
        ...config.maintenanceWindow,
        isOvernight
      }
    };

    if (JSON.stringify(newConfig) !== JSON.stringify(config)) {
      setConfig(newConfig);
      onChange(newConfig);
    }
  }, [config.maintenanceWindow?.startTime, config.maintenanceWindow?.endTime]);

  const updateField = (field: keyof ScheduleConfig, val: any) => {
    const updated = { ...config, [field]: val };
    setConfig(updated);
    onChange(updated);
  };

  const updateWindow = (field: string, val: string) => {
    const updated = {
      ...config,
      maintenanceWindow: {
        ...config.maintenanceWindow,
        [field]: val
      }
    };
    setConfig(updated);
    onChange(updated);
  };

  const handleWeekdayToggle = (day: string) => {
    const current = config.selectedWeekdays || [];
    const updatedDays = current.includes(day)
      ? current.filter(d => d !== day)
      : [...current, day];
    updateField('selectedWeekdays', updatedDays);
  };

  const frequencies = [
    { id: 'DAILY', label: 'Daily', desc: 'Every 24 hours' },
    { id: 'WEEKLY', label: 'Weekly', desc: 'Selected weekdays' },
    { id: 'BIWEEKLY', label: 'Bi-Weekly', desc: 'Every 14 days' },
    { id: 'MONTHLY', label: 'Monthly', desc: 'Once every calendar month' },
    { id: 'QUARTERLY', label: 'Quarterly', desc: 'Every 3 months' },
    { id: 'HALF_YEARLY', label: 'Half-Yearly', desc: 'Every 6 months' },
    { id: 'ANNUALLY', label: 'Annually', desc: 'Yearly inspection audit' },
    { id: 'CUSTOM', label: 'Custom Interval', desc: 'Every X Days/Weeks' }
  ];

  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="space-y-6 bg-slate-50/70 dark:bg-slate-800/40 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 animate-in fade-in duration-200">
      <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-700/60 pb-3">
        <div>
          <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center">
            <Repeat size={16} className="mr-2 text-indigo-600 dark:text-indigo-400" />
            Recurring Schedule & Maintenance Window Engine
          </h4>
          <p className="text-xs text-slate-500">Configure recurring task generation intervals, overnight servicing slots, and execution grace periods.</p>
        </div>
        <Badge className="bg-indigo-600 text-white font-mono text-xs px-3 py-1">
          {config.frequency} REGIMEN
        </Badge>
      </div>

      {/* Frequency Cards Grid */}
      <div>
        <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
          1. Select Recurrence Frequency *
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-2.5">
          {frequencies.map((f) => {
            const isSelected = config.frequency === f.id;
            return (
              <div
                key={f.id}
                onClick={() => updateField('frequency', f.id)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-white dark:bg-slate-900 border-indigo-600 text-indigo-600 dark:text-indigo-400 shadow-sm scale-102 ring-1 ring-indigo-500/50'
                    : 'bg-white/60 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <span className="block text-xs font-black">{f.label}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">{f.desc}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom Recurrence Inputs */}
      {config.frequency === 'CUSTOM' && (
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-indigo-100 dark:border-indigo-900 flex flex-col sm:flex-row gap-4 items-center">
          <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Repeat inspection routine every:</span>
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <input
              type="number"
              min="1"
              max="365"
              value={config.customIntervalNumber || 10}
              onChange={(e) => updateField('customIntervalNumber', parseInt(e.target.value, 10))}
              className="w-20 h-10 px-3 text-xs font-black text-center rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
            />
            <select
              value={config.customIntervalUnit || 'DAYS'}
              onChange={(e) => updateField('customIntervalUnit', e.target.value as any)}
              className="h-10 px-3 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
            >
              <option value="DAYS">Days</option>
              <option value="WEEKS">Weeks</option>
              <option value="MONTHS">Months</option>
              <option value="YEARS">Years</option>
            </select>
          </div>
        </div>
      )}

      {/* Weekly Weekday Selector */}
      {config.frequency === 'WEEKLY' && (
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-2">
            Select Active Days of the Week:
          </label>
          <div className="flex flex-wrap gap-2">
            {weekdays.map((day) => {
              const active = (config.selectedWeekdays || []).includes(day);
              return (
                <button
                  type="button"
                  key={day}
                  onClick={() => handleWeekdayToggle(day)}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                    active
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Monthly Rules Selector */}
      {config.frequency === 'MONTHLY' && (
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1">
              Monthly Scheduling Rule:
            </label>
            <select
              value={config.monthlyRule || 'SPECIFIC_DATE'}
              onChange={(e) => updateField('monthlyRule', e.target.value as any)}
              className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
            >
              <option value="SPECIFIC_DATE">Specific Day of Month (e.g. 1st or 15th)</option>
              <option value="FIRST_MONDAY">First Monday of the Month</option>
              <option value="LAST_FRIDAY">Last Friday of the Month</option>
              <option value="FIRST_DAY">First Day of the Month</option>
              <option value="LAST_DAY">Last Day of the Month</option>
            </select>
          </div>

          {config.monthlyRule === 'SPECIFIC_DATE' && (
            <div>
              <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1">
                Day of Month (1 - 28):
              </label>
              <input
                type="number"
                min="1"
                max="28"
                value={config.specificDayOfMonth || 1}
                onChange={(e) => updateField('specificDayOfMonth', parseInt(e.target.value, 10))}
                className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
              />
            </div>
          )}
        </div>
      )}

      {/* Maintenance Window (Section 7) & Grace Period */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-200/80 dark:border-slate-700/60">
        <div className="md:col-span-2 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 flex items-center">
              <Clock size={15} className="mr-1.5 text-indigo-600 dark:text-indigo-400" />
              Servicing & Maintenance Window Hours
            </span>
            {config.maintenanceWindow?.isOvernight ? (
              <Badge variant="outline" className="bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-900 dark:text-purple-100 font-extrabold text-[11px] flex items-center">
                <Moon size={12} className="mr-1 inline text-purple-700 dark:text-purple-300" /> Overnight Window (Crosses Midnight)
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 font-bold text-[10px] flex items-center">
                <Sun size={12} className="mr-1 inline text-amber-500" /> Standard Daytime Window
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Start Time (24h Format):</label>
              <input
                type="time"
                value={config.maintenanceWindow?.startTime || '22:00'}
                onChange={(e) => updateWindow('startTime', e.target.value)}
                className="w-full h-10 px-3 text-xs font-extrabold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">End Time (24h Format):</label>
              <input
                type="time"
                value={config.maintenanceWindow?.endTime || '02:00'}
                onChange={(e) => updateWindow('endTime', e.target.value)}
                className="w-full h-10 px-3 text-xs font-extrabold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Grace Period & Dates */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3">
          <div>
            <label className="block text-xs font-extrabold text-slate-900 dark:text-slate-100 mb-1 flex items-center">
              <ShieldCheck size={14} className="mr-1.5 text-emerald-600" />
              Execution Grace Period (Days)
            </label>
            <p className="text-[10px] text-slate-400 mb-2">Buffer days allowed before tagging schedule as Overdue in compliance score.</p>
            <input
              type="number"
              min="0"
              max="30"
              value={config.gracePeriodDays ?? 3}
              onChange={(e) => updateField('gracePeriodDays', parseInt(e.target.value, 10) || 0)}
              className="w-full h-10 px-3 text-xs font-black rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Next Initial Due Date:</label>
            <input
              type="date"
              value={config.startDate}
              onChange={(e) => updateField('startDate', e.target.value)}
              className="w-full h-9.5 px-2.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Also export as RecurrenceBuilder alias for architectural compatibility
export const RecurrenceBuilder = MaintenanceScheduleBuilder;
