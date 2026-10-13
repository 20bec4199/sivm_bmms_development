'use client';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { FormSection } from '@/components/ui/FormSection';
import { Button } from '@/components/ui/Button';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCreateWorkOrderMutation } from '@/services/workOrdersApi';
import { useGetTechniciansQuery } from '@/services/technicianApi';

const workOrderSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  assignedToId: z.string().optional(),
  dueDate: z.string().optional(),
});

type WorkOrderFormData = z.infer<typeof workOrderSchema>;

export default function CreateWorkOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [createWorkOrder, { isLoading: isSubmitting }] = useCreateWorkOrderMutation();
  const { data: techniciansResponse, isLoading: isLoadingUsers } = useGetTechniciansQuery({});
  
  // Extract technicians correctly from the paginated response
  const technicians = Array.isArray(techniciansResponse) 
    ? techniciansResponse 
    : (techniciansResponse?.data || []);

  const { control, handleSubmit, formState: { errors } } = useForm<WorkOrderFormData>({
    resolver: zodResolver(workOrderSchema),
    defaultValues: {
      title: searchParams.get('title') || '',
      description: '',
      priority: 'MEDIUM',
      assignedToId: '',
      dueDate: '',
    },
  });

  const complaintId = searchParams.get('complaintId');
  const residentId = searchParams.get('residentId');
  const propertyNodeId = searchParams.get('propertyNodeId');

  const onSubmit = async (data: WorkOrderFormData) => {
    try {
      const payload: any = {
        ...data,
        assignedToId: data.assignedToId || undefined,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
      };

      if (complaintId) payload.complaintId = complaintId;
      if (residentId) payload.residentId = residentId;
      if (propertyNodeId) payload.propertyNodeId = propertyNodeId;

      await createWorkOrder(payload).unwrap();
      window.alert('Work Order created and assigned successfully.');
      router.push('/organization/work-orders');
    } catch (err: any) {
      window.alert(err.data?.message || 'Failed to create Work Order.');
    }
  };

  return (
    <div>
      <PageHeader 
        title="Create Work Order" 
        description="Create a new maintenance task and assign it to a technician."
      />
      <div className="max-w-3xl mx-auto space-y-6">
        <FormSection 
          title="Work Order Details" 
          description="Provide the required details to assign a maintenance task."
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Title */}
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
                    className="flex w-full rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white px-4 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700/50 dark:bg-gray-900/50 dark:text-gray-50"
                    placeholder="e.g. Repair AC Unit in Lobby"
                  />
                )}
              />
              {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>}
            </div>

            {/* Description */}
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
                    className="flex w-full rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white px-4 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700/50 dark:bg-gray-900/50 dark:text-gray-50 min-h-[120px]"
                    placeholder="Provide details about the issue..."
                  />
                )}
              />
              {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Priority */}
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
                      className="flex w-full rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700/50 dark:bg-gray-900/50 dark:text-gray-50"
                    >
                      <option value="LOW" className="dark:bg-gray-800">Low</option>
                      <option value="MEDIUM" className="dark:bg-gray-800">Medium</option>
                      <option value="HIGH" className="dark:bg-gray-800">High</option>
                      <option value="CRITICAL" className="dark:bg-gray-800">Critical</option>
                    </select>
                  )}
                />
              </div>

              {/* Due Date */}
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
                      className="flex w-full rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700/50 dark:bg-gray-900/50 dark:text-gray-50"
                    />
                  )}
                />
              </div>
            </div>

            {/* Assign Technician */}
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
                    className="flex w-full rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700/50 dark:bg-gray-900/50 dark:text-gray-50"
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

            {/* Actions */}
            <div className="pt-6 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
              <Button
                type="button"
                onClick={() => router.back()}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={isSubmitting}
                variant="primary"
              >
                Create Work Order
              </Button>
            </div>
          </form>
        </FormSection>
      </div>
    </div>
  );
}
