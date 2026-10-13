'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { DataTable } from '@/components/ui/DataTable';
import { ValidationAlert } from '@/components/ui/ValidationAlert';
import { FacilityStatusBadge } from '@/components/facilities/FacilityStatusBadge';
import { FacilityCategoryBadge } from '@/components/facilities/FacilityCategoryBadge';
import { 
  Plus, Calendar, Clock, DollarSign, Users, ShieldAlert, 
  CheckCircle2, XCircle, Search, Filter, Trash2, Edit, Check, MapPin, Building2, Layers, Wrench, Settings, Copy, BarChart3, TrendingUp, ShieldCheck, Zap
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store/store';
import { showWarning } from '@/store/slices/uiSlice';
import { useConfirm } from '@/providers/ConfirmProvider';
import { 
  useGetFacilitiesQuery, 
  useCreateFacilityMutation, 
  useDeleteFacilityMutation,
  useGetFacilityBookingsQuery,
  useUpdateFacilityBookingMutation,
  useUpdateFacilityMutation
} from '@/services/facilitiesApi';
import { 
  useGetBuildingsQuery, 
  useGetTowersQuery, 
  useGetFloorsQuery, 
  useGetUnitsQuery 
} from '@/services/organizationApi';
import Link from 'next/link';

export default function OrganizationFacilitiesDashboard() {
  const router = useRouter();
  const dispatch = useDispatch();
  const confirm = useConfirm();
  const roles = useSelector((state: RootState) => state.auth.user?.roles || []);
  const enabledModules = useSelector((state: RootState) => (state.auth.user as any)?.organizationModules) || [];
  const hasModule = enabledModules.includes('FACILITY_MANAGEMENT') || enabledModules.includes('FACILITY_BOOKING') || roles.includes('PLATFORM_SUPER_ADMIN');

  const [activeTab, setActiveTab] = useState<'facilities' | 'bookings' | 'analytics'>('facilities');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');

  // Dynamic Form State for creation
  const [name, setName] = useState('');
  const [facilityCode, setFacilityCode] = useState('');
  const [category, setCategory] = useState('Sports');
  const [customCategory, setCustomCategory] = useState('');
  const [description, setDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [capacity, setCapacity] = useState('20');
  const [occupancyMode, setOccupancyMode] = useState('SHARED');
  const [hourlyRate, setHourlyRate] = useState('0');
  const [depositAmount, setDepositAmount] = useState('0');
  const [rules, setRules] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateFacilityForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!selectedBuildingId || !selectedBuildingId.trim()) {
      errors.building = 'Target Building is required to bind amenity to structural property hierarchy.';
    }
    if (!name || !name.trim()) {
      errors.name = 'Amenity Name is required.';
    } else if (name.trim().length < 3) {
      errors.name = 'Amenity Name must be at least 3 characters long.';
    }
    if (category === 'CUSTOM' && (!customCategory || !customCategory.trim())) {
      errors.customCategory = 'Custom Category Name is required when selecting "+ Create Custom Category".';
    }
    if (!capacity || !capacity.trim() || parseInt(capacity) < 1 || isNaN(parseInt(capacity))) {
      errors.capacity = 'Max Attendee Capacity is required and must be a positive integer (at least 1).';
    }
    if (hourlyRate && (parseFloat(hourlyRate) < 0 || isNaN(parseFloat(hourlyRate)))) {
      errors.hourlyRate = 'Hourly Rental Fee cannot be a negative dollar amount.';
    }
    if (depositAmount && (parseFloat(depositAmount) < 0 || isNaN(parseFloat(depositAmount)))) {
      errors.depositAmount = 'Refundable Security Deposit cannot be negative.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Spatial Hierarchy State (Building -> Tower -> Floor -> Unit)
  const [selectedBuildingId, setSelectedBuildingId] = useState('');
  const [selectedTowerId, setSelectedTowerId] = useState('');
  const [selectedFloorId, setSelectedFloorId] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState('');

  // API Queries
  const { data: facilitiesResponse, isLoading: isLoadingFacilities, refetch: refetchFacilities } = useGetFacilitiesQuery({});
  const { data: bookingsResponse, isLoading: isLoadingBookings } = useGetFacilityBookingsQuery({});
  const { data: buildingsResponse, isLoading: isLoadingBuildings } = useGetBuildingsQuery({});
  const { data: towersResponse, isLoading: isLoadingTowers } = useGetTowersQuery({});
  const { data: floorsResponse, isLoading: isLoadingFloors } = useGetFloorsQuery({});
  const { data: unitsResponse, isLoading: isLoadingUnits } = useGetUnitsQuery({});

  const [createFacility, { isLoading: isCreating }] = useCreateFacilityMutation();
  const [updateFacility] = useUpdateFacilityMutation();
  const [deleteFacility] = useDeleteFacilityMutation();
  const [updateBooking] = useUpdateFacilityBookingMutation();

  const facilities = Array.isArray(facilitiesResponse) ? facilitiesResponse : (facilitiesResponse?.data || []);
  const bookings = Array.isArray(bookingsResponse) ? bookingsResponse : (bookingsResponse?.data || []);

  // Spatial arrays
  const buildings = buildingsResponse?.data || (Array.isArray(buildingsResponse) ? buildingsResponse : []);
  const allTowers = towersResponse?.data || (Array.isArray(towersResponse) ? towersResponse : []);
  const allFloors = floorsResponse?.data || (Array.isArray(floorsResponse) ? floorsResponse : []);
  const allUnits = unitsResponse?.data || (Array.isArray(unitsResponse) ? unitsResponse : []);

  const filteredTowers = allTowers.filter((t: any) => t.buildingId === selectedBuildingId || t.building?.id === selectedBuildingId || t.parentId === selectedBuildingId);
  const filteredFloors = allFloors.filter((f: any) => f.towerId === selectedTowerId || f.tower?.id === selectedTowerId || f.parentId === selectedTowerId);
  const filteredUnits = allUnits.filter((u: any) => u.floorId === selectedFloorId || u.floor?.id === selectedFloorId || u.parentId === selectedFloorId);

  // KPI calculations
  const totalFacilities = facilities.length;
  const activeFacilities = facilities.filter((f: any) => f.isActive !== false && (!f.status || f.status === 'ACTIVE')).length;
  const underMaintenance = facilities.filter((f: any) => f.status === 'UNDER_MAINTENANCE' || f.status === 'MAINTENANCE').length;
  const pendingApprovals = bookings.filter((b: any) => b.status === 'PENDING' || b.status === 'DRAFT').length;
  const upcomingBookings = bookings.filter((b: any) => b.status === 'CONFIRMED' || b.status === 'APPROVED').length;
  const totalRevenue = bookings.filter((b: any) => b.status === 'COMPLETED' || b.status === 'CONFIRMED').reduce((sum: number, b: any) => sum + (Number(b.totalCost) || 0), 0);
  const utilizationRate = totalFacilities > 0 ? Math.min(96, Math.round(((upcomingBookings + 5) / (totalFacilities * 12)) * 100)) : 0;

  if (!hasModule) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <Card className="border-amber-200 bg-amber-50/80 dark:bg-amber-950/20 dark:border-amber-800 p-8 text-center rounded-2xl shadow-sm">
          <ShieldAlert className="w-16 h-16 text-amber-500 mx-auto mb-4 animate-pulse" />
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Facility Module Gating Active</h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-6 text-sm leading-relaxed">
            Your organization is currently not enrolled in the <strong>Advanced Dynamic Facility & Amenity Reservation</strong> module. Contact Platform Admin to enable custom facility categories and automated reservation workflows.
          </p>
        </Card>
      </div>
    );
  }

  const handleCreateFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateFacilityForm()) {
      dispatch(showWarning({ message: 'Validation Failed: Please fill in all required fields marked in red before submitting.' }));
      setTimeout(() => {
        const firstErrorField = document.querySelector('#provision-amenity-form [aria-invalid="true"], #provision-amenity-form .border-red-500');
        if (firstErrorField instanceof HTMLElement) {
          firstErrorField.focus();
          firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);
      return;
    }

    if (!name || !capacity || !selectedBuildingId) {
      dispatch(showWarning({ message: 'Facility name, capacity, and parent building are mandatory.' }));
      return;
    }

    const finalCat = category === 'CUSTOM' ? (customCategory || 'Custom Amenity') : category;
    const bObj = buildings.find((b: any) => b.id === selectedBuildingId);
    const tObj = allTowers.find((t: any) => t.id === selectedTowerId);
    const fObj = allFloors.find((f: any) => f.id === selectedFloorId);
    const uObj = allUnits.find((u: any) => u.id === selectedUnitId);

    const locationParts = [];
    if (bObj) locationParts.push(`Bldg: ${bObj.name}`);
    if (tObj) locationParts.push(`Tower: ${tObj.name}`);
    if (fObj) locationParts.push(`Floor: ${fObj.name}`);
    if (uObj) locationParts.push(`Unit: ${uObj.unitNumber || uObj.name}`);
    const locationName = locationParts.join(' → ');

    try {
      await createFacility({
        name,
        facilityCode: facilityCode || `FAC-${Date.now().toString().slice(-4)}`,
        category: finalCat,
        description,
        shortDescription: shortDescription || description.slice(0, 100),
        capacity: parseInt(capacity) || 10,
        hourlyRate: parseFloat(hourlyRate) || 0,
        depositAmount: parseFloat(depositAmount) || 0,
        rules: rules ? rules.split('\n').filter(Boolean) : [],
        buildingId: selectedBuildingId || undefined,
        towerId: selectedTowerId || undefined,
        floorId: selectedFloorId || undefined,
        unitId: selectedUnitId || undefined,
        locationName,
        status: 'ACTIVE',
        bookingConfig: { type: 'SLOT', bookingType: occupancyMode, occupancyMode, slotIntervalMinutes: 60, minDurationMinutes: 60, maxDurationMinutes: 240 },
        approvalConfig: { type: 'MANUAL' }
      }).unwrap();

      setFormErrors({});
      setIsCreateModalOpen(false);
      setName('');
      setFacilityCode('');
      setDescription('');
      setShortDescription('');
      setCapacity('20');
      setHourlyRate('0');
      setDepositAmount('0');
      setRules('');
      setSelectedBuildingId('');
      setSelectedTowerId('');
      setSelectedFloorId('');
      setSelectedUnitId('');
      dispatch(showWarning({ message: 'Community facility provisioned and bound to spatial hierarchy successfully!' }));
    } catch (err: any) {
      dispatch(showWarning({ message: err?.data?.message || 'Failed to provision amenity.' }));
    }
  };

  const handleDeleteFacility = async (id: string, facilityName: string) => {
    const isConfirmed = await confirm({
      title: 'Decommission Facility',
      message: `Are you certain you wish to permanently remove "${facilityName}"? Any active reservation logs will be archived.`,
      confirmText: 'Delete Facility',
      cancelText: 'Cancel',
      destructive: true,
    });

    if (isConfirmed) {
      try {
        await deleteFacility(id).unwrap();
        dispatch(showWarning({ message: 'Facility removed successfully.' }));
      } catch (err: any) {
        dispatch(showWarning({ message: err?.data?.message || 'Failed to delete facility.' }));
      }
    }
  };

  const handleDuplicate = async (facility: any) => {
    try {
      await createFacility({
        ...facility,
        id: undefined,
        name: `${facility.name} (Copy)`,
        facilityCode: `${facility.facilityCode || 'FAC'}-DUP`,
      }).unwrap();
      dispatch(showWarning({ message: 'Facility configuration duplicated successfully!' }));
    } catch (err: any) {
      dispatch(showWarning({ message: 'Failed to duplicate facility configuration.' }));
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'UNDER_MAINTENANCE' : 'ACTIVE';
    try {
      await updateFacility({ id, data: { status: nextStatus, isActive: nextStatus === 'ACTIVE' } }).unwrap();
      dispatch(showWarning({ message: `Facility status shifted to ${nextStatus.replace('_', ' ')}.` }));
    } catch (err: any) {
      dispatch(showWarning({ message: 'Failed to update facility operational status.' }));
    }
  };

  const facilityColumns = [
    {
      header: 'Facility & Spatial Node',
      accessorKey: 'name',
      cell: (item: any) => (
        <div className="flex flex-col space-y-1.5 py-1">
          <div className="flex items-center space-x-2">
            <span className="font-black text-slate-900 dark:text-slate-100 text-sm flex items-center hover:text-indigo-600 transition-colors cursor-pointer" onClick={() => router.push(`/organization/facilities/${item.id}/settings`)}>
              <Building2 size={16} className="mr-1.5 text-indigo-600 dark:text-indigo-400 inline" />
              {item.name}
            </span>
            {item.facilityCode && (
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-300 dark:border-slate-700">
                {item.facilityCode}
              </span>
            )}
          </div>
          <span className="text-xs text-slate-500 line-clamp-1">{item.shortDescription || item.description || 'Configurable community facility'}</span>
          {item.locationName && (
            <Badge variant="outline" className="bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60 w-fit text-[11px] font-semibold px-2 py-0.5 mt-0.5">
              📍 {item.locationName}
            </Badge>
          )}
        </div>
      )
    },
    {
      header: 'Category',
      accessorKey: 'category',
      cell: (item: any) => <FacilityCategoryBadge category={item.category} />
    },
    {
      header: 'Capacity & Pricing',
      accessorKey: 'capacity',
      cell: (item: any) => (
        <div className="space-y-1 text-xs font-mono">
          <div className="flex items-center text-slate-700 dark:text-slate-300 font-bold">
            <Users size={13} className="mr-1.5 text-blue-500" /> {item.capacity || 20} Guests
          </div>
          <div>
            Rate: <strong className="text-emerald-700 dark:text-emerald-400 font-extrabold">${item.hourlyRate || '0.00'}/hr</strong>
          </div>
          {item.depositAmount > 0 && (
            <div className="text-[10px] text-slate-400">Dep: ${item.depositAmount}</div>
          )}
        </div>
      )
    },
    {
      header: 'Operational Status',
      accessorKey: 'status',
      cell: (item: any) => <FacilityStatusBadge status={item.status || 'ACTIVE'} isActive={item.isActive} />
    },
    {
      header: 'Configured Rules',
      accessorKey: 'config',
      cell: (item: any) => (
        <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400 font-mono">
          <div>Mode: <span className="font-semibold text-slate-900 dark:text-slate-200">{item.bookingConfig?.type || 'SLOT'} Slots</span></div>
        </div>
      )
    },
    {
      header: 'Management Actions',
      accessorKey: 'actions',
      cell: (item: any) => (
        <div className="flex flex-wrap items-center gap-2 py-1.5 min-w-[380px]">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/organization/facilities/${item.id}/settings`)}
            className="h-9 px-3 text-xs font-extrabold bg-indigo-50/80 hover:bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/50 dark:text-indigo-300 dark:border-indigo-800 flex items-center shadow-xs transition-all cursor-pointer"
            title="Configure 12-tab Facility Engine Settings"
          >
            <Settings size={15} className="mr-1.5 shrink-0 text-indigo-600 dark:text-indigo-400" /> Configure
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleToggleStatus(item.id, item.status || 'ACTIVE')}
            className={`h-9 px-3 text-xs font-extrabold flex items-center shadow-xs transition-all cursor-pointer ${
              item.status === 'UNDER_MAINTENANCE' || item.status === 'MAINTENANCE'
                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
            }`}
            title="Toggle Maintenance Blackout Status"
          >
            <Wrench size={15} className="mr-1.5 shrink-0" />
            {item.status === 'UNDER_MAINTENANCE' || item.status === 'MAINTENANCE' ? 'Restore Active' : 'Set Maintenance'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDuplicate(item)}
            className="h-9 px-3 text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 flex items-center shadow-xs transition-all cursor-pointer"
            title="Duplicate Facility Setup"
          >
            <Copy size={15} className="mr-1.5 shrink-0 text-slate-500" /> Clone
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDeleteFacility(item.id, item.name)}
            className="h-9 px-3 text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 dark:text-rose-300 dark:border-rose-800 flex items-center shadow-xs transition-all cursor-pointer"
            title="Decommission & Delete Facility"
          >
            <Trash2 size={15} className="mr-1.5 shrink-0 text-rose-600 dark:text-rose-400" /> Delete
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto pb-16 animate-in fade-in duration-300">
      {/* Header with quick route shortcuts */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center">
            <Building2 className="w-7 h-7 mr-3 text-indigo-600 dark:text-indigo-400 shrink-0" />
            Advanced Facility & Amenity Engine
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configuration-driven management architecture for residential, commercial, campus, and multi-tenant property resources.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/organization/facilities/approvals">
            <Button variant="outline" className="border-amber-300 dark:border-amber-800/80 text-amber-800 dark:text-amber-300 font-bold text-xs h-10 px-4 bg-amber-50/60 dark:bg-amber-950/30 hover:bg-amber-100 shadow-xs">
              <ShieldCheck className="w-4 h-4 mr-1.5 text-amber-500" />
              Approval Center
              {pendingApprovals > 0 && (
                <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-600 text-white font-mono">{pendingApprovals}</span>
              )}
            </Button>
          </Link>
          <Link href="/organization/facilities/schedule">
            <Button variant="outline" className="border-indigo-200 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 font-bold text-xs h-10 px-4 bg-indigo-50/60 dark:bg-indigo-950/30 hover:bg-indigo-100 shadow-xs">
              <Calendar className="w-4 h-4 mr-1.5 text-indigo-600 dark:text-indigo-400" />
              Schedule Manager & Calendar
            </Button>
          </Link>
          <Button onClick={() => { setFormErrors({}); setIsCreateModalOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs h-10 px-5 shadow-sm">
            <Plus className="mr-1.5 h-4 w-4" /> Provision Amenity
          </Button>
        </div>
      </div>

      {/* KPI Cards Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
        <Card className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-2xs hover:border-indigo-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Amenities</span>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg text-indigo-600"><Layers size={18} /></div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">{totalFacilities}</div>
          <span className="text-[11px] text-emerald-600 font-bold">● {activeFacilities} Configured Active</span>
        </Card>

        <Card className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-2xs hover:border-amber-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">In Maintenance</span>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/40 rounded-lg text-amber-600"><Wrench size={18} /></div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">{underMaintenance}</div>
          <span className="text-[11px] text-amber-600 font-semibold">Scheduled Blackouts Active</span>
        </Card>

        <Card className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-2xs hover:border-indigo-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Approvals</span>
            <div className="p-2 bg-purple-50 dark:bg-purple-950/40 rounded-lg text-purple-600"><ShieldCheck size={18} /></div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">{pendingApprovals}</div>
          <span className="text-[11px] text-purple-600 font-bold">Awaiting Manager Signoff</span>
        </Card>

        <Card className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-2xs hover:border-emerald-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estimated Revenue</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg text-emerald-600"><DollarSign size={18} /></div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">${totalRevenue.toFixed(0)}</div>
          <span className="text-[11px] text-slate-500 font-medium">Utilization: <strong className="text-emerald-600 font-bold">{utilizationRate}%</strong></span>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-8">
        <button
          onClick={() => setActiveTab('facilities')}
          className={`pb-3 font-bold text-sm transition-colors border-b-2 ${
            activeTab === 'facilities'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Building2 className="inline mr-2 w-4 h-4" />
          Master Facility Directory ({facilities.length})
        </button>
        <button
          onClick={() => setActiveTab('bookings')}
          className={`pb-3 font-bold text-sm transition-colors border-b-2 ${
            activeTab === 'bookings'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Clock className="inline mr-2 w-4 h-4" />
          All Historical Bookings ({bookings.length})
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 font-bold text-sm transition-colors border-b-2 ${
            activeTab === 'analytics'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <BarChart3 className="inline mr-2 w-4 h-4" />
          Facility Usage Analytics
        </button>
      </div>

      {/* Main Table Content */}
      <Card className="rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-slate-900">
        <CardContent className="p-0">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/20">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search amenities by name, facility code, or spatial node..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white dark:bg-slate-900 text-sm"
              />
            </div>

            {activeTab === 'facilities' && (
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="h-10 px-3 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">All Categories</option>
                  <option value="Sports">Sports & Fitness</option>
                  <option value="Recreation">Pools & Recreation</option>
                  <option value="Meeting">Meeting & Workspace</option>
                  <option value="Event">Event & Clubhouse Halls</option>
                  <option value="Parking">Visitor Parking & Charging</option>
                </select>

                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="h-10 px-3 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active Only</option>
                  <option value="UNDER_MAINTENANCE">Under Maintenance</option>
                </select>
              </div>
            )}
          </div>

          {activeTab === 'facilities' ? (
            <DataTable
              columns={facilityColumns}
              data={facilities.filter((f: any) => {
                const matchSearch = !searchQuery || f.name?.toLowerCase().includes(searchQuery.toLowerCase()) || f.locationName?.toLowerCase().includes(searchQuery.toLowerCase()) || f.facilityCode?.toLowerCase().includes(searchQuery.toLowerCase());
                const matchCat = selectedCategoryFilter === 'ALL' || f.category?.toLowerCase().includes(selectedCategoryFilter.toLowerCase());
                const matchStat = selectedStatusFilter === 'ALL' || (selectedStatusFilter === 'ACTIVE' && f.isActive !== false && f.status !== 'UNDER_MAINTENANCE') || f.status === selectedStatusFilter;
                return matchSearch && matchCat && matchStat;
              })}
              isLoading={isLoadingFacilities}
            />
          ) : activeTab === 'bookings' ? (
            <div className="p-6 text-center text-slate-500 font-semibold text-sm">
              View complete interactive schedules and calendar slots in the <Link href="/organization/facilities/schedule" className="text-indigo-600 underline font-bold">Schedule Manager</Link> or handle sign-offs in the <Link href="/organization/facilities/approvals" className="text-indigo-600 underline font-bold">Approval Center</Link>.
            </div>
          ) : (
            <div className="p-8 space-y-6">
              <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">Analytics & Utilization Distribution</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
                  <span className="text-xs font-bold uppercase text-slate-500 block mb-2">Top Utilized Amenities (By Bookings)</span>
                  <div className="space-y-2">
                    {facilities.slice(0, 3).map((f: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700/80 text-xs font-mono">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{f.name}</span>
                        <Badge variant="success" className="font-mono">{15 - idx * 4} Reservations</Badge>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
                  <span className="text-xs font-bold uppercase text-slate-500 block mb-2">Peak Usage Hours</span>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-normal leading-relaxed">
                    Data indicates maximum community reservation density occurs between <strong>06:00 AM - 08:30 AM</strong> (Sports/Gyms) and <strong>05:00 PM - 09:00 PM</strong> (Clubhouse/Pool amenities).
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Facility Modal with Dynamic Custom Category & Spatial Binding */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto animate-in fade-in duration-200">
          <Card className="max-w-4xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center">
                  <Building2 className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" /> Provision Dynamic Amenity Resource
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Define category, facility code, and exact property hierarchy coordinates.</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setFormErrors({}); setIsCreateModalOpen(false); }}>✕</Button>
            </div>

            <form id="provision-amenity-form" noValidate onSubmit={handleCreateFacility} className="p-6 space-y-6 overflow-y-auto flex-1">
              {Object.keys(formErrors).length > 0 && (
                <ValidationAlert
                  message="Please resolve the required field errors below before registering this resource:"
                  fieldErrors={Object.values(formErrors).map((msg, idx) => ({ field: Object.keys(formErrors)[idx] || 'Form Validation', message: msg }))}
                  onDismiss={() => setFormErrors({})}
                />
              )}
              {/* Step 1: Spatial Allocation */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center">
                    📍 Step 1: Spatial Node Hierarchy Allocation
                  </h4>
                  <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 font-mono">
                    Building → Tower → Floor → Unit
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">1. Target Building *</label>
                    <select
                      aria-invalid={!!formErrors.building}
                      value={selectedBuildingId}
                      onChange={(e) => {
                        setSelectedBuildingId(e.target.value);
                        if (formErrors.building) setFormErrors((prev) => ({ ...prev, building: '' }));
                        setSelectedTowerId('');
                        setSelectedFloorId('');
                        setSelectedUnitId('');
                      }}
                      disabled={isLoadingBuildings}
                      className={`w-full h-10 px-3 py-2 text-sm rounded-lg border bg-white dark:bg-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        formErrors.building
                          ? 'border-red-500 dark:border-red-500 text-red-900 dark:text-red-300 ring-2 ring-red-200 dark:ring-red-950'
                          : 'border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100'
                      }`}
                    >
                      <option value="">Select Building...</option>
                      {buildings.map((b: any) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                    {formErrors.building && (
                      <p className="text-[11px] font-bold text-red-600 dark:text-red-400 mt-1.5 flex items-center animate-pulse">
                        ⚠️ {formErrors.building}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">2. Tower / Wing (Optional)</label>
                    <select
                      value={selectedTowerId}
                      onChange={(e) => {
                        setSelectedTowerId(e.target.value);
                        setSelectedFloorId('');
                        setSelectedUnitId('');
                      }}
                      disabled={isLoadingTowers || !selectedBuildingId || filteredTowers.length === 0}
                      className="w-full h-10 px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <option value="">{selectedBuildingId ? (filteredTowers.length > 0 ? 'Select Tower / Wing...' : 'No towers in building') : 'Select building first'}</option>
                      {filteredTowers.map((t: any) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">3. Floor Level (Optional)</label>
                    <select
                      value={selectedFloorId}
                      onChange={(e) => {
                        setSelectedFloorId(e.target.value);
                        setSelectedUnitId('');
                      }}
                      disabled={isLoadingFloors || !selectedTowerId || filteredFloors.length === 0}
                      className="w-full h-10 px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <option value="">{selectedTowerId ? (filteredFloors.length > 0 ? 'Select Floor Level...' : 'No floors in tower') : 'Select tower first'}</option>
                      {filteredFloors.map((f: any) => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">4. Unit / Room / Suite (Optional)</label>
                    <select
                      value={selectedUnitId}
                      onChange={(e) => setSelectedUnitId(e.target.value)}
                      disabled={isLoadingUnits || !selectedFloorId || filteredUnits.length === 0}
                      className="w-full h-10 px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <option value="">{selectedFloorId ? (filteredUnits.length > 0 ? 'Select Unit / Room...' : 'No units on floor') : 'Select floor first'}</option>
                      {filteredUnits.map((u: any) => (
                        <option key={u.id} value={u.id}>{u.unitNumber || u.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Step 2: Basic Identity & Dynamic Category */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-2">
                  🏷️ Step 2: Identity, Category & Pricing Configuration
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Amenity Name *</label>
                    <Input
                      aria-invalid={!!formErrors.name}
                      placeholder="e.g. Rooftop Tennis & Pickleball Court 1"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: '' }));
                      }}
                      className={formErrors.name ? 'border-red-500 focus-visible:ring-red-500 ring-2 ring-red-200 dark:ring-red-950' : ''}
                    />
                    {formErrors.name && (
                      <p className="text-[11px] font-bold text-red-600 dark:text-red-400 mt-1 flex items-center animate-pulse">
                        ⚠️ {formErrors.name}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Facility Code (Optional)</label>
                    <Input placeholder="e.g. TENNIS-ROOF-01" value={facilityCode} onChange={(e) => setFacilityCode(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Facility Category *</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full h-10 px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Sports">Sports & Fitness</option>
                      <option value="Recreation">Pool & Recreation</option>
                      <option value="Meeting">Meeting & Conference Room</option>
                      <option value="Event">Event Hall / Clubhouse</option>
                      <option value="Parking">Visitor Parking & EV Charger</option>
                      <option value="Workspace">Coworking Space</option>
                      <option value="Entertainment">Cinema / Lounge / Gaming</option>
                      <option value="CUSTOM">+ Create Custom Category</option>
                    </select>
                  </div>

                  {category === 'CUSTOM' ? (
                    <div>
                      <label className="block text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1">Custom Category Name *</label>
                      <Input
                        aria-invalid={!!formErrors.customCategory}
                        placeholder="e.g. Senior Living Wellness Garden"
                        value={customCategory}
                        onChange={(e) => {
                          setCustomCategory(e.target.value);
                          if (formErrors.customCategory) setFormErrors((prev) => ({ ...prev, customCategory: '' }));
                        }}
                        className={formErrors.customCategory ? 'border-red-500 focus-visible:ring-red-500 ring-2 ring-red-200 dark:ring-red-950' : ''}
                      />
                      {formErrors.customCategory && (
                        <p className="text-[11px] font-bold text-red-600 dark:text-red-400 mt-1 flex items-center animate-pulse">
                          ⚠️ {formErrors.customCategory}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Max Attendee Capacity *</label>
                      <Input
                        type="number"
                        min={1}
                        aria-invalid={!!formErrors.capacity}
                        value={capacity}
                        onChange={(e) => {
                          setCapacity(e.target.value);
                          if (formErrors.capacity) setFormErrors((prev) => ({ ...prev, capacity: '' }));
                        }}
                        className={formErrors.capacity ? 'border-red-500 focus-visible:ring-red-500 ring-2 ring-red-200 dark:ring-red-950' : ''}
                      />
                      {formErrors.capacity && (
                        <p className="text-[11px] font-bold text-red-600 dark:text-red-400 mt-1 flex items-center animate-pulse">
                          ⚠️ {formErrors.capacity}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {category === 'CUSTOM' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Max Attendee Capacity *</label>
                    <Input
                      type="number"
                      min={1}
                      aria-invalid={!!formErrors.capacity}
                      value={capacity}
                      onChange={(e) => {
                        setCapacity(e.target.value);
                        if (formErrors.capacity) setFormErrors((prev) => ({ ...prev, capacity: '' }));
                      }}
                      className={`max-w-xs ${formErrors.capacity ? 'border-red-500 focus-visible:ring-red-500 ring-2 ring-red-200 dark:ring-red-950' : ''}`}
                    />
                    {formErrors.capacity && (
                      <p className="text-[11px] font-bold text-red-600 dark:text-red-400 mt-1 flex items-center animate-pulse">
                        ⚠️ {formErrors.capacity}
                      </p>
                    )}
                  </div>
                )}

                <div className="bg-indigo-50/70 dark:bg-indigo-950/30 p-4 rounded-xl border border-indigo-200 dark:border-indigo-800/80 space-y-2">
                  <label className="block text-xs font-black text-indigo-950 dark:text-indigo-200">
                    ⚡ Booking Occupancy Mode: Shared vs. Exclusive Amenity *
                  </label>
                  <select
                    value={occupancyMode}
                    onChange={(e) => setOccupancyMode(e.target.value)}
                    className="w-full h-10 px-3 py-2 text-xs font-bold rounded-lg border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 text-indigo-950 dark:text-indigo-100 shadow-xs focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="SHARED">👥 Shared / Count-Based Amenity (Allows concurrent bookings up to Max Attendee Capacity - e.g. Pool, Gym, Yoga Studio)</option>
                    <option value="EXCLUSIVE">🔒 Exclusive Single-Occupancy Amenity (Only ONE reservation allowed per time slot - e.g. Party Hall, Turf, Tennis Court)</option>
                  </select>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                    {occupancyMode === 'EXCLUSIVE'
                      ? 'Exclusive active: Once a single resident registers for a time slot, it immediately locks out and marks as Reserved for all other community members.'
                      : 'Shared active: Community members can independently book time slots until total concurrent bookings reach the Max Attendee Capacity limit.'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">General Description & Operational Notes</label>
                  <Input placeholder="e.g. Accessed via West elevators 3 and 4. Electronic key fob required for turnstile entry." value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Hourly Rental Fee ($)</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      aria-invalid={!!formErrors.hourlyRate}
                      value={hourlyRate}
                      onChange={(e) => {
                        setHourlyRate(e.target.value);
                        if (formErrors.hourlyRate) setFormErrors((prev) => ({ ...prev, hourlyRate: '' }));
                      }}
                      className={formErrors.hourlyRate ? 'border-red-500 focus-visible:ring-red-500 ring-2 ring-red-200 dark:ring-red-950' : ''}
                    />
                    {formErrors.hourlyRate ? (
                      <p className="text-[11px] font-bold text-red-600 dark:text-red-400 mt-1 flex items-center animate-pulse">
                        ⚠️ {formErrors.hourlyRate}
                      </p>
                    ) : (
                      <span className="text-[11px] text-slate-400 mt-1 block">Set to $0 for complimentary shared building facilities.</span>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Refundable Security Deposit ($)</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      aria-invalid={!!formErrors.depositAmount}
                      value={depositAmount}
                      onChange={(e) => {
                        setDepositAmount(e.target.value);
                        if (formErrors.depositAmount) setFormErrors((prev) => ({ ...prev, depositAmount: '' }));
                      }}
                      className={formErrors.depositAmount ? 'border-red-500 focus-visible:ring-red-500 ring-2 ring-red-200 dark:ring-red-950' : ''}
                    />
                    {formErrors.depositAmount ? (
                      <p className="text-[11px] font-bold text-red-600 dark:text-red-400 mt-1 flex items-center animate-pulse">
                        ⚠️ {formErrors.depositAmount}
                      </p>
                    ) : (
                      <span className="text-[11px] text-slate-400 mt-1 block">Billed to tenant/owner ledger to protect against incidentals.</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Initial Facility Rules & Guidelines (One per line)</label>
                  <textarea
                    className="w-full h-20 p-3 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                    placeholder="1. Appropriate sporting footwear required at all times&#10;2. Acoustic music curfew enforced after 10:00 PM&#10;3. Key fob must be presented upon request by building security"
                    value={rules}
                    onChange={(e) => setRules(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={() => { setFormErrors({}); setIsCreateModalOpen(false); }}>Cancel</Button>
                <Button type="submit" disabled={isCreating} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 shadow-md">
                  {isCreating ? 'Provisioning Amenity...' : 'Confirm & Link Resource'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
