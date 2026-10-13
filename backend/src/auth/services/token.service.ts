import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { TokenStatus } from '@prisma/client';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { ACCESS_TOKEN_TTL_SECONDS, REFRESH_TOKEN_TTL_DAYS } from '../constants/auth.constants';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { AuthRepository } from '../repositories/auth.repository';

/**
 * TokenService — handles all cryptographic token operations.
 *
 * Responsibilities:
 *  - Sign and return JWT access tokens
 *  - Generate cryptographically-random opaque refresh tokens
 *  - Hash tokens with SHA-256 for safe DB storage
 *  - Persist new refresh token records (with hash, family, TTL)
 *  - Generate single-use email tokens (verify, reset)
 */
@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly authRepository: AuthRepository,
  ) {}

  /**
   * SHA-256 hash of a raw token string.
   * Used before storing in DB — the raw value must never be persisted.
   */
  hashToken(raw: string): string {
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  /** 32 cryptographically-random bytes encoded as a 64-char hex string */
  generateOpaqueToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Signs a JWT access token with the configured secret and TTL.
   * Adds a unique `jti` (JWT ID) claim to every token for future denylist support.
   */
  signAccessToken(payload: Omit<JwtPayload, 'jti' | 'iat' | 'exp'>): Promise<string> {
    const jti = uuidv4();
    return this.jwtService.signAsync(
      { ...payload, jti },
      {
        secret: this.configService.get<string>('auth.jwt.accessSecret'),
        expiresIn: `${ACCESS_TOKEN_TTL_SECONDS}s`,
      },
    );
  }

  /**
   * Generates a new opaque refresh token, hashes it, and persists the hash.
   * Returns the raw (unhashed) token — this is the only time it is visible
   * and must be immediately placed in the HttpOnly cookie.
   */
  async createAndPersistRefreshToken(
    sessionId: string,
    userId: string,
    familyId: string,
  ): Promise<string> {
    const rawToken = this.generateOpaqueToken();
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

    await this.authRepository.createRefreshToken({
      sessionId,
      userId,
      tokenHash,
      familyId,
      status: TokenStatus.ACTIVE,
      expiresAt,
    });

    return rawToken;
  }

  /**
   * Generates a raw opaque token + its SHA-256 hash for email flows.
   * The raw token goes into the email link; the hash is stored in the DB.
   */
  createEmailToken(): { rawToken: string; tokenHash: string } {
    const rawToken = this.generateOpaqueToken();
    return { rawToken, tokenHash: this.hashToken(rawToken) };
  }
}
