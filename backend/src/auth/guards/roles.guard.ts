import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../constants/auth.constants';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';

/**
 * RolesGuard — coarse-grained RBAC enforcement.
 *
 * Applied explicitly on routes or controllers that require specific roles:
 *   @UseGuards(RolesGuard)
 *   @Roles('ADMIN', 'SUPER_ADMIN')
 *
 * This guard runs AFTER JwtAuthGuard, so request.user is already populated.
 * Role names are compared case-sensitively against the roles array in the JWT.
 *
 * For fine-grained permission checks (ABAC), inject PermissionsGuard instead.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No @Roles() decorator — allow access
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const hasRole = user?.roles?.some((role) => role !== 'PLATFORM_SUPER_ADMIN' && requiredRoles.includes(role));

    if (requiredRoles.includes('PLATFORM_SUPER_ADMIN') && user?.isPlatformAdmin) {
      return true;
    }

    if (!hasRole) {
      throw new ForbiddenException(
        'You do not have the required role to access this resource.',
      );
    }

    return true;
  }
}
