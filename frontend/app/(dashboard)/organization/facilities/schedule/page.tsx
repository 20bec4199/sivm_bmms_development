'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FacilityCategoryBadge } from '@/components/facilities/FacilityCategoryBadge';
import { 
  Calendar, Clock, ArrowLeft, ChevronLeft, ChevronRight, Building2, Wrench, ShieldCheck, Users, Search, MapPin
} from 'lucide-react';
import { useGetFacilitiesQuery, useGetFacilityBookingsQuery } from '@/services/facilitiesApi';
import Link from 'next/link';

export default function FacilityScheduleManagerPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const { data: facilitiesResponse, isLoading: isLoadingFac } = useGetFacilitiesQuery({});
  const { data: bookingsResponse, isLoading: isLoadingBook } = useGetFacilityBookingsQuery({});

  const facilities = Array.isArray(facilitiesResponse) ? facilitiesResponse : (facilitiesResponse?.data || []);
  const bookings = Array.isArray(bookingsResponse) ? bookingsResponse : (bookingsResponse?.data || []);

  const filteredFacilities = facilities.filter((f: any) => {
    return selectedCategory === 'ALL' || f.category?.toLowerCase().includes(selectedCategory.toLowerCase());
  });

  const hours = ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto pb-20 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" onClick={() => router.push('/organization/facilities')} className="h-9 px-3 font-bold">
            <ArrowLeft size={16} className="mr-1.5" /> Directory
          </Button>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center">
              <Calendar className="w-6 h-6 mr-2 text-indigo-600 dark:text-indigo-400" /> Interactive Schedule & Slot Master Calendar
            </h1>
            <p className="text-xs text-slate-500">Real-time overview of amenity occupancy, maintenance closures, and unallocated time slots.</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-1 font-bold text-xs">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() - 1);
              setSelectedDate(d.toISOString().split('T')[0]);
            }}><ChevronLeft size={16} /></Button>
            <input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border-0 px-2 bg-transparent text-center font-extrabold focus:outline-none cursor-pointer" 
            />
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() + 1);
              setSelectedDate(d.toISOString().split('T')[0]);
            }}><ChevronRight size={16} /></Button>
          </div>
        </div>
      </div>

      {/* Filter Options */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-50 dark:bg-slate-800/30 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
        <span className="font-bold text-slate-500 px-2">Category Filter:</span>
        {['ALL', 'Sports', 'Recreation', 'Meeting', 'Event', 'Parking'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              selectedCategory === cat ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/60 dark:hover:bg-slate-800'
            }`}
          >
            {cat === 'ALL' ? 'All Amenities' : cat}
          </button>
        ))}

        <div className="ml-auto flex flex-wrap items-center gap-4 px-2 font-mono text-[11px] text-slate-500">
          <span className="flex items-center"><span className="w-3 h-3 bg-emerald-500 rounded mr-1" /> Available</span>
          <span className="flex items-center"><span className="w-3 h-3 bg-indigo-600 rounded mr-1" /> Reserved</span>
          <span className="flex items-center"><span className="w-3 h-3 bg-amber-500 rounded mr-1" /> Maintenance</span>
          <span className="flex items-center"><span className="w-3 h-3 bg-slate-400 rounded mr-1" /> Expired / Past</span>
        </div>
      </div>

      {/* Interactive Time Grid */}
      {isLoadingFac ? (
        <div className="p-12 text-center text-slate-500 font-bold">Loading master facility occupancy matrix...</div>
      ) : filteredFacilities.length === 0 ? (
        <Card className="p-12 text-center text-slate-500 border border-dashed rounded-2xl">
          <Calendar className="w-10 h-10 mx-auto text-slate-400 mb-2 opacity-60" />
          <p className="font-bold text-base text-slate-700 dark:text-slate-300">No amenities match the selected category filter.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredFacilities.map((f: any) => {
            const facBookings = bookings.filter((b: any) => b.facilityId === f.id || b.facility?.id === f.id);
            const isUnderMaintenance = f.status === 'UNDER_MAINTENANCE' || f.status === 'MAINTENANCE';

            return (
              <Card key={f.id} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-indigo-400 transition-all">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-indigo-600 dark:text-indigo-400">
                      <Building2 size={20} />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-base text-slate-900 dark:text-slate-100 hover:text-indigo-600 cursor-pointer" onClick={() => router.push(`/organization/facilities/${f.id}/settings`)}>
                          {f.name}
                        </span>
                        <FacilityCategoryBadge category={f.category} />
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-slate-500 mt-0.5 font-medium">
                        <span>📍 {f.locationName || 'Linked Spatial Hierarchy Node'}</span>
                        <span>•</span>
                        <span>Max Capacity: <strong className="text-slate-800 dark:text-slate-200">{f.capacity || 20} guests</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => router.push(`/organization/facilities/${f.id}/settings`)} className="text-xs font-bold h-8">
                      Configure Schedule Rules
                    </Button>
                  </div>
                </div>

                {/* Slot representation timeline */}
                <div className="space-y-2">
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
                    {hours.map((hr, i) => {
                      const slotStart = new Date(`${selectedDate}T${hr}:00`).getTime();
                      const slotEnd = slotStart + (2 * 60 * 60 * 1000); // 2 hour slots
                      const isPast = slotStart <= Date.now() + 60000;

                      const overlappingBookings = facBookings.filter((b: any) => {
                        if (!['CONFIRMED', 'APPROVED', 'PENDING'].includes(b.status)) return false;
                        const bStart = new Date(b.startTime).getTime();
                        const bEnd = new Date(b.endTime).getTime();
                        return bStart < slotEnd && bEnd > slotStart;
                      });
                      const isBooked = overlappingBookings.length > 0;

                      const bConfig: any = f.bookingConfig || {};
                      const isExclusive = bConfig.bookingType === 'EXCLUSIVE' || bConfig.occupancyMode === 'EXCLUSIVE' || bConfig.exclusive === true || ['party hall', 'banquet', 'turf', 'court', 'tennis', 'badminton', 'squash', 'cinema', 'private'].some(kw => f.name?.toLowerCase().includes(kw) || f.category?.toLowerCase().includes(kw));

                      let slotStyle = 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 cursor-pointer';
                      let label = 'Available';

                      if (isUnderMaintenance) {
                        slotStyle = 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 cursor-not-allowed opacity-80';
                        label = 'Maintenance';
                      } else if (isBooked) {
                        slotStyle = 'bg-indigo-600 text-white border-indigo-700 shadow-xs cursor-not-allowed';
                        label = isExclusive ? 'Already Reserved (Exclusive)' : `Reserved (${overlappingBookings.length}/${f.capacity || 20})`;
                      } else if (isPast) {
                        slotStyle = 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-70';
                        label = 'Expired (Past)';
                      }

                      return (
                        <div key={hr} className={`p-2.5 rounded-xl border text-center font-mono transition-all flex flex-col items-center justify-center min-h-[58px] ${slotStyle}`}>
                          <span className="text-[11px] font-black">{hr}</span>
                          <span className="text-[9px] uppercase font-bold mt-0.5 leading-tight px-1 text-center truncate max-w-full" title={label}>{label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
