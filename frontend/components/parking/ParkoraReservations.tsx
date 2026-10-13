'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import {
  Calendar, QrCode, Plus, Search, ShieldCheck, Clock,
  Car, User, CheckCircle2, AlertCircle, Copy, Download,
  Layers, ExternalLink
} from 'lucide-react';
import {
  useGetReservationsQuery,
  useCreateReservationMutation,
  useGetPermitsQuery,
  useCreatePermitMutation,
  useGetParkingSlotsQuery,
  useGetParkingAreasQuery
} from '@/services/parkingApi';
import { useDispatch } from 'react-redux';
import { showWarning } from '@/store/slices/uiSlice';

export function ParkoraReservations() {
  const dispatch = useDispatch();

  // Sub-tab: 'reservations' | 'permits'
  const [activeTab, setActiveTab] = useState<'reservations' | 'permits'>('reservations');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [isPermitModalOpen, setIsPermitModalOpen] = useState(false);
  const [selectedPermitForQR, setSelectedPermitForQR] = useState<any>(null);

  // Form: Create Reservation
  const [resSlotId, setResSlotId] = useState('');
  const [resStartTime, setResStartTime] = useState('');
  const [resEndTime, setResEndTime] = useState('');
  const [resType, setResType] = useState('VISITOR');
  const [resNotes, setResNotes] = useState('');

  // Form: Create Permit
  const [permitType, setPermitType] = useState('RESIDENT');
  const [permitSlotId, setPermitSlotId] = useState('');
  const [permitValidFrom, setPermitValidFrom] = useState('');
  const [permitValidTo, setPermitValidTo] = useState('');
  const [permitPlate, setPermitPlate] = useState('');

  // Queries
  const { data: reservationsData, isLoading: isLoadingReservations, refetch: refetchReservations } = useGetReservationsQuery({});
  const { data: permitsData, isLoading: isLoadingPermits, refetch: refetchPermits } = useGetPermitsQuery({});
  const { data: slotsData } = useGetParkingSlotsQuery(undefined);
  const { data: areasData } = useGetParkingAreasQuery(undefined);

  // Mutations
  const [createReservation, { isLoading: isCreatingReservation }] = useCreateReservationMutation();
  const [createPermit, { isLoading: isCreatingPermit }] = useCreatePermitMutation();

  const reservations = Array.isArray(reservationsData) ? reservationsData : (reservationsData?.data || []);
  const permits = Array.isArray(permitsData) ? permitsData : (permitsData?.data || []);
  const slots = Array.isArray(slotsData) ? slotsData : (slotsData?.data || []);
  const areas = Array.isArray(areasData) ? areasData : (areasData?.data || []);

  // Filtered lists
  const filteredReservations = reservations.filter((r: any) => {
    if (!searchQuery) return true;
    return r.slot?.slotNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           r.parkingType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           r.notes?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredPermits = permits.filter((p: any) => {
    if (!searchQuery) return true;
    return p.permitCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           p.permitType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           p.slot?.slotNumber?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Handle Reservation Create
  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resStartTime || !resEndTime) {
      dispatch(showWarning({ message: 'Start and End times are required.' }));
      return;
    }

    try {
      await createReservation({
        slotId: resSlotId || undefined,
        startTime: resStartTime,
        endTime: resEndTime,
        parkingType: resType,
        notes: resNotes || undefined
      }).unwrap();

      setIsReservationModalOpen(false);
      setResSlotId('');
      setResStartTime('');
      setResEndTime('');
      setResNotes('');
      refetchReservations();
      dispatch(showWarning({
        title: 'Reservation Confirmed',
        message: 'Advance bay booking created successfully.'
      }));
    } catch (err: any) {
      dispatch(showWarning({ message: err?.data?.message || 'Failed to create reservation.' }));
    }
  };

  // Handle Permit Create
  const handleCreatePermit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createPermit({
        permitType,
        slotId: permitSlotId || undefined,
        validFrom: permitValidFrom || undefined,
        validTo: permitValidTo || undefined,
        metadata: { licensePlate: permitPlate.trim().toUpperCase() }
      }).unwrap();

      setIsPermitModalOpen(false);
      setPermitPlate('');
      setPermitSlotId('');
      refetchPermits();
      dispatch(showWarning({
        title: 'Permit Issued',
        message: 'Digital parking permit and secure QR token generated.'
      }));
    } catch (err: any) {
      dispatch(showWarning({ message: err?.data?.message || 'Failed to generate permit.' }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Advance Bookings & Digital Permits</h2>
              <p className="text-xs text-slate-400">
                Scheduled bay allocations, guest pre-booking, and cryptographically verified digital QR access passes.
              </p>
            </div>
          </div>
        </div>

        {/* Sub tab toggles */}
        <div className="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700/60">
          <button
            onClick={() => setActiveTab('reservations')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'reservations' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Advance Bookings ({reservations.length})
          </button>
          <button
            onClick={() => setActiveTab('permits')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'permits' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Digital Permits ({permits.length})
          </button>
        </div>
      </div>

      {/* Action / Filter Bar */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder={`Search ${activeTab === 'reservations' ? 'bookings, notes, bay...' : 'permit code, vehicle plate, type...'}`}
            className="pl-10 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border-0 h-11 text-xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div>
          {activeTab === 'reservations' ? (
            <Button
              onClick={() => setIsReservationModalOpen(true)}
              className="rounded-xl h-11 px-5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Book Advance Bay
            </Button>
          ) : (
            <Button
              onClick={() => setIsPermitModalOpen(true)}
              className="rounded-xl h-11 px-5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Issue Digital Permit
            </Button>
          )}
        </div>
      </div>

      {/* VIEW 1: ADVANCE RESERVATIONS */}
      {activeTab === 'reservations' && (
        <>
          {filteredReservations.length === 0 ? (
            <div className="p-16 text-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <Calendar className="w-12 h-12 mx-auto text-slate-400 mb-3 opacity-60" />
              <div className="font-bold text-slate-800 dark:text-slate-200 text-base">No Advance Bookings</div>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                No advance bay reservations found. Schedule a stall for an upcoming guest, executive or contractor.
              </p>
              <Button
                onClick={() => setIsReservationModalOpen(true)}
                variant="outline"
                className="mt-4 rounded-xl text-xs"
              >
                Schedule Reservation
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredReservations.map((res: any) => (
                <div
                  key={res.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        <span>Bay {res.slot?.slotNumber || 'Unassigned'}</span>
                        <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 text-[10px]">
                          {res.parkingType}
                        </Badge>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Zone: {res.slot?.area?.name || 'General Parking'}
                      </div>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 text-[10px]">
                      {res.status}
                    </Badge>
                  </div>

                  <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Start Time:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {new Date(res.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>End Time:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {new Date(res.endTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                    {res.notes && (
                      <div className="pt-1 text-[11px] text-slate-500 italic border-t border-slate-200 dark:border-slate-700">
                        {res.notes}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* VIEW 2: DIGITAL PERMITS */}
      {activeTab === 'permits' && (
        <>
          {filteredPermits.length === 0 ? (
            <div className="p-16 text-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <QrCode className="w-12 h-12 mx-auto text-slate-400 mb-3 opacity-60" />
              <div className="font-bold text-slate-800 dark:text-slate-200 text-base">No Digital Permits Issued</div>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Issue dynamic QR permits for residents, staff, VIPs or long-term contractors.
              </p>
              <Button
                onClick={() => setIsPermitModalOpen(true)}
                variant="outline"
                className="mt-4 rounded-xl text-xs"
              >
                Issue Digital Permit
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPermits.map((permit: any) => {
                const plate = permit.metadata?.licensePlate || permit.vehicle?.licensePlate;

                return (
                  <div
                    key={permit.id}
                    className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">
                          {permit.permitCode}
                        </span>
                        <div className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">
                          {permit.permitType} Pass
                        </div>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 text-[10px]">
                        {permit.status}
                      </Badge>
                    </div>

                    <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                      {plate && (
                        <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                          <span>Vehicle Plate:</span>
                          <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-mono font-bold text-[11px]">
                            {plate}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>Assigned Bay:</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {permit.slot ? `Bay ${permit.slot.slotNumber}` : 'Floating / Any'}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>Valid Until:</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {permit.validTo ? new Date(permit.validTo).toLocaleDateString() : 'Permanent'}
                        </span>
                      </div>
                    </div>

                    <Button
                      onClick={() => setSelectedPermitForQR(permit)}
                      variant="outline"
                      className="w-full rounded-xl h-10 border-indigo-200 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-xs font-semibold gap-2"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      View Digital Pass & QR
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* MODAL: CREATE RESERVATION */}
      <Modal
        isOpen={isReservationModalOpen}
        onClose={() => setIsReservationModalOpen(false)}
        title="Schedule Bay Reservation"
      >
        <p className="text-xs text-slate-500 mb-4">
          Reserve an exclusive stall in advance for scheduled visitors, vendors, or VIPs.
        </p>
        <form onSubmit={handleCreateReservation} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Parking Bay
            </label>
            <select
              value={resSlotId}
              onChange={(e) => setResSlotId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-xs text-slate-800 dark:text-slate-200"
            >
              <option value="">Auto-Assign on Arrival</option>
              {slots.map((s: any) => (
                <option key={s.id} value={s.id}>
                  Bay {s.slotNumber} ({s.type}) - {s.status}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Start Time *
              </label>
              <Input
                type="datetime-local"
                value={resStartTime}
                onChange={(e) => setResStartTime(e.target.value)}
                className="rounded-xl h-11 text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                End Time *
              </label>
              <Input
                type="datetime-local"
                value={resEndTime}
                onChange={(e) => setResEndTime(e.target.value)}
                className="rounded-xl h-11 text-xs"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Reservation Category
            </label>
            <select
              value={resType}
              onChange={(e) => setResType(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-xs text-slate-800 dark:text-slate-200"
            >
              <option value="VISITOR">Guest / Visitor</option>
              <option value="VIP">Executive / VIP</option>
              <option value="CONTRACTOR">Contractor / Maintenance</option>
              <option value="EVENT">Event Attendee</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Notes or Guest Details
            </label>
            <Input
              placeholder="e.g. Architect visiting unit 402"
              value={resNotes}
              onChange={(e) => setResNotes(e.target.value)}
              className="rounded-xl h-11 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsReservationModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isCreatingReservation}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
            >
              Confirm Booking
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: ISSUE PERMIT */}
      <Modal
        isOpen={isPermitModalOpen}
        onClose={() => setIsPermitModalOpen(false)}
        title="Issue Digital Parking Permit"
      >
        <p className="text-xs text-slate-500 mb-4">
          Generate an encrypted digital access pass for automated barrier scanning.
        </p>
        <form onSubmit={handleCreatePermit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Permit Classification *
            </label>
            <select
              value={permitType}
              onChange={(e) => setPermitType(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-xs text-slate-800 dark:text-slate-200"
            >
              <option value="RESIDENT">Resident Primary Pass</option>
              <option value="EMPLOYEE">Staff / Employee Decal</option>
              <option value="VISITOR">Visitor Temporary Permit</option>
              <option value="VIP">Executive VIP Tag</option>
              <option value="CONTRACTOR">Contractor / Delivery</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Vehicle License Plate
            </label>
            <Input
              placeholder="e.g. DL01AB1234"
              value={permitPlate}
              onChange={(e) => setPermitPlate(e.target.value.toUpperCase())}
              className="rounded-xl h-11 text-xs font-mono font-bold uppercase tracking-wider"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Lock to Specific Bay (Optional)
            </label>
            <select
              value={permitSlotId}
              onChange={(e) => setPermitSlotId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-xs text-slate-800 dark:text-slate-200"
            >
              <option value="">Floating / Zone-wide authorization</option>
              {slots.map((s: any) => (
                <option key={s.id} value={s.id}>
                  Bay {s.slotNumber} ({s.type})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Valid From
              </label>
              <Input
                type="date"
                value={permitValidFrom}
                onChange={(e) => setPermitValidFrom(e.target.value)}
                className="rounded-xl h-11 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Valid Until
              </label>
              <Input
                type="date"
                value={permitValidTo}
                onChange={(e) => setPermitValidTo(e.target.value)}
                className="rounded-xl h-11 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPermitModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isCreatingPermit}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
            >
              Issue Digital Permit
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: VIEW DIGITAL QR PASS */}
      <Modal
        isOpen={Boolean(selectedPermitForQR)}
        onClose={() => setSelectedPermitForQR(null)}
        title="Digital Access Token & Gate QR"
      >
        {selectedPermitForQR && (
          <div className="space-y-6 text-center">
            <div className="p-6 bg-gradient-to-b from-indigo-50 to-white dark:from-slate-800 dark:to-slate-900 rounded-3xl border border-indigo-100 dark:border-slate-700 shadow-inner">
              <div className="w-48 h-48 mx-auto bg-white p-4 rounded-2xl shadow-md border border-slate-200 flex items-center justify-center relative">
                {/* Visual SVG QR representation */}
                <svg className="w-full h-full text-slate-900" viewBox="0 0 100 100" fill="currentColor">
                  <rect x="10" y="10" width="25" height="25" fill="black" />
                  <rect x="14" y="14" width="17" height="17" fill="white" />
                  <rect x="18" y="18" width="9" height="9" fill="black" />
                  <rect x="65" y="10" width="25" height="25" fill="black" />
                  <rect x="69" y="14" width="17" height="17" fill="white" />
                  <rect x="73" y="18" width="9" height="9" fill="black" />
                  <rect x="10" y="65" width="25" height="25" fill="black" />
                  <rect x="14" y="69" width="17" height="17" fill="white" />
                  <rect x="18" y="73" width="9" height="9" fill="black" />
                  <rect x="45" y="15" width="8" height="8" fill="black" />
                  <rect x="45" y="30" width="12" height="6" fill="black" />
                  <rect x="40" y="45" width="20" height="20" fill="black" />
                  <rect x="45" y="50" width="10" height="10" fill="white" />
                  <rect x="70" y="45" width="15" height="8" fill="black" />
                  <rect x="65" y="65" width="20" height="12" fill="black" />
                  <rect x="45" y="75" width="12" height="12" fill="black" />
                </svg>
              </div>

              <div className="mt-4">
                <div className="font-mono font-bold text-sm tracking-widest text-indigo-600 dark:text-indigo-400">
                  {selectedPermitForQR.permitCode}
                </div>
                <div className="font-bold text-base text-slate-900 dark:text-white mt-1">
                  {selectedPermitForQR.permitType} PASS
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Hold close to camera or barrier terminal scanner to trigger gate arm
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-3">
              <Button
                variant="outline"
                className="rounded-xl text-xs gap-1.5"
                onClick={() => {
                  navigator.clipboard.writeText(selectedPermitForQR.permitCode);
                  dispatch(showWarning({ title: 'Copied', message: 'Permit code copied to clipboard.' }));
                }}
              >
                <Copy className="w-3.5 h-3.5" />
                Copy Code
              </Button>
              <Button
                onClick={() => setSelectedPermitForQR(null)}
                className="rounded-xl bg-indigo-600 text-white text-xs font-semibold px-6"
              >
                Close Pass
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
