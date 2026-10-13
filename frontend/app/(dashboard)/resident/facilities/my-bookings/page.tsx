'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { BookingStatusTimeline } from '@/components/facilities/BookingStatusTimeline';
import { FacilityCategoryBadge } from '@/components/facilities/FacilityCategoryBadge';
import { 
  QrCode, ArrowLeft, Calendar, Clock, MapPin, Users, DollarSign, 
  ShieldCheck, AlertTriangle, CheckCircle2, XCircle, Trash2, HelpCircle
} from 'lucide-react';
import { useGetFacilityBookingsQuery, useUpdateFacilityBookingMutation } from '@/services/facilitiesApi';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useDispatch } from 'react-redux';
import { showWarning } from '@/store/slices/uiSlice';
import Link from 'next/link';

export default function ResidentMyBookingsPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const confirm = useConfirm();

  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'HISTORY'>('UPCOMING');
  const [selectedQrBooking, setSelectedQrBooking] = useState<any | null>(null);

  const { data: bookingsResponse, isLoading, refetch } = useGetFacilityBookingsQuery({});
  const [updateBooking, { isLoading: isCancelling }] = useUpdateFacilityBookingMutation();

  const allBookings = Array.isArray(bookingsResponse) ? bookingsResponse : (bookingsResponse?.data || []);

  const now = new Date().getTime();
  const upcomingBookings = allBookings.filter((b: any) => {
    const end = new Date(b.endTime).getTime();
    return end >= now && b.status !== 'CANCELLED' && b.status !== 'REJECTED';
  });

  const historyBookings = allBookings.filter((b: any) => {
    const end = new Date(b.endTime).getTime();
    return end < now || b.status === 'CANCELLED' || b.status === 'REJECTED' || b.status === 'COMPLETED';
  });

  const displayList = activeTab === 'UPCOMING' ? upcomingBookings : historyBookings;

  const handleCancelReservation = async (id: string, name: string, totalCost: number) => {
    const isConfirmed = await confirm({
      title: 'Cancel Amenity Reservation',
      message: `Are you sure you wish to cancel your reservation for "${name}"? Based on the configured free cancellation window, eligible fees (${totalCost ? `$${totalCost}` : 'Complimentary'}) and security deposits will be returned to your user account.`,
      confirmText: 'Confirm Cancellation & Refund',
      cancelText: 'Keep Reservation',
      destructive: true,
    });

    if (isConfirmed) {
      try {
        await updateBooking({ id, data: { status: 'CANCELLED' } }).unwrap();
        refetch();
        dispatch(showWarning({ message: 'Reservation successfully cancelled. Refund processing initiated!' }));
      } catch (err: any) {
        dispatch(showWarning({ message: 'Failed to cancel amenity reservation.' }));
      }
    }
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-20 animate-in fade-in duration-300">
      {/* Navigation Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" onClick={() => router.push('/resident/facilities')} className="h-9 px-3.5 text-xs font-bold">
            <ArrowLeft size={16} className="mr-1.5" /> Directory
          </Button>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center">
              <QrCode className="w-6 h-6 mr-2 text-indigo-600 dark:text-indigo-400" /> Digital Passes & Reservation History
            </h1>
            <p className="text-xs text-slate-500">Present your interactive QR code pass at security checkpoints or track manager approvals.</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button onClick={() => router.push('/resident/facilities')} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-9 px-4">
            + Book Another Amenity
          </Button>
        </div>
      </div>

      {/* Toggle Tabs */}
      <div className="flex items-center space-x-3 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('UPCOMING')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center space-x-2 ${
            activeTab === 'UPCOMING'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <span>🌟 Active & Upcoming Passes</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${activeTab === 'UPCOMING' ? 'bg-indigo-700 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>
            {upcomingBookings.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center space-x-2 ${
            activeTab === 'HISTORY'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <span>📜 Past & Archived Bookings</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${activeTab === 'HISTORY' ? 'bg-indigo-700 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>
            {historyBookings.length}
          </span>
        </button>
      </div>

      {/* Bookings List */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-500 font-bold">Loading your personal reservation log...</div>
      ) : displayList.length === 0 ? (
        <Card className="p-12 text-center text-slate-500 border border-dashed rounded-2xl space-y-3">
          <Calendar className="w-12 h-12 mx-auto text-slate-400 opacity-60" />
          <div>
            <p className="font-bold text-base text-slate-700 dark:text-slate-300">No {activeTab === 'UPCOMING' ? 'upcoming active' : 'historical archived'} reservations found.</p>
            <p className="text-xs text-slate-400 mt-0.5">Explore community recreation centers, swimming pools, and guest parking in the master directory.</p>
          </div>
          <Button onClick={() => router.push('/resident/facilities')} variant="primary" className="bg-indigo-600 text-white font-bold text-xs h-9 px-5">
            Discover Amenities
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {displayList.map((b: any) => {
            const fac = b.facility || {};
            const cost = Number(b.totalCost || 0);
            const dep = Number(b.depositAmount || 0);
            const canCancel = b.status === 'CONFIRMED' || b.status === 'PENDING' || b.status === 'DRAFT';

            return (
              <Card key={b.id} className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-indigo-400 transition-all">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  {/* Left Info */}
                  <div className="space-y-4 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-black text-slate-900 dark:text-slate-100 text-lg flex items-center">
                        🏷️ {fac.name || 'Amenity'}
                      </span>
                      <FacilityCategoryBadge category={fac.category || 'Recreation'} />
                      <Badge variant="outline" className="bg-slate-100 dark:bg-slate-800 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                        Pass ID: {b.id.split('-')[0].toUpperCase()}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-400">
                      <span className="flex items-center space-x-1 font-mono font-extrabold text-indigo-600 dark:text-indigo-400">
                        <Clock size={15} className="mr-1" />
                        {new Date(b.startTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })} → {new Date(b.endTime).toLocaleTimeString([], { timeStyle: 'short' })}
                      </span>
                      <span className="flex items-center space-x-1 font-bold">
                        <Users size={15} className="mr-1 text-blue-500" />
                        {b.attendeeCount || 1} {b.attendeeCount === 1 ? 'Person' : 'People'}
                      </span>
                      {fac.locationName && (
                        <span className="flex items-center space-x-1 text-slate-500 truncate max-w-sm">
                          <MapPin size={15} className="mr-1 text-red-500 shrink-0" />
                          <span className="truncate">{fac.locationName}</span>
                        </span>
                      )}
                    </div>

                    {/* Timeline Tracker */}
                    <div className="pt-1">
                      <BookingStatusTimeline status={b.status} checkInTime={b.checkInTime} checkOutTime={b.checkOutTime} rejectionReason={b.rejectionReason} createdAt={b.createdAt} />
                    </div>
                  </div>

                  {/* Right Price & Actions */}
                  <div className="flex flex-col justify-between items-end md:w-60 shrink-0 space-y-4 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 pt-4 md:pt-0 md:pl-6">
                    <div className="text-right font-mono space-y-1 w-full">
                      <span className="text-xs text-slate-500 font-bold">Billed Rental Ledger:</span>
                      <div className="text-2xl font-black text-slate-900 dark:text-slate-100">${cost.toFixed(2)}</div>
                      {dep > 0 && (
                        <div className="text-[11px] text-emerald-600 font-semibold">
                          Security Deposit: ${dep.toFixed(2)} ({b.depositReturned ? 'Returned' : 'Held'})
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col space-y-2 w-full pt-2">
                      {b.status === 'CONFIRMED' && !b.checkInTime && (
                        <Button 
                          onClick={() => setSelectedQrBooking(b)}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs h-10 shadow-md flex items-center justify-center"
                        >
                          <QrCode className="w-4 h-4 mr-2 animate-pulse" /> View Check-In Pass
                        </Button>
                      )}
                      {canCancel && (
                        <Button 
                          variant="outline" 
                          onClick={() => handleCancelReservation(b.id, fac.name || 'Amenity', cost)}
                          className="w-full border-red-200 dark:border-red-900 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 font-extrabold text-xs h-9"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Cancel & Request Refund
                        </Button>
                      )}
                      {b.checkInTime && (
                        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 text-center text-xs font-bold text-emerald-800 dark:text-emerald-300">
                          ✅ Verified at Security Gate
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Digital QR Pass Check-In Modal */}
      {selectedQrBooking && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <Card className="max-w-sm w-full bg-white dark:bg-slate-900 border-2 border-indigo-500 rounded-3xl p-7 text-center space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
            <Button variant="ghost" size="sm" onClick={() => setSelectedQrBooking(null)} className="absolute top-3 right-3 h-8 w-8 rounded-full font-black">✕</Button>

            <div className="space-y-1 pt-2">
              <span className="text-[10px] uppercase font-mono tracking-widest text-indigo-600 dark:text-indigo-400 font-black block">
                Official Digital Resident Pass
              </span>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">{selectedQrBooking.facility?.name || 'Amenity'}</h3>
              <p className="text-xs text-slate-500 font-medium">Present at turnstiles, swimming pool gates, or security concierge.</p>
            </div>

            {/* Simulated Visual QR Token */}
            <div className="w-56 h-56 mx-auto p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center relative shadow-inner">
              <div className="w-44 h-44 border-4 border-dashed border-slate-900 dark:border-slate-100 rounded-xl flex items-center justify-center p-3">
                <div className="w-full h-full bg-slate-900 dark:bg-slate-100 rounded flex flex-col items-center justify-center text-white dark:text-slate-900 font-mono font-black text-center p-2">
                  <QrCode size={64} className="mb-2 animate-bounce opacity-90" />
                  <span className="text-[10px] tracking-tighter uppercase break-all font-mono">
                    VERIFY-TOKEN:{selectedQrBooking.id.split('-')[0]}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-left text-xs space-y-1.5 font-mono text-slate-700 dark:text-slate-300 border border-slate-200/80">
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans font-bold">Slot Time:</span>
                <strong className="font-bold">{new Date(selectedQrBooking.startTime).toLocaleTimeString([], { timeStyle: 'short' })} → {new Date(selectedQrBooking.endTime).toLocaleTimeString([], { timeStyle: 'short' })}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans font-bold">Party Size:</span>
                <strong className="font-bold">{selectedQrBooking.attendeeCount || 1} Guests Max</strong>
              </div>
            </div>

            <Button onClick={() => setSelectedQrBooking(null)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs h-10 shadow-md">
              Close Pass Window
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
