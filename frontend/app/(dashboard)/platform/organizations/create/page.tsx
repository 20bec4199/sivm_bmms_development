'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useCreateOrganizationMutation } from '@/services/platformApi';
import { 
  ArrowLeft, 
  Building2, 
  MapPin, 
  Layers, 
  UserCheck, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { AVAILABLE_MODULES, AVAILABLE_CATEGORIES } from '@/lib/master-data';

const orgSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
  code: z.string().optional(),
  type: z.string().default('Property Management'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  country: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  address: z.string().optional(),
  industry: z.string().default('Real Estate'),
  size: z.string().default('50-200'),
  subscriptionPlan: z.string().default('Enterprise'),
  modules: z.array(z.string()).default([]),
  propertyCategories: z.array(z.string()).default([]),
  
  // Administrator setup
  provisionAdmin: z.boolean().default(true),
  adminFirstName: z.string().optional(),
  adminLastName: z.string().optional(),
  adminEmail: z.string().optional(),
  adminPhone: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.provisionAdmin) {
    if (!data.adminFirstName || data.adminFirstName.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['adminFirstName'],
        message: 'Admin first name is required (min 2 characters)',
      });
    }
    if (!data.adminEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.adminEmail)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['adminEmail'],
        message: 'A valid administrator email is required',
      });
    }
  }
});

type OrgFormValues = z.input<typeof orgSchema>;

