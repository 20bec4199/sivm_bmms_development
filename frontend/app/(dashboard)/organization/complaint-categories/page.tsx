'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Tag, ArrowLeft, Trash2, FolderOpen } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { RequireModule } from '@/components/auth/RequireModule';
import { useConfirm } from '@/providers/ConfirmProvider';
import { showWarning } from '@/store/slices/uiSlice';
import { 
  useGetComplaintCategoriesQuery, 
  useCreateComplaintCategoryMutation,
  useDeleteComplaintCategoryMutation
} from '@/services/complaintsApi';

export default function ComplaintCategoriesPage() {
  const dispatch = useDispatch();
  const confirm = useConfirm();
  const { user } = useSelector((state: any) => state.auth);
  const isAdminOrManager = user?.roles?.includes('ORGANIZATION_ADMIN') || 
                           user?.roles?.includes('BUILDING_MANAGER') || 
                           user?.roles?.includes('PLATFORM_SUPER_ADMIN');

  const { data: categoriesData, isLoading, refetch } = useGetComplaintCategoriesQuery({});
  const [createCategory, { isLoading: isCreating }] = useCreateComplaintCategoryMutation();
  const [deleteCategory] = useDeleteComplaintCategoryMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });

  const categories = categoriesData || [];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.name.trim()) {
      dispatch(showWarning({ title: 'Missing Field', message: 'Category Name is required.' }));
      return;
    }
    try {
      await createCategory({
        name: newCategory.name.trim(),
        description: newCategory.description.trim(),
      }).unwrap();
      setIsModalOpen(false);
      setNewCategory({ name: '', description: '' });
      dispatch(showWarning({ title: 'Created', message: `Category "${newCategory.name}" added.` }));
      refetch();
    } catch (err: any) {
      dispatch(showWarning({ title: 'Creation Failed', message: err.data?.message || 'Failed to create category.' }));
    }
  };

  const handleDelete = async (category: any) => {
    const confirmed = await confirm({
      title: 'Remove Category',
      message: `Are you sure you want to delete category "${category.name}"? Existing complaints will retain their archived taxonomy.`,
      destructive: true,
      confirmText: 'Delete Category'
    });

    if (confirmed) {
      try {
        await deleteCategory(category.id).unwrap();
        dispatch(showWarning({ title: 'Category Removed', message: 'Category deleted from routing directory.' }));
        refetch();
      } catch (err: any) {
        dispatch(showWarning({ title: 'Delete Failed', message: err.data?.message || 'Failed to delete category.' }));
      }
    }
  };

  const columns = [
    { 
      header: 'Category Subsystem', 
      accessorKey: 'name',
      cell: (cat: any) => (
        <div className="flex items-center gap-2.5 py-1">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
            <Tag size={15} />
          </div>
          <div>
            <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">{cat.name}</div>
            <div className="text-[11px] font-mono text-slate-400">ID: {cat.id?.slice(0, 8)}...</div>
          </div>
        </div>
      )
    },
    { 
      header: 'Description & Scope', 
      accessorKey: 'description',
      cell: (cat: any) => (
        <span className="text-xs text-slate-600 dark:text-slate-300">
          {cat.description || 'General maintenance routing.'}
        </span>
      )
    },
    { 
      header: 'Created On', 
      accessorKey: 'createdAt', 
      cell: (item: any) => (
        <span className="text-xs font-mono text-slate-400">
          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'System Default'}
        </span>
      )
    },
    {
      header: 'Actions',
      accessorKey: 'actions',
      cell: (cat: any) => (
        isAdminOrManager ? (
          <button 
            onClick={() => handleDelete(cat)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
            title="Delete Category"
          >
            <Trash2 size={16} />
          </button>
        ) : null
      )
    }
  ];

  return (
    <RequireModule moduleCode="COMPLAINT_MANAGEMENT">
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        <div className="mb-2">
          <Link 
            href="/organization/complaints" 
            className="inline-flex items-center text-xs font-extrabold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Complaints Center
          </Link>
        </div>

        <PageHeader 
          title="Complaint Routing Categories" 
          description="Manage taxonomy classifications for resident complaints, work orders, and maintenance ticket queues."
          action={
            <Button 
              onClick={() => setIsModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add Category
            </Button>
          }
        />

        <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
          <CardContent className="p-0">
            <DataTable 
              data={categories} 
              columns={columns} 
              isLoading={isLoading} 
            />
          </CardContent>
        </Card>

        {/* Modal: Add Category */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="New Complaint Routing Category"
        >
          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Category Name *
              </label>
              <Input 
                type="text" 
                placeholder="E.g. Plumbing, HVAC, Elevator, Electrical"
                className="text-xs" 
                value={newCategory.name} 
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Scope & Description
              </label>
              <textarea 
                placeholder="Brief description of the issues routed under this subsystem..."
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none resize-none" 
                rows={3}
                value={newCategory.description} 
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs" 
                disabled={isCreating || !newCategory.name.trim()}
              >
                {isCreating ? 'Creating...' : 'Create Category'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </RequireModule>
  );
}
