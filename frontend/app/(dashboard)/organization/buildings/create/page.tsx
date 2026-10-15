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
import { useCreateBuildingMutation } from '@/services/organizationApi';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { Country, State, City } from 'country-state-city';

const CATEGORY_LABELS: Record<string, string> = {
  'RESIDENTIAL': 'Residential',
  'COMMERCIAL': 'Commercial',
  'MIXED_USE': 'Mixed-Use',
  'STUDENT_HOUSING': 'Student Housing',
};

const buildingSchema = z.object({
  name: z.string().min(2, 'Building name is required'),
  buildingCode: z.string().optional(),
  propertyType: z.string().optional(),
  address: z.string().min(2, 'Street address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State / Province is required'),
  postalCode: z.string().min(2, 'Postal / Zip code is required'),
  country: z.string().min(2, 'Country is required'),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  description: z.string().optional(),
});

type BuildingFormValues = z.infer<typeof buildingSchema>;

export default function CreateBuildingPage() {
  const router = useRouter();
  const [createBuilding, { isLoading }] = useCreateBuildingMutation();
  const [error, setError] = useState<string | null>(null);

  // In production, this comes from the authenticated user's organization profile via Redux
  const allowedCategories = useSelector((state: RootState) => (state.auth.user as any)?.organizationPropertyCategories) || ['RESIDENTIAL'];

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<BuildingFormValues>({
    resolver: zodResolver(buildingSchema),
    defaultValues: {
      propertyType: allowedCategories[0] || '',
      country: '',
    }
  });

  const countries = React.useMemo(() => Country.getAllCountries(), []);
  const selectedCountry = watch('country');
  const selectedState = watch('state');
  const countryObj = countries.find((c) => c.name === selectedCountry);
  const states = React.useMemo(
    () => (countryObj ? State.getStatesOfCountry(countryObj.isoCode) : []),
    [countryObj],
  );
  const stateObj = states.find((s) => s.name === selectedState);
  const cities = React.useMemo(
    () => (countryObj && stateObj ? City.getCitiesOfState(countryObj.isoCode, stateObj.isoCode) : []),
    [countryObj, stateObj],
  );

  const selectClass =
    'block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white';

  const onSubmit = async (data: BuildingFormValues) => {
    setError(null);
    try {
      await createBuilding({
        name: data.name.trim(),
        address: data.address.trim(),
        city: data.city.trim(),
        state: data.state.trim(),
        country: data.country.trim(),
        zipCode: data.postalCode.trim(),
      }).unwrap();
      router.push('/organization/buildings');
    } catch (err: any) {
      setError(err.data?.message || 'Failed to create building');
    }
  };

  return (
    <div>
      <div className="mb-4">
        <Link href="/organization/buildings" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Buildings
        </Link>
      </div>

      <PageHeader 
        title="Create Building" 
        description="Add a new building to your organization's portfolio."
      />

      {error && (
        <div className="mb-6 rounded-md bg-red-50 dark:bg-red-900/30 p-4 border border-red-200 dark:border-red-800">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-300">{error}</h3>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Input label="Building Name *" {...register('name')} error={errors.name?.message} />
              <Input label="Building Code" {...register('buildingCode')} />
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Property Type
                </label>
                <select 
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 dark:focus:ring-blue-400"
                  {...register('propertyType')}
                >
                  {allowedCategories.map((cat: string) => (
                    <option key={cat} value={cat}>{CATEGORY_LABELS[cat] || cat}</option>
                  ))}
                </select>
              </div>
              <Input label="Description" {...register('description')} />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Location Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="w-full space-y-1.5">
                <label htmlFor="country" className="block text-xs font-bold text-slate-700 dark:text-slate-300">Country *</label>
                <select
                  id="country"
                  className={selectClass}
                  {...register('country', {
                    onChange: () => {
                      setValue('state', '');
                      setValue('city', '');
                    },
                  })}
                >
                  <option value="">Select country</option>
                  {countries.map((c) => (
                    <option key={c.isoCode} value={c.name}>{c.name}</option>
                  ))}
                </select>
                {errors.country && <p className="text-xs font-bold text-rose-600">{errors.country.message}</p>}
              </div>
              <div className="w-full space-y-1.5">
                <label htmlFor="state" className="block text-xs font-bold text-slate-700 dark:text-slate-300">State/Province *</label>
                <select
                  id="state"
                  className={selectClass}
                  disabled={!countryObj || states.length === 0}
                  {...register('state', { onChange: () => setValue('city', '') })}
                >
                  <option value="">Select state / province</option>
                  {states.map((s) => (
                    <option key={s.isoCode} value={s.name}>{s.name}</option>
                  ))}
                </select>
                {errors.state && <p className="text-xs font-bold text-rose-600">{errors.state.message}</p>}
              </div>
              <div className="w-full space-y-1.5">
                <label htmlFor="city" className="block text-xs font-bold text-slate-700 dark:text-slate-300">City *</label>
                <select
                  id="city"
                  className={selectClass}
                  disabled={!stateObj || cities.length === 0}
                  {...register('city')}
                >
                  <option value="">Select city</option>
                  {cities.map((c) => (
                    <option key={`${c.name}-${c.latitude}-${c.longitude}`} value={c.name}>{c.name}</option>
                  ))}
                </select>
                {errors.city && <p className="text-xs font-bold text-rose-600">{errors.city.message}</p>}
              </div>
              <Input label="Postal Code *" {...register('postalCode')} error={errors.postalCode?.message} />
              <div className="sm:col-span-2">
                <Input label="Full Address *" {...register('address')} error={errors.address?.message} />
              </div>
              <Input label="Latitude" {...register('latitude')} />
              <Input label="Longitude" {...register('longitude')} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-3">
          <Button variant="outline" type="button" onClick={() => router.push('/organization/buildings')}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Building'}
          </Button>
        </div>
      </form>
    </div>
  );
}
