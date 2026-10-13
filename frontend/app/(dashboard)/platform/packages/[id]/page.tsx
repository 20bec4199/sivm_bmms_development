'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  useGetPackageQuery, 
  useUpdatePackageMutation, 
  useAddModuleToPackageMutation, 
  useRemoveModuleFromPackageMutation,
  useGetAvailableModulesQuery
} from '@/services/packagesApi';
import { useDispatch } from 'react-redux';
import { showWarning } from '@/store/slices/uiSlice';
import { Trash2, Plus, Box, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { StatusBadge } from '@/components/ui/Badge';
import { useConfirm } from '@/providers/ConfirmProvider';

export default function PackageDetailsPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const confirm = useConfirm();
  
  const { data: packageData, isLoading } = useGetPackageQuery(id);
  const { data: modulesData } = useGetAvailableModulesQuery({});
  const [updatePackage] = useUpdatePackageMutation();
  const [addModule, { isLoading: isAdding }] = useAddModuleToPackageMutation();
  const [removeModule] = useRemoveModuleFromPackageMutation();

  const [selectedModule, setSelectedModule] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });

  const pkg = packageData?.data;
  const availableModules = modulesData?.data || [];
  const assignedModules = pkg?.packageModules || [];

  const handleEditClick = () => {
    setFormData({ name: pkg?.name || '', description: pkg?.description || '' });
    setEditMode(true);
  };

  const handleUpdate = async () => {
    try {
      await updatePackage({ id, data: formData }).unwrap();
      dispatch(showWarning({ title: 'Success', message: 'Package updated.' }));
      setEditMode(false);
    } catch (err: any) {
      dispatch(showWarning({ title: 'Error', message: err.data?.message || 'Failed to update.' }));
    }
  };

  const handleAddModule = async () => {
    if (!selectedModule) return;
    try {
      await addModule({ id, moduleId: selectedModule }).unwrap();
      dispatch(showWarning({ title: 'Module Added', message: 'Successfully added module to package.' }));
      setSelectedModule('');
    } catch (err: any) {
      dispatch(showWarning({ title: 'Error', message: err.data?.message || 'Failed to add module.' }));
    }
  };

  const handleRemoveModule = async (moduleId: string, moduleName: string) => {
    const isConfirmed = await confirm({
      title: 'Remove Module',
      message: `Are you sure you want to remove "${moduleName}" from this package?`,
      confirmText: 'Remove',
      cancelText: 'Cancel',
      destructive: true,
    });
    
    if (isConfirmed) {
      try {
        await removeModule({ id, moduleId }).unwrap();
        dispatch(showWarning({ title: 'Module Removed', message: 'Successfully removed module from package.' }));
      } catch (err: any) {
        dispatch(showWarning({ title: 'Error', message: err.data?.message || 'Failed to remove module.' }));
      }
    }
  };

  if (isLoading) return <div className="p-8 text-center text-slate-500">Loading package details...</div>;
  if (!pkg) return <div className="p-8 text-center text-red-500">Package not found</div>;

  const unassignedModules = availableModules.filter((m: any) => 
    !assignedModules.some((am: any) => am.moduleId === m.id)
  );

  return (
    <div className="space-y-6">
      <div className="mb-2">
        <Link 
          href="/platform/packages" 
          className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Packages
        </Link>
      </div>
      <PageHeader 
        title="Package Details" 
        description={`Manage configuration and modules for ${pkg.name}`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Overview</CardTitle>
              {!editMode && (
                <Button variant="outline" size="sm" onClick={handleEditClick}>Edit</Button>
              )}
            </CardHeader>
            <CardContent>
              {editMode ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Name</label>
                    <Input 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})} 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
                    <textarea 
                      className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                      rows={3}
                      value={formData.description} 
                      onChange={(e) => setFormData({...formData, description: e.target.value})} 
                    />
                  </div>
                  <div className="flex space-x-2 pt-2">
                    <Button size="sm" className="bg-indigo-600 text-white" onClick={handleUpdate}>Save</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditMode(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-medium text-slate-500 block">Code</span>
                    <span className="font-mono text-sm">{pkg.code}</span>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-slate-500 block">Name</span>
                    <span className="font-semibold">{pkg.name}</span>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-slate-500 block">Description</span>
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      {pkg.description || 'No description provided.'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-slate-500 block mb-1">Status</span>
                    <StatusBadge status={pkg.isActive ? 'ACTIVE' : 'INACTIVE'} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Included Modules</CardTitle>
              <CardDescription>Select the SaaS modules that organizations on this package can access.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-3 mb-6">
                <select 
                  className="flex-1 h-10 rounded-xl border border-slate-200 bg-white dark:bg-slate-800 px-3 text-sm"
                  value={selectedModule}
                  onChange={(e) => setSelectedModule(e.target.value)}
                >
                  <option value="">Select a module to add...</option>
                  {unassignedModules.map((m: any) => (
                    <option key={m.id} value={m.id}>{m.name} ({m.code})</option>
                  ))}
                </select>
                <Button 
                  onClick={handleAddModule} 
                  disabled={!selectedModule || isAdding}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Module
                </Button>
              </div>

              <div className="space-y-3">
                {assignedModules.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 border border-dashed rounded-xl border-slate-200">
                    No modules included in this package yet.
                  </div>
                ) : (
                  assignedModules.map((am: any) => (
                    <div key={am.moduleId} className="flex items-center justify-between p-3 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 bg-white dark:bg-slate-800 rounded shadow-sm flex items-center justify-center text-indigo-500">
                          <Box className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-sm">{am.module.name}</div>
                          <div className="text-xs text-slate-500 font-mono">{am.module.code}</div>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleRemoveModule(am.moduleId, am.module.name)}
                        className="text-rose-600 hover:bg-rose-50 border-rose-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
