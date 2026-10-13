import { SetMetadata } from '@nestjs/common';
import { ROLES_KEY } from '../constants/auth.constants';

/**
 * @Roles(...roles) — declares which roles are required to access a route.
 *
 * Must be used together with @UseGuards(RolesGuard).
 * The role names are compared against the `roles` array in the JWT payload.
 *
 * Usage:
 *   @UseGuards(RolesGuard)
 *   @Roles('ADMIN', 'SUPER_ADMIN')
 *   @Get('admin/users')
 *   getUsers() { ... }
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
