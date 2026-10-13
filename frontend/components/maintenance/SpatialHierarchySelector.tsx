'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Building2, MapPin, Layers, Check, Plus, X, Globe } from 'lucide-react';
import { 
  useGetBuildingsQuery, 
  useGetTowersQuery, 
  useGetFloorsQuery, 
  useGetUnitsQuery 
} from '@/services/organizationApi';

export interface SpatialSelection {
  locationScope: 'PROPERTY' | 'BUILDING' | 'TOWER' | 'FLOOR' | 'UNIT' | 'CUSTOM';
  buildingId?: string;
  towerId?: string;
  floorId?: string;
  unitId?: string;
  spatialNodes?: string[]; // Array of custom node IDs or descriptions when in CUSTOM scope
  locationName: string;
}

interface SpatialHierarchySelectorProps {
  value?: SpatialSelection;
  onChange: (selection: SpatialSelection) => void;
}

export const SpatialHierarchySelector: React.FC<SpatialHierarchySelectorProps> = ({
  value = { locationScope: 'PROPERTY', locationName: 'Entire Property Architecture' },
  onChange
}) => {
  const [scope, setScope] = useState<'PROPERTY' | 'BUILDING' | 'TOWER' | 'FLOOR' | 'UNIT' | 'CUSTOM'>(value.locationScope || 'PROPERTY');
  const [buildingId, setBuildingId] = useState<string>(value.buildingId || '');
  const [towerId, setTowerId] = useState<string>(value.towerId || '');
  const [floorId, setFloorId] = useState<string>(value.floorId || '');
  const [unitId, setUnitId] = useState<string>(value.unitId || '');
  const [customList, setCustomList] = useState<string[]>(value.spatialNodes || []);
  const [customInput, setCustomInput] = useState<string>('');

  const { data: buildingsRes, isLoading: loadingB } = useGetBuildingsQuery({});
  const { data: towersRes, isLoading: loadingT } = useGetTowersQuery({});
  const { data: floorsRes, isLoading: loadingF } = useGetFloorsQuery({});
  const { data: unitsRes, isLoading: loadingU } = useGetUnitsQuery({});

  const buildings = buildingsRes?.data || (Array.isArray(buildingsRes) ? buildingsRes : []);
  const allTowers = towersRes?.data || (Array.isArray(towersRes) ? towersRes : []);
  const allFloors = floorsRes?.data || (Array.isArray(floorsRes) ? floorsRes : []);
  const allUnits = unitsRes?.data || (Array.isArray(unitsRes) ? unitsRes : []);

  // Cascading filters
  const filteredTowers = allTowers.filter((t: any) => t.buildingId === buildingId || t.building?.id === buildingId || t.parentId === buildingId);
  const filteredFloors = allFloors.filter((f: any) => f.towerId === towerId || f.tower?.id === towerId || f.parentId === towerId);
  const filteredUnits = allUnits.filter((u: any) => u.floorId === floorId || u.floor?.id === floorId || u.parentId === floorId);

  // Compute location name and emit onChange whenever selections change
  useEffect(() => {
    let locName = 'Entire Property Architecture';
    const bObj = buildings.find((b: any) => b.id === buildingId);
    const tObj = allTowers.find((t: any) => t.id === towerId);
    const fObj = allFloors.find((f: any) => f.id === floorId);
    const uObj = allUnits.find((u: any) => u.id === unitId);

    if (scope === 'PROPERTY') {
      locName = 'Entire Property Architecture & Shared Infrastructure';
    } else if (scope === 'CUSTOM') {
      locName = customList.length > 0 ? `Custom Multi-Location Scope: ${customList.join(' + ')}` : 'Custom Multi-Node Scope';
    } else {
      const parts = [];
      if (bObj) parts.push(`Building: ${bObj.name}`);
      if (tObj && (scope === 'TOWER' || scope === 'FLOOR' || scope === 'UNIT')) parts.push(`Tower: ${tObj.name}`);
      if (fObj && (scope === 'FLOOR' || scope === 'UNIT')) parts.push(`Floor: ${fObj.name}`);
      if (uObj && scope === 'UNIT') parts.push(`Unit: ${uObj.unitNumber || uObj.name}`);
      locName = parts.length > 0 ? parts.join(' → ') : `Unmapped (${scope} level)`;
    }

    onChange({
      locationScope: scope,
      buildingId: buildingId || undefined,
      towerId: towerId || undefined,
      floorId: floorId || undefined,
      unitId: unitId || undefined,
      spatialNodes: customList.length > 0 ? customList : undefined,
      locationName: locName
    });
  }, [scope, buildingId, towerId, floorId, unitId, customList]);

  const handleAddCustomNode = () => {
    if (!customInput.trim()) return;
    setCustomList([...customList, customInput.trim()]);
    setCustomInput('');
  };

  const handleRemoveCustomNode = (idx: number) => {
    setCustomList(customList.filter((_, i) => i !== idx));
  };

  const scopeButtons = [
    { id: 'PROPERTY', label: 'Entire Property', desc: 'All buildings & grounds', icon: Globe },
    { id: 'BUILDING', label: 'Building Level', desc: 'Whole building subsystems', icon: Building2 },
    { id: 'TOWER', label: 'Tower Level', desc: 'Specific wing or tower', icon: Layers },
    { id: 'FLOOR', label: 'Floor Level', desc: 'Floor hallways & corridors', icon: Layers },
    { id: 'UNIT', label: 'Unit Level', desc: 'Individual suite or room', icon: MapPin },
    { id: 'CUSTOM', label: 'Custom Multi-Node', desc: 'e.g. Tower A + Tower B', icon: Plus },
  ];

  return (
    <div className="space-y-4 bg-slate-50/70 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-700/60 pb-3">
        <div>
          <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center">
            <MapPin size={16} className="mr-2 text-indigo-600 dark:text-indigo-400" />
            Dynamic Spatial Hierarchy & Scope Binding
          </h4>
          <p className="text-xs text-slate-500">Bind recurring maintenance regimens to precise organizational nodes or multi-tower coordinates.</p>
        </div>
        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 font-mono text-[11px]">
          Scope: <strong>{scope}</strong>
        </Badge>
      </div>

      {/* Scope Selector Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {scopeButtons.map((s) => {
          const Icon = s.icon;
          const isSelected = scope === s.id;
          return (
            <div
              key={s.id}
              onClick={() => {
                setScope(s.id as any);
                if (s.id === 'PROPERTY') { setBuildingId(''); setTowerId(''); setFloorId(''); setUnitId(''); }
              }}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-white dark:bg-slate-900 border-indigo-600 text-indigo-600 dark:text-indigo-400 shadow-sm scale-102'
                  : 'bg-white/60 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <Icon size={16} className={isSelected ? 'text-indigo-600' : 'text-slate-400'} />
                {isSelected && <Check size={14} className="text-indigo-600" />}
              </div>
              <div>
                <span className="block text-xs font-black leading-tight">{s.label}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5 leading-tight">{s.desc}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cascading Dropdowns for Hierarchical Scopes */}
      {scope !== 'PROPERTY' && scope !== 'CUSTOM' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Building */}
          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              1. Select Building *
            </label>
            <select
              value={buildingId}
              onChange={(e) => {
                setBuildingId(e.target.value);
                setTowerId('');
                setFloorId('');
                setUnitId('');
              }}
              disabled={loadingB}
              className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Choose Building...</option>
              {buildings.map((b: any) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Tower */}
          {(scope === 'TOWER' || scope === 'FLOOR' || scope === 'UNIT') && (
            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                2. Select Tower / Wing *
              </label>
              <select
                value={towerId}
                onChange={(e) => {
                  setTowerId(e.target.value);
                  setFloorId('');
                  setUnitId('');
                }}
                disabled={loadingT || !buildingId || filteredTowers.length === 0}
                className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-40"
              >
                <option value="">{buildingId ? (filteredTowers.length > 0 ? 'Choose Tower...' : 'No Towers found') : 'Select Building first'}</option>
                {filteredTowers.map((t: any) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Floor */}
          {(scope === 'FLOOR' || scope === 'UNIT') && (
            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                3. Select Floor Level *
              </label>
              <select
                value={floorId}
                onChange={(e) => {
                  setFloorId(e.target.value);
                  setUnitId('');
                }}
                disabled={loadingF || !towerId || filteredFloors.length === 0}
                className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-40"
              >
                <option value="">{towerId ? (filteredFloors.length > 0 ? 'Choose Floor...' : 'No Floors found') : 'Select Tower first'}</option>
                {filteredFloors.map((f: any) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Unit */}
          {scope === 'UNIT' && (
            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                4. Select Suite / Unit *
              </label>
              <select
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
                disabled={loadingU || !floorId || filteredUnits.length === 0}
                className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-40"
              >
                <option value="">{floorId ? (filteredUnits.length > 0 ? 'Choose Unit...' : 'No Units found') : 'Select Floor first'}</option>
                {filteredUnits.map((u: any) => (
                  <option key={u.id} value={u.id}>{u.unitNumber || u.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Custom Multi-Node Selector */}
      {scope === 'CUSTOM' && (
        <div className="space-y-3 pt-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Add Custom Spatial Nodes (e.g. &quot;Tower A + Tower B&quot; or &quot;Floor 2 + Floor 5 East Corridor&quot;)
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Enter building zone or multiple location coordinates..."
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomNode())}
              className="flex-1 h-10 px-3.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Button type="button" onClick={handleAddCustomNode} className="bg-indigo-600 text-white font-bold text-xs h-10 px-4">
              <Plus size={15} className="mr-1" /> Add Location
            </Button>
          </div>

          {customList.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {customList.map((node, idx) => (
                <span key={idx} className="inline-flex items-center px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-2xs">
                  📍 {node}
                  <button type="button" onClick={() => handleRemoveCustomNode(idx)} className="ml-2 text-red-500 hover:text-red-700">
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Live Binding Summary Bar */}
      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs shadow-xs font-mono">
        <span className="text-slate-500 font-sans font-bold">Resolved Spatial Path:</span>
        <strong className="text-indigo-600 dark:text-indigo-400 font-extrabold truncate max-w-xl">
          {value.locationName || 'Select coordinates above'}
        </strong>
      </div>
    </div>
  );
};
