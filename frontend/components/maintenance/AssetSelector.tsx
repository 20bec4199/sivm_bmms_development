'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { useGetAssetsQuery, useGetAssetCategoriesQuery } from '@/services/assetsApi';
import { Wrench, Check, Search, ShieldAlert, AlertTriangle, Calendar, Cpu, Clock } from 'lucide-react';

interface AssetSelectorProps {
  selectedIds: string[];
  onChange: (ids: string[], selectedAssets: any[]) => void;
  targetCategory?: string;
  onCategoryChange?: (category: string) => void;
}

export const AssetSelector: React.FC<AssetSelectorProps> = ({
  selectedIds = [],
  onChange,
  targetCategory = 'ALL',
  onCategoryChange
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>(targetCategory || 'ALL');

  const { data: assetsRes, isLoading: loadingAssets } = useGetAssetsQuery({});
  const { data: categoriesRes } = useGetAssetCategoriesQuery({});

  const assets = Array.isArray(assetsRes) ? assetsRes : (assetsRes?.data || []);
  const assetCategories = Array.isArray(categoriesRes) ? categoriesRes : (categoriesRes?.data || []);

  const availableCategories = [
    'ALL',
    ...Array.from(new Set([
      ...assetCategories.map((c: any) => c.name),
      ...assets.map((a: any) => a.category?.name || a.category || 'Hardware Equipment')
    ]))
  ];

  const filteredAssets = assets.filter((a: any) => {
    const catName = a.category?.name || a.category || 'Hardware Equipment';
    const matchesSearch = a.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          a.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          a.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || catName === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleToggle = (id: string) => {
    const isSelected = selectedIds.includes(id);
    const newIds = isSelected ? selectedIds.filter(item => item !== id) : [...selectedIds, id];
    const selectedObjects = assets.filter((a: any) => newIds.includes(a.id));
    onChange(newIds, selectedObjects);
  };

  const handleCategoryChange = (cat: string) => {
    setCategoryFilter(cat);
    if (onCategoryChange && cat !== 'ALL') onCategoryChange(cat);
  };

  // Helper for lifecycle health calculation (Section 23)
  const getLifecycleStatus = (asset: any) => {
    const now = new Date();
    let alertText = null;
    let alertColor = 'text-green-600 bg-green-50 dark:bg-green-950/40 dark:text-green-300';

    if (asset.warrantyExpiry) {
      const expDate = new Date(asset.warrantyExpiry);
      const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
      if (diffDays <= 0) {
        alertText = '⚠️ Warranty Expired';
        alertColor = 'text-red-600 bg-red-50 dark:bg-red-950/40 dark:text-red-300';
      } else if (diffDays <= 45) {
        alertText = `⏳ Warranty expires in ${diffDays} days`;
        alertColor = 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300';
      }
    }

    if (asset.expectedLifespanYears && asset.purchaseDate) {
      const pDate = new Date(asset.purchaseDate);
      const ageYears = (now.getTime() - pDate.getTime()) / (1000 * 3600 * 24 * 365.25);
      if (ageYears >= asset.expectedLifespanYears) {
        alertText = '🚨 Asset replacement recommended';
        alertColor = 'text-purple-600 bg-purple-50 dark:bg-purple-950/40 dark:text-purple-300';
      }
    }

    return { alertText, alertColor };
  };

  return (
    <div className="space-y-4 bg-slate-50/70 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-700/60 pb-3">
        <div>
          <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center">
            <Cpu size={16} className="mr-2 text-indigo-600 dark:text-indigo-400" />
            Equipment & Asset Registry Linking
          </h4>
          <p className="text-xs text-slate-500">Attach recurring inspection routines to specific chillers, elevators, fire pumps, or electrical subpanels.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 font-bold text-xs px-3 py-1">
            {selectedIds.length} Linked Asset{selectedIds.length !== 1 ? 's' : ''}
          </Badge>
          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([], [])}
              className="text-[11px] font-extrabold text-red-500 hover:text-red-700 underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search controls */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search assets by name, serial number, or physical room..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-9.5 pl-9 pr-3 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="w-full sm:w-auto flex justify-end">
          <select
            value={categoryFilter}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="w-full sm:w-auto h-9.5 px-3 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {availableCategories.map((c, i) => (
              <option key={i} value={c as string}>{c as string === 'ALL' ? 'All Asset Subsystems' : (c as string)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Assets Grid */}
      {loadingAssets ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 py-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 rounded-2xl bg-slate-200/60 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="text-center py-8 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
          <Wrench size={32} className="mx-auto mb-2 text-slate-400" />
          <p className="text-xs font-bold text-slate-600 dark:text-slate-400">No equipment assets found in this catalog view</p>
          <p className="text-[11px] text-slate-400">Add physical machinery in the Asset & Inventory module to track warranties and maintenance histories.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredAssets.map((a: any) => {
            const isSelected = selectedIds.includes(a.id);
            const { alertText, alertColor } = getLifecycleStatus(a);

            return (
              <div
                key={a.id}
                onClick={() => handleToggle(a.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden group ${
                  isSelected
                    ? 'bg-white dark:bg-slate-900 border-purple-600 shadow-sm ring-1 ring-purple-500/50'
                    : 'bg-white/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-2xs'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-0 right-0 w-8 h-8 bg-purple-600 text-white rounded-bl-xl flex items-center justify-center shadow-xs">
                    <Check size={16} />
                  </div>
                )}
                <div>
                  <div className="flex items-center justify-between mb-1.5 pr-6">
                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded">
                      {a.category?.name || a.category || 'Equipment'}
                    </span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                      a.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800'
                    }`}>
                      {a.status || 'ACTIVE'}
                    </span>
                  </div>
                  <h5 className="font-black text-sm text-slate-900 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    {a.name}
                  </h5>
                  <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                    S/N: {a.serialNumber || 'Unassigned'} • 📍 {a.location || 'Central Utility Room'}
                  </p>
                </div>

                <div className="mt-4 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                  {alertText ? (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${alertColor}`}>
                      {alertText}
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-slate-400 flex items-center">
                      <Clock size={12} className="mr-1 inline text-slate-400" />
                      Healthy Lifecycle
                    </span>
                  )}
                  {a.expectedLifespanYears && (
                    <span className="text-[10px] font-bold text-slate-400 font-mono">
                      {a.expectedLifespanYears}y Rated
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
