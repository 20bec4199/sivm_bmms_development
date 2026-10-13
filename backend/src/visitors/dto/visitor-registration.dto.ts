import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, IsDateString, IsInt, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export const VisitorPurposes = ['VISITOR', 'CONTRACTOR', 'DELIVERY'] as const;

export class CreateRegistrationDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  visitorId: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  propertyNodeId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  unitId?: string;

  @ApiProperty({ enum: VisitorPurposes })
  @IsIn(VisitorPurposes)
  @IsNotEmpty()
  purpose: string;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  expectedArrival: string;

  @ApiPropertyOptional()
  @IsOptional()
  requiresParking?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  vehiclePlate?: string;
}

export class RegistrationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  propertyNodeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  unitId?: string;

  @ApiPropertyOptional({ enum: VisitorPurposes })
  @IsOptional()
  @IsIn(VisitorPurposes)
  purpose?: string;

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

export class CheckInDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CheckOutDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

export class VerifyQrDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  qrData: string;
}
