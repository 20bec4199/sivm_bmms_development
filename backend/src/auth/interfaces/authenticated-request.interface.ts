import { Request } from 'express';

/**
 * The user object attached to `request.user` by JwtStrategy.validate().
 * All route handlers receive this shape via @CurrentUser().
 */
export interface AuthenticatedUser {
  /** Database UUID of the user */
  id: string;

  /** User's email address */
  email: string;

  /** Organisation the user belongs to */
  organizationId: string;

  /** Role names extracted from the JWT payload */
  roles: string[];

  /** Trusted flag indicating platform-wide super admin access */
  isPlatformAdmin: boolean;

  /** Permission actions and subjects extracted from the user roles */
  permissions: { action: string; subject: string }[];

  /**
   * Session ID from the JWT payload.
   * Used by logout to revoke the correct session without a full user scan.
   */
  sid: string;

  /** Active modules for this user's organization */
  organizationModules: string[];

  /** Active property categories for this user's organization */
  organizationPropertyCategories: string[];
}

/** Express Request with a typed `user` property */
export type AuthenticatedRequest = Request & { user: AuthenticatedUser };
