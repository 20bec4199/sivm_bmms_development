'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { FacilityStatusBadge } from '@/components/facilities/FacilityStatusBadge';
import { FacilityCategoryBadge } from '@/components/facilities/FacilityCategoryBadge';
import { CustomFieldBuilder, CustomFieldDef } from '@/components/facilities/CustomFieldBuilder';
import { OperatingHoursEditor, DaySchedule } from '@/components/facilities/OperatingHoursEditor';
import { MaintenanceBlockForm, MaintenanceBlock } from '@/components/facilities/MaintenanceBlockForm';
import { 
  Building2, MapPin, Users, Calendar, Clock, DollarSign, ShieldCheck, 
  Layers, Wrench, Bell, Wrench as AssetIcon, FileText, ArrowLeft, Save, Sparkles, Check, AlertCircle, Trash2
} from 'lucide-react';
import { useGetFacilityByIdQuery, useUpdateFacilityMutation, useGetFacilityBookingsQuery } from '@/services/facilitiesApi';
import { useDispatch } from 'react-redux';
import { showWarning } from '@/store/slices/uiSlice';

type ConfigTab = 
  | 'general' 
  | 'location' 
  | 'eligibility' 
  | 'booking_engine' 
  | 'operating_hours' 
  | 'pricing' 
  | 'approvals' 
  | 'custom_fields' 
  | 'maintenance_blocks' 
  | 'notifications' 
  | 'assets_work_orders' 
  | 'audit_analytics';

