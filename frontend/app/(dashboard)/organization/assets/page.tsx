'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Box, AlertTriangle, ShieldCheck, ShieldAlert, Wrench, 
  DollarSign, Search, Trash2, Tag, Calendar, QrCode, 
  FileText, Plus, ExternalLink, Copy, Check, Printer, 
  Download, RefreshCw, Layers, Activity, Sparkles, User,
  Filter, Eye, Clock, CheckCircle2, ChevronRight
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { DataTable } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { RequireModule } from '@/components/auth/RequireModule';
import { useConfirm } from '@/providers/ConfirmProvider';
import { showWarning } from '@/store/slices/uiSlice';
import { 
  useGetAssetsQuery, 
  useGetWarrantyAlertsQuery,
  useGetAssetCategoriesQuery,
  useCreateAssetMutation, 
  useUpdateAssetMutation,
  useDeleteAssetMutation,
  useCreateAssetCategoryMutation,
  useDeleteAssetCategoryMutation,
  useAddAssetDocumentMutation,
  useRemoveAssetDocumentMutation,
  useGetAssetByIdQuery
} from '@/services/assetsApi';
import { useCreateWorkOrderMutation } from '@/services/workOrdersApi';
import { useGetUsersQuery } from '@/services/userApi';

export default function OrganizationAssetsPage() {
  const dispatch = useDispatch();
  const confirm = useConfirm();
  const { user } = useSelector((state: any) => state.auth);
  const isAdminOrManager = user?.roles?.includes('ORGANIZATION_ADMIN') || 
                           user?.roles?.includes('BUILDING_MANAGER') || 
                           user?.roles?.includes('PLATFORM_SUPER_ADMIN');

  // Active Tab
  const [activeTab, setActiveTab] = useState<'INVENTORY' | 'WARRANTY' | 'CATEGORIES'>('INVENTORY');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);
  const [isWorkOrderModalOpen, setIsWorkOrderModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [copiedTag, setCopiedTag] = useState(false);

  // Queries
  const { data: assetsResponse, isLoading: isLoadingAssets, refetch: refetchAssets } = useGetAssetsQuery({});
  const { data: warrantyResponse, isLoading: isLoadingWarranty } = useGetWarrantyAlertsQuery();
  const { data: categoriesResponse, isLoading: isLoadingCategories, refetch: refetchCategories } = useGetAssetCategoriesQuery({});
  const { data: usersData } = useGetUsersQuery({ limit: 100 });
  
  // Specific asset query for real-time documents drawer
  const { data: detailedAsset, refetch: refetchDetailedAsset } = useGetAssetByIdQuery(
    selectedAsset?.id || '', 
    { skip: !selectedAsset?.id || !isDocsModalOpen }
  );

  // Mutations
  const [createAsset, { isLoading: isCreating }] = useCreateAssetMutation();
  const [updateAsset] = useUpdateAssetMutation();
  const [deleteAsset] = useDeleteAssetMutation();
  const [createAssetCategory, { isLoading: isCreatingCategory }] = useCreateAssetCategoryMutation();
  const [deleteAssetCategory] = useDeleteAssetCategoryMutation();
  const [addAssetDocument, { isLoading: isAddingDoc }] = useAddAssetDocumentMutation();
  const [removeAssetDocument] = useRemoveAssetDocumentMutation();
  const [createWorkOrder, { isLoading: isCreatingWorkOrder }] = useCreateWorkOrderMutation();

  // Create Asset Form State
  const [assetForm, setAssetForm] = useState({
    name: '',
    tagNumber: '',
    categoryId: '',
    serialNumber: '',
    purchasePrice: '',
    warrantyExpiry: '',
    warrantyDetails: '',
    expectedLifespanYears: '10',
    locationNotes: '',
    status: 'ACTIVE',
  });

  // Category Form State
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
  });

  // Document Form State
  const [docForm, setDocForm] = useState({
    title: '',
    fileUrl: '',
  });

  // Work Order Form State
  const [workOrderForm, setWorkOrderForm] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    assignedToId: '',
    dueDate: '',
  });

  // Extract Clean Lists
  const assets = useMemo(() => Array.isArray(assetsResponse) ? assetsResponse : (assetsResponse?.data || []), [assetsResponse]);
  const warrantyAlerts = useMemo(() => Array.isArray(warrantyResponse) ? warrantyResponse : (warrantyResponse?.data || []), [warrantyResponse]);
  const categories = useMemo(() => Array.isArray(categoriesResponse) ? categoriesResponse : (categoriesResponse?.data || []), [categoriesResponse]);
  
  const technicians = useMemo(() => {
    const raw = usersData?.data || [];
    return raw.filter((u: any) => 
      u.userRoles?.some((r: any) => ['TECHNICIAN', 'ELECTRICIAN', 'PLUMBER', 'HVAC_TECHNICIAN'].includes(r.role?.name)) ||
      u.roles?.some((r: string) => ['TECHNICIAN', 'ELECTRICIAN', 'PLUMBER', 'HVAC_TECHNICIAN'].includes(r))
    );
  }, [usersData]);

  // Executive KPI Counts
  const totalAssets = assets.length;
  const activeAssets = assets.filter((a: any) => a.status === 'ACTIVE' || a.status === 'OPERATIONAL').length;
  const operationalRate = totalAssets > 0 ? Math.round((activeAssets / totalAssets) * 100) : 100;
  const inRepairCount = assets.filter((a: any) => a.status === 'IN_REPAIR').length;
  const warrantyWarningCount = warrantyAlerts.length;
  const totalValuation = assets.reduce((sum: number, a: any) => sum + (parseFloat(a.purchasePrice || a.purchaseCost) || 0), 0);

  // Auto-generate tag identifier
  const generateTag = () => {
    const prefix = assetForm.categoryId 
      ? (categories.find((c: any) => c.id === assetForm.categoryId)?.name?.slice(0, 3).toUpperCase() || 'AST')
      : 'AST';
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setAssetForm({ ...assetForm, tagNumber: `${prefix}-${new Date().getFullYear()}-${randomNum}` });
  };

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    return assets.filter((a: any) => {
      // 1. Search Query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const nameMatch = a.name?.toLowerCase().includes(q);
        const tagMatch = (a.tagNumber || a.serialNumber)?.toLowerCase().includes(q);
        const locMatch = (a.location || a.locationNotes)?.toLowerCase().includes(q);
        if (!nameMatch && !tagMatch && !locMatch) return false;
      }

      // 2. Category Filter
      if (selectedCategoryFilter !== 'ALL') {
        const catId = a.categoryId || a.category?.id;
        const catName = a.category?.name || a.categoryName;
        if (catId !== selectedCategoryFilter && catName !== selectedCategoryFilter) return false;
      }

      // 3. Status Filter
      if (selectedStatusFilter !== 'ALL') {
        if (selectedStatusFilter === 'ACTIVE' && a.status !== 'ACTIVE' && a.status !== 'OPERATIONAL') return false;
        if (selectedStatusFilter === 'IN_REPAIR' && a.status !== 'IN_REPAIR') return false;
        if (selectedStatusFilter === 'INACTIVE' && a.status !== 'INACTIVE') return false;
        if (selectedStatusFilter === 'DISPOSED' && a.status !== 'DISPOSED') return false;
      }

      return true;
    });
  }, [assets, searchQuery, selectedCategoryFilter, selectedStatusFilter]);

  // Handlers: Asset Registration
  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetForm.name.trim() || !assetForm.tagNumber.trim()) {
      dispatch(showWarning({ title: 'Missing Information', message: 'Equipment name and asset tag are required.' }));
      return;
    }

    try {
      await createAsset({
        name: assetForm.name,
        tagNumber: assetForm.tagNumber,
        categoryId: assetForm.categoryId || undefined,
        serialNumber: assetForm.serialNumber || undefined,
        purchasePrice: assetForm.purchasePrice ? parseFloat(assetForm.purchasePrice) : undefined,
        warrantyExpiry: assetForm.warrantyExpiry ? new Date(assetForm.warrantyExpiry).toISOString() : undefined,
        warrantyDetails: assetForm.warrantyDetails || undefined,
        expectedLifespanYears: assetForm.expectedLifespanYears ? parseInt(assetForm.expectedLifespanYears) : undefined,
        locationNotes: assetForm.locationNotes || undefined,
        status: assetForm.status,
      }).unwrap();

      dispatch(showWarning({ title: 'Success', message: `Equipment "${assetForm.name}" cataloged into inventory!` }));
      setIsCreateModalOpen(false);
      setAssetForm({
        name: '',
        tagNumber: '',
        categoryId: '',
        serialNumber: '',
        purchasePrice: '',
        warrantyExpiry: '',
        warrantyDetails: '',
        expectedLifespanYears: '10',
        locationNotes: '',
        status: 'ACTIVE',
      });
      refetchAssets();
    } catch (err: any) {
      dispatch(showWarning({ title: 'Registration Failed', message: err?.data?.message || 'Failed to catalog asset.' }));
    }
  };

  // Handlers: Fast Status Toggle
  const handleStatusChange = async (assetId: string, newStatus: string) => {
    try {
      await updateAsset({ id: assetId, data: { status: newStatus } }).unwrap();
      dispatch(showWarning({ title: 'Status Updated', message: `Asset operational state changed to ${newStatus}.` }));
      refetchAssets();
    } catch (err: any) {
      dispatch(showWarning({ title: 'Update Failed', message: err?.data?.message || 'Failed to update status.' }));
    }
  };

  // Handlers: Asset Decommission / Delete
  const handleDeleteAsset = async (asset: any) => {
    const isConfirmed = await confirm({
      title: 'Decommission Equipment Asset',
      message: `Are you certain you wish to remove "${asset.name}" (Tag: ${asset.tagNumber || asset.id.slice(0, 8)}) from active inventory? Linked logs will be permanently archived.`,
      confirmText: 'Remove Asset',
      destructive: true,
    });

    if (isConfirmed) {
      try {
        await deleteAsset(asset.id).unwrap();
        dispatch(showWarning({ title: 'Success', message: 'Asset removed from active inventory.' }));
        refetchAssets();
      } catch (err: any) {
        dispatch(showWarning({ title: 'Error', message: err?.data?.message || 'Failed to remove asset.' }));
      }
    }
  };

  // Handlers: Open Modals
  const openQrModal = (asset: any) => {
    setSelectedAsset(asset);
    setIsQrModalOpen(true);
  };

  const openDocsModal = (asset: any) => {
    setSelectedAsset(asset);
    setIsDocsModalOpen(true);
  };

  const openWorkOrderModal = (asset: any) => {
    setSelectedAsset(asset);
    setWorkOrderForm({
      title: `Service Asset: ${asset.name} (${asset.tagNumber || 'AST'})`,
      description: `Scheduled maintenance inspection for ${asset.name} located at ${asset.location || asset.locationNotes || 'Central Facility'}. Tag: ${asset.tagNumber || 'N/A'}. Serial: ${asset.serialNumber || 'N/A'}.`,
      priority: 'MEDIUM',
      assignedToId: technicians[0]?.id || '',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
    setIsWorkOrderModalOpen(true);
  };

  // Handlers: Add Document Link
  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docForm.title.trim() || !docForm.fileUrl.trim() || !selectedAsset) return;

    try {
      await addAssetDocument({
        assetId: selectedAsset.id,
        title: docForm.title.trim(),
        fileUrl: docForm.fileUrl.trim(),
      }).unwrap();

      dispatch(showWarning({ title: 'Document Attached', message: `"${docForm.title}" linked to asset.` }));
      setDocForm({ title: '', fileUrl: '' });
      refetchDetailedAsset();
      refetchAssets();
    } catch (err: any) {
      dispatch(showWarning({ title: 'Failed to Attach', message: err?.data?.message || 'Could not attach document.' }));
    }
  };

  // Handlers: Remove Document Link
  const handleRemoveDocument = async (docId: string) => {
    try {
      await removeAssetDocument({ id: docId, assetId: selectedAsset?.id }).unwrap();
      dispatch(showWarning({ title: 'Document Removed', message: 'Document detached from asset.' }));
      refetchDetailedAsset();
      refetchAssets();
    } catch (err: any) {
      dispatch(showWarning({ title: 'Failed', message: err?.data?.message || 'Failed to remove document.' }));
    }
  };

  // Handlers: Dispatch Work Order
  const handleDispatchWorkOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workOrderForm.title.trim() || !selectedAsset) return;

    try {
      await createWorkOrder({
        title: workOrderForm.title,
        description: workOrderForm.description,
        priority: workOrderForm.priority,
        assignedToId: workOrderForm.assignedToId || undefined,
        dueDate: workOrderForm.dueDate ? new Date(workOrderForm.dueDate).toISOString() : undefined,
      }).unwrap();

      dispatch(showWarning({ title: 'Work Order Dispatched', message: `Service order spawned for ${selectedAsset.name}.` }));
      setIsWorkOrderModalOpen(false);
    } catch (err: any) {
      dispatch(showWarning({ title: 'Dispatch Failed', message: err?.data?.message || 'Failed to dispatch work order.' }));
    }
  };

  // Handlers: Add Category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) return;

    try {
      await createAssetCategory(categoryForm).unwrap();
      dispatch(showWarning({ title: 'Category Created', message: `Category "${categoryForm.name}" registered.` }));
      setIsCategoryModalOpen(false);
      setCategoryForm({ name: '', description: '' });
      refetchCategories();
    } catch (err: any) {
      dispatch(showWarning({ title: 'Failed', message: err?.data?.message || 'Could not create category.' }));
    }
  };

  // Handlers: Delete Category
  const handleDeleteCategory = async (cat: any) => {
    const isConfirmed = await confirm({
      title: 'Remove Category',
      message: `Are you sure you want to delete category "${cat.name}"? Existing equipment will retain their archived taxonomy.`,
      confirmText: 'Delete Category',
      destructive: true,
    });

    if (isConfirmed) {
      try {
        await deleteAssetCategory(cat.id).unwrap();
        dispatch(showWarning({ title: 'Category Removed', message: 'Classification removed.' }));
        refetchCategories();
      } catch (err: any) {
        dispatch(showWarning({ title: 'Error', message: err?.data?.message || 'Failed to delete category.' }));
      }
    }
  };

  // Columns: Master Catalog
  const assetColumns = [
    {
      header: 'Equipment Identifier & Tag',
      accessorKey: 'name',
      cell: (item: any) => (
        <div className="flex flex-col py-1">
          <span className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 text-sm">
            <Box size={15} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
            {item.name}
          </span>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="font-mono text-[11px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800">
              {item.tagNumber || `AST-${item.id?.slice(0, 6).toUpperCase()}`}
            </Badge>
            {item.serialNumber && (
              <span className="text-[11px] font-mono text-slate-400">
                S/N: {item.serialNumber}
              </span>
            )}
          </div>
        </div>
      )
    },
    {
      header: 'Category & Location',
      accessorKey: 'category',
      cell: (item: any) => (
        <div className="text-xs">
          <Badge variant="outline" className="text-[11px] font-bold bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700">
            <Tag size={11} className="mr-1 text-indigo-500" />
            {item.category?.name || item.categoryName || 'General Equipment'}
          </Badge>
          <div className="text-slate-500 mt-1 truncate max-w-[220px]">
            📍 {item.location || item.locationNotes || 'Central Plant / Utility Room'}
          </div>
        </div>
      )
    },
    {
      header: 'Valuation & Lifespan',
      accessorKey: 'purchasePrice',
      cell: (item: any) => {
        const price = parseFloat(item.purchasePrice || item.purchaseCost);
        return (
          <div className="text-xs font-mono">
            <strong className="text-slate-900 dark:text-slate-100">
              {price ? `$${price.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'N/A'}
            </strong>
            <span className="text-slate-400 block text-[10px]">
              Lifespan: {item.expectedLifespanYears || 10} Years
            </span>
          </div>
        );
      }
    },
    {
      header: 'Warranty Status',
      accessorKey: 'warrantyExpiry',
      cell: (item: any) => {
        const expiryDate = item.warrantyExpiry ? new Date(item.warrantyExpiry) : null;
        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
        
        if (!expiryDate) {
          return <span className="text-xs text-slate-400 font-medium">No Warranty Logged</span>;
        }

        if (expiryDate < now) {
          return (
            <Badge className="bg-red-100 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-300 text-[11px] font-bold">
              🔴 Expired ({expiryDate.toLocaleDateString()})
            </Badge>
          );
        } else if (expiryDate <= thirtyDaysFromNow) {
          const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return (
            <Badge className="bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 text-[11px] font-extrabold animate-pulse">
              ⚠️ {daysLeft} Days Left
            </Badge>
          );
        }

        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 text-[11px] font-bold">
            🟢 Valid till {expiryDate.toLocaleDateString()}
          </Badge>
        );
      }
    },
    {
      header: 'Operational Status',
      accessorKey: 'status',
      cell: (item: any) => {
        const status = item.status;
        return (
          <div className="flex items-center gap-1.5">
            <select
              value={status || 'ACTIVE'}
              onChange={(e) => handleStatusChange(item.id, e.target.value)}
              className="text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 shadow-sm focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ACTIVE">🟢 Operational</option>
              <option value="IN_REPAIR">🛠️ In Repair</option>
              <option value="INACTIVE">⏸️ Inactive / Standby</option>
              <option value="DISPOSED">📦 Decommissioned</option>
            </select>
          </div>
        );
      }
    },
    {
      header: 'Actions',
      accessorKey: 'actions',
      cell: (item: any) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => openQrModal(item)}
            className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors"
            title="Digital QR Tag Badge"
          >
            <QrCode size={16} />
          </button>
          <button
            onClick={() => openDocsModal(item)}
            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors"
            title="Technical Manuals & Schematics"
          >
            <FileText size={16} />
          </button>
          {isAdminOrManager && (
            <button
              onClick={() => openWorkOrderModal(item)}
              className="p-1.5 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-lg transition-colors"
              title="Dispatch Maintenance Work Order"
            >
              <Wrench size={16} />
            </button>
          )}
          {isAdminOrManager && (
            <button
              onClick={() => handleDeleteAsset(item)}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
              title="Decommission Asset"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      )
    }
  ];

  // Columns: Category Taxonomy
  const categoryColumns = [
    {
      header: 'Category Subsystem',
      accessorKey: 'name',
      cell: (cat: any) => (
        <div className="flex items-center gap-2.5 py-1">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
            <Tag size={15} />
          </div>
          <div>
            <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">{cat.name}</div>
            <div className="text-[11px] font-mono text-slate-400">ID: {cat.id?.slice(0, 8)}...</div>
          </div>
        </div>
      )
    },
    {
      header: 'Description & Scope',
      accessorKey: 'description',
      cell: (cat: any) => (
        <span className="text-xs text-slate-600 dark:text-slate-300">
          {cat.description || 'Facility machinery classification scope.'}
        </span>
      )
    },
    {
      header: 'Linked Machinery Count',
      accessorKey: 'count',
      cell: (cat: any) => {
        const count = assets.filter((a: any) => a.categoryId === cat.id || a.category?.id === cat.id).length;
        return (
          <Badge variant="outline" className="text-xs font-bold">
            {count} Assets Linked
          </Badge>
        );
      }
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
    <RequireModule moduleCode="ASSET_MANAGEMENT">
      <div className="space-y-6 max-w-[1500px] mx-auto pb-12">
        {/* Header */}
        <PageHeader
          title="SmartiAsset Facility & Equipment Registry"
          description="Centralized inventory tracking for critical plant machinery (HVAC chillers, generators, lifts, pumps), automated 30-day warranty tracking, and technical schematics."
          action={
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => setIsCategoryModalOpen(true)}
                variant="outline" 
                className="border-slate-300 dark:border-slate-700 font-bold text-xs"
              >
                <Tag className="w-4 h-4 mr-1.5 text-indigo-500" />
                Add Category
              </Button>
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Register Equipment
              </Button>
            </div>
          }
        />

        {/* 5 Top Executive KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-900 to-indigo-950 text-white shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-300">Total Machinery Units</p>
              <h4 className="text-2xl font-black mt-1">{totalAssets} Assets</h4>
              <p className="text-[11px] text-indigo-300 mt-0.5">Fleet inventory</p>
            </div>
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md">
              <Box size={24} className="text-indigo-400" />
            </div>
          </Card>

          <Card 
            onClick={() => { setActiveTab('INVENTORY'); setSelectedStatusFilter('ACTIVE'); }}
            className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between cursor-pointer hover:border-emerald-400 transition-all group"
          >
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Operational Health</p>
              <h4 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{operationalRate}%</h4>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">{activeAssets} active units</p>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl">
              <ShieldCheck size={24} className="text-emerald-500" />
            </div>
          </Card>

          <Card 
            onClick={() => { setActiveTab('INVENTORY'); setSelectedStatusFilter('IN_REPAIR'); }}
            className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between cursor-pointer hover:border-amber-400 transition-all group"
          >
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">In Repair / Servicing</p>
              <h4 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{inRepairCount} Units</h4>
              <p className="text-[11px] text-slate-400 group-hover:text-amber-500 transition-colors">Under maintenance</p>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl">
              <Wrench size={24} className="text-amber-500" />
            </div>
          </Card>

          <Card 
            onClick={() => setActiveTab('WARRANTY')}
            className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between cursor-pointer hover:border-rose-400 transition-all group"
          >
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">30-Day Warranty Alerts</p>
              <h4 className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{warrantyWarningCount} Alerts</h4>
              <p className="text-[11px] text-rose-500 font-bold animate-pulse">Expiring soon</p>
            </div>
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl">
              <AlertTriangle size={24} className="text-rose-500" />
            </div>
          </Card>

          <Card className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Capital Valuation</p>
              <h4 className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400 mt-1">
                ${totalValuation.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </h4>
              <p className="text-[11px] text-slate-400">Depreciated valuation</p>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl">
              <DollarSign size={24} className="text-indigo-500" />
            </div>
          </Card>
        </div>

        {/* Tab Navigation Strip */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
          <button
            onClick={() => setActiveTab('INVENTORY')}
            className={`pb-3 text-sm font-extrabold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'INVENTORY'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Box size={18} />
            Master Equipment Catalog ({filteredAssets.length})
          </button>
          <button
            onClick={() => setActiveTab('WARRANTY')}
            className={`pb-3 text-sm font-extrabold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'WARRANTY'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <AlertTriangle size={18} className="text-amber-500" />
            Warranty Watchlist ({warrantyAlerts.length})
          </button>
          <button
            onClick={() => setActiveTab('CATEGORIES')}
            className={`pb-3 text-sm font-extrabold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'CATEGORIES'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Tag size={18} />
            Asset Taxonomy ({categories.length})
          </button>
        </div>

        {/* Tab 1: Master Equipment Catalog */}
        {activeTab === 'INVENTORY' && (
          <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
            {/* Filter Toolbar */}
            <CardContent className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row items-center justify-between gap-4">
              <div className="relative flex-1 w-full max-w-md">
                <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by equipment name, tag, serial number, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 text-xs font-medium rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-inner"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                <div className="flex items-center space-x-1.5">
                  <Filter className="w-4 h-4 text-indigo-500 shrink-0" />
                  <select
                    value={selectedCategoryFilter}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                    className="h-10 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm cursor-pointer"
                  >
                    <option value="ALL">All Categories</option>
                    {categories.map((c: any) => (
                      <option key={c.id} value={c.id}>📁 {c.name}</option>
                    ))}
                  </select>
                </div>

                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="h-10 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm cursor-pointer"
                >
                  <option value="ALL">All Operational States</option>
                  <option value="ACTIVE">🟢 Operational / Active</option>
                  <option value="IN_REPAIR">🛠️ In Repair / Servicing</option>
                  <option value="INACTIVE">⏸️ Inactive / Standby</option>
                  <option value="DISPOSED">📦 Decommissioned</option>
                </select>

                {(selectedCategoryFilter !== 'ALL' || selectedStatusFilter !== 'ALL' || searchQuery !== '') && (
                  <button
                    onClick={() => { setSelectedCategoryFilter('ALL'); setSelectedStatusFilter('ALL'); setSearchQuery(''); }}
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
                columns={assetColumns}
                data={filteredAssets}
                isLoading={isLoadingAssets}
              />
            </CardContent>
          </Card>
        )}

        {/* Tab 2: 30-Day Warranty Watchlist */}
        {activeTab === 'WARRANTY' && (
          <div className="space-y-4">
            <Card className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-100 dark:bg-amber-900/50 rounded-xl text-amber-800 dark:text-amber-300">
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-amber-900 dark:text-amber-300">Proactive Maintenance & Warranty Compliance</h4>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                    Equipment listed below have active warranties expiring within the next 30 days or have already lapsed. Schedule vendor inspections before warranty expiration to ensure covered repairs.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
              <CardContent className="p-0">
                <DataTable
                  columns={assetColumns}
                  data={warrantyAlerts}
                  isLoading={isLoadingWarranty}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab 3: Asset Taxonomy */}
        {activeTab === 'CATEGORIES' && (
          <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
            <CardContent className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Machinery & Subsystem Classifications</h3>
                <p className="text-xs text-slate-500">Categories organize facilities assets into preventive maintenance, compliance, and warranty routing buckets.</p>
              </div>
              <Button 
                onClick={() => setIsCategoryModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
              >
                <Plus size={14} className="mr-1" /> Add Category
              </Button>
            </CardContent>
            <CardContent className="p-0">
              <DataTable
                columns={categoryColumns}
                data={categories}
                isLoading={isLoadingCategories}
              />
            </CardContent>
          </Card>
        )}

        {/* Modal 1: Register Equipment */}
        <Modal 
          isOpen={isCreateModalOpen} 
          onClose={() => setIsCreateModalOpen(false)}
          title="Catalog New Facility Equipment"
        >
          <form onSubmit={handleCreateAsset} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Equipment Name *</label>
              <Input
                required
                placeholder="e.g. Trane Centrifugal Water-Cooled Chiller #2"
                value={assetForm.name}
                onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Asset Tag Identifier *</label>
                  <button
                    type="button"
                    onClick={generateTag}
                    className="text-[11px] text-indigo-600 font-extrabold hover:underline"
                  >
                    Auto-Generate
                  </button>
                </div>
                <Input
                  required
                  placeholder="e.g. CHL-2026-8841"
                  value={assetForm.tagNumber}
                  onChange={(e) => setAssetForm({ ...assetForm, tagNumber: e.target.value })}
                  className="text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Subsystem Category</label>
                <select
                  value={assetForm.categoryId}
                  onChange={(e) => setAssetForm({ ...assetForm, categoryId: e.target.value })}
                  className="w-full h-10 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                >
                  <option value="">General Facility Equipment</option>
                  {categories.map((c: any) => (
                    <option key={c.id} value={c.id}>📁 {c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Manufacturer Serial Number</label>
                <Input
                  placeholder="e.g. SN-8839-TRN-XP"
                  value={assetForm.serialNumber}
                  onChange={(e) => setAssetForm({ ...assetForm, serialNumber: e.target.value })}
                  className="text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Capital Valuation ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 85000.00"
                  value={assetForm.purchasePrice}
                  onChange={(e) => setAssetForm({ ...assetForm, purchasePrice: e.target.value })}
                  className="text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Warranty Expiration Date</label>
                <Input
                  type="date"
                  value={assetForm.warrantyExpiry}
                  onChange={(e) => setAssetForm({ ...assetForm, warrantyExpiry: e.target.value })}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Expected Lifespan (Years)</label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={assetForm.expectedLifespanYears}
                  onChange={(e) => setAssetForm({ ...assetForm, expectedLifespanYears: e.target.value })}
                  className="text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Installed Location & Physical Coordinates</label>
              <Input
                placeholder="e.g. Tower B - Basement Level 2 Mechanical Room Station #4"
                value={assetForm.locationNotes}
                onChange={(e) => setAssetForm({ ...assetForm, locationNotes: e.target.value })}
                className="text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Warranty & Vendor Contact Details</label>
              <textarea
                placeholder="Vendor support contact, SLA warranty tier, annual maintenance contract #..."
                value={assetForm.warrantyDetails}
                onChange={(e) => setAssetForm({ ...assetForm, warrantyDetails: e.target.value })}
                rows={2}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isCreating}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
              >
                {isCreating ? 'Registering...' : 'Confirm & Register Equipment'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal 2: Digital Asset Badge & QR Tag */}
        <Modal 
          isOpen={isQrModalOpen} 
          onClose={() => setIsQrModalOpen(false)}
          title="Digital Asset Tag Badge"
        >
          {selectedAsset && (
            <div className="space-y-6 pt-2 text-center">
              <div className="p-6 bg-white dark:bg-slate-950 rounded-2xl border-2 border-dashed border-indigo-300 dark:border-indigo-800 shadow-md max-w-sm mx-auto">
                <div className="flex items-center justify-between border-b pb-2 mb-3 border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                    SMARTI-ASSET TAG
                  </span>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {selectedAsset.statusDisplay || selectedAsset.status || 'OPERATIONAL'}
                  </Badge>
                </div>

                {/* Visual QR Code Generator Simulation */}
                <div className="my-4 flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="w-36 h-36 bg-white p-2 rounded-lg border shadow-sm flex items-center justify-center">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(`BMMS:ASSET:${selectedAsset.id}:${selectedAsset.tagNumber}`)}`}
                      alt="Asset QR Code"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="font-mono text-xs font-black text-slate-800 dark:text-slate-200 mt-2">
                    {selectedAsset.tagNumber || `AST-${selectedAsset.id?.slice(0, 8).toUpperCase()}`}
                  </span>
                </div>

                <div className="text-left space-y-1 text-xs">
                  <div className="font-black text-slate-900 dark:text-white text-sm">{selectedAsset.name}</div>
                  <div className="text-slate-500 text-[11px]">Subsystem: {selectedAsset.category?.name || selectedAsset.categoryName || 'General'}</div>
                  {selectedAsset.serialNumber && (
                    <div className="text-slate-500 font-mono text-[10px]">S/N: {selectedAsset.serialNumber}</div>
                  )}
                  <div className="text-slate-500 text-[11px] truncate">📍 {selectedAsset.location || selectedAsset.locationNotes || 'Utility Station'}</div>
                </div>
              </div>

              <div className="flex justify-center gap-3">
                <Button 
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(selectedAsset.tagNumber || selectedAsset.id);
                    setCopiedTag(true);
                    setTimeout(() => setCopiedTag(false), 2000);
                  }}
                  className="text-xs font-bold flex items-center gap-1.5"
                >
                  {copiedTag ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  {copiedTag ? 'Copied!' : 'Copy Tag Number'}
                </Button>
                <Button 
                  onClick={() => window.print()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5"
                >
                  <Printer size={14} /> Print Equipment Tag
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Modal 3: Equipment Documents & Manuals */}
        <Modal 
          isOpen={isDocsModalOpen} 
          onClose={() => setIsDocsModalOpen(false)}
          title={`Technical Manuals & Schematics — ${selectedAsset?.name || 'Equipment'}`}
        >
          <div className="space-y-6 pt-2">
            {/* Existing Documents List */}
            <div>
              <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                <FileText size={14} className="text-indigo-500" />
                Attached Technical Files & Certificates
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {(!detailedAsset?.documents || detailedAsset.documents.length === 0) ? (
                  <p className="text-xs text-slate-400 italic p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                    No technical schematics or manuals attached to this equipment yet.
                  </p>
                ) : (
                  detailedAsset.documents.map((doc: any) => (
                    <div key={doc.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-slate-100 block">{doc.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Uploaded on {new Date(doc.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <a 
                          href={doc.fileUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="px-2 py-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-md font-bold text-[11px] flex items-center gap-1"
                        >
                          View <ExternalLink size={11} />
                        </a>
                        {isAdminOrManager && (
                          <button
                            onClick={() => handleRemoveDocument(doc.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-md"
                            title="Remove Document"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Attach Document Form */}
            {isAdminOrManager && (
              <form onSubmit={handleAddDocument} className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <span className="font-bold text-xs text-slate-700 dark:text-slate-300 block">
                  Attach Operating Manual or Schematic URL
                </span>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Document Title *</label>
                  <Input
                    required
                    placeholder="e.g. O&M Service Manual, Electrical Diagram, Warranty Card"
                    value={docForm.title}
                    onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Document / PDF Link *</label>
                  <Input
                    required
                    placeholder="e.g. https://storage.bmms.local/manuals/chiller-2-wiring.pdf"
                    value={docForm.fileUrl}
                    onChange={(e) => setDocForm({ ...docForm, fileUrl: e.target.value })}
                    className="text-xs"
                  />
                </div>
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={isAddingDoc || !docForm.title.trim() || !docForm.fileUrl.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
                  >
                    {isAddingDoc ? 'Attaching...' : 'Attach Document'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </Modal>

        {/* Modal 4: Dispatch Work Order for Asset */}
        <Modal 
          isOpen={isWorkOrderModalOpen} 
          onClose={() => setIsWorkOrderModalOpen(false)}
          title={`Dispatch Work Order — ${selectedAsset?.name || 'Asset'}`}
        >
          <form onSubmit={handleDispatchWorkOrder} className="space-y-4 pt-2">
            <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-800/60 text-xs">
              <span className="font-bold text-purple-900 dark:text-purple-300 block">Target Asset:</span>
              <p className="text-slate-600 dark:text-slate-400 mt-0.5">{selectedAsset?.name}</p>
              <div className="mt-1 flex items-center gap-3 text-slate-500 font-mono text-[11px]">
                <span>Tag: {selectedAsset?.tagNumber || 'N/A'}</span>
                <span>Loc: {selectedAsset?.location || 'Central Utility'}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Work Order Title *</label>
              <Input
                required
                value={workOrderForm.title}
                onChange={(e) => setWorkOrderForm({ ...workOrderForm, title: e.target.value })}
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Priority</label>
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
                <option value="">Unassigned (Queue for staff)</option>
                {technicians.map((t: any) => (
                  <option key={t.id} value={t.id}>
                    👤 {t.firstName} {t.lastName} ({t.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Maintenance Scope & Instructions</label>
              <textarea
                value={workOrderForm.description}
                onChange={(e) => setWorkOrderForm({ ...workOrderForm, description: e.target.value })}
                rows={3}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
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
                {isCreatingWorkOrder ? 'Dispatching...' : 'Dispatch Work Order'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal 5: Add Asset Category */}
        <Modal 
          isOpen={isCategoryModalOpen} 
          onClose={() => setIsCategoryModalOpen(false)}
          title="New Asset Classification Category"
        >
          <form onSubmit={handleCreateCategory} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Category Name *</label>
              <Input
                required
                placeholder="e.g. Chillers, Elevators, Generators, Fire Pumps"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                className="text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Scope & Description</label>
              <textarea
                placeholder="Maintenance and warranty guidelines for this machinery subsystem..."
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                rows={3}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" onClick={() => setIsCategoryModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isCreatingCategory || !categoryForm.name.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
              >
                {isCreatingCategory ? 'Creating...' : 'Register Category'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </RequireModule>
  );
}
