'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { ArrowLeft, LockKeyhole, Mail, Phone, ShieldCheck, UserRound } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { useCreateRoleMutation, useGetPermissionsQuery, useGetRolesQuery, useAssignPermissionMutation } from '@/services/rolesApi';
import { useCreateUserMutation } from '@/services/userApi';

interface RolePermission {
  permissionId: string;
}

interface OrganizationRole {
  id: string;
  name: string;
  rolePermissions?: RolePermission[];
}

interface PermissionRecord {
  id: string;
  subject: string;
  action: string;
}

interface GuardForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
}

const REQUIRED_GUARD_PERMISSIONS = [
  { subject: 'Incident', action: 'READ' },
  { subject: 'Incident', action: 'CREATE' },
  { subject: 'Incident', action: 'UPDATE' },
  { subject: 'VisitorRegistration', action: 'READ' },
  { subject: 'VisitorRegistration', action: 'CREATE' },
  { subject: 'VisitorRegistration', action: 'UPDATE' },
];

const getErrorMessage = (error: unknown) =>
  axios.isAxiosError<{ message?: string }>(error)
    ? error.response?.data?.message ?? 'Could not create the Security Guard account.'
    : error instanceof Error ? error.message : 'Could not create the Security Guard account.';

export default function CreateSecurityGuardPage() {
  const router = useRouter();
  const { data: rolesData, isLoading: rolesLoading } = useGetRolesQuery({});
  const { data: permissionsData, isLoading: permissionsLoading } = useGetPermissionsQuery({});
  const [createRole] = useCreateRoleMutation();
  const [assignPermission] = useAssignPermissionMutation();
  const [createUser] = useCreateUserMutation();
  const [form, setForm] = useState<GuardForm>({ firstName: '', lastName: '', email: '', password: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roles = (Array.isArray(rolesData) ? rolesData : rolesData?.data ?? []) as OrganizationRole[];
  const permissions = (Array.isArray(permissionsData) ? permissionsData : permissionsData?.data ?? []) as PermissionRecord[];

  const updateForm = (field: keyof GuardForm, value: string) => setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      let guardRole = roles.find((role) => role.name === 'SECURITY_GUARD');
      if (!guardRole) {
        guardRole = await createRole({
          name: 'SECURITY_GUARD',
          description: 'Security staff for visitor access, incident reporting, and patrols',
        }).unwrap() as OrganizationRole;
      }

      const missingPermissions = REQUIRED_GUARD_PERMISSIONS.filter((required) =>
        !permissions.some((permission) => permission.subject === required.subject && permission.action === required.action),
      );
      if (missingPermissions.length > 0) {
        const missingList = missingPermissions.map(({ subject, action }) => `${subject} ${action}`).join(', ');
        throw new Error(`Security permissions are missing (${missingList}). Run the backend database seed, then try again.`);
      }

      const assignedPermissionIds = new Set(guardRole.rolePermissions?.map(({ permissionId }) => permissionId) ?? []);
      const permissionIdsToAdd = REQUIRED_GUARD_PERMISSIONS.flatMap((required) => {
        const permission = permissions.find((candidate) => candidate.subject === required.subject && candidate.action === required.action);
        return permission && !assignedPermissionIds.has(permission.id) ? [permission.id] : [];
      });

      await Promise.all(permissionIdsToAdd.map((permissionId) =>
        assignPermission({ roleId: guardRole!.id, permissionId }).unwrap(),
      ));

      await createUser({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim() || undefined,
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim() || undefined,
        roleIds: [guardRole.id],
      }).unwrap();

      router.push('/organization/security-guards');
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  };

  const loading = rolesLoading || permissionsLoading;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/organization/security-guards" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
        <ArrowLeft size={16} /> Back to Security Guards
      </Link>
      <PageHeader title="Provision Security Guard" description="Create an organization account with access to visitor check-in, incidents, and patrols." />

      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-6 border-y border-slate-200 py-6 dark:border-white/10">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="space-y-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
            <span className="flex items-center gap-2"><UserRound size={15} /> First name *</span>
            <input required minLength={2} value={form.firstName} onChange={(event) => updateForm('firstName', event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 dark:border-white/15 dark:bg-white/5 dark:text-white" />
          </label>
          <label className="space-y-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
            <span>Last name</span>
            <input value={form.lastName} onChange={(event) => updateForm('lastName', event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 dark:border-white/15 dark:bg-white/5 dark:text-white" />
          </label>
          <label className="space-y-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 sm:col-span-2">
            <span className="flex items-center gap-2"><Mail size={15} /> Email address *</span>
            <input required type="email" autoComplete="email" value={form.email} onChange={(event) => updateForm('email', event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 dark:border-white/15 dark:bg-white/5 dark:text-white" />
          </label>
          <label className="space-y-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
            <span className="flex items-center gap-2"><LockKeyhole size={15} /> Temporary password *</span>
            <input required type="password" minLength={6} autoComplete="new-password" value={form.password} onChange={(event) => updateForm('password', event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 dark:border-white/15 dark:bg-white/5 dark:text-white" />
          </label>
          <label className="space-y-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
            <span className="flex items-center gap-2"><Phone size={15} /> Phone</span>
            <input type="tel" autoComplete="tel" value={form.phone} onChange={(event) => updateForm('phone', event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 dark:border-white/15 dark:bg-white/5 dark:text-white" />
          </label>
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-5 dark:border-white/10">
          <Link href="/organization/security-guards" className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/5">Cancel</Link>
          <button type="submit" disabled={loading || submitting} className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50">
            <ShieldCheck size={16} />
            {loading ? 'Loading access settings...' : submitting ? 'Creating account...' : 'Create Guard Account'}
          </button>
        </div>
      </form>
    </div>
  );
}