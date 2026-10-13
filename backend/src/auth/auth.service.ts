import { Injectable, NotFoundException } from '@nestjs/common';
import { LoginOutcome, SessionRevokedReason } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { VERIFY_TOKEN_TTL_MS, RESET_TOKEN_TTL_MS } from './constants/auth.constants';
import { AuthenticatedUser } from './interfaces/authenticated-request.interface';
import {
  InvalidCredentialsException,
  AccountInactiveException,
  EmailNotVerifiedException,
  InvalidTokenException,
  InvalidCurrentPasswordException,
  PasswordReusedException,
  EmailAlreadyExistsException,
} from './exceptions/auth.exceptions';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import {
  LoginResponseDto,
  TokenRefreshResponseDto,
  MessageResponseDto,
  ActiveSessionDto,
  UserProfileDto,
} from './dto/auth-response.dto';
import { AuthRepository } from './repositories/auth.repository';
import { TokenService } from './services/token.service';
import { SessionService } from './services/session.service';
import { PasswordService } from './services/password.service';
import { AccountLockService } from './services/account-lock.service';

import { EmailService } from '../email/email.service';

/**
 * AuthService — top-level orchestrator for all authentication flows.
 *
 * Delegates to purpose-specific sub-services:
 *  - AccountLockService: lock-check and failed-attempt tracking
 *  - PasswordService:    argon2id hash / verify / history
 *  - SessionService:     session CRUD
 *  - TokenService:       JWT signing, opaque refresh token generation, hashing
 *  - AuthRepository:     all raw Prisma queries
 *  - EmailService:       transactional email sending
 *
 * This service contains no direct Prisma or crypto calls.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly tokenService: TokenService,
    private readonly sessionService: SessionService,
    private readonly passwordService: PasswordService,
    private readonly accountLockService: AccountLockService,
    private readonly emailService: EmailService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // VALIDATE CREDENTIALS  (called by LocalStrategy — before session is created)
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Verifies email + password and returns a minimal AuthenticatedUser.
   * Called by LocalStrategy.validate() — Passport attaches the return value
   * to request.user, and the controller then calls login() to issue tokens.
   */
  async validateCredentials(email: string, password: string): Promise<AuthenticatedUser> {
    const normalized = email.toLowerCase().trim();
    const user = await this.authRepository.findUserByEmailNormalized(normalized);

    if (!user) {
      // Timing-safe: still do a dummy hash to prevent user enumeration via response time
      await this.passwordService.hash(password);
      throw new InvalidCredentialsException();
    }

    if (!user.isActive) throw new AccountInactiveException();

    this.accountLockService.checkLockStatus(user.isPermanentlyLocked, user.lockedUntil);

    const isValid = await this.passwordService.verify(user.passwordHash, password);

    if (!isValid) {
      await this.accountLockService.recordFailedAttempt(user.id, user.failedLoginCount);
      await this.authRepository.createLoginHistory({
        organizationId: null,
        userId: user.id,
        sessionId: null,
        email: normalized,
        outcome: LoginOutcome.INVALID_PASSWORD,
        ipAddress: null,
        userAgent: null,
        deviceName: null,
        failureReason: null,
      });
      throw new InvalidCredentialsException();
    }

    if (!user.emailVerified) {
      throw new EmailNotVerifiedException();
    }

    return {
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
      sid: '', // placeholder — real sid assigned after session is created in login()
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // LOGIN  (called AFTER LocalStrategy succeeds — creates session + tokens)
  // ─────────────────────────────────────────────────────────────────────────────

  async login(
    validatedUser: AuthenticatedUser,
    ipAddress: string | null,
    userAgent: string | null,
    deviceName: string | null = null,
  ): Promise<{ response: LoginResponseDto; rawRefreshToken: string }> {
    const session = await this.sessionService.createSession({
      userId: validatedUser.id,
      ipAddress,
      userAgent,
      deviceName,
    });
    console.log("login");

    const accessToken = await this.tokenService.signAccessToken({
      sub: validatedUser.id,
      sid: session.id,
      organizationId: validatedUser.organizationId,
      roles: validatedUser.roles,
    });

    const familyId = uuidv4();
    const rawRefreshToken = await this.tokenService.createAndPersistRefreshToken(
      session.id,
      validatedUser.id,
      familyId,
    );

    await Promise.all([
      this.authRepository.updateUserOnSuccessfulLogin(validatedUser.id, {
        lastLoginAt: new Date(),
        failedLoginCount: 0,
        lockedUntil: null,
        lastLoginIp: ipAddress,
      }),
      this.authRepository.createLoginHistory({
        organizationId: validatedUser.organizationId,
        userId: validatedUser.id,
        sessionId: session.id,
        email: validatedUser.email,
        outcome: LoginOutcome.SUCCESS,
        ipAddress,
        userAgent,
        deviceName,
        failureReason: null,
      }),
    ]);

    const user = await this.authRepository.findUserById(validatedUser.id);

    return {
      response: {
        accessToken,
        refreshToken: rawRefreshToken,
        user: {
          id: user!.id,
          email: user!.email,
          firstName: user!.firstName,
          lastName: user!.lastName ?? null,
          organizationId: user!.organizationId,
          roles: validatedUser.roles,
          permissions: validatedUser.permissions,
          organizationModules: validatedUser.organizationModules,
          organizationPropertyCategories: validatedUser.organizationPropertyCategories,
          isEmailVerified: user!.emailVerified,
          createdAt: user!.createdAt,
        } satisfies UserProfileDto,
      },
      rawRefreshToken,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // REGISTER
  // ─────────────────────────────────────────────────────────────────────────────

  async createOrganization(dto: { name: string; industry?: string; size?: string; modules?: string[]; propertyCategories?: string[] }) {
    const org = await this.authRepository.createOrganization({
      name: dto.name,
      industry: dto.industry,
      size: dto.size,
      modules: dto.modules,
      propertyCategories: dto.propertyCategories,
    });
    
    await this.authRepository.createRole({
      name: 'ORGANIZATION_ADMIN',
      description: 'Organization Administrator with full access',
      organizationId: org.id,
      isDefault: true,
    });

    await this.authRepository.createRole({
      name: 'BUILDING_MANAGER',
      description: 'Manager of specific buildings',
      organizationId: org.id,
      isDefault: false,
    });

    await this.authRepository.createRole({
      name: 'TECHNICIAN',
      description: 'Maintenance Staff',
      organizationId: org.id,
      isDefault: false,
    });

    await this.authRepository.createRole({
      name: 'RESIDENT',
      description: 'Community Resident',
      organizationId: org.id,
      isDefault: false,
    });

    return { id: org.id, name: org.name };
  }

  async inviteAdmin(dto: { email: string; firstName: string; lastName?: string; orgId: string }) {
    const normalized = dto.email.toLowerCase().trim();
    const existing = await this.authRepository.findUserByEmailNormalized(normalized);
    if (existing) throw new EmailAlreadyExistsException();

    // Generate a temporary random password hash
    const tempPasswordHash = await this.passwordService.hash(
      Math.random().toString(36).slice(-8) + 'A1!'
    );

    const user = await this.authRepository.createUser({
      firstName: dto.firstName,
      lastName: dto.lastName ?? null,
      email: normalized,
      emailNormalized: normalized,
      passwordHash: tempPasswordHash,
      organizationId: dto.orgId,
    });

    const role = await this.authRepository.findRoleByName('ORGANIZATION_ADMIN', dto.orgId);
    if (role) {
      await this.authRepository.assignRoleToUser(user.id, role.id);
    }

    const { tokenHash, rawToken } = this.tokenService.createEmailToken();
    await this.authRepository.createPasswordResetToken({
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days to activate
      requestedIp: null,
    });

    const frontendUrl = process.env.FRONTEND_URL?.split(',')[0] || 'http://localhost:3001';
    const setupLink = `${frontendUrl}/reset-password?token=${rawToken}`;
    const org = await this.authRepository.findOrganizationById(dto.orgId);
    
    this.emailService.sendAdminInvitation(
      normalized,
      dto.firstName,
      org?.name || 'Your Organization',
      setupLink
    ).catch(err => console.error('Background email sending failed:', err));

    return { message: 'Organization Admin invited successfully. Activation email triggered.' };
  }

  async inviteResident(dto: { email: string; firstName: string; lastName?: string; orgId: string; roleName: string }) {
    const normalized = dto.email.toLowerCase().trim();
    const existing = await this.authRepository.findUserByEmailNormalized(normalized);
    if (existing) return { message: 'User already exists.', user: existing };

    const tempPasswordHash = await this.passwordService.hash(
      Math.random().toString(36).slice(-8) + 'R1!'
    );

    const user = await this.authRepository.createUser({
      firstName: dto.firstName,
      lastName: dto.lastName ?? null,
      email: normalized,
      emailNormalized: normalized,
      passwordHash: tempPasswordHash,
      organizationId: dto.orgId,
    });

    const role = await this.authRepository.findRoleByName(dto.roleName, dto.orgId) 
      || await this.authRepository.findPlatformRoleByName(dto.roleName);
      
    if (role) {
      await this.authRepository.assignRoleToUser(user.id, role.id);
    }

    const { tokenHash, rawToken } = this.tokenService.createEmailToken();
    await this.authRepository.createPasswordResetToken({
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      requestedIp: null,
    });

    const frontendUrl = process.env.FRONTEND_URL?.split(',')[0] || 'http://localhost:3001';
    const setupLink = `${frontendUrl}/reset-password?token=${rawToken}`;
    const org = await this.authRepository.findOrganizationById(dto.orgId);
    
    this.emailService.sendAdminInvitation(
      normalized,
      dto.firstName,
      org?.name || 'Your Community',
      setupLink
    ).catch(err => console.error('Background email sending failed:', err)); // Reusing the same email template for now

    return { message: 'Resident invited successfully.', user };
  }

  async register(
    dto: RegisterDto,
    ipAddress: string | null,
    userAgent: string | null,
  ): Promise<{ response: LoginResponseDto; rawRefreshToken: string }> {
    const normalized = dto.email.toLowerCase().trim();
    const existing = await this.authRepository.findUserByEmailNormalized(normalized);
    if (existing) throw new EmailAlreadyExistsException();

    const passwordHash = await this.passwordService.hash(dto.password);
    const verifyToken = this.tokenService.createEmailToken();

    // If orgId is passed in dto, we should use it. Wait, RegisterDto doesn't have orgId right now.
    // I should add orgId to RegisterDto.
    // I'll do that below.
    const orgId = dto.orgId;
    let finalOrgId = orgId;
    
    if (!finalOrgId) {
      const org = await this.authRepository.createOrganization({
        name: dto.orgName ?? `${dto.firstName}'s Organization`,
        industry: dto.orgIndustry,
        size: dto.orgSize,
      });
      finalOrgId = org.id;
    }

    const user = await this.authRepository.createUser({
      firstName: dto.firstName,
      lastName: dto.lastName ?? null,
      email: normalized,
      emailNormalized: normalized,
      passwordHash,
      organizationId: finalOrgId,
    });

    await Promise.all([
      this.passwordService.saveToHistory(user.id, passwordHash),
      this.authRepository.createEmailVerificationToken({
        userId: user.id,
        tokenHash: verifyToken.tokenHash,
        expiresAt: new Date(Date.now() + VERIFY_TOKEN_TTL_MS),
      }),
    ]);

    const validatedUser: AuthenticatedUser = {
      id: user.id,
      email: user.email,
      organizationId: user.organizationId,
      isPlatformAdmin: user.isPlatformAdmin,
      roles: [],
      permissions: [],
      organizationModules: [], // Initial registration sets no modules unless passed
      organizationPropertyCategories: [],
      sid: '',
    };

    return this.login(validatedUser, ipAddress, userAgent);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // LOGOUT
  // ─────────────────────────────────────────────────────────────────────────────

  async logout(userId: string, sessionId: string): Promise<void> {
    await Promise.all([
      this.sessionService.revokeSession(sessionId, userId, SessionRevokedReason.LOGOUT),
      this.authRepository.revokeSessionRefreshTokens(sessionId),
    ]);
  }

  async logoutWithRefreshToken(rawRefreshToken: string): Promise<void> {
    const tokenHash = this.tokenService.hashToken(rawRefreshToken);
    const storedToken = await this.authRepository.findRefreshTokenByHash(tokenHash);
    if (storedToken) {
      await Promise.all([
        this.sessionService.revokeSession(storedToken.sessionId, storedToken.userId, SessionRevokedReason.LOGOUT),
        this.authRepository.revokeSessionRefreshTokens(storedToken.sessionId),
      ]);
    }
  }

  async logoutAll(userId: string, currentSessionId: string): Promise<void> {
    await Promise.all([
      this.sessionService.revokeAllSessionsExcept(
        userId,
        currentSessionId,
        SessionRevokedReason.GLOBAL_LOGOUT,
      ),
      this.authRepository.revokeOtherSessionRefreshTokens(userId, currentSessionId),
    ]);
  }

  async logoutAllWithRefreshToken(rawRefreshToken: string): Promise<void> {
    const tokenHash = this.tokenService.hashToken(rawRefreshToken);
    const storedToken = await this.authRepository.findRefreshTokenByHash(tokenHash);
    if (storedToken) {
      await Promise.all([
        this.sessionService.revokeAllSessions(storedToken.userId, SessionRevokedReason.GLOBAL_LOGOUT),
        this.authRepository.revokeAllUserRefreshTokens(storedToken.userId),
      ]);
    }
  }

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    await this.sessionService.revokeSession(sessionId, userId, SessionRevokedReason.ADMIN_FORCED);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // REFRESH TOKEN ROTATION
  // ─────────────────────────────────────────────────────────────────────────────

  async refreshTokens(
    rawRefreshToken: string,
  ): Promise<{ response: TokenRefreshResponseDto; rawRefreshToken: string }> {
    const tokenHash = this.tokenService.hashToken(rawRefreshToken);
    const storedToken = await this.authRepository.findRefreshTokenByHash(tokenHash);

    if (!storedToken) throw new InvalidCredentialsException();

    if (storedToken.status !== 'ACTIVE') {
      await this.authRepository.revokeTokenFamily(storedToken.familyId);
      throw new InvalidCredentialsException();
    }

    if (storedToken.expiresAt < new Date()) {
      await this.authRepository.markRefreshTokenUsed(storedToken.id);
      throw new InvalidCredentialsException();
    }

    await this.authRepository.markRefreshTokenUsed(storedToken.id);

    const user = await this.authRepository.findUserById(storedToken.userId);
    if (!user || !user.isActive || user.deletedAt) throw new InvalidCredentialsException();

    const roles = user.userRoles.map((ur) => ur.role.name);
    const permissions = Array.from(
      new Map(
        user.userRoles.flatMap(ur =>
          ur.role.rolePermissions.map(rp => [
            `${rp.permission.action}:${rp.permission.subject}`,
            { action: rp.permission.action, subject: rp.permission.subject }
          ])
        )
      ).values()
    );
    const accessToken = await this.tokenService.signAccessToken({
      sub: user.id,
      sid: storedToken.sessionId,
      organizationId: user.organizationId,
      roles,
    });

    const newRawRefreshToken = await this.tokenService.createAndPersistRefreshToken(
      storedToken.sessionId,
      user.id,
      storedToken.familyId,
    );

    await this.sessionService.touch(storedToken.sessionId);

    return {
      response: { accessToken, refreshToken: newRawRefreshToken, message: 'Token refreshed successfully.' },
      rawRefreshToken: newRawRefreshToken,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PASSWORD MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────────

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.authRepository.findUserById(userId);
    if (!user) throw new NotFoundException('User not found.');

    const isValid = await this.passwordService.verify(user.passwordHash, dto.oldPassword);
    if (!isValid) throw new InvalidCurrentPasswordException();

    if (await this.passwordService.isReused(userId, dto.newPassword)) {
      throw new PasswordReusedException();
    }

    const newHash = await this.passwordService.hash(dto.newPassword);

    await Promise.all([
      this.authRepository.updateUserPassword(userId, newHash),
      this.passwordService.saveToHistory(userId, newHash),
      this.sessionService.revokeAllSessions(userId, SessionRevokedReason.PASSWORD_CHANGE),
      this.authRepository.revokeAllUserRefreshTokens(userId),
    ]);
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<MessageResponseDto> {
    const normalized = dto.email.toLowerCase().trim();
    const user = await this.authRepository.findUserByEmailNormalized(normalized);

    let resetLink = '';
    if (user && user.isActive) {
      const { rawToken, tokenHash } = this.tokenService.createEmailToken();
      await this.authRepository.invalidatePasswordResetTokens(user.id);
      await this.authRepository.createPasswordResetToken({
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
        requestedIp: null,
      });
      // TODO: emit event → email service sends the reset link with the raw token
      // For development, we'll return the token link directly in the message
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      resetLink = `${frontendUrl}/reset-password?token=${rawToken}`;
    }

    return {
      success: true,
      message: resetLink ? `Development Mode: Use this link to reset password: ${resetLink}` : 'If an account with that email exists, a password reset link has been sent.',
    };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const tokenHash = this.tokenService.hashToken(dto.token);
    const record = await this.authRepository.findPasswordResetToken(tokenHash);

    if (!record || record.expiresAt < new Date() || record.usedAt) {
      throw new InvalidTokenException();
    }

    if (await this.passwordService.isReused(record.userId, dto.newPassword)) {
      throw new PasswordReusedException();
    }

    const newHash = await this.passwordService.hash(dto.newPassword);

    await Promise.all([
      this.authRepository.updateUserPassword(record.userId, newHash),
      this.authRepository.markPasswordResetTokenUsed(record.id),
      this.authRepository.markEmailVerified(record.userId), // Automatically verify email when resetting/setting password via token
      this.passwordService.saveToHistory(record.userId, newHash),
      this.sessionService.revokeAllSessions(record.userId, SessionRevokedReason.PASSWORD_RESET),
      this.authRepository.revokeAllUserRefreshTokens(record.userId),
    ]);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // EMAIL VERIFICATION
  // ─────────────────────────────────────────────────────────────────────────────

  async verifyEmail(token: string): Promise<void> {
    const tokenHash = this.tokenService.hashToken(token);
    const record = await this.authRepository.findEmailVerificationToken(tokenHash);

    if (!record || record.expiresAt < new Date() || record.usedAt) {
      throw new InvalidTokenException();
    }

    await Promise.all([
      this.authRepository.markEmailVerified(record.userId),
      this.authRepository.markEmailVerificationTokenUsed(record.id),
    ]);
  }

  async resendVerificationEmail(userId: string): Promise<MessageResponseDto> {
    const user = await this.authRepository.findUserById(userId);
    if (!user) throw new NotFoundException('User not found.');

    const { tokenHash } = this.tokenService.createEmailToken();
    await this.authRepository.invalidateEmailVerificationTokens(userId);
    await this.authRepository.createEmailVerificationToken({
      userId,
      tokenHash,
      expiresAt: new Date(Date.now() + VERIFY_TOKEN_TTL_MS),
    });
    // TODO: emit event → email service sends the verification link

    return { success: true, message: 'Verification email sent.' };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SESSIONS & PROFILE
  // ─────────────────────────────────────────────────────────────────────────────

  async getActiveSessions(
    userId: string,
    currentSessionId: string,
  ): Promise<ActiveSessionDto[]> {
    const sessions = await this.sessionService.getActiveSessions(userId);
    return sessions.map((s) => ({
      id: s.id,
      deviceName: s.deviceName ?? null,
      ipAddress: s.ipAddress ?? null,
      userAgent: s.userAgent ?? null,
      createdAt: s.createdAt,
      lastActiveAt: s.lastActiveAt,
      isCurrent: s.id === currentSessionId,
    }));
  }

  async getProfile(userId: string): Promise<UserProfileDto> {
    const user = await this.authRepository.findUserById(userId);
    if (!user) throw new NotFoundException('User not found.');

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName ?? null,
      organizationId: user.organizationId,
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
      isEmailVerified: user.emailVerified,
      createdAt: user.createdAt,
      technicianProfile: (user as any).technicianProfile || null,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ADMIN
  // ─────────────────────────────────────────────────────────────────────────────

  async adminRevokeUserSessions(userId: string): Promise<void> {
    await Promise.all([
      this.sessionService.revokeAllSessions(userId, SessionRevokedReason.ADMIN_FORCED),
      this.authRepository.revokeAllUserRefreshTokens(userId),
    ]);
  }
}


