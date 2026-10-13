import { Injectable } from '@nestjs/common';
import { LoginOutcome, SessionRevokedReason, TokenStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * AuthRepository — the sole data-access layer for the auth domain.
 *
 * All Prisma queries that touch auth-related tables live here.
 * AuthService and its sub-services only call this class; they never
 * import PrismaService directly. This keeps business logic testable
 * (mock the repository, not the ORM).
 */
@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ─── User ─────────────────────────────────────────────────────────────────

  /** Primary login lookup — uses the normalised index for case-insensitivity */
  findUserByEmailNormalized(emailNormalized: string) {
    return this.prisma.user.findUnique({
      where: { emailNormalized },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
        organization: {
          include: {
            modules: {
              include: { module: true }
            },
            propertyCategories: {
              include: { category: true }
            }
          }
        },
        technicianProfile: true
      },
    });
  }

  /** Load full user + roles by PK — used by JWT strategy and profile endpoint */
  findUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
        organization: {
          include: {
            modules: {
              include: { module: true }
            },
            propertyCategories: {
              include: { category: true }
            }
          }
        },
        technicianProfile: true
      },
    });
  }

  findRoleByName(name: string, organizationId: string) {
    return this.prisma.role.findFirst({
      where: { name, organizationId },
    });
  }

  findPlatformRoleByName(name: string) {
    return this.prisma.role.findFirst({
      where: { name, organization: { name: 'Platform HQ' } },
    });
  }

  createRole(data: { name: string; description?: string; organizationId: string; isDefault?: boolean }) {
    return this.prisma.role.create({ data });
  }

  assignRoleToUser(userId: string, roleId: string) {
    return this.prisma.userRole.create({
      data: { userId, roleId },
    });
  }

  createUser(data: {
    email: string;
    emailNormalized: string;
    passwordHash: string;
    firstName: string;
    lastName?: string | null;
    organizationId: string;
  }) {
    return this.prisma.user.create({ data });
  }

  /** Resets failed-attempt counter and records last successful login metadata */
  updateUserOnSuccessfulLogin(
    userId: string,
    data: {
      lastLoginAt: Date;
      failedLoginCount: number;
      lockedUntil: null;
      lastLoginIp: string | null;
    },
  ) {
    return this.prisma.user.update({ where: { id: userId }, data });
  }

  /** Updates progressive lock fields after a failed password attempt */
  updateUserLockStatus(
    userId: string,
    data: {
      failedLoginCount: number;
      lastFailedLoginAt: Date;
      lockedUntil: Date | null;
      isPermanentlyLocked: boolean;
    },
  ) {
    return this.prisma.user.update({ where: { id: userId }, data });
  }

  updateUserPassword(userId: string, passwordHash: string) {
    return this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  }

  markEmailVerified(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true, emailVerifiedAt: new Date() },
    });
  }

  // ─── Organisation ─────────────────────────────────────────────────────────

  createOrganization(data: { name: string; industry?: string; size?: string; modules?: string[]; propertyCategories?: string[] }) {
    const { modules, propertyCategories, ...rest } = data;
    
    // We map codes to the connection using the unique 'code' field of ModuleMaster/PropertyCategoryMaster.
    return this.prisma.organization.create({
      data: {
        ...rest,
        ...(modules && modules.length > 0 ? {
          modules: {
            create: modules.map(code => ({
              module: { connect: { code } }
            }))
          }
        } : {}),
        ...(propertyCategories && propertyCategories.length > 0 ? {
          propertyCategories: {
            create: propertyCategories.map(code => ({
              category: { connect: { code } }
            }))
          }
        } : {})
      }
    });
  }

  findOrganizationById(id: string) {
    return this.prisma.organization.findUnique({ where: { id } });
  }

  // ─── Sessions ─────────────────────────────────────────────────────────────

  /**
   * One session per device/login event.
   * expiresAt is set to now + REFRESH_TOKEN_TTL_DAYS so session and
   * refresh token lifetimes are aligned.
   */
  createSession(data: {
    userId: string;
    ipAddress: string | null;
    lastIpAddress: string | null;
    userAgent: string | null;
    deviceName: string | null;
    expiresAt: Date;
  }) {
    return this.prisma.session.create({ data });
  }

  /** Revokes a single session — used by local logout and admin forced logout */
  revokeSession(sessionId: string, userId: string, reason: SessionRevokedReason) {
    return this.prisma.session.updateMany({
      where: { id: sessionId, userId },
      data: { isActive: false, revokedAt: new Date(), revokedReason: reason },
    });
  }

  /** Revokes every active session for a user — used after password change/reset */
  revokeAllUserSessions(userId: string, reason: SessionRevokedReason) {
    return this.prisma.session.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false, revokedAt: new Date(), revokedReason: reason },
    });
  }

  /** Revokes all active sessions except the current one — "logout everywhere else" */
  revokeAllUserSessionsExcept(
    userId: string,
    excludeSessionId: string,
    reason: SessionRevokedReason,
  ) {
    return this.prisma.session.updateMany({
      where: { userId, isActive: true, id: { not: excludeSessionId } },
      data: { isActive: false, revokedAt: new Date(), revokedReason: reason },
    });
  }

  /** Bumps lastActiveAt — called on every successful token refresh */
  touchSession(sessionId: string) {
    return this.prisma.session.update({
      where: { id: sessionId },
      data: { lastActiveAt: new Date() },
    });
  }

  findActiveSessionsByUser(userId: string) {
    return this.prisma.session.findMany({
      where: { userId, isActive: true },
      orderBy: { lastActiveAt: 'desc' },
    });
  }

  // ─── Refresh Tokens ───────────────────────────────────────────────────────

  /**
   * Persists a new refresh token.
   * tokenHash = SHA-256(rawToken) — the raw value travels only in the cookie.
   * familyId links all tokens from one login for reuse-detection purposes.
   */
  createRefreshToken(data: {
    sessionId: string;
    userId: string;
    tokenHash: string;
    familyId: string;
    status: TokenStatus;
    expiresAt: Date;
  }) {
    return this.prisma.refreshToken.create({ data });
  }

  /** Loads the stored token + its parent session in a single query */
  findRefreshTokenByHash(tokenHash: string) {
    return this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { session: true },
    });
  }

  /** Marks a token USED during rotation — a USED token presented again = breach */
  markRefreshTokenUsed(tokenId: string) {
    return this.prisma.refreshToken.update({
      where: { id: tokenId },
      data: { status: TokenStatus.USED, usedAt: new Date() },
    });
  }

  /** Revokes every token in a family — triggered by reuse detection */
  revokeTokenFamily(familyId: string) {
    return this.prisma.refreshToken.updateMany({
      where: { familyId },
      data: { status: TokenStatus.REVOKED },
    });
  }

  /** Revokes all ACTIVE tokens for a user — triggered by password change/reset */
  revokeAllUserRefreshTokens(userId: string) {
    return this.prisma.refreshToken.updateMany({
      where: { userId, status: TokenStatus.ACTIVE },
      data: { status: TokenStatus.REVOKED },
    });
  }

  /** Revokes all ACTIVE tokens for a specific session */
  revokeSessionRefreshTokens(sessionId: string) {
    return this.prisma.refreshToken.updateMany({
      where: { sessionId, status: TokenStatus.ACTIVE },
      data: { status: TokenStatus.REVOKED },
    });
  }

  /** Revokes all ACTIVE tokens for a user EXCEPT a specific session */
  revokeOtherSessionRefreshTokens(userId: string, excludeSessionId: string) {
    return this.prisma.refreshToken.updateMany({
      where: { userId, status: TokenStatus.ACTIVE, sessionId: { not: excludeSessionId } },
      data: { status: TokenStatus.REVOKED },
    });
  }

  // ─── Email Verification ───────────────────────────────────────────────────

  createEmailVerificationToken(data: { userId: string; tokenHash: string; expiresAt: Date }) {
    return this.prisma.emailVerification.create({ data });
  }

  /** Invalidates outstanding tokens before creating a new one (resend flow) */
  invalidateEmailVerificationTokens(userId: string) {
    return this.prisma.emailVerification.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    });
  }

  findEmailVerificationToken(tokenHash: string) {
    return this.prisma.emailVerification.findUnique({ where: { tokenHash } });
  }

  markEmailVerificationTokenUsed(tokenId: string) {
    return this.prisma.emailVerification.update({
      where: { id: tokenId },
      data: { usedAt: new Date() },
    });
  }

  // ─── Password Reset ───────────────────────────────────────────────────────

  createPasswordResetToken(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    requestedIp: string | null;
  }) {
    return this.prisma.passwordResetToken.create({ data });
  }

  /** Invalidates all active reset tokens before issuing a new one */
  invalidatePasswordResetTokens(userId: string) {
    return this.prisma.passwordResetToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    });
  }

  findPasswordResetToken(tokenHash: string) {
    return this.prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  }

  markPasswordResetTokenUsed(tokenId: string) {
    return this.prisma.passwordResetToken.update({
      where: { id: tokenId },
      data: { usedAt: new Date() },
    });
  }

  // ─── Password History ─────────────────────────────────────────────────────

  /** Appends a new hash to the user's password history */
  savePasswordToHistory(userId: string, passwordHash: string) {
    return this.prisma.passwordHistory.create({ data: { userId, passwordHash } });
  }

  /**
   * Returns the N most-recent password hashes for a user.
   * Used by PasswordService.isReused() to enforce the history policy.
   */
  async findRecentPasswordHashes(userId: string, limit: number): Promise<string[]> {
    const rows = await this.prisma.passwordHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: { passwordHash: true },
    });
    return rows.map((r) => r.passwordHash);
  }

  // ─── Login History ────────────────────────────────────────────────────────

  /**
   * Append-only — never updated after insert.
   * Records every login attempt (success and failure) for security dashboards
   * and forensic auditing. userId is nullable to capture "user not found" events.
   */
  createLoginHistory(data: {
    organizationId: string | null;
    userId: string | null;
    sessionId: string | null;
    email: string;
    outcome: LoginOutcome;
    ipAddress: string | null;
    userAgent: string | null;
    deviceName: string | null;
    failureReason: string | null;
  }) {
    return this.prisma.loginHistory.create({ data });
  }
}
