'use client';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { showWarning } from '@/store/slices/uiSlice';
import { useGetComplaintsQuery, useCreateComplaintMutation, useGetComplaintCategoriesQuery } from '@/services/complaintsApi';
import { useGetUnitsQuery } from '@/services/organizationApi';
import Link from 'next/link';

export default function ResidentComplaintsPage() {
  const dispatch = useDispatch();
  const { data: complaintsData, isLoading, refetch } = useGetComplaintsQuery({});
  const { data: unitsData } = useGetUnitsQuery({ myUnits: true });
  const { data: categoriesData } = useGetComplaintCategoriesQuery({});
  const [createComplaint, { isLoading: isCreating }] = useCreateComplaintMutation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newComplaint, setNewComplaint] = useState({ title: '', description: '', propertyNodeId: '', categoryId: '', priority: 'LOW' });

  const complaints = complaintsData?.data || [];
  const units = unitsData?.data || [];
  const categories = categoriesData || [];

  const columns = [
    { header: 'Title', accessorKey: 'title' },
    { header: 'Category', accessorKey: 'category.name', cell: (item: any) => item.category?.name || 'N/A' },
    { header: 'Priority', accessorKey: 'priority' },
    { header: 'Status', accessorKey: 'status' },
    { header: 'Created', accessorKey: 'createdAt', cell: (item: any) => new Date(item.createdAt).toLocaleDateString() },
    {
      header: 'Actions',
      accessorKey: 'actions',
      cell: (item: any) => (
        <Link 
          href={`/resident/complaints/${item.id}`} 
          className="text-blue-600 hover:text-blue-900 font-medium text-sm"
        >
          View Details
        </Link>
      )
    },
  ];

  const handleCreate = async () => {
    if (!newComplaint.title || !newComplaint.description || !newComplaint.categoryId) {
      dispatch(showWarning({ title: 'Missing Fields', message: 'Title, description, and category are required to submit a complaint.' }));
      return;
    }
    try {
      await createComplaint({
        title: newComplaint.title,
        description: newComplaint.description,
        categoryId: newComplaint.categoryId,
        propertyNodeId: newComplaint.propertyNodeId || undefined,
        priority: newComplaint.priority,
      }).unwrap();
      setIsModalOpen(false);
      setNewComplaint({ title: '', description: '', propertyNodeId: '', categoryId: '', priority: 'LOW' });
      refetch();
    } catch (err: any) {
      dispatch(showWarning({ title: 'Submission Failed', message: err.data?.message || 'Failed to create complaint.' }));
    }
  };

  return (
    <div>
      <PageHeader 
        title="My Complaints" 
        description="Submit and track maintenance requests and complaints for your unit."
        action={
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Complaint
          </Button>
        }
      />
      <Card>
        <CardContent className="p-0">
          <DataTable 
            data={complaints} 
            columns={columns} 
            isLoading={isLoading} 
          />
        </CardContent>
      </Card>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">New Complaint</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Select Category *</label>
                  <select 
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow outline-none appearance-none" 
                    value={newComplaint.categoryId} 
                    onChange={(e) => setNewComplaint({...newComplaint, categoryId: e.target.value})}
                  >
                    <option value="">Select a category...</option>
                    {categories.map((cat: any) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Select Unit (Optional)</label>
                  <select 
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow outline-none appearance-none" 
                    value={newComplaint.propertyNodeId} 
                    onChange={(e) => setNewComplaint({...newComplaint, propertyNodeId: e.target.value})}
                  >
                    <option value="">Select a unit...</option>
                    {units.map((unit: any) => (
                      <option key={unit.id} value={unit.id}>
                        Unit {unit.name || unit.unitNumber}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Title *</label>
                  <input 
                    type="text" 
                    placeholder="E.g. Leaking Faucet"
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow outline-none" 
                    value={newComplaint.title} 
                    onChange={(e) => setNewComplaint({...newComplaint, title: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description *</label>
                  <textarea 
                    placeholder="Describe the issue in detail..."
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow outline-none resize-none" 
                    rows={4}
                    value={newComplaint.description} 
                    onChange={(e) => setNewComplaint({...newComplaint, description: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Priority</label>
                  <select 
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow outline-none appearance-none" 
                    value={newComplaint.priority} 
                    onChange={(e) => setNewComplaint({...newComplaint, priority: e.target.value})}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-8 pt-4 border-t border-gray-100 dark:border-gray-800">
                <Button variant="outline" className="px-6" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  className="px-6 bg-blue-600 hover:bg-blue-700 text-white shadow-sm" 
                  onClick={handleCreate} 
                  disabled={isCreating || !newComplaint.title || !newComplaint.description || !newComplaint.categoryId}
                >
                  {isCreating ? 'Submitting...' : 'Submit Complaint'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
