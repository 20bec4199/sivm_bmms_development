import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY, JWT_ACCESS_STRATEGY } from '../constants/auth.constants';

/**
 * JwtAuthGuard — the global authentication gate.
 *
 * Applied globally via APP_GUARD in AppModule so every route is protected
 * by default. Routes opt out of authentication using the @Public() decorator.
 *
 * Guard resolution order (NestJS):
 *  1. Check IS_PUBLIC_KEY metadata — if set, skip JWT validation entirely
 *  2. Otherwise, delegate to passport-jwt (verifies signature, expiry, etc.)
 *  3. passport-jwt calls JwtStrategy.validate() which does the DB liveness check
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard(JWT_ACCESS_STRATEGY) {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Check both handler and class level for the @Public() decorator
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;
    return super.canActivate(context);
  }
}
