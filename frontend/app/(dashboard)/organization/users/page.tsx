'use client';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useGetUsersQuery, useLockUserMutation } from '@/services/userApi';
import { Lock, Unlock } from 'lucide-react';
import Link from 'next/link';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useDispatch } from 'react-redux';
import { showWarning } from '@/store/slices/uiSlice';

export default function OrgUsersPage() {
  const { data: response, isLoading } = useGetUsersQuery({});
  const [lockUser] = useLockUserMutation();
  const dispatch = useDispatch();
  const confirm = useConfirm();

  const users = response?.data || [];

  const handleToggleLock = async (userId: string, currentLockStatus: boolean) => {
    const action = currentLockStatus ? 'Unlock' : 'Lock';
    const isConfirmed = await confirm({
      title: `${action} User`,
      message: `Are you sure you want to ${action.toLowerCase()} this account?`,
      confirmText: `Yes, ${action}`,
      cancelText: 'Cancel',
      destructive: !currentLockStatus,
    });
    
    if (!isConfirmed) return;

    try {
      await lockUser({ userId, isPermanentlyLocked: !currentLockStatus }).unwrap();
      alert(`User account successfully ${action.toLowerCase()}ed.`);
    } catch (err: any) {
      dispatch(showWarning({ title: `${action} Failed`, message: err?.data?.message || `Failed to ${action.toLowerCase()} account` }));
    }
  };

  const columns = [
    { header: 'Name', accessorKey: 'firstName', cell: (row: any) => `${row.firstName} ${row.lastName || ''}`.trim() },
    { header: 'Email', accessorKey: 'email' },
    { header: 'Roles', accessorKey: 'roles', cell: (row: any) => row.userRoles?.map((ur: any) => ur.role.name).join(', ') || 'None' },
    { header: 'Status', accessorKey: 'isActive', cell: (row: any) => (
      <Badge variant={row.isActive ? 'success' : 'danger'}>
        {row.isActive ? 'Active' : 'Inactive'}
      </Badge>
    )},
    { header: 'Lock Status', accessorKey: 'isPermanentlyLocked', cell: (row: any) => {
      if (row.isPermanentlyLocked) return <Badge variant="danger">Permanently Locked</Badge>;
      if (row.lockedUntil && new Date(row.lockedUntil) > new Date()) return <Badge variant="warning">Temp Locked</Badge>;
      return <Badge variant="success">Unlocked</Badge>;
    }},
    { header: 'Actions', accessorKey: 'id', cell: (row: any) => (
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => handleToggleLock(row.id, row.isPermanentlyLocked)}
          className={row.isPermanentlyLocked ? "text-green-600 hover:text-green-700" : "text-red-600 hover:text-red-700"}
        >
          {row.isPermanentlyLocked ? <><Unlock className="h-4 w-4 mr-1" /> Unlock</> : <><Lock className="h-4 w-4 mr-1" /> Lock</>}
        </Button>
        <Link href={`/organization/users/${row.id}/access`}>
          <Button variant="outline" size="sm">Manage Roles</Button>
        </Link>
      </div>
    )}
  ];

  return (
    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 shadow-sm space-y-6 w-full">
      <PageHeader title="Organization Users" description="Manage your organization's members and lock/unlock accounts." />
      <Card>
        <CardContent className="p-0">
          <DataTable 
            data={users} 
            columns={columns} 
            isLoading={isLoading} 
            mobileRender={(row: any) => (
              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">
                      {`${row.firstName} ${row.lastName || ''}`.trim()}
                    </h4>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{row.email}</div>
                  </div>
                  <Badge variant={row.isActive ? 'success' : 'danger'}>
                    {row.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 block mb-1">Roles</span>
                    <span className="font-medium">{row.userRoles?.map((ur: any) => ur.role.name).join(', ') || 'None'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-1">Lock Status</span>
                    {row.isPermanentlyLocked ? <Badge variant="danger">Permanently Locked</Badge> : 
                     row.lockedUntil && new Date(row.lockedUntil) > new Date() ? <Badge variant="warning">Temp Locked</Badge> : 
                     <Badge variant="success">Unlocked</Badge>}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex flex-wrap gap-2 justify-end">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleToggleLock(row.id, row.isPermanentlyLocked)}
                    className={row.isPermanentlyLocked ? "text-green-600 hover:text-green-700" : "text-red-600 hover:text-red-700"}
                  >
                    {row.isPermanentlyLocked ? <><Unlock className="h-4 w-4 mr-1" /> Unlock</> : <><Lock className="h-4 w-4 mr-1" /> Lock</>}
                  </Button>
                  <Link href={`/organization/users/${row.id}/access`}>
                    <Button variant="outline" size="sm">Manage Roles</Button>
                  </Link>
                </div>
              </div>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
}
