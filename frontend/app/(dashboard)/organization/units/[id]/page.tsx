'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/Input';
import { 
  useGetUnitQuery, 
  useGetOwnersQuery,
  useGetTenantsQuery,
  useCreateOwnerMutation,
  useCreateTenantMutation,
  useDeleteOwnerMutation,
  useDeleteTenantMutation
} from '@/services/organizationApi';
import { ArrowLeft, Plus, User, UserCheck, Trash2 } from 'lucide-react';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useDispatch } from 'react-redux';
import { showWarning } from '@/store/slices/uiSlice';

export default function UnitDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const dispatch = useDispatch();
  const confirm = useConfirm();
  const [activeTab, setActiveTab] = useState<'owners' | 'tenants'>('owners');
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  const { data: unit, isLoading: isLoadingUnit } = useGetUnitQuery(id);
  const { data: ownersResponse, isLoading: isLoadingOwners } = useGetOwnersQuery({ propertyNodeId: id });
  const { data: tenantsResponse, isLoading: isLoadingTenants } = useGetTenantsQuery({ propertyNodeId: id });
  
  const [createOwner, { isLoading: isCreatingOwner }] = useCreateOwnerMutation();
  const [createTenant, { isLoading: isCreatingTenant }] = useCreateTenantMutation();
  const [deleteOwner] = useDeleteOwnerMutation();
  const [deleteTenant] = useDeleteTenantMutation();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateResident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.phone.trim()) return;
    
    try {
      const payload = {
        ...formData,
        propertyNodeId: id,
      };

      if (activeTab === 'owners') {
        await createOwner(payload).unwrap();
      } else {
        await createTenant(payload).unwrap();
      }
      setIsCreating(false);
      setFormData({ firstName: '', lastName: '', email: '', phone: '' });
    } catch (err: any) {
      dispatch(showWarning({ title: 'Creation Failed', message: err.data?.message || `Failed to add ${activeTab === 'owners' ? 'owner' : 'tenant'}` }));
    }
  };

  const handleDeleteResident = async (residentId: string) => {
    const isConfirmed = await confirm({
      title: `Remove ${activeTab === 'owners' ? 'Owner' : 'Tenant'}`,
      message: `Are you sure you want to remove this ${activeTab === 'owners' ? 'owner' : 'tenant'}?`,
      confirmText: 'Yes, Remove',
      cancelText: 'Cancel',
      destructive: true,
    });
    
    if (isConfirmed) {
      try {
        if (activeTab === 'owners') {
          await deleteOwner(residentId).unwrap();
        } else {
          await deleteTenant(residentId).unwrap();
        }
      } catch (err: any) {
        dispatch(showWarning({ title: 'Remove Failed', message: err.data?.message || 'Failed to remove resident' }));
      }
    }
  };

  const residentColumns: Column<any>[] = [
    {
      header: 'Name',
      accessorKey: 'firstName',
      cell: (resident) => (
        <div className="flex items-center">
          {activeTab === 'owners' ? (
            <UserCheck className="mr-2 h-4 w-4 text-purple-500" />
          ) : (
            <User className="mr-2 h-4 w-4 text-orange-500" />
          )}
          <span className="font-medium text-gray-900 dark:text-white">
            {resident.firstName} {resident.lastName}
          </span>
        </div>
      )
    },
    { header: 'Email', accessorKey: 'email' },
    { header: 'Phone', accessorKey: 'phone' },
    {
      header: 'Added Date',
      accessorKey: 'createdAt',
      cell: (resident) => new Date(resident.createdAt).toLocaleDateString()
    },
    {
      header: 'Actions',
      accessorKey: 'actions',
      cell: (resident) => (
        <div className="flex space-x-2 items-center">
          <button 
            onClick={() => handleDeleteResident(resident.id)}
            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  if (isLoadingUnit) return <div>Loading...</div>;
  if (!unit) return <div>Unit not found</div>;

  return (
    <div>
      <div className="mb-4">
        <Link href={`/organization/floors/${unit.floorId}`} className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Floor
        </Link>
      </div>

      <PageHeader 
        title={`Unit ${unit.unitNumber}`} 
        description="Manage owners and tenants for this unit."
      />

      <div className="mb-6 border-b border-gray-200 dark:border-gray-800">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('owners')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center ${
              activeTab === 'owners'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <UserCheck className="mr-2 h-5 w-5" />
            Owners
          </button>
          <button
            onClick={() => setActiveTab('tenants')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center ${
              activeTab === 'tenants'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <User className="mr-2 h-5 w-5" />
            Tenants
          </button>
        </nav>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{activeTab === 'owners' ? 'Unit Owners' : 'Unit Tenants'}</CardTitle>
          {!isCreating && (
            <Button size="sm" onClick={() => setIsCreating(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add {activeTab === 'owners' ? 'Owner' : 'Tenant'}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isCreating && (
            <form onSubmit={handleCreateResident} className="mb-6 p-4 border border-gray-200 dark:border-gray-800 rounded-md bg-gray-50 dark:bg-gray-900/50">
              <h4 className="text-sm font-medium mb-3">Add New {activeTab === 'owners' ? 'Owner' : 'Tenant'}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <Input 
                  label="First Name" name="firstName"
                  value={formData.firstName} onChange={handleInputChange} required
                />
                <Input 
                  label="Last Name" name="lastName"
                  value={formData.lastName} onChange={handleInputChange}
                />
                <Input 
                  label="Email" name="email" type="email"
                  value={formData.email} onChange={handleInputChange}
                />
                <Input 
                  label="Phone Number" name="phone"
                  value={formData.phone} onChange={handleInputChange} required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
                <Button type="submit" disabled={isCreatingOwner || isCreatingTenant}>
                  {isCreatingOwner || isCreatingTenant ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </form>
          )}

          <DataTable 
            columns={residentColumns} 
            data={activeTab === 'owners' ? (ownersResponse?.data || []) : (tenantsResponse?.data || [])} 
            isLoading={activeTab === 'owners' ? isLoadingOwners : isLoadingTenants} 
          />
        </CardContent>
      </Card>
    </div>
  );
}
