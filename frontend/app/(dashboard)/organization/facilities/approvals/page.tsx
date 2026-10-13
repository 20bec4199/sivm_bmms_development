'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { BookingStatusTimeline } from '@/components/facilities/BookingStatusTimeline';
import { 
  ShieldCheck, Clock, CheckCircle2, XCircle, AlertTriangle, Search, Filter, 
  ArrowLeft, UserCheck, CalendarCheck, DollarSign, MapPin, QrCode, FileText, Check
} from 'lucide-react';
import { useGetFacilityBookingsQuery, useUpdateFacilityBookingMutation, useVerifyBookingQrMutation, useCheckOutFacilityBookingMutation } from '@/services/facilitiesApi';
import { useDispatch } from 'react-redux';
import { showWarning } from '@/store/slices/uiSlice';

export default function FacilityApprovalsCenterPage() {
  const router = useRouter();
  const dispatch = useDispatch();

  const [filterStatus, setFilterStatus] = useState<string>('PENDING');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Rejection Modal state
  const [rejectionBookingId, setRejectionBookingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');

  // QR Verify Modal state
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);
  const [qrInput, setQrInput] = useState<string>('');

  const { data: bookingsResponse, isLoading, refetch } = useGetFacilityBookingsQuery({});
  const [updateBooking, { isLoading: isUpdating }] = useUpdateFacilityBookingMutation();
  const [verifyQr, { isLoading: isVerifying }] = useVerifyBookingQrMutation();
  const [checkOutBooking, { isLoading: isCheckingOut }] = useCheckOutFacilityBookingMutation();

  const bookings = Array.isArray(bookingsResponse) ? bookingsResponse : (bookingsResponse?.data || []);

  const pendingCount = bookings.filter((b: any) => b.status === 'PENDING' || b.status === 'DRAFT').length;
  const confirmedCount = bookings.filter((b: any) => b.status === 'CONFIRMED' || b.status === 'APPROVED').length;
  const rejectedCount = bookings.filter((b: any) => b.status === 'REJECTED').length;

  const handleApprove = async (id: string, name: string) => {
    try {
      await updateBooking({ id, data: { status: 'CONFIRMED' } }).unwrap();
      refetch();
      dispatch(showWarning({ message: `Reservation for ${name} confirmed and check-in QR pass issued!` }));
    } catch (err: any) {
      dispatch(showWarning({ message: 'Failed to confirm booking request.' }));
    }
  };

  const handleConfirmRejection = async () => {
    if (!rejectionBookingId || !rejectionReason.trim()) {
      dispatch(showWarning({ message: 'Please provide an explicit administrative rejection reason for the resident.' }));
      return;
    }

    try {
      await updateBooking({ id: rejectionBookingId, data: { status: 'REJECTED', rejectionReason } }).unwrap();
      setRejectionBookingId(null);
      setRejectionReason('');
      refetch();
      dispatch(showWarning({ message: 'Booking rejected with documented manager explanation.' }));
    } catch (err: any) {
      dispatch(showWarning({ message: 'Failed to process rejection.' }));
    }
  };

  const handleVerifyQr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrInput.trim()) {
      dispatch(showWarning({ message: 'Please paste or scan the resident QR verification token.' }));
      return;
    }

    try {
      await verifyQr({ qrData: qrInput }).unwrap();
      setIsQrModalOpen(false);
      setQrInput('');
      refetch();
      dispatch(showWarning({ message: 'Resident QR code successfully verified! Facility check-in time logged.' }));
    } catch (err: any) {
      dispatch(showWarning({ message: err?.data?.message || 'Invalid or expired QR verification pass.' }));
    }
  };

  const handleDirectCheckIn = async (bookingId: string) => {
    try {
      await verifyQr({ qrData: bookingId }).unwrap();
      refetch();
      dispatch(showWarning({ message: '✅ Resident checked-in successfully! Entry time timestamped in Digital Ledger.' }));
    } catch (err: any) {
      dispatch(showWarning({ message: err?.data?.message || 'Failed to complete direct check-in.' }));
    }
  };

  const handleCompleteCheckOut = async (bookingId: string) => {
    try {
      await checkOutBooking(bookingId).unwrap();
      refetch();
      dispatch(showWarning({ message: '🏁 Facility Check-Out completed! Reservation closed and security deposit released.' }));
    } catch (err: any) {
      dispatch(showWarning({ message: err?.data?.message || 'Failed to check out resident from facility.' }));
    }
  };

  const filteredBookings = bookings.filter((b: any) => {
    const matchStatus = filterStatus === 'ALL' || 
      (filterStatus === 'PENDING' && (b.status === 'PENDING' || b.status === 'DRAFT')) ||
      (filterStatus === 'CONFIRMED' && (b.status === 'CONFIRMED' || b.status === 'APPROVED')) ||
      b.status === filterStatus;

    const matchSearch = !searchQuery || 
      b.user?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.user?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.facility?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.id?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto pb-20 animate-in fade-in duration-300">
      {/* Top Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" onClick={() => router.push('/organization/facilities')} className="h-9 px-3 text-slate-700 dark:text-slate-300 font-bold">
            <ArrowLeft size={16} className="mr-1.5" /> Directory
          </Button>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center">
              <ShieldCheck className="w-6 h-6 mr-2 text-indigo-600 dark:text-indigo-400" /> Building Management Approval Center
            </h1>
            <p className="text-xs text-slate-500">Sign-off on resident amenity requests, verify custom questionnaires, and execute QR check-ins.</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button onClick={() => setIsQrModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs h-10 px-5 shadow-sm flex items-center">
            <QrCode className="w-4 h-4 mr-1.5" /> Scan / Verify Resident QR Pass
          </Button>
        </div>
      </div>

      {/* Filter Stats Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
        {[
          { id: 'PENDING', label: 'Pending Review', count: pendingCount, color: 'bg-amber-500 text-white' },
          { id: 'CONFIRMED', label: 'Confirmed / Approved', count: confirmedCount, color: 'bg-emerald-600 text-white' },
          { id: 'REJECTED', label: 'Rejected / Declined', count: rejectedCount, color: 'bg-red-600 text-white' },
          { id: 'COMPLETED', label: 'Completed Check-outs', count: bookings.filter((b: any) => b.status === 'COMPLETED').length, color: 'bg-indigo-600 text-white' },
          { id: 'ALL', label: 'All Requests', count: bookings.length, color: 'bg-slate-700 text-white' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterStatus === tab.id 
                ? 'bg-white dark:bg-slate-900 shadow-sm border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 scale-102' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-black ${tab.color}`}>
              {tab.count}
            </span>
          </button>
        ))}

        <div className="flex-1 min-w-[240px] ml-auto relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <Input 
            placeholder="Search by resident, facility, or ID..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs bg-white dark:bg-slate-900 w-full" 
          />
        </div>
      </div>

      {/* Bookings Queue List */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-500 font-bold">Loading facility reservation signoff queue...</div>
      ) : filteredBookings.length === 0 ? (
        <Card className="p-12 text-center text-slate-500 border border-dashed rounded-2xl">
          <ShieldCheck className="w-12 h-12 mx-auto text-slate-400 mb-2 opacity-60" />
          <p className="font-bold text-base text-slate-700 dark:text-slate-300">No reservation requests in this status queue.</p>
          <p className="text-xs text-slate-400 mt-0.5">All pending community signoff workflows are completely up-to-date!</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((b: any) => {
            const isPending = b.status === 'PENDING' || b.status === 'DRAFT';
            const cost = Number(b.totalCost || 0);
            const dep = Number(b.depositAmount || 0);
            const customVals = b.customFieldValues ? Object.entries(b.customFieldValues) : [];

            return (
              <Card key={b.id} className={`p-6 rounded-2xl border transition-all ${
                isPending ? 'border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-900 shadow-md hover:border-amber-500' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs'
              }`}>
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                  {/* Left Identity Info */}
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-black text-slate-900 dark:text-slate-100 text-base flex items-center">
                        🏷️ {b.facility?.name || 'Amenity'}
                      </span>
                      <Badge variant="outline" className="bg-slate-100 dark:bg-slate-800 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                        ID: {b.id.split('-')[0]}
                      </Badge>
                      <Badge variant="outline" className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold text-xs">
                        👥 {b.attendeeCount || 1} {b.attendeeCount === 1 ? 'Attendee' : 'Attendees'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <div>
                        <strong className="text-slate-800 dark:text-slate-200">Requested By:</strong> {b.user?.firstName ? `${b.user.firstName} ${b.user.lastName || ''}` : (b.user?.email || 'Resident Account')}
                      </div>
                      <div>
                        <strong className="text-slate-800 dark:text-slate-200">Time Slot:</strong> <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{new Date(b.startTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })} → {new Date(b.endTime).toLocaleTimeString([], { timeStyle: 'short' })}</span>
                      </div>
                      {b.purpose && (
                        <div className="sm:col-span-2">
                          <strong className="text-slate-800 dark:text-slate-200">Booking Purpose:</strong> <span className="italic">{b.purpose}</span>
                        </div>
                      )}
                    </div>

                    {/* Custom Field Questionnaire Answers */}
                    {customVals.length > 0 && (
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs space-y-1">
                        <span className="font-bold text-[11px] uppercase tracking-wider text-slate-500 block">Mandatory Questionnaire Responses:</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {customVals.map(([k, v], idx) => (
                            <div key={idx} className="font-mono truncate">
                              <span className="text-slate-400 font-semibold">{k.replace('custom_field_', 'Q_')}:</span> <strong className="text-slate-800 dark:text-slate-200">{String(v)}</strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Timeline Tracker */}
                    <div className="pt-2">
                      <BookingStatusTimeline status={b.status} checkInTime={b.checkInTime} checkOutTime={b.checkOutTime} rejectionReason={b.rejectionReason} createdAt={b.createdAt} />
                    </div>
                  </div>

                  {/* Right Ledger & Action Buttons */}
                  <div className="flex flex-col justify-between items-end lg:w-64 shrink-0 space-y-4 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 pt-4 lg:pt-0 lg:pl-6">
                    <div className="text-right space-y-1 w-full font-mono">
                      <div className="text-xs text-slate-500 font-bold">Total Rental Fee:</div>
                      <div className="text-xl font-black text-slate-900 dark:text-slate-100">${cost.toFixed(2)}</div>
                      {dep > 0 && (
                        <div className="text-[11px] text-emerald-600 font-semibold">
                          Security Deposit: ${dep.toFixed(2)} ({b.depositPaid ? 'Paid' : 'Pending'})
                        </div>
                      )}
                    </div>

                    {/* Sign-off Controls */}
                    <div className="flex flex-col space-y-2 w-full pt-2">
                      {isPending ? (
                        <>
                          <Button 
                            onClick={() => handleApprove(b.id, b.facility?.name || 'Amenity')} 
                            disabled={isUpdating}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs h-10 w-full shadow-sm"
                          >
                            <Check className="w-4 h-4 mr-1.5" /> Approve & Confirm Pass
                          </Button>
                          <Button 
                            onClick={() => setRejectionBookingId(b.id)} 
                            variant="outline" 
                            className="border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 font-bold text-xs h-9 w-full"
                          >
                            <XCircle className="w-4 h-4 mr-1.5" /> Reject Request
                          </Button>
                        </>
                      ) : (b.status === 'CONFIRMED' || b.status === 'APPROVED') && !b.checkInTime ? (
                        <>
                          <Button 
                            onClick={() => handleDirectCheckIn(b.id)} 
                            disabled={isVerifying}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs h-9 w-full shadow-sm"
                          >
                            <UserCheck className="w-4 h-4 mr-1.5" /> ⚡ Execute Instant Check-In
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => { setQrInput(`bmms-booking-verify:${b.id}`); setIsQrModalOpen(true); }} 
                            className="w-full text-[11px] font-bold text-indigo-600 border-indigo-300 hover:bg-indigo-50 h-8"
                          >
                            <QrCode className="w-3.5 h-3.5 mr-1" /> Open QR Pass Verifier
                          </Button>
                        </>
                      ) : b.checkInTime && !b.checkOutTime && b.status !== 'COMPLETED' ? (
                        <Button 
                          onClick={() => handleCompleteCheckOut(b.id)} 
                          disabled={isCheckingOut}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs h-10 w-full shadow-sm"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1.5" /> 🏁 Complete Check-Out
                        </Button>
                      ) : b.status === 'COMPLETED' ? (
                        <div className="w-full p-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[11px] font-extrabold text-center rounded-xl">
                          ✨ Usage Verified & Completed
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Rejection Modal with Mandatory Explanation */}
      {rejectionBookingId && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <Card className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-2 text-red-600 font-extrabold text-base border-b pb-2">
              <AlertTriangle size={20} />
              <span>Decline Resident Reservation Request</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Please state the operational reason for rejecting this facility request. This feedback will be displayed directly in the resident&apos;s booking status timeline.
            </p>
            <textarea
              rows={3}
              required
              placeholder="e.g. Facility is booked for a private building management assembly during this timeframe."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full p-3 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => { setRejectionBookingId(null); setRejectionReason(''); }}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={handleConfirmRejection} className="bg-red-600 hover:bg-red-700 text-white font-bold px-4">
                Confirm Rejection & Notify Resident
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* QR Verify Scanner Modal */}
      {isQrModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <Card className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center">
                <QrCode className="w-5 h-5 mr-2 text-indigo-600" /> Facility Security Desk Check-In
              </span>
              <Button variant="ghost" size="sm" onClick={() => setIsQrModalOpen(false)}>✕</Button>
            </div>
            <p className="text-xs text-slate-500">
              Paste the encrypted QR code payload from the resident&apos;s mobile digital pass or use a connected USB badge barcode reader.
            </p>
            <form onSubmit={handleVerifyQr} className="space-y-4">
              <Input
                placeholder="Paste token or scan barcode (e.g. bmms-booking-verify:uuid-here)..."
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                autoFocus
                className="font-mono text-xs"
              />
              <div className="flex justify-end space-x-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsQrModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isVerifying} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5">
                  Verify & Log Check-In Time
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
