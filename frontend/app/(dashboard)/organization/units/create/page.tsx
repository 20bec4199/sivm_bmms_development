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
import { useCreateUnitMutation, useGetFloorsQuery, useGetTowersQuery, useGetBuildingsQuery } from '@/services/organizationApi';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import Link from 'next/link';

const unitSchema = z.object({
  unitNumber: z.string().min(1, 'Unit number is required'),
  type: z.enum(['RESIDENTIAL', 'COMMERCIAL', 'PARKING', 'STORAGE']),
  category: z.string().optional(),
  shareUnit: z.string().optional(),
  parcelNumber: z.string().optional(),
  buildingId: z.string().min(1, 'Building selection is required'),
  towerId: z.string().min(1, 'Tower selection is required'),
  floorId: z.string().min(1, 'Floor selection is required'),
});

type UnitFormValues = z.infer<typeof unitSchema>;

export default function CreateUnitPage() {
  const router = useRouter();
  const { data: buildingsData, isLoading: isLoadingBuildings } = useGetBuildingsQuery({});
  const { data: towersData, isLoading: isLoadingTowers } = useGetTowersQuery({});
  const { data: floorsData, isLoading: isLoadingFloors } = useGetFloorsQuery({});
  
  const [createUnit, { isLoading }] = useCreateUnitMutation();
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, control, formState: { errors }, setValue } = useForm<UnitFormValues>({
    resolver: zodResolver(unitSchema),
    defaultValues: { type: 'RESIDENTIAL' }
  });

  const selectedBuildingId = useWatch({ control, name: 'buildingId' });
  const selectedTowerId = useWatch({ control, name: 'towerId' });

  // Safe array normalization
  const buildings = useMemo(() => Array.isArray(buildingsData) ? buildingsData : (buildingsData?.data || []), [buildingsData]);
  const allTowers = useMemo(() => Array.isArray(towersData) ? towersData : (towersData?.data || []), [towersData]);
  const allFloors = useMemo(() => Array.isArray(floorsData) ? floorsData : (floorsData?.data || []), [floorsData]);

  // Robust cascading filters matching both parentId and relational aliases
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

  const filteredFloors = useMemo(() => {
    if (!selectedTowerId) return [];
    return allFloors.filter(
      (f: any) =>
        f.parentId === selectedTowerId ||
        f.parent?.id === selectedTowerId ||
        f.towerId === selectedTowerId ||
        f.tower?.id === selectedTowerId
    );
  }, [allFloors, selectedTowerId]);

  const onSubmit = async (data: UnitFormValues) => {
    setError(null);
    try {
      await createUnit({
        unitNumber: data.unitNumber,
        type: data.type,
        category: data.category,
        floorId: data.floorId,
        towerId: data.towerId,
        buildingId: data.buildingId,
        sizeSqft: data.shareUnit ? parseFloat(data.shareUnit) : undefined,
      }).unwrap();
      router.push('/organization/units');
    } catch (err: any) {
      setError(err.data?.message || 'Failed to create unit');
    }
  };

  return (
    <div>
      <div className="mb-4">
        <Link href="/organization/units" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Units
        </Link>
      </div>

      <PageHeader 
        title="Create Unit" 
        description="Add a new unit, apartment, or shop to a floor."
      />

      {error && (
        <div className="mb-6 rounded-md bg-red-50 dark:bg-red-900/30 p-4 border border-red-200 dark:border-red-800">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-300">{error}</h3>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Unit Location</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Select Building *
                </label>
                <select 
                  className={`block w-full rounded-md border px-3 py-2 text-gray-900 bg-white placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600 ${errors.buildingId ? 'border-red-500' : 'border-gray-300'}`}
                  {...register('buildingId', {
                    onChange: () => {
                      setValue('towerId', '');
                      setValue('floorId', '');
                    }
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
                  {...register('towerId', {
                    onChange: () => setValue('floorId', '')
                  })}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Select Floor *
                </label>
                <select 
                  className={`block w-full rounded-md border px-3 py-2 text-gray-900 bg-white placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600 ${errors.floorId ? 'border-red-500' : 'border-gray-300'}`}
                  {...register('floorId')}
                  disabled={isLoadingFloors || !selectedTowerId || filteredFloors.length === 0}
                >
                  <option value="">
                    {!selectedTowerId
                      ? 'Select a tower first...'
                      : isLoadingFloors
                      ? 'Loading floors...'
                      : filteredFloors.length === 0
                      ? 'No floors in this tower'
                      : 'Select a floor...'}
                  </option>
                  {filteredFloors.map((f: any) => (
                    <option key={f.id} value={f.id}>
                      {f.name} {f.metadata?.level !== undefined ? `(Level ${f.metadata.level})` : ''}
                    </option>
                  ))}
                </select>
                {errors.floorId && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.floorId.message}</p>}
                {selectedTowerId && !isLoadingFloors && filteredFloors.length === 0 && (
                  <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    No floors found in this tower.{' '}
                    <Link href="/organization/floors/create" className="underline font-semibold hover:text-amber-700 dark:hover:text-amber-300">
                      Create a Floor
                    </Link>
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Unit Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
              <Input label="Unit Number (e.g. A-01-05) *" {...register('unitNumber')} error={errors.unitNumber?.message} />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Usage Type *
                </label>
                <select 
                  className={`block w-full rounded-md border px-3 py-2 text-gray-900 bg-white placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600 border-gray-300`}
                  {...register('type')}
                >
                  <option value="RESIDENTIAL">Residential</option>
                  <option value="COMMERCIAL">Commercial</option>
                  <option value="PARKING">Parking</option>
                  <option value="STORAGE">Storage</option>
                </select>
              </div>

              <Input label="Category" placeholder="e.g. 2BHK, Seminar Hall, Studio" {...register('category')} />
              <Input label="Share Unit (Sq Ft)" type="number" {...register('shareUnit')} />
              <Input label="Parcel Number" {...register('parcelNumber')} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-3">
          <Button variant="outline" type="button" onClick={() => router.push('/organization/units')}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Unit'}
          </Button>
        </div>
      </form>
    </div>
  );
}
