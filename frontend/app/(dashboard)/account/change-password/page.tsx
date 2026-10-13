'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useChangePasswordMutation } from '../../../../services/authApi';
import { useDispatch } from 'react-redux';
import { logout } from '../../../../store/slices/authSlice';
import { useRouter } from 'next/navigation';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export default function ChangePasswordPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [changePassword, { isLoading }] = useChangePasswordMutation();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordFormValues) => {
    setError(null);
    try {
      await changePassword(data).unwrap();
      setSuccess(true);
      reset();
      
      // Force re-login after 3 seconds for security
      setTimeout(() => {
        dispatch(logout());
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.data?.message || 'Failed to change password');
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10 sm:px-6 lg:px-8">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 transition-colors duration-200">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Change Password</h2>

        {success && (
          <div className="mb-6 rounded-md bg-green-50 dark:bg-green-900/30 p-4 border border-green-200 dark:border-green-800">
            <h3 className="text-sm font-medium text-green-800 dark:text-green-300">
              Password successfully changed! You will be logged out in 3 seconds to re-authenticate.
            </h3>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-md bg-red-50 dark:bg-red-900/30 p-4 border border-red-200 dark:border-red-800">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-300">{error}</h3>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Current Password</label>
            <input
              type="password"
              className={`mt-1 block w-full rounded-md border px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm ${errors.currentPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
              {...register('currentPassword')}
            />
            {errors.currentPassword && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.currentPassword.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
            <input
              type="password"
              className={`mt-1 block w-full rounded-md border px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm ${errors.newPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
              {...register('newPassword')}
            />
            {errors.newPassword && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.newPassword.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm New Password</label>
            <input
              type="password"
              className={`mt-1 block w-full rounded-md border px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.confirmPassword.message}</p>}
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isLoading || success}
              className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400 dark:disabled:bg-blue-800 transition-colors"
            >
              {isLoading ? 'Updating...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
