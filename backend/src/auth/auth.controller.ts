import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { InviteAdminDto } from './dto/invite-admin.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { RequirePermissions } from './decorators/permissions.decorator';
import type { AuthenticatedRequest, AuthenticatedUser } from './interfaces/authenticated-request.interface';
import {
  COOKIE_REFRESH_TOKEN,
  COOKIE_ACCESS_TOKEN,
  REFRESH_TOKEN_TTL_DAYS,
  ACCESS_TOKEN_TTL_SECONDS,
} from './constants/auth.constants';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // Cookie helper
  // ─────────────────────────────────────────────────────────────────────────────

  private setRefreshCookie(res: Response, rawRefreshToken: string): void {
    const secure = this.configService.get<boolean>('auth.cookie.secure') ?? false;
    const sameSite = this.configService.get<'lax' | 'strict' | 'none'>('auth.cookie.sameSite') ?? 'lax';

    res.cookie(COOKIE_REFRESH_TOKEN, rawRefreshToken, {
      httpOnly: true,
      secure,
      sameSite,
      path: '/auth/refresh', // refresh token is ONLY sent to the rotation endpoint
      maxAge: REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
    });
  }

  private clearAuthCookies(res: Response): void {
    const secure = this.configService.get<boolean>('auth.cookie.secure') ?? false;
    const sameSite = this.configService.get<'lax' | 'strict' | 'none'>('auth.cookie.sameSite') ?? 'lax';

    res.clearCookie(COOKIE_ACCESS_TOKEN);
    res.clearCookie(COOKIE_REFRESH_TOKEN, { 
      path: '/auth/refresh',
      secure,
      sameSite,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // LOGIN
  // ─────────────────────────────────────────────────────────────────────────────

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful — access token in body, refresh token in HttpOnly cookie' })
  @ApiResponse({ status: 401, description: 'Invalid credentials / account locked' })
  async login(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: any,
  ) {
    const ip = req.ip ?? null;
    const ua = req.headers['user-agent'] ?? null;
    const { response, rawRefreshToken } = await this.authService.login(
      req.user,
      ip,
      ua,
    );
    this.setRefreshCookie(res, rawRefreshToken);
    return response;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // REGISTER
  // ─────────────────────────────────────────────────────────────────────────────

  @UseGuards(PermissionsGuard)
  @RequirePermissions({ action: 'CREATE', subject: 'Organization' })
  @Post('organization')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new organization' })
  @ApiResponse({ status: 201, description: 'Organization created successfully' })
  async createOrganization(
    @Body() dto: CreateOrganizationDto,
  ) {
    return this.authService.createOrganization(dto);
  }

  @UseGuards(PermissionsGuard)
  @RequirePermissions({ action: 'CREATE', subject: 'OrganizationAdmin' })
  @Post('invite-admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Invite a new Organization Admin' })
  @ApiResponse({ status: 201, description: 'Admin invited successfully' })
  async inviteAdmin(
    @Body() dto: InviteAdminDto,
  ) {
    return this.authService.inviteAdmin(dto);
  }

  @UseGuards(PermissionsGuard)
  @RequirePermissions({ action: 'CREATE', subject: 'OrganizationAdmin' })
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new Organization Admin' })
  @ApiResponse({ status: 201, description: 'Registration successful' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async register(
    @Body() dto: RegisterDto,
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: any,
  ) {
    const ip = req.ip ?? null;
    const ua = req.headers['user-agent'] ?? null;
    const { response, rawRefreshToken } = await this.authService.register(dto, ip, ua);
    this.setRefreshCookie(res, rawRefreshToken);
    return response;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // REFRESH TOKEN ROTATION
  // ─────────────────────────────────────────────────────────────────────────────

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth(COOKIE_REFRESH_TOKEN)
  @ApiOperation({ summary: 'Rotate refresh token and issue a new access token' })
  @ApiResponse({ status: 200, description: 'New access token and refresh token returned, or success: false if no token' })
  async refresh(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: any,
    @Body() dto: RefreshTokenDto,
  ) {
    const rawRefreshToken: string | undefined =
      (req as any).cookies?.[COOKIE_REFRESH_TOKEN] ?? dto.refreshToken;

    if (!rawRefreshToken) {
      // Instead of 401, return 200 with success: false to prevent browser console errors
      // when AuthInitializer runs on page load for unauthenticated users.
      return { success: false, message: 'Refresh token not found.' };
    }
    try {
      const { response, rawRefreshToken: newRaw } = await this.authService.refreshTokens(rawRefreshToken);
      this.setRefreshCookie(res, newRaw);
      return response;
    } catch (error) {
      this.clearAuthCookies(res);
      // We also return 200 success: false here for the same reason.
      return { success: false, message: 'Invalid or expired refresh token.' };
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // LOGOUT
  // ─────────────────────────────────────────────────────────────────────────────

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout from current device' })
  async logout(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: any,
    @Body() dto: RefreshTokenDto,
  ) {
    const rawRefreshToken: string | undefined =
      (req as any).cookies?.[COOKIE_REFRESH_TOKEN] ?? dto.refreshToken;

    if (rawRefreshToken) {
      await this.authService.logoutWithRefreshToken(rawRefreshToken);
    } else if (req.user) {
      await this.authService.logout(req.user.id, req.user.sid);
    }
    
    this.clearAuthCookies(res);
    return { success: true, message: 'Logged out successfully.' };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PROFILE
  // ─────────────────────────────────────────────────────────────────────────────

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@CurrentUser('id') userId: string) {
    return this.authService.getProfile(userId);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // EMAIL VERIFICATION
  // ─────────────────────────────────────────────────────────────────────────────

  @Public()
  @Get('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email address with token from email link' })
  async verifyEmail(@Query('token') token: string) {
    await this.authService.verifyEmail(token);
    return { success: true, message: 'Email verified successfully.' };
  }

  @Post('verify-email/resend')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resend email verification link' })
  async resendVerificationEmail(@CurrentUser('id') userId: string) {
    return this.authService.resendVerificationEmail(userId);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PASSWORD MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────────

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a password reset email' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using the token from the email link' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto);
    return { success: true, message: 'Password reset successfully. Please log in again.' };
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password (authenticated user)' })
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.authService.changePassword(userId, dto);
    return { success: true, message: 'Password changed. All sessions have been revoked.' };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SESSION MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────────

  @Get('sessions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all active sessions' })
  async getSessions(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getActiveSessions(user.id, user.sid);
  }

  @Public()
  @Delete('sessions')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout from all devices (or all OTHER devices)' })
  async logoutAll(
    @Req() req: AuthenticatedRequest,
    @Body() dto: RefreshTokenDto,
  ) {
    const rawRefreshToken: string | undefined =
      (req as any).cookies?.[COOKIE_REFRESH_TOKEN] ?? dto.refreshToken;

    if (rawRefreshToken) {
      // With a refresh token, we can just revoke all sessions and tokens.
      await this.authService.logoutAllWithRefreshToken(rawRefreshToken);
    } else if (req.user) {
      // If only access token is provided, log out of all OTHER devices.
      await this.authService.logoutAll(req.user.id, req.user.sid);
    }
    
    return { success: true, message: 'All requested sessions have been revoked.' };
  }

  @Delete('sessions/:sessionId')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke a specific session' })
  async revokeSession(
    @CurrentUser('id') userId: string,
    @Param('sessionId') sessionId: string,
  ) {
    await this.authService.revokeSession(userId, sessionId);
    return { success: true, message: 'Session revoked.' };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ADMIN
  // ─────────────────────────────────────────────────────────────────────────────

  @Delete('admin/users/:userId/sessions')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(PermissionsGuard)
  @RequirePermissions({ action: 'DELETE', subject: 'User' })
  @ApiOperation({ summary: '[Admin] Revoke all sessions for a user' })
  async adminRevokeUserSessions(@Param('userId') userId: string) {
    await this.authService.adminRevokeUserSessions(userId);
    return { success: true, message: 'All sessions for the user have been revoked.' };
  }
}

