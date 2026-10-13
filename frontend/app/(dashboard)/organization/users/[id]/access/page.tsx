'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useGetRolesQuery } from '@/services/rolesApi';
import { useGetUsersQuery, useAssignRolesMutation, useAssignPropertiesMutation } from '@/services/userApi';
import { useGetBuildingsQuery } from '@/services/organizationApi';
import { Button } from '@/components/ui/Button';

export default function ManageUserAccessPage() {
  const router = useRouter();
  const { id: userId } = useParams();
  
  const { data: rolesData, isLoading: isLoadingRoles } = useGetRolesQuery({});
  const { data: usersResponse, isLoading: isLoadingUsers } = useGetUsersQuery({});
  const { data: buildingsResponse, isLoading: isLoadingBuildings } = useGetBuildingsQuery({});
  
  const [assignRoles] = useAssignRolesMutation();
  const [assignProperties, { isLoading: isAssigningProperties }] = useAssignPropertiesMutation();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const user = usersResponse?.data?.find((u: any) => u.id === userId);

  if (isLoadingRoles || isLoadingUsers || isLoadingBuildings) return <div className="p-8 text-center text-gray-500">Loading configurations...</div>;
  if (!user) return <div className="p-8 text-center text-red-500">User not found.</div>;

  const userRoleIds = user.userRoles?.map((ur: any) => ur.role?.id || ur.roleId).filter(Boolean) || [];
  const isBuildingManager = user.userRoles?.some((ur: any) => ur.role?.name === 'BUILDING_MANAGER');
  
  // Use state for properties so we can toggle and save
  const [assignedProperties, setAssignedProperties] = useState<string[]>(
    user.userPropertyNodes?.filter((pn: any) => pn.accessLevel === 'MANAGER').map((pn: any) => pn.propertyNodeId) || []
  );

  const handleToggle = async (roleId: string, isAssigned: boolean) => {
    setError(null);
    let updatedRoleIds = [...userRoleIds];
    
    if (isAssigned) {
      updatedRoleIds = updatedRoleIds.filter(id => id !== roleId);
    } else {
      updatedRoleIds.push(roleId);
    }

    try {
      await assignRoles({ userId, roleIds: updatedRoleIds }).unwrap();
      setSuccess('Roles updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.data?.message || 'Failed to update roles');
    }
  };

  const handlePropertyToggle = (propertyId: string) => {
    setAssignedProperties(prev => 
      prev.includes(propertyId) ? prev.filter(id => id !== propertyId) : [...prev, propertyId]
    );
  };

  const handleSaveProperties = async () => {
    setError(null);
    try {
      await assignProperties({ id: userId, propertyIds: assignedProperties }).unwrap();
      setSuccess('Buildings assigned successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.data?.message || 'Failed to assign buildings');
    }
  };

  return (
    <div>
      <div className="mb-4">
        <Link href="/organization/users" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Users
        </Link>
      </div>

      <PageHeader 
        title={`Manage Roles: ${user.firstName} ${user.lastName || ''}`} 
        description="Assign security roles and profiles to this user."
      />

      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4 border border-red-200">
          <h3 className="text-sm font-medium text-red-800">{error}</h3>
        </div>
      )}
      {success && (
        <div className="mb-6 rounded-md bg-green-50 p-4 border border-green-200">
          <h3 className="text-sm font-medium text-green-800">{success}</h3>
        </div>
      )}

      <div className="space-y-6">
        <Card>
        <CardHeader>
          <CardTitle>Assigned Roles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rolesData?.map((role: any) => {
              const isAssigned = userRoleIds.includes(role.id);
              return (
                <div key={role.id} className="flex items-start p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex h-5 items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={isAssigned}
                      onChange={() => handleToggle(role.id, isAssigned)}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label className="font-medium text-gray-900 uppercase">
                      {role.name}
                    </label>
                    <p className="text-gray-500 text-xs mt-1">
                      {role.description || `Grants ${role.name} privileges.`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {isBuildingManager && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Building Manager Assignment</CardTitle>
            <Button onClick={handleSaveProperties} disabled={isAssigningProperties} className="bg-blue-600 hover:bg-blue-700 text-white">
              {isAssigningProperties ? 'Saving...' : 'Save Assignments'}
            </Button>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">Select the buildings this user is allowed to manage.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {buildingsResponse?.data?.map((building: any) => {
                const isAssigned = assignedProperties.includes(building.id);
                return (
                  <div key={building.id} className="flex items-start p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex h-5 items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={isAssigned}
                        onChange={() => handlePropertyToggle(building.id)}
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label className="font-medium text-gray-900">
                        {building.name}
                      </label>
                      <p className="text-gray-500 text-xs mt-1">
                        Type: {building.nodeType}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
}
