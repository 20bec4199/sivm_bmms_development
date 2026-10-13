import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiPropertyOptional({
    description: 'Refresh token. Usually sent via HttpOnly cookie, but can be sent in body if required by client.',
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
