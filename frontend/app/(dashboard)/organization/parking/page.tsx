'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { 
  Building, Car, AlertTriangle, 
  Search, Plus, Zap, Accessibility, Users, 
  CheckCircle2, Ban, Key, Layers, MapPin, Trash2, Sparkles, ShieldAlert, Info, ShieldCheck,
  BarChart3, Activity, Calendar, QrCode, Sliders
} from 'lucide-react';
import Link from 'next/link';
import { useDispatch } from 'react-redux';
import { showWarning } from '@/store/slices/uiSlice';
import { useConfirm } from '@/providers/ConfirmProvider';
import { 
  useGetParkingAreasQuery, 
  useCreateParkingAreaMutation,
  useDeleteParkingAreaMutation,
  useGetParkingSlotsQuery,
  useCreateParkingSlotMutation,
  useDeleteParkingSlotMutation,
  useAllocateSlotMutation,
  useDeallocateSlotMutation,
  useGetViolationsQuery,
  useReportViolationMutation
} from '@/services/parkingApi';
import { 
  useGetUnitsQuery,
  useGetVehiclesQuery,
  useGetBuildingsQuery,
  useGetTowersQuery,
  useGetFloorsQuery
} from '@/services/organizationApi';
import { RequireModule } from '@/components/auth/RequireModule';
import { ParkoraMap } from '@/components/parking/ParkoraMap';
import { ParkoraConfig } from '@/components/parking/ParkoraConfig';
import { ParkoraSessions } from '@/components/parking/ParkoraSessions';
import { ParkoraReservations } from '@/components/parking/ParkoraReservations';
import { ParkoraAnalytics } from '@/components/parking/ParkoraAnalytics';
import { SmartiParkNav } from '@/components/parking/SmartiParkNav';

