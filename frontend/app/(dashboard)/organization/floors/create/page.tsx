'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useCreateFloorMutation, useGetTowersQuery, useGetBuildingsQuery } from '@/services/organizationApi';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import Link from 'next/link';

const floorSchema = z.object({
  name: z.string().min(1, 'Floor name is required'),
  level: z.string().min(1, 'Level is required'),
  buildingId: z.string().min(1, 'Building selection is required'),
  towerId: z.string().min(1, 'Tower selection is required'),
});

type FloorFormValues = z.infer<typeof floorSchema>;

export default function CreateFloorPage() {
  const router = useRouter();
  const { data: buildingsData, isLoading: isLoadingBuildings } = useGetBuildingsQuery({});
  const { data: towersData, isLoading: isLoadingTowers } = useGetTowersQuery({});
  const [createFloor, { isLoading }] = useCreateFloorMutation();
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, control, formState: { errors }, setValue } = useForm<FloorFormValues>({
    resolver: zodResolver(floorSchema),
  });

  const selectedBuildingId = useWatch({
    control,
    name: 'buildingId',
  });

  const buildings = useMemo(() => Array.isArray(buildingsData) ? buildingsData : (buildingsData?.data || []), [buildingsData]);
  const allTowers = useMemo(() => Array.isArray(towersData) ? towersData : (towersData?.data || []), [towersData]);

  const filteredTowers = useMemo(() => {
    if (!selectedBuildingId) return [];
    return allTowers.filter(
      (t: any) =>
        t.parentId === selectedBuildingId ||
        t.parent?.id === selectedBuildingId ||
        t.buildingId === selectedBuildingId ||
        t.building?.id === selectedBuildingId
    );
  }, [allTowers, selectedBuildingId]);

  const onSubmit = async (data: FloorFormValues) => {
    setError(null);
    try {
      await createFloor({
        name: data.name,
        level: parseInt(data.level, 10),
        towerId: data.towerId,
      }).unwrap();
      router.push('/organization/floors');
    } catch (err: any) {
      setError(err.data?.message || 'Failed to create floor');
    }
  };

  return (
    <div>
      <div className="mb-4">
        <Link href="/organization/floors" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Floors
        </Link>
      </div>

      <PageHeader 
        title="Create Floor" 
        description="Add a new floor to an existing tower."
      />

      {error && (
        <div className="mb-6 rounded-md bg-red-50 dark:bg-red-900/30 p-4 border border-red-200 dark:border-red-800">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-300">{error}</h3>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Floor Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
              <Input label="Floor Name (e.g. Ground Floor, 1st Floor) *" {...register('name')} error={errors.name?.message} />
              <Input label="Level (Numeric) *" type="number" {...register('level')} error={errors.level?.message} />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Select Building *
                </label>
                <select 
                  className={`block w-full rounded-md border px-3 py-2 text-gray-900 bg-white placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600 ${errors.buildingId ? 'border-red-500' : 'border-gray-300'}`}
                  {...register('buildingId', {
                    onChange: () => setValue('towerId', '')
                  })}
                  disabled={isLoadingBuildings}
                >
                  <option value="">{isLoadingBuildings ? 'Loading buildings...' : 'Select a building...'}</option>
                  {buildings.map((b: any) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
                {errors.buildingId && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.buildingId.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Select Tower *
                </label>
                <select 
                  className={`block w-full rounded-md border px-3 py-2 text-gray-900 bg-white placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600 ${errors.towerId ? 'border-red-500' : 'border-gray-300'}`}
                  {...register('towerId')}
                  disabled={isLoadingTowers || !selectedBuildingId || filteredTowers.length === 0}
                >
                  <option value="">
                    {!selectedBuildingId
                      ? 'Select a building first...'
                      : isLoadingTowers
                      ? 'Loading towers...'
                      : filteredTowers.length === 0
                      ? 'No towers in this building'
                      : 'Select a tower...'}
                  </option>
                  {filteredTowers.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                {errors.towerId && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.towerId.message}</p>}
                {selectedBuildingId && !isLoadingTowers && filteredTowers.length === 0 && (
                  <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    No towers found in this building.{' '}
                    <Link href="/organization/towers/create" className="underline font-semibold hover:text-amber-700 dark:hover:text-amber-300">
                      Create a Tower
                    </Link>
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-3">
          <Button variant="outline" type="button" onClick={() => router.push('/organization/floors')}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Floor'}
          </Button>
        </div>
      </form>
    </div>
  );
}
