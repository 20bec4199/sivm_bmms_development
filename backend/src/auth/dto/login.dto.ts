import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Payload accepted by POST /auth/login.
 * Used by passport-local strategy which reads email and password from req.body.
 */
export class LoginDto {
  @ApiProperty({ example: 'admin@building.com', description: 'Registered email address' })
  @IsEmail({}, { message: 'Enter a valid email address' })
  @IsNotEmpty()
  @MaxLength(255)
  @Transform(({ value }) => (value as string).toLowerCase().trim())
  email: string;

  @ApiProperty({ example: 'MySecureP@ss1', description: 'Account password (min 8 chars)' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(128)
  password: string;
}
