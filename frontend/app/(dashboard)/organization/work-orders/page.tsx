'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Wrench, 
  HardHat, 
  UserCheck, 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  AlertCircle,
  Search, 
  Plus, 
  Trash2, 
  Eye, 
  Edit, 
  Phone, 
  Mail, 
  Calendar, 
  Building, 
  Filter, 
  ArrowRight,
  ShieldAlert,
  Layers,
  ChevronRight,
  Activity
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
  useGetWorkOrdersQuery, 
  useCreateWorkOrderMutation,
  useUpdateWorkOrderMutation, 
  useDeleteWorkOrderMutation 
} from '@/services/workOrdersApi';
import { 
  useGetTechniciansQuery,
  useCreateTechnicianMutation,
  useUpdateTechnicianMutation,
  useDeleteTechnicianMutation
} from '@/services/technicianApi';
import { useGetUnitsQuery } from '@/services/organizationApi';

type TabType = 'orders' | 'technicians';
type StatusFilter = 'ALL' | 'ACTIVE' | 'UNASSIGNED' | 'ON_HOLD' | 'COMPLETED';

export default function OrganizationWorkOrdersPage() {
  return (
    <RequireModule moduleCode="WORK_ORDERS">
      <WorkOrdersHubContent />
    </RequireModule>
  );
}

