'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/Input';
import { 
  useGetFloorQuery, 
  useGetUnitsQuery,
  useCreateUnitMutation,
  useDeleteUnitMutation
} from '@/services/organizationApi';
import { ArrowLeft, Plus, Home, Trash2 } from 'lucide-react';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useDispatch } from 'react-redux';
import { showWarning } from '@/store/slices/uiSlice';

export default function FloorDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const dispatch = useDispatch();
  const confirm = useConfirm();
  const [isCreating, setIsCreating] = useState(false);
  const [unitNumber, setUnitNumber] = useState('');
  const [sizeSqft, setSizeSqft] = useState('');

  const { data: floor, isLoading: isLoadingFloor } = useGetFloorQuery(id);
  const { data: unitsResponse, isLoading: isLoadingUnits } = useGetUnitsQuery({ floorId: id });
  const [createUnit, { isLoading: isCreatingUnit }] = useCreateUnitMutation();
  const [deleteUnit] = useDeleteUnitMutation();

  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitNumber.trim()) return;
    
    try {
      await createUnit({
        unitNumber,
        sizeSqft: sizeSqft ? parseFloat(sizeSqft) : undefined,
        type: 'RESIDENTIAL',
        status: 'VACANT',
        floorId: id,
        towerId: floor?.parentId,
        buildingId: floor?.parent?.parentId,
      }).unwrap();
      setIsCreating(false);
      setUnitNumber('');
      setSizeSqft('');
    } catch (err: any) {
      dispatch(showWarning({ title: 'Creation Failed', message: err.data?.message || 'Failed to create unit' }));
    }
  };

  const handleDeleteUnit = async (unitId: string) => {
    const isConfirmed = await confirm({
      title: 'Delete Unit',
      message: 'Are you sure you want to delete this unit?',
      confirmText: 'Yes, Delete',
      cancelText: 'Cancel',
      destructive: true,
    });
    
    if (isConfirmed) {
      try {
        await deleteUnit(unitId).unwrap();
      } catch (err: any) {
        dispatch(showWarning({ title: 'Delete Failed', message: err.data?.message || 'Failed to delete unit' }));
      }
    }
  };

  const columns: Column<any>[] = [
    {
      header: 'Unit Number',
      accessorKey: 'unitNumber',
      cell: (unit) => (
        <div className="flex items-center">
          <Home className="mr-2 h-4 w-4 text-blue-500" />
          <span className="font-medium text-gray-900 dark:text-white">{unit.name || unit.unitNumber}</span>
        </div>
      )
    },
    {
      header: 'Type',
      accessorKey: 'type',
      cell: (unit) => (
        <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-md">
          {unit.metadata?.type || unit.type}
        </span>
      )
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (unit) => {
        const status = unit.metadata?.status || unit.status;
        return (
          <span className={`px-2 py-1 text-xs font-semibold rounded-md ${
            status === 'VACANT' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
            status === 'OCCUPIED' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' :
            'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
          }`}>
            {status}
          </span>
        );
      }
    },
    {
      header: 'Size (Sqft)',
      accessorKey: 'sizeSqft',
      cell: (unit) => <span className="text-gray-500">{unit.metadata?.sizeSqft || unit.sizeSqft || '-'}</span>
    },
    {
      header: 'Actions',
      accessorKey: 'actions',
      cell: (unit) => (
        <div className="flex space-x-2 items-center">
          <Link href={`/organization/units/${unit.id}`}>
            <Button variant="outline" size="sm">Manage Residents</Button>
          </Link>
          <button 
            onClick={() => handleDeleteUnit(unit.id)}
            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 ml-2"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  if (isLoadingFloor) return <div>Loading...</div>;
  if (!floor) return <div>Floor not found</div>;

  return (
    <div>
      <div className="mb-4">
        <Link href={`/organization/towers/${floor.parentId}`} className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Tower
        </Link>
      </div>

      <PageHeader 
        title={floor.name} 
        description={`Manage units on ${floor.name}.`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Units on {floor.name}</CardTitle>
            {!isCreating && (
              <Button size="sm" onClick={() => setIsCreating(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Unit
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {isCreating && (
              <form onSubmit={handleCreateUnit} className="mb-6 p-4 border border-gray-200 dark:border-gray-800 rounded-md bg-gray-50 dark:bg-gray-900/50">
                <h4 className="text-sm font-medium mb-3">Create New Unit</h4>
                <div className="flex space-x-3 items-end">
                  <div className="flex-1">
                    <Input 
                      label="Unit Number"
                      value={unitNumber}
                      onChange={(e) => setUnitNumber(e.target.value)}
                      placeholder="e.g. 101, 102A"
                      required
                    />
                  </div>
                  <div className="flex-1">
                    <Input 
                      label="Size (Sqft) - Optional"
                      type="number"
                      value={sizeSqft}
                      onChange={(e) => setSizeSqft(e.target.value)}
                      placeholder="e.g. 1200"
                    />
                  </div>
                  <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
                  <Button type="submit" disabled={isCreatingUnit}>
                    {isCreatingUnit ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </form>
            )}

            <DataTable 
              columns={columns} 
              data={unitsResponse?.data || []} 
              isLoading={isLoadingUnits} 
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
