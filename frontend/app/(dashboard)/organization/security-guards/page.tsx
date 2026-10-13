'use client';

import Link from 'next/link';
import { Plus, ShieldCheck, UserRound } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { useGetUsersQuery } from '@/services/userApi';

interface UserRoleLink {
  role?: { name?: string };
}

interface OrganizationUser {
  id: string;
  firstName: string;
  lastName?: string | null;
  email: string;
  phone?: string | null;
  isActive: boolean;
  userRoles?: UserRoleLink[];
}

export default function SecurityGuardsPage() {
  const { data, isLoading, isError } = useGetUsersQuery({ take: 500 });
  const guards = ((data?.data ?? []) as OrganizationUser[]).filter((user) =>
    user.userRoles?.some(({ role }) => role?.name === 'SECURITY_GUARD'),
  );

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="Security Guards"
        description="Create and manage guard accounts for visitor access, incident reporting, and patrols."
        action={(
          <Link
            href="/organization/security-guards/new"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
          >
            <Plus size={16} />
            Provision Guard
          </Link>
        )}
      />

      {isLoading ? (
        <p className="py-12 text-center text-sm text-slate-500">Loading guard accounts...</p>
      ) : isError ? (
        <p role="alert" className="py-12 text-center text-sm text-red-600">Could not load organization users.</p>
      ) : guards.length === 0 ? (
        <div className="border-y border-slate-200 py-14 text-center dark:border-white/10">
          <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-slate-400" />
          <p className="font-semibold text-slate-900 dark:text-white">No guard accounts yet</p>
          <p className="mt-1 text-sm text-slate-500">Provision an account to give a team member Security access.</p>
        </div>
      ) : (
        <div className="overflow-x-auto border-y border-slate-200 dark:border-white/10">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-white/10">
                <th className="px-4 py-3 font-semibold">Guard</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Phone</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/10">
              {guards.map((guard) => (
                <tr key={guard.id}>
                  <td className="px-4 py-4 font-medium text-slate-900 dark:text-white">
                    <span className="inline-flex items-center gap-2"><UserRound size={16} className="text-slate-400" />{guard.firstName} {guard.lastName ?? ''}</span>
                  </td>
                  <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{guard.email}</td>
                  <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{guard.phone || 'Not provided'}</td>
                  <td className="px-4 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${guard.isActive ? 'bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-300' : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300'}`}>
                      {guard.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}