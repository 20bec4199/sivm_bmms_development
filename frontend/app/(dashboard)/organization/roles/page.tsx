'use client';

import React from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Plus, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useGetRolesQuery } from '@/services/rolesApi';

interface RoleData {
  id: string;
  name: string;
  description: string;
  _count: {
    userRoles: number;
  };
  rolePermissions: any[];
}

export default function OrgRolesPage() {
  const { data: rolesData, isLoading } = useGetRolesQuery({});

  const columns: Column<RoleData>[] = [
    {
      header: 'Role Name',
      accessorKey: 'name',
      cell: (role) => (
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center mr-3">
            <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-white">{role.name}</div>
            <div className="text-gray-500 text-xs dark:text-gray-400">{role.description || 'No description'}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Assigned Users',
      accessorKey: 'users',
      cell: (role) => (
        <Badge variant="secondary">
          {role._count?.userRoles || 0} Users
        </Badge>
      )
    },
    {
      header: 'Permissions',
      accessorKey: 'permissions',
      cell: (role) => (
        <span className="text-gray-700 dark:text-gray-300">
          {role.rolePermissions?.length || 0} configured
        </span>
      )
    },
    {
      header: 'Actions',
      accessorKey: 'actions',
      cell: (role) => (
        <div className="flex space-x-2">
          <Link href={`/organization/roles/${role.id}/permissions`}>
            <Button variant="outline" size="sm">Manage Permissions</Button>
          </Link>
        </div>
      )
    }
  ];

  return (
    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 shadow-sm space-y-6 w-full">
      <PageHeader 
        title="Access Management" 
        description="Manage roles, permissions, and security profiles for your organization."
        action={
          <Link href="/organization/roles/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Role
            </Button>
          </Link>
        }
      />

      <Card>
        <CardContent className="p-0">
          <DataTable 
            columns={columns} 
            data={rolesData || []} 
            isLoading={isLoading} 
          />
        </CardContent>
      </Card>
    </div>
  );
}
