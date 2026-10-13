import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID, IsInt, Min, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTenantDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  propertyNodeId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  leaseStart?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  leaseEnd?: string;
}

export class UpdateTenantDto extends PartialType(CreateTenantDto) {}

export class TenantQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  propertyNodeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number = 0;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  take?: number = 10;
}
