'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Plus,
  X,
  Building2,
  Home,
  MapPin,
  Layers,
  AlertCircle,
  QrCode,
  Calendar,
  Phone,
  UserCheck,
  CheckCircle2,
  Clock,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { showWarning } from '@/store/slices/uiSlice';
import {
  useGetVisitorRegistrationsQuery,
  useGetRegistrationPassQuery,
  useCreateVisitorMutation,
  useCreateRegistrationMutation,
} from '@/services/visitorsApi';
import { useGetMyUnitsQuery, useGetUnitsQuery } from '@/services/organizationApi';
import { QrCodeDisplay } from '@/components/ui/QrCodeDisplay';
import { downloadVisitorPass } from '@/utils/downloadPass';

export default function ResidentVisitorsPage() {
  const dispatch = useDispatch();
  const { data: registrationsData, isLoading, refetch } = useGetVisitorRegistrationsQuery({});
  
  // Query resident's units with fallback
  const { data: myUnitsRes, isLoading: isLoadingMyUnits } = useGetMyUnitsQuery({});
  const { data: fallbackUnitsRes } = useGetUnitsQuery(
    { myUnits: true },
    { skip: !!myUnitsRes?.data && myUnitsRes.data.length > 0 }
  );

  const [createVisitor, { isLoading: isCreatingVisitor }] = useCreateVisitorMutation();
  const [createRegistration, { isLoading: isCreatingReg }] = useCreateRegistrationMutation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQrPass, setSelectedQrPass] = useState<any | null>(null);
  const [selectedPassId, setSelectedPassId] = useState<string | null>(null);
  const { data: passDetailRes } = useGetRegistrationPassQuery(selectedPassId || '', { skip: !selectedPassId });

  // Sync pass details if freshly retrieved from server
  useEffect(() => {
    if (passDetailRes && selectedQrPass && passDetailRes.id === selectedQrPass.id) {
      setSelectedQrPass((prev: any) => ({
        ...prev,
        ...passDetailRes,
        qrCodeImage: passDetailRes.qrCodeImage || prev?.qrCodeImage,
        qrData: passDetailRes.qrData || prev?.qrData,
      }));
    }
  }, [passDetailRes]);

  const [selectedBuildingFilter, setSelectedBuildingFilter] = useState<string>('ALL');

  const [newVisitor, setNewVisitor] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    expectedArrival: '',
    purpose: 'VISITOR',
    unitId: '',
    requiresParking: false,
    vehiclePlate: '',
  });

  const visitors = registrationsData?.data || [];

  // Normalize units list from either my-units or fallback
  const units: any[] = useMemo(() => {
    if (myUnitsRes?.data && Array.isArray(myUnitsRes.data)) return myUnitsRes.data;
    if (Array.isArray(myUnitsRes)) return myUnitsRes;
    if (fallbackUnitsRes?.data && Array.isArray(fallbackUnitsRes.data)) return fallbackUnitsRes.data;
    if (Array.isArray(fallbackUnitsRes)) return fallbackUnitsRes;
    return [];
  }, [myUnitsRes, fallbackUnitsRes]);

  // Extract unique buildings if the resident has units across multiple buildings
  const buildingsList = useMemo(() => {
    const map = new Map<string, string>();
    units.forEach((u: any) => {
      const bId = u.buildingId || u.parent?.parent?.parent?.id || u.building?.id || 'default';
      const bName = u.buildingName || u.parent?.parent?.parent?.name || u.building?.name || 'Main Building';
      map.set(bId, bName);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [units]);

  // Filtered units if resident clicks a specific building tab
  const filteredUnits = useMemo(() => {
    if (selectedBuildingFilter === 'ALL') return units;
    return units.filter((u: any) => {
      const bId = u.buildingId || u.parent?.parent?.parent?.id || u.building?.id;
      return bId === selectedBuildingFilter;
    });
  }, [units, selectedBuildingFilter]);

  // Auto-select unit if resident has exactly 1 unit
  useEffect(() => {
    if (units.length === 1 && !newVisitor.unitId) {
      setNewVisitor((prev) => ({ ...prev, unitId: units[0].id }));
    }
  }, [units, newVisitor.unitId]);

  // Find currently selected unit for rich preview card
  const selectedUnit = useMemo(() => {
    return units.find((u: any) => u.id === newVisitor.unitId);
  }, [units, newVisitor.unitId]);

  // Group units by Building and Tower for clear hierarchical presentation
  const groupedUnits = useMemo(() => {
    const groups: { [key: string]: any[] } = {};
    filteredUnits.forEach((u: any) => {
      const bName = u.buildingName || u.parent?.parent?.parent?.name || u.building?.name || 'Building';
      const tName = u.towerName || u.parent?.parent?.name || u.tower?.name || 'Tower';
      const key = `${bName} — ${tName}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(u);
    });
    return groups;
  }, [filteredUnits]);

  const columns = [
    {
      header: 'Visitor Name',
      accessorKey: 'visitor.firstName',
      cell: (item: any) => (
        <div>
          <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
            {item.visitor?.firstName || ''} {item.visitor?.lastName || ''}
          </div>
          {item.visitor?.phone && (
            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
              <Phone className="w-3 h-3" />
              {item.visitor.phone}
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Destination Unit',
      accessorKey: 'propertyNode.name',
      cell: (item: any) => {
        const node = item.propertyNode;
        const floor = node?.parent;
        const tower = floor?.parent;
        const building = tower?.parent;

        return (
          <div>
            <div className="font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1">
              <Home className="w-3.5 h-3.5" />
              Unit {node?.name || 'N/A'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {[tower?.name, floor?.name, building?.name].filter(Boolean).join(' • ') || 'Assigned Residence'}
            </div>
          </div>
        );
      },
    },
    {
      header: 'Purpose',
      accessorKey: 'purpose',
      cell: (item: any) => (
        <Badge variant="secondary" className="text-xs uppercase">
          {item.purpose || 'VISITOR'}
        </Badge>
      ),
    },
    {
      header: 'Expected Arrival',
      accessorKey: 'expectedArrival',
      cell: (item: any) => (
        <div className="text-xs text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-gray-400" />
          {new Date(item.expectedArrival).toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (item: any) => {
        const status = item.status || 'PENDING';
        if (status === 'CHECKED_IN') {
          return (
            <Badge variant="success" className="flex items-center gap-1">
              <UserCheck className="w-3 h-3" /> Checked In
            </Badge>
          );
        }
        if (status === 'CHECKED_OUT') {
          return (
            <Badge variant="outline" className="flex items-center gap-1 text-gray-500">
              <LogOut className="w-3 h-3" /> Checked Out
            </Badge>
          );
        }
        return (
          <Badge variant="warning" className="flex items-center gap-1">
            <Clock className="w-3 h-3" /> Expected
          </Badge>
        );
      },
    },
    {
      header: 'Pass',
      accessorKey: 'actions',
      cell: (item: any) => (
        <Button
          size="sm"
          variant="outline"
          className="text-xs flex items-center gap-1"
          onClick={() => {
            setSelectedQrPass(item);
            setSelectedPassId(item.id);
          }}
        >
          <QrCode className="w-3.5 h-3.5" />
          View Pass
        </Button>
      ),
    },
  ];

  const handleCreate = async () => {
    if (!newVisitor.firstName || !newVisitor.expectedArrival || !newVisitor.unitId) {
      dispatch(
        showWarning({
          title: 'Missing Required Fields',
          message: 'Please provide First Name, Destination Unit, and Expected Arrival Date.',
        })
      );
      return;
    }

    try {
      const visitorRes = await createVisitor({
        firstName: newVisitor.firstName,
        lastName: newVisitor.lastName,
        phone: newVisitor.phone,
      }).unwrap();

      const regRes = await createRegistration({
        visitorId: visitorRes.id,
        propertyNodeId: newVisitor.unitId,
        unitId: newVisitor.unitId,
        purpose: newVisitor.purpose,
        expectedArrival: new Date(newVisitor.expectedArrival).toISOString(),
        requiresParking: newVisitor.requiresParking,
        vehiclePlate: newVisitor.requiresParking ? newVisitor.vehiclePlate : undefined,
      }).unwrap();

      setIsModalOpen(false);
      setNewVisitor({
        firstName: '',
        lastName: '',
        phone: '',
        expectedArrival: '',
        purpose: 'VISITOR',
        unitId: units.length === 1 ? units[0].id : '',
        requiresParking: false,
        vehiclePlate: '',
      });
      refetch();

      if (regRes.qrCodeImage) {
        setSelectedQrPass({
          ...regRes.registration,
          qrCodeImage: regRes.qrCodeImage,
          visitor: { firstName: newVisitor.firstName, lastName: newVisitor.lastName },
          propertyNode: selectedUnit,
        });
      }
    } catch (err: any) {
      dispatch(
        showWarning({
          title: 'Registration Failed',
          message: err.data?.message || 'An unexpected error occurred while registering the visitor.',
        })
      );
    }
  };

  return (
    <div>
      <PageHeader
        title="My Visitors"
        description="Pre-register visitors for rapid check-in and automated security gate clearance."
        action={
          <Button
            onClick={() => {
              if (units.length === 1 && !newVisitor.unitId) {
                setNewVisitor((prev) => ({ ...prev, unitId: units[0].id }));
              }
              setIsModalOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Register Visitor
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <DataTable data={visitors} columns={columns} isLoading={isLoading} />
        </CardContent>
      </Card>

      {/* Visitor Pre-Registration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-300 p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Pre-Register Visitor
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Visitor will be granted a secure QR entry pass
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 max-h-[80vh] overflow-y-auto">
              {/* Unit Selection Section */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Destination Unit *
                  </label>
                  {units.length > 1 && (
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      You have {units.length} registered units
                    </span>
                  )}
                </div>

                {/* Building filter tabs if user has units in multiple buildings */}
                {buildingsList.length > 1 && (
                  <div className="flex items-center gap-1.5 mb-2 overflow-x-auto pb-1">
                    <button
                      type="button"
                      onClick={() => setSelectedBuildingFilter('ALL')}
                      className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                        selectedBuildingFilter === 'ALL'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                      }`}
                    >
                      All Buildings ({units.length})
                    </button>
                    {buildingsList.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setSelectedBuildingFilter(b.id)}
                        className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
                          selectedBuildingFilter === b.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                        }`}
                      >
                        🏢 {b.name}
                      </button>
                    ))}
                  </div>
                )}

                {units.length === 0 ? (
                  <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <strong>No units assigned to your resident profile.</strong>
                      <p className="mt-0.5 text-amber-700 dark:text-amber-400">
                        Please contact the management office to assign your apartment/shop before
                        creating visitor passes.
                      </p>
                    </div>
                  </div>
                ) : (
                  <select
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow outline-none"
                    value={newVisitor.unitId}
                    onChange={(e) => setNewVisitor({ ...newVisitor, unitId: e.target.value })}
                  >
                    <option value="">Select your unit...</option>
                    {Object.entries(groupedUnits).map(([groupLabel, groupUnits]) => (
                      <optgroup key={groupLabel} label={`📍 ${groupLabel}`}>
                        {groupUnits.map((u: any) => (
                          <option key={u.id} value={u.id}>
                            Unit {u.unitNumber || u.name} — Floor: {u.floorName || u.parent?.name || 'Level 0'} ({u.occupancyRole || 'Resident'})
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                )}

                {/* Spatial Destination Preview Card */}
                {selectedUnit && (
                  <div className="mt-3 p-3.5 bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/50 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Home className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          Unit {selectedUnit.unitNumber || selectedUnit.name}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 font-medium">
                          {selectedUnit.occupancyRole || 'RESIDENT'}
                        </span>
                      </div>
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Destination Selected
                      </span>
                    </div>

                    <div className="mt-2 text-xs text-gray-600 dark:text-gray-300 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-gray-400" />
                        {selectedUnit.buildingName || selectedUnit.parent?.parent?.parent?.name || 'Building'}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-gray-400" />
                        {selectedUnit.towerName || selectedUnit.parent?.parent?.name || 'Tower'}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        {selectedUnit.floorName || selectedUnit.parent?.name || 'Floor'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Visitor Details */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. John"
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3.5 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    value={newVisitor.firstName}
                    onChange={(e) => setNewVisitor({ ...newVisitor, firstName: e.target.value })}
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Doe"
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3.5 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    value={newVisitor.lastName}
                    onChange={(e) => setNewVisitor({ ...newVisitor, lastName: e.target.value })}
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3.5 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    value={newVisitor.phone}
                    onChange={(e) => setNewVisitor({ ...newVisitor, phone: e.target.value })}
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Purpose of Visit
                  </label>
                  <select
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3.5 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    value={newVisitor.purpose}
                    onChange={(e) => setNewVisitor({ ...newVisitor, purpose: e.target.value })}
                  >
                    <option value="VISITOR">Guest / Friend</option>
                    <option value="DELIVERY">Courier / Food Delivery</option>
                    <option value="CONTRACTOR">Contractor / Service</option>
                  </select>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Expected Arrival *
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3.5 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    value={newVisitor.expectedArrival}
                    onChange={(e) => setNewVisitor({ ...newVisitor, expectedArrival: e.target.value })}
                  />
                </div>

                {/* Parking option */}
                <div className="col-span-2 pt-1 border-t border-gray-100 dark:border-gray-800">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                      checked={newVisitor.requiresParking}
                      onChange={(e) =>
                        setNewVisitor({ ...newVisitor, requiresParking: e.target.checked })
                      }
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                      Visitor arriving by vehicle (requires parking pass)
                    </span>
                  </label>

                  {newVisitor.requiresParking && (
                    <div className="mt-2 pl-6">
                      <input
                        type="text"
                        placeholder="License Plate No. (e.g. KL-04-AB-1234)"
                        className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3.5 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm uppercase"
                        value={newVisitor.vehiclePlate}
                        onChange={(e) =>
                          setNewVisitor({ ...newVisitor, vehiclePlate: e.target.value })
                        }
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                  onClick={handleCreate}
                  disabled={
                    isCreatingVisitor ||
                    isCreatingReg ||
                    !newVisitor.firstName ||
                    !newVisitor.expectedArrival ||
                    !newVisitor.unitId
                  }
                >
                  {isCreatingReg || isCreatingVisitor ? 'Registering...' : 'Generate Entry Pass'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Pass Details Modal */}
      {selectedQrPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-300 p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden p-6 text-center animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" /> Official Entry Pass
              </span>
              <button
                onClick={() => {
                  setSelectedQrPass(null);
                  setSelectedPassId(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
              >
                <X size={18} />
              </button>
            </div>

            {/* QR Code Container */}
            <div className="my-3 flex justify-center">
              <div className="p-3 bg-white rounded-2xl border border-gray-200 dark:border-gray-700 shadow-md inline-block">
                <QrCodeDisplay
                  value={
                    selectedQrPass.qrData ||
                    (typeof window !== 'undefined' ? btoa(selectedQrPass.id) : selectedQrPass.id)
                  }
                  initialImage={selectedQrPass.qrCodeImage}
                  size={192}
                  alt={`Pass ${selectedQrPass.id?.slice(0, 8)}`}
                />
                <div className="font-mono text-[11px] text-gray-500 mt-2 tracking-wider">
                  PASS #{selectedQrPass.id?.slice(0, 8).toUpperCase()}
                </div>
              </div>
            </div>

            <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-2">
              {selectedQrPass.visitor?.firstName || 'Visitor'}{' '}
              {selectedQrPass.visitor?.lastName || ''}
            </h3>

            {selectedQrPass.visitor?.phone && (
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1 mt-0.5">
                <Phone className="w-3 h-3" />
                {selectedQrPass.visitor.phone}
              </p>
            )}

            <div className="mt-3 p-2.5 bg-gray-50 dark:bg-gray-800/60 rounded-xl text-xs space-y-1 text-left">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Destination:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  Unit {selectedQrPass.propertyNode?.name || selectedUnit?.name || 'Assigned Unit'}
                </span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Purpose:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {selectedQrPass.purpose || 'VISITOR'}
                </span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Expected Arrival:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {new Date(selectedQrPass.expectedArrival).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              {selectedQrPass.vehiclePlate && (
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Vehicle Plate:</span>
                  <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                    {selectedQrPass.vehiclePlate}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-5 flex gap-2">
              <Button
                variant="outline"
                className="w-1/2 text-xs"
                onClick={() => downloadVisitorPass(selectedQrPass)}
              >
                Download
              </Button>
              <Button
                variant="primary"
                className="w-1/2 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => {
                  setSelectedQrPass(null);
                  setSelectedPassId(null);
                }}
              >
                Close Pass
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
