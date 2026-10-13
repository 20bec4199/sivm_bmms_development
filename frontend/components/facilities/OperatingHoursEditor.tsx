'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Clock, Plus, Trash2, Calendar, Check, X, ShieldAlert, Zap } from 'lucide-react';

export interface TimeRange {
  start: string;
  end: string;
  label?: string; // e.g. Morning shift, Evening shift
}

export interface DaySchedule {
  day: string; // Monday, Tuesday, etc.
  enabled: boolean;
  ranges: TimeRange[];
}

interface OperatingHoursEditorProps {
  schedule?: DaySchedule[];
  onChange: (newSchedule: DaySchedule[]) => void;
}

const defaultDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const defaultRanges = [{ start: '08:00', end: '20:00', label: 'All-day access' }];

export const OperatingHoursEditor: React.FC<OperatingHoursEditorProps> = ({ schedule, onChange }) => {
  const [activeSchedule, setActiveSchedule] = useState<DaySchedule[]>(() => {
    if (schedule && schedule.length === 7) return schedule;
    return defaultDays.map(day => ({
      day,
      enabled: day !== 'Sunday',
      ranges: day === 'Sunday' ? [{ start: '10:00', end: '16:00', label: 'Weekend restricted' }] : [...defaultRanges]
    }));
  });

  const updateDay = (idx: number, newDay: DaySchedule) => {
    const next = [...activeSchedule];
    next[idx] = newDay;
    setActiveSchedule(next);
    onChange(next);
  };

  const addRange = (dayIdx: number) => {
    const d = activeSchedule[dayIdx];
    const newRange: TimeRange = { start: '16:00', end: '21:00', label: 'Evening slot' };
    updateDay(dayIdx, { ...d, ranges: [...d.ranges, newRange] });
  };

  const removeRange = (dayIdx: number, rangeIdx: number) => {
    const d = activeSchedule[dayIdx];
    updateDay(dayIdx, { ...d, ranges: d.ranges.filter((_, i) => i !== rangeIdx) });
  };

  const handleRangeChange = (dayIdx: number, rangeIdx: number, field: keyof TimeRange, value: string) => {
    const d = activeSchedule[dayIdx];
    const updatedRanges = d.ranges.map((r, idx) => idx === rangeIdx ? { ...r, [field]: value } : r);
    updateDay(dayIdx, { ...d, ranges: updatedRanges });
  };

  const applyToAllWeekdays = () => {
    const mon = activeSchedule[0];
    const next = activeSchedule.map(d => {
      if (['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(d.day)) {
        return { ...d, enabled: mon.enabled, ranges: JSON.parse(JSON.stringify(mon.ranges)) };
      }
      return d;
    });
    setActiveSchedule(next);
    onChange(next);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div>
          <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center">
            <Clock size={16} className="mr-2 text-indigo-600 dark:text-indigo-400" />
            Visual Weekly Operating Hours & Split-Shifts
          </h4>
          <p className="text-xs text-slate-500">Configure distinct opening hours for each day and multiple non-contiguous time ranges (e.g. Morning 06:00-10:00 and Evening 16:00-21:00).</p>
        </div>
        <Button onClick={applyToAllWeekdays} variant="outline" size="sm" className="text-indigo-600 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-xs shrink-0 font-semibold">
          <Zap size={13} className="mr-1 text-indigo-500" /> Apply Monday to All Weekdays
        </Button>
      </div>

      <div className="space-y-3">
        {activeSchedule.map((dayItem, idx) => (
          <div 
            key={dayItem.day} 
            className={`p-4 rounded-xl border transition-all ${
              dayItem.enabled 
                ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs' 
                : 'bg-slate-50 dark:bg-slate-800/20 border-dashed border-slate-300 dark:border-slate-800 opacity-60'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Day toggle and title */}
              <div className="flex items-center space-x-3 w-44 shrink-0">
                <input
                  type="checkbox"
                  id={`day_toggle_${dayItem.day}`}
                  checked={dayItem.enabled}
                  onChange={(e) => updateDay(idx, { ...dayItem, enabled: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor={`day_toggle_${dayItem.day}`} className="font-extrabold text-sm text-slate-900 dark:text-slate-100 cursor-pointer select-none flex items-center justify-between w-full">
                  <span>{dayItem.day}</span>
                  <span className="text-[10px] uppercase font-mono text-slate-400 font-normal">
                    {dayItem.enabled ? 'Open' : 'Closed'}
                  </span>
                </label>
              </div>

              {/* Time Ranges List */}
              <div className="flex-1 space-y-2">
                {!dayItem.enabled ? (
                  <span className="text-xs font-semibold text-slate-400 italic py-1 block">Facility closed on {dayItem.day}s</span>
                ) : (
                  dayItem.ranges.map((range, rIdx) => (
                    <div key={rIdx} className="flex flex-wrap items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                      <div className="flex items-center space-x-1.5 font-mono text-xs">
                        <span className="font-bold text-slate-600 dark:text-slate-400">From:</span>
                        <input
                          type="time"
                          value={range.start}
                          onChange={(e) => handleRangeChange(idx, rIdx, 'start', e.target.value)}
                          className="h-8 px-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <span className="font-bold text-slate-600 dark:text-slate-400 ml-1">To:</span>
                        <input
                          type="time"
                          value={range.end}
                          onChange={(e) => handleRangeChange(idx, rIdx, 'end', e.target.value)}
                          className="h-8 px-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      <input
                        type="text"
                        placeholder="Range label (e.g. Morning Gym, Evening Swim)"
                        value={range.label || ''}
                        onChange={(e) => handleRangeChange(idx, rIdx, 'label', e.target.value)}
                        className="h-8 px-2 flex-1 min-w-[140px] text-[11px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />

                      {dayItem.ranges.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRange(idx, rIdx)}
                          className="h-7 w-7 p-0 text-red-500 hover:bg-red-100 dark:hover:bg-red-950/50 rounded"
                        >
                          <Trash2 size={13} />
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Add Split Range Action */}
              {dayItem.enabled && (
                <div className="shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addRange(idx)}
                    className="h-8 text-[11px] font-bold text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 px-2.5"
                  >
                    <Plus size={13} className="mr-1 text-indigo-600 dark:text-indigo-400" /> Split Shift
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
