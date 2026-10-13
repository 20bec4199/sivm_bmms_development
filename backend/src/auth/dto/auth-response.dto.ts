import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ─── Nested DTOs ─────────────────────────────────────────────────────────────

/** User profile returned in auth responses — never includes passwordHash */
export class UserProfileDto {
  @ApiProperty({ example: 'usr_01J4XY...' })
  id: string;

  @ApiProperty({ example: 'john.doe@building.com' })
  email: string;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiPropertyOptional({ example: 'Doe' })
  lastName?: string | null;

  @ApiProperty({ example: 'org_01J4XW...' })
  organizationId: string;

  @ApiProperty({ type: [String], example: ['RESIDENT'] })
  roles: string[];

  @ApiProperty({ type: [String], example: ['PROPERTY_MANAGEMENT'] })
  organizationModules: string[];

  @ApiProperty({ type: [String], example: ['RESIDENTIAL', 'COMMERCIAL'] })
  organizationPropertyCategories: string[];

  @ApiProperty({ type: 'array', items: { type: 'object', properties: { action: { type: 'string' }, subject: { type: 'string' } } }, example: [{ action: 'CREATE', subject: 'Complaint' }] })
  permissions: { action: string; subject: string }[];

  @ApiProperty({ example: false })
  isEmailVerified: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  technicianProfile?: any;
}

// ─── Response DTOs ───────────────────────────────────────────────────────────

/**
 * Returned by POST /auth/login and POST /auth/register.
 * accessToken is in the response body (short-lived, kept in JS memory).
 * refreshToken is set as an HttpOnly cookie and optionally returned in the body.
 */
export class LoginResponseDto {
  @ApiProperty({ description: 'Short-lived JWT access token (15 min). Store in memory, not localStorage.' })
  accessToken: string;

  @ApiProperty({ description: 'Long-lived refresh token (also set as HttpOnly cookie)' })
  refreshToken: string;

  @ApiProperty()
  user: UserProfileDto;
}

/**
 * Returned by POST /auth/refresh.
 * New accessToken in body; new refreshToken replaces the cookie and is optionally returned in the body.
 */
export class TokenRefreshResponseDto {
  @ApiProperty({ description: 'New access token after refresh token rotation' })
  accessToken: string;

  @ApiProperty({ description: 'New refresh token (also set as HttpOnly cookie)' })
  refreshToken: string;

  @ApiProperty({ example: 'Tokens refreshed successfully' })
  message: string;
}

/** Generic success/message response */
export class MessageResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Operation completed successfully.' })
  message: string;
}

/** A single active session record returned by GET /auth/sessions */
export class ActiveSessionDto {
  @ApiProperty({ example: 'ses_01J4XZ...' })
  id: string;

  @ApiPropertyOptional({ example: 'Chrome Browser' })
  deviceName: string | null;

  @ApiPropertyOptional({ example: '192.168.1.1' })
  ipAddress: string | null;

  @ApiPropertyOptional({ example: 'Mozilla/5.0 ...' })
  userAgent: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  lastActiveAt: Date;

  @ApiProperty({ description: 'True when this session matches the current request' })
  isCurrent: boolean;
}
