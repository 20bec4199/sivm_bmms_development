import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedRequest, AuthenticatedUser } from '../interfaces/authenticated-request.interface';

/**
 * @CurrentUser() — extracts the authenticated user from the request.
 *
 * The user is attached by JwtStrategy.validate() after the access token
 * is verified. Use this instead of @Req() req — it is type-safe and
 * makes handler signatures explicit about what they need.
 *
 * Usage:
 *   getProfile(@CurrentUser() user: AuthenticatedUser) { ... }
 *   getProfile(@CurrentUser('id') userId: string) { ... }   // extract a single field
 */
export const CurrentUser = createParamDecorator(
  (field: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return field ? request.user?.[field] : request.user;
  },
);
