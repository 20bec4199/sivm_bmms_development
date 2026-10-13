import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

/**
 * Serialisable User entity for API responses.
 *
 * Uses class-transformer's @Exclude() + @Expose() pattern so that
 * `passwordHash` and other internal fields are never accidentally
 * serialised by a controller using `ClassSerializerInterceptor`.
 *
 * Usage in controller:
 *   @UseInterceptors(ClassSerializerInterceptor)
 *   return new UserEntity(prismaUser);
 */
@Exclude()
export class UserEntity {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  email: string;

  @Expose()
  @ApiProperty()
  firstName: string;

  @Expose()
  @ApiPropertyOptional()
  lastName?: string | null;

  @Expose()
  @ApiPropertyOptional()
  phone?: string | null;

  @Expose()
  @ApiProperty()
  organizationId: string;

  @Expose()
  @ApiProperty()
  isActive: boolean;

  @Expose()
  @ApiProperty()
  emailVerified: boolean;

  @Expose()
  @ApiPropertyOptional()
  emailVerifiedAt?: Date | null;

  @Expose()
  @ApiProperty()
  createdAt: Date;

  @Expose()
  @ApiProperty()
  updatedAt: Date;

  // ── Never exposed ──
  passwordHash: string;
  failedLoginCount: number;
  lockedUntil: Date | null;
  isPermanentlyLocked: boolean;
  deletedAt: Date | null;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}
