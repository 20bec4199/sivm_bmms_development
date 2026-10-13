import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { PASSWORD_HISTORY_LIMIT } from '../constants/auth.constants';
import { AuthRepository } from '../repositories/auth.repository';

/**
 * PasswordService — handles all password cryptography and history policy.
 *
 * Algorithm: argon2id
 *  - Memory-hard (resistant to GPU/ASIC brute-force attacks)
 *  - Recommended by OWASP over bcrypt for new systems
 *  - Parameters meet OWASP minimum: memory=64 MiB, time=3, parallelism=4
 *
 * Note: argon2.verify(hash, plain) — hash is the FIRST argument.
 */
@Injectable()
export class PasswordService {
  private readonly options: argon2.Options & { raw?: false } = {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MiB
    timeCost: 3,
    parallelism: 4,
  };

  constructor(private readonly authRepository: AuthRepository) {}

  /** Returns the argon2id hash of the given plaintext password */
  hash(password: string): Promise<string> {
    return argon2.hash(password, this.options);
  }

  /** Returns true when the plaintext password matches the stored hash */
  verify(hash: string, password: string): Promise<boolean> {
    return argon2.verify(hash, password);
  }

  /**
   * Returns true when the new password matches any of the last N stored hashes.
   * Enforces the password history policy (default: last 5 passwords).
   * Each hash comparison is done with argon2.verify so timing is safe.
   */
  async isReused(userId: string, newPassword: string): Promise<boolean> {
    const recentHashes = await this.authRepository.findRecentPasswordHashes(
      userId,
      PASSWORD_HISTORY_LIMIT,
    );
    for (const hash of recentHashes) {
      if (await argon2.verify(hash, newPassword)) return true;
    }
    return false;
  }

  /** Appends the new hash to the user's password history */
  saveToHistory(userId: string, passwordHash: string) {
    return this.authRepository.savePasswordToHistory(userId, passwordHash);
  }
}
