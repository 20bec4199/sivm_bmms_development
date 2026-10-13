import React from 'react';
import { usePermissions } from '../../hooks/usePermissions';

interface RequirePermissionProps {
  action: string;
  subject: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Conditionally renders children if the user has the required permission.
 * Used for granular UI elements like "Edit", "Delete" buttons or Menu items.
 */
export const RequirePermission: React.FC<RequirePermissionProps> = ({ 
  action, 
  subject, 
  children, 
  fallback = null 
}) => {
  const { hasPermission } = usePermissions();

  if (hasPermission(action, subject)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};

interface RequireRoleProps {
  role: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RequireRole: React.FC<RequireRoleProps> = ({ 
  role, 
  children, 
  fallback = null 
}) => {
  const { hasRole } = usePermissions();

  if (hasRole(role)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};
