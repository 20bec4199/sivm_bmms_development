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
import { useCreateRoleMutation } from '@/services/rolesApi';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const roleSchema = z.object({
  name: z.string().min(2, 'Role name must be at least 2 characters'),
  description: z.string().optional(),
});

type RoleFormValues = z.infer<typeof roleSchema>;

export default function CreateRolePage() {
  const router = useRouter();
  const [createRole, { isLoading }] = useCreateRoleMutation();
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
  });

  const onSubmit = async (data: RoleFormValues) => {
    setError(null);
    try {
      await createRole(data).unwrap();
      router.push('/organization/roles');
    } catch (err: any) {
      setError(err.data?.message || 'Failed to create role');
    }
  };

  return (
    <div>
      <div className="mb-4">
        <Link href="/organization/roles" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Roles
        </Link>
      </div>

      <PageHeader 
        title="Create Role" 
        description="Define a new security role for your organization."
      />

      {error && (
        <div className="mb-6 rounded-md bg-red-50 dark:bg-red-900/30 p-4 border border-red-200 dark:border-red-800">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-300">{error}</h3>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Role Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Input label="Role Name (e.g. BUILDING_MANAGER) *" {...register('name')} error={errors.name?.message} />
              <Input label="Description" placeholder="Optional brief description" {...register('description')} error={errors.description?.message} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-3">
          <Button variant="outline" type="button" onClick={() => router.push('/organization/roles')}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Role'}
          </Button>
        </div>
      </form>
    </div>
  );
}
