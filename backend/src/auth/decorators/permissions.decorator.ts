import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

export interface RequiredPermission {
  action: string;
  subject: string;
}

/**
 * Decorator to enforce fine-grained ABAC/RBAC permissions.
 * Usage: @RequirePermissions({ action: 'CREATE', subject: 'Property' })
 */
export const RequirePermissions = (...permissions: RequiredPermission[]) => 
  SetMetadata(PERMISSIONS_KEY, permissions);