export default function CreateOrganizationPage() {
  const router = useRouter();
  const [createOrg, { isLoading }] = useCreateOrganizationMutation();
  const [error, setError] = useState<string | null>(null);
  const [createdResult, setCreatedResult] = useState<any | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<OrgFormValues>({
    resolver: zodResolver(orgSchema) as any,
    defaultValues: {
      type: 'Property Management',
      industry: 'Real Estate',
      size: '50-200',
      subscriptionPlan: 'Enterprise',
      country: 'United States',
      modules: ['PROPERTY_MANAGEMENT', 'FACILITY_MANAGEMENT', 'WORK_ORDERS', 'PARKING_MANAGEMENT', 'COMPLAINT_MANAGEMENT'],
      propertyCategories: ['RESIDENTIAL', 'COMMERCIAL'],
      provisionAdmin: true,
    }
  });

  const provisionAdmin = watch('provisionAdmin');
  const selectedModules = watch('modules') || [];
  const selectedCategories = watch('propertyCategories') || [];

  const handleSelectAllModules = () => {
    setValue('modules', AVAILABLE_MODULES.map(m => m.id));
  };

  const handleClearModules = () => {
    setValue('modules', []);
  };

  const handleSelectAllCategories = () => {
    setValue('propertyCategories', AVAILABLE_CATEGORIES.map(c => c.id));
  };

  const handleClearCategories = () => {
    setValue('propertyCategories', []);
  };

  const onSubmit = async (data: any) => {
    setError(null);
    try {
      // Build composite formatted address
      const addressParts = [
        data.address,
        data.city,
        data.state,
        data.postalCode,
        data.country
      ].filter(Boolean);
      const contactAddress = addressParts.length > 0 ? addressParts.join(', ') : undefined;

      const payload: any = {
        name: data.name,
        code: data.code ? data.code.toUpperCase().trim() : undefined,
        type: data.type,
        contactEmail: data.email || undefined,
        contactPhone: data.phone || undefined,
        contactAddress,
        industry: data.industry,
        size: data.size,
        subscriptionPlan: data.subscriptionPlan,
        modules: data.modules || [],
        propertyCategories: data.propertyCategories || [],
      };

      if (data.provisionAdmin && data.adminEmail && data.adminFirstName) {
        payload.admin = {
          firstName: data.adminFirstName.trim(),
          lastName: data.adminLastName?.trim() || undefined,
          email: data.adminEmail.trim().toLowerCase(),
          phone: data.adminPhone?.trim() || undefined,
        };
      }

      const res = await createOrg(payload).unwrap();
      setCreatedResult(res);
    } catch (err: any) {
      console.error('Failed to create organization:', err);
      setError(err?.data?.message || err?.message || 'Failed to create organization');
    }
  };

  if (createdResult) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-10 shadow-xl text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 mb-6 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100/70 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 mb-3">
            <Sparkles className="h-3.5 w-3.5" /> Tenant Successfully Initialized
          </span>

          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white mb-2">
            {createdResult.name}
          </h2>
          <p className="text-base text-slate-600 dark:text-slate-400 max-w-lg mx-auto mb-8">
            The organization has been provisioned. Scoped tenant roles <span className="font-semibold text-slate-900 dark:text-white">(ORGANIZATION_ADMIN, BUILDING_MANAGER, TECHNICIAN, RESIDENT)</span> have been seeded.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 mb-8">
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Organization Code</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{createdResult.code || 'Auto-generated'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Plan Tier</p>
              <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">{createdResult.subscriptionPlan || 'Enterprise'}</p>
            </div>
            {createdResult.adminUser && (
              <>
                <div>
                  <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Primary Administrator</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    {createdResult.adminUser.firstName} {createdResult.adminUser.lastName || ''}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Invitation Dispatched</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 break-all">
                    {createdResult.adminUser.email}
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href={`/platform/organizations/${createdResult.id}`}>
              <Button variant="outline" className="w-full sm:w-auto gap-2">
                <ExternalLink className="h-4 w-4" /> View Organization Details
              </Button>
            </Link>
            <Link href="/platform/organizations">
              <Button variant="primary" className="w-full sm:w-auto">
                Back to All Organizations
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="mb-4">
        <Link 
          href="/platform/organizations" 
          className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Organizations
        </Link>
      </div>

      <PageHeader 
        title="Provision New Tenant Organization" 
        description="Register a new building management entity, configure modules, seed default roles, and assign primary administrative access."
      />

      {error && (
        <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/30 p-5 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300">
          <div className="flex items-center gap-2 font-semibold">
            <ShieldCheck className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            Provisioning Failed
          </div>
          <p className="text-sm mt-1 text-rose-700 dark:text-rose-300/90">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Section 1: Basic Details */}
        <Card className="rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/60 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2.5 text-indigo-600 dark:text-indigo-400">
              <Building2 className="h-5 w-5" />
              <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">
                Organization Identity & Profile
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="sm:col-span-2">
                <Input 
                  label="Organization / Entity Name *" 
                  placeholder="e.g. Acme Residential Tower Holdings" 
                  {...register('name')} 
                  error={errors.name?.message} 
                />
              </div>
              <Input 
                label="Unique Org Code / Slug" 
                placeholder="e.g. ACME-01" 
                {...register('code')} 
                error={errors.code?.message} 
              />
              <Input 
                label="General Contact Email" 
                type="email" 
                placeholder="contact@acme.com" 
                {...register('email')} 
                error={errors.email?.message} 
              />
              <Input 
                label="Contact Phone" 
                placeholder="+1 (555) 234-5678" 
                {...register('phone')} 
              />
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Property / Org Type
                </label>
                <select 
                  {...register('type')} 
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Property Management">Property Management</option>
                  <option value="Residential Community">Residential Community</option>
                  <option value="Commercial Facility">Commercial Facility</option>
                  <option value="Mixed-Use Hub">Mixed-Use Hub</option>
                  <option value="Industrial Park">Industrial Park</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Industry Sector
                </label>
                <select 
                  {...register('industry')} 
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Real Estate">Real Estate</option>
                  <option value="Hospitality">Hospitality</option>
                  <option value="Commercial Operations">Commercial Operations</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Technology">Technology</option>
                  <option value="Public Infrastructure">Public Infrastructure</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Company Scale / Size
                </label>
                <select 
                  {...register('size')} 
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="1-10">1-10 Units / Employees</option>
                  <option value="11-50">11-50 Units / Employees</option>
                  <option value="50-200">50-200 Units / Employees</option>
                  <option value="201-500">201-500 Units / Employees</option>
                  <option value="500+">500+ Large Enterprise</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Subscription Tier
                </label>
                <select 
                  {...register('subscriptionPlan')} 
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Starter">Starter</option>
                  <option value="Professional">Professional</option>
                  <option value="Enterprise">Enterprise (Full Modules)</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Location & Address */}
        <Card className="rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/60 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2.5 text-indigo-600 dark:text-indigo-400">
              <MapPin className="h-5 w-5" />
              <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">
                Location & Physical Address
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="sm:col-span-2 lg:col-span-4">
                <Input 
                  label="Street Address" 
                  placeholder="100 Innovation Blvd, Tower B, Suite 400" 
                  {...register('address')} 
                />
              </div>
              <Input label="City" placeholder="New York" {...register('city')} />
              <Input label="State / Province" placeholder="NY" {...register('state')} />
              <Input label="Postal Code" placeholder="10001" {...register('postalCode')} />
              <Input label="Country" placeholder="United States" {...register('country')} />
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Entitlements (Modules & Property Categories) */}
        <Card className="rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/60 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2.5 text-indigo-600 dark:text-indigo-400">
              <Layers className="h-5 w-5" />
              <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">
                Module Entitlements & Property Types
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-8">
            {/* Modules */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Subscribed Platform Modules ({selectedModules.length} selected)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Controls navigation tabs, APIs, and portal capability for this tenant.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <button 
                    type="button" 
                    onClick={handleSelectAllModules}
                    className="font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <button 
                    type="button" 
                    onClick={handleClearModules}
                    className="font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-72 overflow-y-auto p-1 custom-scrollbar">
                {AVAILABLE_MODULES.map((module) => (
                  <label 
                    key={module.id} 
                    className="relative flex items-center gap-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-3 hover:border-indigo-400 dark:hover:border-indigo-500 has-[:checked]:border-indigo-600 has-[:checked]:bg-indigo-50/50 dark:has-[:checked]:bg-indigo-950/20 cursor-pointer transition-all"
                  >
                    <input 
                      type="checkbox" 
                      value={module.id} 
                      className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 border-slate-300 dark:border-slate-700" 
                      {...register('modules')}
                    />
                    <span className="text-xs font-medium text-slate-900 dark:text-slate-100 select-none">
                      {module.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Property Categories */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Permitted Property Categories ({selectedCategories.length} selected)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Determines what spatial property types this organization is licensed to manage.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <button 
                    type="button" 
                    onClick={handleSelectAllCategories}
                    className="font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <button 
                    type="button" 
                    onClick={handleClearCategories}
                    className="font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {AVAILABLE_CATEGORIES.map((cat) => (
                  <label 
                    key={cat.id} 
                    className="relative flex items-center gap-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-3 hover:border-purple-400 dark:hover:border-purple-500 has-[:checked]:border-purple-600 has-[:checked]:bg-purple-50/50 dark:has-[:checked]:bg-purple-950/20 cursor-pointer transition-all"
                  >
                    <input 
                      type="checkbox" 
                      value={cat.id} 
                      className="rounded text-purple-600 focus:ring-purple-500 h-4 w-4 border-slate-300 dark:border-slate-700" 
                      {...register('propertyCategories')}
                    />
                    <span className="text-xs font-medium text-slate-900 dark:text-slate-100 select-none">
                      {cat.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Primary Administrator Provisioning */}
        <Card className="rounded-3xl border border-indigo-200 dark:border-indigo-950/70 bg-gradient-to-br from-indigo-50/20 via-white to-white dark:from-indigo-950/10 dark:via-slate-900 dark:to-slate-900 shadow-sm overflow-hidden">
          <CardHeader className="border-b border-indigo-100/60 dark:border-indigo-950/50 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-indigo-700 dark:text-indigo-400">
                <UserCheck className="h-5 w-5" />
                <div>
                  <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">
                    Primary Organization Administrator
                  </CardTitle>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Provisions initial login credentials, seeds the ORGANIZATION_ADMIN role, and dispatches activation link.
                  </p>
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 border-slate-300 dark:border-slate-700" 
                  {...register('provisionAdmin')}
                />
                Provision Admin Now
              </label>
            </div>
          </CardHeader>
          {provisionAdmin && (
            <CardContent className="p-6 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <Input 
                  label="Admin First Name *" 
                  placeholder="e.g. John" 
                  {...register('adminFirstName')} 
                  error={errors.adminFirstName?.message} 
                />
                <Input 
                  label="Admin Last Name" 
                  placeholder="e.g. Doe" 
                  {...register('adminLastName')} 
                />
                <Input 
                  label="Admin Official Email *" 
                  type="email" 
                  placeholder="johndoe@acme.com" 
                  {...register('adminEmail')} 
                  error={errors.adminEmail?.message} 
                />
                <Input 
                  label="Admin Direct Phone" 
                  placeholder="+1 (555) 345-6789" 
                  {...register('adminPhone')} 
                />
              </div>

              <div className="mt-4 p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 flex items-start gap-2.5 text-xs text-indigo-900 dark:text-indigo-300">
                <ShieldCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Role Guarantee:</strong> This user will automatically be bound to the tenant-scoped <code className="font-mono bg-indigo-100 dark:bg-indigo-900/60 px-1 py-0.5 rounded">ORGANIZATION_ADMIN</code> role with comprehensive administration privileges, eliminating any post-registration lockout.
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button 
            variant="outline" 
            type="button" 
            onClick={() => router.push('/platform/organizations')}
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            type="submit" 
            disabled={isLoading}
            className="px-6 py-2.5 text-sm font-semibold shadow-md shadow-indigo-600/20"
          >
            {isLoading ? 'Provisioning Tenant...' : 'Register & Provision Tenant Organization'}
          </Button>
        </div>
      </form>
    </div>
  );
}
