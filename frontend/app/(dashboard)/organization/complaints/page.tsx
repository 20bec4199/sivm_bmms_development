'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Wrench, AlertTriangle, CheckCircle2, Clock, FolderOpen, 
  Tag, Building, ArrowUpRight, Plus, Search, Filter, Trash2,
  Share2, ShieldCheck, PieChart, Activity, Sparkles, User,
  Calendar, Layers, Check, ExternalLink
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { RequireModule } from '@/components/auth/RequireModule';
import { useConfirm } from '@/providers/ConfirmProvider';
import { showWarning } from '@/store/slices/uiSlice';
import { 
  useGetComplaintsQuery, 
  useGetStatisticsQuery,
  useGetComplaintCategoriesQuery, 
  useCreateComplaintMutation,
  useDeleteComplaintMutation,
  useCreateComplaintCategoryMutation,
  useDeleteComplaintCategoryMutation
} from '@/services/complaintsApi';
import { useCreateWorkOrderMutation } from '@/services/workOrdersApi';
import { useGetUnitsQuery } from '@/services/organizationApi';
import { useGetUsersQuery } from '@/services/userApi';

export default function OrganizationComplaintsPage() {
  const dispatch = useDispatch();
  const confirm = useConfirm();
  const { user } = useSelector((state: any) => state.auth);
  const isAdminOrManager = user?.roles?.includes('ORGANIZATION_ADMIN') || 
                           user?.roles?.includes('BUILDING_MANAGER') || 
                           user?.roles?.includes('PLATFORM_SUPER_ADMIN');

  // Queries
  const { data: complaintsData, isLoading, refetch } = useGetComplaintsQuery({});
  const { data: categoriesData } = useGetComplaintCategoriesQuery({});
  const { data: statsData } = useGetStatisticsQuery();
  const { data: unitsData } = useGetUnitsQuery({});
  const { data: usersData } = useGetUsersQuery({ limit: 100 });

  // Mutations
  const [deleteComplaint] = useDeleteComplaintMutation();
  const [createComplaint, { isLoading: isCreatingComplaint }] = useCreateComplaintMutation();
  const [createWorkOrder, { isLoading: isCreatingWorkOrder }] = useCreateWorkOrderMutation();
  const [createCategory, { isLoading: isCreatingCategory }] = useCreateComplaintCategoryMutation();
  const [deleteCategory] = useDeleteComplaintCategoryMutation();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'QUEUE' | 'CATEGORIES' | 'ANALYTICS'>('QUEUE');

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');

  // Modal States
  const [isLogComplaintOpen, setIsLogComplaintOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isWorkOrderModalOpen, setIsWorkOrderModalOpen] = useState(false);
  const [selectedComplaintForWorkOrder, setSelectedComplaintForWorkOrder] = useState<any>(null);

  // Form States
  const [complaintForm, setComplaintForm] = useState({
    title: '',
    description: '',
    categoryId: '',
    propertyNodeId: '',
    priority: 'MEDIUM',
  });

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
  });

  const [workOrderForm, setWorkOrderForm] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    assignedToId: '',
    dueDate: '',
  });

  // Extract Clean Lists
  const complaints = useMemo(() => Array.isArray(complaintsData) ? complaintsData : (complaintsData?.data || []), [complaintsData]);
  const categories = useMemo(() => Array.isArray(categoriesData) ? categoriesData : (categoriesData?.data || []), [categoriesData]);
  const units = useMemo(() => Array.isArray(unitsData) ? unitsData : (unitsData?.data || []), [unitsData]);
  const technicians = useMemo(() => {
    const raw = usersData?.data || [];
    return raw.filter((u: any) => 
      u.userRoles?.some((r: any) => ['TECHNICIAN', 'ELECTRICIAN', 'PLUMBER', 'HVAC_TECHNICIAN'].includes(r.role?.name)) ||
      u.roles?.some((r: string) => ['TECHNICIAN', 'ELECTRICIAN', 'PLUMBER', 'HVAC_TECHNICIAN'].includes(r))
    );
  }, [usersData]);

  // Executive KPI Counts
  const totalCount = complaints.length;
  const unresolvedCount = complaints.filter((c: any) => !['RESOLVED', 'CLOSED', 'COMPLETED'].includes(c.status)).length;
  const inProgressCount = complaints.filter((c: any) => ['IN_PROGRESS', 'WORK_ORDER_CREATED', 'ASSIGNED'].includes(c.status)).length;
  const criticalCount = complaints.filter((c: any) => (c.priority === 'CRITICAL' || c.priority === 'HIGH') && !['RESOLVED', 'CLOSED', 'COMPLETED'].includes(c.status)).length;
  const resolvedCount = complaints.filter((c: any) => ['RESOLVED', 'CLOSED', 'COMPLETED'].includes(c.status)).length;
  const resolutionRate = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 100;

  // Filtered Complaints Queue
  const filteredComplaints = useMemo(() => {
    return complaints.filter((c: any) => {
      // 1. Search Query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const titleMatch = c.title?.toLowerCase().includes(q);
        const descMatch = c.description?.toLowerCase().includes(q);
        const creatorMatch = `${c.creator?.firstName || ''} ${c.creator?.lastName || ''}`.toLowerCase().includes(q);
        const unitMatch = c.propertyNode?.name?.toLowerCase().includes(q);
        if (!titleMatch && !descMatch && !creatorMatch && !unitMatch) return false;
      }

      // 2. Category Filter
      if (selectedCategory !== 'ALL') {
        const catName = c.category?.name || 'Uncategorized';
        if (catName !== selectedCategory) return false;
      }

      // 3. Status Filter
      if (selectedStatus === 'ACTIVE') {
        if (['RESOLVED', 'CLOSED', 'COMPLETED'].includes(c.status)) return false;
      } else if (selectedStatus === 'RESOLVED') {
        if (!['RESOLVED', 'CLOSED', 'COMPLETED'].includes(c.status)) return false;
      } else if (selectedStatus === 'WORK_ORDER_CREATED') {
        if (c.status !== 'WORK_ORDER_CREATED') return false;
      } else if (selectedStatus !== 'ALL') {
        if (c.status !== selectedStatus) return false;
      }

      // 4. Priority Filter
      if (selectedPriority !== 'ALL') {
        if (c.priority !== selectedPriority) return false;
      }

      return true;
    });
  }, [complaints, searchQuery, selectedCategory, selectedStatus, selectedPriority]);

  // Unique Category Names for filtering
  const categoryNames = useMemo(() => {
    const names = new Set<string>();
    categories.forEach((cat: any) => { if (cat.name) names.add(cat.name); });
    complaints.forEach((c: any) => { if (c.category?.name) names.add(c.category.name); });
    return Array.from(names);
  }, [categories, complaints]);

  // Handlers: Convert to Work Order
  const handleOpenWorkOrderModal = (complaint: any) => {
    setSelectedComplaintForWorkOrder(complaint);
    setWorkOrderForm({
      title: `Fix Issue: ${complaint.title}`,
      description: complaint.description || '',
      priority: complaint.priority || 'MEDIUM',
      assignedToId: complaint.assignedToId || (technicians[0]?.id || ''),
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days default
    });
    setIsWorkOrderModalOpen(true);
  };

  const handleCreateWorkOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workOrderForm.title.trim() || !selectedComplaintForWorkOrder) return;

    try {
      await createWorkOrder({
        title: workOrderForm.title,
        description: workOrderForm.description,
        priority: workOrderForm.priority,
        propertyNodeId: selectedComplaintForWorkOrder.propertyNodeId || undefined,
        assignedToId: workOrderForm.assignedToId || undefined,
        complaintId: selectedComplaintForWorkOrder.id,
        dueDate: workOrderForm.dueDate ? new Date(workOrderForm.dueDate).toISOString() : undefined,
      }).unwrap();

      dispatch(showWarning({ 
        title: 'Work Order Dispatched', 
        message: `Work order created and linked to Complaint #${selectedComplaintForWorkOrder.id.slice(0, 8)}.` 
      }));
      setIsWorkOrderModalOpen(false);
      refetch();
    } catch (err: any) {
      dispatch(showWarning({ 
        title: 'Dispatch Failed', 
        message: err?.data?.message || 'Failed to dispatch work order.' 
      }));
    }
  };

  // Handlers: Log Complaint
  const handleCreateComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintForm.title.trim() || !complaintForm.categoryId) {
      dispatch(showWarning({ title: 'Incomplete Details', message: 'Please provide an issue title and category.' }));
      return;
    }

    try {
      await createComplaint({
        title: complaintForm.title,
        description: complaintForm.description,
        categoryId: complaintForm.categoryId,
        propertyNodeId: complaintForm.propertyNodeId || undefined,
        priority: complaintForm.priority,
      }).unwrap();

      dispatch(showWarning({ title: 'Ticket Logged', message: 'Complaint has been registered in the system.' }));
      setIsLogComplaintOpen(false);
      setComplaintForm({ title: '', description: '', categoryId: '', propertyNodeId: '', priority: 'MEDIUM' });
      refetch();
    } catch (err: any) {
      dispatch(showWarning({ title: 'Submission Failed', message: err?.data?.message || 'Failed to log complaint.' }));
    }
  };

  // Handlers: Add Category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) return;

    try {
      await createCategory(categoryForm).unwrap();
      dispatch(showWarning({ title: 'Category Created', message: `Category "${categoryForm.name}" added.` }));
      setIsAddCategoryOpen(false);
      setCategoryForm({ name: '', description: '' });
    } catch (err: any) {
      dispatch(showWarning({ title: 'Creation Failed', message: err?.data?.message || 'Failed to create category.' }));
    }
  };

  // Handlers: Delete Category
  const handleDeleteCategory = async (category: any) => {
    const confirmed = await confirm({
      title: 'Remove Category',
      message: `Are you sure you want to delete category "${category.name}"? Existing complaints will retain their archived taxonomy.`,
      destructive: true,
      confirmText: 'Delete Category'
    });

    if (confirmed) {
      try {
        await deleteCategory(category.id).unwrap();
        dispatch(showWarning({ title: 'Removed', message: 'Category removed successfully.' }));
      } catch (err: any) {
        dispatch(showWarning({ title: 'Delete Failed', message: err?.data?.message || 'Could not delete category.' }));
      }
    }
  };

  // Queue Columns
  const queueColumns = [
    { 
      header: 'Complaint Details & Issue', 
      accessorKey: 'title',
      cell: (item: any) => (
        <div className="flex flex-col py-1">
          <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-1.5">
            <Wrench size={14} className="text-indigo-500 shrink-0 inline" />
            {item.title}
          </span>
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5 max-w-[280px]">
            {item.description || 'No additional issue description provided.'}
          </p>
          <span className="text-[10px] font-mono text-slate-400 mt-1">
            Logged on: {new Date(item.createdAt).toLocaleDateString()} at {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      )
    },
    { 
      header: 'Category Subsystem', 
      accessorKey: 'category.name',
      cell: (item: any) => (
        <Badge variant="outline" className="text-xs bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold border-slate-300 dark:border-slate-700">
          <Tag size={12} className="mr-1 text-indigo-500" />
          {item.category?.name || 'General Maintenance'}
        </Badge>
      )
    },
    { 
      header: 'Location & Resident', 
      accessorKey: 'propertyNode',
      cell: (item: any) => (
        <div className="text-xs">
          <div className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
            <Building size={13} />
            {item.propertyNode ? `Unit ${item.propertyNode.name}` : 'Common Area / Unassigned'}
          </div>
          <div className="text-slate-500 font-medium mt-0.5 flex items-center gap-1">
            <User size={12} className="text-slate-400" />
            {item.creator?.firstName ? `${item.creator.firstName} ${item.creator.lastName || ''}` : 'Resident Portal'}
          </div>
        </div>
      )
    },
    { 
      header: 'Priority', 
      accessorKey: 'priority',
      cell: (item: any) => {
        const p = item.priority;
        if (p === 'CRITICAL' || p === 'HIGH') {
          return <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border-rose-300 font-extrabold text-[11px] animate-pulse">🔥 {p}</Badge>;
        }
        if (p === 'MEDIUM') {
          return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300 font-bold text-[11px]">⚡ {p}</Badge>;
        }
        return <Badge className="bg-blue-50 text-blue-800 dark:bg-blue-950/30 dark:text-blue-300 border-blue-200 font-bold text-[11px]">🟢 {p || 'LOW'}</Badge>;
      }
    },
    { 
      header: 'Status & Pipeline', 
      accessorKey: 'status',
      cell: (item: any) => {
        const s = item.status;
        if (s === 'WORK_ORDER_CREATED') {
          return (
            <Badge className="bg-purple-100 text-purple-900 dark:bg-purple-950/50 dark:text-purple-300 border-purple-300 font-extrabold text-[11px]">
              🛠️ Work Order Active
            </Badge>
          );
        }
        if (s === 'RESOLVED' || s === 'CLOSED' || s === 'COMPLETED') {
          return (
            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-300 font-extrabold text-[11px]">
              ✓ {s === 'RESOLVED' ? 'Resolved' : 'Closed / Confirmed'}
            </Badge>
          );
        }
        if (s === 'IN_PROGRESS' || s === 'ASSIGNED') {
          return (
            <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-300 font-extrabold text-[11px]">
              ⚙️ In Progress
            </Badge>
          );
        }
        return (
          <Badge className="bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-300 border-amber-400 font-extrabold text-[11px]">
            ⏳ Open Request
          </Badge>
        );
      }
    },
    {
      header: 'Actions',
      accessorKey: 'actions',
      cell: (item: any) => {
        const handleDelete = async () => {
          const confirmed = await confirm({
            title: 'Archive & Delete Complaint',
            message: `Are you sure you want to permanently delete complaint "${item.title}"?`,
            destructive: true,
            confirmText: 'Permanently Remove'
          });

          if (confirmed) {
            try {
              await deleteComplaint(item.id).unwrap();
              dispatch(showWarning({ title: 'Complaint Deleted', message: 'Ticket removed from building ledger.' }));
              refetch();
            } catch (err: any) {
              dispatch(showWarning({ title: 'Error', message: err?.data?.message || 'Failed to delete complaint.' }));
            }
          }
        };

        const canDispatchWorkOrder = !['RESOLVED', 'CLOSED', 'COMPLETED', 'WORK_ORDER_CREATED'].includes(item.status);

        return (
          <div className="flex items-center space-x-1.5">
            {canDispatchWorkOrder && isAdminOrManager && (
              <button 
                onClick={() => handleOpenWorkOrderModal(item)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 rounded-lg text-xs font-extrabold transition-all border border-purple-200 dark:border-purple-800"
                title="Dispatch Technician Work Order"
              >
                <Wrench size={13} />
                Dispatch
              </button>
            )}
            <Link 
              href={`/organization/complaints/${item.id}`} 
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-lg text-xs font-extrabold transition-all border border-indigo-200 dark:border-indigo-800"
            >
              Inspect <ArrowUpRight size={13} />
            </Link>
            {isAdminOrManager && (
              <button 
                onClick={handleDelete}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                title="Delete Complaint"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        );
      }
    },
  ];

  // Category Columns
  const categoryColumns = [
    {
      header: 'Category Subsystem',
      accessorKey: 'name',
      cell: (cat: any) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Tag size={16} />
          </div>
          <div>
            <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">{cat.name}</div>
            <div className="text-xs text-slate-400">ID: {cat.id?.slice(0, 8)}...</div>
          </div>
        </div>
      )
    },
    {
      header: 'Description & Scope',
      accessorKey: 'description',
      cell: (cat: any) => (
        <span className="text-xs text-slate-600 dark:text-slate-300">
          {cat.description || 'General building maintenance issue scope.'}
        </span>
      )
    },
    {
      header: 'Active Registered Tickets',
      accessorKey: 'tickets',
      cell: (cat: any) => {
        const count = complaints.filter((c: any) => c.category?.id === cat.id || c.categoryId === cat.id).length;
        return (
          <Badge variant="outline" className="text-xs font-bold bg-slate-50 dark:bg-slate-800">
            {count} tickets linked
          </Badge>
        );
      }
    },
    {
      header: 'Created Date',
      accessorKey: 'createdAt',
      cell: (cat: any) => (
        <span className="text-xs font-mono text-slate-400">
          {cat.createdAt ? new Date(cat.createdAt).toLocaleDateString() : 'System Default'}
        </span>
      )
    },
    {
      header: 'Actions',
      accessorKey: 'actions',
      cell: (cat: any) => (
        isAdminOrManager ? (
          <button
            onClick={() => handleDeleteCategory(cat)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
            title="Delete Category"
          >
            <Trash2 size={16} />
          </button>
        ) : null
      )
    }
  ];

  return (
    <RequireModule moduleCode="COMPLAINT_MANAGEMENT">
      <div className="space-y-6 max-w-[1500px] mx-auto pb-12">
        {/* Header */}
        <PageHeader 
          title="SmartiCare Complaints & Escalation Center" 
          description="Incident triage, automated work order escalation, tenant SLA resolution monitoring, and category routing."
          action={
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => setIsAddCategoryOpen(true)}
                variant="outline" 
                className="border-slate-300 dark:border-slate-700 font-bold text-xs"
              >
                <FolderOpen className="w-4 h-4 mr-1.5 text-indigo-500" />
                Add Category
              </Button>
              <Button 
                onClick={() => setIsLogComplaintOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Log Incident Ticket
              </Button>
            </div>
          }
        />

        {/* 5 Top Executive KPI Metrics Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-900 to-indigo-950 text-white shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-300">Total Registered Issues</p>
              <h4 className="text-2xl font-black mt-1">{totalCount} Tickets</h4>
              <p className="text-[11px] text-indigo-300 mt-0.5">Lifetime volume</p>
            </div>
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md">
              <Activity size={24} className="text-indigo-400" />
            </div>
          </Card>

          <Card 
            onClick={() => { setActiveTab('QUEUE'); setSelectedStatus('ACTIVE'); setSelectedPriority('ALL'); }}
            className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between cursor-pointer hover:border-amber-400 transition-all group"
          >
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Open & Unassigned</p>
              <h4 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{unresolvedCount} Pending</h4>
              <p className="text-[11px] text-slate-400 group-hover:text-amber-500 transition-colors">Requires triage</p>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl">
              <Clock size={24} className="text-amber-500" />
            </div>
          </Card>

          <Card 
            onClick={() => { setActiveTab('QUEUE'); setSelectedStatus('WORK_ORDER_CREATED'); setSelectedPriority('ALL'); }}
            className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between cursor-pointer hover:border-purple-400 transition-all group"
          >
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Under Active Repair</p>
              <h4 className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">{inProgressCount} Dispatched</h4>
              <p className="text-[11px] text-slate-400 group-hover:text-purple-500 transition-colors">Work orders linked</p>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl">
              <Wrench size={24} className="text-purple-500" />
            </div>
          </Card>

          <Card 
            onClick={() => { setActiveTab('QUEUE'); setSelectedPriority('CRITICAL'); setSelectedStatus('ACTIVE'); }}
            className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between cursor-pointer hover:border-rose-400 transition-all group"
          >
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Critical / High Severity</p>
              <h4 className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{criticalCount} Escalated</h4>
              <p className="text-[11px] text-rose-500 font-bold animate-pulse">Immediate priority</p>
            </div>
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl">
              <AlertTriangle size={24} className="text-rose-500" />
            </div>
          </Card>

          <Card 
            onClick={() => { setActiveTab('QUEUE'); setSelectedStatus('RESOLVED'); setSelectedPriority('ALL'); }}
            className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between cursor-pointer hover:border-emerald-400 transition-all group"
          >
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Resolution Health</p>
              <h4 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{resolutionRate}%</h4>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">{resolvedCount} resolved tickets</p>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl">
              <CheckCircle2 size={24} className="text-emerald-500" />
            </div>
          </Card>
        </div>

        {/* Tab Selection Header */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
          <button
            onClick={() => setActiveTab('QUEUE')}
            className={`pb-3 text-sm font-extrabold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'QUEUE'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Layers size={18} />
            Complaints Queue ({filteredComplaints.length})
          </button>
          <button
            onClick={() => setActiveTab('CATEGORIES')}
            className={`pb-3 text-sm font-extrabold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'CATEGORIES'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <FolderOpen size={18} />
            Category Taxonomy ({categories.length})
          </button>
          <button
            onClick={() => setActiveTab('ANALYTICS')}
            className={`pb-3 text-sm font-extrabold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'ANALYTICS'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <PieChart size={18} />
            Resolution Analytics & SLA
          </button>
        </div>

        {/* Tab 1: Queue */}
        {activeTab === 'QUEUE' && (
          <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
            {/* Filter Toolbar */}
            <CardContent className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row items-center justify-between gap-4">
              {/* Search bar */}
              <div className="relative flex-1 w-full max-w-md">
                <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by ticket title, description, resident, or unit..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 text-xs font-medium rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-inner"
                />
              </div>

              {/* Select filters */}
              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                {/* Category Filter */}
                <div className="flex items-center space-x-1.5">
                  <Filter className="w-4 h-4 text-indigo-500 shrink-0" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="h-10 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="ALL">All Maintenance Categories</option>
                    {categoryNames.map((catName, idx) => (
                      <option key={idx} value={catName}>📁 {catName}</option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="h-10 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="ALL">Status: All Tickets</option>
                  <option value="ACTIVE">⚡ Active & Unresolved</option>
                  <option value="WORK_ORDER_CREATED">🛠️ Work Order Dispatched</option>
                  <option value="OPEN">⏳ Open Request</option>
                  <option value="IN_PROGRESS">⚙️ In-Progress / Assigned</option>
                  <option value="RESOLVED">✅ Resolved / Closed</option>
                </select>

                {/* Priority Filter */}
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="h-10 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="ALL">Priority: Any Priority</option>
                  <option value="CRITICAL">🔥 Critical Only</option>
                  <option value="HIGH">⚠️ High Priority</option>
                  <option value="MEDIUM">⚡ Medium</option>
                  <option value="LOW">🟢 Low</option>
                </select>

                {(selectedCategory !== 'ALL' || selectedStatus !== 'ALL' || selectedPriority !== 'ALL' || searchQuery !== '') && (
                  <button
                    onClick={() => { setSelectedCategory('ALL'); setSelectedStatus('ALL'); setSelectedPriority('ALL'); setSearchQuery(''); }}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline px-2"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            </CardContent>

            {/* Table */}
            <CardContent className="p-0">
              <DataTable 
                data={filteredComplaints} 
                columns={queueColumns} 
                isLoading={isLoading} 
                mobileRender={(item: any) => (
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col gap-3">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-sm">
                          <Wrench size={14} className="text-indigo-500 shrink-0" />
                          {item.title}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                          {item.description || 'No additional issue description provided.'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs mt-1">
                      <div>
                        <span className="text-slate-500 block mb-1">Status</span>
                        <Badge className="text-xs">
                          {item.status}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-slate-500 block mb-1">Priority</span>
                        <Badge className="text-xs">
                          {item.priority || 'LOW'}
                        </Badge>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center mt-1">
                      <span className="text-xs font-bold text-indigo-600 flex items-center gap-1">
                        <Building size={13} /> Unit {item.propertyNode?.name || 'Common'}
                      </span>
                      <div className="flex items-center gap-2">
                        {isAdminOrManager && !['RESOLVED', 'CLOSED', 'COMPLETED', 'WORK_ORDER_CREATED'].includes(item.status) && (
                          <button 
                            onClick={() => handleOpenWorkOrderModal(item)}
                            className="px-2.5 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-extrabold flex items-center gap-1"
                          >
                            <Wrench size={12} /> Dispatch
                          </button>
                        )}
                        <Link 
                          href={`/organization/complaints/${item.id}`} 
                          className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-extrabold flex items-center gap-1"
                        >
                          Inspect <ArrowUpRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              />
            </CardContent>
          </Card>
        )}

        {/* Tab 2: Category Taxonomy */}
        {activeTab === 'CATEGORIES' && (
          <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
            <CardContent className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Complaint & Issue Subsystems</h3>
                <p className="text-xs text-slate-500">Categories route resident trouble tickets to corresponding maintenance and engineering queues.</p>
              </div>
              <Button 
                onClick={() => setIsAddCategoryOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
              >
                <Plus size={14} className="mr-1" /> Add Category
              </Button>
            </CardContent>
            <CardContent className="p-0">
              <DataTable 
                data={categories} 
                columns={categoryColumns} 
                isLoading={isLoading} 
              />
            </CardContent>
          </Card>
        )}

        {/* Tab 3: Analytics */}
        {activeTab === 'ANALYTICS' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Status Breakdown */}
              <Card className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2 mb-4">
                  <Activity size={18} className="text-indigo-500" />
                  Ticket Pipeline Distribution
                </h3>
                <div className="space-y-3">
                  {[
                    { label: 'Open / New Requests', count: complaints.filter((c: any) => ['NEW', 'OPEN'].includes(c.status)).length, color: 'bg-amber-500' },
                    { label: 'Work Orders Dispatched', count: complaints.filter((c: any) => c.status === 'WORK_ORDER_CREATED').length, color: 'bg-purple-500' },
                    { label: 'In-Progress / Assigned', count: complaints.filter((c: any) => ['IN_PROGRESS', 'ASSIGNED'].includes(c.status)).length, color: 'bg-indigo-500' },
                    { label: 'Resolved / Closed', count: resolvedCount, color: 'bg-emerald-500' },
                  ].map((stat, i) => {
                    const pct = totalCount > 0 ? Math.round((stat.count / totalCount) * 100) : 0;
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                          <span>{stat.label}</span>
                          <span>{stat.count} ({pct}%)</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full ${stat.color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Priority Breakdown */}
              <Card className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2 mb-4">
                  <AlertTriangle size={18} className="text-rose-500" />
                  Severity & Urgency Slicing
                </h3>
                <div className="space-y-3">
                  {[
                    { label: 'Critical Urgency', count: complaints.filter((c: any) => c.priority === 'CRITICAL').length, color: 'bg-rose-600' },
                    { label: 'High Priority', count: complaints.filter((c: any) => c.priority === 'HIGH').length, color: 'bg-orange-500' },
                    { label: 'Medium Priority', count: complaints.filter((c: any) => c.priority === 'MEDIUM').length, color: 'bg-amber-500' },
                    { label: 'Low / Minor', count: complaints.filter((c: any) => c.priority === 'LOW' || !c.priority).length, color: 'bg-blue-500' },
                  ].map((stat, i) => {
                    const pct = totalCount > 0 ? Math.round((stat.count / totalCount) * 100) : 0;
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                          <span>{stat.label}</span>
                          <span>{stat.count} ({pct}%)</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full ${stat.color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* SLA Resolution Efficiency Card */}
            <Card className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-sm">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                  <h4 className="text-lg font-black flex items-center gap-2">
                    <Sparkles className="text-indigo-400" size={20} />
                    SLA Resolution Guarantee
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 max-w-xl">
                    SmartiCare automatically escalates tickets exceeding 48 hours without technician assignment. Work order dispatch shifts ticket status to active repair in real-time.
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-black text-emerald-400">{resolutionRate}%</div>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-0.5">Success Rate</div>
                  </div>
                  <div className="text-center border-l border-white/10 pl-6">
                    <div className="text-3xl font-black text-indigo-400">{inProgressCount}</div>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-0.5">Active Dispatches</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Modal 1: Convert Complaint to Work Order */}
        <Modal 
          isOpen={isWorkOrderModalOpen} 
          onClose={() => setIsWorkOrderModalOpen(false)}
          title={`Dispatch Work Order for Ticket #${selectedComplaintForWorkOrder?.id?.slice(0, 8)}`}
        >
          <form onSubmit={handleCreateWorkOrder} className="space-y-4 pt-2">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800/60 text-xs">
              <span className="font-bold text-indigo-900 dark:text-indigo-300 block">Linked Complaint:</span>
              <p className="text-slate-600 dark:text-slate-400 mt-0.5">{selectedComplaintForWorkOrder?.title}</p>
              <div className="mt-1 flex items-center gap-3 text-slate-500 font-mono text-[11px]">
                <span>Unit: {selectedComplaintForWorkOrder?.propertyNode?.name || 'Common'}</span>
                <span>Category: {selectedComplaintForWorkOrder?.category?.name || 'General'}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Work Order Title *</label>
              <Input
                value={workOrderForm.title}
                onChange={(e) => setWorkOrderForm({ ...workOrderForm, title: e.target.value })}
                required
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Priority Level</label>
                <select
                  value={workOrderForm.priority}
                  onChange={(e) => setWorkOrderForm({ ...workOrderForm, priority: e.target.value })}
                  className="w-full h-10 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                >
                  <option value="LOW">🟢 Low</option>
                  <option value="MEDIUM">⚡ Medium</option>
                  <option value="HIGH">⚠️ High</option>
                  <option value="CRITICAL">🔥 Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Due Date</label>
                <Input
                  type="date"
                  value={workOrderForm.dueDate}
                  onChange={(e) => setWorkOrderForm({ ...workOrderForm, dueDate: e.target.value })}
                  className="text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Assign Technician</label>
              <select
                value={workOrderForm.assignedToId}
                onChange={(e) => setWorkOrderForm({ ...workOrderForm, assignedToId: e.target.value })}
                className="w-full h-10 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
              >
                <option value="">Unassigned (Queue for technicians)</option>
                {technicians.map((t: any) => (
                  <option key={t.id} value={t.id}>
                    👤 {t.firstName} {t.lastName} ({t.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Instructions / Scope</label>
              <textarea
                value={workOrderForm.description}
                onChange={(e) => setWorkOrderForm({ ...workOrderForm, description: e.target.value })}
                rows={3}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Specific directions for the repair technician..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" onClick={() => setIsWorkOrderModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isCreatingWorkOrder}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs"
              >
                {isCreatingWorkOrder ? 'Dispatching...' : 'Confirm & Dispatch Work Order'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal 2: Log Complaint */}
        <Modal 
          isOpen={isLogComplaintOpen} 
          onClose={() => setIsLogComplaintOpen(false)}
          title="Log Incident / Resident Complaint"
        >
          <form onSubmit={handleCreateComplaint} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Issue Title *</label>
              <Input
                placeholder="e.g. Water leak in bathroom ceiling"
                value={complaintForm.title}
                onChange={(e) => setComplaintForm({ ...complaintForm, title: e.target.value })}
                required
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Category *</label>
                <select
                  value={complaintForm.categoryId}
                  onChange={(e) => setComplaintForm({ ...complaintForm, categoryId: e.target.value })}
                  required
                  className="w-full h-10 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                >
                  <option value="">Select Subsystem...</option>
                  {categories.map((c: any) => (
                    <option key={c.id} value={c.id}>📁 {c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Priority</label>
                <select
                  value={complaintForm.priority}
                  onChange={(e) => setComplaintForm({ ...complaintForm, priority: e.target.value })}
                  className="w-full h-10 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                >
                  <option value="LOW">🟢 Low</option>
                  <option value="MEDIUM">⚡ Medium</option>
                  <option value="HIGH">⚠️ High</option>
                  <option value="CRITICAL">🔥 Critical</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Unit Location</label>
              <select
                value={complaintForm.propertyNodeId}
                onChange={(e) => setComplaintForm({ ...complaintForm, propertyNodeId: e.target.value })}
                className="w-full h-10 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
              >
                <option value="">Common Area / Facility</option>
                {units.map((u: any) => (
                  <option key={u.id} value={u.id}>🏢 Unit {u.name || u.unitNumber}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Issue Description</label>
              <textarea
                value={complaintForm.description}
                onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })}
                rows={3}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Describe the defect, location details, and urgency..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" onClick={() => setIsLogComplaintOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isCreatingComplaint}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
              >
                {isCreatingComplaint ? 'Submitting...' : 'Register Complaint'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal 3: Add Category */}
        <Modal 
          isOpen={isAddCategoryOpen} 
          onClose={() => setIsAddCategoryOpen(false)}
          title="New Complaint Routing Category"
        >
          <form onSubmit={handleCreateCategory} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Category Name *</label>
              <Input
                placeholder="e.g. Electrical, HVAC, Plumbing, Elevator"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                required
                className="text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Description</label>
              <textarea
                placeholder="Scope and guidelines for this complaint category..."
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                rows={3}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" onClick={() => setIsAddCategoryOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isCreatingCategory}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
              >
                {isCreatingCategory ? 'Saving...' : 'Create Category'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </RequireModule>
  );
}
