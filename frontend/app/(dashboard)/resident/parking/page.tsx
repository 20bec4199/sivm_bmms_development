'use client';

import React, { useState, useMemo } from 'react';
import { motion, Variants } from 'framer-motion';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { 
  Car, 
  Plus, 
  Zap, 
  Accessibility, 
  Users, 
  ShieldAlert, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  HelpCircle,
  Building,
  KeyRound,
  FileText,
  AlertTriangle,
  QrCode,
  Copy,
  Layers
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { showWarning } from '@/store/slices/uiSlice';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useGetMyParkingQuery } from '@/services/parkingApi';
import { 
  useCreateVehicleMutation, 
  useDeleteVehicleMutation 
} from '@/services/organizationApi';
import { useCreateComplaintMutation } from '@/services/complaintsApi';
import { ParkoraMap } from '@/components/parking/ParkoraMap';
import Link from 'next/link';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants: Variants = {
  hidden: { y: 15, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function ResidentParkingPage() {
  const dispatch = useDispatch();
  const confirm = useConfirm();
  const currentUser = useSelector((state: RootState) => state.auth.user);

  // Modals state
  const [isAddVehicleModalOpen, setIsAddVehicleModalOpen] = useState(false);
  const [isAssistanceModalOpen, setIsAssistanceModalOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [selectedQRPass, setSelectedQRPass] = useState<any>(null);
  const [selectedSlotForAssistance, setSelectedSlotForAssistance] = useState<any>(null);

  // Add Vehicle form state
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState('');

  // Assistance / Request form state
  const [assistanceType, setAssistanceType] = useState('UNAUTHORIZED_OCCUPANT');
  const [assistanceDetails, setAssistanceDetails] = useState('');

  // Queries & Mutations
  const { data: parkingData, isLoading: isLoadingParking, refetch: refetchParking } = useGetMyParkingQuery();
  const [createVehicle, { isLoading: isCreatingVehicle }] = useCreateVehicleMutation();
  const [deleteVehicle, { isLoading: isDeletingVehicle }] = useDeleteVehicleMutation();
  const [createComplaint, { isLoading: isSubmittingAssistance }] = useCreateComplaintMutation();

  const allocations = parkingData?.allocations || [];
  const vehicles = parkingData?.vehicles || [];
  const visitorPasses = parkingData?.visitorPasses || [];
  const residentUnits = parkingData?.units || [];

  // Default unit ID if none selected
  const activeUnitId = selectedUnitId || (residentUnits.length > 0 ? residentUnits[0].id : '');

  // Handlers
  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehiclePlate.trim()) {
      dispatch(showWarning({ message: 'License plate number is required.' }));
      return;
    }
    if (!activeUnitId) {
      dispatch(showWarning({ message: 'Please select a unit to link this vehicle.' }));
      return;
    }

    try {
      await createVehicle({
        propertyNodeId: activeUnitId,
        licensePlate: vehiclePlate.trim().toUpperCase(),
        make: vehicleMake.trim() || undefined,
        model: vehicleModel.trim() || undefined,
        color: vehicleColor.trim() || undefined,
      }).unwrap();

      setIsAddVehicleModalOpen(false);
      setVehiclePlate('');
      setVehicleMake('');
      setVehicleModel('');
      setVehicleColor('');
      refetchParking();
      dispatch(showWarning({ title: 'Success', message: 'Vehicle registered successfully!' }));
    } catch (err: any) {
      dispatch(showWarning({ message: err?.data?.message || 'Failed to register vehicle.' }));
    }
  };

  const handleDeleteVehicle = async (veh: any) => {
    const confirmed = await confirm({
      title: 'Remove Registered Vehicle',
      message: `Are you sure you want to remove vehicle ${veh.licensePlate} (${veh.make || 'Car'} ${veh.model || ''})?`,
      confirmText: 'Yes, Remove Vehicle',
      cancelText: 'Cancel',
      destructive: true,
    });

    if (confirmed) {
      try {
        await deleteVehicle(veh.id).unwrap();
        refetchParking();
        dispatch(showWarning({ title: 'Removed', message: `Vehicle ${veh.licensePlate} has been removed.` }));
      } catch (err: any) {
        dispatch(showWarning({ message: err?.data?.message || 'Failed to remove vehicle.' }));
      }
    }
  };

  const handleOpenAssistance = (slot?: any) => {
    setSelectedSlotForAssistance(slot || null);
    if (slot) {
      setAssistanceType('UNAUTHORIZED_OCCUPANT');
      setAssistanceDetails(`Another unauthorized vehicle is occupying my assigned bay ${slot.slot?.slotNumber}.`);
    } else {
      setAssistanceType('REQUEST_ADDITIONAL_BAY');
      setAssistanceDetails('I would like to request an additional or upgraded parking bay for my unit.');
    }
    setIsAssistanceModalOpen(true);
  };

  const handleSubmitAssistance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assistanceDetails.trim()) {
      dispatch(showWarning({ message: 'Please provide details for your request.' }));
      return;
    }

    try {
      await createComplaint({
        title: assistanceType === 'UNAUTHORIZED_OCCUPANT'
          ? `Parking Issue: Unauthorized vehicle in Bay ${selectedSlotForAssistance?.slot?.slotNumber || 'Assigned Bay'}`
          : 'Resident Parking: Request for Additional Parking Bay',
        description: assistanceDetails.trim(),
        propertyNodeId: activeUnitId || undefined,
        priority: assistanceType === 'UNAUTHORIZED_OCCUPANT' ? 'HIGH' : 'MEDIUM',
      }).unwrap();

      setIsAssistanceModalOpen(false);
      setAssistanceDetails('');
      dispatch(showWarning({ 
        title: 'Request Submitted', 
        message: 'Your parking assistance request has been dispatched to building management.' 
      }));
    } catch (err: any) {
      dispatch(showWarning({ message: err?.data?.message || 'Failed to submit assistance request.' }));
    }
  };

  // Format zone hierarchy string
  const formatHierarchy = (slot: any) => {
    if (!slot?.area) return 'Main Parking Facility';
    const parts: string[] = [];
    if (slot.area.name) parts.push(slot.area.name);
    let curr = slot.area.propertyNode;
    while (curr) {
      if (curr.name) parts.unshift(curr.name);
      curr = curr.parent;
    }
    return parts.join(' • ');
  };

  return (
    <motion.div initial="hidden" animate="show" variants={containerVariants} className="space-y-8 pb-10">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="My Parking & Vehicles"
          description="View your allocated parking spots, manage registered household vehicles, and monitor guest passes."
        />
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setIsMapModalOpen(true)}
            className="flex items-center gap-2 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold"
          >
            <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Interactive Map</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => handleOpenAssistance()}
            className="flex items-center gap-2 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold"
          >
            <HelpCircle className="w-4 h-4 text-primary" />
            <span>Request Bay Assistance</span>
          </Button>
          <Button
            onClick={() => setIsAddVehicleModalOpen(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>Register Vehicle</span>
          </Button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Assigned Bay */}
        <Card className="border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Assigned Bay</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
                {allocations.length > 0 ? allocations[0].slot?.slotNumber : 'None Assigned'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {allocations.length > 0 ? (allocations[0].slot?.area?.name || 'Standard Bay') : 'Contact admin to assign'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Car className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Registered Vehicles */}
        <Card className="border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Household Vehicles</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{vehicles.length}</h3>
              <p className="text-xs text-slate-500 mt-1">Authorized for gate entry</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Guest Parking Passes */}
        <Card className="border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Guest Parking Passes</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{visitorPasses.length}</h3>
              <p className="text-xs text-slate-500 mt-1">Recent visitor vehicle passes</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Users className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Primary Unit */}
        <Card className="border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Linked Apartment / Unit</p>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mt-1 truncate max-w-[150px]">
                {residentUnits.length > 0 ? (residentUnits[0].name || `Unit #${residentUnits[0].unitNumber}`) : 'Primary Residence'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">Assigned ownership</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Building className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* SECTION 1: Allocated Parking Bays */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-primary" />
              <span>Allocated Parking Bays</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Reserved parking stalls designated exclusively for your apartment.
            </p>
          </div>
          {allocations.length > 0 && (
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800">
              {allocations.length} Active {allocations.length === 1 ? 'Slot' : 'Slots'}
            </Badge>
          )}
        </div>

        {allocations.length === 0 ? (
          <Card className="border-dashed border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
            <CardContent className="py-12 px-6 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                <Car className="w-8 h-8 opacity-80" />
              </div>
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">No Parking Bay Allocated Yet</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mt-1 mb-6">
                Your unit does not have an active parking bay assignment. You can request a standard or EV parking slot from management.
              </p>
              <Button onClick={() => handleOpenAssistance()} className="bg-primary hover:bg-primary/90 text-white">
                Request Parking Allocation
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {allocations.map((alloc: any) => {
              const isEV = alloc.slot?.type === 'EV_CHARGING';
              const isAccessible = alloc.slot?.type === 'HANDICAPPED';

              return (
                <Card 
                  key={alloc.id} 
                  className="relative overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all group"
                >
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary to-indigo-500" />
                  <CardContent className="p-6 space-y-5">
                    {/* Bay Title & Badges */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Bay Code</span>
                          {isEV && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                              <Zap className="w-3 h-3" /> EV Charger
                            </span>
                          )}
                          {isAccessible && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                              <Accessibility className="w-3 h-3" /> Accessible
                            </span>
                          )}
                        </div>
                        <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1 tracking-tight">
                          {alloc.slot?.slotNumber}
                        </h3>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-none">
                        Active Dedicated
                      </Badge>
                    </div>

                    {/* Zone & Architectural Location */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1.5">
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        <span className="truncate">{formatHierarchy(alloc.slot)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <Building className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Zone Type: {alloc.slot?.area?.type || 'Indoor'}</span>
                      </div>
                    </div>

                    {/* Linked Vehicle & Allocation Details */}
                    <div className="text-xs space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                        <span>Assigned Vehicle:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {alloc.vehicle ? `${alloc.vehicle.licensePlate} (${alloc.vehicle.make || 'Car'})` : 'Any Registered Family Vehicle'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                        <span>Allocation Mode:</span>
                        <span className="capitalize font-medium text-slate-700 dark:text-slate-300">
                          {alloc.allocationType?.toLowerCase() || 'Permanent'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                        <span>Effective Since:</span>
                        <span className="text-slate-500">
                          {new Date(alloc.startDate || alloc.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Quick Bay Actions */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedQRPass({
                          code: `RES-BAY-${alloc.slot?.slotNumber}-${alloc.id.slice(0, 6).toUpperCase()}`,
                          slotNumber: alloc.slot?.slotNumber,
                          plate: alloc.vehicle?.licensePlate || vehicles[0]?.licensePlate || 'HOUSEHOLD',
                          areaName: alloc.slot?.area?.name || 'Assigned Zone'
                        })}
                        className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 flex items-center justify-center gap-1.5"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Gate QR Pass</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenAssistance(alloc)}
                        className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center justify-center gap-1"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Report Issue</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* SECTION 2: Registered Household Vehicles */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Car className="w-5 h-5 text-primary" />
              <span>Registered Household Vehicles</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              License plates authorized for automated barrier gate scanning and entry.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setIsAddVehicleModalOpen(true)}
            className="flex items-center gap-1.5 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Vehicle</span>
          </Button>
        </div>

        {vehicles.length === 0 ? (
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <CardContent className="py-8 px-6 text-center text-slate-500 dark:text-slate-400 text-sm">
              <p>No vehicles registered yet. Register your car or motorbike for seamless security gate access.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicles.map((veh: any) => (
              <Card key={veh.id} className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 tracking-wider">
                        {veh.licensePlate}
                      </span>
                      {veh.color && (
                        <span className="text-xs text-slate-400 capitalize">• {veh.color}</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                      {veh.make || 'Vehicle'} {veh.model || ''}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Unit: {veh.propertyNode?.name || 'Primary Residence'}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteVehicle(veh)}
                    disabled={isDeletingVehicle}
                    className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 p-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </motion.div>

      {/* SECTION 3: Guest & Visitor Vehicle Passes */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <span>Visitor Vehicle Passes</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Approved guest vehicles with gate passes issued from your apartment.
            </p>
          </div>
          <Link href="/resident/visitors">
            <Button size="sm" variant="outline" className="text-xs">
              Manage Visitors Portal
            </Button>
          </Link>
        </div>

        {visitorPasses.length === 0 ? (
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <CardContent className="py-6 px-6 text-center text-slate-500 dark:text-slate-400 text-sm">
              <p>No recent visitor parking passes requested. You can pre-approve visitor parking in the Visitors tab.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-hidden border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Visitor License Plate</th>
                    <th className="py-3 px-4">Purpose</th>
                    <th className="py-3 px-4">Expected Arrival</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {visitorPasses.map((pass: any) => (
                    <tr key={pass.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {pass.vehiclePlate || 'Guest Car'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {pass.purpose || 'Personal Visit'}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-xs">
                        {pass.expectedArrival ? new Date(pass.expectedArrival).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Flexible'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:border-purple-800">
                          Pass Active
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </motion.div>

      {/* MODAL 1: Register New Vehicle */}
      <Modal
        isOpen={isAddVehicleModalOpen}
        onClose={() => setIsAddVehicleModalOpen(false)}
        title="Register Household Vehicle"
      >
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Add your vehicle details to enable automated gate pass matching and parking enforcement compliance.
        </p>
        <form onSubmit={handleAddVehicle} className="space-y-4 pt-1">
          {residentUnits.length > 1 && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Select Apartment / Unit *
              </label>
              <select
                value={activeUnitId}
                onChange={(e) => setSelectedUnitId(e.target.value)}
                className="w-full text-sm border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none"
              >
                {residentUnits.map((u: any) => (
                  <option key={u.id} value={u.id}>
                    {u.name || `Unit #${u.unitNumber}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              License Plate Number *
            </label>
            <Input
              placeholder="e.g. ABC-1234 or NY 84729"
              value={vehiclePlate}
              onChange={(e) => setVehiclePlate(e.target.value)}
              className="uppercase font-mono tracking-wider"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Make / Manufacturer
              </label>
              <Input
                placeholder="e.g. Toyota, Tesla"
                value={vehicleMake}
                onChange={(e) => setVehicleMake(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Model
              </label>
              <Input
                placeholder="e.g. Corolla, Model 3"
                value={vehicleModel}
                onChange={(e) => setVehicleModel(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Color
            </label>
            <Input
              placeholder="e.g. Silver, White, Midnight Blue"
              value={vehicleColor}
              onChange={(e) => setVehicleColor(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddVehicleModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isCreatingVehicle}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              {isCreatingVehicle ? 'Registering...' : 'Register Vehicle'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Parking Assistance / Issue Report */}
      <Modal
        isOpen={isAssistanceModalOpen}
        onClose={() => setIsAssistanceModalOpen(false)}
        title="Parking Assistance Request"
      >
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Submit an urgent notice or request regarding your parking stall directly to property management.
        </p>
        <form onSubmit={handleSubmitAssistance} className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Issue Category
            </label>
            <select
              value={assistanceType}
              onChange={(e) => setAssistanceType(e.target.value)}
              className="w-full text-sm border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none"
            >
              <option value="UNAUTHORIZED_OCCUPANT">Unauthorized Vehicle Parked in My Bay</option>
              <option value="REQUEST_ADDITIONAL_BAY">Request Second or Additional Parking Slot</option>
              <option value="EV_CHARGER_FAULT">EV Charging Station Maintenance Required</option>
              <option value="GATE_ACCESS_ISSUE">Barrier Gate / Tag Access Issue</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description & Details *
            </label>
            <textarea
              rows={4}
              value={assistanceDetails}
              onChange={(e) => setAssistanceDetails(e.target.value)}
              className="w-full text-sm border border-slate-300 dark:border-slate-700 rounded-xl p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none"
              placeholder="Provide exact bay number, offender license plate (if known), or specific requests..."
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAssistanceModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmittingAssistance}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              {isSubmittingAssistance ? 'Submitting...' : 'Dispatch to Management'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: RESIDENT DIGITAL GATE QR PASS */}
      <Modal
        isOpen={Boolean(selectedQRPass)}
        onClose={() => setSelectedQRPass(null)}
        title="Resident FastPass • Gate Access QR"
      >
        {selectedQRPass && (
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
                  {selectedQRPass.code}
                </div>
                <div className="font-bold text-base text-slate-900 dark:text-white mt-1">
                  BAY {selectedQRPass.slotNumber} • RESIDENT ACCESS
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Hold close to camera or scanner to trigger automated barrier gate lift
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-3">
              <Button
                variant="outline"
                className="rounded-xl text-xs gap-1.5"
                onClick={() => {
                  navigator.clipboard.writeText(selectedQRPass.code);
                  dispatch(showWarning({ title: 'Copied', message: 'Pass code copied to clipboard.' }));
                }}
              >
                <Copy className="w-3.5 h-3.5" />
                Copy Token
              </Button>
              <Button
                onClick={() => setSelectedQRPass(null)}
                className="rounded-xl bg-indigo-600 text-white text-xs font-semibold px-6"
              >
                Close Pass
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL: INTERACTIVE VISUAL PARKING MAP */}
      <Modal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        title="Property Visual Parking Map"
      >
        <div className="max-h-[75vh] overflow-y-auto pr-1">
          <ParkoraMap />
        </div>
      </Modal>
    </motion.div>
  );
}