function WorkOrdersHubContent() {
  const dispatch = useDispatch();
  const confirm = useConfirm();

  const [activeTab, setActiveTab] = useState<TabType>('orders');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  // Modals state
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [isOnboardTechModalOpen, setIsOnboardTechModalOpen] = useState(false);
  const [selectedOrderForDispatch, setSelectedOrderForDispatch] = useState<any | null>(null);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>('');

  // Forms state
  const [quickOrderForm, setQuickOrderForm] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    propertyNodeId: '',
    assignedToId: '',
    dueDate: '',
  });

  const [techForm, setTechForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    employeeId: '',
    specialization: 'General Maintenance',
    shift: 'General',
    skills: '',
  });

  // Queries
  const { data: workOrdersData, isLoading: isLoadingOrders, refetch: refetchOrders } = useGetWorkOrdersQuery({});
  const { data: techniciansResponse, isLoading: isLoadingTechs, refetch: refetchTechs } = useGetTechniciansQuery({});
  const { data: unitsData } = useGetUnitsQuery({});

  // Mutations
  const [createWorkOrder, { isLoading: isCreatingOrder }] = useCreateWorkOrderMutation();
  const [updateWorkOrder, { isLoading: isUpdatingOrder }] = useUpdateWorkOrderMutation();
  const [deleteWorkOrder] = useDeleteWorkOrderMutation();
  const [createTechnician, { isLoading: isCreatingTech }] = useCreateTechnicianMutation();
  const [deleteTechnician] = useDeleteTechnicianMutation();

  // Normalize datasets
  const workOrders: any[] = useMemo(() => {
    if (!workOrdersData) return [];
    return Array.isArray(workOrdersData) ? workOrdersData : (workOrdersData.data || []);
  }, [workOrdersData]);

  const technicians: any[] = useMemo(() => {
    if (!techniciansResponse) return [];
    return Array.isArray(techniciansResponse) ? techniciansResponse : (techniciansResponse.data || []);
  }, [techniciansResponse]);

  const units: any[] = useMemo(() => {
    if (!unitsData) return [];
    return Array.isArray(unitsData) ? unitsData : (unitsData.data || []);
  }, [unitsData]);

  // Unit lookup
  const unitMap = useMemo(() => {
    const map = new Map<string, any>();
    units.forEach((u) => map.set(u.id, u));
    return map;
  }, [units]);

  // Tech lookup
  const techMap = useMemo(() => {
    const map = new Map<string, any>();
    technicians.forEach((t) => map.set(t.id, t));
    return map;
  }, [technicians]);

  // Work orders assigned count per technician
  const techWorkloadMap = useMemo(() => {
    const map = new Map<string, number>();
    workOrders.forEach((wo) => {
      if (wo.assignedToId && !['COMPLETED', 'CLOSED', 'CANCELLED'].includes(wo.status)) {
        map.set(wo.assignedToId, (map.get(wo.assignedToId) || 0) + 1);
      }
    });
    return map;
  }, [workOrders]);

  // Metric KPI Computations
  const activeOrdersCount = useMemo(() => {
    return workOrders.filter((wo) => ['IN_PROGRESS', 'ASSIGNED', 'TRAVELLING', 'ACCEPTED'].includes(wo.status)).length;
  }, [workOrders]);

  const unassignedCount = useMemo(() => {
    return workOrders.filter((wo) => (!wo.assignedToId || wo.status === 'CREATED' || wo.status === 'OPEN')).length;
  }, [workOrders]);

  const criticalCount = useMemo(() => {
    return workOrders.filter((wo) => (wo.priority === 'CRITICAL' || wo.priority === 'HIGH') && !['COMPLETED', 'CLOSED', 'CANCELLED'].includes(wo.status)).length;
  }, [workOrders]);

  // Filtered Work Orders
  const filteredWorkOrders = useMemo(() => {
    return workOrders.filter((item) => {
      // Priority filter
      if (selectedPriority !== 'ALL' && item.priority !== selectedPriority) return false;

      // Status tab filter
      if (statusFilter === 'ACTIVE') {
        if (!['ASSIGNED', 'ACCEPTED', 'TRAVELLING', 'IN_PROGRESS'].includes(item.status)) return false;
      } else if (statusFilter === 'UNASSIGNED') {
        if (item.assignedToId && !['CREATED', 'OPEN'].includes(item.status)) return false;
      } else if (statusFilter === 'ON_HOLD') {
        if (!['ON_HOLD', 'WAITING_PARTS', 'WAITING_APPROVAL'].includes(item.status)) return false;
      } else if (statusFilter === 'COMPLETED') {
        if (!['COMPLETED', 'CLOSED'].includes(item.status)) return false;
      }

      // Search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const tech = item.assignedTo || techMap.get(item.assignedToId);
        const techName = tech ? `${tech.firstName} ${tech.lastName}` : '';
        const unit = item.propertyNode || unitMap.get(item.propertyNodeId);
        const unitName = unit?.name || unit?.unitNumber || '';
        const combined = `${item.title} ${item.woNumber || ''} ${item.description || ''} ${techName} ${unitName}`.toLowerCase();
        if (!combined.includes(term)) return false;
      }

      return true;
    });
  }, [workOrders, selectedPriority, statusFilter, searchTerm, techMap, unitMap]);

  // Filtered Technicians
  const filteredTechnicians = useMemo(() => {
    return technicians.filter((tech) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      const profile = tech.technicianProfile || {};
      const combined = `${tech.firstName} ${tech.lastName} ${tech.email} ${tech.phone || ''} ${profile.specialization || ''} ${profile.employeeId || ''}`.toLowerCase();
      return combined.includes(term);
    });
  }, [technicians, searchTerm]);

  // Action: Status Change
  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateWorkOrder({ id, data: { status: newStatus } }).unwrap();
      dispatch(showWarning({ title: 'Status Updated', message: `Work order moved to ${newStatus}.` }));
      refetchOrders();
    } catch (err: any) {
      dispatch(showWarning({ title: 'Update Failed', message: err.data?.message || 'Failed to update status.' }));
    }
  };

  // Action: Delete Work Order
  const handleDeleteWorkOrder = async (order: any) => {
    const ok = await confirm({
      title: 'Delete Work Order',
      message: `Are you sure you want to delete work order "${order.title}"? Associated checklist and maintenance logs will also be removed.`,
      confirmText: 'Delete Work Order',
      cancelText: 'Cancel',
      destructive: true,
    });
    if (!ok) return;

    try {
      await deleteWorkOrder(order.id).unwrap();
      dispatch(showWarning({ title: 'Deleted', message: 'Work order deleted successfully.' }));
      refetchOrders();
    } catch (err: any) {
      dispatch(showWarning({ title: 'Error', message: err.data?.message || 'Failed to delete work order.' }));
    }
  };

  // Action: Delete Technician
  const handleDeleteTechnician = async (tech: any) => {
    const ok = await confirm({
      title: 'Remove Technician',
      message: `Are you sure you want to remove technician ${tech.firstName} ${tech.lastName}? Their technician profile will be archived.`,
      confirmText: 'Remove Technician',
      cancelText: 'Cancel',
      destructive: true,
    });
    if (!ok) return;

    try {
      await deleteTechnician(tech.id).unwrap();
      dispatch(showWarning({ title: 'Removed', message: 'Technician profile removed.' }));
      refetchTechs();
    } catch (err: any) {
      dispatch(showWarning({ title: 'Error', message: err.data?.message || 'Failed to delete technician.' }));
    }
  };

  // Action: Quick Dispatch Execute
  const handleExecuteDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForDispatch || !selectedTechnicianId) return;

    try {
      await updateWorkOrder({
        id: selectedOrderForDispatch.id,
        data: {
          assignedToId: selectedTechnicianId,
          status: selectedOrderForDispatch.status === 'CREATED' || selectedOrderForDispatch.status === 'OPEN' ? 'ASSIGNED' : selectedOrderForDispatch.status,
        },
      }).unwrap();

      dispatch(showWarning({ title: 'Dispatched', message: 'Technician dispatched and assigned to work order.' }));
      setIsDispatchModalOpen(false);
      setSelectedOrderForDispatch(null);
      setSelectedTechnicianId('');
      refetchOrders();
    } catch (err: any) {
      dispatch(showWarning({ title: 'Dispatch Failed', message: err.data?.message || 'Could not dispatch technician.' }));
    }
  };

  // Action: Quick Create Work Order
  const handleQuickCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickOrderForm.title.trim() || !quickOrderForm.description.trim()) {
      dispatch(showWarning({ title: 'Missing Info', message: 'Title and Description are required.' }));
      return;
    }

    try {
      const payload: any = {
        title: quickOrderForm.title.trim(),
        description: quickOrderForm.description.trim(),
        priority: quickOrderForm.priority,
      };
      if (quickOrderForm.propertyNodeId) payload.propertyNodeId = quickOrderForm.propertyNodeId;
      if (quickOrderForm.assignedToId) payload.assignedToId = quickOrderForm.assignedToId;
      if (quickOrderForm.dueDate) payload.dueDate = new Date(quickOrderForm.dueDate).toISOString();

      await createWorkOrder(payload).unwrap();
      dispatch(showWarning({ title: 'Success', message: 'New Work Order logged and queued.' }));
      setIsQuickCreateOpen(false);
      setQuickOrderForm({
        title: '',
        description: '',
        priority: 'MEDIUM',
        propertyNodeId: '',
        assignedToId: '',
        dueDate: '',
      });
      refetchOrders();
    } catch (err: any) {
      dispatch(showWarning({ title: 'Creation Failed', message: err.data?.message || 'Failed to create work order.' }));
    }
  };

  // Action: Onboard Technician
  const handleOnboardTechnician = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!techForm.firstName.trim() || !techForm.email.trim()) {
      dispatch(showWarning({ title: 'Missing Info', message: 'First name and email are mandatory.' }));
      return;
    }

    try {
      const skillsArray = techForm.skills
        ? techForm.skills.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      await createTechnician({
        firstName: techForm.firstName.trim(),
        lastName: techForm.lastName.trim(),
        email: techForm.email.trim(),
        phone: techForm.phone.trim() || undefined,
        employeeId: techForm.employeeId.trim() || undefined,
        specialization: techForm.specialization,
        shift: techForm.shift,
        skills: skillsArray,
      }).unwrap();

      dispatch(showWarning({ title: 'Success', message: 'Technician onboarded successfully.' }));
      setIsOnboardTechModalOpen(false);
      setTechForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        employeeId: '',
        specialization: 'General Maintenance',
        shift: 'General',
        skills: '',
      });
      refetchTechs();
    } catch (err: any) {
      dispatch(showWarning({ title: 'Onboarding Failed', message: err.data?.message || 'Could not onboard technician.' }));
    }
  };

  // Helper Badge Color
  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
      case 'HIGH':
        return 'danger';
      case 'MEDIUM':
        return 'warning';
      case 'LOW':
      default:
        return 'info';
    }
  };

  // Table Columns: Work Orders
  const orderColumns: Column<any>[] = [
    {
      header: 'Work Order',
      accessorKey: 'title',
      cell: (row) => {
        const unit = row.propertyNode || unitMap.get(row.propertyNodeId);
        return (
          <div className="space-y-1 max-w-sm">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {row.woNumber || `#WO-${row.id.slice(0, 6).toUpperCase()}`}
              </span>
              <Link 
                href={`/organization/work-orders/${row.id}`} 
                className="font-semibold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-1"
              >
                {row.title}
              </Link>
            </div>
            {unit && (
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Building className="h-3 w-3 text-slate-400" />
                {unit.name || unit.unitNumber} {unit.parent?.name ? `• ${unit.parent.name}` : ''}
              </div>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
              {row.description}
            </p>
          </div>
        );
      },
    },
    {
      header: 'Priority',
      accessorKey: 'priority',
      cell: (row) => (
        <Badge variant={getPriorityBadgeVariant(row.priority) as any} className="text-[11px] font-bold">
          {row.priority}
        </Badge>
      ),
    },
    {
      header: 'Status & Phase',
      accessorKey: 'status',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <select
            value={row.status}
            onChange={(e) => handleStatusChange(row.id, e.target.value)}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm"
          >
            <option value="CREATED">CREATED</option>
            <option value="OPEN">OPEN</option>
            <option value="ASSIGNED">ASSIGNED</option>
            <option value="ACCEPTED">ACCEPTED</option>
            <option value="TRAVELLING">TRAVELLING</option>
            <option value="IN_PROGRESS">IN PROGRESS</option>
            <option value="ON_HOLD">ON HOLD</option>
            <option value="WAITING_PARTS">WAITING PARTS</option>
            <option value="WAITING_APPROVAL">WAITING APPROVAL</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CLOSED">CLOSED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
      ),
    },
    {
      header: 'Assigned Staff',
      accessorKey: 'assignedToId',
      cell: (row) => {
        const tech = row.assignedTo || techMap.get(row.assignedToId);
        if (!tech) {
          return (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedOrderForDispatch(row);
                setSelectedTechnicianId('');
                setIsDispatchModalOpen(true);
              }}
              className="text-xs h-7 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/30 hover:bg-amber-100"
            >
              <UserCheck className="h-3 w-3 mr-1" />
              Dispatch Tech
            </Button>
          );
        }
        const profile = tech.technicianProfile;
        return (
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-xs">
              {tech.firstName?.[0] || 'T'}{tech.lastName?.[0] || ''}
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-900 dark:text-white">
                {tech.firstName} {tech.lastName}
              </div>
              <div className="text-[10px] text-slate-400">
                {profile?.specialization || 'Field Tech'}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Due Date',
      accessorKey: 'dueDate',
      cell: (row) => {
        if (!row.dueDate) return <span className="text-xs text-slate-400">No deadline</span>;
        const due = new Date(row.dueDate);
        const isOverdue = due.getTime() < Date.now() && !['COMPLETED', 'CLOSED', 'CANCELLED'].includes(row.status);
        return (
          <div className={`text-xs flex items-center gap-1.5 ${isOverdue ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-600 dark:text-slate-400'}`}>
            <Calendar className="h-3.5 w-3.5" />
            {due.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            {isOverdue && <span className="text-[10px] px-1 bg-rose-100 text-rose-700 rounded">Overdue</span>}
          </div>
        );
      },
    },
    {
      header: 'Actions',
      accessorKey: 'id',
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedOrderForDispatch(row);
              setSelectedTechnicianId(row.assignedToId || '');
              setIsDispatchModalOpen(true);
            }}
            title="Dispatch / Reassign Technician"
            className="h-8 w-8 p-0 text-slate-600 hover:text-blue-600"
          >
            <UserCheck className="h-4 w-4" />
          </Button>
          <Link href={`/organization/work-orders/${row.id}`}>
            <Button variant="ghost" size="sm" title="View Details" className="h-8 w-8 p-0 text-slate-600 hover:text-blue-600">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={`/organization/work-orders/${row.id}/edit`}>
            <Button variant="ghost" size="sm" title="Edit Order" className="h-8 w-8 p-0 text-slate-600 hover:text-slate-900">
              <Edit className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteWorkOrder(row)}
            title="Delete Work Order"
            className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  // Table Columns: Technicians
  const techColumns: Column<any>[] = [
    {
      header: 'Technician',
      accessorKey: 'firstName',
      cell: (tech) => {
        const profile = tech.technicianProfile;
        return (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-blue-500/20">
              {tech.firstName?.[0] || 'T'}{tech.lastName?.[0] || ''}
            </div>
            <div>
              <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                {tech.firstName} {tech.lastName}
                {profile?.employeeId && (
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                    {profile.employeeId}
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Mail className="h-3 w-3" /> {tech.email}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Specialization & Skills',
      accessorKey: 'specialization',
      cell: (tech) => {
        const profile = tech.technicianProfile;
        return (
          <div className="space-y-1">
            <Badge variant="primary" className="text-xs">
              {profile?.specialization || 'General Maintenance'}
            </Badge>
            {profile?.skills && profile.skills.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {profile.skills.slice(0, 3).map((skill: string, idx: number) => (
                  <span key={idx} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded">
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      },
    },
    {
      header: 'Contact Phone',
      accessorKey: 'phone',
      cell: (tech) => (
        <div className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Phone className="h-3.5 w-3.5 text-slate-400" />
          {tech.phone || 'N/A'}
        </div>
      ),
    },
    {
      header: 'Shift & Hours',
      accessorKey: 'shift',
      cell: (tech) => {
        const profile = tech.technicianProfile;
        return (
          <div className="text-xs">
            <Badge variant="outline" className="text-[10px] uppercase font-semibold">
              {profile?.shift || 'General Shift'}
            </Badge>
            <div className="text-slate-400 text-[10px] mt-0.5">
              {profile?.workingHours || 'Standard Schedule'}
            </div>
          </div>
        );
      },
    },
    {
      header: 'Active Workload',
      accessorKey: 'workload',
      cell: (tech) => {
        const count = techWorkloadMap.get(tech.id) || 0;
        return (
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              count > 3 
                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' 
                : count > 0 
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400' 
                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
            }`}>
              {count} Active {count === 1 ? 'Order' : 'Orders'}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Actions',
      accessorKey: 'id',
      cell: (tech) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteTechnician(tech)}
            className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
            title="Remove Technician"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title="SmartiWork Dispatch & Maintenance Hub"
        description="Unified maintenance command center for work order management, technician dispatching, and field operations."
        action={
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsQuickCreateOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Log Work Order
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsOnboardTechModalOpen(true)}
              className="border-slate-300 dark:border-slate-700"
            >
              <HardHat className="h-4 w-4 mr-1.5 text-blue-600" />
              Onboard Technician
            </Button>
            <Link href="/organization/work-orders/new">
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex text-xs">
                Advanced Form
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Orders */}
        <Card className="border-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-lg ring-1 ring-slate-900/5 dark:ring-white/10 relative overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Total Orders
                </p>
                <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {workOrders.length}
                </h3>
                <p className="text-xs text-slate-400 mt-1">Lifecycle registry</p>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 text-white shadow-md">
                <Layers className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active / In-Progress */}
        <Card className="border-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-lg ring-1 ring-slate-900/5 dark:ring-white/10 relative overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Active Dispatched
                </p>
                <h3 className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
                  {activeOrdersCount}
                </h3>
                <p className="text-xs text-slate-400 mt-1">Under repair</p>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/25">
                <Activity className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Unassigned Orders */}
        <Card className="border-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-lg ring-1 ring-slate-900/5 dark:ring-white/10 relative overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Needs Dispatch
                </p>
                <h3 className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
                  {unassignedCount}
                </h3>
                <p className="text-xs text-slate-400 mt-1">Unassigned tickets</p>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/25">
                <Clock className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Critical Priority */}
        <Card className="border-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-lg ring-1 ring-slate-900/5 dark:ring-white/10 relative overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                  Critical / High
                </p>
                <h3 className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
                  {criticalCount}
                </h3>
                <p className="text-xs text-slate-400 mt-1">Urgent attention</p>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-md shadow-rose-500/25">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Field Technicians */}
        <Card className="border-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-lg ring-1 ring-slate-900/5 dark:ring-white/10 relative overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Technicians
                </p>
                <h3 className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                  {technicians.length}
                </h3>
                <p className="text-xs text-slate-400 mt-1">Active field crew</p>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25">
                <HardHat className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Control Bar: Tabs + Search & Filters */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-white/10 p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
          {/* Main Navigation Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeTab === 'orders'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Wrench className="h-4 w-4" />
              Dispatch Queue
              <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'orders' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}>
                {workOrders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('technicians')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeTab === 'technicians'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <HardHat className="h-4 w-4" />
              Technician Roster
              <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'technicians' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}>
                {technicians.length}
              </span>
            </button>
          </div>

          {/* Quick Stats or Refresh */}
          <div className="text-xs text-slate-400">
            {activeTab === 'orders' ? `${filteredWorkOrders.length} orders matching filters` : `${filteredTechnicians.length} technicians`}
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={activeTab === 'orders' ? 'Search title, #WO, staff, unit...' : 'Search technician, skill, ID...'}
                className="pl-9 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              />
            </div>

            {/* Priority Filter (only for orders tab) */}
            {activeTab === 'orders' && (
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="w-full sm:w-44 px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Priorities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            )}
          </div>

          {/* Status Pills (only for orders tab) */}
          {activeTab === 'orders' && (
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
                onClick={() => setStatusFilter('ACTIVE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === 'ACTIVE'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 hover:bg-blue-100'
                }`}
              >
                Active & Dispatched
              </button>
              <button
                onClick={() => setStatusFilter('UNASSIGNED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === 'UNASSIGNED'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 hover:bg-amber-100'
                }`}
              >
                Pending Dispatch
              </button>
              <button
                onClick={() => setStatusFilter('ON_HOLD')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === 'ON_HOLD'
                    ? 'bg-purple-600 text-white'
                    : 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 hover:bg-purple-100'
                }`}
              >
                On Hold
              </button>
              <button
                onClick={() => setStatusFilter('COMPLETED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === 'COMPLETED'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100'
                }`}
              >
                Completed
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'orders' ? (
        <DataTable
          columns={orderColumns}
          data={filteredWorkOrders}
          isLoading={isLoadingOrders}
          emptyMessage="No work orders match the selected filters. Log a new work order or reset filter options."
        />
      ) : (
        <DataTable
          columns={techColumns}
          data={filteredTechnicians}
          isLoading={isLoadingTechs}
          emptyMessage="No maintenance technicians registered. Click 'Onboard Technician' to add field personnel."
        />
      )}

      {/* Modal 1: Quick Dispatch / Assign Technician */}
      <Modal
        isOpen={isDispatchModalOpen}
        onClose={() => {
          setIsDispatchModalOpen(false);
          setSelectedOrderForDispatch(null);
        }}
        title="Dispatch Technician to Work Order"
      >
        {selectedOrderForDispatch && (
          <form onSubmit={handleExecuteDispatch} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50">
              <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                Target Task
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-base mt-0.5">
                {selectedOrderForDispatch.title}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={getPriorityBadgeVariant(selectedOrderForDispatch.priority) as any} className="text-[10px]">
                  {selectedOrderForDispatch.priority} Priority
                </Badge>
                <span className="text-xs text-slate-500">
                  {selectedOrderForDispatch.woNumber || `#WO-${selectedOrderForDispatch.id.slice(0, 6).toUpperCase()}`}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Select Technician from Roster *
              </label>
              <select
                value={selectedTechnicianId}
                onChange={(e) => setSelectedTechnicianId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">-- Choose Field Technician --</option>
                {technicians.map((t) => {
                  const profile = t.technicianProfile;
                  const activeOrders = techWorkloadMap.get(t.id) || 0;
                  return (
                    <option key={t.id} value={t.id}>
                      {t.firstName} {t.lastName} ({profile?.specialization || 'General'}) • {activeOrders} active
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDispatchModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdatingOrder || !selectedTechnicianId} className="bg-blue-600 text-white">
                {isUpdatingOrder ? 'Dispatching...' : 'Confirm Dispatch'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal 2: Onboard Technician */}
      <Modal
        isOpen={isOnboardTechModalOpen}
        onClose={() => setIsOnboardTechModalOpen(false)}
        title="Onboard Maintenance Technician"
      >
        <form onSubmit={handleOnboardTechnician} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                First Name *
              </label>
              <Input
                value={techForm.firstName}
                onChange={(e) => setTechForm({ ...techForm, firstName: e.target.value })}
                placeholder="e.g. Marcus"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Last Name
              </label>
              <Input
                value={techForm.lastName}
                onChange={(e) => setTechForm({ ...techForm, lastName: e.target.value })}
                placeholder="e.g. Vance"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Email Address *
              </label>
              <Input
                type="email"
                value={techForm.email}
                onChange={(e) => setTechForm({ ...techForm, email: e.target.value })}
                placeholder="tech@facility.com"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Phone Number
              </label>
              <Input
                value={techForm.phone}
                onChange={(e) => setTechForm({ ...techForm, phone: e.target.value })}
                placeholder="+1 (555) 029-3829"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Employee / Badge ID
              </label>
              <Input
                value={techForm.employeeId}
                onChange={(e) => setTechForm({ ...techForm, employeeId: e.target.value })}
                placeholder="TECH-104"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Shift Schedule
              </label>
              <select
                value={techForm.shift}
                onChange={(e) => setTechForm({ ...techForm, shift: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="General">General (8am - 5pm)</option>
                <option value="Morning">Morning Shift (6am - 2pm)</option>
                <option value="Evening">Evening Shift (2pm - 10pm)</option>
                <option value="Night">Night Shift (10pm - 6am)</option>
                <option value="On-Call">24/7 On-Call</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Core Specialization *
            </label>
            <select
              value={techForm.specialization}
              onChange={(e) => setTechForm({ ...techForm, specialization: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="Electrical & Power">Electrical & Power Systems</option>
              <option value="Plumbing & Sanitation">Plumbing & Sanitation</option>
              <option value="HVAC & Climate Control">HVAC & Climate Control</option>
              <option value="Elevators & Lifts">Elevators & Vertical Transport</option>
              <option value="Carpentry & Masonry">Carpentry & Structural</option>
              <option value="Fire & Safety Systems">Fire & Life Safety</option>
              <option value="General Maintenance">General Building Maintenance</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Certifications & Skills (Comma-separated)
            </label>
            <Input
              value={techForm.skills}
              onChange={(e) => setTechForm({ ...techForm, skills: e.target.value })}
              placeholder="e.g. EPA Universal, High Voltage, OSHA 30"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsOnboardTechModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreatingTech} className="bg-indigo-600 text-white">
              {isCreatingTech ? 'Onboarding...' : 'Complete Onboarding'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 3: Quick Create Work Order */}
      <Modal
        isOpen={isQuickCreateOpen}
        onClose={() => setIsQuickCreateOpen(false)}
        title="Log New Maintenance Work Order"
      >
        <form onSubmit={handleQuickCreateOrder} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Work Order Title *
            </label>
            <Input
              value={quickOrderForm.title}
              onChange={(e) => setQuickOrderForm({ ...quickOrderForm, title: e.target.value })}
              placeholder="e.g. Lobby Central AC Compressor Inspection"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Detailed Scope / Problem Description *
            </label>
            <textarea
              rows={3}
              value={quickOrderForm.description}
              onChange={(e) => setQuickOrderForm({ ...quickOrderForm, description: e.target.value })}
              placeholder="Describe symptoms, equipment tag, or resident issue..."
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Priority
              </label>
              <select
                value={quickOrderForm.priority}
                onChange={(e) => setQuickOrderForm({ ...quickOrderForm, priority: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="LOW">Low (Routine)</option>
                <option value="MEDIUM">Medium (Standard)</option>
                <option value="HIGH">High (Urgent)</option>
                <option value="CRITICAL">Critical (Immediate Hazard)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Due Date
              </label>
              <Input
                type="date"
                value={quickOrderForm.dueDate}
                onChange={(e) => setQuickOrderForm({ ...quickOrderForm, dueDate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Target Property / Unit
            </label>
            <select
              value={quickOrderForm.propertyNodeId}
              onChange={(e) => setQuickOrderForm({ ...quickOrderForm, propertyNodeId: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="">-- General Facility / No Specific Unit --</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name || u.unitNumber || 'Unit'} {u.parent?.name ? `(${u.parent.name})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Assign Field Technician (Optional)
            </label>
            <select
              value={quickOrderForm.assignedToId}
              onChange={(e) => setQuickOrderForm({ ...quickOrderForm, assignedToId: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="">-- Leave Unassigned (Queue for Dispatch) --</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.firstName} {t.lastName} ({t.technicianProfile?.specialization || 'General'})
                </option>
              ))}
            </select>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsQuickCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreatingOrder} className="bg-blue-600 text-white">
              {isCreatingOrder ? 'Creating...' : 'Create & Dispatch'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
