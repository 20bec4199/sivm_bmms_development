import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsNotEmpty, 
  IsOptional, 
  IsString, 
  MaxLength, 
  IsEmail, 
  IsArray, 
  ValidateNested 
} from 'class-validator';
import { Type } from 'class-transformer';

export class AdminUserDto {
  @ApiProperty({ example: 'John', description: 'Admin First Name' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiPropertyOptional({ example: 'Doe', description: 'Admin Last Name' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({ example: 'admin@acme.com', description: 'Admin Email Address' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({ example: '+1234567890', description: 'Admin Phone Number' })
  @IsString()
  @IsOptional()
  phone?: string;
}

export class CreateOrganizationDto {
  @ApiProperty({ example: 'Acme Corp', description: 'Organization Name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @ApiPropertyOptional({ example: 'ACME-CORP', description: 'Unique Organization Code/Slug' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  code?: string;

  @ApiPropertyOptional({ example: 'Commercial Real Estate', description: 'Organization / Property Type' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  type?: string;

  @ApiPropertyOptional({ example: 'contact@acmecorp.com', description: 'Primary Contact Email' })
  @IsEmail()
  @IsOptional()
  contactEmail?: string;

  @ApiPropertyOptional({ example: '+1 (555) 019-2834', description: 'Primary Contact Phone' })
  @IsString()
  @IsOptional()
  contactPhone?: string;

  @ApiPropertyOptional({ example: '100 Innovation Way, Suite 400, New York, NY 10001', description: 'Primary Contact Address' })
  @IsString()
  @IsOptional()
  contactAddress?: string;

  @ApiPropertyOptional({ example: 'Real Estate', description: 'Industry' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  industry?: string;

  @ApiPropertyOptional({ example: '50-200', description: 'Company Size' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  size?: string;

  @ApiPropertyOptional({ example: 'Enterprise', description: 'Subscription Plan Tier' })
  @IsString()
  @IsOptional()
  subscriptionPlan?: string;

  @ApiPropertyOptional({ type: [String], description: 'List of module master codes to enable' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  modules?: string[];

  @ApiPropertyOptional({ type: [String], description: 'List of property category codes to enable' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  propertyCategories?: string[];

  @ApiPropertyOptional({ type: AdminUserDto, description: 'Initial Primary Administrator details' })
  @IsOptional()
  @ValidateNested()
  @Type(() => AdminUserDto)
  admin?: AdminUserDto;
}
