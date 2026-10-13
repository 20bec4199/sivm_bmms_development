import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsInt, Min, IsNumber, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFacilityDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsInt()
  @Min(1)
  @IsOptional()
  capacity?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  hourlyRate?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  depositAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  rules?: string[];

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
  locationName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  facilityCode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  shortDescription?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  galleryUrls?: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  contactPerson?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  contactNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  bookingConfig?: any;

  @ApiPropertyOptional()
  @IsOptional()
  availabilitySchedule?: any;

  @ApiPropertyOptional()
  @IsOptional()
  eligibilityRules?: any;

  @ApiPropertyOptional()
  @IsOptional()
  approvalConfig?: any;

  @ApiPropertyOptional()
  @IsOptional()
  pricingConfig?: any;

  @ApiPropertyOptional()
  @IsOptional()
  cancellationRules?: any;

  @ApiPropertyOptional()
  @IsOptional()
  customFields?: any;

  @ApiPropertyOptional()
  @IsOptional()
  maintenanceBlocks?: any;

  @ApiPropertyOptional()
  @IsOptional()
  notificationConfig?: any;
}

export class UpdateFacilityDto extends PartialType(CreateFacilityDto) {
  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class FacilityQueryDto {
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
