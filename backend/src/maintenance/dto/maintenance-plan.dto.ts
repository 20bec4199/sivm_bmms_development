import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsDateString, IsArray, ValidateNested, IsBoolean, IsNumber, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class ChecklistItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  id?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  taskName: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  instructions?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  sequence?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  taskCategory?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  taskType?: string;

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  options?: string[];

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isMandatory?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  photoRequired?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  signatureRequired?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  supervisorSignoff?: boolean;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  estimatedDurationMinutes?: number;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  config?: Record<string, any>;
}

export class CreateMaintenancePlanDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  planCode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  maintenanceType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  priority?: any;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  frequency: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  nextDueDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  buildingId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  towerId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  floorId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  unitId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  locationScope?: string;

  @ApiPropertyOptional()
  @IsOptional()
  spatialNodes?: any;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  locationName?: string;

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  facilityIds?: string[];

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  assetIds?: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  targetAssetCategory?: string;

  @ApiPropertyOptional()
  @IsOptional()
  scheduleConfig?: any;

  @ApiPropertyOptional()
  @IsOptional()
  assignmentConfig?: any;

  @ApiPropertyOptional()
  @IsOptional()
  blackoutConfig?: any;

  @ApiPropertyOptional()
  @IsOptional()
  lifecycleConfig?: any;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  complianceScore?: number;

  @ApiPropertyOptional()
  @IsOptional()
  complianceStats?: any;

  @ApiPropertyOptional({ type: [ChecklistItemDto] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ChecklistItemDto)
  checklists?: ChecklistItemDto[];
}

export class UpdateMaintenancePlanDto extends CreateMaintenancePlanDto {}
