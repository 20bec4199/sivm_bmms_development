'use client';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { useGetPlatformUsersQuery, useLockPlatformUserMutation } from '@/services/platformApi';
import { Lock, Unlock } from 'lucide-react';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useDispatch } from 'react-redux';
import { showWarning } from '@/store/slices/uiSlice';

export default function UsersPage() {
  const { data: users, isLoading } = useGetPlatformUsersQuery({});
  const [lockUser] = useLockPlatformUserMutation();
  const confirm = useConfirm();
  const dispatch = useDispatch();

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
      // Normally success toast, fallback to alert for success for now
      alert(`User account successfully ${action.toLowerCase()}ed.`);
    } catch (err: any) {
      dispatch(showWarning({ title: `${action} Failed`, message: err?.data?.message || `Failed to ${action.toLowerCase()} account` }));
    }
  };

  const columns = [
    { header: 'Name', accessorKey: 'firstName', cell: (row: any) => `${row.firstName} ${row.lastName || ''}`.trim() },
    { header: 'Email', accessorKey: 'email' },
    { header: 'Organization', accessorKey: 'organizationName' },
    { header: 'Status', accessorKey: 'isActive', cell: (row: any) => (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${row.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
        {row.isActive ? 'Active' : 'Inactive'}
      </span>
    )},
    { header: 'Lock Status', accessorKey: 'isPermanentlyLocked', cell: (row: any) => {
      if (row.isPermanentlyLocked) return <span className="text-red-600 font-semibold">Permanently Locked</span>;
      if (row.lockedUntil && new Date(row.lockedUntil) > new Date()) return <span className="text-orange-500 font-semibold">Temp Locked</span>;
      return <span className="text-green-600">Unlocked</span>;
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
      </div>
    )}
  ];

  return (
    <div>
      <PageHeader title="Platform Users" description="Manage all users and their account lock status across the platform." />
      <Card>
        <CardContent className="p-0">
          <DataTable 
            data={users?.data || []} 
            columns={columns} 
            isLoading={isLoading} 
            mobileRender={(row: any) => (
              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col gap-3">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                      {`${row.firstName} ${row.lastName || ''}`.trim()}
                    </h4>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {row.email}
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-[10px] font-bold rounded-md uppercase tracking-wide ${row.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                    {row.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs mt-1">
                  <div>
                    <span className="text-slate-500 block mb-1">Organization</span>
                    <span className="font-semibold text-indigo-700 dark:text-indigo-400 truncate block">
                      {row.organizationName || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-1">Lock Status</span>
                    {row.isPermanentlyLocked ? (
                      <span className="text-red-600 font-bold bg-red-50 dark:bg-red-950/50 px-2 py-0.5 rounded">Locked</span>
                    ) : row.lockedUntil && new Date(row.lockedUntil) > new Date() ? (
                      <span className="text-orange-500 font-bold bg-orange-50 dark:bg-orange-950/50 px-2 py-0.5 rounded">Temp Locked</span>
                    ) : (
                      <span className="text-green-600 font-bold bg-green-50 dark:bg-green-950/50 px-2 py-0.5 rounded">Unlocked</span>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-end mt-1">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleToggleLock(row.id, row.isPermanentlyLocked)}
                    className={`h-8 text-xs ${row.isPermanentlyLocked ? "text-green-600 hover:text-green-700" : "text-red-600 hover:text-red-700"}`}
                  >
                    {row.isPermanentlyLocked ? <><Unlock className="h-3.5 w-3.5 mr-1" /> Unlock</> : <><Lock className="h-3.5 w-3.5 mr-1" /> Lock</>}
                  </Button>
                </div>
              </div>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
}
