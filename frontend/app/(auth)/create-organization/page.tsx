'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';

import { useCreateOrganizationMutation } from '../../../services/authApi';

const orgSchema = z.object({
  name: z.string().min(3, 'Organization name must be at least 3 characters'),
  industry: z.string().min(2, 'Industry is required'),
  size: z.enum(['1-10', '11-50', '51-200', '201+']),
});

type OrgFormValues = z.infer<typeof orgSchema>;

export default function CreateOrganizationPage() {
  const [createOrganization, { isLoading }] = useCreateOrganizationMutation();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<OrgFormValues>({
    resolver: zodResolver(orgSchema),
    defaultValues: {
      size: '1-10'
    }
  });

  const onSubmit = async (data: OrgFormValues) => {
    setError(null);
    try {
      const response = await createOrganization(data).unwrap();
      
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('pendingOrgData', JSON.stringify({ ...data, orgId: response.id }));
      }
      setSuccess(true);
    } catch (err: any) {
      setError(err.data?.message || err.message || 'Failed to create organization');
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 transition-colors duration-200">
        <div className="w-full max-w-md space-y-8 rounded-2xl bg-white dark:bg-gray-800 p-8 shadow-xl text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">Organization Created!</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Your organization has been successfully registered. Let's set up the admin account next.
          </p>
          <div className="mt-6">
            <Link href="/create-admin" className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              Continue to Admin Setup
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 transition-colors duration-200">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white dark:bg-gray-800 p-8 shadow-xl">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Register Organization</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Step 1 of 2: Organization Details</p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4 border border-red-200 dark:border-red-800">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-300">{error}</h3>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="name">Organization Name</label>
              <input
                id="name"
                type="text"
                className={`mt-1 block w-full rounded-md border px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm ${errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                placeholder="Acme Corp"
                {...register('name')}
              />
              {errors.name && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="industry">Industry</label>
              <input
                id="industry"
                type="text"
                className={`mt-1 block w-full rounded-md border px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm ${errors.industry ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                placeholder="Real Estate"
                {...register('industry')}
              />
              {errors.industry && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.industry.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="size">Organization Size</label>
              <select
                id="size"
                className={`mt-1 block w-full rounded-md border px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm ${errors.size ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                {...register('size')}
              >
                <option value="1-10">1-10 employees</option>
                <option value="11-50">11-50 employees</option>
                <option value="51-200">51-200 employees</option>
                <option value="201+">201+ employees</option>
              </select>
              {errors.size && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.size.message}</p>}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400 dark:disabled:bg-blue-800 transition-colors"
            >
              {isLoading ? 'Creating...' : 'Create Organization'}
            </button>
          </div>
          
          <div className="text-center text-sm">
            <Link href="/login" className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500">
              Already have an account? Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
