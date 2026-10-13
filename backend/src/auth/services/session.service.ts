import { Injectable } from '@nestjs/common';
import { Session, SessionRevokedReason } from '@prisma/client';
import { REFRESH_TOKEN_TTL_DAYS } from '../constants/auth.constants';
import { AuthRepository } from '../repositories/auth.repository';
import { RedisService } from '../../redis/redis.service';

/**
 * SessionService — manages the session lifecycle.
 *
 * A session is the logical "login" for one device.
 * It survives across many token-rotation cycles and is revoked
 * when the user logs out, changes their password, or a security
 * breach is detected.
 */
@Injectable()
export class SessionService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Creates a new session record.
   * expiresAt is aligned with the refresh token TTL so the session
   * and its tokens expire together.
   */
  createSession(data: {
    userId: string;
    ipAddress: string | null;
    userAgent: string | null;
    deviceName: string | null;
  }): Promise<Session> {
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
    return this.authRepository.createSession({
      ...data,
      lastIpAddress: data.ipAddress,
      expiresAt,
    });
  }

  /** Revokes a single session by ID — used for local logout */
  async revokeSession(sessionId: string, userId: string, reason: SessionRevokedReason) {
    const res = await this.authRepository.revokeSession(sessionId, userId, reason);
    await this.redisService.invalidateSession(sessionId, userId);
    return res;
  }

  /** Revokes all active sessions for a user — used after password change/reset */
  async revokeAllSessions(userId: string, reason: SessionRevokedReason) {
    const res = await this.authRepository.revokeAllUserSessions(userId, reason);
    await this.redisService.invalidateAllUserSessions(userId);
    return res;
  }

  /**
   * Revokes all sessions EXCEPT the current one.
   * Used for "logout everywhere else" (global logout keeping current device active).
   */
  async revokeAllSessionsExcept(userId: string, excludeSessionId: string, reason: SessionRevokedReason) {
    const res = await this.authRepository.revokeAllUserSessionsExcept(userId, excludeSessionId, reason);
    // Invalidate all sessions for the user, except the one they are currently using
    // First clear all, then we just wait for the next request to rebuild the excludeSessionId cache
    await this.redisService.invalidateAllUserSessions(userId);
    return res;
  }

  /** Returns all active sessions — shown in the "manage devices" UI */
  getActiveSessions(userId: string) {
    return this.authRepository.findActiveSessionsByUser(userId);
  }

  /** Updates lastActiveAt — called on every successful refresh rotation */
  touch(sessionId: string) {
    return this.authRepository.touchSession(sessionId);
  }
}
