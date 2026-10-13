'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  UserCheck, 
  Users, 
  QrCode, 
  Car, 
  Clock, 
  Building, 
  CheckCircle2, 
  LogOut, 
  LogIn, 
  Search, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Eye, 
  Download, 
  AlertCircle, 
  Truck, 
  Briefcase,
  Phone,
  Mail,
  Calendar,
  Filter,
  Check,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { RequireModule } from '@/components/auth/RequireModule';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useDispatch } from 'react-redux';
import { showWarning } from '@/store/slices/uiSlice';
import { 
  useGetVisitorRegistrationsQuery, 
  useGetVisitorsQuery,
  useCreateVisitorMutation, 
  useCreateRegistrationMutation, 
  useVerifyQrMutation,
  useCheckInVisitorMutation,
  useCheckOutVisitorMutation,
} from '@/services/visitorsApi';
import { useGetUnitsQuery } from '@/services/organizationApi';
import { QrCodeDisplay } from '@/components/ui/QrCodeDisplay';
import { downloadVisitorPass } from '@/utils/downloadPass';

type TabType = 'gatehouse' | 'scheduled' | 'directory';
type StatusFilter = 'ALL' | 'ON_PREMISES' | 'EXPECTED' | 'DEPARTED';

export default function OrganizationVisitorsPage() {
  return (
    <RequireModule moduleCode="VISITOR_MANAGEMENT">
      <VisitorsHubContent />
    </RequireModule>
  );
}

