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
  useGetBuildingQuery, 
  useGetTowersQuery,
  useCreateTowerMutation,
  useDeleteTowerMutation
} from '@/services/organizationApi';
import { ArrowLeft, Plus, Layers, Trash2 } from 'lucide-react';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useDispatch } from 'react-redux';
import { showWarning } from '@/store/slices/uiSlice';

export default function BuildingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const dispatch = useDispatch();
  const confirm = useConfirm();
  const [isCreating, setIsCreating] = useState(false);
  const [towerName, setTowerName] = useState('');

  const { data: building, isLoading: isLoadingBuilding } = useGetBuildingQuery(id);
  const { data: towersResponse, isLoading: isLoadingTowers } = useGetTowersQuery({ buildingId: id });
  const [createTower, { isLoading: isCreatingTower }] = useCreateTowerMutation();
  const [deleteTower] = useDeleteTowerMutation();

  const handleCreateTower = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!towerName.trim()) return;
    
    try {
      await createTower({
        name: towerName,
        buildingId: id,
      }).unwrap();
      setIsCreating(false);
      setTowerName('');
    } catch (err: any) {
      dispatch(showWarning({ title: 'Creation Failed', message: err.data?.message || 'Failed to create tower' }));
    }
  };

  const handleDeleteTower = async (towerId: string) => {
    const isConfirmed = await confirm({
      title: 'Delete Tower',
      message: 'Are you sure you want to delete this tower?',
      confirmText: 'Yes, Delete',
      cancelText: 'Cancel',
      destructive: true,
    });
    
    if (isConfirmed) {
      try {
        await deleteTower(towerId).unwrap();
      } catch (err: any) {
        dispatch(showWarning({ title: 'Delete Failed', message: err.data?.message || 'Failed to delete tower' }));
      }
    }
  };

  const columns: Column<any>[] = [
    {
      header: 'Tower Name',
      accessorKey: 'name',
      cell: (tower) => (
        <div className="flex items-center">
          <Layers className="mr-2 h-4 w-4 text-blue-500" />
          <span className="font-medium text-gray-900 dark:text-white">{tower.name}</span>
        </div>
      )
    },
    {
      header: 'Created Date',
      accessorKey: 'createdAt',
      cell: (tower) => new Date(tower.createdAt).toLocaleDateString()
    },
    {
      header: 'Actions',
      accessorKey: 'actions',
      cell: (tower) => (
        <div className="flex space-x-2 items-center">
          <Link href={`/organization/towers/${tower.id}`}>
            <Button variant="outline" size="sm">Manage Floors</Button>
          </Link>
          <button 
            onClick={() => handleDeleteTower(tower.id)}
            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 ml-2"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  if (isLoadingBuilding) return <div>Loading...</div>;
  if (!building) return <div>Building not found</div>;

  return (
    <div>
      <div className="mb-4">
        <Link href="/organization/buildings" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Buildings
        </Link>
      </div>

      <PageHeader 
        title={building.name} 
        description={`Manage towers and configuration for ${building.name}.`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Building Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Address</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">{building.address || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">City</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">{building.city}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Country</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">{building.country}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Towers in {building.name}</CardTitle>
            {!isCreating && (
              <Button size="sm" onClick={() => setIsCreating(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Tower
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {isCreating && (
              <form onSubmit={handleCreateTower} className="mb-6 p-4 border border-gray-200 dark:border-gray-800 rounded-md bg-gray-50 dark:bg-gray-900/50">
                <h4 className="text-sm font-medium mb-3">Create New Tower</h4>
                <div className="flex space-x-3 items-end">
                  <div className="flex-1">
                    <Input 
                      label="Tower Name"
                      value={towerName}
                      onChange={(e) => setTowerName(e.target.value)}
                      placeholder="e.g. Tower A"
                      required
                    />
                  </div>
                  <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
                  <Button type="submit" disabled={isCreatingTower}>
                    {isCreatingTower ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </form>
            )}

            <DataTable 
              columns={columns} 
              data={towersResponse?.data || []} 
              isLoading={isLoadingTowers} 
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
