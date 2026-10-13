'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useGetFacilitiesQuery } from '@/services/facilitiesApi';
import { FacilityCategoryBadge } from '@/components/facilities/FacilityCategoryBadge';
import { FacilityStatusBadge } from '@/components/facilities/FacilityStatusBadge';
import { Building, Check, Search, ShieldAlert, Zap, Wrench, Layers } from 'lucide-react';

interface FacilitySelectorProps {
  selectedIds: string[];
  onChange: (ids: string[], selectedFacilities: any[]) => void;
  autoSyncBlackout?: boolean;
  onBlackoutToggle?: (autoSync: boolean) => void;
}

export const FacilitySelector: React.FC<FacilitySelectorProps> = ({
  selectedIds = [],
  onChange,
  autoSyncBlackout = true,
  onBlackoutToggle
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');

  const { data: facilitiesRes, isLoading } = useGetFacilitiesQuery({});
  const facilities = Array.isArray(facilitiesRes) ? facilitiesRes : (facilitiesRes?.data || []);

  const categories = ['ALL', ...Array.from(new Set(facilities.map((f: any) => f.category || 'Recreation')))];

  const filteredFacilities = facilities.filter((f: any) => {
    const matchesSearch = f.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          f.locationName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          f.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'ALL' || f.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleToggle = (id: string) => {
    const isSelected = selectedIds.includes(id);
    const newIds = isSelected ? selectedIds.filter(item => item !== id) : [...selectedIds, id];
    const selectedObjects = facilities.filter((f: any) => newIds.includes(f.id));
    onChange(newIds, selectedObjects);
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredFacilities.map((f: any) => f.id);
    const uniqueIds = Array.from(new Set([...selectedIds, ...filteredIds]));
    const selectedObjects = facilities.filter((f: any) => uniqueIds.includes(f.id));
    onChange(uniqueIds as string[], selectedObjects);
  };

  const handleClearSelection = () => {
    onChange([], []);
  };

  return (
    <div className="space-y-4 bg-slate-50/70 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-700/60 pb-3">
        <div>
          <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center">
            <Building size={16} className="mr-2 text-indigo-600 dark:text-indigo-400" />
            Dynamic Facility & Amenity Linking
          </h4>
          <p className="text-xs text-slate-500">Bind maintenance regimens directly to physical community resources, swimming pools, clubhouse HVAC, or sports courts.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 font-bold text-xs px-3 py-1">
            {selectedIds.length} Linked Facility{selectedIds.length !== 1 ? 's' : ''}
          </Badge>
          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={handleClearSelection}
              className="text-[11px] font-extrabold text-red-500 hover:text-red-700 underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Automated Facility Blackout Synchronization Card */}
      {onBlackoutToggle && (
        <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-indigo-600 text-white shadow-xs">
              <Zap size={18} />
            </div>
            <div>
              <span className="text-xs font-black text-indigo-950 dark:text-indigo-200 block">
                Automated Resident Booking Blackout Sync (Section 15 & 16)
              </span>
              <span className="text-[11px] text-indigo-700 dark:text-indigo-300 leading-tight">
                When scheduled maintenance becomes active, automatically generate a Facility Maintenance Block to reject resident pass reservations.
              </span>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={autoSyncBlackout} 
              onChange={(e) => onBlackoutToggle(e.target.checked)} 
            />
            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>
      )}

      {/* Filter and Search controls */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search facility catalog by name, code, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-9.5 pl-9 pr-3 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="h-9.5 px-3 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {categories.map((c, i) => (
              <option key={i} value={c as string}>{c as string === 'ALL' ? 'All Categories' : (c as string)}</option>
            ))}
          </select>
          {filteredFacilities.length > 0 && (
            <button
              type="button"
              onClick={handleSelectAllFiltered}
              className="text-xs font-extrabold px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 transition-all whitespace-nowrap"
            >
              Select All ({filteredFacilities.length})
            </button>
          )}
        </div>
      </div>

      {/* Facilities Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 py-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 rounded-2xl bg-slate-200/60 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : filteredFacilities.length === 0 ? (
        <div className="text-center py-8 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
          <Wrench size={32} className="mx-auto mb-2 text-slate-400" />
          <p className="text-xs font-bold text-slate-600 dark:text-slate-400">No community facilities match your criteria</p>
          <p className="text-[11px] text-slate-400">Provision facilities in the Facility Administration module to link recurring schedules.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredFacilities.map((f: any) => {
            const isSelected = selectedIds.includes(f.id);
            const activeBlocksCount = Array.isArray(f.maintenanceBlocks) ? f.maintenanceBlocks.length : 0;

            return (
              <div
                key={f.id}
                onClick={() => handleToggle(f.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden group ${
                  isSelected
                    ? 'bg-white dark:bg-slate-900 border-indigo-600 shadow-sm ring-1 ring-indigo-500/50'
                    : 'bg-white/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-2xs'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-0 right-0 w-8 h-8 bg-indigo-600 text-white rounded-bl-xl flex items-center justify-center shadow-xs">
                    <Check size={16} />
                  </div>
                )}
                <div>
                  <div className="flex items-center space-x-2 mb-2 pr-6">
                    <FacilityCategoryBadge category={f.category} />
                  </div>
                  <h5 className="font-black text-sm text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {f.name}
                  </h5>
                  <p className="text-xs font-semibold text-slate-500 mt-1 flex items-center truncate">
                    📍 {f.locationName || 'Unassigned Node Coordinates'}
                  </p>
                </div>

                <div className="mt-4 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                  <FacilityStatusBadge status={f.status || 'ACTIVE'} />
                  {activeBlocksCount > 0 ? (
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md">
                      ⚠️ {activeBlocksCount} Active Blackouts
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-slate-400">
                      Available
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
