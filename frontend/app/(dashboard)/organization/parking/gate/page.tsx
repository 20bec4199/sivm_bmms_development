'use client';

import React, { useState, useMemo } from 'react';
import { motion, Variants } from 'framer-motion';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { 
  ShieldCheck, 
  Car, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  LogOut, 
  LogIn, 
  RefreshCw,
  Users,
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { showWarning } from '@/store/slices/uiSlice';
import { useConfirm } from '@/providers/ConfirmProvider';
import { 
  useGetParkingSlotsQuery, 
  useGateCheckInMutation, 
  useGateCheckOutMutation 
} from '@/services/parkingApi';
import { SmartiParkNav } from '@/components/parking/SmartiParkNav';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants: Variants = {
  hidden: { y: 15, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function SecurityGateParkingPage() {
  const dispatch = useDispatch();
  const confirm = useConfirm();

  // Gate check-in state
  const [inboundPlate, setInboundPlate] = useState('');
  const [visitorName, setVisitorName] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [checkInNotes, setCheckInNotes] = useState('');
  const [assignedBayFeedback, setAssignedBayFeedback] = useState<any>(null);

  // Search & Filter state
  const [searchFilter, setSearchFilter] = useState('');

  // Queries & Mutations
  const { data: slotsResponse, isLoading: isLoadingSlots, refetch: refetchSlots } = useGetParkingSlotsQuery(undefined);
  const [gateCheckIn, { isLoading: isCheckingIn }] = useGateCheckInMutation();
  const [gateCheckOut, { isLoading: isCheckingOut }] = useGateCheckOutMutation();

  const slots = useMemo(() => Array.isArray(slotsResponse) ? slotsResponse : (slotsResponse?.data || []), [slotsResponse]);

  // Statistics
  const totalSlots = slots.length;
  const occupiedSlots = slots.filter((s: any) => s.status === 'OCCUPIED').length;
  const availableSlots = slots.filter((s: any) => s.status === 'AVAILABLE').length;

  const visitorSlots = slots.filter((s: any) => s.type === 'VISITOR');
  const availableVisitorSlots = visitorSlots.filter((s: any) => s.status === 'AVAILABLE');
  const occupiedVisitorSlots = visitorSlots.filter((s: any) => s.status === 'OCCUPIED');

  // Currently occupied slots with allocations
  const activeOccupiedList = useMemo(() => {
    return slots.filter((s: any) => {
      if (s.status !== 'OCCUPIED') return false;
      const activeAlloc = s.allocations?.find((a: any) => a.isActive);
      const plate = activeAlloc?.vehicle?.licensePlate || activeAlloc?.notes || '';
      return s.slotNumber.toLowerCase().includes(searchFilter.toLowerCase()) ||
        plate.toLowerCase().includes(searchFilter.toLowerCase());
    });
  }, [slots, searchFilter]);

  // Handle Gate Check-In
  const handleGateCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inboundPlate.trim()) {
      dispatch(showWarning({ message: 'License plate number is required for gate admission.' }));
      return;
    }

    try {
      const res = await gateCheckIn({
        licensePlate: inboundPlate.trim().toUpperCase(),
        slotId: selectedSlotId || undefined,
        visitorName: visitorName.trim() || undefined,
        notes: checkInNotes.trim() || undefined,
      }).unwrap();

      setAssignedBayFeedback({
        plate: inboundPlate.trim().toUpperCase(),
        slotNumber: res?.slot?.slotNumber || 'Allocated',
        areaName: res?.slot?.area?.name || 'Visitor Zone',
      });

      setInboundPlate('');
      setVisitorName('');
      setSelectedSlotId('');
      setCheckInNotes('');
      refetchSlots();
      dispatch(showWarning({ 
        title: 'Barrier Open: Vehicle Admitted', 
        message: `Assigned to Bay ${res?.slot?.slotNumber}` 
      }));
    } catch (err: any) {
      dispatch(showWarning({ message: err?.data?.message || err?.message || 'Failed to admit vehicle.' }));
    }
  };

  // Handle Gate Check-Out
  const handleGateCheckOut = async (slot: any) => {
    const activeAlloc = slot.allocations?.find((a: any) => a.isActive);
    const vehicleLabel = activeAlloc?.vehicle?.licensePlate || slot.slotNumber;

    const confirmed = await confirm({
      title: 'Vehicle Exit Barrier Release',
      message: `Open barrier and check out vehicle (${vehicleLabel}) from Bay ${slot.slotNumber}?`,
      confirmText: 'Confirm Exit & Release Bay',
      cancelText: 'Cancel',
      destructive: false,
    });

    if (confirmed) {
      try {
        await gateCheckOut({ slotId: slot.id }).unwrap();
        refetchSlots();
        dispatch(showWarning({ 
          title: 'Exit Completed', 
          message: `Bay ${slot.slotNumber} has been released and barrier opened.` 
        }));
      } catch (err: any) {
        dispatch(showWarning({ message: err?.data?.message || err?.message || 'Failed to release bay.' }));
      }
    }
  };

  return (
    <motion.div initial="hidden" animate="show" variants={containerVariants} className="space-y-6 pb-12">
      {/* SmartiPark Unified Navigation Bar */}
      <SmartiParkNav 
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchSlots()}
              className="flex items-center gap-1.5 rounded-xl text-xs font-semibold h-9"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Sync Live Bays</span>
            </Button>
            <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3 py-1 flex items-center gap-1.5 font-mono text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              TERMINAL ONLINE
            </Badge>
          </div>
        }
      />

      {/* Gate Page Sub-header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          Gate & Barrier Console
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Rapid-action barrier control, automated visitor bay assignment, and live occupancy tracking.
        </p>
      </div>

      {/* Live Capacity Gauges */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Visitor Parking Status */}
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-white to-white dark:via-slate-900 dark:to-slate-900 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Visitor Bays Capacity</span>
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                {availableVisitorSlots.length}
              </span>
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                / {visitorSlots.length} Available
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full mt-3 overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  availableVisitorSlots.length === 0 ? 'bg-rose-500' : 'bg-primary'
                }`}
                style={{ 
                  width: `${visitorSlots.length > 0 ? (availableVisitorSlots.length / visitorSlots.length) * 100 : 0}%` 
                }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-2 font-medium">
              {availableVisitorSlots.length === 0 
                ? '⚠️ Visitor lot is full. Standard bays will be used.' 
                : `${occupiedVisitorSlots.length} visitor bays currently in use`}
            </p>
          </CardContent>
        </Card>

        {/* Total Property Bays */}
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Overall Property Occupancy</span>
              <Car className="w-5 h-5 text-slate-400" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                {occupiedSlots}
              </span>
              <span className="text-sm font-semibold text-slate-500">
                / {totalSlots} Occupied
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full mt-3 overflow-hidden">
              <div 
                className="h-full bg-indigo-500 transition-all duration-500"
                style={{ width: `${totalSlots > 0 ? (occupiedSlots / totalSlots) * 100 : 0}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-2 font-medium">
              {availableSlots} total available stalls across all zones
            </p>
          </CardContent>
        </Card>

        {/* Security Alert Status */}
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Barrier Access Control</span>
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="mt-3">
              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-5 h-5" /> Normal Gate Flow
              </span>
              <p className="text-xs text-slate-500 mt-1">
                Plate matching active. Unassigned visitor vehicles are auto-routed to nearest open bays.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Terminal Workspace: Check-In & Active Occupied Bays */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Rapid Gate Check-In (Admit Vehicle) */}
        <motion.div variants={itemVariants} className="lg:col-span-5 space-y-5">
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                    <LogIn className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">Inbound Vehicle Admission</h3>
                    <p className="text-xs text-slate-400">Admit car & allocate visitor bay</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs text-primary border-primary/30">
                  Step 1: Check-In
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleGateCheckIn} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Vehicle License Plate *
                  </label>
                  <Input
                    placeholder="e.g. MH 02 CD 9988 or NY 5824"
                    value={inboundPlate}
                    onChange={(e) => setInboundPlate(e.target.value)}
                    className="text-lg font-mono font-bold uppercase tracking-widest py-3 border-2 focus:border-primary"
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Automatic uppercase license formatting</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Visitor / Driver Name
                    </label>
                    <Input
                      placeholder="e.g. John Doe / Delivery"
                      value={visitorName}
                      onChange={(e) => setVisitorName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Assigned Bay
                    </label>
                    <select
                      value={selectedSlotId}
                      onChange={(e) => setSelectedSlotId(e.target.value)}
                      className="w-full text-xs font-medium border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">⚡ Auto-Assign Available Bay</option>
                      {availableVisitorSlots.map((s: any) => (
                        <option key={s.id} value={s.id}>
                          Bay {s.slotNumber} ({s.area?.name || 'Visitor'})
                        </option>
                      ))}
                      {slots.filter((s: any) => s.type === 'STANDARD' && s.status === 'AVAILABLE').map((s: any) => (
                        <option key={s.id} value={s.id}>
                          Bay {s.slotNumber} (Standard • {s.area?.name || 'General'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Gate Check-In Remarks (Optional)
                  </label>
                  <Input
                    placeholder="e.g. Meeting at Unit 402, Delivery package..."
                    value={checkInNotes}
                    onChange={(e) => setCheckInNotes(e.target.value)}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isCheckingIn}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
                >
                  <LogIn className="w-5 h-5" />
                  <span>{isCheckingIn ? 'Admitting...' : 'Admit Vehicle & Open Barrier'}</span>
                </Button>
              </form>

              {/* Feedback Alert for Guard: Tell driver which bay */}
              {assignedBayFeedback && (
                <div className="mt-5 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500/40 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-extrabold text-emerald-800 dark:text-emerald-300">
                      Direct Driver to Bay:
                    </span>
                    <button 
                      onClick={() => setAssignedBayFeedback(null)}
                      className="text-xs text-slate-400 hover:text-slate-600"
                    >
                      ✕ Close
                    </button>
                  </div>
                  <div className="text-3xl font-black text-emerald-900 dark:text-emerald-100 font-mono mt-1">
                    {assignedBayFeedback.slotNumber}
                  </div>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium mt-0.5">
                    Zone: {assignedBayFeedback.areaName} • Plate: {assignedBayFeedback.plate}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* RIGHT COLUMN: Active Occupied Bays & Fast Check-Out */}
        <motion.div variants={itemVariants} className="lg:col-span-7 space-y-4">
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Car className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">Active Parked Vehicles</h3>
                    <p className="text-xs text-slate-400">Currently occupied bays & exit release</p>
                  </div>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <Input
                    placeholder="Search plate or bay..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="pl-9 py-1 text-xs"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {activeOccupiedList.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-sm">
                  <p>No occupied bays matching your filter.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Bay Code</th>
                        <th className="py-3 px-4">Zone / Area</th>
                        <th className="py-3 px-4">License Plate / Vehicle</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4 text-right">Exit Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {activeOccupiedList.map((slot: any) => {
                        const activeAlloc = slot.allocations?.find((a: any) => a.isActive);
                        const plate = activeAlloc?.vehicle?.licensePlate || activeAlloc?.notes || 'Parked Vehicle';
                        const isVisitor = slot.type === 'VISITOR' || activeAlloc?.allocationType === 'VISITOR';

                        return (
                          <tr key={slot.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="py-3.5 px-4 font-mono font-black text-slate-900 dark:text-white text-base">
                              {slot.slotNumber}
                            </td>
                            <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300 font-medium">
                              {slot.area?.name || 'Basement 1'}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="font-mono font-bold text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-800 dark:text-slate-200">
                                {plate}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <Badge 
                                variant="outline" 
                                className={`text-[11px] font-semibold ${
                                  isVisitor 
                                    ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:border-purple-800' 
                                    : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300'
                                }`}
                              >
                                {isVisitor ? 'Visitor' : 'Resident'}
                              </Badge>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleGateCheckOut(slot)}
                                disabled={isCheckingOut}
                                className="text-xs text-rose-600 border-rose-200 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-1 ml-auto font-semibold"
                              >
                                <LogOut className="w-3.5 h-3.5" />
                                <span>Check-Out</span>
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

      </div>
    </motion.div>
  );
}
