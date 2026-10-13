'use client';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useParams } from 'next/navigation';
import { useUpdateWorkOrderMutation, useGetWorkOrderByIdQuery } from '@/services/workOrdersApi';
import { useGetTechniciansQuery } from '@/services/technicianApi';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { showWarning } from '@/store/slices/uiSlice';

const workOrderSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  assignedToId: z.string().optional(),
  dueDate: z.string().optional(),
});

type WorkOrderFormData = z.infer<typeof workOrderSchema>;

export default function EditWorkOrderPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const dispatch = useDispatch();
  
  const { data: workOrder, isLoading: isLoadingWorkOrder } = useGetWorkOrderByIdQuery(id);
  const [updateWorkOrder, { isLoading: isSubmitting }] = useUpdateWorkOrderMutation();
  const { data: techniciansResponse, isLoading: isLoadingUsers } = useGetTechniciansQuery({});
  
  const technicians = Array.isArray(techniciansResponse) 
    ? techniciansResponse 
    : (techniciansResponse?.data || []);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<WorkOrderFormData>({
    resolver: zodResolver(workOrderSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'MEDIUM',
      assignedToId: '',
      dueDate: '',
    },
  });

  useEffect(() => {
    if (workOrder) {
      reset({
        title: workOrder.title || '',
        description: workOrder.description || '',
        priority: workOrder.priority || 'MEDIUM',
        assignedToId: workOrder.assignedToId || '',
        dueDate: workOrder.dueDate ? new Date(workOrder.dueDate).toISOString().split('T')[0] : '',
      });
    }
  }, [workOrder, reset]);

  const onSubmit = async (data: WorkOrderFormData) => {
    try {
      const payload: any = {
        ...data,
        assignedToId: data.assignedToId || undefined,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
      };

      await updateWorkOrder({ id, data: payload }).unwrap();
      dispatch(showWarning({ title: 'Success', message: 'Work Order updated successfully.' }));
      router.push('/organization/work-orders');
    } catch (err: any) {
      dispatch(showWarning({ title: 'Error', message: err.data?.message || 'Failed to update Work Order.' }));
    }
  };

  if (isLoadingWorkOrder) {
    return <div className="p-8">Loading work order details...</div>;
  }

  return (
    <div>
      <PageHeader 
        title="Edit Work Order" 
        description="Update the details and assignment of the work order."
      />
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Work Order Title <span className="text-red-500">*</span>
              </label>
              <Controller
                control={control}
                name="title"
                render={({ field }) => (
                  <input
                    {...field}
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-50"
                  />
                )}
              />
              {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <Controller
                control={control}
                name="description"
                render={({ field }) => (
                  <textarea
                    {...field}
                    rows={4}
                    className="flex w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-50"
                  />
                )}
              />
              {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Priority <span className="text-red-500">*</span>
                </label>
                <Controller
                  control={control}
                  name="priority"
                  render={({ field }) => (
                    <select
                      {...field}
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:text-gray-50"
                    >
                      <option value="LOW" className="dark:bg-gray-800">Low</option>
                      <option value="MEDIUM" className="dark:bg-gray-800">Medium</option>
                      <option value="HIGH" className="dark:bg-gray-800">High</option>
                      <option value="CRITICAL" className="dark:bg-gray-800">Critical</option>
                    </select>
                  )}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Due Date
                </label>
                <Controller
                  control={control}
                  name="dueDate"
                  render={({ field }) => (
                    <input
                      type="date"
                      {...field}
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:text-gray-50"
                    />
                  )}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Assign Technician
              </label>
              <Controller
                control={control}
                name="assignedToId"
                render={({ field }) => (
                  <select
                    {...field}
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:text-gray-50"
                  >
                    <option value="" className="dark:bg-gray-800">-- Select a Technician (Optional) --</option>
                    {isLoadingUsers ? (
                      <option disabled>Loading technicians...</option>
                    ) : (
                      technicians.map((tech: any) => (
                        <option key={tech.id} value={tech.id} className="dark:bg-gray-800">
                          {tech.firstName} {tech.lastName} ({tech.email})
                        </option>
                      ))
                    )}
                  </select>
                )}
              />
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-gray-300 bg-transparent hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800 h-10 py-2 px-4"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 h-10 py-2 px-4"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
