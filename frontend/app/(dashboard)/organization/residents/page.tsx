'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Users, 
  UserCheck, 
  Key, 
  Car, 
  ArrowRightLeft, 
  Search, 
  Plus, 
  Trash2, 
  Building, 
  Phone, 
  Mail, 
  Calendar, 
  FileText, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  ChevronRight
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
  useGetUnitsQuery,
  useGetOwnersQuery,
  useCreateOwnerMutation,
  useDeleteOwnerMutation,
  useGetTenantsQuery,
  useCreateTenantMutation,
  useDeleteTenantMutation,
  useGetVehiclesQuery,
  useCreateVehicleMutation,
  useDeleteVehicleMutation,
  useGetTransfersQuery,
  useCreateTransferMutation,
} from '@/services/organizationApi';

type TabType = 'owners' | 'tenants' | 'vehicles' | 'transfers';

export default function ResidentsPage() {
  return (
    <RequireModule moduleCode="PROPERTY_MANAGEMENT">
      <ResidentsHubContent />
    </RequireModule>
  );
}

function ResidentsHubContent() {
  const dispatch = useDispatch();
  const confirm = useConfirm();

  const [activeTab, setActiveTab] = useState<TabType>('owners');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<string>('ALL');

  // Modals state
  const [isOwnerModalOpen, setIsOwnerModalOpen] = useState(false);
  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // Form states
  const [ownerForm, setOwnerForm] = useState({
    propertyNodeId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    moveInDate: new Date().toISOString().split('T')[0],
  });

  const [tenantForm, setTenantForm] = useState({
    propertyNodeId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    leaseStart: new Date().toISOString().split('T')[0],
    leaseEnd: '',
  });

  const [vehicleForm, setVehicleForm] = useState({
    propertyNodeId: '',
    licensePlate: '',
    make: '',
    model: '',
    color: '',
  });

  const [transferForm, setTransferForm] = useState({
    propertyNodeId: '',
    previousOwnerId: '',
    newOwnerFirstName: '',
    newOwnerLastName: '',
    newOwnerEmail: '',
    newOwnerPhone: '',
    moveInDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // RTK Query Hooks
  const { data: unitsData, isLoading: isLoadingUnits } = useGetUnitsQuery({});
  const { data: ownersData, isLoading: isLoadingOwners } = useGetOwnersQuery({});
  const { data: tenantsData, isLoading: isLoadingTenants } = useGetTenantsQuery({});
  const { data: vehiclesData, isLoading: isLoadingVehicles } = useGetVehiclesQuery({});
  const { data: transfersData, isLoading: isLoadingTransfers } = useGetTransfersQuery({});

  // Mutations
  const [createOwner, { isLoading: isCreatingOwner }] = useCreateOwnerMutation();
  const [deleteOwner] = useDeleteOwnerMutation();
  const [createTenant, { isLoading: isCreatingTenant }] = useCreateTenantMutation();
  const [deleteTenant] = useDeleteTenantMutation();
  const [createVehicle, { isLoading: isCreatingVehicle }] = useCreateVehicleMutation();
  const [deleteVehicle] = useDeleteVehicleMutation();
  const [createTransfer, { isLoading: isCreatingTransfer }] = useCreateTransferMutation();

  // Normalized datasets
  const units: any[] = useMemo(() => {
    if (!unitsData) return [];
    return Array.isArray(unitsData) ? unitsData : (unitsData.data || []);
  }, [unitsData]);

  const owners: any[] = useMemo(() => {
    if (!ownersData) return [];
    return Array.isArray(ownersData) ? ownersData : (ownersData.data || []);
  }, [ownersData]);

  const tenants: any[] = useMemo(() => {
    if (!tenantsData) return [];
    return Array.isArray(tenantsData) ? tenantsData : (tenantsData.data || []);
  }, [tenantsData]);

  const vehicles: any[] = useMemo(() => {
    if (!vehiclesData) return [];
    return Array.isArray(vehiclesData) ? vehiclesData : (vehiclesData.data || []);
  }, [vehiclesData]);

  const transfers: any[] = useMemo(() => {
    if (!transfersData) return [];
    return Array.isArray(transfersData) ? transfersData : (transfersData.data || []);
  }, [transfersData]);

  // Unit lookup dictionary for fast resolution
  const unitMap = useMemo(() => {
    const map = new Map<string, any>();
    units.forEach((u) => map.set(u.id, u));
    return map;
  }, [units]);

  // Check if unit is locked as a dedicated parking area/space
  const isParkingUnit = (u: any) => {
    return (
      u.status === 'PARKING_ALLOCATED' ||
      (u.parkingAreas && u.parkingAreas.length > 0) ||
      u.metadata?.isParkingArea ||
      u.metadata?.type === 'PARKING'
    );
  };

  // Owner lookup dictionary
  const ownerMap = useMemo(() => {
    const map = new Map<string, any>();
    owners.forEach((o) => map.set(o.id, o));
    return map;
  }, [owners]);

  // Total unique occupants count
  const totalOccupantsCount = useMemo(() => {
    const emails = new Set<string>();
    owners.forEach(o => { if (o.email) emails.add(o.email.toLowerCase()); });
    tenants.forEach(t => { if (t.email) emails.add(t.email.toLowerCase()); });
    return emails.size > 0 ? emails.size : (owners.length + tenants.length);
  }, [owners, tenants]);

  // Filtered lists based on search and unit filter
  const filteredOwners = useMemo(() => {
    return owners.filter((item) => {
      const matchesUnit = selectedUnitFilter === 'ALL' || item.propertyNodeId === selectedUnitFilter;
      const unit = item.propertyNode || unitMap.get(item.propertyNodeId);
      const unitName = unit?.name || unit?.unitNumber || '';
      const text = `${item.firstName} ${item.lastName} ${item.email} ${item.phone} ${unitName}`.toLowerCase();
      const matchesSearch = !searchTerm || text.includes(searchTerm.toLowerCase());
      return matchesUnit && matchesSearch;
    });
  }, [owners, selectedUnitFilter, searchTerm, unitMap]);

  const filteredTenants = useMemo(() => {
    return tenants.filter((item) => {
      const matchesUnit = selectedUnitFilter === 'ALL' || item.propertyNodeId === selectedUnitFilter;
      const unit = item.propertyNode || unitMap.get(item.propertyNodeId);
      const unitName = unit?.name || unit?.unitNumber || '';
      const text = `${item.firstName} ${item.lastName} ${item.email || ''} ${item.phone} ${unitName}`.toLowerCase();
      const matchesSearch = !searchTerm || text.includes(searchTerm.toLowerCase());
      return matchesUnit && matchesSearch;
    });
  }, [tenants, selectedUnitFilter, searchTerm, unitMap]);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((item) => {
      const matchesUnit = selectedUnitFilter === 'ALL' || item.propertyNodeId === selectedUnitFilter;
      const unit = item.propertyNode || unitMap.get(item.propertyNodeId);
      const unitName = unit?.name || unit?.unitNumber || '';
      const text = `${item.licensePlate} ${item.make || ''} ${item.model || ''} ${item.color || ''} ${unitName}`.toLowerCase();
      const matchesSearch = !searchTerm || text.includes(searchTerm.toLowerCase());
      return matchesUnit && matchesSearch;
    });
  }, [vehicles, selectedUnitFilter, searchTerm, unitMap]);

  const filteredTransfers = useMemo(() => {
    return transfers.filter((item) => {
      const matchesUnit = selectedUnitFilter === 'ALL' || item.propertyNodeId === selectedUnitFilter;
      const unit = item.propertyNode || unitMap.get(item.propertyNodeId);
      const unitName = unit?.name || unit?.unitNumber || '';
      const prevOwner = ownerMap.get(item.previousOwnerId);
      const newOwner = ownerMap.get(item.newOwnerId);
      const text = `${unitName} ${prevOwner ? `${prevOwner.firstName} ${prevOwner.lastName}` : ''} ${newOwner ? `${newOwner.firstName} ${newOwner.lastName}` : ''} ${item.notes || ''}`.toLowerCase();
      const matchesSearch = !searchTerm || text.includes(searchTerm.toLowerCase());
      return matchesUnit && matchesSearch;
    });
  }, [transfers, selectedUnitFilter, searchTerm, unitMap, ownerMap]);

  // Action handlers
  const handleDeleteOwner = async (owner: any) => {
    const ok = await confirm({
      title: 'Remove Unit Owner',
      message: `Are you sure you want to remove ${owner.firstName} ${owner.lastName} from their assigned unit? This action will archive their ownership records.`,
      confirmText: 'Yes, Remove Owner',
      cancelText: 'Cancel',
      destructive: true,
    });
    if (!ok) return;

    try {
      await deleteOwner(owner.id).unwrap();
    } catch (err: any) {
      dispatch(showWarning({ title: 'Removal Failed', message: err.data?.message || 'Could not delete owner.' }));
    }
  };

  const handleDeleteTenant = async (tenant: any) => {
    const ok = await confirm({
      title: 'Register Move-Out',
      message: `Confirm move-out for tenant ${tenant.firstName} ${tenant.lastName}? Their tenancy status will be terminated.`,
      confirmText: 'Confirm Move-Out',
      cancelText: 'Cancel',
      destructive: true,
    });
    if (!ok) return;

    try {
      await deleteTenant(tenant.id).unwrap();
    } catch (err: any) {
      dispatch(showWarning({ title: 'Move-out Failed', message: err.data?.message || 'Could not process tenant move-out.' }));
    }
  };

  const handleDeleteVehicle = async (vehicle: any) => {
    const ok = await confirm({
      title: 'Deregister Vehicle',
      message: `Are you sure you want to deregister vehicle with plate "${vehicle.licensePlate}"?`,
      confirmText: 'Deregister',
      cancelText: 'Cancel',
      destructive: true,
    });
    if (!ok) return;

    try {
      await deleteVehicle(vehicle.id).unwrap();
    } catch (err: any) {
      dispatch(showWarning({ title: 'Deregistration Failed', message: err.data?.message || 'Could not deregister vehicle.' }));
    }
  };

  // Submit Owner
  const handleSaveOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerForm.propertyNodeId || !ownerForm.firstName.trim() || !ownerForm.email.trim() || !ownerForm.phone.trim()) {
      dispatch(showWarning({ title: 'Missing Information', message: 'Please provide all mandatory fields (Unit, Name, Email, Phone).' }));
      return;
    }

    try {
      await createOwner(ownerForm).unwrap();
      setIsOwnerModalOpen(false);
      setOwnerForm({
        propertyNodeId: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        moveInDate: new Date().toISOString().split('T')[0],
      });
    } catch (err: any) {
      dispatch(showWarning({ title: 'Registration Failed', message: err.data?.message || 'Failed to register owner.' }));
    }
  };

  // Submit Tenant
  const handleSaveTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantForm.propertyNodeId || !tenantForm.firstName.trim() || !tenantForm.phone.trim()) {
      dispatch(showWarning({ title: 'Missing Information', message: 'Please provide Unit, Name, and Phone number.' }));
      return;
    }

    try {
      const payload: any = {
        propertyNodeId: tenantForm.propertyNodeId,
        firstName: tenantForm.firstName,
        lastName: tenantForm.lastName,
        phone: tenantForm.phone,
      };
      if (tenantForm.email.trim()) payload.email = tenantForm.email.trim();
      if (tenantForm.leaseStart) payload.leaseStart = new Date(tenantForm.leaseStart).toISOString();
      if (tenantForm.leaseEnd) payload.leaseEnd = new Date(tenantForm.leaseEnd).toISOString();

      await createTenant(payload).unwrap();
      setIsTenantModalOpen(false);
      setTenantForm({
        propertyNodeId: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        leaseStart: new Date().toISOString().split('T')[0],
        leaseEnd: '',
      });
    } catch (err: any) {
      dispatch(showWarning({ title: 'Move-in Registration Failed', message: err.data?.message || 'Failed to register tenant.' }));
    }
  };

  // Submit Vehicle
  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleForm.propertyNodeId || !vehicleForm.licensePlate.trim()) {
      dispatch(showWarning({ title: 'Missing Information', message: 'Please select an assigned Unit and specify a License Plate.' }));
      return;
    }

    try {
      const payload: any = {
        propertyNodeId: vehicleForm.propertyNodeId,
        licensePlate: vehicleForm.licensePlate.toUpperCase().trim(),
      };
      if (vehicleForm.make.trim()) payload.make = vehicleForm.make.trim();
      if (vehicleForm.model.trim()) payload.model = vehicleForm.model.trim();
      if (vehicleForm.color.trim()) payload.color = vehicleForm.color.trim();

      await createVehicle(payload).unwrap();
      setIsVehicleModalOpen(false);
      setVehicleForm({
        propertyNodeId: '',
        licensePlate: '',
        make: '',
        model: '',
        color: '',
      });
    } catch (err: any) {
      dispatch(showWarning({ title: 'Registration Failed', message: err.data?.message || 'Failed to register vehicle.' }));
    }
  };

  // Submit Transfer
  const handleSaveTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferForm.propertyNodeId || !transferForm.newOwnerFirstName.trim() || !transferForm.newOwnerEmail.trim() || !transferForm.newOwnerPhone.trim()) {
      dispatch(showWarning({ title: 'Incomplete Transfer Form', message: 'Unit and full New Owner contact details are required.' }));
      return;
    }

    try {
      const payload: any = {
        propertyNodeId: transferForm.propertyNodeId,
        newOwner: {
          propertyNodeId: transferForm.propertyNodeId,
          firstName: transferForm.newOwnerFirstName.trim(),
          lastName: transferForm.newOwnerLastName.trim(),
          email: transferForm.newOwnerEmail.trim(),
          phone: transferForm.newOwnerPhone.trim(),
          moveInDate: transferForm.moveInDate ? new Date(transferForm.moveInDate).toISOString() : undefined,
        },
      };
      if (transferForm.previousOwnerId) {
        payload.previousOwnerId = transferForm.previousOwnerId;
      }
      if (transferForm.notes.trim()) {
        payload.notes = transferForm.notes.trim();
      }

      await createTransfer(payload).unwrap();
      setIsTransferModalOpen(false);
      setTransferForm({
        propertyNodeId: '',
        previousOwnerId: '',
        newOwnerFirstName: '',
        newOwnerLastName: '',
        newOwnerEmail: '',
        newOwnerPhone: '',
        moveInDate: new Date().toISOString().split('T')[0],
        notes: '',
      });
    } catch (err: any) {
      dispatch(showWarning({ title: 'Transfer Failed', message: err.data?.message || 'Could not complete unit ownership transfer.' }));
    }
  };

  // When selecting a unit in the transfer modal, auto-detect the current owner
  const handleTransferUnitChange = (unitId: string) => {
    const existingOwner = owners.find((o) => o.propertyNodeId === unitId);
    setTransferForm((prev) => ({
      ...prev,
      propertyNodeId: unitId,
      previousOwnerId: existingOwner ? existingOwner.id : '',
    }));
  };

  // Table Columns
  const ownerColumns: Column<any>[] = [
    {
      header: 'Owner',
      accessorKey: 'firstName',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-violet-500/20">
            {row.firstName?.[0] || 'U'}{row.lastName?.[0] || 'O'}
          </div>
          <div>
            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              {row.firstName} {row.lastName}
              <Badge variant="default" className="text-[10px] bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                Unit Owner
              </Badge>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
              <Mail className="h-3 w-3" /> {row.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Assigned Unit',
      accessorKey: 'propertyNodeId',
      cell: (row) => {
        const unit = row.propertyNode || unitMap.get(row.propertyNodeId);
        return (
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <Building className="h-4 w-4" />
            </div>
            <div>
              <Link 
                href={`/organization/units/${row.propertyNodeId}`}
                className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                {unit?.name || unit?.unitNumber || 'Unit #' + row.propertyNodeId.slice(0, 6)}
                <ExternalLink className="h-3 w-3 opacity-60" />
              </Link>
              <div className="text-xs text-slate-400">
                {unit?.parent?.name || unit?.floor?.name || 'Assigned Property'}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Contact Phone',
      accessorKey: 'phone',
      cell: (row) => (
        <div className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Phone className="h-3.5 w-3.5 text-slate-400" />
          {row.phone || 'N/A'}
        </div>
      ),
    },
    {
      header: 'Move-in Date',
      accessorKey: 'moveInDate',
      cell: (row) => (
        <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          {row.moveInDate ? new Date(row.moveInDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Registered Onboard'}
        </div>
      ),
    },
    {
      header: 'Actions',
      accessorKey: 'id',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setTransferForm((prev) => ({
                ...prev,
                propertyNodeId: row.propertyNodeId,
                previousOwnerId: row.id,
              }));
              setIsTransferModalOpen(true);
            }}
            className="text-xs h-8 border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30"
          >
            <ArrowRightLeft className="h-3.5 w-3.5 mr-1" />
            Transfer Title
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteOwner(row)}
            className="text-xs h-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  const tenantColumns: Column<any>[] = [
    {
      header: 'Tenant',
      accessorKey: 'firstName',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-emerald-500/20">
            {row.firstName?.[0] || 'T'}{row.lastName?.[0] || ''}
          </div>
          <div>
            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              {row.firstName} {row.lastName}
              <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                Lease Tenant
              </Badge>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
              <Mail className="h-3 w-3" /> {row.email || 'No email registered'}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Assigned Unit',
      accessorKey: 'propertyNodeId',
      cell: (row) => {
        const unit = row.propertyNode || unitMap.get(row.propertyNodeId);
        return (
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <Building className="h-4 w-4" />
            </div>
            <div>
              <Link 
                href={`/organization/units/${row.propertyNodeId}`}
                className="font-medium text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                {unit?.name || unit?.unitNumber || 'Unit #' + row.propertyNodeId.slice(0, 6)}
                <ExternalLink className="h-3 w-3 opacity-60" />
              </Link>
              <div className="text-xs text-slate-400">
                {unit?.parent?.name || unit?.floor?.name || 'Assigned Property'}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Contact Phone',
      accessorKey: 'phone',
      cell: (row) => (
        <div className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Phone className="h-3.5 w-3.5 text-slate-400" />
          {row.phone || 'N/A'}
        </div>
      ),
    },
    {
      header: 'Lease Duration',
      accessorKey: 'leaseStart',
      cell: (row) => {
        const start = row.leaseStart ? new Date(row.leaseStart) : null;
        const end = row.leaseEnd ? new Date(row.leaseEnd) : null;
        const now = new Date();

        let statusVariant: 'default' | 'success' | 'warning' | 'danger' = 'success';
        let statusText = 'Active Lease';

        if (end) {
          const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays < 0) {
            statusVariant = 'danger';
            statusText = 'Expired';
          } else if (diffDays <= 30) {
            statusVariant = 'warning';
            statusText = `Expiring (${diffDays}d)`;
          }
        }

        return (
          <div>
            <div className="flex items-center gap-1.5">
              <Badge variant={statusVariant} className="text-[10px] py-0 px-2">
                {statusText}
              </Badge>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {start ? start.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
              {' → '}
              {end ? end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Indefinite'}
            </div>
          </div>
        );
      },
    },
    {
      header: 'Actions',
      accessorKey: 'id',
      cell: (row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleDeleteTenant(row)}
          className="text-xs h-8 border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
        >
          <Trash2 className="h-3.5 w-3.5 mr-1" />
          Move-Out
        </Button>
      ),
    },
  ];

  const vehicleColumns: Column<any>[] = [
    {
      header: 'License Plate',
      accessorKey: 'licensePlate',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-md border-2 border-slate-700 bg-slate-900 text-amber-300 font-mono font-bold tracking-wider text-sm shadow-sm flex items-center gap-2">
            <Car className="h-4 w-4 text-amber-400" />
            {row.licensePlate}
          </div>
        </div>
      ),
    },
    {
      header: 'Vehicle Model',
      accessorKey: 'make',
      cell: (row) => (
        <div>
          <div className="font-semibold text-slate-900 dark:text-white">
            {row.make ? `${row.make} ${row.model || ''}` : 'Vehicle'}
          </div>
          {row.color && (
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span 
                className="inline-block h-2 w-2 rounded-full border border-slate-300 dark:border-slate-700" 
                style={{ backgroundColor: row.color.toLowerCase() }}
              />
              Color: {row.color}
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Assigned Unit',
      accessorKey: 'propertyNodeId',
      cell: (row) => {
        const unit = row.propertyNode || unitMap.get(row.propertyNodeId);
        return (
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <Building className="h-4 w-4" />
            </div>
            <div>
              <Link 
                href={`/organization/units/${row.propertyNodeId}`}
                className="font-medium text-slate-800 dark:text-slate-200 hover:underline flex items-center gap-1 text-sm"
              >
                {unit?.name || unit?.unitNumber || 'Unit #' + row.propertyNodeId.slice(0, 6)}
              </Link>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Registered On',
      accessorKey: 'createdAt',
      cell: (row) => (
        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : 'N/A'}
        </div>
      ),
    },
    {
      header: 'Actions',
      accessorKey: 'id',
      cell: (row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleDeleteVehicle(row)}
          className="text-xs h-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
        >
          <Trash2 className="h-3.5 w-3.5 mr-1" />
          Deregister
        </Button>
      ),
    },
  ];

  const transferColumns: Column<any>[] = [
    {
      header: 'Unit / Property',
      accessorKey: 'propertyNodeId',
      cell: (row) => {
        const unit = row.propertyNode || unitMap.get(row.propertyNodeId);
        return (
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 flex items-center justify-center">
              <Building className="h-4 w-4" />
            </div>
            <div>
              <div className="font-semibold text-slate-900 dark:text-white text-sm">
                {unit?.name || unit?.unitNumber || 'Unit #' + row.propertyNodeId.slice(0, 6)}
              </div>
              <div className="text-xs text-slate-400">
                {unit?.parent?.name || 'Unit Node'}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Ownership Transition',
      accessorKey: 'previousOwnerId',
      cell: (row) => {
        const prev = row.previousOwnerId ? ownerMap.get(row.previousOwnerId) : null;
        const next = row.newOwnerId ? ownerMap.get(row.newOwnerId) : null;
        return (
          <div className="flex items-center gap-2">
            <div className="text-xs">
              <div className="text-slate-400">Previous Owner</div>
              <div className="font-medium text-slate-700 dark:text-slate-300">
                {prev ? `${prev.firstName} ${prev.lastName}` : (row.previousOwnerId ? `${row.previousOwnerId.slice(0, 8)}...` : 'Developer / Original')}
              </div>
            </div>
            <ArrowRightLeft className="h-4 w-4 text-violet-500 flex-shrink-0 mx-1" />
            <div className="text-xs">
              <div className="text-violet-600 dark:text-violet-400 font-semibold">New Titleholder</div>
              <div className="font-bold text-slate-900 dark:text-white">
                {next ? `${next.firstName} ${next.lastName}` : (row.newOwnerId ? `${row.newOwnerId.slice(0, 8)}...` : 'Assigned Owner')}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Transfer Date',
      accessorKey: 'transferDate',
      cell: (row) => (
        <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          {new Date(row.transferDate).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </div>
      ),
    },
    {
      header: 'Deed / Transfer Notes',
      accessorKey: 'notes',
      cell: (row) => (
        <div className="max-w-xs truncate text-xs text-slate-600 dark:text-slate-400 italic">
          {row.notes || 'Deed recorded in BMMS registry.'}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title="Residents & Occupancy Hub"
        description="Comprehensive management of unit owners, lease tenants, registered vehicles, and title transfers."
        action={
          <div className="flex items-center gap-2">
            {activeTab === 'owners' && (
              <Button onClick={() => setIsOwnerModalOpen(true)} className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25">
                <Plus className="h-4 w-4 mr-1.5" />
                Register Owner
              </Button>
            )}
            {activeTab === 'tenants' && (
              <Button onClick={() => setIsTenantModalOpen(true)} className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/25">
                <Plus className="h-4 w-4 mr-1.5" />
                Register Move-In
              </Button>
            )}
            {activeTab === 'vehicles' && (
              <Button onClick={() => setIsVehicleModalOpen(true)} className="bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-500/25">
                <Plus className="h-4 w-4 mr-1.5" />
                Register Vehicle
              </Button>
            )}
            {activeTab === 'transfers' && (
              <Button onClick={() => setIsTransferModalOpen(true)} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25">
                <ArrowRightLeft className="h-4 w-4 mr-1.5" />
                Transfer Ownership
              </Button>
            )}
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Occupants */}
        <Card className="border-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-lg ring-1 ring-slate-900/5 dark:ring-white/10 relative overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Total Occupants
                </p>
                <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {totalOccupantsCount}
                </h3>
                <p className="text-xs text-slate-400 mt-1">Across all properties</p>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/25">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Unit Owners */}
        <Card className="border-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-lg ring-1 ring-slate-900/5 dark:ring-white/10 relative overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Unit Owners
                </p>
                <h3 className="text-3xl font-extrabold text-violet-600 dark:text-violet-400 mt-1">
                  {owners.length}
                </h3>
                <p className="text-xs text-slate-400 mt-1">Titleholders on file</p>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md shadow-violet-500/25">
                <UserCheck className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Tenants */}
        <Card className="border-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-lg ring-1 ring-slate-900/5 dark:ring-white/10 relative overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Active Tenants
                </p>
                <h3 className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                  {tenants.length}
                </h3>
                <p className="text-xs text-slate-400 mt-1">Registered lease occupants</p>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25">
                <Key className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Registered Vehicles */}
        <Card className="border-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-lg ring-1 ring-slate-900/5 dark:ring-white/10 relative overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Vehicles
                </p>
                <h3 className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
                  {vehicles.length}
                </h3>
                <p className="text-xs text-slate-400 mt-1">Permitted resident cars</p>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/25">
                <Car className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Control Bar: Tabs + Search & Unit Filters */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-white/10 p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
          {/* Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setActiveTab('owners')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeTab === 'owners'
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <UserCheck className="h-4 w-4" />
              Property Owners
              <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'owners' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                {owners.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('tenants')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeTab === 'tenants'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Key className="h-4 w-4" />
              Tenants & Leases
              <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'tenants' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                {tenants.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('vehicles')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeTab === 'vehicles'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Car className="h-4 w-4" />
              Registered Vehicles
              <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'vehicles' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                {vehicles.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('transfers')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeTab === 'transfers'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <ArrowRightLeft className="h-4 w-4" />
              Title Transfers
              <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'transfers' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                {transfers.length}
              </span>
            </button>
          </div>
        </div>

        {/* Filter Inputs */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Search ${activeTab}...`}
              className="pl-9 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="w-full sm:w-64">
            <select
              value={selectedUnitFilter}
              onChange={(e) => setSelectedUnitFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="ALL">All Units & Properties</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name || u.unitNumber || 'Unit'} {u.parent?.name ? `(${u.parent.name})` : ''}
                </option>
              ))}
            </select>
          </div>

          {(searchTerm || selectedUnitFilter !== 'ALL') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setSelectedUnitFilter('ALL');
              }}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white"
            >
              Reset Filters
            </Button>
          )}
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'owners' && (
        <DataTable
          columns={ownerColumns}
          data={filteredOwners}
          isLoading={isLoadingOwners}
          emptyMessage="No property owners registered yet. Click '+ Register Owner' to add the first unit owner."
        />
      )}

      {activeTab === 'tenants' && (
        <DataTable
          columns={tenantColumns}
          data={filteredTenants}
          isLoading={isLoadingTenants}
          emptyMessage="No active tenants or leases found. Click '+ Register Move-In' to onboard a tenant."
        />
      )}

      {activeTab === 'vehicles' && (
        <DataTable
          columns={vehicleColumns}
          data={filteredVehicles}
          isLoading={isLoadingVehicles}
          emptyMessage="No vehicles registered for residents. Click '+ Register Vehicle' to record a vehicle."
        />
      )}

      {activeTab === 'transfers' && (
        <DataTable
          columns={transferColumns}
          data={filteredTransfers}
          isLoading={isLoadingTransfers}
          emptyMessage="No title transfers recorded. Click 'Transfer Ownership' to record a deed transfer between owners."
        />
      )}

      {/* Modal 1: Register Owner */}
      <Modal
        isOpen={isOwnerModalOpen}
        onClose={() => setIsOwnerModalOpen(false)}
        title="Register Unit Owner"
      >
        <form onSubmit={handleSaveOwner} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Select Unit *
            </label>
            <select
              value={ownerForm.propertyNodeId}
              onChange={(e) => setOwnerForm({ ...ownerForm, propertyNodeId: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500"
              required
            >
              <option value="">-- Choose Unit --</option>
              {units.map((u) => {
                const isParking = isParkingUnit(u);
                return (
                  <option key={u.id} value={u.id} disabled={isParking}>
                    {u.name || u.unitNumber || 'Unit'} {u.parent?.name ? `(${u.parent.name})` : ''} {isParking ? '• [Allocated to Parking - Unavailable]' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                First Name *
              </label>
              <Input
                value={ownerForm.firstName}
                onChange={(e) => setOwnerForm({ ...ownerForm, firstName: e.target.value })}
                placeholder="e.g. John"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Last Name *
              </label>
              <Input
                value={ownerForm.lastName}
                onChange={(e) => setOwnerForm({ ...ownerForm, lastName: e.target.value })}
                placeholder="e.g. Smith"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Email Address * (Will receive portal access invite)
            </label>
            <Input
              type="email"
              value={ownerForm.email}
              onChange={(e) => setOwnerForm({ ...ownerForm, email: e.target.value })}
              placeholder="owner@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Phone Number *
            </label>
            <Input
              value={ownerForm.phone}
              onChange={(e) => setOwnerForm({ ...ownerForm, phone: e.target.value })}
              placeholder="+1 (555) 019-2834"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Move-In / Purchase Date
            </label>
            <Input
              type="date"
              value={ownerForm.moveInDate}
              onChange={(e) => setOwnerForm({ ...ownerForm, moveInDate: e.target.value })}
            />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsOwnerModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreatingOwner} className="bg-violet-600 text-white">
              {isCreatingOwner ? 'Registering...' : 'Complete Registration'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Register Tenant Move-In */}
      <Modal
        isOpen={isTenantModalOpen}
        onClose={() => setIsTenantModalOpen(false)}
        title="Register Move-In (New Tenant)"
      >
        <form onSubmit={handleSaveTenant} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Assigned Unit *
            </label>
            <select
              value={tenantForm.propertyNodeId}
              onChange={(e) => setTenantForm({ ...tenantForm, propertyNodeId: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              required
            >
              <option value="">-- Choose Unit --</option>
              {units.map((u) => {
                const isParking = isParkingUnit(u);
                return (
                  <option key={u.id} value={u.id} disabled={isParking}>
                    {u.name || u.unitNumber || 'Unit'} {u.parent?.name ? `(${u.parent.name})` : ''} {isParking ? '• [Allocated to Parking - Unavailable]' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                First Name *
              </label>
              <Input
                value={tenantForm.firstName}
                onChange={(e) => setTenantForm({ ...tenantForm, firstName: e.target.value })}
                placeholder="e.g. Sarah"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Last Name *
              </label>
              <Input
                value={tenantForm.lastName}
                onChange={(e) => setTenantForm({ ...tenantForm, lastName: e.target.value })}
                placeholder="e.g. Jenkins"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Email (Optional)
            </label>
            <Input
              type="email"
              value={tenantForm.email}
              onChange={(e) => setTenantForm({ ...tenantForm, email: e.target.value })}
              placeholder="tenant@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Phone Number *
            </label>
            <Input
              value={tenantForm.phone}
              onChange={(e) => setTenantForm({ ...tenantForm, phone: e.target.value })}
              placeholder="+1 (555) 482-9012"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Lease Start
              </label>
              <Input
                type="date"
                value={tenantForm.leaseStart}
                onChange={(e) => setTenantForm({ ...tenantForm, leaseStart: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Lease End
              </label>
              <Input
                type="date"
                value={tenantForm.leaseEnd}
                onChange={(e) => setTenantForm({ ...tenantForm, leaseEnd: e.target.value })}
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsTenantModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreatingTenant} className="bg-emerald-600 text-white">
              {isCreatingTenant ? 'Processing...' : 'Register Move-In'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 3: Register Vehicle */}
      <Modal
        isOpen={isVehicleModalOpen}
        onClose={() => setIsVehicleModalOpen(false)}
        title="Register Resident Vehicle"
      >
        <form onSubmit={handleSaveVehicle} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Resident Unit *
            </label>
            <select
              value={vehicleForm.propertyNodeId}
              onChange={(e) => setVehicleForm({ ...vehicleForm, propertyNodeId: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
              required
            >
              <option value="">-- Choose Unit --</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name || u.unitNumber || 'Unit'} {u.parent?.name ? `(${u.parent.name})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              License Plate *
            </label>
            <Input
              value={vehicleForm.licensePlate}
              onChange={(e) => setVehicleForm({ ...vehicleForm, licensePlate: e.target.value.toUpperCase() })}
              placeholder="e.g. 7XYZ987"
              className="font-mono uppercase font-bold"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Make
              </label>
              <Input
                value={vehicleForm.make}
                onChange={(e) => setVehicleForm({ ...vehicleForm, make: e.target.value })}
                placeholder="e.g. Tesla, Honda"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Model
              </label>
              <Input
                value={vehicleForm.model}
                onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                placeholder="e.g. Model Y, Civic"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Color
            </label>
            <Input
              value={vehicleForm.color}
              onChange={(e) => setVehicleForm({ ...vehicleForm, color: e.target.value })}
              placeholder="e.g. Pearl White, Silver, Black"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsVehicleModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreatingVehicle} className="bg-amber-600 text-white">
              {isCreatingVehicle ? 'Registering...' : 'Register Vehicle'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 4: Title Transfer */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title="Unit Title Ownership Transfer"
      >
        <form onSubmit={handleSaveTransfer} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Unit Being Transferred *
            </label>
            <select
              value={transferForm.propertyNodeId}
              onChange={(e) => handleTransferUnitChange(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              required
            >
              <option value="">-- Choose Unit to Transfer --</option>
              {units.map((u) => {
                const isParking = isParkingUnit(u);
                return (
                  <option key={u.id} value={u.id} disabled={isParking}>
                    {u.name || u.unitNumber || 'Unit'} {u.parent?.name ? `(${u.parent.name})` : ''} {isParking ? '• [Allocated to Parking - Unavailable]' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {transferForm.propertyNodeId && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Current Titleholder / Previous Owner
              </label>
              <select
                value={transferForm.previousOwnerId}
                onChange={(e) => setTransferForm({ ...transferForm, previousOwnerId: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="">-- No previous owner on file (Developer/New) --</option>
                {owners.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.firstName} {o.lastName} ({o.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50 space-y-3">
            <div className="text-xs font-bold text-purple-900 dark:text-purple-300 uppercase tracking-wider">
              New Titleholder Details
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  First Name *
                </label>
                <Input
                  value={transferForm.newOwnerFirstName}
                  onChange={(e) => setTransferForm({ ...transferForm, newOwnerFirstName: e.target.value })}
                  placeholder="First name"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Last Name *
                </label>
                <Input
                  value={transferForm.newOwnerLastName}
                  onChange={(e) => setTransferForm({ ...transferForm, newOwnerLastName: e.target.value })}
                  placeholder="Last name"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Email *
                </label>
                <Input
                  type="email"
                  value={transferForm.newOwnerEmail}
                  onChange={(e) => setTransferForm({ ...transferForm, newOwnerEmail: e.target.value })}
                  placeholder="newowner@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Phone *
                </label>
                <Input
                  value={transferForm.newOwnerPhone}
                  onChange={(e) => setTransferForm({ ...transferForm, newOwnerPhone: e.target.value })}
                  placeholder="+1 555 123 4567"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Effective Date of Transfer
              </label>
              <Input
                type="date"
                value={transferForm.moveInDate}
                onChange={(e) => setTransferForm({ ...transferForm, moveInDate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Deed / Notarization / Legal Notes
            </label>
            <textarea
              rows={2}
              value={transferForm.notes}
              onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })}
              placeholder="e.g. Executed Warranty Deed Document #2026-8819. Title company closing complete."
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsTransferModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreatingTransfer} className="bg-purple-600 text-white">
              {isCreatingTransfer ? 'Executing Transfer...' : 'Execute Title Transfer'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
