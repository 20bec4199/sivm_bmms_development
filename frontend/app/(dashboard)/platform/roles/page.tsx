'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Plus, ShieldCheck, Building2 } from 'lucide-react';
import Link from 'next/link';
import { useGetRolesQuery } from '@/services/rolesApi';
import { useGetOrganizationsQuery } from '@/services/platformApi';

interface RoleData {
  id: string;
  name: string;
  description: string;
  _count: {
    userRoles: number;
  };
  rolePermissions: any[];
}

export default function PlatformRolesPage() {
  const { data: orgResponse, isLoading: isLoadingOrgs } = useGetOrganizationsQuery({});
  const organizations = orgResponse?.data || [];
  
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');

  useEffect(() => {
    if (organizations.length > 0 && !selectedOrgId) {
      setSelectedOrgId(organizations[0].id);
    }
  }, [organizations, selectedOrgId]);

  const { data: rolesData, isLoading: isLoadingRoles } = useGetRolesQuery(
    selectedOrgId ? { orgId: selectedOrgId } : {},
    { skip: !selectedOrgId }
  );

  const columns: Column<RoleData>[] = [
    {
      header: 'Role Name',
      accessorKey: 'name',
      cell: (role) => (
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
            <ShieldCheck className="h-5 w-5 text-indigo-600" />
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
        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
          {role._count?.userRoles || 0} Users
        </span>
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
          <Link href={`/platform/roles/${role.id}/permissions?orgId=${selectedOrgId}`}>
            <span className="text-indigo-600 hover:text-indigo-900 text-sm font-medium dark:text-indigo-400 dark:hover:text-indigo-300">Manage Permissions</span>
          </Link>
        </div>
      )
    }
  ];

  return (
    <div>
      <PageHeader 
        title="Platform Access Management" 
        description="Globally manage security roles and permissions for any tenant organization."
        action={
          <Link href={`/platform/roles/create?orgId=${selectedOrgId}`}>
            <Button disabled={!selectedOrgId}>
              <Plus className="mr-2 h-4 w-4" />
              Create Role
            </Button>
          </Link>
        }
      />

      <Card className="mb-6">
        <CardContent className="p-4 flex items-center space-x-4">
          <Building2 className="text-gray-400 h-5 w-5" />
          <div className="flex-1 max-w-md">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Select Organization
            </label>
            <select
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              disabled={isLoadingOrgs}
            >
              <option value="" disabled>Select an organization...</option>
              {organizations.map((org: any) => (
                <option key={org.id} value={org.id}>{org.name} ({org.status})</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <DataTable 
            columns={columns} 
            data={rolesData || []} 
            isLoading={isLoadingRoles || isLoadingOrgs} 
          />
        </CardContent>
      </Card>
    </div>
  );
}
