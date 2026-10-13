import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsEnum, IsUUID, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { Priority, AlertType, AlertAudience } from '@prisma/client';

export class CreateAlertDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({ enum: AlertType })
  @IsEnum(AlertType)
  @IsOptional()
  type?: AlertType;

  @ApiPropertyOptional({ enum: Priority })
  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @ApiPropertyOptional({ enum: AlertAudience })
  @IsEnum(AlertAudience)
  @IsOptional()
  audience?: AlertAudience;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  targetNodeId?: string;
}

export class AlertQueryDto {
  @ApiPropertyOptional({ enum: AlertType })
  @IsEnum(AlertType)
  @IsOptional()
  type?: AlertType;

  @ApiPropertyOptional({ enum: AlertAudience })
  @IsEnum(AlertAudience)
  @IsOptional()
  audience?: AlertAudience;

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
