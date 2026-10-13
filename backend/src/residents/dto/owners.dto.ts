import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID, IsInt, Min, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOwnerDto {
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

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  moveInDate?: string;
}

export class UpdateOwnerDto extends PartialType(CreateOwnerDto) {}

export class OwnerQueryDto {
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
