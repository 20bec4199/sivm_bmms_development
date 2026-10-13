'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { 
  useGetRolesQuery, 
  useGetPermissionsQuery, 
  useAssignPermissionMutation, 
  useRemovePermissionMutation 
} from '@/services/rolesApi';

export default function ManageRolePermissionsPage() {
  const router = useRouter();
  const { id: roleId } = useParams();
  
  const { data: rolesData, isLoading: isLoadingRoles } = useGetRolesQuery({});
  const { data: allPermissions, isLoading: isLoadingPerms } = useGetPermissionsQuery({});
  
  const [assignPerm] = useAssignPermissionMutation();
  const [removePerm] = useRemovePermissionMutation();

  const [error, setError] = useState<string | null>(null);

  const role = rolesData?.find((r: any) => r.id === roleId);

  if (isLoadingRoles || isLoadingPerms) return <div className="p-8 text-center text-gray-500">Loading configurations...</div>;
  if (!role) return <div className="p-8 text-center text-red-500">Role not found.</div>;

  const rolePermissionIds = role.rolePermissions.map((rp: any) => rp.permissionId);

  const handleToggle = async (permissionId: string, isAssigned: boolean) => {
    setError(null);
    try {
      if (isAssigned) {
        await removePerm({ roleId, permissionId }).unwrap();
      } else {
        await assignPerm({ roleId, permissionId }).unwrap();
      }
    } catch (err: any) {
      setError(err.data?.message || 'Failed to update permission');
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
        title={`Permissions: ${role.name}`} 
        description="Toggle the exact actions this role is authorized to perform."
      />

      {error && (
        <div className="mb-6 rounded-md bg-red-50 dark:bg-red-900/30 p-4 border border-red-200 dark:border-red-800">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-300">{error}</h3>
        </div>
      )}

      <div className="space-y-6">
        {allPermissions && (() => {
          const grouped = allPermissions.reduce((acc: any, perm: any) => {
            if (!acc[perm.subject]) acc[perm.subject] = [];
            acc[perm.subject].push(perm);
            return acc;
          }, {});

          return Object.keys(grouped).sort().map(subject => {
            const subjectPerms = grouped[subject];
            const allAssigned = subjectPerms.every((p: any) => rolePermissionIds.includes(p.id));
            
            const handleToggleAll = async () => {
              setError(null);
              try {
                const promises = subjectPerms.map((p: any) => {
                  const isAssigned = rolePermissionIds.includes(p.id);
                  if (allAssigned && isAssigned) {
                    return removePerm({ roleId, permissionId: p.id }).unwrap();
                  } else if (!allAssigned && !isAssigned) {
                    return assignPerm({ roleId, permissionId: p.id }).unwrap();
                  }
                  return Promise.resolve();
                });
                await Promise.all(promises);
              } catch (err: any) {
                setError(err.data?.message || 'Failed to update permissions in batch');
              }
            };

            return (
              <Card key={subject}>
                <CardHeader className="bg-gray-50 dark:bg-gray-900 border-b dark:border-gray-800 py-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-lg font-semibold uppercase text-gray-700 dark:text-gray-300">
                    {subject} Module
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`select-all-${subject}`}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      checked={allAssigned}
                      onChange={handleToggleAll}
                    />
                    <label htmlFor={`select-all-${subject}`} className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                      Select All
                    </label>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {subjectPerms.map((perm: any) => {
                      const isAssigned = rolePermissionIds.includes(perm.id);
                      return (
                        <div key={perm.id} className="flex items-start p-3 border rounded-md dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <div className="flex h-5 items-center">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              checked={isAssigned}
                              onChange={() => handleToggle(perm.id, isAssigned)}
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label className="font-medium text-gray-900 dark:text-gray-100 uppercase">
                              {perm.action}
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          });
        })()}
      </div>
    </div>
  );
}
