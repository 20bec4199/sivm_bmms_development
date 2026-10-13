'use client';
import React, { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useGetRolesQuery } from '@/services/rolesApi';
import { useCreateUserMutation } from '@/services/userApi';
import { useDispatch } from 'react-redux';
import { showWarning } from '@/store/slices/uiSlice';
import { User, Mail, Lock, Phone, ShieldCheck, ArrowLeft, Briefcase } from 'lucide-react';

const technicianSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().optional(),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
});

type TechnicianFormData = z.infer<typeof technicianSchema>;

export default function CreateTechnicianPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [createUser] = useCreateUserMutation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: rolesData } = useGetRolesQuery({});

  const { control, handleSubmit, formState: { errors } } = useForm<TechnicianFormData>({
    resolver: zodResolver(technicianSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      phone: '',
    },
  });

  const onSubmit = async (data: TechnicianFormData) => {
    try {
      setIsSubmitting(true);
      
      const roles = Array.isArray(rolesData) ? rolesData : (rolesData?.data || []);
      const technicianRole = roles.find((r: any) => r.name === 'TECHNICIAN' || r.name === 'MAINTENANCE_SUPERVISOR');
      
      if (!technicianRole) {
        throw new Error('Technician role not found in the system. Please ensure a role named TECHNICIAN is configured.');
      }

      await createUser({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        phone: data.phone,
        roleIds: [technicianRole.id]
      }).unwrap();

      dispatch(showWarning({ title: 'Technician Provisioned', message: `Account created successfully for ${data.firstName}.` }));
      router.push('/organization/technicians');
    } catch (err: any) {
      dispatch(showWarning({ title: 'Registration Failed', message: err.data?.message || err.message || 'Failed to create technician account.' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center space-x-2 text-xs font-bold text-slate-500 dark:text-slate-400">
        <button onClick={() => router.back()} className="hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center transition-colors">
          <ArrowLeft className="h-3.5 w-3.5 mr-1" />
          Back to Technician List
        </button>
      </div>

      <PageHeader 
        title="Provision Specialist Technician" 
        description="Create a dedicated maintenance account with system sign-in credentials and foundational access."
      />

      <Card className="max-w-3xl mx-auto border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
        <div className="px-6 py-5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Account Credentials & Identity</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Configure primary login credentials for maintenance task management.</p>
          </div>
        </div>

        <CardContent className="p-6 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* First Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300 mb-1.5 flex items-center">
                  <User className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                  First Name <span className="text-rose-500 ml-1">*</span>
                </label>
                <Controller
                  control={control}
                  name="firstName"
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="e.g. Marcus"
                      className="h-10 text-sm font-semibold"
                    />
                  )}
                />
                {errors.firstName && <p className="mt-1 text-xs font-semibold text-rose-500">{errors.firstName.message}</p>}
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300 mb-1.5">
                  Last Name
                </label>
                <Controller
                  control={control}
                  name="lastName"
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="e.g. Vance"
                      className="h-10 text-sm"
                    />
                  )}
                />
              </div>

              {/* Email */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300 mb-1.5 flex items-center">
                  <Mail className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                  Email Address <span className="text-rose-500 ml-1">*</span>
                </label>
                <Controller
                  control={control}
                  name="email"
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="email"
                      placeholder="technician.vance@bmms.com"
                      className="h-10 text-sm font-mono"
                    />
                  )}
                />
                {errors.email && <p className="mt-1 text-xs font-semibold text-rose-500">{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300 mb-1.5 flex items-center">
                  <Lock className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                  Temporary Password <span className="text-rose-500 ml-1">*</span>
                </label>
                <Controller
                  control={control}
                  name="password"
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="password"
                      placeholder="••••••••"
                      className="h-10 text-sm font-mono"
                    />
                  )}
                />
                {errors.password && <p className="mt-1 text-xs font-semibold text-rose-500">{errors.password.message}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300 mb-1.5 flex items-center">
                  <Phone className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                  Phone Number
                </label>
                <Controller
                  control={control}
                  name="phone"
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="+1 (555) 492-8012"
                      className="h-10 text-sm font-mono"
                    />
                  )}
                />
              </div>
            </div>

            {/* Actions Footer */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="h-10 px-5 font-bold border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-10 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-lg shadow-indigo-600/25 disabled:opacity-50"
              >
                <ShieldCheck className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Provisioning...' : 'Provision Technician Account'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
