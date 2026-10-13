import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsInt, IsOptional, IsEnum, IsNumber, IsUUID } from 'class-validator';
import { UnitType, UnitStatus } from '@prisma/client';

export class CreateUnitDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  buildingId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  towerId?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  unitNumber: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  floorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  sizeSqft?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ enum: UnitType })
  @IsOptional()
  @IsEnum(UnitType)
  type?: UnitType;

  @ApiPropertyOptional({ enum: UnitStatus })
  @IsOptional()
  @IsEnum(UnitStatus)
  status?: UnitStatus;
}
