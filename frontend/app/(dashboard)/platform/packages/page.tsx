'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, Package as PackageIcon, ArrowUpRight, Search, Activity, PlayCircle, PauseCircle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { useGetPackagesQuery, useActivatePackageMutation, useDeactivatePackageMutation } from '@/services/packagesApi';
import { useDispatch } from 'react-redux';
import { showWarning } from '@/store/slices/uiSlice';
import { useConfirm } from '@/providers/ConfirmProvider';

export default function PackagesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data, isLoading } = useGetPackagesQuery({});
  const [activatePackage] = useActivatePackageMutation();
  const [deactivatePackage] = useDeactivatePackageMutation();
  const dispatch = useDispatch();
  const confirm = useConfirm();

  const packages = data?.data || [];
  const filteredPackages = packages.filter((pkg: any) => 
    pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    pkg.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStatusChange = async (id: string, name: string, activate: boolean) => {
    const isConfirmed = await confirm({
      title: `${activate ? 'Activate' : 'Deactivate'} Package`,
      message: `Are you sure you want to ${activate ? 'activate' : 'deactivate'} the "${name}" package?`,
      confirmText: activate ? 'Yes, Activate' : 'Yes, Deactivate',
      cancelText: 'Cancel',
      destructive: !activate,
    });

    if (isConfirmed) {
      try {
        if (activate) await activatePackage(id).unwrap();
        else await deactivatePackage(id).unwrap();
        dispatch(showWarning({ title: 'Status Updated', message: `Package "${name}" has been ${activate ? 'activated' : 'deactivated'}.` }));
      } catch (err: any) {
        dispatch(showWarning({ title: 'Operation Failed', message: err.data?.message || 'Failed to update package status.' }));
      }
    }
  };

  const columns: Column<any>[] = [
    {
      header: 'Package Details',
      accessorKey: 'name',
      cell: (pkg) => (
        <div className="flex items-center space-x-3 min-w-[240px]">
          <div className="h-11 w-11 flex-shrink-0 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white rounded-xl flex items-center justify-center font-black shadow-md shadow-indigo-600/15">
            <PackageIcon className="h-5 w-5" />
          </div>
          <div>
            <Link href={`/platform/packages/${pkg.id}`} className="font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 text-sm flex items-center transition-colors">
              {pkg.name} <ArrowUpRight className="h-3.5 w-3.5 ml-1 opacity-70" />
            </Link>
            <div className="flex items-center space-x-2 mt-0.5">
              <span className="text-[11px] font-mono font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.2 rounded border border-indigo-200 dark:border-indigo-800">
                {pkg.code}
              </span>
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Description',
      accessorKey: 'description',
      className: 'hidden md:table-cell',
      cell: (pkg) => (
        <span className="text-sm text-slate-500 dark:text-slate-400 max-w-xs truncate block">
          {pkg.description || 'No description provided.'}
        </span>
      )
    },
    {
      header: 'Included Modules',
      accessorKey: '_count',
      className: 'hidden lg:table-cell',
      cell: (pkg) => (
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {pkg._count?.packageModules || 0} Modules
        </span>
      )
    },
    {
      header: 'Status',
      accessorKey: 'isActive',
      cell: (pkg) => (
        <StatusBadge status={pkg.isActive ? 'ACTIVE' : 'INACTIVE'} className="px-3 py-1" />
      )
    },
    {
      header: 'Actions',
      accessorKey: 'actions',
      cell: (pkg) => (
        <div className="flex items-center space-x-1.5">
          <Link href={`/platform/packages/${pkg.id}`}>
            <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs font-semibold hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/50">
              Details
            </Button>
          </Link>
          
          {!pkg.isActive ? (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleStatusChange(pkg.id, pkg.name, true)}
              className="h-8 px-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900"
              title="Activate Package"
            >
              <PlayCircle className="h-4 w-4" />
            </Button>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleStatusChange(pkg.id, pkg.name, false)}
              className="h-8 px-2 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 border-amber-200 dark:border-amber-900"
              title="Deactivate Package"
            >
              <PauseCircle className="h-4 w-4" />
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 min-w-0">
      <PageHeader 
        title="Package Management" 
        description="Define and configure reusable software packages and SaaS tiers for organizations."
        action={
          <Link href="/platform/packages/create">
            <Button className="h-10 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/25 px-5 font-bold">
              <Plus className="mr-2 h-4 w-4" />
              Create Package
            </Button>
          </Link>
        }
      />

      <Card className="border-slate-200/80 dark:border-slate-800 shadow-sm bg-white/60 dark:bg-slate-900/60 backdrop-blur-md">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center">
          <div className="w-full md:w-96 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input 
              className="pl-9 h-10 text-xs font-medium" 
              placeholder="Search by package name or code..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xl overflow-hidden">
        <DataTable 
          columns={columns} 
          data={filteredPackages} 
          isLoading={isLoading} 
          emptyMessage="No packages match your search."
        />
      </div>
    </div>
  );
}