export default function OrganizationParkingPage() {
  const dispatch = useDispatch();
  const confirm = useConfirm();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'map' | 'slots' | 'areas' | 'sessions' | 'reservations' | 'violations' | 'config'>('dashboard');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab) {
        if (tab === 'bays' || tab === 'slots') setActiveTab('slots');
        else if (tab === 'zones' || tab === 'areas') setActiveTab('areas');
        else if (tab === 'map' || tab === 'mapview') setActiveTab('map');
        else if (tab === 'bookings' || tab === 'reservations') setActiveTab('reservations');
        else if (tab === 'settings' || tab === 'config') setActiveTab('config');
        else if (['dashboard', 'sessions', 'violations'].includes(tab)) setActiveTab(tab as any);
      }
    }
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAreaFilter, setSelectedAreaFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');

  // Modal Open States
  const [isCreateAreaModalOpen, setIsCreateAreaModalOpen] = useState(false);
  const [isCreateSlotModalOpen, setIsCreateSlotModalOpen] = useState(false);
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [isReportViolationModalOpen, setIsReportViolationModalOpen] = useState(false);

  // Form States - Area Cascading Hierarchy
  const [areaName, setAreaName] = useState('');
  const [areaType, setAreaType] = useState('INDOOR');
  const [areaCapacity, setAreaCapacity] = useState('');
  const [areaBuildingId, setAreaBuildingId] = useState('');
  const [areaTowerId, setAreaTowerId] = useState('');
  const [areaFloorId, setAreaFloorId] = useState('');
  const [areaUnitId, setAreaUnitId] = useState('');
  const [areaDescription, setAreaDescription] = useState('');

  // Form States - Slot
  const [slotAreaId, setSlotAreaId] = useState('');
  const [slotNumber, setSlotNumber] = useState('');
  const [slotType, setSlotType] = useState('STANDARD');
  const [slotStatus, setSlotStatus] = useState('AVAILABLE');

  // Form States - Allocation
  const [allocateSlotId, setAllocateSlotId] = useState('');
  const [allocateType, setAllocateType] = useState('PERMANENT');
  const [allocateUnitId, setAllocateUnitId] = useState('');
  const [allocateVehicleId, setAllocateVehicleId] = useState('');

  // Form States - Violation
  const [violationSlotId, setViolationSlotId] = useState('');
  const [violationVehicleId, setViolationVehicleId] = useState('');
  const [violationType, setViolationType] = useState('UNAUTHORIZED_PARKING');
  const [violationFineAmount, setViolationFineAmount] = useState('');
  const [violationDescription, setViolationDescription] = useState('');

  // Queries
  const { data: areasResponse, isLoading: isLoadingAreas, refetch: refetchAreas } = useGetParkingAreasQuery(undefined);
  const { data: slotsResponse, isLoading: isLoadingSlots, refetch: refetchSlots } = useGetParkingSlotsQuery(undefined);
  const { data: violationsResponse, isLoading: isLoadingViolations, refetch: refetchViolations } = useGetViolationsQuery(undefined);
  const { data: unitsResponse } = useGetUnitsQuery({});
  const { data: vehiclesResponse } = useGetVehiclesQuery({});
  const { data: buildingsResponse } = useGetBuildingsQuery({});
  const { data: towersResponse } = useGetTowersQuery({});
  const { data: floorsResponse } = useGetFloorsQuery({});

  // Mutations
  const [createArea, { isLoading: isCreatingArea }] = useCreateParkingAreaMutation();
  const [deleteArea, { isLoading: isDeletingArea }] = useDeleteParkingAreaMutation();
  const [createSlot, { isLoading: isCreatingSlot }] = useCreateParkingSlotMutation();
  const [deleteSlot, { isLoading: isDeletingSlot }] = useDeleteParkingSlotMutation();
  const [allocateSlot, { isLoading: isAllocating }] = useAllocateSlotMutation();
  const [deallocateSlot, { isLoading: isDeallocating }] = useDeallocateSlotMutation();
  const [reportViolation, { isLoading: isReportingViolation }] = useReportViolationMutation();

  // Normalize Data
  const areas = useMemo(() => Array.isArray(areasResponse) ? areasResponse : (areasResponse?.data || []), [areasResponse]);
  const slots = useMemo(() => Array.isArray(slotsResponse) ? slotsResponse : (slotsResponse?.data || []), [slotsResponse]);
  const violations = useMemo(() => Array.isArray(violationsResponse) ? violationsResponse : (violationsResponse?.data || []), [violationsResponse]);
  const units = useMemo(() => Array.isArray(unitsResponse) ? unitsResponse : (unitsResponse?.data || []), [unitsResponse]);
  const vehicles = useMemo(() => Array.isArray(vehiclesResponse) ? vehiclesResponse : (vehiclesResponse?.data || []), [vehiclesResponse]);
  const buildings = useMemo(() => Array.isArray(buildingsResponse) ? buildingsResponse : (buildingsResponse?.data || []), [buildingsResponse]);
  const towers = useMemo(() => Array.isArray(towersResponse) ? towersResponse : (towersResponse?.data || []), [towersResponse]);
  const floors = useMemo(() => Array.isArray(floorsResponse) ? floorsResponse : (floorsResponse?.data || []), [floorsResponse]);

  // Cascading Hierarchy for Area Form
  const filteredTowersForArea = useMemo(() => {
    if (!areaBuildingId) return towers;
    return towers.filter((t: any) => t.buildingId === areaBuildingId || t.parentId === areaBuildingId || t.building?.id === areaBuildingId);
  }, [towers, areaBuildingId]);

  const filteredFloorsForArea = useMemo(() => {
    if (!areaTowerId) return floors;
    return floors.filter((f: any) => f.towerId === areaTowerId || f.parentId === areaTowerId || f.tower?.id === areaTowerId);
  }, [floors, areaTowerId]);

  const filteredUnitsForArea = useMemo(() => {
    if (!areaFloorId) return units;
    return units.filter((u: any) => u.floorId === areaFloorId || u.parentId === areaFloorId || u.floor?.id === areaFloorId);
  }, [units, areaFloorId]);

  // Exclusivity Checks
  const isUnitUnavailableForParking = (u: any) => {
    const isParking = u.status === 'PARKING_ALLOCATED' || 
      (u.parkingAreas && u.parkingAreas.length > 0) || 
      u.metadata?.isParkingArea || 
      u.metadata?.type === 'PARKING';
    const hasOwner = u.owners && u.owners.length > 0;
    const hasTenant = u.tenants && u.tenants.length > 0;
    const isOccupied = u.status === 'OCCUPIED';

    return isParking || hasOwner || hasTenant || isOccupied;
  };

  const getUnitAvailabilityReason = (u: any) => {
    if (u.status === 'PARKING_ALLOCATED' || (u.parkingAreas && u.parkingAreas.length > 0) || u.metadata?.isParkingArea) {
      return 'Already Dedicated to Parking';
    }
    if (u.owners && u.owners.length > 0) return 'Occupied by Owner';
    if (u.tenants && u.tenants.length > 0) return 'Occupied by Tenant';
    if (u.status === 'OCCUPIED') return 'Occupied Unit';
    return 'Available';
  };

  // Hierarchy Path Formatter
  const getAreaHierarchyPath = (area: any) => {
    if (!area.propertyNode) return '';
    const parts: string[] = [];
    let curr = area.propertyNode;
    while (curr) {
      const prefix = curr.nodeType ? `${curr.nodeType.charAt(0) + curr.nodeType.slice(1).toLowerCase()}: ` : '';
      parts.unshift(`${prefix}${curr.name}`);
      curr = curr.parent;
    }
    return parts.join(' > ');
  };

  const selectedHierarchyBreadcrumb = useMemo(() => {
    const parts: string[] = [];
    const b = buildings.find((b: any) => b.id === areaBuildingId);
    if (b) parts.push(`Building: ${b.name}`);
    const t = towers.find((t: any) => t.id === areaTowerId);
    if (t) parts.push(`Tower: ${t.name}`);
    const f = floors.find((f: any) => f.id === areaFloorId);
    if (f) parts.push(`Floor: ${f.name}`);
    const u = units.find((u: any) => u.id === areaUnitId);
    if (u) parts.push(`Unit: ${u.name || u.unitNumber}`);

    return parts.length > 0 ? parts.join(' → ') : 'Whole Property / Common Architecture';
  }, [areaBuildingId, areaTowerId, areaFloorId, areaUnitId, buildings, towers, floors, units]);

  // Handler: Create Area
  const handleCreateArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!areaName.trim()) {
      dispatch(showWarning({ message: 'Zone/Area name is required.' }));
      return;
    }

    const targetPropertyNodeId = areaUnitId || areaFloorId || areaTowerId || areaBuildingId || undefined;

    try {
      await createArea({
        name: areaName.trim(),
        type: areaType,
        totalSlots: parseInt(areaCapacity) || 0,
        propertyNodeId: targetPropertyNodeId,
        description: areaDescription || undefined,
      }).unwrap();

      setIsCreateAreaModalOpen(false);
      setAreaName('');
      setAreaType('INDOOR');
      setAreaCapacity('');
      setAreaBuildingId('');
      setAreaTowerId('');
      setAreaFloorId('');
      setAreaUnitId('');
      setAreaDescription('');
      refetchAreas();
      dispatch(showWarning({ title: 'Success', message: 'Parking area created successfully with spatial mapping!' }));
    } catch (err: any) {
      dispatch(showWarning({ message: err?.data?.message || 'Failed to create parking area.' }));
    }
  };

  // Handler: Delete Area
  const handleDeleteArea = async (area: any) => {
    const confirmed = await confirm({
      title: 'Delete Parking Zone',
      message: `Are you sure you want to delete parking zone "${area.name}"? If any unit was dedicated to this zone, it will be unlocked and returned to active circulation.`,
      confirmText: 'Yes, Delete Zone',
      cancelText: 'Cancel',
      destructive: true,
    });

    if (confirmed) {
      try {
        await deleteArea(area.id).unwrap();
        refetchAreas();
        refetchSlots();
        dispatch(showWarning({ title: 'Zone Deleted', message: `Parking zone "${area.name}" has been removed.` }));
      } catch (err: any) {
        dispatch(showWarning({ message: err?.data?.message || 'Failed to delete parking zone.' }));
      }
    }
  };

  // Handler: Delete Slot
  const handleDeleteSlot = async (slot: any) => {
    const confirmed = await confirm({
      title: 'Delete Parking Slot',
      message: `Are you sure you want to delete parking bay ${slot.slotNumber}?`,
      confirmText: 'Yes, Delete Slot',
      cancelText: 'Cancel',
      destructive: true,
    });

    if (confirmed) {
      try {
        await deleteSlot(slot.id).unwrap();
        refetchSlots();
        refetchAreas();
        dispatch(showWarning({ title: 'Slot Deleted', message: `Parking slot ${slot.slotNumber} has been deleted.` }));
      } catch (err: any) {
        dispatch(showWarning({ message: err?.data?.message || 'Failed to delete parking slot.' }));
      }
    }
  };

  // Statistics
  const totalSlotsCount = slots.length;
  const occupiedSlotsCount = slots.filter((s: any) => s.status === 'OCCUPIED').length;
  const availableSlotsCount = slots.filter((s: any) => s.status === 'AVAILABLE').length;
  const occupancyRate = totalSlotsCount > 0 ? Math.round((occupiedSlotsCount / totalSlotsCount) * 100) : 0;
  const activeViolationsCount = violations.filter((v: any) => v.status === 'REPORTED' || v.status === 'PENDING_PAYMENT').length;

  // Filtered Slots
  const filteredSlots = useMemo(() => {
    return slots.filter((s: any) => {
      const matchesSearch = s.slotNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.allocations?.some((a: any) => a.isActive && a.vehicle?.licensePlate?.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesArea = selectedAreaFilter === 'ALL' || s.areaId === selectedAreaFilter;
      const matchesStatus = selectedStatusFilter === 'ALL' || s.status === selectedStatusFilter;
      const matchesType = selectedTypeFilter === 'ALL' || s.type === selectedTypeFilter;

      return matchesSearch && matchesArea && matchesStatus && matchesType;
    });
  }, [slots, searchQuery, selectedAreaFilter, selectedStatusFilter, selectedTypeFilter]);

  // Filtered Areas
  const filteredAreas = useMemo(() => {
    return areas.filter((a: any) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.type?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [areas, searchQuery]);

  // Filtered Violations
  const filteredViolations = useMemo(() => {
    return violations.filter((v: any) =>
      v.violationType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.slot?.slotNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.vehicle?.licensePlate?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [violations, searchQuery]);



  // Handler: Create Slot
  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotAreaId) {
      dispatch(showWarning({ message: 'Please select a parking area.' }));
      return;
    }
    if (!slotNumber.trim()) {
      dispatch(showWarning({ message: 'Slot number or identifier is required.' }));
      return;
    }

    try {
      await createSlot({
        areaId: slotAreaId,
        slotNumber: slotNumber.trim(),
        type: slotType,
        status: slotStatus,
      }).unwrap();

      setIsCreateSlotModalOpen(false);
      setSlotNumber('');
      setSlotType('STANDARD');
      setSlotStatus('AVAILABLE');
      refetchSlots();
      refetchAreas();
      dispatch(showWarning({ title: 'Success', message: `Slot ${slotNumber} created successfully!` }));
    } catch (err: any) {
      dispatch(showWarning({ message: err?.data?.message || 'Failed to create slot.' }));
    }
  };

  // Handler: Allocate Slot
  const handleAllocateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocateSlotId) {
      dispatch(showWarning({ message: 'Please select an available parking slot.' }));
      return;
    }

    try {
      await allocateSlot({
        slotId: allocateSlotId,
        allocationType: allocateType,
        propertyNodeId: allocateUnitId || undefined,
        vehicleId: allocateVehicleId || undefined,
      }).unwrap();

      setIsAllocateModalOpen(false);
      setAllocateSlotId('');
      setAllocateUnitId('');
      setAllocateVehicleId('');
      setAllocateType('PERMANENT');
      refetchSlots();
      dispatch(showWarning({ title: 'Slot Allocated', message: 'The parking slot has been successfully allocated!' }));
    } catch (err: any) {
      dispatch(showWarning({ message: err?.data?.message || 'Failed to allocate slot.' }));
    }
  };

  // Handler: Deallocate Slot
  const handleDeallocateSlot = async (slot: any) => {
    const activeAllocation = slot.allocations?.find((a: any) => a.isActive);
    if (!activeAllocation) {
      dispatch(showWarning({ message: `No active allocation found for slot ${slot.slotNumber}.` }));
      return;
    }

    const confirmed = await confirm({
      title: 'Release Parking Slot',
      message: `Are you sure you want to release slot ${slot.slotNumber}? This will mark the bay as available immediately.`,
      confirmText: 'Yes, Release Slot',
      cancelText: 'Cancel',
      destructive: true,
    });

    if (confirmed) {
      try {
        await deallocateSlot(activeAllocation.id).unwrap();
        refetchSlots();
        dispatch(showWarning({ title: 'Slot Released', message: `Slot ${slot.slotNumber} is now available.` }));
      } catch (err: any) {
        dispatch(showWarning({ message: err?.data?.message || err?.message || 'Failed to release slot.' }));
      }
    }
  };

  // Handler: Report Violation
  const handleReportViolation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!violationType) {
      dispatch(showWarning({ message: 'Violation type is required.' }));
      return;
    }

    try {
      await reportViolation({
        slotId: violationSlotId || undefined,
        vehicleId: violationVehicleId || undefined,
        violationType,
        fineAmount: violationFineAmount ? parseFloat(violationFineAmount) : 0,
        description: violationDescription || undefined,
      }).unwrap();

      setIsReportViolationModalOpen(false);
      setViolationSlotId('');
      setViolationVehicleId('');
      setViolationFineAmount('');
      setViolationDescription('');
      setViolationType('UNAUTHORIZED_PARKING');
      refetchViolations();
      dispatch(showWarning({ title: 'Violation Logged', message: 'Parking compliance violation has been recorded.' }));
    } catch (err: any) {
      dispatch(showWarning({ message: err?.data?.message || 'Failed to report violation.' }));
    }
  };

  // Slot Type Badge Helper
  const renderSlotTypeBadge = (type: string) => {
    switch (type) {
      case 'EV_CHARGING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
            <Zap className="w-3 h-3 text-emerald-600" />
            EV Charge
          </span>
        );
      case 'HANDICAPPED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800">
            <Accessibility className="w-3 h-3 text-blue-600" />
            Accessible
          </span>
        );
      case 'VISITOR':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800">
            <Users className="w-3 h-3 text-purple-600" />
            Visitor
          </span>
        );
      case 'COMPACT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
            Compact
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
            Standard
          </span>
        );
    }
  };

  // Slot Status Badge Helper
  const renderSlotStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Available
          </span>
        );
      case 'OCCUPIED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            Occupied
          </span>
        );
      case 'RESERVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            Reserved
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800 shadow-sm">
            <Ban className="w-3 h-3 text-rose-600" />
            Maintenance
          </span>
        );
    }
  };

  // Columns: Areas Table
  const areaColumns: Column<any>[] = [
    { 
      header: 'Zone / Area Name', 
      accessorKey: 'name', 
      cell: (area) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold text-slate-900 dark:text-white">{area.name}</div>
            {area.description && <div className="text-xs text-slate-400 max-w-xs truncate">{area.description}</div>}
          </div>
        </div>
      )
    },
    { 
      header: 'Zone Type', 
      accessorKey: 'type', 
      cell: (area) => <Badge variant="outline" className="font-mono text-xs uppercase">{area.type || 'INDOOR'}</Badge> 
    },
    { 
      header: 'Spatial Architecture / Hierarchy', 
      accessorKey: 'propertyNode', 
      cell: (area) => {
        const path = getAreaHierarchyPath(area);
        return path ? (
          <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
            <span className="font-semibold text-slate-900 dark:text-white">{path}</span>
          </div>
        ) : (
          <span className="text-xs text-slate-400 italic">Entire Property / Ground</span>
        );
      }
    },
    { 
      header: 'Capacity & Bays', 
      accessorKey: 'totalSlots', 
      cell: (area) => {
        const registered = area.slots?.length || 0;
        const total = area.totalSlots || registered || 1;
        const pct = Math.min(100, Math.round((registered / total) * 100));
        return (
          <div className="w-44">
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-slate-700 dark:text-slate-300">{registered} bays</span>
              <span className="text-slate-400">Target: {area.totalSlots || 'N/A'}</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  pct >= 90 ? 'bg-amber-500' : 'bg-indigo-600'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      }
    },
    {
      header: 'Actions',
      accessorKey: 'id',
      cell: (area) => (
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            className="rounded-xl text-xs gap-1 hover:border-indigo-500 hover:text-indigo-600"
            onClick={() => {
              setSlotAreaId(area.id);
              setIsCreateSlotModalOpen(true);
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Slot
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="rounded-xl text-xs gap-1 text-rose-600 hover:bg-rose-50 border-rose-200 dark:border-rose-900/50"
            onClick={() => handleDeleteArea(area)}
            isLoading={isDeletingArea}
            title="Delete Parking Zone"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      )
    }
  ];

  // Columns: Slots Table
  const slotColumns: Column<any>[] = [
    { 
      header: 'Slot Identifier', 
      accessorKey: 'slotNumber', 
      cell: (slot) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-slate-800 dark:text-white font-mono text-sm shadow-sm">
            {slot.slotNumber}
          </div>
          <div>
            <div className="font-semibold text-slate-900 dark:text-white font-mono">{slot.slotNumber}</div>
            <div className="text-xs text-slate-400">Zone: {areas.find((a: any) => a.id === slot.areaId)?.name || 'General'}</div>
          </div>
        </div>
      )
    },
    { 
      header: 'Bay Type', 
      accessorKey: 'type', 
      cell: (slot) => renderSlotTypeBadge(slot.type) 
    },
    { 
      header: 'Status', 
      accessorKey: 'status', 
      cell: (slot) => renderSlotStatusBadge(slot.status) 
    },
    { 
      header: 'Current Allocation', 
      accessorKey: 'allocations', 
      cell: (slot) => {
        const active = slot.allocations?.find((a: any) => a.isActive);
        if (!active) {
          return <span className="text-slate-400 text-sm italic">Unallocated / Free</span>;
        }

        const vehiclePlate = active.vehicle?.licensePlate;
        const vehicleModel = active.vehicle?.make && active.vehicle?.model ? `${active.vehicle.make} ${active.vehicle.model}` : null;
        const user = active.user ? `${active.user.firstName} ${active.user.lastName || ''}`.trim() : null;

        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-slate-900 text-white font-mono font-bold text-xs tracking-wider border border-slate-700 shadow-sm">
                {vehiclePlate || 'RESERVED BAY'}
              </span>
              <span className="text-xs font-semibold text-slate-500 uppercase">({active.allocationType})</span>
            </div>
            {(vehicleModel || user) && (
              <div className="text-xs text-slate-500">
                {vehicleModel} {user && `• ${user}`}
              </div>
            )}
          </div>
        );
      }
    },
    {
      header: 'Actions',
      accessorKey: 'id',
      cell: (slot) => {
        const isOccupied = slot.status === 'OCCUPIED';
        const isAvailable = slot.status === 'AVAILABLE';

        return (
          <div className="flex items-center gap-2">
            {isAvailable && (
              <>
                <Button
                  size="sm"
                  className="rounded-xl text-xs gap-1 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                  onClick={() => {
                    setAllocateSlotId(slot.id);
                    setIsAllocateModalOpen(true);
                  }}
                >
                  <Key className="w-3.5 h-3.5" />
                  Allocate
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl text-xs gap-1 text-rose-600 hover:bg-rose-50 border-rose-200 dark:border-rose-900/50"
                  onClick={() => handleDeleteSlot(slot)}
                  isLoading={isDeletingSlot}
                  title="Delete Slot"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </>
            )}
            {isOccupied && (
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl text-xs gap-1 border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900/50 dark:hover:bg-rose-950/40"
                onClick={() => handleDeallocateSlot(slot)}
                isLoading={isDeallocating}
              >
                Release
              </Button>
            )}
          </div>
        );
      }
    }
  ];

  // Columns: Violations Table
  const violationColumns: Column<any>[] = [
    {
      header: 'Violation Type',
      accessorKey: 'violationType',
      cell: (v) => {
        const typeLabels: Record<string, string> = {
          UNAUTHORIZED_PARKING: 'Unauthorized Parking',
          OVERSTAY: 'Overstay / Exceeded Time',
          WRONG_SLOT: 'Wrong Slot Parking',
          IMPROPER_PARKING: 'Improper / Blocking'
        };
        return (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-slate-900 dark:text-white">
                {typeLabels[v.violationType] || v.violationType}
              </div>
              {v.description && <div className="text-xs text-slate-400 max-w-xs truncate">{v.description}</div>}
            </div>
          </div>
        );
      }
    },
    {
      header: 'Slot & Vehicle',
      accessorKey: 'slot',
      cell: (v) => (
        <div className="space-y-0.5">
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {v.slot ? `Slot ${v.slot.slotNumber}` : 'Zone Unspecified'}
          </div>
          <div className="text-xs font-mono text-slate-500">
            {v.vehicle?.licensePlate || 'Plate Unrecorded'}
          </div>
        </div>
      )
    },
    {
      header: 'Fine Amount',
      accessorKey: 'fineAmount',
      cell: (v) => (
        <span className="font-bold text-slate-900 dark:text-white text-sm">
          {v.fineAmount ? `₹${v.fineAmount.toLocaleString()}` : 'No Fine'}
        </span>
      )
    },
    {
      header: 'Reported By',
      accessorKey: 'reportedBy',
      cell: (v) => (
        <div className="text-xs text-slate-600 dark:text-slate-400">
          <div>{v.reportedBy ? `${v.reportedBy.firstName} ${v.reportedBy.lastName || ''}` : 'Staff'}</div>
          <div className="text-slate-400">{new Date(v.createdAt).toLocaleDateString()}</div>
        </div>
      )
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (v) => (
        <Badge className={
          v.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
          v.status === 'PENDING_PAYMENT' ? 'bg-amber-100 text-amber-800 border-amber-300' :
          'bg-rose-100 text-rose-800 border-rose-300'
        }>
          {v.status}
        </Badge>
      )
    }
  ];

  return (
    <RequireModule moduleCode="PARKING_MANAGEMENT">
      <div className="space-y-6 max-w-[1600px] mx-auto pb-16">
        {/* Unified SmartiPark Navigation Bar - Stays fixed in the single top position */}
        <SmartiParkNav
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab as any)}
          slotsCount={slots.length}
          areasCount={areas.length}
          violationsCount={activeViolationsCount}
          actions={
            activeTab === 'slots' ? (
              <>
                <Button 
                  onClick={() => setIsAllocateModalOpen(true)}
                  variant="outline"
                  className="rounded-xl h-9 px-4 border-slate-300 dark:border-slate-700 gap-1.5 text-xs font-semibold"
                >
                  <Key className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  Quick Allocate
                </Button>
                <Button 
                  onClick={() => setIsCreateSlotModalOpen(true)}
                  className="rounded-xl h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 text-xs font-semibold shadow-sm shadow-indigo-600/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Bay
                </Button>
              </>
            ) : activeTab === 'areas' ? (
              <Button 
                onClick={() => setIsCreateAreaModalOpen(true)}
                className="rounded-xl h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 text-xs font-semibold shadow-sm shadow-indigo-600/20"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Zone
              </Button>
            ) : activeTab === 'violations' ? (
              <Button 
                onClick={() => setIsReportViolationModalOpen(true)}
                className="rounded-xl h-9 px-4 bg-rose-600 hover:bg-rose-700 text-white gap-1.5 text-xs font-semibold shadow-sm shadow-rose-600/20"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Report Infraction
              </Button>
            ) : null
          }
        />

        {/* Tab Content 1: Dashboard */}
        {activeTab === 'dashboard' && (
          <ParkoraAnalytics onNavigateTab={(tab) => setActiveTab(tab as any)} />
        )}

        {/* Tab Content 2: Visual Map */}
        {activeTab === 'map' && (
          <ParkoraMap />
        )}

        {/* Tab Content 3: Live Sessions */}
        {activeTab === 'sessions' && (
          <ParkoraSessions />
        )}

        {/* Tab Content 4: Bookings & Digital Permits */}
        {activeTab === 'reservations' && (
          <ParkoraReservations />
        )}

        {/* Tab Content 5: Platform Engine Config */}
        {activeTab === 'config' && (
          <ParkoraConfig />
        )}

        {/* Tab Content 6: Parking Bays Management */}
        {activeTab === 'slots' && (
          <div className="space-y-6">
            {/* Top KPI Metrics Cards for Bays */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <Card className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Parking Zones</span>
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <Building className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{areas.length}</div>
                  <p className="text-xs text-slate-400 mt-1.5 font-medium">Configured basements & zones</p>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Registered Bays</span>
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <Layers className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{totalSlotsCount}</div>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1.5 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {availableSlotsCount} free & available
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Bay Occupancy</span>
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <Car className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{occupancyRate}%</span>
                    <span className="text-xs text-slate-400">({occupiedSlotsCount} / {totalSlotsCount})</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-3">
                    <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${occupancyRate}%` }} />
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Violations & Fines</span>
                    <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{activeViolationsCount}</div>
                  <p className="text-xs text-rose-500 mt-1.5 font-medium">Pending enforcement</p>
                </CardContent>
              </Card>
            </div>

            {/* Filter Controls Bar for Bays */}
            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input 
                  placeholder="Search slot numbers, license plates, notes..."
                  className="pl-10 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border-0 h-11 text-sm focus:ring-2 focus:ring-indigo-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Area Filter */}
                <select
                  value={selectedAreaFilter}
                  onChange={(e) => setSelectedAreaFilter(e.target.value)}
                  className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3.5 h-11 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">All Zones</option>
                  {areas.map((a: any) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3.5 h-11 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="AVAILABLE">Available</option>
                  <option value="OCCUPIED">Occupied</option>
                  <option value="RESERVED">Reserved</option>
                  <option value="MAINTENANCE">Maintenance</option>
                </select>

                {/* Type Filter */}
                <select
                  value={selectedTypeFilter}
                  onChange={(e) => setSelectedTypeFilter(e.target.value)}
                  className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3.5 h-11 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">All Bay Types</option>
                  <option value="STANDARD">Standard</option>
                  <option value="COMPACT">Compact</option>
                  <option value="EV_CHARGING">EV Charging</option>
                  <option value="HANDICAPPED">Accessible</option>
                  <option value="VISITOR">Visitor</option>
                </select>
              </div>
            </div>

            {/* Empty Zones Notice */}
            {areas.length === 0 && !isLoadingAreas && (
              <div className="p-4 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 text-slate-800 dark:text-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 mt-0.5">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">No Parking Zones Configured Yet</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      You need to define at least one Parking Zone / Area (such as Basement B1, Tower A Ground, or a dedicated unit) before you can add parking slots.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setIsCreateAreaModalOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs flex-shrink-0 h-9 px-4 font-semibold shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Define Parking Zone First
                </Button>
              </div>
            )}

            {/* Bays DataTable */}
            <DataTable 
              columns={slotColumns} 
              data={filteredSlots} 
              isLoading={isLoadingSlots}
              emptyMessage="No parking slots found matching your criteria. Click '+ Add Bay' to get started."
            />
          </div>
        )}

        {/* Tab Content 7: Parking Zones Management */}
        {activeTab === 'areas' && (
          <div className="space-y-6">
            {/* Filter Controls Bar for Zones */}
            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input 
                  placeholder="Search zone names, locations..."
                  className="pl-10 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border-0 h-11 text-sm focus:ring-2 focus:ring-indigo-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Zones DataTable */}
            <DataTable 
              columns={areaColumns} 
              data={filteredAreas} 
              isLoading={isLoadingAreas}
              emptyMessage="No parking areas configured. Define your first zone/basement using '+ Add Zone'."
            />
          </div>
        )}

        {/* Tab Content 8: Violations Management */}
        {activeTab === 'violations' && (
          <div className="space-y-6">
            {/* Filter Controls Bar for Violations */}
            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input 
                  placeholder="Search violations, license plates, notes..."
                  className="pl-10 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border-0 h-11 text-sm focus:ring-2 focus:ring-indigo-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Violations DataTable */}
            <DataTable 
              columns={violationColumns} 
              data={filteredViolations} 
              isLoading={isLoadingViolations}
              emptyMessage="No parking compliance violations reported on record."
            />
          </div>
        )}

        {/* Modal 1: Define Parking Area */}
        <Modal 
          isOpen={isCreateAreaModalOpen} 
          onClose={() => setIsCreateAreaModalOpen(false)} 
          title="Define Parking Zone / Area"
        >
          <form onSubmit={handleCreateArea} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Zone / Area Name *
                </label>
                {selectedHierarchyBreadcrumb !== 'Whole Property / Common Architecture' && (
                  <button
                    type="button"
                    onClick={() => {
                      const b = buildings.find((b: any) => b.id === areaBuildingId);
                      const t = towers.find((t: any) => t.id === areaTowerId);
                      const f = floors.find((f: any) => f.id === areaFloorId);
                      const u = units.find((u: any) => u.id === areaUnitId);
                      let name = '';
                      if (u) name = `Bay Unit ${u.name || u.unitNumber} (${f ? f.name : ''})`;
                      else if (f) name = `${f.name} Parking ${t ? `(${t.name})` : ''}`;
                      else if (t) name = `${t.name} Parking Zone`;
                      else if (b) name = `${b.name} Parking Area`;
                      if (name) setAreaName(name.trim());
                    }}
                    className="text-[11px] text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-medium flex items-center gap-1 hover:underline"
                  >
                    <Sparkles className="w-3 h-3" />
                    Auto-suggest name
                  </button>
                )}
              </div>
              <Input 
                value={areaName} 
                onChange={e => setAreaName(e.target.value)} 
                placeholder="e.g., Basement B1 (North Wing) or Ground Level Bays"
                className="rounded-xl"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Zone Type
                </label>
                <select 
                  value={areaType} 
                  onChange={e => setAreaType(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="INDOOR">Indoor Covered</option>
                  <option value="OUTDOOR">Outdoor Surface</option>
                  <option value="BASEMENT">Basement Level</option>
                  <option value="ROOFTOP">Rooftop Deck</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Target Capacity (Slots)
                </label>
                <Input 
                  type="number"
                  value={areaCapacity} 
                  onChange={e => setAreaCapacity(e.target.value)} 
                  placeholder="e.g., 50"
                  className="rounded-xl"
                />
              </div>
            </div>

            {/* Cascading Spatial Architecture Hierarchy Selector */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Spatial Property Hierarchy
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  Building → Tower → Floor → Unit
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Building */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    1. Building / Complex
                  </label>
                  <select
                    value={areaBuildingId}
                    onChange={(e) => {
                      setAreaBuildingId(e.target.value);
                      setAreaTowerId('');
                      setAreaFloorId('');
                      setAreaUnitId('');
                    }}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- Entire Property (Common Ground) --</option>
                    {buildings.map((b: any) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                {/* 2. Tower */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    2. Tower / Block
                  </label>
                  <select
                    value={areaTowerId}
                    onChange={(e) => {
                      setAreaTowerId(e.target.value);
                      setAreaFloorId('');
                      setAreaUnitId('');
                    }}
                    disabled={!areaBuildingId && filteredTowersForArea.length === 0}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    <option value="">-- All Towers / Whole Building --</option>
                    {filteredTowersForArea.map((t: any) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                {/* 3. Floor */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    3. Floor / Level
                  </label>
                  <select
                    value={areaFloorId}
                    onChange={(e) => {
                      setAreaFloorId(e.target.value);
                      setAreaUnitId('');
                    }}
                    disabled={!areaTowerId && filteredFloorsForArea.length === 0}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    <option value="">-- All Floors / Ground / Podium --</option>
                    {filteredFloorsForArea.map((f: any) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>

                {/* 4. Unit */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    4. Dedicated Unit / Space (Optional)
                  </label>
                  <select
                    value={areaUnitId}
                    onChange={(e) => setAreaUnitId(e.target.value)}
                    disabled={!areaFloorId && filteredUnitsForArea.length === 0}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    <option value="">-- Entire Floor (General Parking Level) --</option>
                    {filteredUnitsForArea.map((u: any) => {
                      const isUnavailable = isUnitUnavailableForParking(u);
                      const statusReason = getUnitAvailabilityReason(u);
                      return (
                        <option key={u.id} value={u.id} disabled={isUnavailable}>
                          Unit {u.name || u.unitNumber} {isUnavailable ? `• [${statusReason}]` : '• [Available]'}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Breadcrumb Path Preview */}
              <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/80 flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-xs text-indigo-700 dark:text-indigo-300 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                  <span>Mapped Location:</span>
                  <span className="font-bold">{selectedHierarchyBreadcrumb}</span>
                </div>

                {areaUnitId && (
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-start gap-2 text-xs text-amber-800 dark:text-amber-200">
                    <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Exclusivity Lock:</strong> Once assigned as a parking area, this unit will be designated exclusively for parking and cannot be assigned to any resident, owner, or tenant.
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Description / Access Instructions
              </label>
              <Input 
                value={areaDescription} 
                onChange={e => setAreaDescription(e.target.value)} 
                placeholder="e.g., Access via North Gate ramp, clearance 2.4m, speed limit 10km/h"
                className="rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-3 pt-5 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" onClick={() => setIsCreateAreaModalOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button type="submit" isLoading={isCreatingArea} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
                Create Zone
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal 2: Create Parking Slot */}
        <Modal 
          isOpen={isCreateSlotModalOpen} 
          onClose={() => setIsCreateSlotModalOpen(false)} 
          title="Add New Parking Bay / Slot"
        >
          <form onSubmit={handleCreateSlot} className="space-y-4">
            {areas.length === 0 ? (
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  No Parking Zones Configured Yet
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                  Before adding individual parking bays or slots, you must define at least one Parking Area/Zone (such as Basement B1, Tower A Ground, or a dedicated unit).
                </p>
                <Button
                  type="button"
                  onClick={() => {
                    setIsCreateSlotModalOpen(false);
                    setIsCreateAreaModalOpen(true);
                  }}
                  className="mt-1 text-xs bg-amber-600 hover:bg-amber-700 text-white rounded-lg py-1.5 px-3 flex items-center gap-1.5 shadow-sm font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Define Parking Zone First
                </Button>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Target Zone / Area *
                </label>
                <select 
                  value={slotAreaId} 
                  onChange={e => setSlotAreaId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select a Parking Area...</option>
                  {areas.map((a: any) => {
                    const path = getAreaHierarchyPath(a);
                    return (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.type}) {path ? `• [${path}]` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Slot Code / Identifier *
              </label>
              <Input 
                value={slotNumber} 
                onChange={e => setSlotNumber(e.target.value)} 
                placeholder="e.g., B1-101, A-04"
                className="rounded-xl font-mono uppercase"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Slot Bay Type
                </label>
                <select 
                  value={slotType} 
                  onChange={e => setSlotType(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="STANDARD">Standard</option>
                  <option value="COMPACT">Compact</option>
                  <option value="EV_CHARGING">EV Charging Station</option>
                  <option value="HANDICAPPED">Accessible / Disabled</option>
                  <option value="VISITOR">Visitor Only</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Initial Status
                </label>
                <select 
                  value={slotStatus} 
                  onChange={e => setSlotStatus(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="RESERVED">Reserved</option>
                  <option value="MAINTENANCE">Under Maintenance</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-5 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" onClick={() => setIsCreateSlotModalOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={areas.length === 0} 
                isLoading={isCreatingSlot} 
                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold disabled:opacity-50"
              >
                Add Slot
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal 3: Allocate Parking Slot */}
        <Modal 
          isOpen={isAllocateModalOpen} 
          onClose={() => setIsAllocateModalOpen(false)} 
          title="Allocate Parking Bay"
        >
          <form onSubmit={handleAllocateSlot} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Target Available Slot *
              </label>
              <select 
                value={allocateSlotId} 
                onChange={e => setAllocateSlotId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">Select an available slot...</option>
                {slots.filter((s: any) => s.status === 'AVAILABLE').map((s: any) => {
                  const area = areas.find((a: any) => a.id === s.areaId);
                  const path = area ? getAreaHierarchyPath(area) : '';
                  return (
                    <option key={s.id} value={s.id}>
                      {s.slotNumber} • {area?.name || 'General'} ({s.type}) {path ? `[${path}]` : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Allocation Type
              </label>
              <select 
                value={allocateType} 
                onChange={e => setAllocateType(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="PERMANENT">Permanent Resident Lease</option>
                <option value="TEMPORARY">Temporary / Short-term</option>
                <option value="VISITOR">Visitor Pass Allocation</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Assign to Resident Unit (Optional)
              </label>
              <select 
                value={allocateUnitId} 
                onChange={e => setAllocateUnitId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select a residential or commercial unit...</option>
                {units.filter((u: any) => u.status !== 'PARKING_ALLOCATED' && !u.metadata?.isParkingArea).map((u: any) => (
                  <option key={u.id} value={u.id}>
                    Unit {u.unitNumber || u.name} {u.parent?.name ? `(${u.parent.name})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Assign Vehicle (Optional)
              </label>
              <select 
                value={allocateVehicleId} 
                onChange={e => setAllocateVehicleId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select a registered vehicle...</option>
                {vehicles.map((v: any) => (
                  <option key={v.id} value={v.id}>
                    {v.licensePlate} • {v.make || ''} {v.model || ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-5 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" onClick={() => setIsAllocateModalOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button type="submit" isLoading={isAllocating} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white">
                Confirm Allocation
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal 4: Report Parking Infraction */}
        <Modal 
          isOpen={isReportViolationModalOpen} 
          onClose={() => setIsReportViolationModalOpen(false)} 
          title="Report Parking Infraction / Violation"
        >
          <form onSubmit={handleReportViolation} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Infraction Classification *
              </label>
              <select 
                value={violationType} 
                onChange={e => setViolationType(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="UNAUTHORIZED_PARKING">Unauthorized Parking (No permit)</option>
                <option value="OVERSTAY">Overstay / Exceeded Time Limit</option>
                <option value="WRONG_SLOT">Wrong Slot / Occupying Reserved Bay</option>
                <option value="IMPROPER_PARKING">Improper Parking / Double Parking / Obstruction</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Slot Involved (Optional)
                </label>
                <select 
                  value={violationSlotId} 
                  onChange={e => setViolationSlotId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="">Select bay...</option>
                  {slots.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.slotNumber}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Fine Amount (₹)
                </label>
                <Input 
                  type="number"
                  value={violationFineAmount} 
                  onChange={e => setViolationFineAmount(e.target.value)} 
                  placeholder="e.g., 500"
                  className="rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Vehicle Involved (Optional)
              </label>
              <select 
                value={violationVehicleId} 
                onChange={e => setViolationVehicleId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="">Select a registered vehicle (if known)...</option>
                {vehicles.map((v: any) => (
                  <option key={v.id} value={v.id}>
                    {v.licensePlate} ({v.make || ''} {v.model || ''})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Incident Description & Evidence
              </label>
              <textarea 
                value={violationDescription} 
                onChange={e => setViolationDescription(e.target.value)} 
                rows={3}
                placeholder="Describe details: Vehicle color, make, notes on obstruction..."
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-5 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" onClick={() => setIsReportViolationModalOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button type="submit" isLoading={isReportingViolation} className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white">
                Log Infraction
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </RequireModule>
  );
}
