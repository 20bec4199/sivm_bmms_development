import { Injectable } from '@nestjs/common';
import { LOCK_THRESHOLDS } from '../constants/auth.constants';
import {
  AccountLockedPermanentException,
  AccountLockedTemporaryException,
} from '../exceptions/auth.exceptions';
import { AuthRepository } from '../repositories/auth.repository';

import { RedisService } from '../../redis/redis.service';

/**
 * AccountLockService — enforces the progressive lockout policy.
 *
 * Lock tiers (from auth.constants.ts):
 *   3  failed attempts → 5-minute lock
 *   5  failed attempts → 30-minute lock
 *   10 failed attempts → 24-hour lock
 *   20 failed attempts → permanent lock (admin unlock required)
 *
 * Design decision: both the check (throws) and the increment (writes DB)
 * are co-located here so the business rule cannot be bypassed by calling
 * one without the other.
 */
@Injectable()
export class AccountLockService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Throws an appropriate exception if the account is currently locked.
   * Called BEFORE password verification — locked accounts get no hint
   * about whether the password would have been correct.
   */
  checkLockStatus(isPermanentlyLocked: boolean, lockedUntil: Date | null): void {
    if (isPermanentlyLocked) {
      throw new AccountLockedPermanentException();
    }
    if (lockedUntil && lockedUntil > new Date()) {
      throw new AccountLockedTemporaryException(lockedUntil);
    }
  }

  /**
   * Increments the failed-attempt counter and applies the appropriate
   * lock duration if a threshold is crossed.
   * Called AFTER a verified password mismatch.
   */
  async recordFailedAttempt(userId: string, currentCount: number): Promise<void> {
    const newCount = currentCount + 1;
    let lockedUntil: Date | null = null;
    let isPermanentlyLocked = false;

    // Walk thresholds in descending order — apply the highest one that applies
    for (let i = LOCK_THRESHOLDS.length - 1; i >= 0; i--) {
      const threshold = LOCK_THRESHOLDS[i];
      if (newCount >= threshold.attempts) {
        if (threshold.durationMs === null) {
          isPermanentlyLocked = true;
        } else {
          lockedUntil = new Date(Date.now() + threshold.durationMs);
        }
        break;
      }
    }

    await this.authRepository.updateUserLockStatus(userId, {
      failedLoginCount: newCount,
      lastFailedLoginAt: new Date(),
      lockedUntil,
      isPermanentlyLocked,
    });

    if (isPermanentlyLocked || lockedUntil) {
      await this.redisService.invalidateAllUserSessions(userId);
    }
  }
}
