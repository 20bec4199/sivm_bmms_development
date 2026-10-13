import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/** Query param DTO for GET /auth/verify-email?token=... */
export class VerifyEmailDto {
  @ApiProperty({
    example: 'a3f8b1c2...64hexchars',
    description: 'Opaque verification token from the email link',
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}
