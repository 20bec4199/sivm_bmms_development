import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class CreateSecurityPostDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ description: 'Organization-defined post type, e.g. Main Gate or Parking Patrol' })
  @IsString()
  @MinLength(2)
  postType: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ type: [String], description: 'Configurable duties for this post' })
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @IsOptional()
  duties?: string[];

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  propertyNodeId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  parkingAreaId?: string;
}

export class UpdateSecurityPostDto extends PartialType(CreateSecurityPostDto) {
  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CreateSecurityPostAssignmentDto {
  @ApiProperty()
  @IsUUID()
  guardId: string;

  @ApiPropertyOptional({ default: 'General' })
  @IsString()
  @IsOptional()
  shiftName?: string;

  @ApiPropertyOptional({ description: 'Assignment start time' })
  @IsDateString()
  @IsOptional()
  startsAt?: string;

  @ApiPropertyOptional({ description: 'Assignment end time' })
  @IsDateString()
  @IsOptional()
  endsAt?: string;

  @ApiPropertyOptional({ type: [String], description: 'Optional weekday names, e.g. MONDAY' })
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @IsOptional()
  daysOfWeek?: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateSecurityPostAssignmentDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  shiftName?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  startsAt?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  endsAt?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @IsOptional()
  daysOfWeek?: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}