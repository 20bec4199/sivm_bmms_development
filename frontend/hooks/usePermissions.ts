import { useSelector } from 'react-redux';
import { RootState } from '../store/store';

export interface Permission {
  action: string;
  subject: string;
}

export const usePermissions = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  const hasRole = (roleName: string) => {
    if (!user) return false;
    if (user.roles.includes('PLATFORM_SUPER_ADMIN')) return true;
    return user.roles.includes(roleName);
  };

  const hasPermission = (action: string, subject: string) => {
    if (!user) return false;
    if (user.roles.includes('PLATFORM_SUPER_ADMIN')) return true;

    return user.permissions.some(
      (perm) => 
        (perm.action === action || perm.action === 'MANAGE') && 
        (perm.subject === subject || perm.subject === 'ALL')
    );
  };

  const canManage = (subject: string) => hasPermission('MANAGE', subject);
  const canCreate = (subject: string) => hasPermission('CREATE', subject);
  const canRead = (subject: string) => hasPermission('READ', subject);
  const canUpdate = (subject: string) => hasPermission('UPDATE', subject);
  const canDelete = (subject: string) => hasPermission('DELETE', subject);

  return {
    hasRole,
    hasPermission,
    canManage,
    canCreate,
    canRead,
    canUpdate,
    canDelete,
  };
};
