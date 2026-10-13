import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class InviteAdminDto {
  @ApiProperty({ example: 'admin@acme.com', description: 'Admin Email' })
  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }) => (value as string).toLowerCase().trim())
  email: string;

  @ApiProperty({ example: 'John', description: 'First name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @ApiPropertyOptional({ example: 'Doe', description: 'Last name' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  lastName?: string;

  @ApiProperty({ example: 'uuid', description: 'Organization ID' })
  @IsString()
  @IsNotEmpty()
  orgId: string;
}
