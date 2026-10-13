import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsUUID, IsDateString, IsInt, Min, IsEnum, IsNumber, IsBoolean, IsString } from 'class-validator';
import { BookingStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateBookingDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  facilityId: string;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  endTime: string;

  @ApiPropertyOptional()
  @IsInt()
  @Min(1)
  @IsOptional()
  attendeeCount?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  purpose?: string;

  @ApiPropertyOptional()
  @IsOptional()
  customFieldValues?: any;

  @ApiPropertyOptional()
  @IsOptional()
  pricingBreakdown?: any;
}

export class UpdateBookingDto {
  @ApiPropertyOptional({ enum: BookingStatus })
  @IsEnum(BookingStatus)
  @IsOptional()
  status?: BookingStatus;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  depositAmount?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  depositPaid?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  depositReturned?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  rejectionReason?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

export class BookingQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  facilityId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ enum: BookingStatus })
  @IsEnum(BookingStatus)
  @IsOptional()
  status?: BookingStatus;

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

export class VerifyBookingQrDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  qrData: string;
}
