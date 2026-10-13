'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useCreatePackageMutation } from '@/services/packagesApi';
import { useDispatch } from 'react-redux';
import { showWarning } from '@/store/slices/uiSlice';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function CreatePackagePage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [createPackage, { isLoading }] = useCreatePackageMutation();
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    priceMonthly: 0,
    priceYearly: 0,
    trialDays: 14,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPackage(formData).unwrap();
      router.push('/platform/packages');
    } catch (err: any) {
      dispatch(showWarning({ title: 'Error', message: err.data?.message || 'Failed to create package.' }));
    }
  };

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
        title="Create New Package" 
        description="Define a new SaaS tier or module package."
      />

      <Card>
        <CardHeader>
          <CardTitle>Package Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Package Name</label>
                <Input 
                  required
                  placeholder="e.g. Enterprise Tier"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Package Code</label>
                <Input 
                  required
                  placeholder="e.g. ENTERPRISE_TIER"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
              <textarea 
                className="w-full h-24 rounded-xl border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="Optional description..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" isLoading={isLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white">Create Package</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
