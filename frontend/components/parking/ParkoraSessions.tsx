'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import {
  Car, Clock, LogIn, LogOut, Search, Plus, CheckCircle2,
  AlertCircle, ShieldCheck, Activity, Radio, Camera, QrCode,
  DollarSign, ArrowRight, Zap, RefreshCw
} from 'lucide-react';
import {
  useGetParkingSessionsQuery,
  useCreateSessionEntryMutation,
  useCreateSessionExitMutation,
  useGetParkingSlotsQuery,
  useGetParkingAreasQuery
} from '@/services/parkingApi';
import { useDispatch } from 'react-redux';
import { showWarning } from '@/store/slices/uiSlice';
import { useConfirm } from '@/providers/ConfirmProvider';

export function ParkoraSessions() {
  const dispatch = useDispatch();
  const confirm = useConfirm();

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ACTIVE');
  const [searchPlate, setSearchPlate] = useState('');

  // Modals
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [entryPlate, setEntryPlate] = useState('');
  const [entrySlotId, setEntrySlotId] = useState('');
  const [entryAccessPoint, setEntryAccessPoint] = useState('Gate 1 Main Barrier');
  const [entryMethod, setEntryMethod] = useState('ANPR');

  // Queries
  const {
    data: sessionsData,
    isLoading: isLoadingSessions,
    refetch: refetchSessions
  } = useGetParkingSessionsQuery(statusFilter === 'ALL' ? undefined : { status: statusFilter });

  const { data: slotsData } = useGetParkingSlotsQuery(undefined);
  const { data: areasData } = useGetParkingAreasQuery(undefined);

  // Mutations
  const [createEntry, { isLoading: isCreatingEntry }] = useCreateSessionEntryMutation();
  const [createExit, { isLoading: isCreatingExit }] = useCreateSessionExitMutation();

  const sessions = Array.isArray(sessionsData) ? sessionsData : (sessionsData?.data || []);
  const slots = Array.isArray(slotsData) ? slotsData : (slotsData?.data || []);
  const areas = Array.isArray(areasData) ? areasData : (areasData?.data || []);

  // Filtered Sessions
  const filteredSessions = sessions.filter((s: any) => {
    if (!searchPlate) return true;
    return s.licensePlate?.toLowerCase().includes(searchPlate.toLowerCase()) ||
           s.slot?.slotNumber?.toLowerCase().includes(searchPlate.toLowerCase());
  });

  // Calculate elapsed time formatted string
  const formatDuration = (entryTimeStr: string, exitTimeStr?: string) => {
    const start = new Date(entryTimeStr).getTime();
    const end = exitTimeStr ? new Date(exitTimeStr).getTime() : Date.now();
    const diffMins = Math.max(0, Math.floor((end - start) / 60000));

    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  };

  // Handle Manual/Triggered Gate Entry
  const handleRecordEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryPlate.trim()) {
      dispatch(showWarning({ message: 'License plate is required.' }));
      return;
    }

    try {
      await createEntry({
        licensePlate: entryPlate.trim().toUpperCase(),
        slotId: entrySlotId || undefined,
        accessPoint: entryAccessPoint,
        entryMethod
      }).unwrap();

      setIsEntryModalOpen(false);
      setEntryPlate('');
      setEntrySlotId('');
      refetchSessions();
      dispatch(showWarning({
        title: 'Vehicle Admitted',
        message: `Plate ${entryPlate.toUpperCase()} registered and session started.`
      }));
    } catch (err: any) {
      dispatch(showWarning({ message: err?.data?.message || 'Failed to record vehicle entry.' }));
    }
  };

  // Handle Gate Exit
  const handleRecordExit = async (session: any) => {
    const duration = formatDuration(session.entryTime);
    const confirmed = await confirm({
      title: 'Authorize Vehicle Egress',
      message: `Process exit for ${session.licensePlate}? Total duration: ${duration}. Total calculated fee: ₹${session.totalFee || 0}.`,
      confirmText: 'Lift Barrier & Close Session',
      cancelText: 'Cancel'
    });

    if (confirmed) {
      try {
        await createExit({
          licensePlate: session.licensePlate,
          exitMethod: 'MANUAL_OVERRIDE'
        }).unwrap();

        refetchSessions();
        dispatch(showWarning({
          title: 'Session Closed',
          message: `Vehicle ${session.licensePlate} has exited the facility.`
        }));
      } catch (err: any) {
        dispatch(showWarning({ message: err?.data?.message || 'Failed to process exit.' }));
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Active Parked Sessions & Gate Stream</h2>
              <p className="text-xs text-slate-400">
                Real-time tracking of vehicles inside the facility, durations, fee calculation & barrier movements.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => refetchSessions()}
            className="rounded-xl border-slate-700 text-slate-300 hover:bg-slate-800 text-xs h-10 gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Sync Feed
          </Button>
          <Button
            onClick={() => setIsEntryModalOpen(true)}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-10 gap-2 shadow-lg shadow-indigo-600/30"
          >
            <LogIn className="w-4 h-4" />
            Admit Vehicle
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="Search by license plate or bay number..."
            className="pl-10 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border-0 h-11 text-xs"
            value={searchPlate}
            onChange={(e) => setSearchPlate(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          {(['ACTIVE', 'COMPLETED', 'ALL'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {st === 'ACTIVE' ? 'Currently Parked' : st === 'COMPLETED' ? 'Completed Exits' : 'All Sessions'}
            </button>
          ))}
        </div>
      </div>

      {/* Sessions Grid / Table */}
      {filteredSessions.length === 0 ? (
        <div className="p-16 text-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <Car className="w-12 h-12 mx-auto text-slate-400 mb-3 opacity-60" />
          <div className="font-bold text-slate-800 dark:text-slate-200 text-base">No Matching Sessions Found</div>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {statusFilter === 'ACTIVE'
              ? 'No vehicles are actively occupying parking bays under the current filter.'
              : 'No historical parking records found.'}
          </p>
          <Button
            onClick={() => setIsEntryModalOpen(true)}
            variant="outline"
            className="mt-4 rounded-xl text-xs"
          >
            Admit Vehicle Manually
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSessions.map((session: any) => {
            const isActive = session.status === 'ACTIVE';
            const duration = formatDuration(session.entryTime, session.exitTime);

            return (
              <div
                key={session.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
              >
                {/* Active indicator bar */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${
                  isActive ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'
                }`} />

                {/* Header: Plate & Status */}
                <div className="flex items-start justify-between gap-3 pt-1">
                  <div>
                    <div className="inline-block px-3 py-1 rounded-lg bg-slate-950 text-white font-mono font-bold text-sm tracking-wider border border-slate-700 shadow-sm">
                      {session.licensePlate}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                      <span>Access: {session.accessPoint || 'Gate 1'}</span>
                      <span>•</span>
                      <span className="uppercase text-indigo-600 dark:text-indigo-400 font-semibold text-[10px]">
                        {session.entryMethod || 'ANPR'}
                      </span>
                    </div>
                  </div>

                  <Badge className={`text-[10px] ${
                    isActive
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {session.status}
                  </Badge>
                </div>

                {/* Bay & Timing Card */}
                <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-semibold block">Assigned Bay</span>
                    <span className="font-bold text-slate-900 dark:text-white font-mono">
                      {session.slot?.slotNumber || 'Unassigned / Zone'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-semibold block">Duration</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {duration}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-semibold block">Entry Stamp</span>
                    <span className="text-slate-700 dark:text-slate-300 text-[11px]">
                      {new Date(session.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-semibold block">Tariff Fee</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      ₹{session.totalFee || 0}
                    </span>
                  </div>
                </div>

                {/* Footer Action */}
                {isActive && (
                  <Button
                    onClick={() => handleRecordExit(session)}
                    className="w-full rounded-xl h-10 bg-slate-900 hover:bg-slate-800 text-white dark:bg-indigo-600 dark:hover:bg-indigo-700 text-xs font-semibold gap-2 shadow-sm"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Process Gate Exit
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: ADMIT VEHICLE */}
      <Modal
        isOpen={isEntryModalOpen}
        onClose={() => setIsEntryModalOpen(false)}
        title="Admit Vehicle at Gate Barrier"
      >
        <p className="text-xs text-slate-500 mb-4">
          Record a new vehicle entry event, allocate a bay, and initialize time tracking.
        </p>
        <form onSubmit={handleRecordEntry} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Vehicle License Plate *
            </label>
            <Input
              placeholder="e.g. KA01MJ9999"
              value={entryPlate}
              onChange={(e) => setEntryPlate(e.target.value.toUpperCase())}
              className="rounded-xl h-11 text-xs font-mono font-bold uppercase tracking-wider"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Allocate Available Bay (Optional)
            </label>
            <select
              value={entrySlotId}
              onChange={(e) => setEntrySlotId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-xs text-slate-800 dark:text-slate-200"
            >
              <option value="">Auto-Assign / Free Circulation</option>
              {slots
                .filter((s: any) => s.status === 'AVAILABLE')
                .map((slot: any) => (
                  <option key={slot.id} value={slot.id}>
                    Bay {slot.slotNumber} ({slot.type})
                  </option>
                ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Access Point
              </label>
              <Input
                value={entryAccessPoint}
                onChange={(e) => setEntryAccessPoint(e.target.value)}
                className="rounded-xl h-11 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Entry Verification Method
              </label>
              <select
                value={entryMethod}
                onChange={(e) => setEntryMethod(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-xs text-slate-800 dark:text-slate-200"
              >
                <option value="ANPR">ANPR Camera</option>
                <option value="RFID">RFID Fast-Tag</option>
                <option value="QR">Dynamic QR Pass</option>
                <option value="MANUAL">Security Guard Manual</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEntryModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isCreatingEntry}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
            >
              Confirm & Lift Barrier
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
