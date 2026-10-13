'use client';

import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { useGetMyModulesQuery } from '@/services/platformApi';

interface RequireModuleProps {
  children: React.ReactNode;
  moduleCode: string | string[]; // Can require one or multiple modules
}

const MODULE_ALIASES: Record<string, string[]> = {
  SMARTI_ALERT: ['SMARTI_ALERT', 'COMMUNITY_MANAGEMENT'],
  COMMUNITY_MANAGEMENT: ['COMMUNITY_MANAGEMENT', 'SMARTI_ALERT'],
  SMARTI_CARE: ['SMARTI_CARE', 'COMPLAINT_MANAGEMENT'],
  COMPLAINT_MANAGEMENT: ['COMPLAINT_MANAGEMENT', 'SMARTI_CARE'],
  SMARTI_FACILITY: ['SMARTI_FACILITY', 'FACILITY_MANAGEMENT'],
  FACILITY_MANAGEMENT: ['FACILITY_MANAGEMENT', 'SMARTI_FACILITY'],
  SMARTI_WORK: ['SMARTI_WORK', 'WORK_ORDERS', 'PREVENTIVE_MAINTENANCE', 'TECHNICIAN'],
  WORK_ORDERS: ['WORK_ORDERS', 'SMARTI_WORK', 'TECHNICIAN'],
  PREVENTIVE_MAINTENANCE: ['PREVENTIVE_MAINTENANCE', 'SMARTI_WORK'],
  TECHNICIAN: ['TECHNICIAN', 'WORK_ORDERS', 'SMARTI_WORK'],
  SMARTI_ASSET: ['SMARTI_ASSET', 'ASSET_MANAGEMENT'],
  ASSET_MANAGEMENT: ['ASSET_MANAGEMENT', 'SMARTI_ASSET'],
  SMARTI_VISIT: ['SMARTI_VISIT', 'VISITOR_MANAGEMENT'],
  VISITOR_MANAGEMENT: ['VISITOR_MANAGEMENT', 'SMARTI_VISIT'],
  SMARTI_PARK: ['SMARTI_PARK', 'PARKING_MANAGEMENT'],
  PARKING_MANAGEMENT: ['PARKING_MANAGEMENT', 'SMARTI_PARK'],
  DOCUMENT: ['DOCUMENT', 'DOCUMENT_MANAGEMENT'],
  DOCUMENT_MANAGEMENT: ['DOCUMENT_MANAGEMENT', 'DOCUMENT'],
};

export function RequireModule({ children, moduleCode }: RequireModuleProps) {
  const roles = useSelector((state: RootState) => state.auth.user?.roles) || [];
  
  const { data: myModulesResponse, isLoading } = useGetMyModulesQuery(undefined, {
    skip: roles.includes('PLATFORM_SUPER_ADMIN'),
  });

  const reduxModules = useSelector((state: RootState) => (state.auth.user as any)?.organizationModules) || [];
  const enabledModules = myModulesResponse?.data?.map((m: any) => m.code) || reduxModules;

  // Platform Admins can see everything
  if (roles.includes('PLATFORM_SUPER_ADMIN')) {
    return <>{children}</>;
  }

  const requiredModules = Array.isArray(moduleCode) ? moduleCode : [moduleCode];
  const hasAccess = requiredModules.every(mod => {
    const allowed = MODULE_ALIASES[mod] || [mod];
    return allowed.some(code => enabledModules.includes(code));
  });

  if (isLoading) {
    return <div className="p-12 text-center text-slate-500 font-medium animate-pulse">Verifying module access...</div>;
  }

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="w-20 h-20 bg-rose-100 dark:bg-rose-500/10 rounded-3xl flex items-center justify-center mb-6 shadow-inner border border-rose-200 dark:border-rose-500/20">
          <ShieldAlert className="w-10 h-10 text-rose-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Module Not Activated
        </h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8">
          Your organization does not have an active subscription for this feature. Please contact your Platform Administrator to upgrade your SaaS package.
        </p>
        <Link href="/organization/dashboard">
          <Button variant="primary" className="rounded-xl px-8">
            Return to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
