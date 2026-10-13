import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LOCAL_STRATEGY } from '../constants/auth.constants';

/**
 * LocalAuthGuard — activates the passport-local strategy.
 *
 * Used ONLY on POST /auth/login.
 * passport-local reads `req.body.email` and `req.body.password`,
 * calls LocalStrategy.validate(), and on success attaches the user to req.user.
 *
 * This guard is applied in addition to (not instead of) the global JwtAuthGuard.
 * The login route is also decorated with @Public() so the global JwtAuthGuard
 * skips its check, leaving only LocalAuthGuard to run.
 */
@Injectable()
export class LocalAuthGuard extends AuthGuard(LOCAL_STRATEGY) {}
