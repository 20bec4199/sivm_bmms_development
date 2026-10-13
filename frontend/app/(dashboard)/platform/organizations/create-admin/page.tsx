'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useInviteOrganizationAdminMutation } from '@/services/platformApi';
import { CheckCircle2, UserPlus } from 'lucide-react';
import Link from 'next/link';

const adminSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
});

type AdminFormValues = z.infer<typeof adminSchema>;

export default function CreateOrganizationAdminPage() {
  const router = useRouter();
  const [inviteAdmin, { isLoading }] = useInviteOrganizationAdminMutation();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [orgData, setOrgData] = useState<{ orgId: string, name: string } | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('pendingOrgData');
    if (stored) {
      try {
        setOrgData(JSON.parse(stored));
      } catch (e) {}
    } else {
      router.push('/platform/organizations');
    }
  }, [router]);

  const { register, handleSubmit, formState: { errors } } = useForm<AdminFormValues>({
    resolver: zodResolver(adminSchema),
  });

  const onSubmit = async (data: AdminFormValues) => {
    setError(null);
    if (!orgData?.orgId) return;

    try {
      await inviteAdmin({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        orgId: orgData.orgId
      }).unwrap();

      sessionStorage.removeItem('pendingOrgData');
      setSuccess(true);
    } catch (err: any) {
      setError(err.data?.message || 'Failed to invite administrator');
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto mt-12 text-center bg-white dark:bg-gray-800 p-12 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
          <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4">Invitation Email Sent!</h2>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
          The organization administrator for <strong>{orgData?.name}</strong> has been successfully created. They will receive an email shortly to set their password.
        </p>
        <Link href="/platform/organizations">
          <Button size="lg">Return to Organizations</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <PageHeader 
        title="Create Organization Administrator" 
        description={`Set up the primary administrative account for ${orgData?.name || 'the organization'}.`}
      />

      <div className="mb-6 rounded-md bg-green-50 dark:bg-green-900/20 p-4 border border-green-200 dark:border-green-800 flex items-center">
        <CheckCircle2 className="h-5 w-5 text-green-500 mr-3" />
        <span className="text-sm font-medium text-green-800 dark:text-green-300">
          Organization created successfully. Now, create the Organization Administrator.
        </span>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-red-50 dark:bg-red-900/30 p-4 border border-red-200 dark:border-red-800">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-300">{error}</h3>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Administrator Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-6 mb-8">
              <div className="h-24 w-24 rounded-full bg-gray-100 dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-400">
                <UserPlus className="h-8 w-8" />
              </div>
              <div>
                <Button variant="outline" type="button" size="sm">Upload Photo</Button>
                <p className="text-xs text-gray-500 mt-2">JPG, GIF or PNG. Max size of 800K</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Input label="First Name *" {...register('firstName')} error={errors.firstName?.message} />
              <Input label="Last Name *" {...register('lastName')} error={errors.lastName?.message} />
              <Input label="Email Address *" type="email" {...register('email')} error={errors.email?.message} />
              <Input label="Phone Number" {...register('phone')} />
              <Input label="Department" {...register('department')} />
              <Input label="Designation" {...register('designation')} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-3">
          <Button variant="outline" type="button" onClick={() => router.push('/platform/organizations')}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Administrator'}
          </Button>
        </div>
      </form>
    </div>
  );
}
