'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useInviteAdminMutation } from '../../../services/authApi';

const adminSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Invalid email address'),
});

type AdminFormValues = z.infer<typeof adminSchema>;

export default function CreateAdminPage() {
  const router = useRouter();
  const [inviteAdmin, { isLoading }] = useInviteAdminMutation();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<AdminFormValues>({
    resolver: zodResolver(adminSchema),
  });

  const onSubmit = async (data: AdminFormValues) => {
    setError(null);
    try {
      let orgId = '';
      if (typeof window !== 'undefined') {
        const stored = sessionStorage.getItem('pendingOrgData');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            orgId = parsed.orgId;
          } catch (e) {}
        }
      }

      if (!orgId) {
        setError("Missing Organization ID. Please complete the previous step first.");
        return;
      }

      await inviteAdmin({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        orgId
      }).unwrap();
      
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('pendingOrgData');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.data?.message || 'Failed to invite admin account');
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
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">Admin Invited!</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            An activation email has been sent to the new administrator. They can use the link in the email to set their password and log in.
          </p>
          <div className="mt-6">
            <Link href="/dashboard" className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              Return to Dashboard
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
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Invite Admin</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Step 2: Invite the first administrator</p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4 border border-red-200 dark:border-red-800">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-300">{error}</h3>
              </div>
            </div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="firstName">First Name</label>
                <input
                  id="firstName"
                  type="text"
                  className={`mt-1 block w-full rounded-md border px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm ${errors.firstName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                  {...register('firstName')}
                />
                {errors.firstName && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="lastName">Last Name</label>
                <input
                  id="lastName"
                  type="text"
                  className={`mt-1 block w-full rounded-md border px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm ${errors.lastName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                  {...register('lastName')}
                />
                {errors.lastName && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.lastName.message}</p>}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                className={`mt-1 block w-full rounded-md border px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                {...register('email')}
              />
              {errors.email && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.email.message}</p>}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400 dark:disabled:bg-blue-800 transition-colors"
            >
              {isLoading ? 'Sending Invite...' : 'Send Activation Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
