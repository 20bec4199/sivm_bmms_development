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
  useGetTowerQuery, 
  useGetFloorsQuery,
  useCreateFloorMutation,
  useDeleteFloorMutation
} from '@/services/organizationApi';
import { ArrowLeft, Plus, AlignJustify, Trash2 } from 'lucide-react';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useDispatch } from 'react-redux';
import { showWarning } from '@/store/slices/uiSlice';

export default function TowerDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const dispatch = useDispatch();
  const confirm = useConfirm();
  const [isCreating, setIsCreating] = useState(false);
  const [floorName, setFloorName] = useState('');
  const [floorLevel, setFloorLevel] = useState('');

  const { data: tower, isLoading: isLoadingTower } = useGetTowerQuery(id);
  const { data: floorsResponse, isLoading: isLoadingFloors } = useGetFloorsQuery({ towerId: id });
  const [createFloor, { isLoading: isCreatingFloor }] = useCreateFloorMutation();
  const [deleteFloor] = useDeleteFloorMutation();

  const handleCreateFloor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!floorName.trim() || !floorLevel.trim()) return;
    
    try {
      await createFloor({
        name: floorName,
        level: parseInt(floorLevel, 10),
        towerId: id,
      }).unwrap();
      setIsCreating(false);
      setFloorName('');
      setFloorLevel('');
    } catch (err: any) {
      dispatch(showWarning({ title: 'Creation Failed', message: err.data?.message || 'Failed to create floor' }));
    }
  };

  const handleDeleteFloor = async (floorId: string) => {
    const isConfirmed = await confirm({
      title: 'Delete Floor',
      message: 'Are you sure you want to delete this floor?',
      confirmText: 'Yes, Delete',
      cancelText: 'Cancel',
      destructive: true,
    });
    
    if (isConfirmed) {
      try {
        await deleteFloor(floorId).unwrap();
      } catch (err: any) {
        dispatch(showWarning({ title: 'Delete Failed', message: err.data?.message || 'Failed to delete floor' }));
      }
    }
  };

  const columns: Column<any>[] = [
    {
      header: 'Floor Name',
      accessorKey: 'name',
      cell: (floor) => (
        <div className="flex items-center">
          <AlignJustify className="mr-2 h-4 w-4 text-blue-500" />
          <span className="font-medium text-gray-900 dark:text-white">{floor.name}</span>
        </div>
      )
    },
    {
      header: 'Level',
      accessorKey: 'level',
      cell: (floor) => (
        <span className="px-2 py-1 text-xs font-semibold bg-gray-100 dark:bg-gray-800 rounded-md">
          Level {floor.metadata?.level || floor.level}
        </span>
      )
    },
    {
      header: 'Created Date',
      accessorKey: 'createdAt',
      cell: (floor) => new Date(floor.createdAt).toLocaleDateString()
    },
    {
      header: 'Actions',
      accessorKey: 'actions',
      cell: (floor) => (
        <div className="flex space-x-2 items-center">
          <Link href={`/organization/floors/${floor.id}`}>
            <Button variant="outline" size="sm">Manage Units</Button>
          </Link>
          <button 
            onClick={() => handleDeleteFloor(floor.id)}
            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 ml-2"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  if (isLoadingTower) return <div>Loading...</div>;
  if (!tower) return <div>Tower not found</div>;

  return (
    <div>
      <div className="mb-4">
        <Link href={`/organization/buildings/${tower.parentId}`} className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Building
        </Link>
      </div>

      <PageHeader 
        title={tower.name} 
        description={`Manage floors inside ${tower.name}.`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Floors in {tower.name}</CardTitle>
            {!isCreating && (
              <Button size="sm" onClick={() => setIsCreating(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Floor
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {isCreating && (
              <form onSubmit={handleCreateFloor} className="mb-6 p-4 border border-gray-200 dark:border-gray-800 rounded-md bg-gray-50 dark:bg-gray-900/50">
                <h4 className="text-sm font-medium mb-3">Create New Floor</h4>
                <div className="flex space-x-3 items-end">
                  <div className="flex-1">
                    <Input 
                      label="Floor Name"
                      value={floorName}
                      onChange={(e) => setFloorName(e.target.value)}
                      placeholder="e.g. Ground Floor, 1st Floor"
                      required
                    />
                  </div>
                  <div className="flex-1">
                    <Input 
                      label="Level (Number)"
                      type="number"
                      value={floorLevel}
                      onChange={(e) => setFloorLevel(e.target.value)}
                      placeholder="e.g. 0, 1, 2"
                      required
                    />
                  </div>
                  <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
                  <Button type="submit" disabled={isCreatingFloor}>
                    {isCreatingFloor ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </form>
            )}

            <DataTable 
              columns={columns} 
              data={floorsResponse?.data || []} 
              isLoading={isLoadingFloors} 
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
