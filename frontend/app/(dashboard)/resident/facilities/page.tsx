'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { FacilityCard } from '@/components/facilities/FacilityCard';
import { CustomFieldRenderer } from '@/components/facilities/CustomFieldRenderer';
import { 
  Calendar, Clock, DollarSign, Users, Search, Filter, Check, 
  MapPin, Sparkles, Building2, AlertCircle, QrCode, ArrowRight, ShieldCheck, HelpCircle
} from 'lucide-react';
import { useGetFacilitiesQuery, useCreateFacilityBookingMutation, useGetFacilityBookingsQuery } from '@/services/facilitiesApi';
import { useDispatch } from 'react-redux';
import { showWarning } from '@/store/slices/uiSlice';
import Link from 'next/link';

export default function ResidentFacilitiesDirectoryPage() {
  const router = useRouter();
  const dispatch = useDispatch();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  
  // Booking Wizard Modal State
  const [selectedFacility, setSelectedFacility] = useState<any | null>(null);
  const [wizardStep, setWizardStep] = useState<number>(1);

  // Step 1: Date & Time
  const [bookingDate, setBookingDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState<string>('10:00 - 11:00');
  const [startTimeStr, setStartTimeStr] = useState('10:00');
  const [endTimeStr, setEndTimeStr] = useState('12:00');

  // Step 2 & 3: Attendees, Purpose & Custom Questionnaire
  const [attendeeCount, setAttendeeCount] = useState<number>(1);
  const [purpose, setPurpose] = useState<string>('Personal Recreation & Workout');
  const [notes, setNotes] = useState<string>('');
  const [customAnswers, setCustomAnswers] = useState<Record<string, any>>({});
  const [agreedToRules, setAgreedToRules] = useState<boolean>(false);

  const { data: facilitiesResponse, isLoading } = useGetFacilitiesQuery({});
  const { data: myBookingsResponse } = useGetFacilityBookingsQuery({});
  const [createBooking, { isLoading: isBooking }] = useCreateFacilityBookingMutation();

  const facilities = Array.isArray(facilitiesResponse) ? facilitiesResponse : (facilitiesResponse?.data || []);
  const myBookings = Array.isArray(myBookingsResponse) ? myBookingsResponse : (myBookingsResponse?.data || []);

  const activeMyBookings = myBookings.filter((b: any) => b.status === 'CONFIRMED' || b.status === 'PENDING' || b.status === 'APPROVED');

  const filteredFacilities = facilities.filter((f: any) => {
    const matchSearch = !searchQuery || f.name?.toLowerCase().includes(searchQuery.toLowerCase()) || f.locationName?.toLowerCase().includes(searchQuery.toLowerCase()) || f.category?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = selectedCategory === 'ALL' || f.category?.toLowerCase().includes(selectedCategory.toLowerCase());
    return matchSearch && matchCat;
  });

  const handleOpenBookingWizard = (facility: any) => {
    setSelectedFacility(facility);
    setWizardStep(1);
    setAttendeeCount(1);
    setPurpose('Personal Recreation & Fitness');
    setNotes('');
    setCustomAnswers({});
    setAgreedToRules(false);
  };

  const getDateAvailabilityStatus = (dateOverride?: string) => {
    const targetDateStr = dateOverride || bookingDate;
    if (!selectedFacility || !targetDateStr) return { isClosed: false, reason: '' };
    
    // Parse date safely avoiding timezone offset issues
    const parts = targetDateStr.split('-').map(Number);
    const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 12, 0, 0));
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = daysOfWeek[d.getUTCDay()];

    // 1. Check Availability Schedule configured by Admin in Weekly Operating Hours
    if (Array.isArray(selectedFacility.availabilitySchedule)) {
      const daySchedule = selectedFacility.availabilitySchedule.find((s: any) => s.day && s.day.toLowerCase() === dayName.toLowerCase());
      if (daySchedule && daySchedule.enabled === false) {
        return { isClosed: true, reason: `This amenity is scheduled CLOSED on ${dayName}s by Building Management.` };
      }
    }

    // 2. Comprehensive scanning of Admin Rules, Descriptions & Notes for Holiday keywords
    const allFacilityText = [
      ...(Array.isArray(selectedFacility.rules) ? selectedFacility.rules : []),
      selectedFacility.description || '',
      selectedFacility.shortDescription || '',
      selectedFacility.name || ''
    ].join(' ').toLowerCase();

    const holidayKeywords = ['holiday', 'closed', 'no booking', 'off', 'not available', 'leave', 'not working'];
    const dayAbbreviations: Record<string, string[]> = {
      'Sunday': ['sunday', 'sun '],
      'Monday': ['monday', 'mon '],
      'Tuesday': ['tuesday', 'tue '],
      'Wednesday': ['wednesday', 'wed '],
      'Thursday': ['thursday', 'thu '],
      'Friday': ['friday', 'fri '],
      'Saturday': ['saturday', 'sat ']
    };

    const targetWords = dayAbbreviations[dayName] || [dayName.toLowerCase()];
    const mentionsDay = targetWords.some(w => allFacilityText.includes(w));

    if (mentionsDay) {
      for (const kw of holidayKeywords) {
        if (allFacilityText.includes(kw)) {
          return { isClosed: true, reason: `Administrative Operational Rule: "${kw.toUpperCase()} ON ${dayName.toUpperCase()}" (Booking Restricted)` };
        }
      }
    }

    // 3. Check Scheduled Maintenance & Closure Blackouts
    if (Array.isArray(selectedFacility.maintenanceBlocks)) {
      for (const block of selectedFacility.maintenanceBlocks) {
        const bStart = new Date(block.start || block.startTime).toISOString().split('T')[0];
        const bEnd = new Date(block.end || block.endTime).toISOString().split('T')[0];
        if (targetDateStr >= bStart && targetDateStr <= bEnd) {
          return { isClosed: true, reason: `Facility under maintenance / blackout: ${block.reason || 'Temporary Operational Hold'}` };
        }
      }
    }

    return { isClosed: false, reason: '' };
  };

  const getDynamicSlotsForDate = () => {
    if (!selectedFacility || !bookingDate || getDateAvailabilityStatus().isClosed) return [];
    
    const parts = bookingDate.split('-').map(Number);
    const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 12, 0, 0));
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = daysOfWeek[d.getUTCDay()];

    const slotInterval = Number(selectedFacility.bookingConfig?.slotIntervalMinutes || 60);

    // If admin configured availabilitySchedule for this weekday, generate slots from those exact ranges
    if (Array.isArray(selectedFacility.availabilitySchedule)) {
      const daySchedule = selectedFacility.availabilitySchedule.find((s: any) => s.day && s.day.toLowerCase() === dayName.toLowerCase());
      if (daySchedule && daySchedule.enabled && Array.isArray(daySchedule.ranges) && daySchedule.ranges.length > 0) {
        const generatedSlots: string[] = [];
        daySchedule.ranges.forEach((range: any) => {
          const startStr = range.start || '08:00';
          const endStr = range.end || '20:00';
          let curMin = parseInt(startStr.split(':')[0]) * 60 + parseInt(startStr.split(':')[1]);
          const endMin = parseInt(endStr.split(':')[0]) * 60 + parseInt(endStr.split(':')[1]);
          
          while (curMin + slotInterval <= endMin) {
            const sH = Math.floor(curMin / 60).toString().padStart(2, '0');
            const sM = (curMin % 60).toString().padStart(2, '0');
            const nextMin = curMin + slotInterval;
            const eH = Math.floor(nextMin / 60).toString().padStart(2, '0');
            const eM = (nextMin % 60).toString().padStart(2, '0');
            generatedSlots.push(`${sH}:${sM} - ${eH}:${eM}`);
            curMin = nextMin;
          }
        });
        if (generatedSlots.length > 0) return generatedSlots;
      }
    }

    // Default operating hours if no specific range rule was matched
    const defaultSlots: string[] = [];
    let cur = 8 * 60; // 08:00
    const end = 20 * 60; // 20:00
    while (cur + slotInterval <= end) {
      const sH = Math.floor(cur / 60).toString().padStart(2, '0');
      const sM = (cur % 60).toString().padStart(2, '0');
      const nxt = cur + slotInterval;
      const eH = Math.floor(nxt / 60).toString().padStart(2, '0');
      const eM = (nxt % 60).toString().padStart(2, '0');
      defaultSlots.push(`${sH}:${sM} - ${eH}:${eM}`);
      cur = nxt;
    }
    return defaultSlots;
  };

  const getSlotAvailabilityStatus = (slotStr: string) => {
    if (!selectedFacility) return { isOccupied: false, isPast: false, label: 'Available', isExclusive: false, remaining: 1 };
    
    // Evaluate Exclusive vs. Count-Based capacity rules on the client side
    const bConfig: any = selectedFacility.bookingConfig || {};
    const facilityName = selectedFacility.name?.toLowerCase() || '';
    const facilityCat = (selectedFacility.category || '').toLowerCase();
    const facilityDesc = [
      ...(Array.isArray(selectedFacility.rules) ? selectedFacility.rules : []),
      selectedFacility.description || '',
      selectedFacility.shortDescription || ''
    ].join(' ').toLowerCase();

    const exclusiveKeywords = ['party hall', 'banquet', 'turf', 'court', 'tennis', 'badminton', 'squash', 'field', 'bbq', 'cinema', 'auditorium', 'conference', 'boardroom', 'exclusive', 'private'];
    const isExplicitlyExclusive = bConfig.bookingType === 'EXCLUSIVE' || bConfig.occupancyMode === 'EXCLUSIVE' || bConfig.exclusive === true;
    const isExplicitlyShared = bConfig.bookingType === 'SHARED' || bConfig.occupancyMode === 'SHARED' || bConfig.bookingType === 'COUNT_BASED';
    const matchesExclusiveKeyword = exclusiveKeywords.some(kw => facilityName.includes(kw) || facilityCat.includes(kw) || facilityDesc.includes(kw));
    const isExclusive = isExplicitlyExclusive || (!isExplicitlyShared && matchesExclusiveKeyword);

    // Filter active reservations from myBookings / fetched facility bookings for this exact date & time window
    const [startHour, endHour] = slotStr.split(' - ');
    const slotStart = new Date(`${bookingDate}T${startHour}:00`).getTime();
    const slotEnd = new Date(`${bookingDate}T${endHour}:00`).getTime();

    // Past timings check: cannot book a time slot before current time
    if (slotStart <= Date.now() + 60000) {
      return { isOccupied: true, isPast: true, label: 'Expired (Past Time)', isExclusive, remaining: 0 };
    }

    const overlappingBookings = myBookings.filter((b: any) => {
      if (b.facilityId !== selectedFacility.id) return false;
      if (!['PENDING', 'CONFIRMED', 'APPROVED'].includes(b.status)) return false;
      const bStart = new Date(b.startTime).getTime();
      const bEnd = new Date(b.endTime).getTime();
      return bStart < slotEnd && bEnd > slotStart;
    });

    const bookedCount = overlappingBookings.length;

    if (isExclusive) {
      if (bookedCount >= 1) {
        return { isOccupied: true, isPast: false, label: 'Already Reserved (Exclusive)', isExclusive: true, remaining: 0 };
      }
      return { isOccupied: false, isPast: false, label: 'Available (Exclusive)', isExclusive: true, remaining: 1 };
    } else {
      const maxSlots = selectedFacility.capacity ? selectedFacility.capacity : (bConfig.maxConcurrent || 20);
      const remaining = Math.max(0, maxSlots - bookedCount);
      if (bookedCount >= maxSlots) {
        return { isOccupied: true, isPast: false, label: `Full (${maxSlots}/${maxSlots})`, isExclusive: false, remaining: 0 };
      }
      return { isOccupied: false, isPast: false, label: `${remaining} Spots Left`, isExclusive: false, remaining };
    }
  };

  const calculateBreakdown = () => {
    if (!selectedFacility) return { fee: 0, deposit: 0, total: 0, duration: 1 };
    const rate = Number(selectedFacility.hourlyRate || 0);
    const deposit = Number(selectedFacility.depositAmount || 0);
    const duration = selectedFacility.bookingConfig?.type === 'DURATION' ? (parseInt(endTimeStr.split(':')[0]) - parseInt(startTimeStr.split(':')[0])) || 2 : 1;
    const fee = rate * Math.max(1, duration);
    return { fee, deposit, total: fee + deposit, duration: Math.max(1, duration) };
  };

  const handleCompleteBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToRules) {
      dispatch(showWarning({ message: 'Please acknowledge and agree to the building amenity rules before confirming.' }));
      return;
    }

    const start = new Date(`${bookingDate}T${selectedFacility?.bookingConfig?.type === 'DURATION' ? startTimeStr : selectedSlot.split(' - ')[0]}:00`);
    const end = new Date(`${bookingDate}T${selectedFacility?.bookingConfig?.type === 'DURATION' ? endTimeStr : selectedSlot.split(' - ')[1]}:00`);

    if (start.getTime() <= Date.now() + 60000) {
      dispatch(showWarning({ message: 'Cannot book a time slot in the past. Please select a future date and time slot.' }));
      return;
    }

    const breakdown = calculateBreakdown();

    try {
      await createBooking({
        facilityId: selectedFacility.id,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        attendeeCount: Number(attendeeCount),
        purpose,
        notes,
        customFieldValues: customAnswers,
        pricingBreakdown: breakdown
      }).unwrap();

      setSelectedFacility(null);
      dispatch(showWarning({ message: `Reservation submitted successfully! Your request has been logged in your Digital Pass portal.` }));
      router.push('/resident/facilities/my-bookings');
    } catch (err: any) {
      dispatch(showWarning({ message: err?.data?.message || 'Failed to complete reservation. Time slot may already be occupied.' }));
    }
  };

  const availableSlots = getDynamicSlotsForDate();

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto pb-20 animate-in fade-in duration-300">
      {/* Hero Header & Quick Pass Portal Shortcut */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center">
            <Sparkles className="w-7 h-7 mr-3 text-indigo-600 dark:text-indigo-400" /> Resident Community Amenities & Bookings
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Discover building facilities, check opening hours, and reserve time slots directly with your digital resident pass.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link href="/resident/facilities/my-bookings">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs h-10 px-5 shadow-md flex items-center">
              <QrCode className="w-4 h-4 mr-2" />
              My Bookings & Digital Passes
              {activeMyBookings.length > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] bg-white text-indigo-700 font-black font-mono">
                  {activeMyBookings.length}
                </span>
              )}
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search tennis courts, swimming pool, meeting rooms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 bg-slate-50 dark:bg-slate-800/40 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {['ALL', 'Sports', 'Recreation', 'Meeting', 'Event', 'Parking'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-xs scale-102'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {cat === 'ALL' ? '🌟 All Categories' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Facility Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-500 font-bold text-sm">Loading available property amenities and real-time calendars...</div>
      ) : filteredFacilities.length === 0 ? (
        <Card className="p-12 text-center text-slate-500 border border-dashed rounded-2xl">
          <Building2 className="w-12 h-12 mx-auto text-slate-400 mb-2 opacity-50" />
          <p className="font-bold text-base text-slate-700 dark:text-slate-300">No amenities matched your search or category filter.</p>
          <p className="text-xs text-slate-400 mt-1">Try resetting category tags or check back after scheduled building maintenance finishes.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFacilities.map((f: any) => (
            <FacilityCard
              key={f.id}
              facility={f}
              actionLabel="Reserve Amenity"
              onAction={handleOpenBookingWizard}
            />
          ))}
        </div>
      )}

      {/* Multi-Step Reservation Wizard Modal */}
      {selectedFacility && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto animate-in fade-in duration-200">
          <Card className="max-w-2xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-indigo-900 text-white">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-indigo-300 font-extrabold block">Amenity Reservation Wizard</span>
                <h3 className="text-lg font-black tracking-tight flex items-center mt-0.5">
                  🏷️ {selectedFacility.name}
                </h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedFacility(null)} className="text-white hover:bg-indigo-800">✕</Button>
            </div>

            {/* Step Indicators */}
            <div className="bg-slate-100 dark:bg-slate-800/80 p-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-around text-xs font-extrabold">
              {[
                { step: 1, label: '1. Date & Time Slot' },
                { step: 2, label: '2. Attendees & Purpose' },
                { step: 3, label: '3. Fee & Confirmation' }
              ].map((s) => (
                <div key={s.step} className={`flex items-center space-x-1.5 ${wizardStep === s.step ? 'text-indigo-600 dark:text-indigo-400 scale-105' : 'text-slate-400'}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${wizardStep === s.step ? 'bg-indigo-600 text-white font-black' : 'bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                    {s.step}
                  </div>
                  <span>{s.label}</span>
                </div>
              ))}
            </div>

            <form onSubmit={handleCompleteBooking} className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Step 1: Date & Time */}
              {wizardStep === 1 && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  {/* 7-Day Administrative Operating Schedule Strip */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[11px] font-extrabold uppercase text-slate-500 block mb-2">
                      📅 Administrative Weekly Operating Rules & Holidays
                    </span>
                    <div className="grid grid-cols-7 gap-1.5 text-center">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayAbbr, idx) => {
                        const testDate = new Date();
                        const curDay = testDate.getDay();
                        const diff = idx - curDay;
                        const d = new Date(testDate.setDate(testDate.getDate() + diff));
                        const dateStr = d.toISOString().split('T')[0];
                        const status = getDateAvailabilityStatus(dateStr);
                        return (
                          <div
                            key={dayAbbr}
                            className={`p-1.5 rounded-lg border text-[10px] font-black tracking-tight ${
                              status.isClosed
                                ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                            }`}
                          >
                            <div className="uppercase font-mono text-[11px]">{dayAbbr}</div>
                            <div className="mt-0.5 font-sans scale-95">{status.isClosed ? '🚫 Closed' : '✅ Open'}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">Select Target Booking Date *</label>
                    <Input
                      type="date"
                      required
                      value={bookingDate}
                      onChange={(e) => {
                        const val = e.target.value;
                        setBookingDate(val);
                        const stat = getDateAvailabilityStatus(val);
                        if (stat && stat.isClosed) {
                          dispatch(showWarning({ message: `Cannot select this date! ${stat.reason}` }));
                        }
                      }}
                      className="font-extrabold"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  {getDateAvailabilityStatus().isClosed && (
                    <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/60 border-2 border-red-500 text-red-900 dark:text-red-200 flex items-start space-x-3.5 shadow-md">
                      <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 shrink-0 mt-0.5 animate-bounce" />
                      <div>
                        <strong className="block text-sm font-black text-red-800 dark:text-red-300 uppercase tracking-wide">
                          🚫 Booking Disabled for {new Date(bookingDate + 'T12:00:00Z').toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                        </strong>
                        <p className="text-xs font-extrabold mt-1 text-slate-800 dark:text-slate-200">
                          {getDateAvailabilityStatus().reason}
                        </p>
                        <p className="text-[11px] text-red-600 dark:text-red-400 font-bold mt-1.5">
                          Please pick a different open weekday date (green status above) to schedule your reservation.
                        </p>
                      </div>
                    </div>
                  )}

                  {!getDateAvailabilityStatus().isClosed && selectedFacility.bookingConfig?.type === 'DURATION' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Start Time *</label>
                        <Input type="time" required value={startTimeStr} onChange={(e) => setStartTimeStr(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">End Time *</label>
                        <Input type="time" required value={endTimeStr} onChange={(e) => setEndTimeStr(e.target.value)} />
                      </div>
                    </div>
                  )}

                  {!getDateAvailabilityStatus().isClosed && selectedFacility.bookingConfig?.type !== 'DURATION' && (
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2.5">
                        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                          Select Available Time Slot *
                        </label>
                        <Badge className="text-[10px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-extrabold w-fit">
                          {getSlotAvailabilityStatus('10:00 - 11:00').isExclusive ? '🔒 Exclusive (Single Reservation per Slot)' : `👥 Shared / Count-Based (${selectedFacility.capacity || 20} Simultaneous Users)`}
                        </Badge>
                      </div>
                      {availableSlots.length === 0 ? (
                        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 text-amber-900 dark:text-amber-200 text-xs font-bold">
                          No operating time slots available for this day under configured management rules.
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                          {availableSlots.map((slot, i) => {
                            const status = getSlotAvailabilityStatus(slot);
                            const isOccupied = status.isOccupied;
                            const isSelected = selectedSlot === slot || (!selectedSlot && i === 0 && !isOccupied);
                            return (
                              <div
                                key={slot}
                                onClick={() => !isOccupied && setSelectedSlot(slot)}
                                className={`p-3 rounded-xl border text-center font-mono text-xs font-bold transition-all ${
                                  isOccupied
                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-70'
                                    : isSelected
                                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-md scale-102 font-extrabold'
                                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-indigo-500 cursor-pointer'
                                }`}
                              >
                                <div>{slot}</div>
                                <span className={`text-[10px] font-sans block mt-0.5 font-bold leading-tight ${isSelected && !isOccupied ? 'text-indigo-100' : isOccupied ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                  {status.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="pt-4 flex justify-end">
                    <Button
                      type="button"
                      disabled={getDateAvailabilityStatus().isClosed || availableSlots.length === 0}
                      onClick={() => {
                        if (getDateAvailabilityStatus().isClosed) {
                          dispatch(showWarning({ message: 'Selected date is closed per administrative schedule or holiday rules.' }));
                          return;
                        }
                        if (selectedFacility?.bookingConfig?.type !== 'DURATION') {
                          let slotToUse = selectedSlot;
                          if (!slotToUse && availableSlots.length > 0) {
                            const firstValid = availableSlots.find(s => !getSlotAvailabilityStatus(s).isOccupied);
                            if (!firstValid) {
                              dispatch(showWarning({ message: 'No valid future or available time slots remaining for this date.' }));
                              return;
                            }
                            slotToUse = firstValid;
                            setSelectedSlot(firstValid);
                          }
                          const status = getSlotAvailabilityStatus(slotToUse || '');
                          if (status.isOccupied) {
                            dispatch(showWarning({ message: status.isPast ? 'You cannot choose an expired past time slot.' : 'This time slot is already reserved or capacity is full.' }));
                            return;
                          }
                        }
                        setWizardStep(2);
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-xs h-10 px-6 shadow-xs flex items-center cursor-pointer"
                    >
                      <span>Continue to Attendees & Details</span> <ArrowRight className="ml-1.5 w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Attendees & Purpose & Custom Fields */}
              {wizardStep === 2 && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Total Expected Attendees *</label>
                      <Input type="number" required min="1" max={selectedFacility.capacity || 50} value={attendeeCount} onChange={(e) => setAttendeeCount(Number(e.target.value))} />
                      <span className="text-[11px] text-slate-400 mt-1 block">Maximum capacity for this facility is {selectedFacility.capacity || 20} people.</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Primary Booking Purpose *</label>
                      <select value={purpose} onChange={(e) => setPurpose(e.target.value)} className="w-full h-10 px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold">
                        <option value="Personal Recreation & Fitness">Personal Recreation & Fitness</option>
                        <option value="Family / Resident Social Gathering">Family / Resident Social Gathering</option>
                        <option value="Private Meeting or Study Group">Private Meeting or Study Group</option>
                        <option value="Community Event or Assembly">Community Event or Assembly</option>
                      </select>
                    </div>
                  </div>

                  {/* Render Dynamic Custom Questionnaire configured by admin! */}
                  {selectedFacility.customFields && Array.isArray(selectedFacility.customFields) && selectedFacility.customFields.length > 0 && (
                    <CustomFieldRenderer
                      fields={selectedFacility.customFields}
                      values={customAnswers}
                      onChange={(key, val) => setCustomAnswers({ ...customAnswers, [key]: val })}
                    />
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Additional Special Notes (Optional)</label>
                    <Input placeholder="e.g. Please ensure air conditioning is activated prior to arrival." value={notes} onChange={(e) => setNotes(e.target.value)} />
                  </div>

                  <div className="pt-4 flex justify-between">
                    <Button type="button" variant="outline" onClick={() => setWizardStep(1)} className="text-xs font-bold h-10">
                      ← Back to Timeslots
                    </Button>
                    <Button type="button" onClick={() => setWizardStep(3)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs h-10 px-6 shadow-sm">
                      Review Breakdown & Confirm <ArrowRight className="ml-1.5 w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Fee Breakdown, Deposit & Confirm */}
              {wizardStep === 3 && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3 font-mono text-sm">
                    <span className="font-extrabold text-xs font-sans uppercase tracking-wider text-slate-500 block border-b pb-2">
                      💰 Financial Breakdown & Reservation Ledger
                    </span>
                    <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                      <span>Facility Rental Fee ({selectedFacility.hourlyRate ? `$${selectedFacility.hourlyRate}/hr` : 'Complimentary'}):</span>
                      <strong className="font-black text-slate-900 dark:text-slate-100">${calculateBreakdown().fee.toFixed(2)}</strong>
                    </div>
                    {calculateBreakdown().deposit > 0 && (
                      <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 text-xs">
                        <span>Refundable Security Deposit:</span>
                        <strong className="text-emerald-600 font-bold">${calculateBreakdown().deposit.toFixed(2)}</strong>
                      </div>
                    )}
                    <div className="border-t border-slate-300 dark:border-slate-700 pt-3 flex justify-between items-center text-base">
                      <span className="font-black text-slate-900 dark:text-slate-100">Total Billed Amount:</span>
                      <strong className="text-indigo-600 dark:text-indigo-400 text-xl font-extrabold">${calculateBreakdown().total.toFixed(2)}</strong>
                    </div>
                  </div>

                  {/* Rules Acceptance Banner */}
                  <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-950 dark:text-indigo-200 space-y-2">
                    <div className="font-extrabold flex items-center">
                      <ShieldCheck className="w-4 h-4 mr-1.5 text-indigo-600" /> Building Amenity Code of Conduct
                    </div>
                    <ul className="list-disc pl-5 space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                      {(selectedFacility.rules || ['No unauthorized external guests.', 'Clean personal belongings before check-out.', 'Present digital QR pass at security desk.']).map((r: string, i: number) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>

                  <label className="flex items-center space-x-2.5 pt-1 cursor-pointer select-none">
                    <input type="checkbox" checked={agreedToRules} onChange={(e) => setAgreedToRules(e.target.checked)} className="w-4 h-4 text-indigo-600 rounded border-slate-300" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      I have read, understood, and agree to abide by the facility operational rules and cancellation policy.
                    </span>
                  </label>

                  <div className="pt-4 flex justify-between border-t border-slate-200 dark:border-slate-800">
                    <Button type="button" variant="outline" onClick={() => setWizardStep(2)} className="text-xs font-bold h-10">
                      ← Modify Attendees
                    </Button>
                    <Button type="submit" disabled={isBooking} className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs h-10 px-8 shadow-lg">
                      {isBooking ? 'Processing Pass...' : 'Confirm Reservation & Generate QR Pass 🚀'}
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
