'use client';

import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store/store';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const profileSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [isEditing, setIsEditing] = React.useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
    }
  });

  const onSubmit = async (data: ProfileFormValues) => {
    // API Call would go here
    setIsEditing(false);
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto py-10 sm:px-6 lg:px-8">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 transition-colors duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Profile Details</h2>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500"
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        <div className="flex items-center mb-8 space-x-6">
          <div className="h-24 w-24 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 text-3xl font-bold">
            {user.firstName[0]}
            {user.lastName?.[0]}
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{user.firstName} {user.lastName}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
            <div className="mt-2 flex gap-2 flex-wrap">
              {user.roles.map(role => (
                <span key={role} className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-900/50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {role.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">First Name</label>
              <input
                type="text"
                disabled={!isEditing}
                className={`mt-1 block w-full rounded-md border px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500 ${errors.firstName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                {...register('firstName')}
              />
              {errors.firstName && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.firstName.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Last Name</label>
              <input
                type="text"
                disabled={!isEditing}
                className={`mt-1 block w-full rounded-md border px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500 ${errors.lastName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                {...register('lastName')}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address (Read-only)</label>
              <input
                type="email"
                disabled
                value={user.email}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-500 shadow-sm sm:text-sm"
              />
            </div>
            
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Status</label>
              <div className="mt-1 flex items-center">
                {user.isEmailVerified ? (
                  <span className="text-sm text-green-600 dark:text-green-400 flex items-center">
                    <svg className="mr-1.5 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Verified
                  </span>
                ) : (
                  <span className="text-sm text-amber-600 dark:text-amber-400 flex items-center">
                    <svg className="mr-1.5 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Unverified
                  </span>
                )}
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="flex justify-end pt-4 space-x-3">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 px-4 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Save Changes
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
