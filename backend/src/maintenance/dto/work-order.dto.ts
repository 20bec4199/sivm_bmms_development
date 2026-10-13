import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, IsEnum, IsDateString, IsInt, Min } from 'class-validator';
import { WorkOrderStatus, Priority } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateWorkOrderDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  planId?: string;

  @ApiPropertyOptional({ enum: Priority })
  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  assignedToId?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  woNumber?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  complaintId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  propertyNodeId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  residentId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  assetId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  facilityBookingId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  estimatedHours?: number;
}

export class UpdateWorkOrderDto extends PartialType(CreateWorkOrderDto) {
  @ApiPropertyOptional({ enum: WorkOrderStatus })
  @IsEnum(WorkOrderStatus)
  @IsOptional()
  status?: WorkOrderStatus;

  @ApiPropertyOptional()
  @IsOptional()
  actualHours?: number;

  @ApiPropertyOptional()
  @IsOptional()
  beforePhotos?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  afterPhotos?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  materialsUsed?: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  remarks?: string;
}

export class AddHistoryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  notes: string;
}

export class WorkOrderQueryDto {
  @ApiPropertyOptional({ enum: WorkOrderStatus })
  @IsEnum(WorkOrderStatus)
  @IsOptional()
  status?: WorkOrderStatus;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  assignedToId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  skip?: number = 0;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  take?: number = 10;
}
