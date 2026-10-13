import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateOrganizationDto {
  @ApiProperty({ example: 'Acme Corp', description: 'Organization Name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'Real Estate', description: 'Industry' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  industry?: string;

  @ApiPropertyOptional({ example: '1-10', description: 'Company Size' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  size?: string;

  @ApiPropertyOptional({ type: [String], description: 'Selected Modules' })
  @IsOptional()
  modules?: string[];

  @ApiPropertyOptional({ type: [String], description: 'Selected Property Categories' })
  @IsOptional()
  propertyCategories?: string[];
}
