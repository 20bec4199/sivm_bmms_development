import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsEmail, IsArray, IsInt } from 'class-validator';

export class CreateTechnicianDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  departmentId?: string;

  // Profile specific fields
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  employeeId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  specialization?: string;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  experience?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  shift?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  joiningDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  emergencyContact?: string;

  @ApiPropertyOptional()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skills?: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  availability?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  workingHours?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  assignedTowers?: string[];

  @ApiPropertyOptional()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  assignedBuildings?: string[];
}

export class UpdateTechnicianDto extends PartialType(CreateTechnicianDto) {}
