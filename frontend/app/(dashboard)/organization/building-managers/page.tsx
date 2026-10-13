'use client';

import React, { useState } from 'react';
import { useGetBuildingManagersQuery, useCreateBuildingManagerMutation, useDeleteBuildingManagerMutation } from '@/services/buildingManagersApi';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, Building, User, Mail, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useGetBuildingsQuery } from '@/services/organizationApi';

export default function BuildingManagersPage() {
  const { data: managers, isLoading, refetch } = useGetBuildingManagersQuery({});
  const { data: buildingsResponse } = useGetBuildingsQuery({});
  console.log('buildingsResponse:', buildingsResponse);
  
  // Try different ways the data might be structured
  const buildings = Array.isArray(buildingsResponse) ? buildingsResponse : (buildingsResponse?.data || []);
  console.log('buildings resolved:', buildings);
  
  const [createManager, { isLoading: isCreating }] = useCreateBuildingManagerMutation();
  const [deleteManager] = useDeleteBuildingManagerMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    assignedBuildingIds: string[];
  }>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    assignedBuildingIds: []
  });

  const toggleBuilding = (id: string) => {
    setFormData(prev => ({
      ...prev,
      assignedBuildingIds: prev.assignedBuildingIds.includes(id)
        ? prev.assignedBuildingIds.filter(bId => bId !== id)
        : [...prev.assignedBuildingIds, id]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createManager(formData).unwrap();
      setIsModalOpen(false);
      setFormData({ firstName: '', lastName: '', email: '', phone: '', assignedBuildingIds: [] });
      refetch();
    } catch (err) {
      console.error('Failed to create building manager', err);
      alert('Failed to create building manager');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to remove this building manager?')) {
      try {
        await deleteManager(id).unwrap();
        refetch();
      } catch (err) {
        alert('Failed to delete building manager');
      }
    }
  };

  if (isLoading) return <div className="p-8">Loading Building Managers...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader 
          title="Building Managers" 
          description="Manage and assign personnel to oversee your buildings"
        />
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <Plus size={16} /> Add Manager
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {managers?.map((manager: any) => (
          <Card key={manager.id} className="relative overflow-hidden group">
            <CardHeader className="bg-slate-50 dark:bg-slate-800/50 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold">
                    {manager.firstName.charAt(0)}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{manager.firstName} {manager.lastName}</CardTitle>
                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full dark:bg-blue-900/30 dark:text-blue-400">
                      Building Manager
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => handleDelete(manager.id)}
                  className="text-slate-400 hover:text-red-500 transition-colors p-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <Mail size={14} className="text-slate-400" />
                {manager.email}
              </div>
              <div className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300 mt-4">
                <span className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
                  <Building size={14} /> Assigned Properties ({manager.userPropertyNodes?.length || 0})
                </span>
                {manager.userPropertyNodes && manager.userPropertyNodes.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {manager.userPropertyNodes.map((upn: any) => (
                      <span key={upn.propertyNodeId} className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs">
                        {upn.propertyNode?.name || upn.propertyNodeId}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-slate-400 italic text-xs">No properties assigned yet</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Building Manager">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">First Name</label>
              <input
                type="text"
                required
                className="w-full rounded-md border p-2 text-sm"
                value={formData.firstName}
                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Last Name</label>
              <input
                type="text"
                className="w-full rounded-md border p-2 text-sm"
                value={formData.lastName}
                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              required
              className="w-full rounded-md border p-2 text-sm"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input
              type="text"
              className="w-full rounded-md border p-2 text-sm"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Assigned Buildings</label>
            <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2 bg-slate-50 dark:bg-slate-800/50">
              {buildings.length > 0 ? (
                buildings.map((building: any) => (
                  <label key={building.id} className="flex items-center gap-3 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      checked={formData.assignedBuildingIds.includes(building.id)}
                      onChange={() => toggleBuilding(building.id)}
                    />
                    <span className="text-sm font-medium">{building.name}</span>
                  </label>
                ))
              ) : (
                <p className="text-sm text-slate-500 italic">No buildings available in the organization.</p>
              )}
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Manager'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
