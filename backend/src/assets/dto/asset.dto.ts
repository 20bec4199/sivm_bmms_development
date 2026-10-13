import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, IsNumber, IsDateString, IsInt, Min, IsEnum } from 'class-validator';
import { AssetStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateAssetDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  categoryName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  tagNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  locationNotes?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  serialNumber?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  purchaseDate?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  purchasePrice?: number;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  warrantyExpiry?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  warrantyDetails?: string;

  @ApiPropertyOptional()
  @IsInt()
  @Min(1)
  @IsOptional()
  expectedLifespanYears?: number;

  @ApiPropertyOptional()
  @IsOptional()
  status?: any;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  location?: string;
}

export class UpdateAssetDto extends PartialType(CreateAssetDto) {}

export class AssetQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ enum: AssetStatus })
  @IsOptional()
  @IsEnum(AssetStatus)
  status?: AssetStatus;

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
