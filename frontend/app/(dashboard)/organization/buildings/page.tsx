'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, Building, Search, Filter } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useGetBuildingsQuery, useDeleteBuildingMutation } from '@/services/organizationApi';
import { Trash2 } from 'lucide-react';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useDispatch } from 'react-redux';
import { showWarning } from '@/store/slices/uiSlice';

interface BuildingType {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  createdAt: string;
}

export default function BuildingsPage() {
  const { data, isLoading } = useGetBuildingsQuery({});
  const [deleteBuilding] = useDeleteBuildingMutation();
  const dispatch = useDispatch();
  const confirm = useConfirm();

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Delete Building',
      message: 'Are you sure you want to delete this building?',
      confirmText: 'Yes, Delete',
      cancelText: 'Cancel',
      destructive: true,
    });
    
    if (isConfirmed) {
      try {
        await deleteBuilding(id).unwrap();
      } catch (error: any) {
        dispatch(showWarning({ title: 'Delete Failed', message: error?.data?.message || 'Failed to delete building' }));
      }
    }
  };

  const columns: Column<BuildingType>[] = [
    {
      header: 'Building Name',
      accessorKey: 'name',
      cell: (bld) => (
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mr-3">
            <Building className="h-5 w-5 text-blue-600 dark:text-blue-300" />
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
              {bld.name}
              <Badge variant="secondary" className="text-xs uppercase">{bld.id.split('-')[0]}</Badge>
            </div>
          </div>
        </div>
      )
    },
    { header: 'Location', accessorKey: 'location', cell: (bld) => `${bld.address}, ${bld.city}, ${bld.country}` },
    { header: 'City', accessorKey: 'city' },
    { header: 'Country', accessorKey: 'country' },
    {
      header: 'Created Date',
      accessorKey: 'createdAt',
      cell: (bld) => new Date(bld.createdAt).toLocaleDateString()
    },
    {
      header: 'Actions',
      accessorKey: 'actions',
      cell: (bld) => (
        <div className="flex space-x-3 items-center">
          <Link href={`/organization/buildings/${bld.id}`}> 
            <Button variant="outline" size="sm">
              View
            </Button>
          </Link>
          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-900" onClick={() => handleDelete(bld.id)}>
            <Trash2 className="h-4 w-4 mr-1" /> Delete
          </Button>
        </div>
      )
    }
  ];

  return (
    <div>
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 shadow-sm space-y-6 w-full">
        <PageHeader 
          title="Buildings" 
          description="Manage all your properties and buildings."
          action={
            <Link href="/organization/buildings/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Building
              </Button>
            </Link>
          }
        />

        <Card className="mb-6">
          <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="w-full sm:w-96 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <Input className="pl-10" placeholder="Search buildings..." />
            </div>
            <div className="flex space-x-2 w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </div>
          </CardContent>
        </Card>

        <DataTable 
          columns={columns} 
          data={data?.data || []} 
          isLoading={isLoading} 
        />
      </div>
    </div>
  );
}