function VisitorsHubContent() {
  const dispatch = useDispatch();
  const confirm = useConfirm();

  const [activeTab, setActiveTab] = useState<TabType>('gatehouse');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [purposeFilter, setPurposeFilter] = useState<string>('ALL');

  // Modals state
  const [isVerifyQrOpen, setIsVerifyQrOpen] = useState(false);
  const [isIssuePassOpen, setIsIssuePassOpen] = useState(false);
  const [isAddVisitorOpen, setIsAddVisitorOpen] = useState(false);
  const [viewPassQrModal, setViewPassQrModal] = useState<any | null>(null);

  // Form states
  const [qrInput, setQrInput] = useState('');
  const [qrVerificationResult, setQrVerificationResult] = useState<any | null>(null);
  const [generatedPassResult, setGeneratedPassResult] = useState<any | null>(null);

  const [passForm, setPassForm] = useState({
    existingVisitorId: '',
    // Inline new visitor details
    isNewVisitor: false,
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    idNumber: '',
    // Pass details
    unitId: '',
    purpose: 'VISITOR',
    expectedArrival: new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16), // 1 hr from now
    requiresParking: false,
    vehiclePlate: '',
  });

  const [directoryForm, setDirectoryForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    idNumber: '',
  });

  // Queries
  const { data: registrationsData, isLoading: isLoadingRegistrations, refetch: refetchRegistrations } = useGetVisitorRegistrationsQuery({});
  const { data: visitorsData, isLoading: isLoadingVisitors, refetch: refetchVisitors } = useGetVisitorsQuery({});
  const { data: unitsData } = useGetUnitsQuery({});

  // Mutations
  const [createVisitor, { isLoading: isCreatingVisitor }] = useCreateVisitorMutation();
  const [createRegistration, { isLoading: isCreatingPass }] = useCreateRegistrationMutation();
  const [verifyQr, { isLoading: isVerifyingQr }] = useVerifyQrMutation();
  const [checkInVisitor, { isLoading: isCheckingIn }] = useCheckInVisitorMutation();
  const [checkOutVisitor, { isLoading: isCheckingOut }] = useCheckOutVisitorMutation();

  // Normalize datasets
  const registrations: any[] = useMemo(() => {
    if (!registrationsData) return [];
    return Array.isArray(registrationsData) ? registrationsData : (registrationsData.data || []);
  }, [registrationsData]);

  const visitors: any[] = useMemo(() => {
    if (!visitorsData) return [];
    return Array.isArray(visitorsData) ? visitorsData : (visitorsData.data || []);
  }, [visitorsData]);

  const units: any[] = useMemo(() => {
    if (!unitsData) return [];
    return Array.isArray(unitsData) ? unitsData : (unitsData.data || []);
  }, [unitsData]);

  // Unit lookup dictionary
  const unitMap = useMemo(() => {
    const map = new Map<string, any>();
    units.forEach((u) => map.set(u.id, u));
    return map;
  }, [units]);

  // Total visits count per visitor
  const visitorVisitCountMap = useMemo(() => {
    const map = new Map<string, number>();
    registrations.forEach((r) => {
      if (r.visitorId) {
        map.set(r.visitorId, (map.get(r.visitorId) || 0) + 1);
      }
    });
    return map;
  }, [registrations]);

  // KPI Metrics Calculation
  const onPremisesRegistrations = useMemo(() => {
    return registrations.filter((r) => {
      return r.logs && r.logs.some((log: any) => log.checkInTime && !log.checkOutTime);
    });
  }, [registrations]);

  const expectedTodayCount = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return registrations.filter((r) => {
      const arrival = r.expectedArrival ? r.expectedArrival.split('T')[0] : '';
      const hasCheckedIn = r.logs && r.logs.some((log: any) => log.checkInTime);
      return arrival === today && !hasCheckedIn;
    }).length;
  }, [registrations]);

  const contractorsCount = useMemo(() => {
    return registrations.filter((r) => r.purpose === 'CONTRACTOR' || r.purpose === 'DELIVERY').length;
  }, [registrations]);

  // Filtered Gatehouse Registrations
  const filteredRegistrations = useMemo(() => {
    return registrations.filter((item) => {
      // Check on-premises status
      const activeLog = item.logs?.find((l: any) => l.checkInTime && !l.checkOutTime);
      const isDeparted = item.logs?.length > 0 && item.logs.every((l: any) => l.checkOutTime);
      const isExpected = !item.logs || item.logs.length === 0;

      if (statusFilter === 'ON_PREMISES' && !activeLog) return false;
      if (statusFilter === 'EXPECTED' && !isExpected) return false;
      if (statusFilter === 'DEPARTED' && !isDeparted) return false;

      // Purpose filter
      if (purposeFilter !== 'ALL' && item.purpose !== purposeFilter) return false;

      // Search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const visitorName = `${item.visitor?.firstName || ''} ${item.visitor?.lastName || ''}`.toLowerCase();
        const visitorPhone = (item.visitor?.phone || '').toLowerCase();
        const plate = (item.vehiclePlate || '').toLowerCase();
        const unit = item.propertyNode || unitMap.get(item.propertyNodeId);
        const unitName = (unit?.name || unit?.unitNumber || '').toLowerCase();
        const combined = `${visitorName} ${visitorPhone} ${plate} ${unitName} ${item.purpose || ''}`.toLowerCase();
        if (!combined.includes(term)) return false;
      }

      return true;
    });
  }, [registrations, statusFilter, purposeFilter, searchTerm, unitMap]);

  // Filtered Visitors Directory
  const filteredVisitors = useMemo(() => {
    return visitors.filter((item) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      const combined = `${item.firstName} ${item.lastName || ''} ${item.phone || ''} ${item.email || ''} ${item.idNumber || ''}`.toLowerCase();
      return combined.includes(term);
    });
  }, [visitors, searchTerm]);

  // Action: Check-In Visitor
  const handleCheckIn = async (registrationId: string, visitorName: string) => {
    const isConfirmed = await confirm({
      title: 'Approve & Log Visitor Entry',
      message: `Confirm physical gate entry and issue on-premises clearance for ${visitorName}?`,
      confirmText: 'Check In Visitor',
      cancelText: 'Cancel',
      destructive: false,
    });
    if (!isConfirmed) return;

    try {
      await checkInVisitor({ id: registrationId, notes: 'Authorized entry at Security Gatehouse' }).unwrap();
      dispatch(showWarning({ title: 'Entry Logged', message: `${visitorName} is now checked in on premises.` }));
      refetchRegistrations();
    } catch (err: any) {
      dispatch(showWarning({ title: 'Check-In Failed', message: err.data?.message || 'Could not log entry.' }));
    }
  };

  // Action: Check-Out Visitor
  const handleCheckOut = async (logId: string, visitorName: string) => {
    const isConfirmed = await confirm({
      title: 'Record Visitor Exit',
      message: `Confirm departure for ${visitorName}? Their active on-premises pass will be closed.`,
      confirmText: 'Log Exit & Check Out',
      cancelText: 'Cancel',
      destructive: false,
    });
    if (!isConfirmed) return;

    try {
      await checkOutVisitor({ logId, notes: 'Departure logged at Security Gatehouse' }).unwrap();
      dispatch(showWarning({ title: 'Departure Logged', message: `${visitorName} has departed premises.` }));
      refetchRegistrations();
    } catch (err: any) {
      dispatch(showWarning({ title: 'Check-Out Failed', message: err.data?.message || 'Could not log departure.' }));
    }
  };

  // Action: Verify QR Pass
  const handleVerifyQr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrInput.trim()) return;

    try {
      // QR input may be raw registration ID or base64 token
      const qrData = qrInput.includes('=') ? qrInput.trim() : Buffer.from(qrInput.trim()).toString('base64');
      const result = await verifyQr({ qrData }).unwrap();
      setQrVerificationResult(result);
    } catch (err: any) {
      setQrVerificationResult({ valid: false, error: err.data?.message || 'Invalid or expired QR token.' });
    }
  };

  // Action: Check-In from QR Verification Modal
  const handleCheckInFromVerifiedQr = async () => {
    if (!qrVerificationResult?.registration?.id) return;
    try {
      const regId = qrVerificationResult.registration.id;
      const visitorName = `${qrVerificationResult.registration.visitor?.firstName} ${qrVerificationResult.registration.visitor?.lastName}`;
      await checkInVisitor({ id: regId, notes: 'Scanned digital QR at gate' }).unwrap();
      dispatch(showWarning({ title: 'Verified & Logged', message: `${visitorName} successfully checked in via QR pass.` }));
      setIsVerifyQrOpen(false);
      setQrInput('');
      setQrVerificationResult(null);
      refetchRegistrations();
    } catch (err: any) {
      dispatch(showWarning({ title: 'Check-In Failed', message: err.data?.message || 'Could not check in.' }));
    }
  };

  // Action: Issue Visitor Pass
  const handleIssuePass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passForm.unitId) {
      dispatch(showWarning({ title: 'Missing Unit', message: 'Please select destination unit / property.' }));
      return;
    }

    try {
      let visitorId = passForm.existingVisitorId;

      // If new visitor, create visitor profile first
      if (passForm.isNewVisitor || !visitorId) {
        if (!passForm.firstName.trim()) {
          dispatch(showWarning({ title: 'Missing Info', message: 'First name is required.' }));
          return;
        }
        const createdVisitor = await createVisitor({
          firstName: passForm.firstName.trim(),
          lastName: passForm.lastName.trim() || undefined,
          phone: passForm.phone.trim() || undefined,
          email: passForm.email.trim() || undefined,
          idNumber: passForm.idNumber.trim() || undefined,
        }).unwrap();
        visitorId = createdVisitor.id;
      }

      const passPayload: any = {
        visitorId,
        propertyNodeId: passForm.unitId,
        unitId: passForm.unitId,
        purpose: passForm.purpose,
        expectedArrival: new Date(passForm.expectedArrival).toISOString(),
        requiresParking: passForm.requiresParking,
        vehiclePlate: passForm.vehiclePlate.trim() ? passForm.vehiclePlate.trim().toUpperCase() : undefined,
      };

      const result = await createRegistration(passPayload).unwrap();
      setGeneratedPassResult(result);
      refetchRegistrations();
      refetchVisitors();
    } catch (err: any) {
      dispatch(showWarning({ title: 'Pass Creation Failed', message: err.data?.message || 'Failed to issue visitor pass.' }));
    }
  };

  // Action: Add Visitor to Directory
  const handleAddDirectoryVisitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directoryForm.firstName.trim()) {
      dispatch(showWarning({ title: 'Missing Name', message: 'First name is required.' }));
      return;
    }

    try {
      await createVisitor({
        firstName: directoryForm.firstName.trim(),
        lastName: directoryForm.lastName.trim() || undefined,
        phone: directoryForm.phone.trim() || undefined,
        email: directoryForm.email.trim() || undefined,
        idNumber: directoryForm.idNumber.trim() || undefined,
      }).unwrap();

      dispatch(showWarning({ title: 'Profile Added', message: 'Visitor added to master directory.' }));
      setIsAddVisitorOpen(false);
      setDirectoryForm({ firstName: '', lastName: '', phone: '', email: '', idNumber: '' });
      refetchVisitors();
    } catch (err: any) {
      dispatch(showWarning({ title: 'Failed', message: err.data?.message || 'Could not add visitor.' }));
    }
  };

  // Helper Purpose Badge
  const renderPurposeBadge = (purpose: string) => {
    switch (purpose) {
      case 'CONTRACTOR':
        return (
          <Badge variant="warning" className="text-[10px] flex items-center gap-1 font-semibold">
            <Briefcase className="h-3 w-3" /> Contractor
          </Badge>
        );
      case 'DELIVERY':
        return (
          <Badge variant="primary" className="text-[10px] flex items-center gap-1 font-semibold bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300">
            <Truck className="h-3 w-3" /> Delivery
          </Badge>
        );
      case 'VISITOR':
      default:
        return (
          <Badge variant="secondary" className="text-[10px] flex items-center gap-1 font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
            <Users className="h-3 w-3" /> Guest
          </Badge>
        );
    }
  };

  // Table Columns: Gatehouse Log
  const gatehouseColumns: Column<any>[] = [
    {
      header: 'Visitor Profile',
      accessorKey: 'visitor',
      cell: (row) => {
        const v = row.visitor;
        return (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-blue-500/20">
              {v?.firstName?.[0] || 'V'}{v?.lastName?.[0] || ''}
            </div>
            <div>
              <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                {v ? `${v.firstName} ${v.lastName || ''}` : 'Unregistered Guest'}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                <Phone className="h-3 w-3" /> {v?.phone || 'No phone'}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Destination Unit',
      accessorKey: 'propertyNodeId',
      cell: (row) => {
        const unit = row.propertyNode || unitMap.get(row.propertyNodeId);
        return (
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <Building className="h-4 w-4" />
            </div>
            <div>
              <div className="font-medium text-slate-900 dark:text-white text-sm">
                {unit?.name || unit?.unitNumber || 'Unit #' + row.propertyNodeId.slice(0, 6)}
              </div>
              <div className="text-[11px] text-slate-400">
                {unit?.parent?.name || 'Property Unit'}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Visit Purpose',
      accessorKey: 'purpose',
      cell: (row) => renderPurposeBadge(row.purpose),
    },
    {
      header: 'Vehicle & Parking',
      accessorKey: 'vehiclePlate',
      cell: (row) => {
        if (row.vehiclePlate) {
          return (
            <div className="flex items-center gap-1.5">
              <Car className="h-3.5 w-3.5 text-slate-400" />
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                {row.vehiclePlate}
              </span>
            </div>
          );
        }
        return <span className="text-xs text-slate-400">Pedestrian</span>;
      },
    },
    {
      header: 'Gatehouse Status',
      accessorKey: 'status',
      cell: (row) => {
        const activeLog = row.logs?.find((l: any) => l.checkInTime && !l.checkOutTime);
        const lastLog = row.logs && row.logs.length > 0 ? row.logs[row.logs.length - 1] : null;

        if (activeLog) {
          const entryTime = new Date(activeLog.checkInTime);
          const elapsedMins = Math.floor((Date.now() - entryTime.getTime()) / (1000 * 60));
          const elapsedHours = Math.floor(elapsedMins / 60);
          const elapsedText = elapsedHours > 0 ? `${elapsedHours}h ${elapsedMins % 60}m` : `${elapsedMins}m`;

          return (
            <div>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <Badge variant="success" className="text-[10px] py-0 px-2 font-bold">
                  On-Premises
                </Badge>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                <Clock className="h-3 w-3" /> In: {entryTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({elapsedText})
              </div>
            </div>
          );
        }

        if (lastLog && lastLog.checkOutTime) {
          return (
            <div>
              <Badge variant="outline" className="text-[10px] text-slate-500">
                Departed
              </Badge>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <LogOut className="h-3 w-3" /> Left: {new Date(lastLog.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          );
        }

        return (
          <div>
            <Badge variant="warning" className="text-[10px] py-0 px-2">
              Expected
            </Badge>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <Calendar className="h-3 w-3" /> {new Date(row.expectedArrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        );
      },
    },
    {
      header: 'Gate Actions',
      accessorKey: 'id',
      cell: (row) => {
        const activeLog = row.logs?.find((l: any) => l.checkInTime && !l.checkOutTime);
        const visitorName = `${row.visitor?.firstName || 'Guest'} ${row.visitor?.lastName || ''}`;

        return (
          <div className="flex items-center gap-2">
            {activeLog ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCheckOut(activeLog.id, visitorName)}
                disabled={isCheckingOut}
                className="text-xs h-8 border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
              >
                <LogOut className="h-3.5 w-3.5 mr-1" />
                Check Out
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCheckIn(row.id, visitorName)}
                disabled={isCheckingIn}
                className="text-xs h-8 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30 hover:bg-emerald-100"
              >
                <LogIn className="h-3.5 w-3.5 mr-1" />
                Check In
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewPassQrModal(row)}
              title="View Digital QR Pass"
              className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600"
            >
              <QrCode className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  // Table Columns: Scheduled Passes
  const scheduledColumns: Column<any>[] = [
    {
      header: 'Pass ID',
      accessorKey: 'id',
      cell: (row) => (
        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          #{row.id.slice(0, 8).toUpperCase()}
        </span>
      ),
    },
    {
      header: 'Guest',
      accessorKey: 'visitor',
      cell: (row) => (
        <div>
          <div className="font-semibold text-slate-900 dark:text-white">
            {row.visitor?.firstName} {row.visitor?.lastName || ''}
          </div>
          <div className="text-xs text-slate-500">{row.visitor?.phone || row.visitor?.email}</div>
        </div>
      ),
    },
    {
      header: 'Destination',
      accessorKey: 'propertyNodeId',
      cell: (row) => {
        const unit = row.propertyNode || unitMap.get(row.propertyNodeId);
        return <span className="font-medium text-sm">{unit?.name || unit?.unitNumber || 'Unit'}</span>;
      },
    },
    {
      header: 'Purpose',
      accessorKey: 'purpose',
      cell: (row) => renderPurposeBadge(row.purpose),
    },
    {
      header: 'Expected Arrival',
      accessorKey: 'expectedArrival',
      cell: (row) => (
        <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          {new Date(row.expectedArrival).toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      ),
    },
    {
      header: 'Action',
      accessorKey: 'id',
      cell: (row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setViewPassQrModal(row)}
          className="text-xs h-7"
        >
          <QrCode className="h-3 w-3 mr-1 text-blue-600" />
          Digital Pass
        </Button>
      ),
    },
  ];

  // Table Columns: Visitor Directory
  const directoryColumns: Column<any>[] = [
    {
      header: 'Visitor Profile',
      accessorKey: 'firstName',
      cell: (v) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-md">
            {v.firstName?.[0] || 'V'}{v.lastName?.[0] || ''}
          </div>
          <div>
            <div className="font-semibold text-slate-900 dark:text-white">
              {v.firstName} {v.lastName || ''}
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <Mail className="h-3 w-3" /> {v.email || 'No email registered'}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Contact Phone',
      accessorKey: 'phone',
      cell: (v) => (
        <div className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Phone className="h-3.5 w-3.5 text-slate-400" />
          {v.phone || 'N/A'}
        </div>
      ),
    },
    {
      header: 'Govt / ID Card',
      accessorKey: 'idNumber',
      cell: (v) => (
        <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          {v.idNumber || 'Not verified'}
        </span>
      ),
    },
    {
      header: 'Lifetime Visits',
      accessorKey: 'visits',
      cell: (v) => {
        const count = visitorVisitCountMap.get(v.id) || 0;
        return (
          <Badge variant="outline" className="text-xs">
            {count} {count === 1 ? 'Visit' : 'Visits'}
          </Badge>
        );
      },
    },
    {
      header: 'Actions',
      accessorKey: 'id',
      cell: (v) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setPassForm((prev) => ({
              ...prev,
              existingVisitorId: v.id,
              isNewVisitor: false,
              firstName: v.firstName,
              lastName: v.lastName || '',
              phone: v.phone || '',
              email: v.email || '',
            }));
            setIsIssuePassOpen(true);
          }}
          className="text-xs h-7 border-blue-200 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
        >
          <Plus className="h-3 w-3 mr-1" />
          Issue Pass
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title="SmartiVisit Gatehouse & Visitor Hub"
        description="Comprehensive facility access control, live on-premises monitoring, digital QR pass scanning, and visitor management."
        action={
          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                setGeneratedPassResult(null);
                setPassForm({
                  existingVisitorId: '',
                  isNewVisitor: true,
                  firstName: '',
                  lastName: '',
                  phone: '',
                  email: '',
                  idNumber: '',
                  unitId: '',
                  purpose: 'VISITOR',
                  expectedArrival: new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16),
                  requiresParking: false,
                  vehiclePlate: '',
                });
                setIsIssuePassOpen(true);
              }}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Pre-Register Visitor
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setQrInput('');
                setQrVerificationResult(null);
                setIsVerifyQrOpen(true);
              }}
              className="border-slate-300 dark:border-slate-700"
            >
              <QrCode className="h-4 w-4 mr-1.5 text-indigo-600" />
              Verify QR Pass
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAddVisitorOpen(true)}
              className="hidden sm:inline-flex text-xs"
            >
              + Add to Directory
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* On-Premises Right Now */}
        <Card className="border-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-lg ring-1 ring-slate-900/5 dark:ring-white/10 relative overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Inside Premises Now
                </p>
                <h3 className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                  {onPremisesRegistrations.length}
                </h3>
                <p className="text-xs text-slate-400 mt-1">Active on-site guests</p>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25">
                <ShieldCheck className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expected Today */}
        <Card className="border-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-lg ring-1 ring-slate-900/5 dark:ring-white/10 relative overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Expected Today
                </p>
                <h3 className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
                  {expectedTodayCount}
                </h3>
                <p className="text-xs text-slate-400 mt-1">Pre-authorized arrivals</p>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/25">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Visits Processed */}
        <Card className="border-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-lg ring-1 ring-slate-900/5 dark:ring-white/10 relative overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Total Visits
                </p>
                <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {registrations.length}
                </h3>
                <p className="text-xs text-slate-400 mt-1">Security gate clearances</p>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/25">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Commercial Deliveries & Contractors */}
        <Card className="border-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-lg ring-1 ring-slate-900/5 dark:ring-white/10 relative overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  Services & Deliveries
                </p>
                <h3 className="text-3xl font-extrabold text-purple-600 dark:text-purple-400 mt-1">
                  {contractorsCount}
                </h3>
                <p className="text-xs text-slate-400 mt-1">Couriers & contractors</p>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-md shadow-purple-500/25">
                <Truck className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Control Bar: Tabs + Search & Gate Filters */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-white/10 p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
          {/* Main Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('gatehouse')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeTab === 'gatehouse'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              Gatehouse Log
              <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'gatehouse' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}>
                {registrations.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('scheduled')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeTab === 'scheduled'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Calendar className="h-4 w-4" />
              Scheduled Passes
            </button>

            <button
              onClick={() => setActiveTab('directory')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeTab === 'directory'
                  ? 'bg-slate-800 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Users className="h-4 w-4" />
              Visitor Directory
              <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'directory' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}>
                {visitors.length}
              </span>
            </button>
          </div>

          <div className="text-xs text-slate-400">
            {activeTab === 'gatehouse' ? `${filteredRegistrations.length} entries matching filters` : `${filteredVisitors.length} visitors registered`}
          </div>
        </div>

        {/* Filter Inputs */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={activeTab === 'directory' ? 'Search visitor, phone, ID...' : 'Search guest, phone, unit, plate...'}
                className="pl-9 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              />
            </div>

            {/* Purpose Filter */}
            {activeTab !== 'directory' && (
              <select
                value={purposeFilter}
                onChange={(e) => setPurposeFilter(e.target.value)}
                className="w-full sm:w-44 px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Purposes</option>
                <option value="VISITOR">Guest Visits</option>
                <option value="CONTRACTOR">Contractors</option>
                <option value="DELIVERY">Deliveries</option>
              </select>
            )}
          </div>

          {/* Status Pills (for gatehouse log) */}
          {activeTab === 'gatehouse' && (
            <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === 'ALL'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('ON_PREMISES')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === 'ON_PREMISES'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100'
                }`}
              >
                Inside Premises ({onPremisesRegistrations.length})
              </button>
              <button
                onClick={() => setStatusFilter('EXPECTED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === 'EXPECTED'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 hover:bg-amber-100'
                }`}
              >
                Expected
              </button>
              <button
                onClick={() => setStatusFilter('DEPARTED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === 'DEPARTED'
                    ? 'bg-slate-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                Departed
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'gatehouse' && (
        <DataTable
          columns={gatehouseColumns}
          data={filteredRegistrations}
          isLoading={isLoadingRegistrations}
          emptyMessage="No gatehouse records match the current filters. Click 'Pre-Register Visitor' to issue access."
        />
      )}

      {activeTab === 'scheduled' && (
        <DataTable
          columns={scheduledColumns}
          data={filteredRegistrations}
          isLoading={isLoadingRegistrations}
          emptyMessage="No scheduled passes found."
        />
      )}

      {activeTab === 'directory' && (
        <DataTable
          columns={directoryColumns}
          data={filteredVisitors}
          isLoading={isLoadingVisitors}
          emptyMessage="No visitors registered in directory. Add a visitor to speed up future gate registrations."
        />
      )}

      {/* Modal 1: Verify QR Pass */}
      <Modal
        isOpen={isVerifyQrOpen}
        onClose={() => {
          setIsVerifyQrOpen(false);
          setQrInput('');
          setQrVerificationResult(null);
        }}
        title="Verify Digital QR Visitor Pass"
      >
        <div className="space-y-4">
          <form onSubmit={handleVerifyQr} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Scan or Paste QR Pass Code *
              </label>
              <div className="flex gap-2">
                <Input
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  placeholder="Paste pass code or scan QR data..."
                  className="font-mono text-sm"
                  required
                />
                <Button type="submit" disabled={isVerifyingQr || !qrInput.trim()} className="bg-indigo-600 text-white">
                  {isVerifyingQr ? 'Verifying...' : 'Verify'}
                </Button>
              </div>
            </div>
          </form>

          {qrVerificationResult && (
            <div className={`p-4 rounded-xl border ${
              qrVerificationResult.valid 
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50' 
                : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50'
            }`}>
              {qrVerificationResult.valid ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    Authorized Pass Verified
                  </div>
                  <div className="text-sm space-y-1 text-slate-800 dark:text-slate-200">
                    <div>
                      <span className="text-xs text-slate-500">Guest Name:</span>{' '}
                      <strong>{qrVerificationResult.registration.visitor?.firstName} {qrVerificationResult.registration.visitor?.lastName || ''}</strong>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500">Destination:</span>{' '}
                      <strong>{qrVerificationResult.registration.propertyNode?.name || qrVerificationResult.registration.propertyNode?.unitNumber}</strong>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500">Purpose:</span>{' '}
                      {renderPurposeBadge(qrVerificationResult.registration.purpose)}
                    </div>
                    <div>
                      <span className="text-xs text-slate-500">Scheduled Arrival:</span>{' '}
                      {new Date(qrVerificationResult.registration.expectedArrival).toLocaleString()}
                    </div>
                  </div>

                  <Button
                    onClick={handleCheckInFromVerifiedQr}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white mt-2"
                  >
                    <LogIn className="h-4 w-4 mr-1.5" />
                    Confirm & Check In Now
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300">
                  <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0" />
                  <div>
                    <div className="font-bold">Pass Verification Failed</div>
                    <div className="text-xs mt-0.5">{qrVerificationResult.error || 'Invalid or unregistered pass token.'}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* Modal 2: Issue Visitor Pass */}
      <Modal
        isOpen={isIssuePassOpen}
        onClose={() => {
          setIsIssuePassOpen(false);
          setGeneratedPassResult(null);
        }}
        title="Issue Gatehouse Visitor Pass"
      >
        {generatedPassResult ? (
          <div className="text-center space-y-4 py-2">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Visitor Pass Generated!</h3>
              <p className="text-xs text-slate-500">Digital security authorization pass is now active.</p>
            </div>

            {generatedPassResult.qrCodeImage && (
              <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-xs mx-auto shadow-sm">
                <img 
                  src={generatedPassResult.qrCodeImage} 
                  alt="Visitor QR Pass" 
                  className="w-48 h-48 mx-auto rounded-lg"
                />
                <div className="font-mono text-xs text-slate-500 mt-2 truncate">
                  Pass: #{generatedPassResult.registration?.id?.slice(0, 8).toUpperCase()}
                </div>
              </div>
            )}

            <div className="flex justify-center gap-2 pt-2">
              <Button onClick={() => setIsIssuePassOpen(false)} className="bg-blue-600 text-white">
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleIssuePass} className="space-y-4">
            {/* Visitor Mode Selector */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setPassForm({ ...passForm, isNewVisitor: false })}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  !passForm.isNewVisitor ? 'bg-white dark:bg-slate-700 shadow text-blue-600' : 'text-slate-600'
                }`}
              >
                Select from Directory
              </button>
              <button
                type="button"
                onClick={() => setPassForm({ ...passForm, isNewVisitor: true, existingVisitorId: '' })}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  passForm.isNewVisitor ? 'bg-white dark:bg-slate-700 shadow text-blue-600' : 'text-slate-600'
                }`}
              >
                + New Visitor
              </button>
            </div>

            {!passForm.isNewVisitor ? (
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Select Existing Visitor *
                </label>
                <select
                  value={passForm.existingVisitorId}
                  onChange={(e) => setPassForm({ ...passForm, existingVisitorId: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                >
                  <option value="">-- Choose Registered Visitor --</option>
                  {visitors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.firstName} {v.lastName || ''} ({v.phone || v.email || 'No contact'})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      First Name *
                    </label>
                    <Input
                      value={passForm.firstName}
                      onChange={(e) => setPassForm({ ...passForm, firstName: e.target.value })}
                      placeholder="e.g. Alex"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Last Name
                    </label>
                    <Input
                      value={passForm.lastName}
                      onChange={(e) => setPassForm({ ...passForm, lastName: e.target.value })}
                      placeholder="e.g. Rivera"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Phone Number
                    </label>
                    <Input
                      value={passForm.phone}
                      onChange={(e) => setPassForm({ ...passForm, phone: e.target.value })}
                      placeholder="+1 (555) 234-5678"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Email
                    </label>
                    <Input
                      type="email"
                      value={passForm.email}
                      onChange={(e) => setPassForm({ ...passForm, email: e.target.value })}
                      placeholder="guest@mail.com"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Destination Unit */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Destination Unit / Property Node *
              </label>
              <select
                value={passForm.unitId}
                onChange={(e) => setPassForm({ ...passForm, unitId: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                required
              >
                <option value="">-- Choose Target Unit --</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name || u.unitNumber || 'Unit'} {u.parent?.name ? `(${u.parent.name})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Purpose of Visit
                </label>
                <select
                  value={passForm.purpose}
                  onChange={(e) => setPassForm({ ...passForm, purpose: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="VISITOR">Guest / Personal Visit</option>
                  <option value="CONTRACTOR">Contractor / Repair Service</option>
                  <option value="DELIVERY">Package / Courier Delivery</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Expected Arrival *
                </label>
                <Input
                  type="datetime-local"
                  value={passForm.expectedArrival}
                  onChange={(e) => setPassForm({ ...passForm, expectedArrival: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Parking & Vehicle */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Requires Visitor Parking</span>
                <input
                  type="checkbox"
                  checked={passForm.requiresParking}
                  onChange={(e) => setPassForm({ ...passForm, requiresParking: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
              </div>

              {passForm.requiresParking && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Vehicle License Plate
                  </label>
                  <Input
                    value={passForm.vehiclePlate}
                    onChange={(e) => setPassForm({ ...passForm, vehiclePlate: e.target.value.toUpperCase() })}
                    placeholder="e.g. 8ABC123"
                    className="font-mono uppercase font-bold text-xs"
                  />
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsIssuePassOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreatingPass || isCreatingVisitor} className="bg-blue-600 text-white">
                {isCreatingPass ? 'Generating Pass...' : 'Issue Access Pass'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal 3: View Pass QR Modal */}
      <Modal
        isOpen={!!viewPassQrModal}
        onClose={() => setViewPassQrModal(null)}
        title="Visitor Gate Pass & Clearance"
      >
        {viewPassQrModal && (
          <div className="text-center space-y-4 py-2">
            {/* QR Code Container */}
            <div className="flex justify-center">
              <div className="p-3 bg-white rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md inline-block">
                <QrCodeDisplay
                  value={
                    viewPassQrModal.qrData ||
                    (typeof window !== 'undefined' ? btoa(viewPassQrModal.id) : viewPassQrModal.id)
                  }
                  initialImage={viewPassQrModal.qrCodeImage}
                  size={180}
                  alt={`Pass ${viewPassQrModal.id?.slice(0, 8)}`}
                />
                <div className="font-mono text-[11px] text-slate-500 mt-2 tracking-wider">
                  PASS #{viewPassQrModal.id.slice(0, 8).toUpperCase()}
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-sm mx-auto">
              <h4 className="font-bold text-slate-900 dark:text-white text-base">
                {viewPassQrModal.visitor?.firstName} {viewPassQrModal.visitor?.lastName || ''}
              </h4>
              {viewPassQrModal.visitor?.phone && (
                <p className="text-xs text-slate-500 mt-0.5 flex items-center justify-center gap-1">
                  <Phone className="w-3 h-3" /> {viewPassQrModal.visitor.phone}
                </p>
              )}
              <div className="mt-2 flex justify-center">
                {renderPurposeBadge(viewPassQrModal.purpose)}
              </div>
            </div>

            <div className="text-left text-xs space-y-1.5 p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 max-w-sm mx-auto">
              <div className="flex justify-between">
                <span className="text-slate-400">Target Unit:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  Unit {viewPassQrModal.propertyNode?.name || viewPassQrModal.propertyNode?.unitNumber || 'Assigned Unit'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Scheduled Arrival:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {new Date(viewPassQrModal.expectedArrival).toLocaleString()}
                </span>
              </div>
              {viewPassQrModal.vehiclePlate && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Authorized Vehicle:</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                    {viewPassQrModal.vehiclePlate}
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => downloadVisitorPass(viewPassQrModal)}
                className="text-xs flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Download Pass
              </Button>
              <Button onClick={() => setViewPassQrModal(null)} className="bg-slate-900 hover:bg-slate-800 text-white text-xs">
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal 4: Add Visitor to Directory */}
      <Modal
        isOpen={isAddVisitorOpen}
        onClose={() => setIsAddVisitorOpen(false)}
        title="Add Frequent Visitor to Directory"
      >
        <form onSubmit={handleAddDirectoryVisitor} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                First Name *
              </label>
              <Input
                value={directoryForm.firstName}
                onChange={(e) => setDirectoryForm({ ...directoryForm, firstName: e.target.value })}
                placeholder="e.g. Jordan"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Last Name
              </label>
              <Input
                value={directoryForm.lastName}
                onChange={(e) => setDirectoryForm({ ...directoryForm, lastName: e.target.value })}
                placeholder="e.g. Reed"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Phone Number
              </label>
              <Input
                value={directoryForm.phone}
                onChange={(e) => setDirectoryForm({ ...directoryForm, phone: e.target.value })}
                placeholder="+1 (555) 304-9182"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Email Address
              </label>
              <Input
                type="email"
                value={directoryForm.email}
                onChange={(e) => setDirectoryForm({ ...directoryForm, email: e.target.value })}
                placeholder="jordan@company.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Government / Driver ID Number
            </label>
            <Input
              value={directoryForm.idNumber}
              onChange={(e) => setDirectoryForm({ ...directoryForm, idNumber: e.target.value })}
              placeholder="e.g. DL-9920194A"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsAddVisitorOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreatingVisitor} className="bg-slate-900 text-white">
              {isCreatingVisitor ? 'Saving...' : 'Save to Directory'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
