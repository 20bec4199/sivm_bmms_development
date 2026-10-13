'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { 
  Car, Zap, Accessibility, Users, Search, Filter, 
  MapPin, CheckCircle2, Ban, Wrench, ShieldAlert, Key, 
  RefreshCw, Layers, AlertCircle, Clock, Info
} from 'lucide-react';
import { 
  useGetVisualMapQuery, 
  useUpdateSlotStatusMutation,
  useDeallocateSlotMutation
} from '@/services/parkingApi';
import { useDispatch } from 'react-redux';
import { showWarning } from '@/store/slices/uiSlice';
import { useConfirm } from '@/providers/ConfirmProvider';

interface ParkoraMapProps {
  onAllocateRequested?: (slotId: string) => void;
}

export function ParkoraMap({ onAllocateRequested }: ParkoraMapProps) {
  const dispatch = useDispatch();
  const confirm = useConfirm();

  // Filters
  const [selectedArea, setSelectedArea] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Inspector modal
  const [selectedSlot, setSelectedSlot] = useState<any | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [maintenanceNote, setMaintenanceNote] = useState('');

  // Queries & Mutations
  const { data: mapData, isLoading, refetch } = useGetVisualMapQuery({
    areaId: selectedArea,
    type: selectedType,
    status: selectedStatus,
  });

  const [updateSlotStatus, { isLoading: isUpdatingStatus }] = useUpdateSlotStatusMutation();
  const [deallocateSlot, { isLoading: isDeallocating }] = useDeallocateSlotMutation();

  const areas = mapData?.areas || [];
  const rawSlots = mapData?.slots || [];
  const summary = mapData?.summary || {
    total: 0, available: 0, occupied: 0, reserved: 0, blocked: 0, maintenance: 0, evCount: 0, accessibleCount: 0, visitorCount: 0
  };

  // Filter slots locally by search query
  const filteredSlots = useMemo(() => {
    return rawSlots.filter((s: any) => {
      const matchesSearch = s.slotNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.code && s.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.area?.name && s.area.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.allocations?.some((a: any) => a.vehicle?.licensePlate?.toLowerCase().includes(searchQuery.toLowerCase())));
      return matchesSearch;
    });
  }, [rawSlots, searchQuery]);

  // Handle clicking a slot on the map
  const handleSlotClick = (slot: any) => {
    setSelectedSlot(slot);
    setMaintenanceNote(slot.notes || '');
    setIsInspectorOpen(true);
  };

  // Quick Status Changes
  const handleQuickStatusChange = async (newStatus: string) => {
    if (!selectedSlot) return;

    try {
      await updateSlotStatus({
        id: selectedSlot.id,
        status: newStatus,
        notes: maintenanceNote || undefined,
        maintenanceStatus: newStatus === 'MAINTENANCE' ? 'IN_PROGRESS' : undefined,
      }).unwrap();

      refetch();
      setIsInspectorOpen(false);
      dispatch(showWarning({ 
        title: 'Bay Status Updated', 
        message: `Bay ${selectedSlot.slotNumber} is now marked as ${newStatus}.` 
      }));
    } catch (err: any) {
      dispatch(showWarning({ message: err?.data?.message || 'Failed to update bay status.' }));
    }
  };

  // Release Bay
  const handleReleaseBay = async () => {
    if (!selectedSlot) return;
    const activeAlloc = selectedSlot.allocations?.find((a: any) => a.isActive);
    if (!activeAlloc) return;

    const confirmed = await confirm({
      title: 'Release Parking Bay',
      message: `Are you sure you want to release bay ${selectedSlot.slotNumber}? It will be returned to Available immediately.`,
      confirmText: 'Yes, Release Bay',
      cancelText: 'Cancel',
      destructive: true,
    });

    if (confirmed) {
      try {
        await deallocateSlot(activeAlloc.id).unwrap();
        refetch();
        setIsInspectorOpen(false);
        dispatch(showWarning({ title: 'Bay Released', message: `Bay ${selectedSlot.slotNumber} is now available.` }));
      } catch (err: any) {
        dispatch(showWarning({ message: err?.data?.message || 'Failed to release bay.' }));
      }
    }
  };

  // Helper: Status Tile Styling
  const getSlotTileClasses = (slot: any) => {
    switch (slot.status) {
      case 'AVAILABLE':
        return 'border-emerald-300 bg-emerald-50/70 hover:bg-emerald-100/90 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300';
      case 'OCCUPIED':
        return 'border-blue-300 bg-blue-50/80 hover:bg-blue-100/90 text-blue-900 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300';
      case 'RESERVED':
        return 'border-purple-300 bg-purple-50/80 hover:bg-purple-100/90 text-purple-900 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300';
      case 'BLOCKED':
        return 'border-amber-300 bg-amber-50/80 hover:bg-amber-100/90 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300';
      case 'MAINTENANCE':
        return 'border-rose-300 bg-rose-50/80 hover:bg-rose-100/90 text-rose-900 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300';
      case 'OUT_OF_SERVICE':
        return 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400';
      default:
        return 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-white';
    }
  };

  return (
    <div className="space-y-6">
      {/* Visual Map Header & Legend */}
      <Card className="border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm">
        <CardContent className="p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                <span>Interactive Visual Parking Map</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Real-time bay occupancy grid. Click any stall to inspect allocation, reassign status, or view live audit history.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="text-xs flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                <span>Refresh Map</span>
              </Button>
            </div>
          </div>

          {/* Map Legend */}
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="font-semibold text-slate-400 uppercase text-[10px] tracking-wider">Legend:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-emerald-500" />
              <span className="text-slate-700 dark:text-slate-300 font-medium">Available ({summary.available})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-blue-500" />
              <span className="text-slate-700 dark:text-slate-300 font-medium">Occupied ({summary.occupied})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-purple-500" />
              <span className="text-slate-700 dark:text-slate-300 font-medium">Reserved ({summary.reserved})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-amber-500" />
              <span className="text-slate-700 dark:text-slate-300 font-medium">Blocked ({summary.blocked})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-rose-500" />
              <span className="text-slate-700 dark:text-slate-300 font-medium">Maintenance ({summary.maintenance})</span>
            </div>
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-700">
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-slate-600 dark:text-slate-400">EV Bays ({summary.evCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Accessibility className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-slate-600 dark:text-slate-400">Accessible ({summary.accessibleCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-purple-600" />
              <span className="text-slate-600 dark:text-slate-400">Visitor ({summary.visitorCount})</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <Input
              placeholder="Search bay, plate, zone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs py-1.5"
            />
          </div>

          {/* Area Selector */}
          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className="text-xs border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none"
          >
            <option value="ALL">All Parking Zones ({areas.length})</option>
            {areas.map((a: any) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.type || 'Indoor'})
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="OCCUPIED">Occupied</option>
            <option value="RESERVED">Reserved</option>
            <option value="BLOCKED">Blocked</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="OUT_OF_SERVICE">Out of Service</option>
          </select>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="text-xs border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none"
          >
            <option value="ALL">All Stall Types</option>
            <option value="STANDARD">Standard</option>
            <option value="COMPACT">Compact</option>
            <option value="EV_CHARGING">EV Charging</option>
            <option value="HANDICAPPED">Accessible</option>
            <option value="VISITOR">Visitor</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-900 dark:text-white">{filteredSlots.length}</span> of {rawSlots.length} bays
        </div>
      </div>

      {/* Visual Stall Grid */}
      {filteredSlots.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
          <CardContent className="py-16 text-center text-slate-400 text-sm">
            <p>No parking stalls match the selected filters or search query.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
          {filteredSlots.map((slot: any) => {
            const activeAlloc = slot.allocations?.find((a: any) => a.isActive);
            const isEV = slot.type === 'EV_CHARGING' || slot.isEv;
            const isAccessible = slot.type === 'HANDICAPPED' || slot.isAccessible;
            const isVisitor = slot.type === 'VISITOR';
            const plate = activeAlloc?.vehicle?.licensePlate || activeAlloc?.notes;

            return (
              <button
                key={slot.id}
                onClick={() => handleSlotClick(slot)}
                className={`group relative p-3 rounded-2xl border-2 text-left transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between min-h-[105px] ${getSlotTileClasses(slot)}`}
              >
                {/* Top Row: Bay Code & Icons */}
                <div className="flex items-center justify-between w-full">
                  <span className="font-mono font-black text-sm tracking-tight">{slot.slotNumber}</span>
                  <div className="flex items-center gap-1">
                    {isEV && <Zap className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />}
                    {isAccessible && <Accessibility className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />}
                    {isVisitor && <Users className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />}
                  </div>
                </div>

                {/* Middle Info: Plate or Status */}
                <div className="my-1.5">
                  {plate ? (
                    <span className="font-mono text-[11px] font-bold tracking-wider truncate block bg-white/70 dark:bg-slate-900/70 px-1.5 py-0.5 rounded border border-black/5 dark:border-white/5">
                      {plate}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">
                      {slot.status}
                    </span>
                  )}
                </div>

                {/* Bottom Row: Zone name */}
                <div className="text-[10px] truncate opacity-60 font-medium">
                  {slot.area?.name || 'Main Zone'}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* MODAL: Bay Inspector & Operations Drawer */}
      <Modal
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        title={`Bay Inspector • ${selectedSlot?.slotNumber || ''}`}
      >
        {selectedSlot && (
          <div className="space-y-5 pt-1">
            {/* Status Summary Banner */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between ${getSlotTileClasses(selectedSlot)}`}>
              <div>
                <span className="text-xs uppercase font-extrabold tracking-wider opacity-75">Current Bay State</span>
                <h4 className="text-2xl font-black font-mono mt-0.5">{selectedSlot.slotNumber}</h4>
                <p className="text-xs mt-1 font-medium">Zone: {selectedSlot.area?.name || 'Basement Zone'}</p>
              </div>
              <Badge className="font-mono font-bold text-xs uppercase px-3 py-1">
                {selectedSlot.status}
              </Badge>
            </div>

            {/* Specifications & Capabilities */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-slate-400">Bay Type:</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{selectedSlot.type}</p>
              </div>
              <div>
                <span className="text-slate-400">Dimensions / Size:</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{selectedSlot.size || 'Standard'}</p>
              </div>
              <div>
                <span className="text-slate-400">EV Charging:</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  {selectedSlot.isEv || selectedSlot.type === 'EV_CHARGING' ? '✅ Equipped (Level 2)' : '❌ None'}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Accessible / ADA:</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  {selectedSlot.isAccessible || selectedSlot.type === 'HANDICAPPED' ? '✅ Accessible Stall' : 'Standard'}
                </p>
              </div>
            </div>

            {/* Active Allocation or Occupant details */}
            {selectedSlot.allocations?.some((a: any) => a.isActive) ? (
              <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/30 text-xs space-y-2">
                <span className="font-bold text-blue-900 dark:text-blue-200 uppercase tracking-wider text-[10px]">
                  Active Allocation Record
                </span>
                {selectedSlot.allocations.filter((a: any) => a.isActive).map((alloc: any) => (
                  <div key={alloc.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">License Plate:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-white">
                        {alloc.vehicle?.licensePlate || 'Guest Car'}
                      </span>
                    </div>
                    {alloc.propertyNode && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Dedicated Unit:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {alloc.propertyNode.name}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Mode:</span>
                      <span className="font-medium capitalize text-slate-700 dark:text-slate-300">
                        {alloc.allocationType?.toLowerCase() || 'Permanent'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {/* Maintenance / Custom Note */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Bay Operational Notes
              </label>
              <Input
                placeholder="e.g. Pillar repainting scheduled, Reserved for Director..."
                value={maintenanceNote}
                onChange={(e) => setMaintenanceNote(e.target.value)}
                className="text-xs"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleQuickStatusChange('AVAILABLE')}
                  disabled={isUpdatingStatus || selectedSlot.status === 'AVAILABLE'}
                  className="text-xs text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                >
                  Mark Available
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleQuickStatusChange('BLOCKED')}
                  disabled={isUpdatingStatus || selectedSlot.status === 'BLOCKED'}
                  className="text-xs text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                >
                  Block Bay
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleQuickStatusChange('MAINTENANCE')}
                  disabled={isUpdatingStatus || selectedSlot.status === 'MAINTENANCE'}
                  className="text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                >
                  Maintenance
                </Button>
              </div>

              <div className="flex items-center gap-2 ml-auto">
                {selectedSlot.allocations?.some((a: any) => a.isActive) ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleReleaseBay}
                    disabled={isDeallocating}
                    className="text-xs text-rose-600 border-rose-300 hover:bg-rose-50 dark:border-rose-800"
                  >
                    Release Allocation
                  </Button>
                ) : (
                  onAllocateRequested && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setIsInspectorOpen(false);
                        onAllocateRequested(selectedSlot.id);
                      }}
                      className="text-xs bg-primary hover:bg-primary/90 text-white font-semibold"
                    >
                      Allocate Bay
                    </Button>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
