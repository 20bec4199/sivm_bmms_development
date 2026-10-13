import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JWT_ACCESS_STRATEGY, COOKIE_ACCESS_TOKEN } from '../constants/auth.constants';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { AuthenticatedUser } from '../interfaces/authenticated-request.interface';
import { AuthRepository } from '../repositories/auth.repository';
import { Logger } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import { AccountLockService } from '../services/account-lock.service';

/**
 * JwtStrategy — validates the access token on every protected request.
 *
 * Token extraction order:
 *  1. HttpOnly cookie `access_token`  — used by browser clients
 *  2. Authorization: Bearer header    — used by mobile apps / API clients
 *
 * The validate() method is called only AFTER the JWT signature and expiry
 * have been verified by passport-jwt. We then do a lightweight DB check
 * to catch deactivated or deleted accounts between token issuance and use.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, JWT_ACCESS_STRATEGY) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly authRepository: AuthRepository,
    private readonly redisService: RedisService,
    private readonly accountLockService: AccountLockService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // Browser clients: cookie is sent automatically
        (req: Request) => req?.cookies?.[COOKIE_ACCESS_TOKEN] ?? null,
        // API / mobile clients: explicit Authorization header
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('auth.jwt.accessSecret') ??
        'fallback-secret-CHANGE-IN-PRODUCTION',
    });
  }

  /**
   * Called by Passport after the JWT is cryptographically verified.
   * The return value is attached to request.user.
   */
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    // 1. Try to get auth context from Redis session cache
    if (payload.sid) {
      const cachedAuth = await this.redisService.getSessionAuthContext(payload.sid);
      if (cachedAuth) {
        return cachedAuth;
      }
    }

    // 2. Cache Miss or Redis failure: Fallback to DB
    const user = await this.authRepository.findUserById(payload.sub);

    if (!user || !user.isActive || user.deletedAt) {
      throw new UnauthorizedException('User account is inactive or does not exist.');
    }

    // Strict lock check on cache miss. Will throw appropriate exceptions if locked.
    this.accountLockService.checkLockStatus(user.isPermanentlyLocked, user.lockedUntil);

    const authContext: AuthenticatedUser = {
      id: user.id,
      email: user.email,
      organizationId: user.organizationId,
      isPlatformAdmin: user.isPlatformAdmin,
      roles: user.userRoles.map((ur) => ur.role.name),
      permissions: Array.from(
        new Map(
          user.userRoles.flatMap(ur =>
            ur.role.rolePermissions.map(rp => [
              `${rp.permission.action}:${rp.permission.subject}`,
              { action: rp.permission.action, subject: rp.permission.subject }
            ])
          )
        ).values()
      ),
      organizationModules: user.organization?.modules
        .filter(m => m.isActive && m.module.isActive)
        .map(m => m.module.code) || [],
      organizationPropertyCategories: user.organization?.propertyCategories
        .filter(pc => pc.isActive && pc.category.isActive)
        .map(pc => pc.category.code) || [],
      sid: payload.sid,
    };

    // 3. Store in Redis to prevent future DB hits
    // TTL is calculated based on remaining time of JWT (exp - current time)
    if (payload.sid && payload.exp) {
      const currentSeconds = Math.floor(Date.now() / 1000);
      const ttlSeconds = Math.max(1, payload.exp - currentSeconds);
      // Fire and forget, don't await to avoid blocking request
      this.redisService.setSessionAuthContext(payload.sid, payload.sub, authContext, ttlSeconds)
        .catch(err => this.logger.error(`Failed to background cache session ${payload.sid}: ${err.message}`));
    }

    return authContext;
  }
}
