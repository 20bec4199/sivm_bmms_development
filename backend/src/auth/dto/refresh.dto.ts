import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshDto {
  @ApiProperty({ example: 'your-refresh-token' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