export default function FacilitySettingsPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const facilityId = params?.id as string;

  const { data: facilityData, isLoading, refetch } = useGetFacilityByIdQuery(facilityId, { skip: !facilityId });
  const { data: bookingsData } = useGetFacilityBookingsQuery({ facilityId }, { skip: !facilityId });
  const [updateFacility, { isLoading: isSaving }] = useUpdateFacilityMutation();

  const facility = facilityData?.data || facilityData || {};
  const bookings = Array.isArray(bookingsData) ? bookingsData : (bookingsData?.data || []);

  const [activeTab, setActiveTab] = useState<ConfigTab>('general');

  // Form states initialized when facility loads
  const [name, setName] = useState('');
  const [facilityCode, setFacilityCode] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [description, setDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [rules, setRules] = useState('');

  // Eligibility & Capacity
  const [capacity, setCapacity] = useState<number>(20);
  const [occupancyMode, setOccupancyMode] = useState<'SHARED' | 'EXCLUSIVE'>('SHARED');
  const [minCapacity, setMinCapacity] = useState<number>(1);
  const [maxGuests, setMaxGuests] = useState<number>(5);
  const [allowedRoles, setAllowedRoles] = useState<string[]>(['Resident', 'Tenant', 'Owner']);
  const [maxBookingsPerWeek, setMaxBookingsPerWeek] = useState<number>(3);
  const [advanceBookingDays, setAdvanceBookingDays] = useState<number>(30);

  // Booking Engine Mode
  const [bookingType, setBookingType] = useState<'SLOT' | 'DURATION' | 'FULL_DAY'>('SLOT');
  const [slotIntervalMinutes, setSlotIntervalMinutes] = useState<number>(60);
  const [minDurationMinutes, setMinDurationMinutes] = useState<number>(60);
  const [maxDurationMinutes, setMaxDurationMinutes] = useState<number>(240);
  const [allowRecurring, setAllowRecurring] = useState<boolean>(true);

  // Pricing & Billing
  const [pricingType, setPricingType] = useState<'FREE' | 'PER_HOUR' | 'PER_DAY' | 'PER_SLOT'>('PER_HOUR');
  const [hourlyRate, setHourlyRate] = useState<number>(0);
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [cancellationRefundPct, setCancellationRefundPct] = useState<number>(100);
  const [freeCancellationHours, setFreeCancellationHours] = useState<number>(24);

  // Approval config
  const [approvalType, setApprovalType] = useState<'AUTO' | 'MANUAL' | 'CONDITIONAL'>('MANUAL');
  const [maxAutoGuests, setMaxAutoGuests] = useState<number>(10);

  // Dynamic modules
  const [customFields, setCustomFields] = useState<CustomFieldDef[]>([]);
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [maintenanceBlocks, setMaintenanceBlocks] = useState<MaintenanceBlock[]>([]);

  useEffect(() => {
    if (facility && facility.id) {
      setName(facility.name || '');
      setFacilityCode(facility.facilityCode || '');
      setCategory(facility.category || 'Recreation');
      setStatus(facility.status || 'ACTIVE');
      setDescription(facility.description || '');
      setShortDescription(facility.shortDescription || '');
      setImageUrl(facility.imageUrl || '');
      setRules((facility.rules || []).join('\n'));

      setCapacity(facility.capacity || 20);
      const elig = facility.eligibilityRules || {};
      setMinCapacity(elig.minCapacity || 1);
      setMaxGuests(elig.maxGuests || 5);
      setAllowedRoles(elig.allowedRoles || ['Resident', 'Tenant', 'Owner']);
      setMaxBookingsPerWeek(elig.maxBookingsPerWeek || 3);
      setAdvanceBookingDays(elig.advanceBookingDays || 30);

      const bc = facility.bookingConfig || {};
      setBookingType(bc.type || 'SLOT');
      setOccupancyMode(bc.bookingType === 'EXCLUSIVE' || bc.occupancyMode === 'EXCLUSIVE' || bc.exclusive === true ? 'EXCLUSIVE' : 'SHARED');
      setSlotIntervalMinutes(bc.slotIntervalMinutes || 60);
      setMinDurationMinutes(bc.minDurationMinutes || 60);
      setMaxDurationMinutes(bc.maxDurationMinutes || 240);
      setAllowRecurring(bc.allowRecurring !== false);

      const pc = facility.pricingConfig || {};
      setPricingType(pc.type || (facility.hourlyRate === 0 ? 'FREE' : 'PER_HOUR'));
      setHourlyRate(facility.hourlyRate || 0);
      setDepositAmount(facility.depositAmount || 0);
      setCancellationRefundPct(facility.cancellationRules?.refundPct ?? 100);
      setFreeCancellationHours(facility.cancellationRules?.freeCancellationHours ?? 24);

      const ac = facility.approvalConfig || {};
      setApprovalType(ac.type || 'MANUAL');
      setMaxAutoGuests(ac.conditionalRules?.maxAutoGuests || 10);

      setCustomFields(Array.isArray(facility.customFields) ? facility.customFields : []);
      if (Array.isArray(facility.availabilitySchedule)) setSchedule(facility.availabilitySchedule);
      if (Array.isArray(facility.maintenanceBlocks)) setMaintenanceBlocks(facility.maintenanceBlocks);
    }
  }, [facility.id]);

  if (isLoading || !facility.id) {
    return (
      <div className="p-12 max-w-7xl mx-auto text-center font-bold text-slate-500">
        Loading comprehensive 12-tab facility architecture engine...
      </div>
    );
  }

  const handleSaveAll = async () => {
    try {
      const payload = {
        name,
        facilityCode,
        category,
        status,
        isActive: status === 'ACTIVE',
        description,
        shortDescription,
        imageUrl,
        rules: rules ? rules.split('\n').map(r => r.trim()).filter(Boolean) : [],
        capacity: Number(capacity),
        hourlyRate: Number(hourlyRate),
        depositAmount: Number(depositAmount),
        eligibilityRules: { minCapacity: Number(minCapacity), maxGuests: Number(maxGuests), allowedRoles, maxBookingsPerWeek: Number(maxBookingsPerWeek), advanceBookingDays: Number(advanceBookingDays) },
        bookingConfig: { type: bookingType, bookingType: occupancyMode, occupancyMode, slotIntervalMinutes: Number(slotIntervalMinutes), minDurationMinutes: Number(minDurationMinutes), maxDurationMinutes: Number(maxDurationMinutes), allowRecurring },
        pricingConfig: { type: pricingType, amount: Number(hourlyRate), depositRequired: Number(depositAmount) > 0 },
        cancellationRules: { refundPct: Number(cancellationRefundPct), freeCancellationHours: Number(freeCancellationHours) },
        approvalConfig: { type: approvalType, conditionalRules: { maxAutoGuests: Number(maxAutoGuests) } },
        customFields,
        availabilitySchedule: schedule,
        maintenanceBlocks
      };

      await updateFacility({ id: facilityId, data: payload }).unwrap();
      refetch();
      dispatch(showWarning({ message: 'All 12 facility configuration rules & dynamic schemas successfully synchronized to PostgreSQL!' }));
    } catch (err: any) {
      dispatch(showWarning({ message: err?.data?.message || 'Failed to save facility configuration updates.' }));
    }
  };

  const tabsList = [
    { id: 'general', label: '1. General Info & Gallery', icon: <FileText size={15} /> },
    { id: 'location', label: '2. Spatial Node Link', icon: <MapPin size={15} /> },
    { id: 'eligibility', label: '3. Capacity & Eligibility', icon: <Users size={15} /> },
    { id: 'booking_engine', label: '4. Booking Engine Setup', icon: <Clock size={15} /> },
    { id: 'operating_hours', label: '5. Weekly Schedule Editor', icon: <Calendar size={15} /> },
    { id: 'pricing', label: '6. Pricing, Deposits & Refund', icon: <DollarSign size={15} /> },
    { id: 'approvals', label: '7. Approval Workflows', icon: <ShieldCheck size={15} /> },
    { id: 'custom_fields', label: '8. Dynamic Custom Fields', icon: <Layers size={15} /> },
    { id: 'maintenance_blocks', label: '9. Maintenance & Closure', icon: <Wrench size={15} /> },
    { id: 'notifications', label: '10. Alerts & Automation', icon: <Bell size={15} /> },
    { id: 'assets_work_orders', label: '11. Linked Assets & WOs', icon: <AssetIcon size={15} /> },
    { id: 'audit_analytics', label: '12. Audit Logs & Analytics', icon: <FileText size={15} /> },
  ];

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto pb-20 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" onClick={() => router.push('/organization/facilities')} className="h-9 px-3 text-slate-700 dark:text-slate-300 font-bold">
            <ArrowLeft size={16} className="mr-1.5" /> Directory
          </Button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{facility.name}</h1>
              <FacilityCategoryBadge category={facility.category || 'Recreation'} />
              <FacilityStatusBadge status={status} isActive={status === 'ACTIVE'} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Comprehensive 12-module Configuration Engine & Rule Orchestration</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button onClick={handleSaveAll} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs h-10 px-6 shadow-md">
            <Save size={15} className="mr-1.5" /> {isSaving ? 'Synchronizing...' : 'Save Configuration Changes'}
          </Button>
        </div>
      </div>

      {/* Main Grid: Navigation Sidebar + Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <Card className="p-2 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm h-fit">
          <div className="space-y-1">
            {tabsList.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ConfigTab)}
                className={`w-full flex items-center space-x-2.5 px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all text-left ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className={activeTab === tab.id ? 'text-white' : 'text-indigo-500'}>{tab.icon}</span>
                <span className="truncate">{tab.label}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* Content Area */}
        <Card className="lg:col-span-3 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-md overflow-hidden p-6">
          {/* 1. General Info */}
          {activeTab === 'general' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <h3 className="font-black text-base text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center">
                📄 1. General Information & Photo Gallery
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Facility / Amenity Name *</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Unique Facility Code</label>
                  <Input value={facilityCode} onChange={(e) => setFacilityCode(e.target.value)} placeholder="e.g. FAC-2026-001" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Facility Category</label>
                  <Input value={category} onChange={(e) => setCategory(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Operational Status Toggle</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full h-10 px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-slate-800 dark:text-slate-100"
                  >
                    <option value="ACTIVE">ACTIVE (Available for booking)</option>
                    <option value="TEMPORARILY_UNAVAILABLE">TEMPORARILY UNAVAILABLE (On pause)</option>
                    <option value="UNDER_MAINTENANCE">UNDER MAINTENANCE (Repairs underway)</option>
                    <option value="PERMANENTLY_CLOSED">PERMANENTLY CLOSED (Archived)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Short Description Banner</label>
                <Input value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} placeholder="A 2-sentence summary displayed on discovery cards." />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Detailed Description & Operational Notes</label>
                <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-3 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Cover Image Banner URL</label>
                <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Rules & Guidelines for Residents (One per line)</label>
                <textarea rows={4} value={rules} onChange={(e) => setRules(e.target.value)} className="w-full p-3 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 leading-relaxed" />
              </div>
            </div>
          )}

          {/* 2. Location & Spatial Linking */}
          {activeTab === 'location' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <h3 className="font-black text-base text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center">
                📍 2. Spatial Hierarchy & Property Node Linking
              </h3>
              <p className="text-xs text-slate-500">Every amenity is bound to an exact physical location within your organization&apos;s spatial structure.</p>
              <div className="p-5 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 rounded-xl space-y-3">
                <span className="text-xs font-extrabold text-indigo-900 dark:text-indigo-300 block">Current Linked Spatial Path:</span>
                <div className="text-lg font-mono font-black text-indigo-700 dark:text-indigo-400 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                  {facility.locationName || 'Unmapped spatial hierarchy node'}
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  To relocate this facility to a new building, tower, floor, or room unit, update its parent building alignment in the master spatial register.
                </p>
              </div>
            </div>
          )}

          {/* 3. Eligibility & Capacity */}
          {activeTab === 'eligibility' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <h3 className="font-black text-base text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center">
                👥 3. Capacity Constraints & Resident Eligibility Rules
              </h3>

              <div className="bg-indigo-50/70 dark:bg-indigo-950/30 p-5 rounded-xl border border-indigo-200 dark:border-indigo-800/80 space-y-2.5">
                <label className="block text-sm font-black text-indigo-950 dark:text-indigo-200">
                  ⚡ Amenity Occupancy Mode: Shared vs. Exclusive Reservation *
                </label>
                <select
                  value={occupancyMode}
                  onChange={(e) => setOccupancyMode(e.target.value as any)}
                  className="w-full h-11 px-3.5 py-2 text-xs font-bold rounded-lg border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 text-indigo-950 dark:text-indigo-100 shadow-xs focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="SHARED">👥 Shared / Count-Based Amenity (Permits concurrent reservations up to Max Facility Capacity)</option>
                  <option value="EXCLUSIVE">🔒 Exclusive / Single-Occupancy Amenity (Locks out time slot once a single resident registers)</option>
                </select>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                  {occupancyMode === 'EXCLUSIVE' 
                    ? 'Exclusive rule active: Regardless of general guest capacity, only ONE confirmed booking is permitted per time slot (e.g. Party Hall, Turf, Private Cinema, Tennis Court).'
                    : 'Shared rule active: Multiple community residents can independently book the same time slot until total concurrent registrations hit the Max Facility Capacity limit below (e.g. Swimming Pool, Gym, Yoga Studio).'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Max Facility Capacity</label>
                  <Input type="number" min="1" value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Min Party Size Required</label>
                  <Input type="number" min="1" value={minCapacity} onChange={(e) => setMinCapacity(Number(e.target.value))} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Max Allowed Guests/Visitor</label>
                  <Input type="number" min="0" value={maxGuests} onChange={(e) => setMaxGuests(Number(e.target.value))} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Allowed User Occupancy Roles</label>
                <div className="flex flex-wrap gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  {['Resident', 'Tenant', 'Owner', 'Facility Staff', 'Guest'].map((role) => {
                    const isChecked = allowedRoles.includes(role);
                    return (
                      <label key={role} className="flex items-center space-x-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            setAllowedRoles(e.target.checked ? [...allowedRoles, role] : allowedRoles.filter(r => r !== role));
                          }}
                          className="w-4 h-4 text-indigo-600 rounded"
                        />
                        <span>{role}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Max Bookings Per User Per Week</label>
                  <Input type="number" min="1" value={maxBookingsPerWeek} onChange={(e) => setMaxBookingsPerWeek(Number(e.target.value))} />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">Prevents hoarding of prime tennis/gym slots.</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Max Advance Booking Horizon (Days)</label>
                  <Input type="number" min="1" value={advanceBookingDays} onChange={(e) => setAdvanceBookingDays(Number(e.target.value))} />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">Residents cannot schedule slots beyond this limit.</span>
                </div>
              </div>
            </div>
          )}

          {/* 4. Booking Engine Setup */}
          {activeTab === 'booking_engine' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <h3 className="font-black text-base text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center">
                ⚙️ 4. Booking Engine & Duration Architecture
              </h3>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Reservation Mode *</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { mode: 'SLOT', title: 'Fixed Time Slots', desc: 'Predefined intervals (e.g. 1hr badminton slots).' },
                    { mode: 'DURATION', title: 'Duration / Hourly Rental', desc: 'User picks arbitrary Start and End times within open hours.' },
                    { mode: 'FULL_DAY', title: 'Full-Day / Event Pass', desc: 'Whole day reservations (e.g. clubhouse weddings).' }
                  ].map((item) => (
                    <div
                      key={item.mode}
                      onClick={() => setBookingType(item.mode as any)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        bookingType === item.mode
                          ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="font-extrabold text-sm flex items-center justify-between">
                        <span>{item.title}</span>
                        {bookingType === item.mode && <Check className="w-4 h-4 text-indigo-600" />}
                      </div>
                      <p className="text-xs text-slate-500 mt-1 font-normal">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {bookingType === 'SLOT' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Slot Interval Duration (Minutes)</label>
                  <select
                    value={slotIntervalMinutes}
                    onChange={(e) => setSlotIntervalMinutes(Number(e.target.value))}
                    className="w-full sm:w-1/2 h-10 px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                  >
                    <option value="30">30 Minutes</option>
                    <option value="60">60 Minutes (1 Hour)</option>
                    <option value="90">90 Minutes (1.5 Hours)</option>
                    <option value="120">120 Minutes (2 Hours)</option>
                  </select>
                </div>
              )}

              {bookingType === 'DURATION' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Minimum Booking Duration (Minutes)</label>
                    <Input type="number" step="15" value={minDurationMinutes} onChange={(e) => setMinDurationMinutes(Number(e.target.value))} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Maximum Booking Duration (Minutes)</label>
                    <Input type="number" step="15" value={maxDurationMinutes} onChange={(e) => setMaxDurationMinutes(Number(e.target.value))} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 5. Operating Hours Editor */}
          {activeTab === 'operating_hours' && (
            <div className="animate-in fade-in duration-200">
              <OperatingHoursEditor schedule={schedule} onChange={setSchedule} />
            </div>
          )}

          {/* 6. Pricing & Deposits */}
          {activeTab === 'pricing' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <h3 className="font-black text-base text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center">
                💲 6. Fee Models, Security Deposits & Cancellation Refunds
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Rental Fee Pricing Structure *</label>
                  <select
                    value={pricingType}
                    onChange={(e) => setPricingType(e.target.value as any)}
                    className="w-full h-10 px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-extrabold"
                  >
                    <option value="FREE">Complimentary / Free for Residents</option>
                    <option value="PER_HOUR">Hourly Rental Fee ($ per hour)</option>
                    <option value="PER_SLOT">Fixed Fee Per Slot ($ per slot)</option>
                    <option value="PER_DAY">Full-Day Event Rate ($ per day)</option>
                  </select>
                </div>

                {pricingType !== 'FREE' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Fee Amount ($) *</label>
                    <Input type="number" step="0.01" min="0" value={hourlyRate} onChange={(e) => setHourlyRate(Number(e.target.value))} />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-200 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Refundable Security Deposit ($)</label>
                  <Input type="number" step="0.01" min="0" value={depositAmount} onChange={(e) => setDepositAmount(Number(e.target.value))} />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">Held against facility property damage.</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Free Cancellation Notice (Hours)</label>
                  <Input type="number" min="0" value={freeCancellationHours} onChange={(e) => setFreeCancellationHours(Number(e.target.value))} />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">Notice needed for zero penalty.</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Refund Percentage (%)</label>
                  <Input type="number" min="0" max="100" value={cancellationRefundPct} onChange={(e) => setCancellationRefundPct(Number(e.target.value))} />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">% returned upon timely cancellation.</span>
                </div>
              </div>
            </div>
          )}

          {/* 7. Approval Workflows */}
          {activeTab === 'approvals' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <h3 className="font-black text-base text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center">
                🛡️ 7. Manager Sign-Off & Approval Workflows
              </h3>
              <div className="space-y-3">
                {[
                  { type: 'AUTO', title: 'Automated Instant Confirmation', desc: 'Reservations are confirmed immediately upon booking without manager verification.' },
                  { type: 'MANUAL', title: 'Mandatory Building Management Signoff', desc: 'All requests land in the Approval Center as Pending until approved or rejected with a documented reason.' },
                  { type: 'CONDITIONAL', title: 'Smart Conditional Auto-Approval', desc: 'Auto-approve small gatherings; mandate management sign-off if attendees exceed a configured threshold.' }
                ].map((w) => (
                  <div
                    key={w.type}
                    onClick={() => setApprovalType(w.type as any)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start space-x-4 ${
                      approvalType === w.type
                        ? 'border-indigo-600 bg-indigo-50/30 dark:bg-indigo-950/20 text-indigo-900 dark:text-indigo-200 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <input type="radio" checked={approvalType === w.type} onChange={() => {}} className="w-4 h-4 text-indigo-600 mt-1" />
                    <div>
                      <div className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{w.title}</div>
                      <p className="text-xs text-slate-500 mt-0.5">{w.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {approvalType === 'CONDITIONAL' && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-300 dark:border-slate-700 max-w-sm">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Auto-Approve Guest Count Threshold
                  </label>
                  <Input type="number" min="1" value={maxAutoGuests} onChange={(e) => setMaxAutoGuests(Number(e.target.value))} />
                  <span className="text-[11px] text-slate-500 mt-1 block">Bookings with guests ≤ {maxAutoGuests} are instantly approved. Larger gatherings trigger manual review.</span>
                </div>
              )}
            </div>
          )}

          {/* 8. Dynamic Custom Fields */}
          {activeTab === 'custom_fields' && (
            <div className="animate-in fade-in duration-200">
              <CustomFieldBuilder fields={customFields} onChange={setCustomFields} />
            </div>
          )}

          {/* 9. Maintenance & Blackout */}
          {activeTab === 'maintenance_blocks' && (
            <div className="animate-in fade-in duration-200">
              <MaintenanceBlockForm blocks={maintenanceBlocks} onChange={setMaintenanceBlocks} facilityName={facility.name} />
            </div>
          )}

          {/* 10. Notifications & Automation */}
          {activeTab === 'notifications' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <h3 className="font-black text-base text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center">
                🔔 10. Notification Triggers & Automated Broadcasts
              </h3>
              <div className="space-y-2.5">
                {[
                  { label: 'Booking Request Submitted (Email to Resident & Building Manager)', default: true },
                  { label: 'Manager Approval / Rejection Notification (With Reason Attached)', default: true },
                  { label: '24-Hour Reminder Notice & QR Check-In Pass Delivery', default: true },
                  { label: 'Post-Usage Damage Audit & Security Deposit Return Alert', default: false }
                ].map((n, idx) => (
                  <label key={idx} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{n.label}</span>
                    <input type="checkbox" defaultChecked={n.default} className="w-4 h-4 text-indigo-600 rounded" />
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* 11. Assets & Work Orders */}
          {activeTab === 'assets_work_orders' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <h3 className="font-black text-base text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center">
                🔧 11. Integrated Facility Assets & Maintenance Work Orders
              </h3>
              <p className="text-xs text-slate-500">Link gym equipment, swimming pool pumps, or conference projectors directly to this facility node.</p>
              <div className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-3">
                <AssetIcon className="w-10 h-10 mx-auto text-indigo-500 opacity-80" />
                <div>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">No defective equipment or maintenance work orders flagged for {facility.name}.</h4>
                  <p className="text-xs text-slate-400 mt-0.5">When field inspectors or residents flag broken amenities, associated Work Orders will populate in real-time here.</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => router.push('/organization/work-orders')} className="text-indigo-600 font-bold border-indigo-300">
                  + Create Maintenance Work Order for Facility
                </Button>
              </div>
            </div>
          )}

          {/* 12. Audit Logs & Analytics */}
          {activeTab === 'audit_analytics' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <h3 className="font-black text-base text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center">
                📊 12. Audit Logs & Revenue Analytics
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Reservations</span>
                  <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{bookings.length}</div>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">Completed Check-ins</span>
                  <div className="text-2xl font-black text-emerald-600 mt-1">
                    {bookings.filter((b: any) => b.status === 'COMPLETED' || b.checkInTime).length}
                  </div>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">Gross Rental Ledger</span>
                  <div className="text-2xl font-black text-indigo-600 mt-1">
                    ${bookings.reduce((s: number, b: any) => s + (Number(b.totalCost) || 0), 0).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
