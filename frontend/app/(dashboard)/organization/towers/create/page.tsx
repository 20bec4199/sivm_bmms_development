'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useCreateTowerMutation, useGetBuildingsQuery } from '@/services/organizationApi';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const towerSchema = z.object({
  name: z.string().min(2, 'Tower name is required'),
  buildingId: z.string().min(1, 'Building selection is required'),
});

type TowerFormValues = z.infer<typeof towerSchema>;

export default function CreateTowerPage() {
  const router = useRouter();
  const { data: buildingsData, isLoading: isLoadingBuildings } = useGetBuildingsQuery({});
  const [createTower, { isLoading }] = useCreateTowerMutation();
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<TowerFormValues>({
    resolver: zodResolver(towerSchema),
  });

  const onSubmit = async (data: TowerFormValues) => {
    setError(null);
    try {
      await createTower({
        name: data.name,
        buildingId: data.buildingId,
      }).unwrap();
      router.push('/organization/towers');
    } catch (err: any) {
      setError(err.data?.message || 'Failed to create tower');
    }
  };

  return (
    <div>
      <div className="mb-4">
        <Link href="/organization/towers" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Towers
        </Link>
      </div>

      <PageHeader 
        title="Create Tower" 
        description="Add a new tower or block to an existing building."
      />

      {error && (
        <div className="mb-6 rounded-md bg-red-50 dark:bg-red-900/30 p-4 border border-red-200 dark:border-red-800">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-300">{error}</h3>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Tower Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Input label="Tower Name *" {...register('name')} error={errors.name?.message} />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Select Building *
                </label>
                <select 
                  className={`block w-full rounded-md border px-3 py-2 text-gray-900 bg-white placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600 ${errors.buildingId ? 'border-red-500' : 'border-gray-300'}`}
                  {...register('buildingId')}
                  disabled={isLoadingBuildings}
                >
                  <option value="">Select a building...</option>
                  {buildingsData?.data?.map((b: any) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
                {errors.buildingId && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.buildingId.message}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-3">
          <Button variant="outline" type="button" onClick={() => router.push('/organization/towers')}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Tower'}
          </Button>
        </div>
      </form>
    </div>
  );
}
