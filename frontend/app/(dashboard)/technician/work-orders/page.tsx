'use client';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { useGetWorkOrdersQuery, useUpdateWorkOrderMutation } from '@/services/workOrdersApi';
import Link from 'next/link';
import { useDispatch } from 'react-redux';
import { showWarning } from '@/store/slices/uiSlice';

export default function TechnicianWorkOrdersPage() {
  const { data: workOrdersData, isLoading, refetch } = useGetWorkOrdersQuery({});
  const [updateWorkOrder] = useUpdateWorkOrderMutation();
  const dispatch = useDispatch();
  
  const workOrders = workOrdersData?.data || [];

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateWorkOrder({ id, data: { status: newStatus } }).unwrap();
      dispatch(showWarning({ title: 'Success', message: 'Work order status updated.' }));
      refetch();
    } catch (err: any) {
      dispatch(showWarning({ title: 'Error', message: err.data?.message || 'Failed to update status.' }));
    }
  };

  const formatStatusDisplay = (status: string) => {
    switch(status) {
      case 'PENDING_ACCEPTANCE': return 'PENDING';
      case 'IN_PROGRESS': return 'PROCESSING';
      case 'COMPLETED': return 'RESOLVED';
      default: return status.replace('_', ' ');
    }
  };

  const columns = [
    { header: 'Title', accessorKey: 'title' },
    { header: 'Priority', accessorKey: 'priority' },
    { 
      header: 'Status', 
      accessorKey: 'status',
      cell: (item: any) => (
        <select
          value={item.status}
          onChange={(e) => handleStatusChange(item.id, e.target.value)}
          className="px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg text-xs font-semibold uppercase bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm"
        >
          <option value="ASSIGNED">ASSIGNED</option>
          <option value="ACCEPTED">ACCEPTED</option>
          <option value="TRAVELLING">TRAVELLING</option>
          <option value="IN_PROGRESS">IN PROGRESS</option>
          <option value="ON_HOLD">ON HOLD</option>
          <option value="WAITING_PARTS">WAITING PARTS</option>
          <option value="COMPLETED">COMPLETED</option>
        </select>
      )
    },
    { header: 'Due Date', accessorKey: 'dueDate', cell: (item: any) => item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'N/A' },
    { header: 'Created At', accessorKey: 'createdAt', cell: (item: any) => new Date(item.createdAt).toLocaleDateString() },
    { 
      header: 'Actions', 
      accessorKey: 'id',
      cell: (item: any) => (
        <Link 
          href={`/technician/work-orders/${item.id}`}
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
        >
          View & Update
        </Link>
      )
    },
  ];

  return (
    <div>
      <PageHeader 
        title="My Work Orders" 
        description="View and update your assigned tasks."
      />
      <Card>
        <CardContent className="p-0">
          <DataTable 
            data={workOrders} 
            columns={columns} 
            isLoading={isLoading} 
          />
        </CardContent>
      </Card>
    </div>
  );
}
